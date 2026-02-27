import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4007),
  SERVICE_NAME: z.string().min(1).default('analytics-service'),
  SERVICE_VERSION: z.string().min(1).default('1.0.0'),

  DATABASE_URL: z.string().url(),
  DATABASE_POOL_MIN: z.coerce.number().int().min(1).default(2),
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).default(10),
  DATABASE_ACQUIRE_TIMEOUT: z.coerce.number().int().default(60000),
  DATABASE_IDLE_TIMEOUT: z.coerce.number().int().default(10000),

  REDIS_HOST: z.string().min(1).default('localhost'),
  REDIS_PORT: z.coerce.number().int().min(1).max(65535).default(6379),
  REDIS_PASSWORD: z.string().optional().default(''),
  REDIS_DB: z.coerce.number().int().min(0).max(15).default(6),
  REDIS_KEY_PREFIX: z.string().default('analytics:'),
  REDIS_TTL_DEFAULT: z.coerce.number().int().default(3600),

  CORS_ORIGINS: z
    .string()
    .default('http://localhost:3000')
    .transform((val) => val.split(',').map((s) => s.trim())),
  CORS_CREDENTIALS: z.coerce.boolean().default(true),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().default(60000),
  RATE_LIMIT_MAX: z.coerce.number().int().default(200),
  RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS: z.coerce.boolean().default(false),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  LOG_FORMAT: z.enum(['pretty', 'json']).default('json'),
  LOG_FILE_ENABLED: z.coerce.boolean().default(false),
  LOG_FILE_PATH: z.string().default('logs/analytics-service.log'),

  EVENT_BUS_BROKER: z.enum(['redis', 'kafka']).default('redis'),
  EVENT_BUS_HOST: z.string().default('localhost'),
  EVENT_BUS_PORT: z.coerce.number().int().default(6379),
  EVENT_BUS_PASSWORD: z.string().optional().default(''),
  EVENT_BUS_CONSUMER_GROUP: z.string().default('analytics-service-group'),
  EVENT_BUS_CONSUMER_ID: z.string().default('analytics-service-1'),

  API_GATEWAY_URL: z.string().url().default('http://localhost:4000'),
  AUTH_SERVICE_URL: z.string().url().default('http://localhost:4001'),
  INTERNAL_SERVICE_SECRET: z.string().min(16),

  REQUEST_TIMEOUT_MS: z.coerce.number().int().default(30000),
  GRACEFUL_SHUTDOWN_TIMEOUT_MS: z.coerce.number().int().default(15000),

  EVENT_RETENTION_DAYS: z.coerce.number().int().min(1).default(90),
  REPORT_CACHE_TTL: z.coerce.number().int().default(3600),
  DASHBOARD_REFRESH_INTERVAL: z.coerce.number().int().default(300),
  FUNNEL_RECOMPUTE_INTERVAL: z.coerce.number().int().default(21600),

  EXPORT_MAX_ROWS: z.coerce.number().int().default(100000),
  EXPORT_TEMP_DIR: z.string().default('/tmp/analytics-exports'),

  TRACKING_BATCH_SIZE: z.coerce.number().int().default(100),
  TRACKING_FLUSH_INTERVAL_MS: z.coerce.number().int().default(5000),

  CRON_RECOMPUTE_FUNNELS: z.string().default('0 */6 * * *'),
  CRON_PURGE_OLD_EVENTS: z.string().default('0 2 * * *'),
  CRON_REBUILD_DASHBOARDS: z.string().default('0 4 * * *'),
  CRON_ARCHIVE_HISTORICAL: z.string().default('0 3 * * 0'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const formatted = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');

  throw new Error(`Invalid environment variables:\n${formatted}`);
}

export const env = parsed.data;
export type Env = typeof env;