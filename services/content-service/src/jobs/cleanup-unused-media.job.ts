import { CronJob } from 'cron';
import { PrismaClient } from '@prisma/client';
import {
  S3Client,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  ListObjectsV2CommandOutput,
} from '@aws-sdk/client-s3';
import { createLogger } from '../config/logger';
import { storageConfig } from '../config/storage';

const log = createLogger('CleanupUnusedMediaJob');



interface CleanupResult {
  scannedCount: number;
  orphanedCount: number;
  deletedCount: number;
  failedCount: number;
  reclaimedBytes: number;
  processedAt: string;
  durationMs: number;
}

interface OrphanedObject {
  key: string;
  sizeBytes: number;
  lastModified: Date;
}



export class CleanupUnusedMediaJob {
  /** Run at 02:00 UTC every Sunday. */
  private readonly cronExpression = '0 2 * * 0';
  private job: CronJob | null = null;
  private isRunning = false;

  /** Objects older than this are eligible for cleanup (avoids race conditions). */
  private readonly minAgeMs = 24 * 60 * 60 * 1_000;

  /** S3 batch delete limit. */
  private readonly deleteBatchSize = 1_000;

  private readonly s3: S3Client;

  constructor(private readonly prisma: PrismaClient) {
    this.s3 = new S3Client({
      region: storageConfig.s3.region,
      credentials: {
        accessKeyId: storageConfig.s3.accessKeyId,
        secretAccessKey: storageConfig.s3.secretAccessKey,
      },
    });
  }



  start(): void {
    this.job = new CronJob(
      this.cronExpression,
      () => void this.run(),
      null,
      true,
      'UTC',
    );

    log.info({ cron: this.cronExpression }, '[CleanupUnusedMediaJob] Scheduled');
  }

  stop(): void {
    this.job?.stop();
    log.info('[CleanupUnusedMediaJob] Stopped');
  }



  async run(dryRun = false): Promise<CleanupResult> {
    if (this.isRunning) {
      log.warn('[CleanupUnusedMediaJob] Already running — skipping this tick');
      return this.emptyResult();
    }

    this.isRunning = true;
    const startedAt = Date.now();
    const cutoffDate = new Date(Date.now() - this.minAgeMs);

    log.info({ dryRun, cutoff: cutoffDate.toISOString() }, '[CleanupUnusedMediaJob] Starting media cleanup');

    let scannedCount = 0;
    let deletedCount = 0;
    let failedCount = 0;
    let reclaimedBytes = 0;

    try {

      const s3Keys = await this.listAllS3Keys(cutoffDate);
      scannedCount = s3Keys.size;

      log.info({ scannedCount }, '[CleanupUnusedMediaJob] S3 objects scanned');


      const referencedKeys = await this.collectReferencedKeys();

      log.info({ referencedCount: referencedKeys.size }, '[CleanupUnusedMediaJob] DB-referenced keys collected');


      const orphans: OrphanedObject[] = [];
      for (const [key, obj] of s3Keys.entries()) {
        if (!referencedKeys.has(key)) {
          orphans.push(obj);
        }
      }

      log.info({ orphanedCount: orphans.length, dryRun }, '[CleanupUnusedMediaJob] Orphaned objects identified');

      if (dryRun) {
        log.info('[CleanupUnusedMediaJob] Dry-run mode — no objects deleted');
        return {
          scannedCount,
          orphanedCount: orphans.length,
          deletedCount: 0,
          failedCount: 0,
          reclaimedBytes: orphans.reduce((acc, o) => acc + o.sizeBytes, 0),
          processedAt: new Date().toISOString(),
          durationMs: Date.now() - startedAt,
        };
      }


      for (let i = 0; i < orphans.length; i += this.deleteBatchSize) {
        const batch = orphans.slice(i, i + this.deleteBatchSize);
        const { deleted, failed, bytes } = await this.deleteBatch(batch);
        deletedCount += deleted;
        failedCount += failed;
        reclaimedBytes += bytes;
      }


      await this.purgeOrphanedDbRecords();

      const result: CleanupResult = {
        scannedCount,
        orphanedCount: orphans.length,
        deletedCount,
        failedCount,
        reclaimedBytes,
        processedAt: new Date().toISOString(),
        durationMs: Date.now() - startedAt,
      };

      log.info(
        {
          ...result,
          reclaimedMB: (reclaimedBytes / 1024 / 1024).toFixed(2),
        },
        '[CleanupUnusedMediaJob] Cleanup completed',
      );

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log.error({ error: message, durationMs: Date.now() - startedAt }, '[CleanupUnusedMediaJob] Job failed');
      throw err;
    } finally {
      this.isRunning = false;
    }
  }



