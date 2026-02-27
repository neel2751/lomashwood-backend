import fs from 'fs';
import path from 'path';

import { getPrismaClient } from '../infrastructure/db/prisma.client';
import { logger } from '../config/logger';
import { env } from '../config/env';

const ARCHIVE_DIR = path.join(env.EXPORT_TEMP_DIR, 'archives');
const ARCHIVE_AFTER_DAYS = 60;
const BATCH_SIZE = 1000;

export async function archiveHistoricalDataJob(): Promise<void> {
  const jobName = 'archive-historical-data';
  const start = Date.now();

  logger.info({ job: jobName }, 'Job started');

  try {
    await fs.promises.mkdir(ARCHIVE_DIR, { recursive: true });

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - ARCHIVE_AFTER_DAYS);

    const [archivedEvents, archivedFunnelResults, expiredExports] = await Promise.all([
      archiveAnalyticsEvents(cutoffDate),
      archiveFunnelResults(cutoffDate),
      cleanExpiredExports(),
    ]);

    logger.info(
      {
        job: jobName,
        cutoffDate: cutoffDate.toISOString(),
        archiveAfterDays: ARCHIVE_AFTER_DAYS,
        archived: {
          events: archivedEvents,
          funnelResults: archivedFunnelResults,
          expiredExports,
        },
        durationMs: Date.now() - start,
      },
      'Job completed',
    );
  } catch (error) {
    logger.error({ job: jobName, error, durationMs: Date.now() - start }, 'Job failed');
    throw error;
  }
}

async function archiveAnalyticsEvents(cutoffDate: Date): Promise<number> {
  const prisma = getPrismaClient();
  let totalArchived = 0;
  let hasMore = true;

  while (hasMore) {
    const batch = await (prisma as any).analyticsEvent.findMany({
      where: { createdAt: { lt: cutoffDate } },
      take: BATCH_SIZE,
      orderBy: { createdAt: 'asc' },
    });

    if (batch.length === 0) {
      hasMore = false;
      break;
    }

    const archiveDate = new Date().toISOString().split('T')[0];
    const archiveFile = path.join(ARCHIVE_DIR, `events_${archiveDate}_${Date.now()}.json`);

    await fs.promises.writeFile(archiveFile, JSON.stringify(batch, null, 2), 'utf-8');

    const ids = batch.map((e: { id: string }) => e.id);
    await (prisma as any).analyticsEvent.deleteMany({ where: { id: { in: ids } } });

    totalArchived += batch.length;

    if (batch.length < BATCH_SIZE) {
      hasMore = false;
    }
  }

  return totalArchived;
}

async function archiveFunnelResults(cutoffDate: Date): Promise<number> {
  const prisma = getPrismaClient();

  const oldResults = await (prisma as any).funnelResult.findMany({
    where: { computedAt: { lt: cutoffDate } },
    orderBy: { computedAt: 'asc' },
  });

  if (oldResults.length === 0) {
    return 0;
  }

  const archiveDate = new Date().toISOString().split('T')[0];
  const archiveFile = path.join(ARCHIVE_DIR, `funnel_results_${archiveDate}.json`);

  await fs.promises.writeFile(archiveFile, JSON.stringify(oldResults, null, 2), 'utf-8');

  const ids = oldResults.map((r: { id: string }) => r.id);
  await (prisma as any).funnelResult.deleteMany({ where: { id: { in: ids } } });

  return oldResults.length;
}

async function cleanExpiredExports(): Promise<number> {
  const prisma = getPrismaClient();

  const expiredExports = await (prisma as any).export.findMany({
    where: {
      status: 'COMPLETED',
      expiresAt: { lt: new Date() },
    },
    select: { id: true, filePath: true },
  });

  if (expiredExports.length === 0) {
    return 0;
  }

  for (const exportRecord of expiredExports) {
    if (exportRecord.filePath && fs.existsSync(exportRecord.filePath)) {
      await fs.promises.unlink(exportRecord.filePath).catch((err: Error) => {
        logger.warn(
          { filePath: exportRecord.filePath, error: err },
          'Could not delete expired export file',
        );
      });
    }
  }

  const ids = expiredExports.map((e: { id: string }) => e.id);
  await (prisma as any).export.updateMany({
    where: { id: { in: ids } },
    data: { status: 'EXPIRED', filePath: null },
  });

  return expiredExports.length;
}