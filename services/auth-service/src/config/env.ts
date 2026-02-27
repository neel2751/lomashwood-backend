function makeValidator<T>(parseFn: (raw: string) => T) {
  return (opts: { default?: T } = {}): { parseFn: (raw: string) => T; default?: T } => ({
    parseFn,
    default: opts.default,
  });
}

type EnvSpec = Record<string, { parseFn: (raw: string) => unknown; default?: unknown }>;

function cleanEnv<S extends EnvSpec>(rawEnv: NodeJS.ProcessEnv, spec: S): any {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(spec)) {
    const entry = spec[key]!;
    const raw = rawEnv[key];
    if (raw === undefined || raw === null) {
      if (entry.default !== undefined) {
        result[key] = entry.default;
      } else {
        throw new Error(`Missing required environment variable: ${key}`);
      }
    } else {
      try {
        result[key] = entry.parseFn(raw);
      } catch (e) {
        throw new Error(`Invalid value for ${key}: ${(e as Error).message}`);
      }
    }
  }
  return result;
}

// Primitive validators
const str   = (opts: { default?: string }  = {}) => ({ parseFn: (r: string) => r, default: opts.default });
const bool  = (opts: { default?: boolean } = {}) => ({ parseFn: (r: string) => r === 'true', default: opts.default });
const num   = (opts: { default?: number }  = {}) => ({ parseFn: (r: string) => Number(r), default: opts.default });
const port  = (opts: { default?: number }  = {}) => ({ parseFn: (r: string) => { const n = Number(r); if (n < 1 || n > 65535) throw new Error('Invalid port'); return n; }, default: opts.default });
const url   = (opts: { default?: string }  = {}) => ({ parseFn: (r: string) => { try { new URL(r); } catch { throw new Error('Invalid URL'); } return r; }, default: opts.default });
const email = (opts: { default?: string }  = {}) => ({ parseFn: (r: string) => { if (!r.includes('@')) throw new Error('Invalid email'); return r; }, default: opts.default });

// ─── Custom validators ────────────────────────────────────────────────────────

const commaSeparated = makeValidator<string[]>((raw: string) => {
  if (raw.trim() === '') return [];
  return raw.split(',').map((s: string) => s.trim());
});

const nodeEnvValidator = makeValidator<'development' | 'staging' | 'production' | 'test'>(
  (raw: string) => {
    const valid = ['development', 'staging', 'production', 'test'] as const;
    if (!valid.includes(raw as (typeof valid)[number])) {
      throw new Error(`NODE_ENV must be one of: ${valid.join(', ')}`);
    }
    return raw as 'development' | 'staging' | 'production' | 'test';
  }
);

const logLevelValidator = makeValidator<'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace'>(
  (raw: string) => {
    const valid = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'] as const;
    if (!valid.includes(raw as (typeof valid)[number])) {
      throw new Error(`LOG_LEVEL must be one of: ${valid.join(', ')}`);
    }
    return raw as 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';
  }
);

const logFormatValidator = makeValidator<'json' | 'pretty'>((raw: string) => {
  if (raw !== 'json' && raw !== 'pretty') {
    throw new Error('LOG_FORMAT must be "json" or "pretty"');
  }
  return raw;
});

const emailProviderValidator = makeValidator<'smtp' | 'ses' | 'sendgrid'>((raw: string) => {
  const valid = ['smtp', 'ses', 'sendgrid'] as const;
  if (!valid.includes(raw as (typeof valid)[number])) {
    throw new Error(`EMAIL_PROVIDER must be one of: ${valid.join(', ')}`);
  }
  return raw as 'smtp' | 'ses' | 'sendgrid';
});

const eventBusProviderValidator = makeValidator<'kafka' | 'rabbitmq' | 'redis' | 'disabled'>(
  (raw: string) => {
    const valid = ['kafka', 'rabbitmq', 'redis', 'disabled'] as const;
    if (!valid.includes(raw as (typeof valid)[number])) {
      throw new Error(`EVENT_BUS_PROVIDER must be one of: ${valid.join(', ')}`);
    }
    return raw as 'kafka' | 'rabbitmq' | 'redis' | 'disabled';
  }
);

// ─── Environment ──────────────────────────────────────────────────────────────

