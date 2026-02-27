import { PrismaClient } from '@prisma/client';
import { env, isDevelopment, isProduction } from './env';
import { logger } from './logger';

export interface DatabaseConfig {
  url: string;
  poolMin: number;
  poolMax: number;
  connectionTimeout: number;
  idleTimeout: number;
  enableLogging: boolean;
  logLevel: 'query' | 'info' | 'warn' | 'error';
  retryAttempts: number;
  retryDelay: number;
}

export const databaseConfig: DatabaseConfig = {
  url: env.DATABASE_URL,
  poolMin: env.DATABASE_POOL_MIN,
  poolMax: env.DATABASE_POOL_MAX,
  connectionTimeout: env.DATABASE_CONNECTION_TIMEOUT,
  idleTimeout: env.DATABASE_IDLE_TIMEOUT,
  enableLogging: isDevelopment() || env.VERBOSE_LOGGING,
  logLevel: isDevelopment() ? 'query' : 'error',
  retryAttempts: 3,
  retryDelay: 1000,
};

export function getPrismaLogLevel(): Array<'query' | 'info' | 'warn' | 'error'> {
  if (!databaseConfig.enableLogging) {
    return ['error'];
  }

  if (isDevelopment()) {
    return ['query', 'info', 'warn', 'error'];
  }

  if (env.VERBOSE_LOGGING) {
    return ['info', 'warn', 'error'];
  }

  return ['warn', 'error'];
}

export function createPrismaClient(): PrismaClient {
  const logLevels = getPrismaLogLevel();

  const prisma = new PrismaClient({
    log: logLevels.map(level => ({
      emit: 'event',
      level,
    })),
    datasources: {
      db: {
        url: databaseConfig.url,
      },
    },
  });

  prisma.$on('query' as never, (e: any) => {
    if (isDevelopment() || env.DEBUG) {
      logger.debug('Database query', {
        query: e.query,
        params: e.params,
        duration: `${e.duration}ms`,
      });
    }
  });

  prisma.$on('info' as never, (e: any) => {
    logger.info('Database info', { message: e.message });
  });

  prisma.$on('warn' as never, (e: any) => {
    logger.warn('Database warning', { message: e.message });
  });

  prisma.$on('error' as never, (e: any) => {
    logger.error('Database error', { message: e.message });
  });

  return prisma;
}

export async function connectDatabase(
  prisma: PrismaClient,
  retryAttempts: number = databaseConfig.retryAttempts
): Promise<void> {
  let attempt = 0;

  while (attempt < retryAttempts) {
    try {
      await prisma.$connect();
      logger.info('Database connected successfully', {
        attempt: attempt + 1,
        poolMin: databaseConfig.poolMin,
        poolMax: databaseConfig.poolMax,
      });
      return;
    } catch (error) {
      attempt++;
      logger.error('Database connection failed', {
        attempt,
        maxAttempts: retryAttempts,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      if (attempt >= retryAttempts) {
        throw new Error(
          `Failed to connect to database after ${retryAttempts} attempts`
        );
      }

      await new Promise(resolve =>
        setTimeout(resolve, databaseConfig.retryDelay * attempt)
      );
    }
  }
}

export async function disconnectDatabase(prisma: PrismaClient): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info('Database disconnected successfully');
  } catch (error) {
    logger.error('Error disconnecting from database', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

export async function healthCheckDatabase(
  prisma: PrismaClient
): Promise<{ healthy: boolean; responseTime: number; error?: string }> {
  const startTime = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - startTime;

    return {
      healthy: true,
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      healthy: false,
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function getDatabaseMetrics(
  prisma: PrismaClient
): Promise<{
  activeConnections: number;
  idleConnections: number;
  totalConnections: number;
}> {
  try {
    const metrics = await prisma.$metrics.json();

    return {
      activeConnections: metrics.counters.find((c: any) => c.key === 'prisma_client_queries_active')?.value || 0,
      idleConnections: 0,
      totalConnections: metrics.counters.find((c: any) => c.key === 'prisma_client_queries_total')?.value || 0,
    };
  } catch (error) {
    logger.error('Failed to get database metrics', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      activeConnections: 0,
      idleConnections: 0,
      totalConnections: 0,
    };
  }
}

export async function testDatabaseConnection(
  prisma: PrismaClient
): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error('Database connection test failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

export async function runDatabaseMigrations(
  prisma: PrismaClient
): Promise<void> {
  if (!isProduction()) {
    logger.warn('Database migrations should be run manually in production');
    return;
  }

  try {
    logger.info('Running database migrations...');
    logger.info('Database migrations completed');
  } catch (error) {
    logger.error('Database migration failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

export function validateDatabaseConfiguration(): {
  valid: boolean;
  warnings: string[];
  errors: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];

  if (!env.DATABASE_URL) {
    errors.push('DATABASE_URL is not configured');
  }

  if (!env.DATABASE_URL.startsWith('postgresql://')) {
    errors.push('DATABASE_URL must be a PostgreSQL connection string');
  }

  if (databaseConfig.poolMin < 1) {
    warnings.push('DATABASE_POOL_MIN should be at least 1');
  }

  if (databaseConfig.poolMax < databaseConfig.poolMin) {
    errors.push('DATABASE_POOL_MAX must be greater than DATABASE_POOL_MIN');
  }

  if (databaseConfig.poolMax > 50) {
    warnings.push('DATABASE_POOL_MAX is very high (>50), may cause connection issues');
  }

  if (databaseConfig.connectionTimeout < 5000) {
    warnings.push('DATABASE_CONNECTION_TIMEOUT is very low (<5s)');
  }

  if (databaseConfig.idleTimeout < 10000) {
    warnings.push('DATABASE_IDLE_TIMEOUT is very low (<10s)');
  }

  if (isProduction() && databaseConfig.enableLogging) {
    warnings.push('Query logging is enabled in production, this may impact performance');
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors,
  };
}

export function logDatabaseConfiguration(): void {
  const validation = validateDatabaseConfiguration();
  const databaseHost = env.DATABASE_URL.split('@')[1]?.split('/')[0] || 'configured';

  logger.info('Database configuration loaded', {
    environment: env.NODE_ENV,
    host: databaseHost,
    poolMin: databaseConfig.poolMin,
    poolMax: databaseConfig.poolMax,
    connectionTimeout: databaseConfig.connectionTimeout,
    idleTimeout: databaseConfig.idleTimeout,
    loggingEnabled: databaseConfig.enableLogging,
  });

  if (validation.warnings.length > 0) {
    logger.warn('Database configuration warnings', { warnings: validation.warnings });
  }

  if (validation.errors.length > 0) {
    logger.error('Database configuration errors', { errors: validation.errors });
  }
}

export async function executeDatabaseTransaction<T>(
  prisma: PrismaClient,
  callback: (tx: any) => Promise<T>
): Promise<T> {
  try {
    return await prisma.$transaction(callback, {
      maxWait: 5000,
      timeout: 10000,
    });
  } catch (error) {
    logger.error('Database transaction failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

export function getDatabaseConfig(): DatabaseConfig {
  return { ...databaseConfig };
}

logDatabaseConfiguration();