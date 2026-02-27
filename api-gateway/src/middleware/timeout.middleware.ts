import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { config } from '../config';

interface TimeoutOptions {
  timeout?: number;
  onTimeout?: (req: Request, res: Response) => void;
  excludePaths?: string[];
}

const DEFAULT_TIMEOUT = (config as any).timeout || 30000;

const shouldExclude = (path: string, excludePaths: string[] = []): boolean => {
  return excludePaths.some(excludePath => {
    if (excludePath.endsWith('*')) {
      const prefix = excludePath.slice(0, -1);
      return path.startsWith(prefix);
    }
    return path === excludePath;
  });
};

export const timeoutMiddleware = (options: TimeoutOptions = {}) => {
  const {
    timeout = DEFAULT_TIMEOUT,
    onTimeout,
    excludePaths = []
  } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    if (shouldExclude(req.path, excludePaths)) {
      return next();
    }

    let timeoutId: NodeJS.Timeout;
    let isTimedOut = false;

    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };

    const handleTimeout = () => {
      if (res.headersSent || isTimedOut) {
        return;
      }

      isTimedOut = true;

      logger.warn('Request timeout', {
        requestId: (req as any).id,
        method: req.method,
        url: req.originalUrl || req.url,
        timeout,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });

      if (onTimeout) {
        onTimeout(req, res);
      } else {
        res.status(504).json({
          success: false,
          error: {
            code: 'REQUEST_TIMEOUT',
            message: 'Request processing time exceeded the allowed limit',
            timeout: `${timeout}ms`
          },
          timestamp: new Date().toISOString(),
          path: req.originalUrl || req.url,
          requestId: (req as any).id
        });
      }

      req.emit('timeout', timeout);
    };

    timeoutId = setTimeout(handleTimeout, timeout);

    req.on('timeout', () => {
      isTimedOut = true;
      cleanup();
    });

    res.on('finish', cleanup);
    res.on('close', cleanup);

    const originalSend = res.send;
    res.send = function(data: any): Response {
      if (isTimedOut) {
        return res;
      }
      cleanup();
      return originalSend.call(this, data);
    };

    next();
  };
};

export const uploadTimeoutMiddleware = timeoutMiddleware({
  timeout: 120000,
  excludePaths: []
});

export const heavyOperationTimeoutMiddleware = timeoutMiddleware({
  timeout: 60000,
  excludePaths: []
});

export const standardTimeoutMiddleware = timeoutMiddleware({
  timeout: DEFAULT_TIMEOUT,
  excludePaths: []
});

export const createCustomTimeout = (
  timeout: number,
  excludePaths: string[] = []
) => {
  return timeoutMiddleware({
    timeout,
    excludePaths,
    onTimeout: (req: Request, res: Response) => {
      logger.error('Custom timeout exceeded', {
        requestId: (req as any).id,
        method: req.method,
        url: req.originalUrl || req.url,
        timeout,
        ip: req.ip
      });

      res.status(504).json({
        success: false,
        error: {
          code: 'GATEWAY_TIMEOUT',
          message: 'The server did not respond in time',
          timeout: `${timeout}ms`
        },
        timestamp: new Date().toISOString(),
        path: req.originalUrl || req.url,
        requestId: (req as any).id
      });
    }
  });
};

export const setRequestTimeout = (
  req: Request,
  res: Response,
  timeout: number
): void => {
  if ((req as any).timeoutCleanup) {
    (req as any).timeoutCleanup();
  }

  const timeoutId = setTimeout(() => {
    if (!res.headersSent) {
      logger.warn('Dynamic request timeout', {
        requestId: (req as any).id,
        method: req.method,
        url: req.originalUrl || req.url,
        timeout
      });

      res.status(504).json({
        success: false,
        error: {
          code: 'REQUEST_TIMEOUT',
          message: 'Request processing time exceeded',
          timeout: `${timeout}ms`
        },
        timestamp: new Date().toISOString(),
        path: req.originalUrl || req.url,
        requestId: (req as any).id
      });
    }
  }, timeout);

  (req as any).timeoutCleanup = () => {
    clearTimeout(timeoutId);
  };

  res.on('finish', () => {
    if ((req as any).timeoutCleanup) {
      (req as any).timeoutCleanup();
    }
  });
};

export const adaptiveTimeoutMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const path = req.path;
  let timeout = DEFAULT_TIMEOUT;

  if (path.startsWith('/uploads') || path.startsWith('/media')) {
    timeout = 120000;
  } else if (
    path.startsWith('/analytics') || 
    path.startsWith('/reports') ||
    path.startsWith('/exports')
  ) {
    timeout = 60000;
  } else if (
    path.startsWith('/search') ||
    path.startsWith('/products')
  ) {
    timeout = 15000;
  } else if (
    path.startsWith('/auth') ||
    path.startsWith('/health')
  ) {
    timeout = 10000;
  }

  setRequestTimeout(req, res, timeout);
  next();
};

export const timeoutHandler = {
  standard: standardTimeoutMiddleware,
  upload: uploadTimeoutMiddleware,
  heavyOperation: heavyOperationTimeoutMiddleware,
  adaptive: adaptiveTimeoutMiddleware,
  custom: createCustomTimeout,
  set: setRequestTimeout
};