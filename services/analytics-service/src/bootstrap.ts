import { env } from './config/env';
import { logger } from './config/logger';
import { getPrismaClient } from './infrastructure/db/prisma.client';
import { getRedisClient } from './infrastructure/cache/redis.client';
import { registerEventSubscriptions } from './interfaces/events/subscriptions';

export async function bootstrap(): Promise<void> {
  await verifyDatabaseConnection();
  await verifyRedisConnection();
  await registerEventSubscriptions();
  logServiceConfiguration();
}

async function verifyDatabaseConnection(): Promise<void> {
  const prisma = getPrismaClient();

  try {
    await prisma.$queryRaw`SELECT 1`;
    logger.info('Database health check passed');
  } catch (error) {
    logger.error({ error }, 'Database health check failed');
    throw new Error('Database connection verification failed');
  }
}

async function verifyRedisConnection(): Promise<void> {
  const redis = getRedisClient();

  try {
    const pong = await redis.ping();

    if (pong !== 'PONG') {
      throw new Error('Unexpected Redis ping response');
    }

    logger.info('Redis health check passed');
  } catch (error) {
    logger.error({ error }, 'Redis health check failed');
    throw new Error('Redis connection verification failed');
  }
}

function logServiceConfiguration(): void {
  logger.info(
    {
      service: env.SERVICE_NAME,
      version: env.SERVICE_VERSION,
      environment: env.NODE_ENV,
      port: env.PORT,
      database: maskConnectionString(env.DATABASE_URL),
      redis: `${env.REDIS_HOST}:${env.REDIS_PORT}`,
      rateLimitWindow: env.RATE_LIMIT_WINDOW_MS,
      rateLimitMax: env.RATE_LIMIT_MAX,
      requestTimeout: env.REQUEST_TIMEOUT_MS,
      eventRetentionDays: env.EVENT_RETENTION_DAYS,
      trackingBatchSize: env.TRACKING_BATCH_SIZE,
    },
    'Service configuration loaded',
  );
}

function maskConnectionString(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.password = '***';
    return parsed.toString();
  } catch {
    return '***';
  }
}