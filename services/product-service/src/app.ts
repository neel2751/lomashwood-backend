import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config';
import { logger } from './config/logger';
import { errorMiddleware } from './infrastructure/http/middleware/error.middleware';
import { requestLoggerMiddleware } from './infrastructure/http/middleware/request-logger.middleware';
import { rateLimitMiddleware } from './infrastructure/http/middleware/rate-limit.middleware';
import { productRoutes } from './app/products/product.routes';
import { categoryRoutes } from './app/categories/category.routes';
import { colourRoutes } from './app/colours/colour.routes';
import { sizeRoutes } from './app/sizes/size.routes';
import { inventoryRoutes } from './app/inventory/inventory.routes';
import { pricingRoutes } from './app/pricing/pricing.routes';
import { healthRoutes } from './infrastructure/http/health.routes';

export function createApp(): Application {
  const app = express();

  app.use(helmet({
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
  }));

  app.use(cors({
    origin: config.cors.origins,
    credentials: config.cors.credentials,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Page-Size'],
    maxAge: 86400,
  }));

  app.use(compression());

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  app.use(requestLoggerMiddleware);

  app.disable('x-powered-by');

  app.set('trust proxy', 1);

  app.get('/', (req: Request, res: Response) => {
    res.json({
      service: 'Product Service',
      version: config.version,
      status: 'running',
      timestamp: new Date().toISOString(),
    });
  });

  app.use('/health', healthRoutes);

  if (config.rateLimit.enabled) {
    app.use('/api', rateLimitMiddleware);
  }

  app.use('/api/v1/products', productRoutes);
  app.use('/api/v1/categories', categoryRoutes);
  app.use('/api/v1/colours', colourRoutes);
  app.use('/api/v1/sizes', sizeRoutes);
  app.use('/api/v1/inventory', inventoryRoutes);
  app.use('/api/v1/pricing', pricingRoutes);

  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: 'Resource not found',
      error: {
        code: 'NOT_FOUND',
        message: `Cannot ${req.method} ${req.path}`,
      },
      meta: {
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  });

  app.use(errorMiddleware);

  return app;
}