import {
  Request,
  Response,
  NextFunction,
  RequestHandler,
  ErrorRequestHandler,
} from 'express';
import { ZodError, ZodSchema } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../config/logger';
import {
  AppError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
} from '../../shared/errors';



export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
  requestId?: string;
  startTime?: number;
}

type ValidationTarget = 'body' | 'query' | 'params';



export const requestLoggerMiddleware: RequestHandler = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): void => {
  req.requestId = uuidv4();
  req.startTime = Date.now();

  logger.info(
    {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    },
    'Incoming request',
  );

  next();
};



export const responseLoggerMiddleware: RequestHandler = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void => {
  const originalSend = res.send.bind(res);

  res.send = function (body: unknown): Response {
    const duration = req.startTime ? Date.now() - req.startTime : 0;

    logger.info(
      {
        requestId: req.requestId,
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
      },
      'Outgoing response',
    );

    return originalSend(body);
  };

  next();
};



export const requireAuth: RequestHandler = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: {
        code: 'MISSING_TOKEN',
        message: 'Authorization token is required.',
      },
    });
    return;
  }

  
  
  const userPayload = req.headers['x-user-payload'];
  if (!userPayload || typeof userPayload !== 'string') {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired token.',
      },
    });
    return;
  }

  try {
    req.user = JSON.parse(
      Buffer.from(userPayload, 'base64').toString('utf-8'),
    ) as {
      id: string;
      email: string;
      role: string;
    };
    next();
  } catch {
    res.status(401).json({
      success: false,
      error: {
        code: 'MALFORMED_TOKEN',
        message: 'Token payload is malformed.',
      },
    });
  }
};



export function requireRole(...roles: string[]): RequestHandler {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Authentication required.',
        },
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Access restricted. Required role: ${roles.join(' or ')}.`,
        },
      });
      return;
    }

    next();
  };
}



export const requireAdmin: RequestHandler = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHENTICATED',
        message: 'Authentication required.',
      },
    });
    return;
  }

  if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
    res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Admin access required.',
      },
    });
    return;
  }

  next();
};



export function validateRequest(
  schema: ZodSchema,
  target: ValidationTarget = 'body',
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const fieldErrors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));

      res.status(422).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed.',
          fields: fieldErrors,
        },
      });
      return;
    }

    req[target] = result.data;
    next();
  };
}



export const errorHandler: ErrorRequestHandler = (
  err: unknown,
  req: AuthenticatedRequest,
  res: Response,
  _next: NextFunction,
): void => {
  const requestId = req.requestId ?? 'unknown';

  
  if (err instanceof ZodError) {
    const fieldErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    logger.warn({ requestId, errors: fieldErrors }, 'Zod validation error');

    res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed.',
        fields: fieldErrors,
      },
    });
    return;
  }

  
  if (err instanceof ValidationError) {
    res.status(422).json({
      success: false,
      error: { code: err.code, message: err.message, fields: err.fields },
    });
    return;
  }

  if (err instanceof NotFoundError) {
    res.status(404).json({
      success: false,
      error: { code: err.code, message: err.message },
    });
    return;
  }

  if (err instanceof UnauthorizedError) {
    res.status(401).json({
      success: false,
      error: { code: err.code, message: err.message },
    });
    return;
  }

  if (err instanceof ForbiddenError) {
    res.status(403).json({
      success: false,
      error: { code: err.code, message: err.message },
    });
    return;
  }

  if (err instanceof ConflictError) {
    res.status(409).json({
      success: false,
      error: { code: err.code, message: err.message },
    });
    return;
  }

  if (err instanceof AppError) {
    logger.warn(
      { requestId, code: err.code, message: err.message },
      'Application error',
    );
    res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message },
    });
    return;
  }

  
  const message =
    err instanceof Error ? err.message : 'An unexpected error occurred.';
  const stack = err instanceof Error ? err.stack : undefined;

  logger.error({ requestId, message, stack }, 'Unhandled server error');

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An internal server error occurred. Please try again later.',
    },
  });
};



export function asyncHandler(
  fn: (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) => Promise<void>,
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req as AuthenticatedRequest, res, next).catch(next);
  };
}