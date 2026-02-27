import { env } from './env';

export const databaseConfig = {
  url: env.DATABASE_URL,
  pool: {
    min: env.DATABASE_POOL_MIN,
    max: env.DATABASE_POOL_MAX,
    acquireTimeoutMs: env.DATABASE_ACQUIRE_TIMEOUT,
    idleTimeoutMs: env.DATABASE_IDLE_TIMEOUT,
  },
  logging: env.NODE_ENV === 'development',
  ssl: env.NODE_ENV === 'production'
    ? { rejectUnauthorized: true }
    : false,
} as const;