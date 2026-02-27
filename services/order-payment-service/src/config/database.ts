import { PrismaClient } from '@prisma/client';
import { env } from './env';
import { logger } from './logger';

const CONNECT_RETRY_ATTEMPTS = 5;
const CONNECT_RETRY_DELAY_MS = 3_000;

type DatabaseConfig = {
  url:             string;
  poolMin:         number;
  poolMax:         number;
  connectionLimit: number;
  logQueries:      boolean;
  logSlowQueries:  boolean;
  slowQueryThresholdMs: number;
};

export function buildDatabaseConfig(): DatabaseConfig {
  return {
    url:             env.DATABASE_URL,
    poolMin:         env.DATABASE_POOL_MIN,
    poolMax:         env.DATABASE_POOL_MAX,
    connectionLimit: env.DATABASE_CONNECTION_LIMIT,
    logQueries:      env.NODE_ENV !== 'production',
    logSlowQueries:  true,
    slowQueryThresholdMs: 2_000,
  };
}

export async function connectWithRetry(
  prisma: PrismaClient,
  attempts: number = CONNECT_RETRY_ATTEMPTS,
  delayMs: number  = CONNECT_RETRY_DELAY_MS,
): Promise<void> {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      await prisma.$connect();
      logger.info('Database connected successfully', { attempt });
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (attempt === attempts) {
        logger.error('Database connection failed after all retry attempts', {
          attempts,
          error: message,
        });
        throw error;
      }

      logger.warn('Database connection attempt failed — retrying', {
        attempt,
        maxAttempts: attempts,
        retryAfterMs: delayMs,
        error: message,
      });

      await sleep(delayMs);
    }
  }
}

export async function disconnectDatabase(prisma: PrismaClient): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info('Database disconnected');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Failed to disconnect database', { error: message });
    throw error;
  }
}

export async function checkDatabaseConnection(
  prisma: PrismaClient,
): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

export async function getDatabaseVersion(
  prisma: PrismaClient,
): Promise<string | null> {
  try {
    const result = await prisma.$queryRaw<[{ version: string }]>`
      SELECT version()
    `;
    return result[0]?.version ?? null;
  } catch {
    return null;
  }
}

export async function getDatabaseStats(
  prisma: PrismaClient,
): Promise<{
  activeConnections: number | null;
  maxConnections:    number | null;
  databaseSize:      string | null;
}> {
  try {
    const [connResult, sizeResult] = await Promise.all([
      prisma.$queryRaw<[{ active: number; max: number }]>`
        SELECT
          count(*) FILTER (WHERE state = 'active') AS active,
          current_setting('max_connections')::int   AS max
        FROM pg_stat_activity
        WHERE datname = current_database()
      `,
      prisma.$queryRaw<[{ size: string }]>`
        SELECT pg_size_pretty(pg_database_size(current_database())) AS size
      `,
    ]);

    return {
      activeConnections: connResult[0]?.active ?? null,
      maxConnections:    connResult[0]?.max    ?? null,
      databaseSize:      sizeResult[0]?.size   ?? null,
    };
  } catch {
    return {
      activeConnections: null,
      maxConnections:    null,
      databaseSize:      null,
    };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}