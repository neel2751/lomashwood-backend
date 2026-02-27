import rateLimit, { Options as RateLimitOptions } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { Request, Response } from 'express';
import { env, isDevelopment, isProduction } from './env';
import { redisClient } from '../infrastructure/cache/redis.client';
import { logger } from './logger';

export interface RateLimitConfig extends Partial<RateLimitOptions> {
  name: string;
  windowMs: number;
  max: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}

const defaultKeyGenerator = (req: Request): string => {
  return req.ip || req.socket.remoteAddress || 'unknown';
};

const authKeyGenerator = (req: Request): string => {
  const userId = (req as any).user?.id;
  return userId || req.ip || 'anonymous';
};

const apiKeyGenerator = (req: Request): string => {
  const apiKey = req.get('x-api-key');
  return apiKey || req.ip || 'no-api-key';
};

function createRateLimitHandler(message: string) {
  return (req: Request, res: Response) => {
    const retryAfter = res.getHeader('Retry-After');
    const limit = res.getHeader('X-RateLimit-Limit');
    const remaining = res.getHeader('X-RateLimit-Remaining');

    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      retryAfter,
      limit,
      remaining,
    });

    res.status(429).json({
      success: false,
      error: 'Too many requests',
      message,
      retryAfter: retryAfter ? parseInt(retryAfter as string, 10) : null,
      limit: limit ? parseInt(limit as string, 10) : null,
    });
  };
}

function createSkipFunction(skipPaths: string[] = []) {
  return (req: Request): boolean => {
    if (isDevelopment() && req.ip === '127.0.0.1') {
      return true;
    }

    if (skipPaths.some(path => req.path.startsWith(path))) {
      return true;
    }

    return false;
  };
}

const store = isProduction()
  ? new RedisStore({
      sendCommand: (...args: string[]) => redisClient.sendCommand(args),
      prefix: 'rate-limit:',
    })
  : undefined;

export const globalRateLimitConfig: RateLimitConfig = {
  name: 'global',
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  store,
  keyGenerator: defaultKeyGenerator,
  skip: createSkipFunction(['/health', '/metrics']),
  handler: createRateLimitHandler('Global rate limit exceeded'),
};

export const strictRateLimitConfig: RateLimitConfig = {
  name: 'strict',
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many requests, please slow down',
  standardHeaders: true,
  legacyHeaders: false,
  store,
  keyGenerator: defaultKeyGenerator,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  handler: createRateLimitHandler('Strict rate limit exceeded'),
};

export const authRateLimitConfig: RateLimitConfig = {
  name: 'auth',
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  store,
  keyGenerator: defaultKeyGenerator,
  skipSuccessfulRequests: true,
  skipFailedRequests: false,
  handler: createRateLimitHandler('Authentication rate limit exceeded'),
};

export const apiRateLimitConfig: RateLimitConfig = {
  name: 'api',
  windowMs: 60 * 1000,
  max: 100,
  message: 'API rate limit exceeded',
  standardHeaders: true,
  legacyHeaders: false,
  store,
  keyGenerator: apiKeyGenerator,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  handler: createRateLimitHandler('API rate limit exceeded'),
};

export const readRateLimitConfig: RateLimitConfig = {
  name: 'read',
  windowMs: 60 * 1000,
  max: 200,
  message: 'Too many read requests',
  standardHeaders: true,
  legacyHeaders: false,
  store,
  keyGenerator: authKeyGenerator,
  skipSuccessfulRequests: false,
  skipFailedRequests: true,
  handler: createRateLimitHandler('Read rate limit exceeded'),
};

export const writeRateLimitConfig: RateLimitConfig = {
  name: 'write',
  windowMs: 60 * 1000,
  max: 20,
  message: 'Too many write requests',
  standardHeaders: true,
  legacyHeaders: false,
  store,
  keyGenerator: authKeyGenerator,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  handler: createRateLimitHandler('Write rate limit exceeded'),
};

export const uploadRateLimitConfig: RateLimitConfig = {
  name: 'upload',
  windowMs: 60 * 1000,
  max: 5,
  message: 'Too many upload requests',
  standardHeaders: true,
  legacyHeaders: false,
  store,
  keyGenerator: authKeyGenerator,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  handler: createRateLimitHandler('Upload rate limit exceeded'),
};

export const searchRateLimitConfig: RateLimitConfig = {
  name: 'search',
  windowMs: 60 * 1000,
  max: 50,
  message: 'Too many search requests',
  standardHeaders: true,
  legacyHeaders: false,
  store,
  keyGenerator: defaultKeyGenerator,
  skipSuccessfulRequests: false,
  skipFailedRequests: true,
  handler: createRateLimitHandler('Search rate limit exceeded'),
};

