import { Response } from 'express';
import { logger } from './logger';


export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  meta?: Record<string, any>;
  timestamp: string;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    stack?: string;
  };
  timestamp: string;
  requestId?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResponse<T = any> {
  success: true;
  data: T[];
  pagination: PaginationMeta;
  message?: string;
  timestamp: string;
}

export class ResponseHandler {
  static success<T>(
    res: Response,
    data: T,
    message?: string,
    statusCode: number = 200,
    meta?: Record<string, any>
  ): Response {
    const response: SuccessResponse<T> = {
      success: true,
      data,
      message,
      meta,
      timestamp: new Date().toISOString(),
    };

    return res.status(statusCode).json(response);
  }

  static created<T>(
    res: Response,
    data: T,
    message: string = 'Resource created successfully'
  ): Response {
    return this.success(res, data, message, 201);
  }

  static accepted(
    res: Response,
    message: string = 'Request accepted for processing'
  ): Response {
    return this.success(res, null, message, 202);
  }

  static noContent(res: Response): Response {
    return res.status(204).send();
  }

  static paginated<T>(
    res: Response,
    data: T[],
    pagination: PaginationMeta,
    message?: string
  ): Response {
    const response: PaginatedResponse<T> = {
      success: true,
      data,
      pagination,
      message,
      timestamp: new Date().toISOString(),
    };

    return res.status(200).json(response);
  }

  static error(
    res: Response,
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_SERVER_ERROR',
    details?: any,
    requestId?: string
  ): Response {
    const response: ErrorResponse = {
      success: false,
      error: {
        code,
        message,
        details,
      },
      timestamp: new Date().toISOString(),
      requestId,
    };

    logger.error('Error response sent', {
      statusCode,
      code,
      message,
      details,
      requestId,
    });

    return res.status(statusCode).json(response);
  }

  static badRequest(
    res: Response,
    message: string = 'Bad request',
    details?: any,
    requestId?: string
  ): Response {
    return this.error(res, message, 400, 'BAD_REQUEST', details, requestId);
  }

  static unauthorized(
    res: Response,
    message: string = 'Unauthorized access',
    requestId?: string
  ): Response {
    return this.error(res, message, 401, 'UNAUTHORIZED', undefined, requestId);
  }

  static forbidden(
    res: Response,
    message: string = 'Forbidden',
    requestId?: string
  ): Response {
    return this.error(res, message, 403, 'FORBIDDEN', undefined, requestId);
  }

  static notFound(
    res: Response,
    message: string = 'Resource not found',
    requestId?: string
  ): Response {
    return this.error(res, message, 404, 'NOT_FOUND', undefined, requestId);
  }

  static conflict(
    res: Response,
    message: string = 'Resource conflict',
    details?: any,
    requestId?: string
  ): Response {
    return this.error(res, message, 409, 'CONFLICT', details, requestId);
  }

  static validationError(
    res: Response,
    errors: any,
    message: string = 'Validation failed',
    requestId?: string
  ): Response {
    return this.error(res, message, 422, 'VALIDATION_ERROR', errors, requestId);
  }

  static tooManyRequests(
    res: Response,
    message: string = 'Too many requests',
    retryAfter?: number,
    requestId?: string
  ): Response {
    if (retryAfter) {
      res.setHeader('Retry-After', retryAfter.toString());
    }
    return this.error(res, message, 429, 'TOO_MANY_REQUESTS', undefined, requestId);
  }

  static internalError(
    res: Response,
    message: string = 'Internal server error',
    details?: any,
    requestId?: string
  ): Response {
    return this.error(res, message, 500, 'INTERNAL_SERVER_ERROR', details, requestId);
  }

  static serviceUnavailable(
    res: Response,
    message: string = 'Service temporarily unavailable',
    requestId?: string
  ): Response {
    return this.error(res, message, 503, 'SERVICE_UNAVAILABLE', undefined, requestId);
  }

