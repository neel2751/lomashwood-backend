import { PrismaClient, Prisma } from '@prisma/client';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

const logLevels: Prisma.LogLevel[] = env.NODE_ENV === 'development' 
  ? ['query', 'info', 'warn', 'error'] 
  : ['warn', 'error'];

export const prisma = new PrismaClient({
  log: logLevels.map(level => ({
    level,
    emit: 'event',
  })) as Prisma.LogDefinition[],
  errorFormat: env.NODE_ENV === 'development' ? 'pretty' : 'minimal',
});

prisma.$on('query' as never, (e: Prisma.QueryEvent) => {
  if (env.NODE_ENV === 'development') {
    logger.debug('Prisma Query', {
      query: e.query,
      params: e.params,
      duration: `${e.duration}ms`,
      target: e.target,
    });
  }

  if (e.duration > 1000) {
    logger.warn('Slow Prisma Query Detected', {
      query: e.query,
      duration: `${e.duration}ms`,
      target: e.target,
    });
  }
});

prisma.$on('info' as never, (e: Prisma.LogEvent) => {
  logger.info('Prisma Info', { message: e.message, target: e.target });
});

prisma.$on('warn' as never, (e: Prisma.LogEvent) => {
  logger.warn('Prisma Warning', { message: e.message, target: e.target });
});

prisma.$on('error' as never, (e: Prisma.LogEvent) => {
  logger.error('Prisma Error', { message: e.message, target: e.target });
});

export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
  logger.info('✅ Prisma client disconnected');
}

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error('Database connection check failed:', error);
    return false;
  }
}