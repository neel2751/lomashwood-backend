import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Prisma } from '@prisma/client';
import { Pool } from 'pg';
import { logger } from '../../config/logger';

const createPrismaClient = (): PrismaClient => {
  const isDevelopment = process.env['NODE_ENV'] === 'development';

  const pool = new Pool({
    connectionString: process.env['DATABASE_URL'],
  });

  const adapter = new PrismaPg(pool);

  const client = new PrismaClient({
    adapter: adapter as never,
    log: isDevelopment
      ? [
          { emit: 'event', level: 'query' },
          { emit: 'event', level: 'info' },
          { emit: 'event', level: 'warn' },
          { emit: 'event', level: 'error' },
        ]
      : [
          { emit: 'event', level: 'warn' },
          { emit: 'event', level: 'error' },
        ],
    errorFormat: isDevelopment ? 'pretty' : 'minimal',
  });

  type ExtendedClient = PrismaClient & {
    $on<E extends Prisma.LogLevel>(
      event: E,
      listener: E extends 'query'
        ? (e: Prisma.QueryEvent) => void
        : (e: Prisma.LogEvent) => void,
    ): void;
  };

  const extClient = client as unknown as ExtendedClient;

  if (isDevelopment) {
    extClient.$on('query', (e: Prisma.QueryEvent) => {
      logger.debug({
        context: 'PrismaQuery',
        query: e.query,
        params: e.params,
        durationMs: e.duration,
        target: e.target,
      });
    });
  }

  extClient.$on('info', (e: Prisma.LogEvent) => {
    logger.info({ context: 'PrismaInfo', msg: e.message, target: e.target });
  });

  extClient.$on('warn', (e: Prisma.LogEvent) => {
    logger.warn({ context: 'PrismaWarn', msg: e.message, target: e.target });
  });

  extClient.$on('error', (e: Prisma.LogEvent) => {
    logger.error({ context: 'PrismaError', msg: e.message, target: e.target });
  });

  return client;
};

declare global {
  var __contentPrismaClient: PrismaClient | undefined;
}

export const prisma = global.__contentPrismaClient ?? createPrismaClient();

if (process.env['NODE_ENV'] !== 'production') {
  global.__contentPrismaClient = prisma;
}

export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();
    logger.info('ContentService › PostgreSQL connected');
  } catch (error) {
    logger.error({ context: 'connectDatabase', error, message: 'DB connection failed' });
    process.exit(1);
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    logger.info('ContentService › PostgreSQL disconnected');
  } catch (error) {
    logger.error({ context: 'disconnectDatabase', error, message: 'DB disconnect failed' });
  }
};

export type PrismaTransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

// Compatibility alias used across the codebase
export const prismaClient = prisma;