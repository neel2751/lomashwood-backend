import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'staging', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4003),
  API_VERSION: z.coerce.number().int().min(1).default(1),
  SERVICE_NAME: z.string().default('content-service'),

  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL connection string'),
  DATABASE_POOL_MIN: z.coerce.number().int().min(1).default(2),
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).default(10),
  DATABASE_CONNECT_TIMEOUT_MS: z.coerce.number().int().default(5_000),
  DATABASE_QUERY_TIMEOUT_MS: z.coerce.number().int().default(10_000),

  REDIS_URL: z.string().url('REDIS_URL must be a valid Redis connection string'),
  REDIS_KEY_PREFIX: z.string().default('content:'),
  REDIS_DEFAULT_TTL_SECONDS: z.coerce.number().int().default(3_600),

  AWS_REGION: z.string().default('eu-west-1'),
  AWS_ACCESS_KEY_ID: z.string().min(1, 'AWS_ACCESS_KEY_ID is required'),
  AWS_SECRET_ACCESS_KEY: z.string().min(1, 'AWS_SECRET_ACCESS_KEY is required'),
  AWS_S3_BUCKET: z.string().min(1, 'AWS_S3_BUCKET is required'),
  AWS_S3_UPLOAD_PREFIX: z.string().default('content/'),
  AWS_CLOUDFRONT_DOMAIN: z.string().optional(),
  AWS_CLOUDFRONT_DISTRIBUTION_ID: z.string().optional(),

  KAFKA_BROKERS: z
    .string()
    .min(1)
    .transform((v) => v.split(',').map((b) => b.trim())),
  KAFKA_CLIENT_ID: z.string().default('content-service'),
  KAFKA_GROUP_ID: z.string().default('content-service-group'),
  KAFKA_SSL_ENABLED: z
    .string()
    .transform((v) => v === 'true')
    .default('false'),
  KAFKA_SASL_USERNAME: z.string().optional(),
  KAFKA_SASL_PASSWORD: z.string().optional(),
  KAFKA_CONNECTION_TIMEOUT_MS: z.coerce.number().int().default(3_000),
  KAFKA_REQUEST_TIMEOUT_MS: z.coerce.number().int().default(25_000),

  CORS_ORIGINS: z
    .string()
    .default('http://localhost:3000')
    .transform((v) => v.split(',').map((o) => o.trim())),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().default(60_000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().default(200),

  INTERNAL_SERVICE_SECRET: z
    .string()
    .min(32, 'INTERNAL_SERVICE_SECRET must be at least 32 characters'),

  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),
  LOG_PRETTY: z
    .string()
    .transform((v) => v === 'true')
    .default('false'),

  SITEMAP_BASE_URL: z.string().url('SITEMAP_BASE_URL must be a valid URL').optional(),
  SITEMAP_S3_KEY: z.string().default('sitemap.xml'),

  CDN_PURGE_ENABLED: z
    .string()
    .transform((v) => v === 'true')
    .default('false'),

  REQUEST_TIMEOUT_MS: z.coerce.number().int().default(30_000),
  BODY_SIZE_LIMIT: z.string().default('10mb'),
});

function parseEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.errors
      .map((e) => `  - ${e.path.join('.')} - ${e.message}`)
      .join('\n');

    console.error(`\n[content-service] Environment validation failed:\n${formatted}\n`);
    process.exit(1);
  }

  return result.data;
}

export const env = parseEnv();
export type Env = typeof env;

// Compatibility grouped config used by other modules
export const envConfig = {
  server: {
    port: env.PORT,
    host: env.HOST,
    environment: env.NODE_ENV,
    version: process.env['npm_package_version'] ?? '0.0.0',
  },
  database: {
    url: env.DATABASE_URL,
    pool: { min: env.DATABASE_POOL_MIN, max: env.DATABASE_POOL_MAX },
    connectTimeoutMs: env.DATABASE_CONNECT_TIMEOUT_MS,
    queryTimeoutMs: env.DATABASE_QUERY_TIMEOUT_MS,
  },
  redis: { url: env.REDIS_URL, prefix: env.REDIS_KEY_PREFIX },
  aws: {
    region: env.AWS_REGION,
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    s3Bucket: env.AWS_S3_BUCKET,
  },
  kafka: {
    brokers: env.KAFKA_BROKERS,
    clientId: env.KAFKA_CLIENT_ID,
  },
} as const;