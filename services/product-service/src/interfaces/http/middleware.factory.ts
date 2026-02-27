import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ZodSchema } from 'zod';
import { logger } from '../../config/logger';
import { asyncHandler, validateRequest, AuthenticatedRequest } from './express';
import { AppError } from './express';

export interface MiddlewareConfig {
  name: string;
  handler: RequestHandler;
  enabled?: boolean;
  order?: number;
}

export interface CacheMiddlewareConfig {
  ttl: number;
  key?: (req: Request) => string;
  condition?: (req: Request) => boolean;
}

export interface LoggingMiddlewareConfig {
  includeBody?: boolean;
  includeQuery?: boolean;
  includeHeaders?: boolean;
  excludePaths?: string[];
}

export interface ValidationMiddlewareConfig {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
  headers?: ZodSchema;
}

export interface RateLimitMiddlewareConfig {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}

export interface AuthorizationMiddlewareConfig {
  roles?: string[];
  permissions?: string[];
  allowSelf?: boolean;
}

export class MiddlewareFactory {
  private middlewares: Map<string, MiddlewareConfig> = new Map();

  public register(config: MiddlewareConfig): this {
    this.middlewares.set(config.name, config);
    logger.debug(`Middleware registered: ${config.name}`);
    return this;
  }

  public get(name: string): RequestHandler | undefined {
    const middleware = this.middlewares.get(name);
    return middleware?.enabled !== false ? middleware?.handler : undefined;
  }

  public getAll(): RequestHandler[] {
    return Array.from(this.middlewares.values())
      .filter((m) => m.enabled !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map((m) => m.handler);
  }

  public static createLoggingMiddleware(
    config: LoggingMiddlewareConfig = {}
  ): RequestHandler {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (config.excludePaths?.includes(req.path)) {
        return next();
      }

      const startTime = Date.now();

      const logData: Record<string, any> = {
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      };

      if (config.includeQuery) {
        logData.query = req.query;
      }

      if (config.includeBody && req.method !== 'GET') {
        logData.body = req.body;
      }

      if (config.includeHeaders) {
        logData.headers = req.headers;
      }

      logger.info('Incoming request', logData);

      res.on('finish', () => {
        const duration = Date.now() - startTime;
        logger.info('Request completed', {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration: `${duration}ms`,
        });
      });

      next();
    };
  }

  public static createValidationMiddleware(
    config: ValidationMiddlewareConfig
  ): RequestHandler {
    return validateRequest(config);
  }