export const env = cleanEnv(process.env, {
  NODE_ENV:         nodeEnvValidator({ default: 'development' }),
  PORT:             port({ default: 3001 }),
  SERVICE_BASE_URL: url({ default: 'http://localhost:3001' }),
  SERVICE_NAME:     str({ default: 'auth-service' }),
  API_VERSION:      str({ default: 'v1' }),
  TRUST_PROXY:      str({ default: '1' }),

  DATABASE_URL:              str(),
  DIRECT_URL:                str({ default: '' }),
  DATABASE_CONNECTION_LIMIT: num({ default: 10 }),
  DATABASE_POOL_TIMEOUT:     num({ default: 20 }),
  DATABASE_LOG_QUERIES:      bool({ default: false }),

  REDIS_URL:                str({ default: 'redis://localhost:6379/0' }),
  REDIS_PASSWORD:           str({ default: '' }),
  REDIS_TLS_ENABLED:        bool({ default: false }),
  REDIS_KEY_PREFIX:         str({ default: 'lomash:auth:' }),
  REDIS_DEFAULT_TTL:        num({ default: 3600 }),
  REDIS_MAX_CONNECTIONS:    num({ default: 10 }),
  REDIS_RETRY_DELAY_MS:     num({ default: 200 }),
  REDIS_MAX_RETRY_ATTEMPTS: num({ default: 10 }),

  BETTER_AUTH_SECRET:         str(),
  BETTER_AUTH_URL:            url({ default: 'http://localhost:3000' }),
  BETTER_AUTH_COOKIE_NAME:    str({ default: 'lomash_auth_session' }),
  BETTER_AUTH_SESSION_EXPIRY: num({ default: 604800 }),
  BETTER_AUTH_COOKIE_SECURE:  bool({ default: false }),

  JWT_ACCESS_SECRET:  str(),
  JWT_REFRESH_SECRET: str(),
  JWT_ACCESS_EXPIRY:  str({ default: '15m' }),
  JWT_REFRESH_EXPIRY: str({ default: '7d' }),
  JWT_RESET_EXPIRY:   str({ default: '1h' }),
  JWT_VERIFY_EXPIRY:  str({ default: '24h' }),
  JWT_ISSUER:         str({ default: 'lomash-wood-auth' }),
  JWT_AUDIENCE:       str({ default: 'lomash-wood-api' }),

  BCRYPT_SALT_ROUNDS: num({ default: 12 }),

  OTP_APP_NAME:     str({ default: 'Lomash Wood' }),
  OTP_WINDOW:       num({ default: 1 }),
  OTP_STEP:         num({ default: 30 }),
  OTP_DIGITS:       num({ default: 6 }),
  EMAIL_OTP_EXPIRY: num({ default: 600 }),

  CORS_ALLOWED_ORIGINS:  commaSeparated({ default: ['http://localhost:3000'] }),
  CORS_ALLOWED_METHODS:  commaSeparated({ default: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'] }),
  CORS_ALLOWED_HEADERS:  commaSeparated({ default: ['Content-Type', 'Authorization', 'X-Request-ID'] }),
  CORS_EXPOSED_HEADERS:  commaSeparated({ default: ['X-Request-ID'] }),
  CORS_CREDENTIALS:      bool({ default: true }),
  CORS_MAX_AGE:          num({ default: 86400 }),

  RATE_LIMIT_WINDOW_MS:      num({ default: 900000 }),
  RATE_LIMIT_MAX_REQUESTS:   num({ default: 100 }),
  AUTH_RATE_LIMIT_WINDOW_MS: num({ default: 900000 }),
  AUTH_RATE_LIMIT_MAX:       num({ default: 20 }),
  RESET_RATE_LIMIT_MAX:      num({ default: 5 }),
  RATE_LIMIT_SKIP_IPS:       commaSeparated({ default: ['127.0.0.1', '::1'] }),

  EMAIL_PROVIDER:     emailProviderValidator({ default: 'smtp' }),
  EMAIL_FROM_ADDRESS: email({ default: 'noreply@lomashwood.co.uk' }),
  EMAIL_FROM_NAME:    str({ default: 'Lomash Wood' }),

  SMTP_HOST:                str({ default: 'smtp.mailtrap.io' }),
  SMTP_PORT:                port({ default: 587 }),
  SMTP_SECURE:              bool({ default: false }),
  SMTP_USER:                str({ default: '' }),
  SMTP_PASS:                str({ default: '' }),
  SMTP_REJECT_UNAUTHORIZED: bool({ default: false }),

  AWS_SES_REGION:            str({ default: 'eu-west-2' }),
  AWS_SES_ACCESS_KEY_ID:     str({ default: '' }),
  AWS_SES_SECRET_ACCESS_KEY: str({ default: '' }),
  AWS_SES_SEND_RATE:         num({ default: 14 }),

  LOG_LEVEL:      logLevelValidator({ default: 'info' }),
  LOG_FORMAT:     logFormatValidator({ default: 'pretty' }),
  LOG_HTTP_BODY:  bool({ default: false }),
  LOG_FILE_PATH:  str({ default: '' }),
  LOG_REQUEST_ID: bool({ default: true }),

  CSRF_ENABLED:   bool({ default: true }),
  CSRF_SECRET:    str({ default: '' }),
  HELMET_ENABLED: bool({ default: true }),
  CSP_ENABLED:    bool({ default: false }),
  HSTS_MAX_AGE:   num({ default: 31536000 }),

  COOKIE_DOMAIN:    str({ default: 'localhost' }),
  COOKIE_SAME_SITE: str({ default: 'lax' }),
  COOKIE_MAX_AGE:   num({ default: 604800000 }),
  COOKIE_HTTP_ONLY: bool({ default: true }),
  COOKIE_SECURE:    bool({ default: false }),
  COOKIE_SECRET:    str({ default: '' }),

  JOBS_ENABLED:                       bool({ default: true }),
  JOB_CLEANUP_SESSIONS_CRON:          str({ default: '0 * * * *' }),
  JOB_ROTATE_TOKENS_CRON:             str({ default: '0 2 * * *' }),
  JOB_EXPIRE_PASSWORD_RESET_CRON:     str({ default: '*/30 * * * *' }),
  JOB_DEACTIVATE_INACTIVE_USERS_CRON: str({ default: '0 3 * * 0' }),
  INACTIVE_USER_THRESHOLD_DAYS:       num({ default: 365 }),

  EVENT_BUS_PROVIDER:      eventBusProviderValidator({ default: 'redis' }),
  KAFKA_BROKERS:           commaSeparated({ default: ['localhost:9092'] }),
  KAFKA_CLIENT_ID:         str({ default: 'lomash-auth-service' }),
  KAFKA_GROUP_ID:          str({ default: 'lomash-auth-group' }),
  RABBITMQ_URL:            str({ default: 'amqp://guest:guest@localhost:5672' }),
  EVENT_BUS_STREAM_PREFIX: str({ default: 'lomash:events:' }),

  OTEL_ENABLED:                bool({ default: false }),
  OTEL_EXPORTER_OTLP_ENDPOINT: url({ default: 'http://localhost:4318' }),
  OTEL_SERVICE_NAME:           str({ default: 'lomash-auth-service' }),
  SENTRY_DSN:                  str({ default: '' }),
  SENTRY_ENVIRONMENT:          str({ default: 'development' }),
  SENTRY_TRACES_SAMPLE_RATE:   num({ default: 0.1 }),

  INTERNAL_API_KEY:          str({ default: '' }),
  CUSTOMER_SERVICE_URL:      url({ default: 'http://localhost:3005' }),
  NOTIFICATION_SERVICE_URL:  url({ default: 'http://localhost:3007' }),
  INTER_SERVICE_TIMEOUT_MS:  num({ default: 5000 }),
  INTER_SERVICE_RETRY_COUNT: num({ default: 3 }),

  SEED_ADMIN_EMAIL:      str({ default: 'admin@lomashwood.co.uk' }),
  SEED_ADMIN_PASSWORD:   str({ default: '' }),
  SEED_ADMIN_FIRST_NAME: str({ default: 'Super' }),
  SEED_ADMIN_LAST_NAME:  str({ default: 'Admin' }),

  TEST_DATABASE_URL:       str({ default: '' }),
  TEST_REDIS_URL:          str({ default: '' }),
  TEST_JOBS_ENABLED:       bool({ default: false }),
  TEST_EVENT_BUS_PROVIDER: str({ default: 'disabled' }),
});

// ─── Derived helpers ──────────────────────────────────────────────────────────

export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction  = env.NODE_ENV === 'production';
export const isTest        = env.NODE_ENV === 'test';
export const isStaging     = env.NODE_ENV === 'staging';

export const effectiveDatabaseUrl = isTest && env.TEST_DATABASE_URL !== ''
  ? env.TEST_DATABASE_URL
  : env.DATABASE_URL;

export const effectiveRedisUrl = isTest && env.TEST_REDIS_URL !== ''
  ? env.TEST_REDIS_URL
  : env.REDIS_URL;

export const jobsEnabled = isTest
  ? env.TEST_JOBS_ENABLED
  : env.JOBS_ENABLED;

export const eventBusProvider = isTest
  ? (env.TEST_EVENT_BUS_PROVIDER as 'kafka' | 'rabbitmq' | 'redis' | 'disabled')
  : env.EVENT_BUS_PROVIDER;