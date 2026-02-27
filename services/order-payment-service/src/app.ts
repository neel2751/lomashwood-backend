import { Request, Response, NextFunction } from 'express';
import { logger } from '../../../config/logger';
import { randomUUID } from 'crypto';

export interface RequestWithId extends Request {
  id?: string;
  startTime?: number;
}

export function requestLoggerMiddleware(
  req: RequestWithId,
  res: Response,
  next: NextFunction
): void {
  req.id = req.headers['x-request-id'] as string || randomUUID();
  req.startTime = Date.now();

  res.setHeader('X-Request-ID', req.id);

  const logRequest = () => {
    const duration = Date.now() - (req.startTime || 0);
    const logData = {
      requestId: req.id,
      method: req.method,
      url: req.url,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
      referer: req.headers.referer,
    };

    if (res.statusCode >= 500) {
      logger.error('HTTP Request Failed', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('HTTP Request Warning', logData);
    } else {
      logger.http('HTTP Request', logData);
    }
  };

  res.on('finish', logRequest);
  res.on('close', () => {
    if (!res.writableEnded) {
      logger.warn('HTTP Request Closed Prematurely', {
        requestId: req.id,
        method: req.method,
        url: req.url,
      });
    }
  });

  next();
}