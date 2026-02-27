import { Request, Response, NextFunction, RequestHandler } from 'express';
import { AnyZodObject, ZodError, z } from 'zod';
import { randomUUID } from 'crypto';
import { UserRole } from '../../shared/types';
import { AppError, UnauthorizedError, ForbiddenError, ValidationError } from '../../shared/errors';
import { logger } from '../../config/logger';
import { env } from '../../config/env';

// ── Request augmentation ───────────────────────────────────────────────────────

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      startTime: number;
      user?: AuthenticatedUser;
    }
  }
}

export type AuthenticatedUser = {
  id: string;
  email: string;
  role: UserRole;
  sessionId: string;
};

// ── Validation ─────────────────────────────────────────────────────────────────

type ValidateRequestSchema = {
  body?:   AnyZodObject;
  params?: AnyZodObject;
  query?:  AnyZodObject;
};

export function validateRequest(schemas: ValidateRequestSchema): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }

      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as typeof req.params;
      }

      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as typeof req.query;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formatted = error.errors.map((e) => ({
          field:   e.path.join('.'),
          message: e.message,
          code:    e.code,
        }));

        res.status(422).json({
          success: false,
          error: {
            code:    'VALIDATION_ERROR',
            message: 'Request validation failed',
            errors:  formatted,
          },
        });
        return;
      }

      next(error);
    }
  };
}

// ── Authentication ─────────────────────────────────────────────────────────────

export const authenticate: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token =
      authHeader?.startsWith('Bearer ')
        ? authHeader.slice(7)
        : req.cookies?.['access_token'];

    if (!token) {
      throw new UnauthorizedError('Authentication token is required');
    }

    const { verifyAccessToken } = await import('../../config/auth');
    const payload = await verifyAccessToken(token);

    req.user = {
      id:        payload.sub,
      email:     payload.email,
      role:      payload.role as UserRole,
      sessionId: payload.sessionId,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }

    next(new UnauthorizedError('Invalid or expired authentication token'));
  }
};

// ── Authorisation ──────────────────────────────────────────────────────────────

export function authorize(...roles: UserRole[]): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Authentication required'));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(
        new ForbiddenError(
          `Role "${req.user.role}" is not permitted to perform this action`,
        ),
      );
      return;
    }

    next();
  };
}

// ── Request logger ─────────────────────────────────────────────────────────────

export const requestLoggerMiddleware: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  req.requestId =
    (req.headers['x-request-id'] as string | undefined) ?? randomUUID();
  req.startTime = Date.now();

  res.setHeader('X-Request-ID', req.requestId);

  res.on('finish', () => {
    const durationMs = Date.now() - req.startTime;
    const level =
      res.statusCode >= 500
        ? 'error'
        : res.statusCode >= 400
        ? 'warn'
        : 'info';

    logger[level]('HTTP request completed', {
      requestId:  req.requestId,
      method:     req.method,
      url:        req.originalUrl,
      statusCode: res.statusCode,
      durationMs,
      userId:     req.user?.id ?? null,
      ip:         req.ip,
      userAgent:  req.headers['user-agent'] ?? null,
    });
  });

  next();
};

// ── Error handler ──────────────────────────────────────────────────────────────

export const errorMiddleware = (
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const requestId = req.requestId ?? randomUUID();

  if (error instanceof AppError) {
    if (error.statusCode >= 500) {
      logger.error('Application error', {
        requestId,
        code:       error.code,
        message:    error.message,
        statusCode: error.statusCode,
        stack:      env.NODE_ENV !== 'production' ? error.stack : undefined,
      });
    } else {
      logger.warn('Client error', {
        requestId,
        code:       error.code,
        message:    error.message,
        statusCode: error.statusCode,
      });
    }

    res.status(error.statusCode).json({
      success: false,
      error: {
        code:    error.code,
        message: error.message,
        ...(error instanceof ValidationError && error.errors
          ? { errors: error.errors }
          : {}),
      },
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  logger.error('Unhandled error', {
    requestId,
    message: error instanceof Error ? error.message : String(error),
    stack:   error instanceof Error ? error.stack   : undefined,
  });

  res.status(500).json({
    success: false,
    error: {
      code:    'INTERNAL_SERVER_ERROR',
      message:
        env.NODE_ENV === 'production'
          ? 'An unexpected error occurred'
          : error instanceof Error
          ? error.message
          : String(error),
    },
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
    },
  });
};

// ── Not found ──────────────────────────────────────────────────────────────────

export const notFoundMiddleware: RequestHandler = (
  req: Request,
  res: Response,
): void => {
  res.status(404).json({
    success: false,
    error: {
      code:    'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
    meta: {
      requestId: req.requestId ?? randomUUID(),
      timestamp: new Date().toISOString(),
    },
  });
};

// ── Timeout ────────────────────────────────────────────────────────────────────

export function timeoutMiddleware(timeoutMs: number): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        logger.warn('Request timeout', {
          requestId: req.requestId,
          method:    req.method,
          url:       req.originalUrl,
          timeoutMs,
        });

        res.status(408).json({
          success: false,
          error: {
            code:    'REQUEST_TIMEOUT',
            message: 'Request timed out',
          },
        });
      }
    }, timeoutMs);

    res.on('finish', () => clearTimeout(timer));
    res.on('close',  () => clearTimeout(timer));

    next();
  };
}

// ── Raw body preservation (Stripe / Razorpay webhooks) ─────────────────────────

export const preserveRawBody: RequestHandler = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  if (Buffer.isBuffer(req.body)) {
    (req as Request & { rawBody: Buffer }).rawBody = req.body;
  }
  next();
};