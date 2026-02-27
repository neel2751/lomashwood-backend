import { getPrismaClient } from '../infrastructure/db/prisma.client';
import { getRedisClient } from '../infrastructure/cache/redis.client';
import { logger } from '../config/logger';
import { DASHBOARD_CACHE_KEYS } from '../app/dashboards/dashboard.constants';
import { publishEvent } from '../infrastructure/messaging/event-consumer';
import { ANALYTICS_EVENT_TOPICS } from '../infrastructure/messaging/event-topics';

export async function rebuildDashboardsJob(): Promise<void> {
  const jobName = 'rebuild-dashboards';
  const start = Date.now();

  logger.info({ job: jobName }, 'Job started');

  const prisma = getPrismaClient() as any;
  const redis = getRedisClient();

  try {
    const dashboards = await prisma.dashboard.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, isDefault: true, type: true },
    });

    if (dashboards.length === 0) {
      logger.info({ job: jobName }, 'No dashboards to rebuild');
      return;
    }

    const invalidated = await invalidateDashboardCaches(redis, dashboards);

    const metrics = await recomputeDailyMetrics(prisma);

    for (const dashboard of dashboards) {
      await publishEvent(
        ANALYTICS_EVENT_TOPICS.PUBLISH.DASHBOARD_REFRESHED,
        {
          dashboardId: dashboard.id,
          name: dashboard.name,
          type: dashboard.type,
          refreshedAt: new Date().toISOString(),
        },
      );
    }

    logger.info(
      {
        job: jobName,
        dashboardCount: dashboards.length,
        cacheKeysInvalidated: invalidated,
        metricsRecomputed: metrics,
        durationMs: Date.now() - start,
      },
      'Job completed',
    );
  } catch (error) {
    logger.error({ job: jobName, error, durationMs: Date.now() - start }, 'Job failed');
    throw error;
  }
}

async function invalidateDashboardCaches(
  redis: ReturnType<typeof getRedisClient>,
  dashboards: { id: string; isDefault: boolean }[],
): Promise<number> {
  const keys: string[] = [DASHBOARD_CACHE_KEYS.allDashboards()];

  for (const dashboard of dashboards) {
    keys.push(DASHBOARD_CACHE_KEYS.dashboard(dashboard.id));
    keys.push(DASHBOARD_CACHE_KEYS.dashboardData(dashboard.id));

    if (dashboard.isDefault) {
      keys.push(DASHBOARD_CACHE_KEYS.defaultDashboard());
    }
  }

  if (keys.length > 0) {
    await redis.del(...keys);
  }

  return keys.length;
}

async function recomputeDailyMetrics(prisma: any): Promise<number> {
  const now = new Date();
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(now);
  dayEnd.setHours(23, 59, 59, 999);

  const [sessionCount, uniqueVisitors, pageViewCount, appointmentCount, brochureCount] =
    await Promise.all([
      prisma.analyticsSession.count({ where: { startedAt: { gte: dayStart, lte: dayEnd } } }),
      prisma.analyticsSession.groupBy({
        by: ['visitorId'],
        where: { startedAt: { gte: dayStart, lte: dayEnd } },
        _count: true,
      }).then((r: any[]) => r.length),
      prisma.pageView.count({ where: { createdAt: { gte: dayStart, lte: dayEnd } } }),
      prisma.analyticsEvent.count({
        where: { eventType: 'APPOINTMENT_COMPLETE', createdAt: { gte: dayStart, lte: dayEnd } },
      }),
      prisma.analyticsEvent.count({
        where: { eventType: 'BROCHURE_REQUEST', createdAt: { gte: dayStart, lte: dayEnd } },
      }),
    ]);

  const metrics = [
    { key: 'sessions.total', value: sessionCount },
    { key: 'visitors.unique', value: uniqueVisitors },
    { key: 'pageviews.total', value: pageViewCount },
    { key: 'appointments.booked', value: appointmentCount },
    { key: 'brochures.requested', value: brochureCount },
  ];

  for (const metric of metrics) {
    await prisma.metricSnapshot.upsert({
      where: {
        metricKey_period_periodStart_periodEnd: {
          metricKey: metric.key,
          period: 'DAILY',
          periodStart: dayStart,
          periodEnd: dayEnd,
        },
      },
      update: { value: metric.value },
      create: {
        metricKey: metric.key,
        period: 'DAILY',
        periodStart: dayStart,
        periodEnd: dayEnd,
        value: metric.value,
        aggregation: 'COUNT',
        dimensions: {},
      },
    });
  }

  return metrics.length;
}