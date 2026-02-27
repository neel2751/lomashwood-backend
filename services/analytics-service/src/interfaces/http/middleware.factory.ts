import type { Application, RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';

import { env } from '../../config/env';

export function createRateLimiter(options?: {
  windowMs?: number;
  max?: number;
  message?: string;
}): RequestHandler {
  return rateLimit({
    windowMs: options?.windowMs ?? env.RATE_LIMIT_WINDOW_MS,
    max:      options?.max      ?? env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders:   false,
    message: {
      success: false,
      message: options?.message ?? 'Too many requests, please try again later.',
    },
    skip: (req) => req.path === '/health' || req.path === '/health/live',
  }) as unknown as RequestHandler; 
  
}

export function createTrackingRateLimiter(): RequestHandler {
  return createRateLimiter({
    windowMs: 60_000,
    max:      1000,
    message:  'Tracking rate limit exceeded',
  });
}

export function createExportRateLimiter(): RequestHandler {
  return createRateLimiter({
    windowMs: 60_000,
    max:      10,
    message:  'Export creation rate limit exceeded',
  });
}

export function applyRouteMiddleware(app: Application): void {
  app.use('/api/v1/tracking', createTrackingRateLimiter());
  app.use('/api/v1/exports',  createExportRateLimiter());
}