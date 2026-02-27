import { Options } from 'express-rate-limit';
import { redis } from '../infrastructure/cache/redis.client';
import { REDIS_KEYS } from '../infrastructure/cache/redis.keys';
import { env } from './env';

export type RateLimitTier = 'global' | 'auth' | 'write' | 'sensitive';

export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: string;
  skipSuccessfulRequests?: boolean;
}

export const rateLimitConfigs: Record<RateLimitTier, RateLimitConfig> = {
  global: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    message: 'Too many requests, please try again later.',
  },
  auth: {
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: 'Too many authentication attempts, please try again in 15 minutes.',
    skipSuccessfulRequests: true,
  },
  write: {
    windowMs: 60 * 1000,
    max: 30,
    message: 'Too many write requests, please slow down.',
  },
  sensitive: {
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: 'Too many attempts for this action, please try again in an hour.',
  },
};

export function buildRateLimitOptions(tier: RateLimitTier): Partial<Options> {
  const config = rateLimitConfigs[tier];

  return {
    windowMs: config.windowMs,
    max: config.max,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: config.skipSuccessfulRequests ?? false,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: config.message,
      },
    },
    keyGenerator(req) {
      const customerId = (req as any).user?.id;
      const endpoint = req.path.replace(/\/[a-f0-9-]{36}/g, '/:id');

      if (customerId) {
        return REDIS_KEYS.rateLimit.byCustomer(customerId, endpoint);
      }

      const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
      return REDIS_KEYS.rateLimit.byIp(ip, endpoint);
    },
    skip(req) {
      return req.path.startsWith('/health');
    },
    handler(req, res, _next, options) {
      res.status(options.statusCode ?? 429).json(options.message);
    },
  };
}

export async function isRateLimited(
  key: string,
  max: number,
  windowSeconds: number,
): Promise<{ limited: boolean; remaining: number; resetAt: number }> {
  const current = await redis.incr(key);

  if (current === 1) {
    await redis.expire(key, windowSeconds);
  }

  const ttl = await redis.ttl(key);
  const resetAt = Date.now() + ttl * 1000;
  const remaining = Math.max(0, max - current);

  return {
    limited: current > max,
    remaining,
    resetAt,
  };
}