import express, { Application } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import { corsConfig } from './config/cors';
import { rateLimitConfig } from './config/rate-limit';
import { requestLogger } from './infrastructure/http/server';
import { errorHandler } from './shared/errors';
import profileRouter from './app/profiles/profile.routes';
import wishlistRouter from './app/wishlist/wishlist.routes';
import reviewRouter from './app/reviews/review.routes';
import supportRouter from './app/support/support.routes';
import loyaltyRouter from './app/loyalty/loyalty.routes';
import healthRouter from './infrastructure/http/health.routes';

export function createApp(): Application {
  const app = express();

  app.use(helmet());
  app.use(compression());
  app.use(cors(corsConfig));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(rateLimitConfig);
  app.use(requestLogger);

  app.use('/health', healthRouter);
  app.use('/v1/profiles', profileRouter);
  app.use('/v1/wishlist', wishlistRouter);
  app.use('/v1/reviews', reviewRouter);
  app.use('/v1/support', supportRouter);
  app.use('/v1/loyalty', loyaltyRouter);

  app.use(errorHandler);

  return app;
}

export default createApp();