import express, { Application, Request, Response, RequestHandler } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { corsOptions } from './config/cors';
import { globalRateLimitOptions } from './config/rate-limit';
import MiddlewareFactory from './interfaces/http/middleware.factory';
import { healthRoutes } from './infrastructure/http/health.routes';
import { createAuthRouter } from './app/auth/auth.routes';
import { createSessionRouter } from './app/sessions/session.routes';
import { createRoleRouter } from './app/roles/role.routes';
import { SessionController } from './app/sessions/session.controller';
import { SessionService } from './app/sessions/session.service';
import { SessionRepository } from './app/sessions/session.repository';
import RoleController from './app/roles/role.controller';
import RoleService from './app/roles/role.service';
import { RoleRepository } from './app/roles/role.repository';
import { redisClient } from './infrastructure/cache/redis.client';
import { prisma } from './infrastructure/db/prisma.client';
import { logger } from './config/logger';
import { env } from './config/env';

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

  app.use(cors(corsOptions));

  app.use(rateLimit(globalRateLimitOptions) as unknown as RequestHandler);

  app.use((_req, res, next) => MiddlewareFactory.timeoutMiddleware(_req, res, next));

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());
  app.use(compression() as unknown as RequestHandler);

  app.use(MiddlewareFactory.requestLoggerMiddleware);

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

  const sessionRepository = new SessionRepository(prisma);
  const sessionEventProducer = {
    publish: async (topic: string, payload: Record<string, unknown>) => {
      console.log(`Event: ${topic}`, payload);
    },
  };
  const sessionService = new SessionService(sessionRepository, sessionEventProducer, redisClient);
  const sessionController = new SessionController(sessionService);

  const roleRepository = new RoleRepository(prisma);
  const roleEventProducer = {
    publish: async (topic: string, payload: Record<string, unknown>) => {
      console.log(`Event: ${topic}`, payload);
    },
  };
  const roleService = new RoleService(roleRepository, roleEventProducer);
  const roleController = new RoleController(roleService);

  apiV1Router.use('/auth', createAuthRouter());
  apiV1Router.use('/sessions', createSessionRouter(sessionController));
  apiV1Router.use('/roles', createRoleRouter(roleController));

  app.use('/api/v1', apiV1Router);

  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: 'Route not found',
      },
      timestamp: new Date().toISOString(),
    });
  });

  app.use(MiddlewareFactory.errorMiddleware);

  logger.info('Express app configured successfully');
  logger.info('Security: Helmet, CORS, Rate Limiting enabled');
  logger.info('Logging: Request logging enabled');
  logger.info('Routes: /health, /api/v1/auth, /api/v1/sessions, /api/v1/roles');

  return app;
}