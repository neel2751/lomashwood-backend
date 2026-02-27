import express, { Application } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import { corsMiddleware } from './config/cors';
import { rateLimitMiddleware } from './config/rate-limit';
import { requestLoggerMiddleware } from './interfaces/http/middleware.factory';
import { errorMiddleware } from './interfaces/http/middleware.factory';
import { bookingRoutes } from './app/bookings/booking.routes';
import { availabilityRoutes } from './app/availability/availability.routes';
import { consultantRoutes } from './app/consultants/consultant.routes';
import { reminderRoutes } from './app/reminders/reminder.routes';
import { healthRoutes } from './infrastructure/http/health.routes';

export function createApp(): Application {
  const app = express();

  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(compression());
  app.use(corsMiddleware);
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(rateLimitMiddleware);
  app.use(requestLoggerMiddleware);

  app.use('/health', healthRoutes);
  app.use('/v1/appointments/bookings', bookingRoutes);
  app.use('/v1/appointments/availability', availabilityRoutes);
  app.use('/v1/appointments/consultants', consultantRoutes);
  app.use('/v1/appointments/reminders', reminderRoutes);

  app.use(errorMiddleware);

  return app;
}