export const adminRateLimitConfig: RateLimitConfig = {
  name: 'admin',
  windowMs: 60 * 1000,
  max: 500,
  message: 'Admin rate limit exceeded',
  standardHeaders: true,
  legacyHeaders: false,
  store,
  keyGenerator: authKeyGenerator,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  handler: createRateLimitHandler('Admin rate limit exceeded'),
};

export const publicRateLimitConfig: RateLimitConfig = {
  name: 'public',
  windowMs: 60 * 1000,
  max: 50,
  message: 'Public API rate limit exceeded',
  standardHeaders: true,
  legacyHeaders: false,
  store,
  keyGenerator: defaultKeyGenerator,
  skipSuccessfulRequests: false,
  skipFailedRequests: true,
  handler: createRateLimitHandler('Public rate limit exceeded'),
};

export function createRateLimiter(config: RateLimitConfig) {
  const limiterConfig: Partial<RateLimitOptions> = {
    windowMs: config.windowMs,
    max: config.max,
    message: config.message,
    standardHeaders: config.standardHeaders ?? true,
    legacyHeaders: config.legacyHeaders ?? false,
    store: config.store || store,
    keyGenerator: config.keyGenerator || defaultKeyGenerator,
    skip: config.skip,
    skipSuccessfulRequests: config.skipSuccessfulRequests,
    skipFailedRequests: config.skipFailedRequests,
    handler: config.handler,
  };

  logger.info(`Rate limiter created: ${config.name}`, {
    windowMs: config.windowMs,
    max: config.max,
    hasStore: !!limiterConfig.store,
  });

  return rateLimit(limiterConfig);
}

export const globalRateLimiter = createRateLimiter(globalRateLimitConfig);
export const strictRateLimiter = createRateLimiter(strictRateLimitConfig);
export const authRateLimiter = createRateLimiter(authRateLimitConfig);
export const apiRateLimiter = createRateLimiter(apiRateLimitConfig);
export const readRateLimiter = createRateLimiter(readRateLimitConfig);
export const writeRateLimiter = createRateLimiter(writeRateLimitConfig);
export const uploadRateLimiter = createRateLimiter(uploadRateLimitConfig);
export const searchRateLimiter = createRateLimiter(searchRateLimitConfig);
export const adminRateLimiter = createRateLimiter(adminRateLimitConfig);
export const publicRateLimiter = createRateLimiter(publicRateLimitConfig);

export function getRateLimiterForPath(path: string) {
  if (path.startsWith('/api/v1/admin')) {
    return adminRateLimiter;
  }

  if (path.startsWith('/api/v1/public')) {
    return publicRateLimiter;
  }

  if (path.includes('/auth/') || path.includes('/login') || path.includes('/register')) {
    return authRateLimiter;
  }

  if (path.includes('/search')) {
    return searchRateLimiter;
  }

  if (path.includes('/upload')) {
    return uploadRateLimiter;
  }

  if (path.match(/\/(POST|PUT|PATCH|DELETE)/i)) {
    return writeRateLimiter;
  }

  return globalRateLimiter;
}

export function validateRateLimitConfiguration(): {
  valid: boolean;
  warnings: string[];
  errors: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];

  if (!store && isProduction()) {
    warnings.push('Redis store not configured for rate limiting in production');
  }

  if (env.RATE_LIMIT_MAX > 1000) {
    warnings.push('Global rate limit is very high (>1000 requests per window)');
  }

  if (env.RATE_LIMIT_MAX < 10) {
    warnings.push('Global rate limit is very low (<10 requests per window)');
  }

  if (env.RATE_LIMIT_WINDOW_MS < 60000) {
    warnings.push('Rate limit window is less than 1 minute');
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors,
  };
}

export function logRateLimitConfiguration(): void {
  const validation = validateRateLimitConfiguration();

  logger.info('Rate limit configuration loaded', {
    environment: env.NODE_ENV,
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    storeEnabled: !!store,
  });

  if (validation.warnings.length > 0) {
    logger.warn('Rate limit configuration warnings', { warnings: validation.warnings });
  }

  if (validation.errors.length > 0) {
    logger.error('Rate limit configuration errors', { errors: validation.errors });
  }
}

export function createCustomRateLimiter(
  windowMs: number,
  max: number,
  options?: Partial<RateLimitConfig>
) {
  return createRateLimiter({
    name: options?.name || 'custom',
    windowMs,
    max,
    ...options,
  });
}

logRateLimitConfiguration();