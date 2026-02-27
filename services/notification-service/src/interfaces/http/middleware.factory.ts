import {
  RequestHandler,
  ErrorRequestHandler,
  Request,
  Response,
  NextFunction,
} from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { ZodError } from 'zod';
import { Logger } from 'winston';
import type { AppDependencies } from './express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}



export const authMiddleware: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        statusCode: 401,
        message: 'Missing or malformed Authorization header',
      });
      return;
    }

    const token = authHeader.slice(7);

   
    const { verifyServiceToken } = await import('../../shared/utils');
    const user = await verifyServiceToken(token);

    (req as AuthenticatedRequest).user = user;
    next();
  } catch {
    res.status(401).json({
      success: false,
      statusCode: 401,
      message: 'Invalid or expired token',
    });
  }
};

export function requireRole(...roles: string[]): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      res.status(401).json({ success: false, statusCode: 401, message: 'Unauthenticated' });
      return;
    }

    if (!roles.includes(user.role)) {
      res.status(403).json({
        success: false,
        statusCode: 403,
        message: `Access denied. Required role: ${roles.join(' | ')}`,
      });
      return;
    }

    next();
  };
}


export function createMiddlewareFactory(deps: Pick<AppDependencies, 'logger' | 'config'>) {
  function cors_(): RequestHandler {
    return cors({
      origin: (origin, cb) => {
        if (!origin || deps.config.corsOrigins.includes(origin)) return cb(null, true);
        cb(new Error(`CORS: origin ${origin} not allowed`));
      },
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
      credentials: true,
      maxAge: 86_400,
    });
  }

  function rateLimit_(): RequestHandler {
    return rateLimit({
      windowMs: deps.config.rateLimit.windowMs,
      max: deps.config.rateLimit.max,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        statusCode: 429,
        message: 'Too many requests — please try again later',
      },
    });
  }

  function requestLogger(): RequestHandler {
    return (req: Request, res: Response, next: NextFunction): void => {
      const start = Date.now();
      const requestId =
        (req.headers['x-request-id'] as string) ??
        Math.random().toString(36).slice(2);

      res.setHeader('X-Request-ID', requestId);

      res.on('finish', () => {
        deps.logger.info('HTTP request', {
          requestId,
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          durationMs: Date.now() - start,
          userAgent: req.headers['user-agent'],
          ip: req.ip,
        });
      });

      next();
    };
  }

  function errorHandler(): ErrorRequestHandler {
    return (
      err: unknown,
      _req: Request,
      res: Response,
      _next: NextFunction,
    ): void => {
      
      if (err instanceof ZodError) {
        res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'Validation error',
          errors: err.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }

      
      const appErr = err as { statusCode?: number; code?: string; message?: string };
      if (appErr.statusCode) {
        res.status(appErr.statusCode).json({
          success: false,
          statusCode: appErr.statusCode,
          code: appErr.code,
          message: appErr.message,
        });
        return;
      }

      
      deps.logger.error('Unhandled error', {
        error: (err as Error).message,
        stack: (err as Error).stack,
      });

      res.status(500).json({
        success: false,
        statusCode: 500,
        message: 'Internal server error',
      });
    };
  }

  return { cors: cors_, rateLimit: rateLimit_, requestLogger, errorHandler };
}