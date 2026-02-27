import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4005),
  HOST: z.string().default('0.0.0.0'),

  DATABASE_URL: z.string().url(),

  REDIS_URL: z.string().url(),

  KAFKA_BROKERS: z.string().transform((v) => v.split(',')),
  KAFKA_CLIENT_ID: z.string().default('notification-service'),
  KAFKA_GROUP_ID: z.string().default('notification-service-group'),

  // ── Queue names ─────────────────────────────────────────────────────────────
  QUEUE_EMAIL_NAME: z.string().default('email'),
  QUEUE_SMS_NAME:   z.string().default('sms'),
  QUEUE_PUSH_NAME:  z.string().default('push'),

  ACTIVE_EMAIL_PROVIDER: z.enum(['nodemailer', 'ses']).default('nodemailer'),
  ACTIVE_SMS_PROVIDER:   z.enum(['twilio', 'msg91']).default('twilio'),
  ACTIVE_PUSH_PROVIDER:  z.enum(['firebase', 'webpush']).default('firebase'),

  SMTP_HOST:   z.string().optional(),
  SMTP_PORT:   z.coerce.number().int().optional(),
  SMTP_SECURE: z.coerce.boolean().optional(),
  SMTP_USER:   z.string().optional(),
  SMTP_PASS:   z.string().optional(),
  SMTP_FROM:   z.string().email().optional(),

  AWS_REGION:            z.string().optional(),
  AWS_ACCESS_KEY_ID:     z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  SES_FROM:              z.string().email().optional(),
  SES_CONFIGURATION_SET: z.string().optional(),

  TWILIO_ACCOUNT_SID:          z.string().optional(),
  TWILIO_AUTH_TOKEN:           z.string().optional(),
  TWILIO_FROM:                 z.string().optional(),
  TWILIO_MESSAGING_SERVICE_SID: z.string().optional(),
  TWILIO_STATUS_CALLBACK_URL:  z.string().url().optional(),

  MSG91_AUTH_KEY:        z.string().optional(),
  MSG91_SENDER_ID:       z.string().optional(),
  MSG91_DEFAULT_COUNTRY: z.string().default('91'),

  FIREBASE_PROJECT_ID:           z.string().optional(),
  FIREBASE_SERVICE_ACCOUNT_JSON: z.string().optional(),

  VAPID_PUBLIC_KEY:  z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT:     z.string().email().optional(),

  CORS_ORIGINS:          z.string().default('http://localhost:3000'),
  RATE_LIMIT_WINDOW_MS:  z.coerce.number().int().default(60_000),
  RATE_LIMIT_MAX:        z.coerce.number().int().default(120),

  JWT_SECRET:           z.string().min(32),
  SERVICE_TOKEN_SECRET: z.string().min(32),

  ADMIN_DUAL_BOOKING_EMAIL: z.string().email().optional(),

  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.errors
      .map((e) => `  ${e.path.join('.')}: ${e.message}`)
      .join('\n');
    throw new Error(`Environment validation failed:\n${formatted}`);
  }

  return result.data;
}

export const env: Env = validateEnv();