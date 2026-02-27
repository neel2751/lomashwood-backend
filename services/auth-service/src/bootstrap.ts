import express, { Application, Request, Response, RequestHandler, NextFunction } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { corsOptions } from './config/cors';
import { globalRateLimitOptions } from './config/rate-limit';
import { healthRoutes } from './infrastructure/http/health.routes';
import { createAuthRouter } from './app/auth/auth.routes';
import { createSessionRouter } from './app/sessions/session.routes';
import { createRoleRouter } from './app/roles/role.routes';
import { logger } from './config/logger';
import { env } from './config/env';

const corsMiddleware = cors(corsOptions);
const rateLimitMiddleware = rateLimit(globalRateLimitOptions) as unknown as RequestHandler;

const requestLoggerMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  logger.info({ method: req.method, path: req.path }, 'Incoming request');
  next();
};

const timeoutMiddleware = (_req: Request, _res: Response, next: NextFunction) => {
  next();
};

const errorMiddleware = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.statusCode || err.status || 500;
  res.status(status).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected error occurred',
    },
    timestamp: new Date().toISOString(),
  });
};

export function createApp(): Application {
  const app: Application = express();

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    })
  );

  app.use(corsMiddleware);
  app.use(rateLimitMiddleware);
  app.use(timeoutMiddleware);
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());
  app.use(compression() as unknown as RequestHandler);
  app.use(requestLoggerMiddleware);

  app.use('/health', healthRoutes);

  app.get('/', (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      service: 'Auth Service',
      version: '1.0.0',
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  });

  const apiV1Router = express.Router();

  apiV1Router.use('/auth', (createAuthRouter as any)());
  apiV1Router.use('/sessions', (createSessionRouter as any)());
  apiV1Router.use('/roles', (createRoleRouter as any)());

  app.use('/api/v1', apiV1Router);

  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: `Route ${req.method} ${req.path} not found`,
        path: req.path,
        method: req.method,
      },
      timestamp: new Date().toISOString(),
    });
  });

  app.use(errorMiddleware);

  logger.info('Express app configured successfully');
  logger.info('Security: Helmet, CORS, Rate Limiting enabled');
  logger.info('Logging: Request logging enabled');
  logger.info('Routes: /health, /api/v1/auth, /api/v1/sessions, /api/v1/roles');

  return app;
}