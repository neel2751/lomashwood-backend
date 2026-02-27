import express, { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { env } from '../../config/env';
import { corsMiddleware } from '../../config/cors';
import { rateLimiter } from '../../config/rate-limit';
import { requestLoggerMiddleware } from './middleware.factory';
import { errorMiddleware } from './middleware.factory';
import { buildHealthRouter } from '../../infrastructure/http/health.routes';

export function createExpressApp(): Application {
  const app = express();

  app.set('trust proxy', env.NODE_ENV === 'production' ? 1 : false);
  app.set('x-powered-by', false);
  app.disable('x-powered-by');

  app.use(
    helmet({
      contentSecurityPolicy: env.NODE_ENV === 'production',
      crossOriginEmbedderPolicy: env.NODE_ENV === 'production',
      hsts: {
        maxAge: 31_536_000,
        includeSubDomains: true,
        preload: true,
      },
    }),
  );

  app.use(corsMiddleware);

  app.use(compression());

  app.use('/v1/webhooks/stripe', express.raw({ type: 'application/json' }));
  app.use('/v1/webhooks/razorpay', express.raw({ type: 'application/json' }));

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  app.use(cookieParser(env.COOKIE_SECRET));

  app.use(requestLoggerMiddleware);

  app.use(rateLimiter('global'));

  app.use(buildHealthRouter());

  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Service', 'order-payment-service');
    res.setHeader('X-Request-ID', _req.headers['x-request-id'] ?? crypto.randomUUID());
    next();
  });

  return app;
}