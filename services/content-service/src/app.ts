import express, { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';

import { requestLoggerMiddleware, errorHandler } from './interfaces/http/middleware.factory';
import { corsOptions } from './config/cors';
import { rateLimitMiddleware } from './config/rate-limit';
import { createRouter } from './interfaces/http/router.factory';
import { env } from './config/env';
import { logger } from './config/logger';

export function createApp(cfg: typeof env = env): Application {
  const app: Application = express();

  app.use(helmet());
  app.disable('x-powered-by');

  app.use(cors(corsOptions));

  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  app.use(compression() as unknown as express.RequestHandler);

  app.use(requestLoggerMiddleware);

  app.use(rateLimitMiddleware as unknown as express.RequestHandler);

  app.use(`/api/v${cfg.API_VERSION}`, createRouter());

  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      service: 'content-service',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env['npm_package_version'] ?? 'unknown',
    });
  });

  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'The requested resource does not exist on this service.',
      },
    });
  });

  app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
    errorHandler(error, req, res, next);
  });

  logger.info({ env: cfg.NODE_ENV }, 'Express application configured');

  return app;
}