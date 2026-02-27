import express, { Application } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import { corsMiddleware } from './middleware/cors.middleware';
import { rateLimitMiddleware } from './middleware/rate-limit.middleware';
import { requestLoggerMiddleware } from './middleware/request-logger.middleware';
import { timeoutMiddleware } from './middleware/timeout.middleware';
import { errorMiddleware } from './middleware/error.middleware';
import { registerRoutes } from './routes';
import { env } from './config/env';

export function createApp(): Application {
  const app = express();


  app.set('trust proxy', 1);


  app.use(
    helmet({
      contentSecurityPolicy: env.NODE_ENV === 'production',
      crossOriginEmbedderPolicy: env.NODE_ENV === 'production',
    }),
  );


  app.use(corsMiddleware);

 
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));


  app.use(compression());

 
  app.use(requestLoggerMiddleware);

  
  app.use(timeoutMiddleware);

 
  app.use(rateLimitMiddleware);

  
  registerRoutes(app);


  app.use(errorMiddleware);

  return app;
}