
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

interface LogMetadata {
  requestId: string;
  method: string;
  url: string;
  ip: string;
  userAgent?: string;
  userId?: string;
  statusCode?: number;
  responseTime?: number;
  contentLength?: number;
  referer?: string;
  query?: any;
  body?: any;
  error?: any;
}

const sensitiveFields = [
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'apiKey',
  'secret',
  'authorization',
  'cookie',
  'cardNumber',
  'cvv',
  'ssn'
];

const sanitizeObject = (obj: any): any => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const sanitized: Record<string, any> = Array.isArray(obj) ? [] : {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = sensitiveFields.some(field =>
        lowerKey.includes(field.toLowerCase())
      );

      if (isSensitive) {
        sanitized[key] = '***REDACTED***';
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitized[key] = sanitizeObject(obj[key]);
      } else {
        sanitized[key] = obj[key];
      }
    }
  }

  return sanitized;
};

const sanitizeHeaders = (headers: any): any => {
  const sanitized: Record<string, any> = { ...headers };

  if (sanitized['authorization']) {
    sanitized['authorization'] = '***REDACTED***';
  }

  if (sanitized['cookie']) {
    sanitized['cookie'] = '***REDACTED***';
  }

  if (sanitized['x-api-key']) {
    sanitized['x-api-key'] = '***REDACTED***';
  }

  return sanitized;
};

const shouldLogBody = (req: Request): boolean => {
  const contentType = req.headers['content-type'] ?? '';

  if (contentType.includes('multipart/form-data')) {
    return false;
  }

  if (contentType.includes('application/octet-stream')) {
    return false;
  }

  const skipPaths = ['/uploads', '/media'];
  return !skipPaths.some(path => req.path.startsWith(path));
};

const getClientIp = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return typeof forwarded === 'string'
      ? forwarded.split(',')[0].trim()
      : (forwarded[0] ?? 'unknown');
  }

  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    return typeof realIp === 'string' ? realIp : (realIp[0] ?? 'unknown');
  }

  return req.socket?.remoteAddress ?? req.ip ?? 'unknown';
};

export const requestLoggerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = uuidv4();
  const startTime = Date.now();

  (req as any).id = requestId;

  const userAgent = req.headers['user-agent'];
  const referer = req.headers['referer'];

  const metadata: LogMetadata = {
    requestId,
    method: req.method,
    url: req.originalUrl ?? req.url,
    ip: getClientIp(req),
    userAgent: typeof userAgent === 'string' ? userAgent : undefined,
    userId: (req as any).user?.id ? String((req as any).user.id) : undefined,
    referer: typeof referer === 'string' ? referer : undefined,
    query: Object.keys(req.query).length > 0 ? sanitizeObject(req.query) : undefined
  };

  if (shouldLogBody(req) && req.body && Object.keys(req.body).length > 0) {
    metadata.body = sanitizeObject(req.body);
  }

  logger.info('Incoming request', metadata);

  const originalSend = res.send.bind(res);
  let responseBody: any;

  res.send = function (data: any): Response {
    responseBody = data;
    return originalSend(data);
  };

  const logResponse = (): void => {
    const responseTime = Date.now() - startTime;
    const contentLengthHeader = res.get('content-length');

    const responseMetadata: LogMetadata = {
      requestId,
      method: req.method,
      url: req.originalUrl ?? req.url,
      ip: getClientIp(req),
      userId: (req as any).user?.id ? String((req as any).user.id) : undefined,
      statusCode: res.statusCode,
      responseTime,
      contentLength: contentLengthHeader ? parseInt(contentLengthHeader, 10) : undefined
    };

    if (res.statusCode >= 500) {
      logger.error('Request failed with server error', {
        ...responseMetadata,
        response:
          responseBody && typeof responseBody === 'string'
            ? responseBody.substring(0, 500)
            : undefined
      });
    } else if (res.statusCode >= 400) {
      logger.warn('Request failed with client error', {
        ...responseMetadata,
        response:
          responseBody && typeof responseBody === 'string'
            ? responseBody.substring(0, 500)
            : undefined
      });
    } else {
      logger.info('Request completed successfully', responseMetadata);
    }

    if (responseTime > 5000) {
      logger.warn('Slow request detected', {
        requestId,
        method: req.method,
        url: req.originalUrl ?? req.url,
        responseTime,
        threshold: 5000
      });
    }
  };

  res.on('finish', logResponse);
  res.on('close', () => {
    if (!res.writableEnded) {
      logger.warn('Request closed before completion', {
        requestId,
        method: req.method,
        url: req.originalUrl ?? req.url,
        statusCode: res.statusCode
      });
    }
  });

  next();
};

export const errorLoggerMiddleware = (
  err: any,
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const requestId = (req as any).id;

  const errorMetadata = {
    requestId,
    method: req.method,
    url: req.originalUrl ?? req.url,
    ip: getClientIp(req),
    userId: (req as any).user?.id ? String((req as any).user.id) : undefined,
    errorName: err?.name ?? 'UnknownError',
    errorMessage: err?.message ?? 'Unknown error',
    errorCode: err?.code ?? undefined,
    statusCode: err?.statusCode ?? err?.status ?? 500,
    stack: err?.stack ?? undefined,
    query: Object.keys(req.query).length > 0 ? sanitizeObject(req.query) : undefined,
    body:
      shouldLogBody(req) && req.body && Object.keys(req.body).length > 0
        ? sanitizeObject(req.body)
        : undefined
  };

  logger.error('Request error', errorMetadata);

  next(err);
};

export const performanceLoggerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = process.hrtime.bigint();

  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1e6;

    if (duration > 3000) {
      logger.warn('Performance: Slow endpoint', {
        requestId: (req as any).id,
        method: req.method,
        url: req.originalUrl ?? req.url,
        duration: `${duration.toFixed(2)}ms`,
        statusCode: res.statusCode
      });
    }

    if (res.statusCode >= 200 && res.statusCode < 300) {
      const memUsage = process.memoryUsage();
      logger.debug('Performance metrics', {
        requestId: (req as any).id,
        method: req.method,
        url: req.originalUrl ?? req.url,
        duration: `${duration.toFixed(2)}ms`,
        memory: {
          rss: `${(memUsage.rss / 1024 / 1024).toFixed(2)}MB`,
          heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
          heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)}MB`
        }
      });
    }
  });

  next();
};

export const securityLoggerMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const suspiciousPatterns = [
    /(\.|%2e)(\.|%2e)(\/|%2f)/i,
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /(union|select|insert|update|delete|drop|create|alter)/gi,
    /\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e%5c/gi
  ];

  const requestData = JSON.stringify({
    url: req.originalUrl ?? '',
    query: req.query ?? {},
    body: req.body ?? {}
  });

  const isSuspicious = suspiciousPatterns.some(pattern =>
    pattern.test(requestData)
  );

  if (isSuspicious) {
    logger.warn('Suspicious request detected', {
      requestId: (req as any).id ?? 'unknown',
      method: req.method,
      url: req.originalUrl ?? req.url,
      ip: getClientIp(req),
      userAgent: req.headers['user-agent'] ?? 'unknown',
      headers: sanitizeHeaders(req.headers),
      query: sanitizeObject(req.query),
      body: sanitizeObject(req.body ?? {})
    });
  }

  next();
};