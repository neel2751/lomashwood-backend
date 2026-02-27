import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Prisma } from '@prisma/client';
import { Pool } from 'pg';
import { logger } from '../../config/logger';

const pool = new Pool({
  connectionString: process.env['DATABASE_URL'],
});

const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    adapter: adapter as never,
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'warn' },
    ],
  }) as PrismaClient;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

(prisma as any).$on('query', (e: Prisma.QueryEvent) => {
  logger.debug({
    query: e.query,
    params: e.params,
    duration: `${e.duration}ms`,
  });
});

(prisma as any).$on('error', (e: Prisma.LogEvent) => {
  logger.error({ message: e.message, target: e.target });
});

(prisma as any).$on('warn', (e: Prisma.LogEvent) => {
  logger.warn({ message: e.message, target: e.target });
});

if (process.env['NODE_ENV'] !== 'production') {
  globalForPrisma.prisma = prisma;
}

export async function connectDatabase(): Promise<void> {
  await prisma.$connect();
  logger.info('Database connected successfully');
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  logger.info('Database disconnected');
}