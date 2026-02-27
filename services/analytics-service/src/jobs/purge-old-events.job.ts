import { getPrismaClient } from '../infrastructure/db/prisma.client';
import { logger } from '../config/logger';
import { env } from '../config/env';

export async function purgeOldEventsJob(): Promise<void> {
  const jobName = 'purge-old-events';
  const start = Date.now();

  logger.info({ job: jobName }, 'Job started');

  const prisma = getPrismaClient() as any;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - env.EVENT_RETENTION_DAYS);

  try {
    const [deletedEvents, deletedPageViews, deletedConversions] = await Promise.all([
      prisma.analyticsEvent.deleteMany({
        where: { createdAt: { lt: cutoffDate } },
      }),
      prisma.pageView.deleteMany({
        where: { createdAt: { lt: cutoffDate } },
      }),
      prisma.conversionEvent.deleteMany({
        where: { createdAt: { lt: cutoffDate } },
      }),
    ]);

    const sessionCutoff = new Date();
    sessionCutoff.setDate(sessionCutoff.getDate() - env.EVENT_RETENTION_DAYS);

    const deletedSessions = await prisma.analyticsSession.deleteMany({
      where: {
        startedAt: { lt: sessionCutoff },
        endedAt: { not: null },
      },
    });

    const totalDeleted =
      deletedEvents.count +
      deletedPageViews.count +
      deletedConversions.count +
      deletedSessions.count;

    logger.info(
      {
        job: jobName,
        cutoffDate: cutoffDate.toISOString(),
        retentionDays: env.EVENT_RETENTION_DAYS,
        deleted: {
          events: deletedEvents.count,
          pageViews: deletedPageViews.count,
          conversions: deletedConversions.count,
          sessions: deletedSessions.count,
          total: totalDeleted,
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