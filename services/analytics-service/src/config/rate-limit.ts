import rateLimit, { type Options } from 'express-rate-limit';
import type { RequestHandler } from 'express';

import { env } from './env';

const baseOptions: Partial<Options> = {
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) =>
    req.path === '/health' ||
    req.path === '/health/live' ||
    req.path === '/health/ready',
  keyGenerator: (req) =>
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ??
    req.ip ??
    'unknown',
};

export const rateLimitMiddleware = rateLimit({
  ...baseOptions,
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  skipSuccessfulRequests: env.RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
    retryAfter: Math.ceil(env.RATE_LIMIT_WINDOW_MS / 1000),
  },
}) as unknown as RequestHandler;

export const trackingRateLimiter = rateLimit({
  ...baseOptions,
  windowMs: 60_000,
  max: 1000,
  message: {
    success: false,
    message: 'Tracking rate limit exceeded.',
  },
}) as unknown as RequestHandler;

export const exportRateLimiter = rateLimit({
  ...baseOptions,
  windowMs: 60_000,
  max: 10,
  message: {
    success: false,
    message: 'Export creation rate limit exceeded. Maximum 10 exports per minute.',
  },
}) as unknown as RequestHandler;

export const dashboardRateLimiter = rateLimit({
  ...baseOptions,
  windowMs: 60_000,
  max: 120,
  message: {
    success: false,
    message: 'Dashboard rate limit exceeded.',
  },
}) as unknown as RequestHandler;