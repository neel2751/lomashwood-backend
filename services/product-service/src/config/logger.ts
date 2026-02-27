import pino, { Logger, LoggerOptions } from 'pino';
import { env } from './env';

const baseOptions: LoggerOptions = {
  level: env.LOG_LEVEL,
  base: {
    service: 'product-service',
    env: env.NODE_ENV,
    pid: process.pid,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'body.password',
      'body.currentPassword',
      'body.newPassword',
      'body.token',
      'body.secret',
      '*.AWS_SECRET_ACCESS_KEY',
      '*.INTERNAL_SERVICE_SECRET',
    ],
    censor: '[REDACTED]',
  },
};

const devOptions: LoggerOptions = {
  ...baseOptions,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:HH:MM:ss.l',
      ignore: 'pid,hostname',
      singleLine: false,
    },
  },
};

export const logger: Logger =
  env.NODE_ENV === 'development'
    ? pino(devOptions)
    : pino(baseOptions);

/**
 * Create a child logger for a specific module
 * @param module - The module name
 * @returns A logger instance with module context
 * @example
 * const logger = createLogger('my-module');
 */
export function createLogger(module: string): Logger {
  return logger.child({ module });
}

  CORS_ORIGIN: z.string().default('*'),
  CORS_CREDENTIALS: z.string().transform(Boolean).default('true'),

  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'),
  RATE_LIMIT_MAX: z.string().transform(Number).default('100'),

  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FORMAT: z.enum(['json', 'pretty']).default('json'),

  API_GATEWAY_URL: z.string().url().optional(),
  AUTH_SERVICE_URL: z.string().url().optional(),
  ORDER_SERVICE_URL: z.string().url().optional(),
  APPOINTMENT_SERVICE_URL: z.string().url().optional(),
  CONTENT_SERVICE_URL: z.string().url().optional(),
  CUSTOMER_SERVICE_URL: z.string().url().optional(),
  NOTIFICATION_SERVICE_URL: z.string().url().optional(),
  ANALYTICS_SERVICE_URL: z.string().url().optional(),

  AWS_REGION: z.string().default('us-east-1'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  AWS_CLOUDFRONT_DOMAIN: z.string().optional(),

  UPLOAD_MAX_FILE_SIZE: z.string().transform(Number).default('10485760'),
  UPLOAD_ALLOWED_TYPES: z.string().default('image/jpeg,image/png,image/webp'),
  UPLOAD_DESTINATION: z.string().default('uploads/products'),

  CACHE_ENABLED: z.string().transform(Boolean).default('true'),
  CACHE_DEFAULT_TTL: z.string().transform(Number).default('3600'),
  CACHE_PRODUCTS_TTL: z.string().transform(Number).default('1800'),
  CACHE_CATEGORIES_TTL: z.string().transform(Number).default('7200'),
  CACHE_COLOURS_TTL: z.string().transform(Number).default('86400'),

  PAGINATION_DEFAULT_LIMIT: z.string().transform(Number).default('10'),
  PAGINATION_MAX_LIMIT: z.string().transform(Number).default('100'),

  FEATURE_FLAG_ANALYTICS: z.string().transform(Boolean).default('true'),
  FEATURE_FLAG_IMAGE_OPTIMIZATION: z.string().transform(Boolean).default('true'),
  FEATURE_FLAG_BULK_OPERATIONS: z.string().transform(Boolean).default('false'),
  FEATURE_FLAG_ELASTIC_SEARCH: z.string().transform(Boolean).default('false'),

  ELASTICSEARCH_NODE: z.string().url().optional(),
  ELASTICSEARCH_INDEX: z.string().default('products'),

  KAFKA_BROKERS: z.string().optional(),
  KAFKA_CLIENT_ID: z.string().default('product-service'),
  KAFKA_GROUP_ID: z.string().default('product-service-group'),
  KAFKA_ENABLED: z.string().transform(Boolean).default('false'),

  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ENVIRONMENT: z.string().optional(),
  SENTRY_TRACES_SAMPLE_RATE: z.string().transform(Number).default('0.1'),

  PROMETHEUS_ENABLED: z.string().transform(Boolean).default('true'),
  PROMETHEUS_PORT: z.string().transform(Number).default('9090'),

  HEALTH_CHECK_INTERVAL: z.string().transform(Number).default('30000'),
  GRACEFUL_SHUTDOWN_TIMEOUT: z.string().transform(Number).default('30000'),

  REQUEST_TIMEOUT: z.string().transform(Number).default('30000'),
  BODY_LIMIT: z.string().default('10mb'),

  ENABLE_API_DOCS: z.string().transform(Boolean).default('true'),
  API_DOCS_PATH: z.string().default('/api-docs'),

  LOW_STOCK_THRESHOLD: z.string().transform(Number).default('10'),
  AUTO_RESTOCK_ENABLED: z.string().transform(Boolean).default('false'),

  PRICE_CHANGE_NOTIFICATION_THRESHOLD: z.string().transform(Number).default('10'),

  IMAGE_COMPRESSION_QUALITY: z.string().transform(Number).default('80'),
  IMAGE_MAX_WIDTH: z.string().transform(Number).default('1920'),
  IMAGE_MAX_HEIGHT: z.string().transform(Number).default('1080'),
  IMAGE_THUMBNAIL_WIDTH: z.string().transform(Number).default('300'),
  IMAGE_THUMBNAIL_HEIGHT: z.string().transform(Number).default('300'),

  CURRENCY: z.string().default('GBP'),
  TIMEZONE: z.string().default('Europe/London'),
  LOCALE: z.string().default('en-GB'),

  SLACK_WEBHOOK_URL: z.string().url().optional(),
  SLACK_NOTIFICATIONS_ENABLED: z.string().transform(Boolean).default('false'),

  BACKUP_ENABLED: z.string().transform(Boolean).default('false'),
  BACKUP_SCHEDULE: z.string().default('0 2 * * *'),
  BACKUP_RETENTION_DAYS: z.string().transform(Number).default('30'),

  SEARCH_MIN_QUERY_LENGTH: z.string().transform(Number).default('2'),
  SEARCH_MAX_RESULTS: z.string().transform(Number).default('50'),

  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_NOTIFICATION_ENABLED: z.string().transform(Boolean).default('true'),

  DEBUG: z.string().transform(Boolean).default('false'),
  VERBOSE_LOGGING: z.string().transform(Boolean).default('false'),
});

