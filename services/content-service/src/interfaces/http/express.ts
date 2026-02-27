import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import { corsMiddleware } from '../../config/cors';
import { rateLimitMiddleware } from '../../config/rate-limit';
import { requestLoggerMiddleware, errorHandler } from './middleware.factory';
import { createRouter } from './router.factory';
import { config } from '../../config';

export function createExpressApp(): Application {
  const app: Application = express();

  
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  
  
  app.use(corsMiddleware as express.RequestHandler);

  
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(compression() as unknown as express.RequestHandler);

  
  app.use(rateLimitMiddleware as express.RequestHandler);

  
  app.use(requestLoggerMiddleware);

  
  app.set('trust proxy', 1);

  
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      service: 'content-service',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? '1.0.0',
      environment: config.env.NODE_ENV,
    });
  });

  
  app.use(`/api/v${config.env.API_VERSION}`, createRouter());

  
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: 'The requested route does not exist.',
      },
    });
  });

  
  app.use(errorHandler);

  return app;
}