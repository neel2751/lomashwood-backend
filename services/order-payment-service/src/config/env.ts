import { z } from 'zod';

const EnvSchema = z.object({
  // ── Runtime ────────────────────────────────────────────────────────────────
  NODE_ENV: z
    .enum(['development', 'test', 'staging', 'production'])
    .default('development'),

  // ── Server ─────────────────────────────────────────────────────────────────
  HOST:        z.string().default('0.0.0.0'),
  PORT:        z.coerce.number().int().min(1).max(65535).default(4002),
  APP_VERSION: z.string().default('1.0.0'),

  // ── Database ───────────────────────────────────────────────────────────────
  DATABASE_URL:              z.string().url(),
  DATABASE_POOL_MIN:         z.coerce.number().int().min(1).default(2),
  DATABASE_POOL_MAX:         z.coerce.number().int().min(1).default(10),
  DATABASE_CONNECTION_LIMIT: z.coerce.number().int().min(1).default(100),

  // ── Redis ──────────────────────────────────────────────────────────────────
  REDIS_HOST:        z.string().default('localhost'),
  REDIS_PORT:        z.coerce.number().int().min(1).max(65535).default(6379),
  REDIS_PASSWORD:    z.string().optional(),
  REDIS_DB:          z.coerce.number().int().min(0).max(15).default(0),
  REDIS_TLS_ENABLED: z
    .string()
    .transform((v) => v === 'true')
    .default('false'),

  // ── Auth ───────────────────────────────────────────────────────────────────
  JWT_SECRET:              z.string().min(32),
  JWT_ACCESS_EXPIRES_IN:   z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN:  z.string().default('7d'),
  COOKIE_SECRET:           z.string().min(32),
  BETTER_AUTH_SECRET:      z.string().min(32),
  BETTER_AUTH_URL:         z.string().url(),

  // ── Stripe ─────────────────────────────────────────────────────────────────
  STRIPE_SECRET_KEY:        z.string().startsWith('sk_'),
  STRIPE_PUBLISHABLE_KEY:   z.string().startsWith('pk_'),
  STRIPE_WEBHOOK_SECRET:    z.string().startsWith('whsec_'),

  // ── Razorpay ───────────────────────────────────────────────────────────────
  RAZORPAY_KEY_ID:         z.string().min(1),
  RAZORPAY_KEY_SECRET:     z.string().min(1),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1),

  // ── CORS ───────────────────────────────────────────────────────────────────
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:3000')
    .transform((v) => v.split(',').map((s) => s.trim())),

  // ── Rate limiting ──────────────────────────────────────────────────────────
  RATE_LIMIT_WINDOW_MS:      z.coerce.number().int().default(60_000),
  RATE_LIMIT_MAX_GLOBAL:     z.coerce.number().int().default(500),
  RATE_LIMIT_MAX_READ:       z.coerce.number().int().default(60),
  RATE_LIMIT_MAX_CREATE:     z.coerce.number().int().default(10),

  // ── Logging ────────────────────────────────────────────────────────────────
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
  LOG_PRETTY: z
    .string()
    .transform((v) => v === 'true')
    .default('false'),

  // ── AWS ────────────────────────────────────────────────────────────────────
  AWS_REGION:            z.string().default('eu-west-1'),
  AWS_ACCESS_KEY_ID:     z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_S3_BUCKET:         z.string().optional(),

  // ── Service discovery ──────────────────────────────────────────────────────
  AUTH_SERVICE_URL:         z.string().url().default('http://localhost:4001'),
  NOTIFICATION_SERVICE_URL: z.string().url().default('http://localhost:4006'),

  // ── Feature flags ──────────────────────────────────────────────────────────
  RAZORPAY_ENABLED: z
    .string()
    .transform((v) => v === 'true')
    .default('false'),
  INVOICE_EMAIL_ENABLED: z
    .string()
    .transform((v) => v === 'true')
    .default('true'),
});

export type Env = z.infer<typeof EnvSchema>;

function parseEnv(): Env {
  const result = EnvSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.errors
      .map((e) => `  ${e.path.join('.')}: ${e.message}`)
      .join('\n');

    throw new Error(
      `Environment variable validation failed:\n${formatted}`,
    );
  }

  return result.data;
}

export const env: Env = parseEnv();