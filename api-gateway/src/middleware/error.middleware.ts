import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

declare module 'express-serve-static-core' {
  interface Request {
    id?: string;
  }
}


const NODE_ERROR_CODES = {
  CONN_REFUSED: 'ECONNREFUSED',
  TIMED_OUT: 'ETIMEDOUT',
  SOCKET_TIMED_OUT: 'ESOCKETTIMEDOUT',
} as const;

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    stack?: string;
  };
  timestamp: string;
  path: string;
  requestId?: string;
}

export class HttpError extends Error {
  public override name: string;
  public statusCode: number;
  public override message: string;
  public code: string;
  public details?: any;

  constructor(
    statusCode: number,
    message: string,
    code: string = 'INTERNAL_ERROR',
    details?: any
  ) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.message = message;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

const formatZodError = (error: ZodError): any[] => {
  return error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
  }));
};

const getRequestPath = (req: Request): string =>
  req.originalUrl ?? req.url;

const getErrorResponse = (
  err: {
    code?: string;
    message?: string;
    details?: any;
    stack?: string;
  },
  req: Request
): ErrorResponse => {
  const response: ErrorResponse = {
    success: false,
    error: {
      code: err.code ?? 'INTERNAL_ERROR',
      message: err.message ?? 'An unexpected error occurred',
    },
    timestamp: new Date().toISOString(),
    path: getRequestPath(req),
    requestId: req.id,
  };

  if (err.details !== undefined) {
    response.error.details = err.details;
  }

  if (isDevelopment && err.stack) {
    response.error.stack = err.stack;
  }

  return response;
};

export const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let errorResponse: ErrorResponse;

  if (err instanceof ZodError) {
    statusCode = 400;
    const formatted = formatZodError(err);

    errorResponse = getErrorResponse(
      {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: formatted,
      },
      req
    );

    logger.warn('Validation error', {
      path: req.path,
      method: req.method,
      errors: formatted,
      requestId: req.id,
    });
  } else if (err instanceof HttpError) {
    statusCode = err.statusCode;
    errorResponse = getErrorResponse(err, req);

    if (statusCode >= 500) {
      logger.error('HTTP error', {
        statusCode,
        code: err.code,
        message: err.message,
        path: req.path,
        method: req.method,
        stack: err.stack,
        requestId: req.id,
      });
    } else {
      logger.warn('HTTP client error', {
        statusCode,
        code: err.code,
        message: err.message,
        path: req.path,
        method: req.method,
        requestId: req.id,
      });
    }
  } else if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorResponse = getErrorResponse(
      {
        code: err.code,
        message: err.message,
        details: (err as any).details,
      },
      req
    );

    if (statusCode >= 500) {
      logger.error('Application error', {
        statusCode,
        code: err.code,
        message: err.message,
        path: req.path,
        method: req.method,
        stack: err.stack,
        requestId: req.id,
      });
    }
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    errorResponse = getErrorResponse(
      {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token',
      },
      req
    );

    logger.warn('Unauthorized access attempt', {
      path: req.path,
      method: req.method,
      ip: req.ip,
      requestId: req.id,
    });
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorResponse = getErrorResponse(
      {
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token',
      },
      req
    );

    logger.warn('Invalid JWT token', {
      path: req.path,
      method: req.method,
      ip: req.ip,
      requestId: req.id,
    });
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorResponse = getErrorResponse(
      {
        code: 'TOKEN_EXPIRED',
        message: 'Authentication token has expired',
      },
      req
    );

    logger.warn('Expired JWT token', {
      path: req.path,
      method: req.method,
      ip: req.ip,
      requestId: req.id,
    });
  } else if (err.code === NODE_ERROR_CODES.CONN_REFUSED) {
    statusCode = 503;
    errorResponse = getErrorResponse(
      {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Service temporarily unavailable',
      },
      req
    );

    logger.error('Service connection refused', {
      path: req.path,
      method: req.method,
      error: err.message,
      requestId: req.id,
    });
  } else if (
    err.code === NODE_ERROR_CODES.TIMED_OUT ||
    err.code === NODE_ERROR_CODES.SOCKET_TIMED_OUT
  ) {
    statusCode = 504;
    errorResponse = getErrorResponse(
      {
        code: 'GATEWAY_TIMEOUT',
        message: 'Request timeout',
      },
      req
    );

    logger.error('Request timeout', {
      path: req.path,
      method: req.method,
      error: err.message,
      requestId: req.id,
    });
  } else if (err.type === 'entity.too.large') {
    statusCode = 413;
    errorResponse = getErrorResponse(
      {
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Request payload too large',
      },
      req
    );

    logger.warn('Payload too large', {
      path: req.path,
      method: req.method,
      requestId: req.id,
    });
  } else if (err.status === 404) {
    statusCode = 404;
    errorResponse = getErrorResponse(
      {
        code: 'NOT_FOUND',
        message: 'Resource not found',
      },
      req
    );

    logger.warn('Resource not found', {
      path: req.path,
      method: req.method,
      requestId: req.id,
    });
  } else {
    statusCode = err.statusCode ?? err.status ?? 500;
    errorResponse = getErrorResponse(
      {
        code: err.code ?? 'INTERNAL_ERROR',
        message:
          isProduction && statusCode === 500
            ? 'An unexpected error occurred'
            : err.message ?? 'An unexpected error occurred',
        details: isDevelopment ? err.details : undefined,
      },
      req
    );

    logger.error('Unhandled error', {
      statusCode,
      message: err.message,
      path: req.path,
      method: req.method,
      stack: err.stack,
      requestId: req.id,
    });
  }

  res.status(statusCode).json(errorResponse);
};

export const notFoundMiddleware = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const path = getRequestPath(req);
  const error = new HttpError(
    404,
    `Route ${req.method} ${path} not found`,
    'ROUTE_NOT_FOUND'
  );

  res.status(404).json({
    success: false,
    error: {
      code: error.code,
      message: error.message,
    },
    timestamp: new Date().toISOString(),
    path,
  });
};

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const handleUncaughtErrors = (): void => {
  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception', {
      message: error.message,
      stack: error.stack,
    });
    process.exit(1);
  });

  process.on('unhandledRejection', (reason: any, _promise: Promise<any>) => {
    logger.error('Unhandled Rejection', {
      reason: reason?.message ?? reason,
      stack: reason?.stack,
    });
    process.exit(1);
  });
};