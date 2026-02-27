import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test', 'staging']).default('development'),
  PORT: z.string().default('3000').transform(Number),

  API_PREFIX: z.string().default('/api/v1'),
  API_VERSION: z.string().default('v1'),

  CORS_ORIGIN: z.string().default('*'),
  CORS_CREDENTIALS: z.string().default('true').transform((val: string) => val === 'true'),

  RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform(Number),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100').transform(Number),

  REQUEST_TIMEOUT_MS: z.string().default('30000').transform(Number),

  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly']).default('info'),
  LOG_FORMAT: z.enum(['json', 'simple']).default('json'),
  LOG_FILE_ENABLED: z.string().default('false').transform((val: string) => val === 'true'),
  LOG_FILE_PATH: z.string().default('./logs'),

  AUTH_SERVICE_URL: z.string().url(),
  AUTH_SERVICE_TIMEOUT: z.string().default('5000').transform(Number),

  PRODUCT_SERVICE_URL: z.string().url(),
  PRODUCT_SERVICE_TIMEOUT: z.string().default('5000').transform(Number),

  ORDER_PAYMENT_SERVICE_URL: z.string().url(),
  ORDER_PAYMENT_SERVICE_TIMEOUT: z.string().default('10000').transform(Number),

  APPOINTMENT_SERVICE_URL: z.string().url(),
  APPOINTMENT_SERVICE_TIMEOUT: z.string().default('5000').transform(Number),

  CONTENT_SERVICE_URL: z.string().url(),
  CONTENT_SERVICE_TIMEOUT: z.string().default('5000').transform(Number),

  CUSTOMER_SERVICE_URL: z.string().url(),
  CUSTOMER_SERVICE_TIMEOUT: z.string().default('5000').transform(Number),

  NOTIFICATION_SERVICE_URL: z.string().url(),
  NOTIFICATION_SERVICE_TIMEOUT: z.string().default('10000').transform(Number),

  ANALYTICS_SERVICE_URL: z.string().url(),
  ANALYTICS_SERVICE_TIMEOUT: z.string().default('5000').transform(Number),

  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  SESSION_SECRET: z.string().min(32),
  SESSION_MAX_AGE: z.string().default('604800000').transform(Number),
  SESSION_SECURE: z.string().default('false').transform((val: string) => val === 'true'),
  SESSION_HTTP_ONLY: z.string().default('true').transform((val: string) => val === 'true'),
  SESSION_SAME_SITE: z.enum(['strict', 'lax', 'none']).default('lax'),

  COOKIE_DOMAIN: z.string().optional(),
  COOKIE_PATH: z.string().default('/'),

  REDIS_URL: z.string().url().optional(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379').transform(Number),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().default('0').transform(Number),
  REDIS_KEY_PREFIX: z.string().default('app:gateway:'),

  CACHE_TTL: z.string().default('3600').transform(Number),
  CACHE_ENABLED: z.string().default('true').transform((val: string) => val === 'true'),

  HELMET_ENABLED: z.string().default('true').transform((val: string) => val === 'true'),
  COMPRESSION_ENABLED: z.string().default('true').transform((val: string) => val === 'true'),

  MAX_REQUEST_BODY_SIZE: z.string().default('10mb'),
  MAX_FILE_SIZE: z.string().default('5242880').transform(Number),

  TRUST_PROXY: z.string().default('false').transform((val: string) => val === 'true'),

  HEALTH_CHECK_PATH: z.string().default('/health'),
  METRICS_PATH: z.string().default('/metrics'),

  SWAGGER_ENABLED: z.string().default('true').transform((val: string) => val === 'true'),
  SWAGGER_PATH: z.string().default('/api-docs'),

  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ENVIRONMENT: z.string().optional(),
  SENTRY_TRACES_SAMPLE_RATE: z.string().default('0.1').transform(Number),

  NEW_RELIC_APP_NAME: z.string().optional(),
  NEW_RELIC_LICENSE_KEY: z.string().optional(),

  GTM_ID: z.string().optional(),
  GA_TRACKING_ID: z.string().optional(),

  ADMIN_EMAIL: z.string().email(),
  SUPPORT_EMAIL: z.string().email(),

  MAINTENANCE_MODE: z.string().default('false').transform((val: string) => val === 'true'),
  MAINTENANCE_MESSAGE: z.string().default('Service is under maintenance. Please try again later.'),

  ALLOWED_HOSTS: z.string().default('*'),

  SSL_CERT_PATH: z.string().optional(),
  SSL_KEY_PATH: z.string().optional(),

  GRACEFUL_SHUTDOWN_TIMEOUT: z.string().default('30000').transform(Number),

  SERVICE_RETRY_ATTEMPTS: z.string().default('3').transform(Number),
  SERVICE_RETRY_DELAY: z.string().default('1000').transform(Number),

  CIRCUIT_BREAKER_THRESHOLD: z.string().default('5').transform(Number),
  CIRCUIT_BREAKER_TIMEOUT: z.string().default('60000').transform(Number),

  API_KEY_HEADER: z.string().default('X-API-Key'),
  API_KEY_ENABLED: z.string().default('false').transform((val: string) => val === 'true'),

  WEBHOOK_SECRET: z.string().optional(),
  WEBHOOK_RETRY_ATTEMPTS: z.string().default('3').transform(Number),

  FILE_UPLOAD_DEST: z.string().default('./uploads'),
  FILE_UPLOAD_ALLOWED_TYPES: z.string().default('image/jpeg,image/png,image/webp,application/pdf'),

  EMAIL_FROM: z.string().email().default('noreply@example.com'),
  EMAIL_REPLY_TO: z.string().email().optional(),

  FRONTEND_URL: z.string().url(),
  ADMIN_PANEL_URL: z.string().url().optional(),

  DATABASE_POOL_MIN: z.string().default('2').transform(Number),
  DATABASE_POOL_MAX: z.string().default('10').transform(Number),

  RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS: z.string().default('false').transform((val: string) => val === 'true'),
  RATE_LIMIT_SKIP_FAILED_REQUESTS: z.string().default('false').transform((val: string) => val === 'true'),

  ENABLE_REQUEST_LOGGING: z.string().default('true').transform((val: string) => val === 'true'),
  ENABLE_RESPONSE_LOGGING: z.string().default('false').transform((val: string) => val === 'true'),

  CSP_ENABLED: z.string().default('true').transform((val: string) => val === 'true'),
  CSP_DIRECTIVES: z.string().optional(),

  FEATURE_FLAG_APPOINTMENTS: z.string().default('true').transform((val: string) => val === 'true'),
  FEATURE_FLAG_BROCHURE: z.string().default('true').transform((val: string) => val === 'true'),
  FEATURE_FLAG_NEWSLETTER: z.string().default('true').transform((val: string) => val === 'true'),
  FEATURE_FLAG_REVIEWS: z.string().default('true').transform((val: string) => val === 'true'),
  FEATURE_FLAG_LOYALTY: z.string().default('true').transform((val: string) => val === 'true'),

  SHOWROOM_BOOKING_ENABLED: z.string().default('true').transform((val: string) => val === 'true'),
  HOME_MEASUREMENT_ENABLED: z.string().default('true').transform((val: string) => val === 'true'),
  ONLINE_CONSULTATION_ENABLED: z.string().default('true').transform((val: string) => val === 'true'),

  DEFAULT_CURRENCY: z.string().default('GBP'),
  DEFAULT_LOCALE: z.string().default('en-GB'),
  DEFAULT_TIMEZONE: z.string().default('Europe/London'),

  PAGINATION_DEFAULT_LIMIT: z.string().default('20').transform(Number),
  PAGINATION_MAX_LIMIT: z.string().default('100').transform(Number),

  IMAGE_OPTIMIZATION_ENABLED: z.string().default('true').transform((val: string) => val === 'true'),
  IMAGE_QUALITY: z.string().default('80').transform(Number),
  IMAGE_MAX_WIDTH: z.string().default('2048').transform(Number),
  IMAGE_MAX_HEIGHT: z.string().default('2048').transform(Number),
});

const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      console.error('Environment validation failed:');
      error.issues.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
};

export const env = parseEnv();

export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
export const isStaging = env.NODE_ENV === 'staging';

export type Environment = z.infer<typeof envSchema>;