export type Env = z.infer<typeof envSchema>;

function loadEnvFile(): void {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const envFiles = [
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), `.env.${nodeEnv}`),
    path.resolve(process.cwd(), '.env'),
  ];

  for (const envFile of envFiles) {
    const result = dotenv.config({ path: envFile });
    if (!result.error) {
      console.log(`Loaded environment from: ${envFile}`);
      break;
    }
  }
}

function validateEnv(): Env {
  loadEnvFile();

  try {
    const parsed = envSchema.parse(process.env);
    console.log('Environment variables validated successfully');
    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Environment validation failed:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
}

export const env = validateEnv();

export function isDevelopment(): boolean {
  return env.NODE_ENV === 'development';
}

export function isProduction(): boolean {
  return env.NODE_ENV === 'production';
}

export function isStaging(): boolean {
  return env.NODE_ENV === 'staging';
}

export function isTest(): boolean {
  return env.NODE_ENV === 'test';
}

export function getServiceUrl(serviceName: string): string | undefined {
  const urls: Record<string, string | undefined> = {
    'api-gateway': env.API_GATEWAY_URL,
    'auth': env.AUTH_SERVICE_URL,
    'order': env.ORDER_SERVICE_URL,
    'appointment': env.APPOINTMENT_SERVICE_URL,
    'content': env.CONTENT_SERVICE_URL,
    'customer': env.CUSTOMER_SERVICE_URL,
    'notification': env.NOTIFICATION_SERVICE_URL,
    'analytics': env.ANALYTICS_SERVICE_URL,
  };

  return urls[serviceName];
}

export function getDatabaseConfig() {
  return {
    url: env.DATABASE_URL,
    poolMin: env.DATABASE_POOL_MIN,
    poolMax: env.DATABASE_POOL_MAX,
    connectionTimeout: env.DATABASE_CONNECTION_TIMEOUT,
    idleTimeout: env.DATABASE_IDLE_TIMEOUT,
  };
}

export function getRedisConfig() {
  return {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
    db: env.REDIS_DB,
    keyPrefix: env.REDIS_KEY_PREFIX,
    ttl: env.REDIS_TTL,
  };
}

export function getCacheConfig() {
  return {
    enabled: env.CACHE_ENABLED,
    defaultTTL: env.CACHE_DEFAULT_TTL,
    productsTTL: env.CACHE_PRODUCTS_TTL,
    categoriesTTL: env.CACHE_CATEGORIES_TTL,
    coloursTTL: env.CACHE_COLOURS_TTL,
  };
}

export function getFeatureFlags() {
  return {
    analyticsEnabled: env.FEATURE_FLAG_ANALYTICS,
    imageOptimization: env.FEATURE_FLAG_IMAGE_OPTIMIZATION,
    bulkOperations: env.FEATURE_FLAG_BULK_OPERATIONS,
    elasticSearch: env.FEATURE_FLAG_ELASTIC_SEARCH,
  };
}

export function getUploadConfig() {
  return {
    maxFileSize: env.UPLOAD_MAX_FILE_SIZE,
    allowedTypes: env.UPLOAD_ALLOWED_TYPES.split(','),
    destination: env.UPLOAD_DESTINATION,
  };
}

export function getImageConfig() {
  return {
    compressionQuality: env.IMAGE_COMPRESSION_QUALITY,
    maxWidth: env.IMAGE_MAX_WIDTH,
    maxHeight: env.IMAGE_MAX_HEIGHT,
    thumbnailWidth: env.IMAGE_THUMBNAIL_WIDTH,
    thumbnailHeight: env.IMAGE_THUMBNAIL_HEIGHT,
  };
}

export function getPaginationConfig() {
  return {
    defaultLimit: env.PAGINATION_DEFAULT_LIMIT,
    maxLimit: env.PAGINATION_MAX_LIMIT,
  };
}

export function getJWTConfig() {
  return {
    secret: env.JWT_SECRET,
    expiry: env.JWT_EXPIRY,
    refreshSecret: env.JWT_REFRESH_SECRET,
    refreshExpiry: env.JWT_REFRESH_EXPIRY,
  };
}

export function getRateLimitConfig() {
  return {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
  };
}

export function getAWSConfig() {
  return {
    region: env.AWS_REGION,
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    s3Bucket: env.AWS_S3_BUCKET,
    cloudfrontDomain: env.AWS_CLOUDFRONT_DOMAIN,
  };
}

export function printEnvironmentInfo(): void {
  console.log('\n=== Product Service Configuration ===');
  console.log(`Environment: ${env.NODE_ENV}`);
  console.log(`Port: ${env.PORT}`);
  console.log(`Host: ${env.HOST}`);
  console.log(`Database: ${env.DATABASE_URL.split('@')[1] || 'configured'}`);
  console.log(`Redis: ${env.REDIS_HOST}:${env.REDIS_PORT}`);
  console.log(`Cache Enabled: ${env.CACHE_ENABLED}`);
  console.log(`Log Level: ${env.LOG_LEVEL}`);
  console.log(`Debug Mode: ${env.DEBUG}`);
  console.log('=====================================\n');
}

if (isDevelopment()) {
  printEnvironmentInfo();
}