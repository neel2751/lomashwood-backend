import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Prisma } from '@prisma/client';
import { Pool } from 'pg';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

const SLOW_QUERY_THRESHOLD_MS = 2000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

function buildPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    adapter,
    log: [
      { level: 'query', emit: 'event' },
      { level: 'info', emit: 'event' },
      { level: 'warn', emit: 'event' },
      { level: 'error', emit: 'event' },
    ],
    errorFormat: env.NODE_ENV === 'production' ? 'minimal' : 'pretty',
  });

  client.$on('query', (event: Prisma.QueryEvent) => {
    const durationMs = event.duration;

    if (durationMs >= SLOW_QUERY_THRESHOLD_MS) {
      logger.warn('Slow query detected', {
        query: event.query,
        params: event.params,
        duration: `${durationMs}ms`,
        target: event.target,
      });
    } else {
      logger.debug('Prisma query', {
        query: event.query,
        duration: `${durationMs}ms`,
        target: event.target,
      });
    }
  });

  client.$on('info', (event: Prisma.LogEvent) => {
    logger.info('Prisma info', { message: event.message, target: event.target });
  });

  client.$on('warn', (event: Prisma.LogEvent) => {
    logger.warn('Prisma warning', { message: event.message, target: event.target });
  });

  client.$on('error', (event: Prisma.LogEvent) => {
    logger.error('Prisma error', { message: event.message, target: event.target });
  });

  return client;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? buildPrismaClient();

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('Database connection established');
  } catch (error) {
    logger.error('Failed to connect to database', { error });
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Failed to disconnect from database', { error });
    throw error;
  }
}

export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error('Database health check failed', { error });
    return false;
  }
}

export { PrismaClient, Prisma };