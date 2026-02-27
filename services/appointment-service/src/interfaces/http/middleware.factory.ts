import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ZodSchema } from 'zod';

export type MiddlewareFn = (req: Request, res: Response, next: NextFunction) => void | Promise<void>;

export class MiddlewareFactory {
  static compose(...middlewares: RequestHandler[]): RequestHandler {
    return (req: Request, res: Response, next: NextFunction): void => {
      let index = 0;

      const run = (i: number): void => {
        if (i >= middlewares.length) {
          next();
          return;
        }

        const middleware = middlewares[i];

        try {
          Promise.resolve(middleware(req, res, (err?: unknown) => {
            if (err) {
              next(err);
              return;
            }
            run(i + 1);
          })).catch(next);
        } catch (err) {
          next(err);
        }
      };

      run(index);
    };
  }

  static conditional(
    condition: (req: Request) => boolean,
    middleware: RequestHandler
  ): RequestHandler {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (condition(req)) {
        middleware(req, res, next);
      } else {
        next();
      }
    };
  }

  static unless(
    paths: string[],
    middleware: RequestHandler
  ): RequestHandler {
    return (req: Request, res: Response, next: NextFunction): void => {
      const excluded = paths.some((path) => req.path.startsWith(path));
      if (excluded) {
        next();
      } else {
        middleware(req, res, next);
      }
    };
  }

  static timeout(ms: number): RequestHandler {
    return (req: Request, res: Response, next: NextFunction): void => {
      const timer = setTimeout(() => {
        if (!res.headersSent) {
          res.status(408).json({
            success: false,
            error: 'Request timeout',
            statusCode: 408,
          });
        }
      }, ms);

      res.on('finish', () => clearTimeout(timer));
      res.on('close', () => clearTimeout(timer));

      next();
    };
  }

  static requestId(): RequestHandler {
    return (req: Request, res: Response, next: NextFunction): void => {
      const id =
        (req.headers['x-request-id'] as string) ||
        `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

      req.headers['x-request-id'] = id;
      res.setHeader('x-request-id', id);

      next();
    };
  }

  static cors(allowedOrigins: string[]): RequestHandler {
    return (req: Request, res: Response, next: NextFunction): void => {
      const origin = req.headers.origin as string;

      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin || '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
        res.setHeader(
          'Access-Control-Allow-Headers',
          'Content-Type,Authorization,x-request-id'
        );
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      }

      if (req.method === 'OPTIONS') {
        res.sendStatus(204);
        return;
      }

      next();
    };
  }

  static securityHeaders(): RequestHandler {
    return (_req: Request, res: Response, next: NextFunction): void => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      res.setHeader(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains'
      );
      res.removeHeader('X-Powered-By');
      next();
    };
  }

  static requireAuth(): RequestHandler {
    return (req: Request, res: Response, next: NextFunction): void => {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          statusCode: 401,
        });
        return;
      }

      next();
    };
  }

  static requireRole(...roles: string[]): RequestHandler {
    return (req: Request, res: Response, next: NextFunction): void => {
      const user = (req as Request & { user?: { role?: string } }).user;

      if (!user || !user.role || !roles.includes(user.role)) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          statusCode: 403,
        });
        return;
      }

      next();
    };
  }

  static asyncWrapper(fn: MiddlewareFn): RequestHandler {
    return (req: Request, res: Response, next: NextFunction): void => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  static rateLimit(options: {
    windowMs: number;
    max: number;
    message?: string;
  }): RequestHandler {
    const store = new Map<string, { count: number; resetTime: number }>();

    return (req: Request, res: Response, next: NextFunction): void => {
      const key = req.ip || req.socket.remoteAddress || 'unknown';
      const now = Date.now();
      const record = store.get(key);

      if (!record || now > record.resetTime) {
        store.set(key, { count: 1, resetTime: now + options.windowMs });
        next();
        return;
      }

      if (record.count >= options.max) {
        res.status(429).json({
          success: false,
          error: options.message || 'Too many requests',
          statusCode: 429,
        });
        return;
      }

      record.count += 1;
      next();
    };
  }
}

// ─── Auth Middleware ──────────────────────────────────────────────────────────

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  // TODO: verify JWT token here
  next();
};

// ─── Admin Middleware ─────────────────────────────────────────────────────────

export const adminMiddleware = (_req: Request, _res: Response, next: NextFunction): void => {
  // TODO: check user role from req.user
  next();
};

// ─── Validate Request Middleware ──────────────────────────────────────────────

export const validateRequest = (schemas: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query);
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};