  static gatewayTimeout(
    res: Response,
    message: string = 'Gateway timeout',
    requestId?: string
  ): Response {
    return this.error(res, message, 504, 'GATEWAY_TIMEOUT', undefined, requestId);
  }

  static maintenance(
    res: Response,
    message: string = 'Service under maintenance'
  ): Response {
    return this.error(res, message, 503, 'MAINTENANCE_MODE');
  }
}

export const createPaginationMeta = (
  page: number,
  limit: number,
  total: number
): PaginationMeta => {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

export const extractPaginationParams = (
  query: any
): { page: number; limit: number; skip: number } => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

export const extractSortParams = (
  query: any
): { sortBy?: string; sortOrder?: 'asc' | 'desc' } => {
  const sortBy = query.sortBy as string | undefined;
  const sortOrder = (query.sortOrder?.toLowerCase() === 'desc' ? 'desc' : 'asc') as 'asc' | 'desc';

  return { sortBy, sortOrder };
};

export const buildPaginatedResponse = <T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): { data: T[]; pagination: PaginationMeta } => {
  return {
    data,
    pagination: createPaginationMeta(page, limit, total),
  };
};

export const formatSuccessMessage = (action: string, resource: string): string => {
  return `${resource} ${action} successfully`;
};

export const formatErrorMessage = (action: string, resource: string): string => {
  return `Failed to ${action} ${resource}`;
};

export const sanitizeResponse = <T>(data: T, fieldsToRemove: string[] = []): T => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const defaultFieldsToRemove = ['password', 'passwordHash', 'salt', 'secret', 'privateKey'];
  const allFieldsToRemove = [...defaultFieldsToRemove, ...fieldsToRemove];

  if (Array.isArray(data)) {
    return data.map(item => sanitizeResponse(item, fieldsToRemove)) as T;
  }

  const sanitized = { ...data } as any;

  allFieldsToRemove.forEach(field => {
    if (field in sanitized) {
      delete sanitized[field];
    }
  });

  Object.keys(sanitized).forEach(key => {
    if (sanitized[key] && typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeResponse(sanitized[key], fieldsToRemove);
    }
  });

  return sanitized;
};

export const addResponseHeaders = (
  res: Response,
  headers: Record<string, string | number>
): void => {
  Object.entries(headers).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
};

export const addPaginationHeaders = (
  res: Response,
  pagination: PaginationMeta
): void => {
  res.setHeader('X-Total-Count', pagination.total);
  res.setHeader('X-Page', pagination.page);
  res.setHeader('X-Per-Page', pagination.limit);
  res.setHeader('X-Total-Pages', pagination.totalPages);
};

export const addCacheHeaders = (
  res: Response,
  maxAge: number,
  isPublic: boolean = false
): void => {
  const cacheControl = isPublic
    ? `public, max-age=${maxAge}`
    : `private, max-age=${maxAge}`;

  res.setHeader('Cache-Control', cacheControl);
  res.setHeader('Expires', new Date(Date.now() + maxAge * 1000).toUTCString());
};

export const addNoCacheHeaders = (res: Response): void => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
};

export const setDownloadHeaders = (
  res: Response,
  filename: string,
  contentType: string = 'application/octet-stream'
): void => {
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
};

export const setStreamHeaders = (
  res: Response,
  contentType: string = 'application/octet-stream'
): void => {
  res.setHeader('Content-Type', contentType);
  res.setHeader('Transfer-Encoding', 'chunked');
};

export const redirect = (
  res: Response,
  url: string,
  statusCode: 301 | 302 | 303 | 307 | 308 = 302
): void => {
  res.redirect(statusCode, url);
};

export const redirectPermanent = (res: Response, url: string): void => {
  redirect(res, url, 301);
};

export const redirectTemporary = (res: Response, url: string): void => {
  redirect(res, url, 302);
};

export default ResponseHandler;