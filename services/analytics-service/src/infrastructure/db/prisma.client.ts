import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Prisma } from '@prisma/client';
import { Pool } from 'pg';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

let prismaInstance: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    throw new Error('Prisma client not initialized. Call connectDatabase() first.');
  }
  return prismaInstance;
}

export async function connectDatabase(): Promise<void> {
  if (prismaInstance) {
    return;
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const adapter = new PrismaPg(pool);

  prismaInstance = new PrismaClient({
    adapter,
    log:
      env.NODE_ENV === 'development'
        ? [
            { emit: 'event', level: 'query' },
            { emit: 'event', level: 'warn' },
            { emit: 'event', level: 'error' },
          ]
        : [
            { emit: 'event', level: 'warn' },
            { emit: 'event', level: 'error' },
          ],
  });

  if (env.NODE_ENV === 'development') {
    (prismaInstance as any).$on('query', (e: Prisma.QueryEvent) => {
      logger.debug({ query: e.query, params: e.params, duration: e.duration }, 'Prisma query');
    });
  }

  (prismaInstance as any).$on('warn', (e: Prisma.LogEvent) => {
    logger.warn({ message: e.message }, 'Prisma warning');
  });

  (prismaInstance as any).$on('error', (e: Prisma.LogEvent) => {
    logger.error({ message: e.message }, 'Prisma error');
  });

  await prismaInstance.$connect();
}

export async function disconnectDatabase(): Promise<void> {
  if (!prismaInstance) {
    return;
  }

  await prismaInstance.$disconnect();
  prismaInstance = null;
  logger.info('Database disconnected');
}