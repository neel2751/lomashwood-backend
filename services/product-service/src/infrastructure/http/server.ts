import express, { Application } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import { Server } from 'http';
import { config } from '../../config';
import { logger } from '../../config/logger';
import { errorMiddleware } from '../../../api-gateway/src/middleware/error.middleware';
import { requestLoggerMiddleware } from '../../../api-gateway/src/middleware/request-logger.middleware';
import { gracefulShutdown } from './graceful-shutdown';
import { healthRouter } from './health.routes';
import { productRouter } from '../../app/products/product.routes';
import { categoryRouter } from '../../app/categories/category.routes';
import { colourRouter } from '../../app/colours/colour.routes';
import { sizeRouter } from '../../app/sizes/size.routes';
import { inventoryRouter } from '../../app/inventory/inventory.routes';
import { pricingRouter } from '../../app/pricing/pricing.routes';
import { prismaClient } from '../db/prisma.client';
import { redisClient } from '../cache/redis.client';

class ProductServiceServer {
  private app: Application;
  private server: Server | null = null;
  private readonly port: number;

  constructor() {
    this.app = express();
    this.port = config.port;
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    this.app.use(helmet({
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

    this.app.use(compression());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    this.app.use(requestLoggerMiddleware);

    this.app.disable('x-powered-by');
  }

  private setupRoutes(): void {
    this.app.use('/health', healthRouter);
    this.app.use('/api/v1/products', productRouter);
    this.app.use('/api/v1/categories', categoryRouter);
    this.app.use('/api/v1/colours', colourRouter);
    this.app.use('/api/v1/sizes', sizeRouter);
    this.app.use('/api/v1/inventory', inventoryRouter);
    this.app.use('/api/v1/pricing', pricingRouter);

    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.originalUrl,
      });
    });
  }

  private setupErrorHandling(): void {
    this.app.use(errorMiddleware);
  }

  public async start(): Promise<void> {
    try {
      await this.connectDependencies();

      this.server = this.app.listen(this.port, () => {
        logger.info(`Product Service running on port ${this.port}`);
        logger.info(`Environment: ${config.nodeEnv}`);
        logger.info(`Health check: http://localhost:${this.port}/health`);
      });

      this.setupGracefulShutdown();
    } catch (error) {
      logger.error('Failed to start Product Service', error);
      process.exit(1);
    }
  }

  private async connectDependencies(): Promise<void> {
    try {
      await prismaClient.$connect();
      logger.info('Database connected successfully');

      await redisClient.connect();
      logger.info('Redis connected successfully');
    } catch (error) {
      logger.error('Failed to connect dependencies', error);
      throw error;
    }
  }

  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);
      await gracefulShutdown(this.server);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('unhandledRejection', (reason: Error) => {
      logger.error('Unhandled Rejection', reason);
      shutdown('UNHANDLED_REJECTION');
    });

    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception', error);
      shutdown('UNCAUGHT_EXCEPTION');
    });
  }

  public getApp(): Application {
    return this.app;
  }

  public getServer(): Server | null {
    return this.server;
  }
}

export const productServiceServer = new ProductServiceServer();
export const app = productServiceServer.getApp();