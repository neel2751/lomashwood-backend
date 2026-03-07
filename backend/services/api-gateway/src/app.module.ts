import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import 'express-async-errors';

import { config } from './config/configuration';
import { proxyMiddleware } from './gateway/proxy.middleware';
import { generalRateLimiter, authRateLimiter, passwordResetRateLimiter, uploadRateLimiter, appointmentRateLimiter, contactRateLimiter } from './gateway/rate-limiter.middleware';
import { JwtStrategy } from './auth/jwt.strategy';
import { HealthController } from './health/health.controller';

export class AppModule {
  private app: express.Application;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    this.app.use(helmet(config.security.helmet));
    this.app.use(cors(config.cors));
    this.app.use(compression());
    this.app.use(morgan(config.logging.format));
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    this.app.use(generalRateLimiter);

    this.app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
      req.headers['x-correlation-id'] = req.headers['x-correlation-id'] ||
        `corr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      next();
    });
  }

  private setupRoutes(): void {
    this.app.get('/health', HealthController.checkHealth);
    this.app.get('/ready', HealthController.readiness);
    this.app.get('/live', HealthController.liveness);

    this.app.use('/auth/login', authRateLimiter);
    this.app.use('/auth/register', authRateLimiter);
    this.app.use('/auth/forgot-password', passwordResetRateLimiter);
    this.app.use('/auth/reset-password', passwordResetRateLimiter);

    this.app.use('/appointments', appointmentRateLimiter);
    this.app.use('/upload', uploadRateLimiter);
    this.app.use('/contact', contactRateLimiter);

    this.app.use('/auth', proxyMiddleware('auth'));
    this.app.use('/products', proxyMiddleware('products'));
    this.app.use('/orders', proxyMiddleware('orders'));
    this.app.use('/appointments', proxyMiddleware('appointments'));
    this.app.use('/customers', proxyMiddleware('customers'));
    this.app.use('/content', proxyMiddleware('content'));
    this.app.use('/notifications', proxyMiddleware('notifications'));
    this.app.use('/analytics', proxyMiddleware('analytics'));
    this.app.use('/upload', proxyMiddleware('upload'));

    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: 'Route not found',
        error: 'ROUTE_NOT_FOUND',
        path: req.originalUrl,
      });
    });
  }

  private setupErrorHandling(): void {
    this.app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Unhandled error:', error);

      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_SERVER_ERROR',
        correlationId: req.headers['x-correlation-id'],
      });
    });
  }

  public getApp(): express.Application {
    return this.app;
  }
}