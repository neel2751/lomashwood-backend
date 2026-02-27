import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';
import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { config } from '../config';

const cfg = config as any;

const getRedisUrl = (): string => cfg.redis?.url || cfg.redisUrl || 'redis://localhost:6379';
const getRedisEnabled = (): boolean => cfg.redis?.enabled ?? cfg.redisEnabled ?? false;
const getRateLimitWindowMs = (): number => cfg.rateLimit?.windowMs || 15 * 60 * 1000;
const getRateLimitMax = (): number => cfg.rateLimit?.max || cfg.rateLimit?.maxRequests || 100;
const getWhitelistedIPs = (): string[] => cfg.rateLimit?.whitelistedIPs || cfg.rateLimit?.whitelist || [];

const redisClient = createClient({
  url: getRedisUrl(),
  socket: {
    reconnectStrategy: (retries: number) => {
      if (retries > 10) {
        logger.error('Redis reconnection failed after 10 attempts');
        return new Error('Redis reconnection failed');
      }
      return Math.min(retries * 100, 3000);
    }
  }
});

redisClient.on('error', (err) => {
  logger.error('Redis client error:', err);
});

redisClient.on('connect', () => {
  logger.info('Redis client connected for rate limiting');
});

redisClient.connect().catch((err) => {
  logger.error('Failed to connect Redis client:', err);
});

const createRateLimitStore = () => {
  if (getRedisEnabled()) {
    return new RedisStore({
      sendCommand: (...args: string[]) => redisClient.sendCommand(args),
      prefix: 'rl:',
    });
  }
  return undefined;
};

const rateLimitHandler = (req: Request, res: Response) => {
  logger.warn(`Rate limit exceeded for IP: ${req.ip ?? 'unknown'}, Path: ${req.path}`);

  res.status(429).json({
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: res.getHeader('Retry-After')
    }
  });
};

export const globalRateLimit = rateLimit({
  windowMs: getRateLimitWindowMs(),
  max: getRateLimitMax(),
  standardHeaders: true,
  legacyHeaders: false,
  store: createRateLimitStore(),
  handler: rateLimitHandler,
  skip: (req) => {
    const whitelistedIPs = getWhitelistedIPs();
    return whitelistedIPs.includes(req.ip || '');
  },
  keyGenerator: (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    const forwardedStr = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return req.ip || forwardedStr || 'unknown';
  }
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRateLimitStore(),
  handler: rateLimitHandler,
  keyGenerator: (req) => {
    return `auth:${req.ip || 'unknown'}`;
  },
  skipSuccessfulRequests: true
});

export const strictAuthRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRateLimitStore(),
  handler: rateLimitHandler,
  keyGenerator: (req) => {
    return `strict-auth:${req.ip || 'unknown'}`;
  }
});

export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRateLimitStore(),
  handler: rateLimitHandler,
  keyGenerator: (req) => {
    const userId = (req as any).user?.id;
    return userId ? `api:user:${userId}` : `api:ip:${req.ip || 'unknown'}`;
  }
});

export const uploadRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRateLimitStore(),
  handler: rateLimitHandler,
  keyGenerator: (req) => {
    const userId = (req as any).user?.id;
    return userId ? `upload:user:${userId}` : `upload:ip:${req.ip || 'unknown'}`;
  }
});

export const contactFormRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRateLimitStore(),
  handler: rateLimitHandler,
  keyGenerator: (req) => {
    return `contact:${req.ip || 'unknown'}`;
  }
});

export const brochureRequestRateLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRateLimitStore(),
  handler: rateLimitHandler,
  keyGenerator: (req) => {
    const email = req.body?.email;
    return email ? `brochure:email:${email}` : `brochure:ip:${req.ip || 'unknown'}`;
  }
});

export const appointmentRateLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRateLimitStore(),
  handler: rateLimitHandler,
  keyGenerator: (req) => {
    const email = req.body?.email;
    return email ? `appointment:email:${email}` : `appointment:ip:${req.ip || 'unknown'}`;
  }
});

export const businessInquiryRateLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 2,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRateLimitStore(),
  handler: rateLimitHandler,
  keyGenerator: (req) => {
    const email = req.body?.email;
    return email ? `business:email:${email}` : `business:ip:${req.ip || 'unknown'}`;
  }
});

export const newsletterRateLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 1,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRateLimitStore(),
  handler: rateLimitHandler,
  keyGenerator: (req) => {
    const email = req.body?.email;
    return email ? `newsletter:email:${email}` : `newsletter:ip:${req.ip || 'unknown'}`;
  }
});

export const searchRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRateLimitStore(),
  handler: rateLimitHandler,
  keyGenerator: (req) => {
    return `search:${req.ip || 'unknown'}`;
  }
});

export const createCustomRateLimit = (options: {
  windowMs: number;
  max: number;
  prefix: string;
}) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    standardHeaders: true,
    legacyHeaders: false,
    store: createRateLimitStore(),
    handler: rateLimitHandler,
    keyGenerator: (req) => {
      return `${options.prefix}:${req.ip || 'unknown'}`;
    }
  });
};

export const rateLimitMiddleware = {
  global: globalRateLimit,
  auth: authRateLimit,
  strictAuth: strictAuthRateLimit,
  api: apiRateLimit,
  upload: uploadRateLimit,
  contactForm: contactFormRateLimit,
  brochureRequest: brochureRequestRateLimit,
  appointment: appointmentRateLimit,
  businessInquiry: businessInquiryRateLimit,
  newsletter: newsletterRateLimit,
  search: searchRateLimit,
  custom: createCustomRateLimit
};