  public static createAuthorizationMiddleware(
    config: AuthorizationMiddlewareConfig
  ): RequestHandler {
    return asyncHandler(
      async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const authReq = req as AuthenticatedRequest;

        if (!authReq.user) {
          throw new AppError(401, 'Authentication required');
        }

        if (config.allowSelf && req.params.id === authReq.user.id) {
          return next();
        }

        if (config.roles && config.roles.length > 0) {
          if (!config.roles.includes(authReq.user.role)) {
            throw new AppError(
              403,
              `Access denied. Required roles: ${config.roles.join(', ')}`
            );
          }
        }

        if (config.permissions && config.permissions.length > 0) {
          throw new AppError(403, 'Insufficient permissions');
        }

        next();
      }
    );
  }

  public static createCacheMiddleware(
    config: CacheMiddlewareConfig
  ): RequestHandler {
    return asyncHandler(
      async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        if (req.method !== 'GET') {
          return next();
        }

        if (config.condition && !config.condition(req)) {
          return next();
        }

        const cacheKey = config.key
          ? config.key(req)
          : `cache:${req.originalUrl}`;

        next();
      }
    );
  }

  public static createTimeoutMiddleware(timeoutMs: number): RequestHandler {
    return (req: Request, res: Response, next: NextFunction): void => {
      const timeout = setTimeout(() => {
        if (!res.headersSent) {
          res.status(408).json({
            success: false,
            message: 'Request timeout',
          });
        }
      }, timeoutMs);

      res.on('finish', () => {
        clearTimeout(timeout);
      });

      next();
    };
  }

  public static createSanitizationMiddleware(): RequestHandler {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (req.body) {
        req.body = MiddlewareFactory.sanitizeObject(req.body);
      }

      if (req.query) {
        req.query = MiddlewareFactory.sanitizeObject(req.query);
      }

      if (req.params) {
        req.params = MiddlewareFactory.sanitizeObject(req.params);
      }

      next();
    };
  }

  private static sanitizeObject(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => MiddlewareFactory.sanitizeObject(item));
    }

    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = value
          .trim()
          .replace(/[<>]/g, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+=/gi, '');
      } else if (typeof value === 'object') {
        sanitized[key] = MiddlewareFactory.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  public static createContentTypeMiddleware(
    allowedTypes: string[] = ['application/json']
  ): RequestHandler {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (req.method === 'GET' || req.method === 'DELETE') {
        return next();
      }

      const contentType = req.get('content-type');

      if (!contentType) {
        throw new AppError(400, 'Content-Type header is required');
      }

      const isAllowed = allowedTypes.some((type) =>
        contentType.includes(type)
      );

      if (!isAllowed) {
        throw new AppError(
          415,
          `Unsupported content type. Allowed types: ${allowedTypes.join(', ')}`
        );
      }

      next();
    };
  }

  public static createIdempotencyMiddleware(): RequestHandler {
    const requestCache = new Map<string, any>();

    return asyncHandler(
      async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        if (req.method === 'GET' || req.method === 'DELETE') {
          return next();
        }

        const idempotencyKey = req.get('idempotency-key');

        if (!idempotencyKey) {
          return next();
        }

        const cachedResponse = requestCache.get(idempotencyKey);

        if (cachedResponse) {
          logger.info('Returning cached idempotent response', {
            idempotencyKey,
          });
          return res.status(cachedResponse.status).json(cachedResponse.data);
        }

        const originalJson = res.json.bind(res);
        res.json = function (data: any) {
          requestCache.set(idempotencyKey, {
            status: res.statusCode,
            data,
          });

          setTimeout(() => {
            requestCache.delete(idempotencyKey);
          }, 24 * 60 * 60 * 1000);

          return originalJson(data);
        };

        next();
      }
    );
  }

  public static createRequestIdMiddleware(): RequestHandler {
    return (req: Request, res: Response, next: NextFunction): void => {
      const requestId =
        req.get('x-request-id') ||
        `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      req.headers['x-request-id'] = requestId;
      res.setHeader('x-request-id', requestId);

      next();
    };
  }

  public static createCorsMiddleware(config: {
    origin?: string | string[];
    credentials?: boolean;
    methods?: string[];
    allowedHeaders?: string[];
  }): RequestHandler {
    return (req: Request, res: Response, next: NextFunction): void => {
      const origin = req.get('origin');

      if (config.origin) {
        const allowedOrigins = Array.isArray(config.origin)
          ? config.origin
          : [config.origin];

        if (origin && allowedOrigins.includes(origin)) {
          res.setHeader('Access-Control-Allow-Origin', origin);
        }
      } else {
        res.setHeader('Access-Control-Allow-Origin', '*');
      }

      if (config.credentials) {
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      }

      if (config.methods) {
        res.setHeader(
          'Access-Control-Allow-Methods',
          config.methods.join(', ')
        );
      }

      if (config.allowedHeaders) {
        res.setHeader(
          'Access-Control-Allow-Headers',
          config.allowedHeaders.join(', ')
        );
      }

      if (req.method === 'OPTIONS') {
        return res.status(204).send();
      }

      next();
    };
  }

  public static createPaginationMiddleware(): RequestHandler {
    return (req: Request, res: Response, next: NextFunction): void => {
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const limit = Math.min(
        100,
        Math.max(1, parseInt(req.query.limit as string, 10) || 10)
      );

      req.query.page = page.toString();
      req.query.limit = limit.toString();
      req.query.skip = ((page - 1) * limit).toString();

      next();
    };
  }
}

export const middlewareFactory = new MiddlewareFactory();

export function createLoggingMiddleware(
  config?: LoggingMiddlewareConfig
): RequestHandler {
  return MiddlewareFactory.createLoggingMiddleware(config);
}

export function createValidationMiddleware(
  config: ValidationMiddlewareConfig
): RequestHandler {
  return MiddlewareFactory.createValidationMiddleware(config);
}

export function createAuthorizationMiddleware(
  config: AuthorizationMiddlewareConfig
): RequestHandler {
  return MiddlewareFactory.createAuthorizationMiddleware(config);
}

export function createCacheMiddleware(
  config: CacheMiddlewareConfig
): RequestHandler {
  return MiddlewareFactory.createCacheMiddleware(config);
}

export function createTimeoutMiddleware(timeoutMs: number): RequestHandler {
  return MiddlewareFactory.createTimeoutMiddleware(timeoutMs);
}

export function createSanitizationMiddleware(): RequestHandler {
  return MiddlewareFactory.createSanitizationMiddleware();
}

export function createContentTypeMiddleware(
  allowedTypes?: string[]
): RequestHandler {
  return MiddlewareFactory.createContentTypeMiddleware(allowedTypes);
}

export function createIdempotencyMiddleware(): RequestHandler {
  return MiddlewareFactory.createIdempotencyMiddleware();
}

export function createRequestIdMiddleware(): RequestHandler {
  return MiddlewareFactory.createRequestIdMiddleware();
}

export function createPaginationMiddleware(): RequestHandler {
  return MiddlewareFactory.createPaginationMiddleware();
}