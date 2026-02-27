import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { logger } from '../../config/logger';
import { env } from '../../config/env';

// ── Singleton holder ─────────────────────────────────────────
const globalForPrisma = globalThis as unknown as {
  prismaClient: PrismaClient | undefined;
};

// ── Factory ──────────────────────────────────────────────────
const createPrismaClient = (): PrismaClient => {
  const pool = new Pool({
    connectionString: env.database.url,
  });

  const adapter = new PrismaPg(pool);

  const client = new PrismaClient({
    adapter,
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'warn' },
    ],
  });

  if (env.nodeEnv === 'development') {
    client.$on('query', (e: { query: string; params: string; duration: number }) => {
      logger.debug({
        message: 'Prisma query',
        query: e.query,
        params: e.params,
        duration: `${e.duration}ms`,
      });
    });
  }

  client.$on('error', (e: { message: string; target: string }) => {
    logger.error({
      message: 'Prisma error',
      target: e.target,
      error: e.message,
    });
  });

  client.$on('warn', (e: { message: string; target: string }) => {
    logger.warn({
      message: 'Prisma warning',
      target: e.target,
      warning: e.message,
    });
  });

  return client;
};

// ── Single named export ───────────────────────────────────────
// Use `prismaClient` everywhere — or alias as `prisma` on import:
//   import { prismaClient as prisma } from '...'
export const prismaClient = globalForPrisma.prismaClient ?? createPrismaClient();

// Also export as `prisma` so existing imports don't break
export { prismaClient as prisma };

if (env.nodeEnv !== 'production') {
  globalForPrisma.prismaClient = prismaClient;
}