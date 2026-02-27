import { type Options as RateLimitOptions } from 'express-rate-limit';

import { env } from '@config/env';

const sharedOptions: Partial<RateLimitOptions> = {
  standardHeaders: true,  
  legacyHeaders:   false,  
  skipSuccessfulRequests: false,
  skip: (req): boolean => {
    const ip = req.ip ?? '';
    return env.RATE_LIMIT_SKIP_IPS.includes(ip);
  },
  handler: (_req, res): void => {
    res.status(429).json({
      success: false,
      code:    'TOO_MANY_REQUESTS',
      message: 'Too many requests. Please try again later.',
    });
  },
};


export const globalRateLimitOptions: Partial<RateLimitOptions> = {
  ...sharedOptions,
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max:      env.RATE_LIMIT_MAX_REQUESTS,
  message:  'Too many requests from this IP, please try again later.',
};


export const authRateLimitOptions: Partial<RateLimitOptions> = {
  ...sharedOptions,
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
  max:      env.AUTH_RATE_LIMIT_MAX,
  message:  'Too many authentication attempts. Please try again later.',
};


export const resetRateLimitOptions: Partial<RateLimitOptions> = {
  ...sharedOptions,
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
  max:      env.RESET_RATE_LIMIT_MAX,
  message:  'Too many password reset requests. Please try again later.',
};