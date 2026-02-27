import { env } from './env';
import { logger } from './logger';



export interface DatabaseConfig {
  url: string;
  poolMin: number;
  poolMax: number;
  connectTimeoutMs: number;
  queryTimeoutMs: number;
 
  slowQueryThresholdMs: number;
 
  enableQueryLogging: boolean;
 
  logQueries: boolean;
}

export const databaseConfig: DatabaseConfig = {
  url: env.DATABASE_URL,
  poolMin: env.DATABASE_POOL_MIN,
  poolMax: env.DATABASE_POOL_MAX,
  connectTimeoutMs: env.DATABASE_CONNECT_TIMEOUT_MS,
  queryTimeoutMs: env.DATABASE_QUERY_TIMEOUT_MS,
  slowQueryThresholdMs: env.NODE_ENV === 'production' ? 500 : 1_000,
  enableQueryLogging: env.NODE_ENV === 'development',
  logQueries: env.NODE_ENV !== 'production',
};



export type PrismaLogLevel = 'query' | 'info' | 'warn' | 'error';

export const prismaLogLevels: PrismaLogLevel[] =
  env.NODE_ENV === 'development'
    ? ['query', 'info', 'warn', 'error']
    : ['warn', 'error'];



export function attachSlowQueryMonitor(prismaClient: {
  $on: (event: 'query', cb: (e: { query: string; duration: number }) => void) => void;
}): void {
  if (!databaseConfig.logQueries) return;

  prismaClient.$on('query', (e) => {
    if (e.duration >= databaseConfig.slowQueryThresholdMs) {
      logger.warn(
        {
          query: e.query,
          durationMs: e.duration,
          threshold: databaseConfig.slowQueryThresholdMs,
        },
        '[Database] Slow query detected',
      );
    } else if (databaseConfig.enableQueryLogging) {
      logger.debug(
        { query: e.query, durationMs: e.duration },
        '[Database] Query executed',
      );
    }
  });
}




export async function validateDatabaseConnection(prismaClient: {
  $queryRaw: (query: TemplateStringsArray) => Promise<unknown>;
}): Promise<void> {
  const timeoutHandle = setTimeout(() => {
    logger.fatal('[Database] Connection timeout — service cannot start');
    process.exit(1);
  }, databaseConfig.connectTimeoutMs);

  try {
    await prismaClient.$queryRaw`SELECT 1`;
    clearTimeout(timeoutHandle);
    logger.info('[Database] Connection established successfully');
  } catch (err) {
    clearTimeout(timeoutHandle);
    const message = err instanceof Error ? err.message : String(err);
    logger.fatal({ error: message }, '[Database] Failed to connect to PostgreSQL');
    throw err;
  }
}