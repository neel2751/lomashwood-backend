import { env } from './env';

export const redisConfig = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
  db: env.REDIS_DB,
  keyPrefix: env.REDIS_KEY_PREFIX,
  ttl: {
    default: env.REDIS_TTL_DEFAULT,
    trackingConfig: 3600,
    session: 1800,
    funnel: 600,
    funnelResults: 900,
    dashboard: 600,
    dashboardData: 300,
    export: 300,
    metricSnapshot: 3600,
  },
  retryStrategy: {
    maxAttempts: 10,
    maxDelayMs: 3000,
    baseDelayMs: 100,
  },
  connection: {
    lazyConnect: true,
    enableReadyCheck: true,
    maxRetriesPerRequest: 3,
    connectTimeoutMs: 10000,
    commandTimeoutMs: 5000,
  },
} as const;