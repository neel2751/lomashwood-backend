import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { config } from '../config/configuration';

// General rate limiter for all requests
export const generalRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    success: false,
    message: config.rateLimit.message,
    error: 'TOO_MANY_REQUESTS',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: config.rateLimit.message,
      error: 'TOO_MANY_REQUESTS',
      retryAfter: Math.round(config.rateLimit.windowMs / 1000),
    });
  },
});

// Stricter rate limiter for authentication endpoints
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later',
    error: 'AUTH_RATE_LIMIT_EXCEEDED',
  },
  skipSuccessfulRequests: true,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts, please try again later',
      error: 'AUTH_RATE_LIMIT_EXCEEDED',
      retryAfter: 15 * 60, // 15 minutes
    });
  },
});

// Rate limiter for password reset
export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per hour
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again later',
    error: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Too many password reset attempts, please try again later',
      error: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
      retryAfter: 60 * 60, // 1 hour
    });
  },
});

// Rate limiter for file uploads
export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 uploads per hour
  message: {
    success: false,
    message: 'Too many upload attempts, please try again later',
    error: 'UPLOAD_RATE_LIMIT_EXCEEDED',
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Too many upload attempts, please try again later',
      error: 'UPLOAD_RATE_LIMIT_EXCEEDED',
      retryAfter: 60 * 60, // 1 hour
    });
  },
});

// Rate limiter for appointment bookings
export const appointmentRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 appointments per hour
  message: {
    success: false,
    message: 'Too many appointment booking attempts, please try again later',
    error: 'APPOINTMENT_RATE_LIMIT_EXCEEDED',
  },
  keyGenerator: (req: Request) => {
    // Use email for rate limiting if available, otherwise IP
    return req.body?.email || req.ip;
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Too many appointment booking attempts, please try again later',
      error: 'APPOINTMENT_RATE_LIMIT_EXCEEDED',
      retryAfter: 60 * 60, // 1 hour
    });
  },
});

// Rate limiter for contact forms
export const contactRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 contact form submissions per hour
  message: {
    success: false,
    message: 'Too many contact form submissions, please try again later',
    error: 'CONTACT_RATE_LIMIT_EXCEEDED',
  },
  keyGenerator: (req: Request) => {
    return req.body?.email || req.ip;
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Too many contact form submissions, please try again later',
      error: 'CONTACT_RATE_LIMIT_EXCEEDED',
      retryAfter: 60 * 60, // 1 hour
    });
  },
});
