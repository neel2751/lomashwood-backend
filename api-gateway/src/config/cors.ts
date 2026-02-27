import { CorsOptions } from 'cors';
import { env, isDevelopment, isProduction } from './env';

const parseAllowedOrigins = (): string[] | string => {
  if (env.CORS_ORIGIN === '*') {
    return '*';
  }

  return env.CORS_ORIGIN.split(',').map((origin: string) => origin.trim());
};

const allowedOrigins = parseAllowedOrigins();

const isOriginAllowed = (origin: string | undefined): boolean => {
  if (!origin) {
    return true;
  }

  if (allowedOrigins === '*') {
    return true;
  }

  if (Array.isArray(allowedOrigins)) {
    return allowedOrigins.some((allowedOrigin: string) => {
      if (allowedOrigin === origin) {
        return true;
      }

      if (allowedOrigin.includes('*')) {
        const regex = new RegExp(
          '^' + allowedOrigin.replace(/\*/g, '.*') + '$'
        );
        return regex.test(origin);
      }

      return false;
    });
  }

  return false;
};

export const corsOptions: CorsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) => {
    if (isDevelopment) {
      callback(null, true);
      return;
    }

    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },

  credentials: env.CORS_CREDENTIALS,

  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Request-ID',
    'X-API-Key',
    'X-Session-ID',
    'Accept',
    'Accept-Language',
    'Accept-Encoding',
    'Origin',
    'Referer',
    'User-Agent',
  ],

  exposedHeaders: [
    'X-Request-ID',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
    'X-Total-Count',
    'X-Page',
    'X-Per-Page',
    'X-Total-Pages',
    'Content-Disposition',
  ],

  maxAge: isProduction ? 86400 : 600,

  preflightContinue: false,

  optionsSuccessStatus: 204,
};

export const allowedOriginsForWebSockets = (): string[] => {
  if (allowedOrigins === '*') {
    return ['*'];
  }

  return Array.isArray(allowedOrigins) ? allowedOrigins : [allowedOrigins];
};

export const corsOptionsForUpload: CorsOptions = {
  ...corsOptions,
  maxAge: 600,
  allowedHeaders: [
    ...corsOptions.allowedHeaders!,
    'Content-Length',
    'Content-Range',
    'X-File-Name',
    'X-File-Size',
    'X-File-Type',
  ],
};

export const corsOptionsForWebhooks: CorsOptions = {
  origin: (
    _origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) => {
    callback(null, true);
  },
  credentials: false,
  methods: ['POST'],
  allowedHeaders: [
    'Content-Type',
    'X-Webhook-Signature',
    'X-Webhook-ID',
    'X-Webhook-Timestamp',
  ],
  maxAge: 0,
};

export const getTrustedProxies = (): string[] | number | boolean => {
  if (!env.TRUST_PROXY) {
    return false;
  }

  if (env.TRUST_PROXY === true) {
    return 1;
  }

  const trustedProxies = env.ALLOWED_HOSTS.split(',').map((host: string) => host.trim());
  return trustedProxies.length > 0 ? trustedProxies : false;
};

// cspell:ignore nosniff
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': isProduction
    ? 'max-age=31536000; includeSubDomains; preload'
    : 'max-age=0',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
};

export const cspDirectives = {
  defaultSrc: ["'self'"],
  scriptSrc: [
    "'self'",
    "'unsafe-inline'",
    "'unsafe-eval'",
    'https://www.googletagmanager.com',
    'https://www.google-analytics.com',
  ],
  styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  imgSrc: [
    "'self'",
    'data:',
    'https:',
    'https://www.google-analytics.com',
    'https://www.googletagmanager.com',
  ],
  fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
  connectSrc: [
    "'self'",
    'https://www.google-analytics.com',
    'https://www.googletagmanager.com',
    env.FRONTEND_URL,
  ],
  frameSrc: ["'self'"],
  objectSrc: ["'none'"],
  mediaSrc: ["'self'"],
  manifestSrc: ["'self'"],
  workerSrc: ["'self'", 'blob:'],
  formAction: ["'self'"],
  frameAncestors: ["'none'"],
  baseUri: ["'self'"],
  upgradeInsecureRequests: isProduction ? [] : undefined,
};

export const rateLimitConfig = {
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: env.RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS,
  skipFailedRequests: env.RATE_LIMIT_SKIP_FAILED_REQUESTS,
  message: {
    error: 'Too many requests',
    message: 'You have exceeded the rate limit. Please try again later.',
  },
  handler: (_req: any, res: any) => {
    res.status(429).json({
      error: 'Too many requests',
      message: 'You have exceeded the rate limit. Please try again later.',
      retryAfter: res.getHeader('Retry-After'),
    });
  },
};

export const strictRateLimitConfig = {
  ...rateLimitConfig,
  windowMs: 60000,
  max: 10,
};

export const authRateLimitConfig = {
  ...rateLimitConfig,
  windowMs: 900000,
  max: 5,
  skipSuccessfulRequests: true,
  message: {
    error: 'Too many authentication attempts',
    message: 'Too many failed login attempts. Please try again later.',
  },
};

export const uploadRateLimitConfig = {
  ...rateLimitConfig,
  windowMs: 3600000,
  max: 50,
  message: {
    error: 'Too many upload requests',
    message: 'You have exceeded the upload limit. Please try again later.',
  },
};