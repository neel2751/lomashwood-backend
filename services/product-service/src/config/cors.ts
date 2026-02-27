import { CorsOptions } from 'cors';
import { env, isDevelopment, isProduction } from './env';
import { logger } from './logger';

const allowedOrigins: string[] = env.CORS_ORIGIN.split(',').map(origin => origin.trim());

const productionOrigins = [
  'https://lomashwood.com',
  'https://www.lomashwood.com',
  'https://admin.lomashwood.com',
  'https://api.lomashwood.com',
];

const developmentOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
];

const stagingOrigins = [
  'https://staging.lomashwood.com',
  'https://staging-admin.lomashwood.com',
  'https://staging-api.lomashwood.com',
];

function getAllowedOrigins(): string[] {
  if (env.CORS_ORIGIN === '*') {
    if (isProduction()) {
      logger.warn('CORS wildcard (*) is not recommended for production');
      return productionOrigins;
    }
    return ['*'];
  }

  const origins = [...allowedOrigins];

  if (isDevelopment()) {
    origins.push(...developmentOrigins);
  } else if (env.NODE_ENV === 'staging') {
    origins.push(...stagingOrigins);
  } else if (isProduction()) {
    origins.push(...productionOrigins);
  }

  const uniqueOrigins = Array.from(new Set(origins));
  logger.info('CORS allowed origins configured', { count: uniqueOrigins.length });
  
  return uniqueOrigins;
}

function isOriginAllowed(origin: string | undefined, allowedList: string[]): boolean {
  if (!origin) {
    return true;
  }

  if (allowedList.includes('*')) {
    return true;
  }

  if (allowedList.includes(origin)) {
    return true;
  }

  const wildcardOrigins = allowedList.filter(o => o.includes('*'));
  for (const wildcardOrigin of wildcardOrigins) {
    const pattern = wildcardOrigin
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*');
    const regex = new RegExp(`^${pattern}$`);
    if (regex.test(origin)) {
      return true;
    }
  }

  return false;
}

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    const allowedList = getAllowedOrigins();

    if (isOriginAllowed(origin, allowedList)) {
      callback(null, true);
    } else {
      logger.warn('CORS origin rejected', { origin, allowedList });
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
    'X-Client-Version',
    'Accept',
    'Accept-Language',
    'Cache-Control',
    'Idempotency-Key',
  ],
  exposedHeaders: [
    'X-Request-ID',
    'X-Response-Time',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
    'Content-Disposition',
    'ETag',
    'Last-Modified',
  ],
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

export const strictCorsOptions: CorsOptions = {
  origin: (origin, callback) => {
    const allowedList = isProduction() 
      ? productionOrigins 
      : getAllowedOrigins();

    if (isOriginAllowed(origin, allowedList)) {
      callback(null, true);
    } else {
      logger.warn('Strict CORS origin rejected', { origin });
      callback(new Error('Not allowed by strict CORS policy'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Request-ID',
  ],
  exposedHeaders: [
    'X-Request-ID',
    'X-Response-Time',
  ],
  maxAge: 3600,
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

export const publicCorsOptions: CorsOptions = {
  origin: '*',
  credentials: false,
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Accept',
    'Accept-Language',
    'Cache-Control',
  ],
  exposedHeaders: [
    'Content-Type',
    'Cache-Control',
    'ETag',
  ],
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

export const adminCorsOptions: CorsOptions = {
  origin: (origin, callback) => {
    const adminOrigins = isProduction()
      ? ['https://admin.lomashwood.com']
      : [
          'http://localhost:3001',
          'http://localhost:5174',
          'https://staging-admin.lomashwood.com',
        ];

    if (isOriginAllowed(origin, adminOrigins)) {
      callback(null, true);
    } else {
      logger.warn('Admin CORS origin rejected', { origin });
      callback(new Error('Not allowed by admin CORS policy'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Request-ID',
    'X-Admin-Token',
  ],
  exposedHeaders: [
    'X-Request-ID',
    'X-Response-Time',
  ],
  maxAge: 3600,
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

export function getCorsOptionsForPath(path: string): CorsOptions {
  if (path.startsWith('/api/v1/admin')) {
    return adminCorsOptions;
  }

  if (path.startsWith('/api/v1/public')) {
    return publicCorsOptions;
  }

  if (path.startsWith('/health') || path.startsWith('/metrics')) {
    return publicCorsOptions;
  }

  return corsOptions;
}

export function validateCorsConfiguration(): {
  valid: boolean;
  warnings: string[];
  errors: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];

  if (isProduction() && env.CORS_ORIGIN === '*') {
    errors.push('CORS wildcard (*) is not allowed in production');
  }

  if (isProduction() && !env.CORS_CREDENTIALS) {
    warnings.push('CORS credentials disabled in production');
  }

  const allowedList = getAllowedOrigins();
  if (allowedList.length === 0) {
    errors.push('No CORS origins configured');
  }

  allowedList.forEach(origin => {
    if (!origin.startsWith('http://') && !origin.startsWith('https://') && origin !== '*') {
      warnings.push(`Invalid origin format: ${origin}`);
    }

    if (origin.startsWith('http://') && isProduction()) {
      warnings.push(`HTTP origin in production: ${origin}`);
    }
  });

  return {
    valid: errors.length === 0,
    warnings,
    errors,
  };
}

export function logCorsConfiguration(): void {
  const allowedList = getAllowedOrigins();
  const validation = validateCorsConfiguration();

  logger.info('CORS configuration loaded', {
    environment: env.NODE_ENV,
    originsCount: allowedList.length,
    credentials: env.CORS_CREDENTIALS,
    wildcard: env.CORS_ORIGIN === '*',
  });

  if (validation.warnings.length > 0) {
    logger.warn('CORS configuration warnings', { warnings: validation.warnings });
  }

  if (validation.errors.length > 0) {
    logger.error('CORS configuration errors', { errors: validation.errors });
  }

  if (isDevelopment()) {
    logger.debug('CORS allowed origins', { origins: allowedList });
  }
}

export function isCorsEnabled(): boolean {
  return true;
}

export function getCorsOrigins(): string[] {
  return getAllowedOrigins();
}

logCorsConfiguration();