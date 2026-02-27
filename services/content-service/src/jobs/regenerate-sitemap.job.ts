import { CronJob } from 'cron';
import { PrismaClient } from '@prisma/client';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createLogger } from '../config/logger';
import { storageConfig } from '../config';
import { env } from '../config/env';

const log = createLogger('RegenerateSitemapJob');

interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

interface SitemapResult {
  totalUrls: number;
  sizeBytes: number;
  rebuiltAt: string;
  s3Key: string;
}

interface CdnConfig {
  enabled: boolean;
  distributionId?: string;
  [key: string]: unknown;
}

interface SitemapEnv {
  SITEMAP_BASE_URL?: string;
  SITEMAP_S3_KEY: string;
}

const sitemapEnv = env as typeof env & SitemapEnv;

export class RegenerateSitemapJob {
  private readonly cronExpression = '0 3 * * *';
  private job: CronJob | null = null;
  private isRunning = false;
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
    log.info({ cron: this.cronExpression }, '[RegenerateSitemapJob] Scheduled');
  }

  stop(): void {
    this.job?.stop();
    log.info('[RegenerateSitemapJob] Stopped');
  }

  async run(triggeredBy = 'cron'): Promise<SitemapResult> {
    if (this.isRunning) {
      log.warn('[RegenerateSitemapJob] Already running — skipping this tick');
      return { totalUrls: 0, sizeBytes: 0, rebuiltAt: new Date().toISOString(), s3Key: '' };
    }

    this.isRunning = true;
    const startedAt = Date.now();
    log.info({ triggeredBy }, '[RegenerateSitemapJob] Starting sitemap regeneration');

    try {
      const urls = await this.collectUrls();
      const xml = this.buildSitemapXml(urls);
      const s3Key = await this.uploadToS3(xml);

      const cdn = storageConfig.cdn as unknown as CdnConfig;
      if (cdn.enabled && cdn.distributionId) {
        await this.invalidateCloudFrontCache(cdn.distributionId);
      }

      const result: SitemapResult = {
        totalUrls: urls.length,
        sizeBytes: Buffer.byteLength(xml, 'utf-8'),
        rebuiltAt: new Date().toISOString(),
        s3Key,
      };

      log.info(
        { ...result, durationMs: Date.now() - startedAt },
        '[RegenerateSitemapJob] Sitemap regenerated successfully',
      );

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log.error({ error: message, durationMs: Date.now() - startedAt }, '[RegenerateSitemapJob] Failed');
      throw err;
    } finally {
      this.isRunning = false;
    }
  }

  private async collectUrls(): Promise<SitemapUrl[]> {
    const baseUrl = sitemapEnv.SITEMAP_BASE_URL ?? 'https://lomashwood.com';
    const urls: SitemapUrl[] = [];

    const staticPages: Array<{ path: string; changefreq: SitemapUrl['changefreq']; priority: number }> = [
      { path: '/',                  changefreq: 'daily',   priority: 1.0 },
      { path: '/kitchens',          changefreq: 'daily',   priority: 0.9 },
      { path: '/bedrooms',          changefreq: 'daily',   priority: 0.9 },
      { path: '/sale',              changefreq: 'daily',   priority: 0.8 },
      { path: '/showrooms',         changefreq: 'weekly',  priority: 0.7 },
      { path: '/book-appointment',  changefreq: 'monthly', priority: 0.8 },
      { path: '/finance',           changefreq: 'monthly', priority: 0.7 },
      { path: '/brochure',          changefreq: 'monthly', priority: 0.6 },
      { path: '/inspiration',       changefreq: 'daily',   priority: 0.7 },
      { path: '/about',             changefreq: 'monthly', priority: 0.5 },
      { path: '/contact',           changefreq: 'monthly', priority: 0.5 },
      { path: '/why-choose-us',     changefreq: 'monthly', priority: 0.5 },
      { path: '/our-process',       changefreq: 'monthly', priority: 0.5 },
      { path: '/media-wall',        changefreq: 'weekly',  priority: 0.6 },
      { path: '/careers',           changefreq: 'weekly',  priority: 0.5 },
    ];

    for (const page of staticPages) {
      urls.push({
        loc: `${baseUrl}${page.path}`,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: page.changefreq,
        priority: page.priority,
      });
    }

    const blogs = await (this.prisma as any).blog.findMany({
      where: { status: 'PUBLISHED', deletedAt: null },
      select: { slug: true, updatedAt: true },
      orderBy: { publishedAt: 'desc' },
    });

    for (const blog of blogs) {
      urls.push({
        loc: `${baseUrl}/inspiration/${blog.slug}`,
        lastmod: (blog.updatedAt as Date).toISOString().split('T')[0],
        changefreq: 'weekly',
        priority: 0.6,
      });
    }

    const products = await (this.prisma as any).product.findMany({
      where: { isActive: true, deletedAt: null },
      select: { slug: true, category: true, updatedAt: true },
    });

    for (const product of products) {
      const categoryPath = product.category === 'KITCHEN' ? 'kitchens' : 'bedrooms';
      urls.push({
        loc: `${baseUrl}/${categoryPath}/${product.slug}`,
        lastmod: (product.updatedAt as Date).toISOString().split('T')[0],
        changefreq: 'weekly',
        priority: 0.8,
      });
    }

    const showrooms = await (this.prisma as any).showroom.findMany({
      where: { isActive: true, deletedAt: null },
      select: { slug: true, updatedAt: true },
    });

    for (const showroom of showrooms) {
      urls.push({
        loc: `${baseUrl}/showrooms/${showroom.slug}`,
        lastmod: (showroom.updatedAt as Date).toISOString().split('T')[0],
        changefreq: 'monthly',
        priority: 0.6,
      });
    }

    const pages = await (this.prisma as any).cmsPage.findMany({
      where: { status: 'PUBLISHED', isIndexable: true, deletedAt: null },
      select: { slug: true, updatedAt: true },
    });

    for (const page of pages) {
      urls.push({
        loc: `${baseUrl}/${page.slug}`,
        lastmod: (page.updatedAt as Date).toISOString().split('T')[0],
        changefreq: 'monthly',
        priority: 0.5,
      });
    }

    log.debug({ totalUrls: urls.length }, '[RegenerateSitemapJob] URLs collected');
    return urls;
  }

  private buildSitemapXml(urls: SitemapUrl[]): string {
    const urlEntries = urls
      .map(
        (u) =>
          `  <url>\n` +
          `    <loc>${this.escapeXml(u.loc)}</loc>\n` +
          `    <lastmod>${u.lastmod}</lastmod>\n` +
          `    <changefreq>${u.changefreq}</changefreq>\n` +
          `    <priority>${u.priority.toFixed(1)}</priority>\n` +
          `  </url>`,
      )
      .join('\n');

    return (
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      `${urlEntries}\n` +
      `</urlset>`
    );
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private async uploadToS3(xml: string): Promise<string> {
    const s3Key = sitemapEnv.SITEMAP_S3_KEY;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: storageConfig.s3.bucket,
        Key: s3Key,
        Body: xml,
        ContentType: 'application/xml',
        CacheControl: 'max-age=86400, public',
      }),
    );

    log.info({ bucket: storageConfig.s3.bucket, key: s3Key }, '[RegenerateSitemapJob] Uploaded to S3');
    return s3Key;
  }

  private async invalidateCloudFrontCache(distributionId: string): Promise<void> {
    log.info(
      { distributionId },
      '[RegenerateSitemapJob] CloudFront invalidation skipped — install @aws-sdk/client-cloudfront to enable.',
    );
  }
}