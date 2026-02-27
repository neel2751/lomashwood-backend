import { env } from './env';
import { logger } from './logger';

export interface DatabaseConfig {
  url: string;
  poolMin: number;
  poolMax: number;
  connectionTimeout: number;
  queryTimeout: number;
  idleTimeout: number;
  ssl: boolean | { rejectUnauthorized: boolean };
  logQueries: boolean;
}

export interface DatabaseHealth {
  connected: boolean;
  latencyMs?: number;
  error?: string;
}

export const databaseConfig: DatabaseConfig = {
  url: env.database.url,
  poolMin: env.database.poolMin,
  poolMax: env.database.poolMax,
  connectionTimeout: env.database.connectionTimeout,
  queryTimeout: 30000,
  idleTimeout: 600000,
  ssl: env.isProduction
    ? { rejectUnauthorized: true }
    : false,
  logQueries: env.isDevelopment,
};

export const prismaClientConfig = {
  datasources: {
    db: {
      url: databaseConfig.url,
    },
  },
  log: env.isDevelopment
    ? [
        { emit: 'event' as const, level: 'query' as const },
        { emit: 'event' as const, level: 'info' as const },
        { emit: 'event' as const, level: 'warn' as const },
        { emit: 'event' as const, level: 'error' as const },
      ]
    : [
        { emit: 'event' as const, level: 'warn' as const },
        { emit: 'event' as const, level: 'error' as const },
      ],
};

export function onPrismaQuery(event: {
  timestamp: Date;
  query: string;
  params: string;
  duration: number;
  target: string;
}): void {
  if (!databaseConfig.logQueries) return;

  logger.debug('Prisma query executed', {
    query: event.query,
    params: event.params,
    durationMs: event.duration,
    target: event.target,
    timestamp: event.timestamp.toISOString(),
  });

  if (event.duration > 1000) {
    logger.warn('Slow database query detected', {
      query: event.query,
      durationMs: event.duration,
      threshold: 1000,
    });
  }
}

export function onPrismaWarn(event: { message: string; target: string }): void {
  logger.warn('Prisma warning', {
    message: event.message,
    target: event.target,
  });
}

export function onPrismaError(event: { message: string; target: string }): void {
  logger.error('Prisma error', {
    message: event.message,
    target: event.target,
  });
}

export function onPrismaInfo(event: { message: string; target: string }): void {
  logger.info('Prisma info', {
    message: event.message,
    target: event.target,
  });
}

export async function checkDatabaseHealth(
  ping: () => Promise<void>
): Promise<DatabaseHealth> {
  const start = Date.now();

  try {
    await ping();
    const latencyMs = Date.now() - start;

    return {
      connected: true,
      latencyMs,
    };
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown database error';

    logger.error('Database health check failed', { error });

    return {
      connected: false,
      error,
    };
  }
}

export const migrationConfig = {
  migrationsPath: './prisma/migrations',
  schemaPath: './prisma/schema.prisma',
  shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
};

export const seedConfig = {
  enabled: !env.isProduction,
  seedPath: './prisma/seed.ts',
};

export const databaseConnectionString = {
  parse: (url: string): Record<string, string> => {
    try {
      const parsed = new URL(url);
      return {
        host: parsed.hostname,
        port: parsed.port,
        database: parsed.pathname.slice(1),
        user: parsed.username,
        schema: parsed.searchParams.get('schema') ?? 'public',
      };
    } catch {
      return {};
    }
  },
};