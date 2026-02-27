import { Application, Request, Response, NextFunction } from 'express';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { randomUUID } from 'crypto';
import { logger } from '../../config/logger';
import { env } from '../../config/env';

export function applySecurityMiddleware(app: Application): void {
  app.use(
    helmet({
      contentSecurityPolicy: env.NODE_ENV === 'production',
      crossOriginEmbedderPolicy: env.NODE_ENV === 'production',
      hsts: env.NODE_ENV === 'production' ? { maxAge: 31536000, includeSubDomains: true } : false,
    }),
  );
}

export function applyCorsMiddleware(app: Application): void {
  const allowedOrigins = env.ALLOWED_ORIGINS
    ? env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : [];

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.length === 0) {
          callback(null, true);
          return;
        }
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`CORS: origin ${origin} not allowed`));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Correlation-ID'],
      exposedHeaders: ['X-Request-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
      maxAge: 86400,
    }),
  );
}

export function applyBodyParserMiddleware(app: Application): void {
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
}

export function applyCompressionMiddleware(app: Application): void {
  app.use(
    compression({
      level: 6,
      threshold: 1024,
      filter(req, res) {
        if (req.headers['x-no-compression']) return false;
        return compression.filter(req, res);
      },
    }),
  );
}

export function applyRequestContextMiddleware(app: Application): void {
  app.use((req: Request, _res: Response, next: NextFunction) => {
    req.requestId = (req.headers['x-request-id'] as string) ?? randomUUID();
    req.startTime = Date.now();
    next();
  });
}

export function applyRequestLoggingMiddleware(app: Application): void {
  app.use((req: Request, res: Response, next: NextFunction) => {
    const startTime = req.startTime ?? Date.now();

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const level =
        res.statusCode >= 500
          ? 'error'
          : res.statusCode >= 400
            ? 'warn'
            : 'info';

      logger[level]({
        requestId: req.requestId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        durationMs: duration,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        userId: req.user?.userId,
      });
    });

    next();
  });
}

export function applyNotFoundMiddleware(app: Application): void {
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'The requested resource does not exist',
      },
    });
  });
}

export function applyErrorMiddleware(app: Application): void {
  app.use((err: Error & { statusCode?: number; code?: string; details?: unknown }, req: Request, res: Response, _next: NextFunction) => {
    const statusCode = err.statusCode ?? 500;
    const isOperational = statusCode < 500;

    if (!isOperational) {
      logger.error({
        requestId: req.requestId,
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
      });
    }

    res.status(statusCode).json({
      success: false,
      error: {
        code: err.code ?? 'INTERNAL_SERVER_ERROR',
        message: isOperational ? err.message : 'An unexpected error occurred',
        ...(err.details && { details: err.details }),
      },
      requestId: req.requestId,
    });
  });
}

export function applyAllMiddleware(app: Application): void {
  applySecurityMiddleware(app);
  applyCorsMiddleware(app);
  applyCompressionMiddleware(app);
  applyBodyParserMiddleware(app);
  applyRequestContextMiddleware(app);
  applyRequestLoggingMiddleware(app);
}