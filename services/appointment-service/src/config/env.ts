import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  PORT: z.string().default('3003'),
  SERVICE_NAME: z.string().default('appointment-service'),
  API_VERSION: z.string().default('v1'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DATABASE_POOL_MIN: z.string().default('2'),
  DATABASE_POOL_MAX: z.string().default('10'),
  DATABASE_CONNECTION_TIMEOUT: z.string().default('5000'),

  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379'),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().default('0'),
  REDIS_TLS: z.string().default('false'),
  REDIS_KEY_PREFIX: z.string().default('appointment:'),
  REDIS_TTL: z.string().default('3600'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),

  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  RATE_LIMIT_WINDOW_MS: z.string().default('60000'),
  RATE_LIMIT_MAX: z.string().default('100'),
  REQUEST_TIMEOUT_MS: z.string().default('30000'),

  EVENT_BUS_BROKER: z.string().default('localhost:9092'),
  EVENT_BUS_CLIENT_ID: z.string().default('appointment-service'),
  EVENT_BUS_GROUP_ID: z.string().default('appointment-service-group'),
  EVENT_BUS_ENABLED: z.string().default('true'),

  EMAIL_HOST: z.string().default('smtp.mailtrap.io'),
  EMAIL_PORT: z.string().default('587'),
  EMAIL_USER: z.string().optional(),
  EMAIL_PASS: z.string().optional(),
  EMAIL_FROM: z.string().default('noreply@lomashwood.co.uk'),
  EMAIL_FROM_NAME: z.string().default('Lomash Wood'),

  SMS_PROVIDER: z.enum(['twilio', 'msg91']).default('twilio'),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_FROM_NUMBER: z.string().optional(),
  MSG91_API_KEY: z.string().optional(),
  MSG91_SENDER_ID: z.string().optional(),

  PUSH_PROVIDER: z.enum(['firebase', 'webpush']).default('firebase'),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),

  BOOKING_REMINDER_HOURS_BEFORE: z.string().default('24'),
  BOOKING_SLOT_DURATION_MINUTES: z.string().default('60'),
  BOOKING_MAX_ADVANCE_DAYS: z.string().default('90'),
  BOOKING_CANCELLATION_WINDOW_HOURS: z.string().default('24'),

  KITCHEN_TEAM_EMAIL: z.string().default('kitchen@lomashwood.co.uk'),
  BEDROOM_TEAM_EMAIL: z.string().default('bedroom@lomashwood.co.uk'),
  ADMIN_EMAIL: z.string().default('admin@lomashwood.co.uk'),

  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug', 'verbose']).default('info'),
  LOG_FORMAT: z.enum(['json', 'pretty']).default('json'),

  SENTRY_DSN: z.string().optional(),
  SENTRY_ENVIRONMENT: z.string().optional(),

  AUTH_SERVICE_URL: z.string().default('http://auth-service:3001'),
  NOTIFICATION_SERVICE_URL: z.string().default('http://notification-service:3007'),
  CUSTOMER_SERVICE_URL: z.string().default('http://customer-service:3006'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const errors = parsed.error.flatten().fieldErrors;
  const messages = Object.entries(errors)
    .map(([field, msgs]) => `  ${field}: ${msgs?.join(', ')}`)
    .join('\n');

  throw new Error(`Invalid environment variables:\n${messages}`);
}

const raw = parsed.data;

export const env = {
  nodeEnv: raw.NODE_ENV,
  port: parseInt(raw.PORT, 10),
  serviceName: raw.SERVICE_NAME,
  apiVersion: raw.API_VERSION,
  isProduction: raw.NODE_ENV === 'production',
  isDevelopment: raw.NODE_ENV === 'development',
  isTest: raw.NODE_ENV === 'test',

  database: {
    url: raw.DATABASE_URL,
    poolMin: parseInt(raw.DATABASE_POOL_MIN, 10),
    poolMax: parseInt(raw.DATABASE_POOL_MAX, 10),
    connectionTimeout: parseInt(raw.DATABASE_CONNECTION_TIMEOUT, 10),
  },

  redis: {
    host: raw.REDIS_HOST,
    port: parseInt(raw.REDIS_PORT, 10),
    password: raw.REDIS_PASSWORD,
    db: parseInt(raw.REDIS_DB, 10),
    tls: raw.REDIS_TLS === 'true',
    keyPrefix: raw.REDIS_KEY_PREFIX,
    ttl: parseInt(raw.REDIS_TTL, 10),
  },

  jwt: {
    secret: raw.JWT_SECRET,
    expiry: raw.JWT_EXPIRY,
    refreshExpiry: raw.JWT_REFRESH_EXPIRY,
  },

  cors: {
    origins: raw.CORS_ORIGINS.split(',').map((o) => o.trim()),
  },

  rateLimit: {
    windowMs: parseInt(raw.RATE_LIMIT_WINDOW_MS, 10),
    max: parseInt(raw.RATE_LIMIT_MAX, 10),
  },

  requestTimeout: parseInt(raw.REQUEST_TIMEOUT_MS, 10),

  eventBus: {
    broker: raw.EVENT_BUS_BROKER,
    clientId: raw.EVENT_BUS_CLIENT_ID,
    groupId: raw.EVENT_BUS_GROUP_ID,
    enabled: raw.EVENT_BUS_ENABLED === 'true',
  },

  email: {
    host: raw.EMAIL_HOST,
    port: parseInt(raw.EMAIL_PORT, 10),
    user: raw.EMAIL_USER,
    pass: raw.EMAIL_PASS,
    from: raw.EMAIL_FROM,
    fromName: raw.EMAIL_FROM_NAME,
  },

  sms: {
    provider: raw.SMS_PROVIDER,
    twilio: {
      accountSid: raw.TWILIO_ACCOUNT_SID,
      authToken: raw.TWILIO_AUTH_TOKEN,
      fromNumber: raw.TWILIO_FROM_NUMBER,
    },
    msg91: {
      apiKey: raw.MSG91_API_KEY,
      senderId: raw.MSG91_SENDER_ID,
    },
  },

  push: {
    provider: raw.PUSH_PROVIDER,
    firebase: {
      projectId: raw.FIREBASE_PROJECT_ID,
      privateKey: raw.FIREBASE_PRIVATE_KEY,
      clientEmail: raw.FIREBASE_CLIENT_EMAIL,
    },
  },

  booking: {
    reminderHoursBefore: parseInt(raw.BOOKING_REMINDER_HOURS_BEFORE, 10),
    slotDurationMinutes: parseInt(raw.BOOKING_SLOT_DURATION_MINUTES, 10),
    maxAdvanceDays: parseInt(raw.BOOKING_MAX_ADVANCE_DAYS, 10),
    cancellationWindowHours: parseInt(raw.BOOKING_CANCELLATION_WINDOW_HOURS, 10),
  },

  teams: {
    kitchenEmail: raw.KITCHEN_TEAM_EMAIL,
    bedroomEmail: raw.BEDROOM_TEAM_EMAIL,
    adminEmail: raw.ADMIN_EMAIL,
  },

  logging: {
    level: raw.LOG_LEVEL,
    format: raw.LOG_FORMAT,
  },

  sentry: {
    dsn: raw.SENTRY_DSN,
    environment: raw.SENTRY_ENVIRONMENT ?? raw.NODE_ENV,
  },

  services: {
    authServiceUrl: raw.AUTH_SERVICE_URL,
    notificationServiceUrl: raw.NOTIFICATION_SERVICE_URL,
    customerServiceUrl: raw.CUSTOMER_SERVICE_URL,
  },
} as const;

export type Env = typeof env;