  private async listAllS3Keys(cutoffDate: Date): Promise<Map<string, OrphanedObject>> {
    const keys = new Map<string, OrphanedObject>();
    let continuationToken: string | undefined;

    do {
      const response: ListObjectsV2CommandOutput = await this.s3.send(
        new ListObjectsV2Command({
          Bucket: storageConfig.s3.bucket,
          Prefix: storageConfig.s3.uploadPrefix,
          ContinuationToken: continuationToken,
          MaxKeys: 1_000,
        }),
      );

      for (const obj of response.Contents ?? []) {
        if (!obj.Key || !obj.LastModified) continue;

        if (obj.LastModified > cutoffDate) continue;

        if (obj.Key === 'sitemap.xml' || obj.Key === 'robots.txt') continue;

        keys.set(obj.Key, {
          key: obj.Key,
          sizeBytes: obj.Size ?? 0,
          lastModified: obj.LastModified,
        });
      }

      continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
    } while (continuationToken);

    return keys;
  }



  private async collectReferencedKeys(): Promise<Set<string>> {
    const referenced = new Set<string>();

    
    const extractKey = (url: string | null): string | null => {
      if (!url) return null;
      try {
        const parsed = new URL(url);
        return parsed.pathname.replace(/^\//, '');
      } catch {
        return null;
      }
    };

    const addIfValid = (url: string | null) => {
      const key = extractKey(url);
      if (key) referenced.add(key);
    };

    
    

    
    const blogs = await (this.prisma as any).blog.findMany({
      where: { deletedAt: null },
      select: { heroImageUrl: true, images: true },
    });
    for (const b of blogs) {
      addIfValid(b.heroImageUrl);
      (b.images as string[]).forEach(addIfValid);
    }

    
    const pages = await (this.prisma as any).cmsPage.findMany({
      where: { deletedAt: null },
      select: { heroImageUrl: true, images: true },
    });
    for (const p of pages) {
      addIfValid(p.heroImageUrl);
      (p.images as string[]).forEach(addIfValid);
    }

    
    const mediaWall = await (this.prisma as any).mediaWall.findMany({
      where: { deletedAt: null },
      select: { imageUrl: true, videoUrl: true, backgroundImageUrl: true },
    });
    for (const m of mediaWall) {
      addIfValid(m.imageUrl);
      addIfValid(m.videoUrl);
      addIfValid(m.backgroundImageUrl);
    }

    
    const landings = await (this.prisma as any).landingPage.findMany({
      where: { deletedAt: null },
      select: { heroImageUrl: true, images: true },
    });
    for (const l of landings) {
      addIfValid(l.heroImageUrl);
      (l.images as string[]).forEach(addIfValid);
    }

    
    const products = await (this.prisma as any).product.findMany({
      where: { deletedAt: null },
      select: { images: true },
    });
    for (const p of products) {
      (p.images as string[]).forEach(addIfValid);
    }

    return referenced;
  }



  private async deleteBatch(
    objects: OrphanedObject[],
  ): Promise<{ deleted: number; failed: number; bytes: number }> {
    const response = await this.s3.send(
      new DeleteObjectsCommand({
        Bucket: storageConfig.s3.bucket,
        Delete: {
          Objects: objects.map((o) => ({ Key: o.key })),
          Quiet: false,
        },
      }),
    );

    const deleted = response.Deleted?.length ?? 0;
    const failed = response.Errors?.length ?? 0;
    const bytes = objects
      .filter((o) => response.Deleted?.some((d) => d.Key === o.key))
      .reduce((acc, o) => acc + o.sizeBytes, 0);

    if (failed > 0) {
      log.warn(
        { errors: response.Errors },
        '[CleanupUnusedMediaJob] Some objects failed to delete',
      );
    }

    log.debug({ deleted, failed, bytes }, '[CleanupUnusedMediaJob] Batch deleted');
    return { deleted, failed, bytes };
  }



  private async purgeOrphanedDbRecords(): Promise<void> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1_000);

    
    const { count } = await (this.prisma as any).media.deleteMany({
      where: {
        deletedAt: { lte: thirtyDaysAgo },
      },
    });

    if (count > 0) {
      log.info({ count }, '[CleanupUnusedMediaJob] Purged soft-deleted media records from DB');
    }
  }



  private emptyResult(): CleanupResult {
    return {
      scannedCount: 0,
      orphanedCount: 0,
      deletedCount: 0,
      failedCount: 0,
      reclaimedBytes: 0,
      processedAt: new Date().toISOString(),
      durationMs: 0,
    };
  }
}