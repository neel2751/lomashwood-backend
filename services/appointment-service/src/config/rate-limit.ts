import { Request, Response, NextFunction } from 'express';
import { env } from './env';

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
  skip?: (req: Request) => boolean;
}

export interface RateLimitStore {
  increment(key: string): { count: number; resetTime: number };
  reset(key: string): void;
}

class InMemoryRateLimitStore implements RateLimitStore {
  private readonly records = new Map<string, { count: number; resetTime: number }>();

  increment(key: string): { count: number; resetTime: number } {
    const now = Date.now();
    const existing = this.records.get(key);

    if (!existing || now > existing.resetTime) {
      const record = { count: 1, resetTime: now + env.rateLimit.windowMs };
      this.records.set(key, record);
      return record;
    }

    existing.count += 1;
    return existing;
  }

  reset(key: string): void {
    this.records.delete(key);
  }
}

const store = new InMemoryRateLimitStore();

function defaultKeyGenerator(req: Request): string {
  return (
    req.headers['x-forwarded-for'] as string ||
    req.ip ||
    req.socket.remoteAddress ||
    'unknown'
  );
}

export function createRateLimiter(options: RateLimitOptions) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (options.skip?.(req)) {
      next();
      return;
    }

    const key = options.keyGenerator ? options.keyGenerator(req) : defaultKeyGenerator(req);
    const { count, resetTime } = store.increment(key);
    const remaining = Math.max(0, options.max - count);
    const resetSeconds = Math.ceil((resetTime - Date.now()) / 1000);

    res.setHeader('X-RateLimit-Limit', String(options.max));
    res.setHeader('X-RateLimit-Remaining', String(remaining));
    res.setHeader('X-RateLimit-Reset', String(resetSeconds));

    if (count > options.max) {
      res.setHeader('Retry-After', String(resetSeconds));
      res.status(429).json({
        success: false,
        statusCode: 429,
        error: options.message ?? 'Too many requests, please try again later.',
      });
      return;
    }

    next();
  };
}

export const globalRateLimit = createRateLimiter({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.max,
  message: 'Too many requests from this IP, please try again later.',
});

export const bookingRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Too many booking requests. Please wait before submitting again.',
  keyGenerator: (req: Request) => {
    const ip = req.headers['x-forwarded-for'] as string || req.ip || 'unknown';
    const userId = (req as Request & { user?: { id?: string } }).user?.id ?? 'guest';
    return `booking:${ip}:${userId}`;
  },
});

export const availabilityRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Too many availability requests. Please slow down.',
  keyGenerator: (req: Request) => {
    const ip = req.headers['x-forwarded-for'] as string || req.ip || 'unknown';
    return `availability:${ip}`;
  },
});

export const reminderRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Too many reminder requests. Please wait before requesting again.',
  keyGenerator: (req: Request) => {
    const userId = (req as Request & { user?: { id?: string } }).user?.id ?? 'guest';
    return `reminder:${userId}`;
  },
});

export const consultantRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  max: 60,
  message: 'Too many consultant requests. Please slow down.',
  keyGenerator: (req: Request) => {
    const ip = req.headers['x-forwarded-for'] as string || req.ip || 'unknown';
    return `consultant:${ip}`;
  },
});

export const adminRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  max: 200,
  message: 'Too many admin requests.',
  keyGenerator: (req: Request) => {
    const userId = (req as Request & { user?: { id?: string } }).user?.id ?? 'admin';
    return `admin:${userId}`;
  },
  skip: (req: Request) => {
    const user = (req as Request & { user?: { role?: string } }).user;
    return user?.role === 'SUPER_ADMIN';
  },
});

export const rateLimitConfig = {
  global: {
    windowMs: env.rateLimit.windowMs,
    max: env.rateLimit.max,
  },
  booking: {
    windowMs: 60 * 60 * 1000,
    max: 10,
  },
  availability: {
    windowMs: 60 * 1000,
    max: 30,
  },
  reminder: {
    windowMs: 60 * 60 * 1000,
    max: 5,
  },
  consultant: {
    windowMs: 60 * 1000,
    max: 60,
  },
  admin: {
    windowMs: 60 * 1000,
    max: 200,
  },
} as const;