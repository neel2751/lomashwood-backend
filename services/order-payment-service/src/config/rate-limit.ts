import rateLimit, { RateLimitRequestHandler, Options } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redisClient } from '../infrastructure/cache/redis.client';
import { RedisKeys } from '../infrastructure/cache/redis.keys';
import { env } from './env';
import { logger } from './logger';

type LimiterName =
  | 'global'
  | 'refundRead'
  | 'refundCreate'
  | 'paymentCreate'
  | 'orderRead'
  | 'orderCreate'
  | 'webhookStripe'
  | 'webhookRazorpay'
  | 'invoiceRead'
  | 'healthCheck';

type LimiterConfig = {
  windowMs:    number;
  max:         number;
  message:     string;
  skipSuccess: boolean;
};

const LIMITER_CONFIGS: Record<LimiterName, LimiterConfig> = {
  global: {
    windowMs:    env.RATE_LIMIT_WINDOW_MS,
    max:         env.RATE_LIMIT_MAX_GLOBAL,
    message:     'Too many requests — please try again later',
    skipSuccess: false,
  },
  refundRead: {
    windowMs:    60_000,
    max:         env.RATE_LIMIT_MAX_READ,
    message:     'Too many refund read requests — please slow down',
    skipSuccess: false,
  },
  refundCreate: {
    windowMs:    900_000,
    max:         env.RATE_LIMIT_MAX_CREATE,
    message:     'Too many refund requests — please wait before trying again',
    skipSuccess: false,
  },
  paymentCreate: {
    windowMs:    300_000,
    max:         20,
    message:     'Too many payment requests — please wait before trying again',
    skipSuccess: false,
  },
  orderRead: {
    windowMs:    60_000,
    max:         120,
    message:     'Too many order read requests — please slow down',
    skipSuccess: false,
  },
  orderCreate: {
    windowMs:    300_000,
    max:         30,
    message:     'Too many order creation requests — please wait before trying again',
    skipSuccess: false,
  },
  webhookStripe: {
    windowMs:    60_000,
    max:         500,
    message:     'Webhook rate limit exceeded',
    skipSuccess: true,
  },
  webhookRazorpay: {
    windowMs:    60_000,
    max:         500,
    message:     'Webhook rate limit exceeded',
    skipSuccess: true,
  },
  invoiceRead: {
    windowMs:    60_000,
    max:         60,
    message:     'Too many invoice read requests — please slow down',
    skipSuccess: false,
  },
  healthCheck: {
    windowMs:    60_000,
    max:         120,
    message:     'Too many health check requests',
    skipSuccess: true,
  },
};

function buildStore(name: LimiterName) {
  return new RedisStore({
    sendCommand: (...args: string[]) =>
      (redisClient as any).call(...args),
    prefix: RedisKeys.rateLimit.global(name),
  });
}

function buildLimiter(name: LimiterName): RateLimitRequestHandler {
  const config = LIMITER_CONFIGS[name];

  const options: Partial<Options> = {
    windowMs:         config.windowMs,
    max:              config.max,
    standardHeaders:  true,
    legacyHeaders:    false,
    skipSuccessfulRequests: config.skipSuccess,
    store:            buildStore(name),
    keyGenerator:     (req) => {
      const userId = (req as any).user?.id;
      return userId
        ? RedisKeys.rateLimit.user(userId, name)
        : RedisKeys.rateLimit.ip(req.ip ?? 'unknown', name);
    },
    handler: (_req, res) => {
      logger.warn('Rate limit exceeded', { limiter: name });
      res.status(429).json({
        success: false,
        error: {
          code:    'RATE_LIMIT_EXCEEDED',
          message: config.message,
        },
      });
    },
    skip: (req) => {
      if (env.NODE_ENV === 'test') return true;
      if (req.ip === '127.0.0.1' || req.ip === '::1') return true;
      return false;
    },
  };

  return rateLimit(options);
}

const limiterCache = new Map<LimiterName, RateLimitRequestHandler>();

export function rateLimiter(name: LimiterName): RateLimitRequestHandler {
  if (!limiterCache.has(name)) {
    limiterCache.set(name, buildLimiter(name));
  }
  return limiterCache.get(name)!;
}