
import express, { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import { Server as HTTPServer } from 'node:http';
import { logger } from '../../config/logger';
import { envConfig } from '../../config/env';
import { corsConfig } from '../../config/cors';
import { rateLimitConfig } from '../../config/rate-limit';
import { healthRouter } from './health.routes';
import { gracefulShutdown } from './graceful-shutdown';


export interface ServerConfig {
  port: number;
  host: string;
  environment: string;
  trustProxy: boolean;
}

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  code?: string;
}

// ---------------------------------------------------------------------------
// Server Class
// ---------------------------------------------------------------------------
export class ContentServer {
  private app: Application;
  private server: HTTPServer | null = null;
  private readonly config: ServerConfig;

  constructor(config?: Partial<ServerConfig>) {
    this.config = {
      port: config?.port ?? envConfig.server.port,
      host: config?.host ?? envConfig.server.host,
      environment: config?.environment ?? envConfig.server.environment,
      trustProxy: config?.trustProxy ?? true,
    };

    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  // -------------------------------------------------------------------------
  // Middleware Setup
  // -------------------------------------------------------------------------
  private setupMiddleware(): void {
    // Trust proxy (for load balancers, reverse proxies)
    if (this.config.trustProxy) {
      this.app.set('trust proxy', 1);
    }

    // Security headers
    this.app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
          },
        },
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: { policy: 'cross-origin' },
      }),
    );

    // CORS
    this.app.use(cors(corsConfig));

    // Compression
    this.app.use(
      compression({
        level: 6,
        threshold: 1024, // Only compress responses > 1KB
        filter: (req, res) => {
          if (req.headers['x-no-compression']) {
            return false;
          }
          return compression.filter(req, res);
        },
      }) as unknown as import('express').RequestHandler,
    );

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use(this.requestLogger);

    // Request ID
    this.app.use(this.requestIdMiddleware);

    // Rate limiting (global)
    this.app.use(
      (rateLimit({
        windowMs: rateLimitConfig.windowMs,
        max: rateLimitConfig.max,
        standardHeaders: true,
        legacyHeaders: false,
        message: 'Too many requests from this IP, please try again later',
        handler: (req, res) => {
          logger.warn({
            context: 'RateLimitExceeded',
            ip: req.ip,
            path: req.path,
            method: req.method,
          });

          res.status(429).json({
            success: false,
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: 'Too many requests, please try again later',
            },
          });
        },
      }) as unknown as import('express').RequestHandler),
    );

    // Response time tracking
    this.app.use(this.responseTimeMiddleware);
  }

  // -------------------------------------------------------------------------
  // Route Setup
  // -------------------------------------------------------------------------
  private setupRoutes(): void {
    // Health check endpoint (always first)
    this.app.use('/health', healthRouter);

    // API version prefix
    const apiV1 = express.Router();

    // Mount route modules
    // apiV1.use('/blogs', blogRouter);
    // apiV1.use('/pages', pageRouter);
    // apiV1.use('/media', mediaRouter);
    // apiV1.use('/seo', seoRouter);
    // apiV1.use('/landing-pages', landingRouter);

    // Placeholder routes for demonstration
    apiV1.get('/', (_req, res) => {
      res.json({
        success: true,
        message: 'Content Service API v1',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
      });
    });

    this.app.use('/api/v1', apiV1);

    // 404 handler
    this.app.use(this.notFoundHandler);
  }

  // -------------------------------------------------------------------------
  // Error Handling
  // -------------------------------------------------------------------------
  private setupErrorHandling(): void {
    // Global error handler
    this.app.use(this.errorHandler);

    // Uncaught exception handler
    process.on('uncaughtException', (error: Error) => {
      logger.error({
        context: 'UncaughtException',
        error,
        message: 'Uncaught exception - shutting down',
      });
      process.exit(1);
    });

    // Unhandled rejection handler
    process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
      logger.error({
        context: 'UnhandledRejection',
        reason,
        promise,
        message: 'Unhandled promise rejection',
      });
    });
  }

  // -------------------------------------------------------------------------
  // Custom Middleware
  // -------------------------------------------------------------------------
  private requestLogger = (req: Request, res: Response, next: NextFunction): void => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;

      logger.info({
        context: 'HttpRequest',
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        requestId: (req as Request & { id?: string }).id,
      });
    });

    next();
  };

  private requestIdMiddleware = (
    req: Request & { id?: string },
    res: Response,
    next: NextFunction,
  ): void => {
    req.id = req.get('x-request-id') ?? `req_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    res.setHeader('x-request-id', req.id);
    next();
  };

  private responseTimeMiddleware = (_req: Request, res: Response, next: NextFunction): void => {
    const start = process.hrtime.bigint();

    res.on('finish', () => {
      const end = process.hrtime.bigint();
      const duration = Number(end - start) / 1_000_000; // Convert to milliseconds
      res.setHeader('x-response-time', `${duration.toFixed(2)}ms`);
    });

    next();
  };

  private notFoundHandler = (req: Request, res: Response): void => {
    logger.warn({
      context: 'NotFound',
      method: req.method,
      path: req.path,
      ip: req.ip,
    });

    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Route ${req.method} ${req.path} not found`,
        path: req.path,
      },
    });
  };

  private errorHandler = (
    error: AppError,
    req: Request,
    res: Response,
    _next: NextFunction,
  ): void => {
    // Log error
    logger.error({
      context: 'ErrorHandler',
      error,
      method: req.method,
      path: req.path,
      statusCode: error.statusCode ?? 500,
      requestId: (req as Request & { id?: string }).id,
    });

    // Determine status code
    const statusCode = error.statusCode ?? 500;
    const isOperational = error.isOperational ?? false;

    // Send error response
    res.status(statusCode).json({
      success: false,
      error: {
        code: error.code ?? 'INTERNAL_SERVER_ERROR',
        message: isOperational ? error.message : 'An unexpected error occurred',
        ...(this.config.environment === 'development' && {
          stack: error.stack,
          details: error,
        }),
      },
    });

    // For non-operational errors, we might want to shut down
    if (!isOperational && this.config.environment === 'production') {
      logger.error({
        context: 'ErrorHandler',
        message: 'Non-operational error detected - considering shutdown',
      });
    }
  };

  // -------------------------------------------------------------------------
  // Server Lifecycle
  // -------------------------------------------------------------------------
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(this.config.port, this.config.host, () => {
          logger.info({
            context: 'ContentServer',
            message: 'Server started',
            port: this.config.port,
            host: this.config.host,
            environment: this.config.environment,
            url: `http://${this.config.host}:${this.config.port}`,
          });

          // Setup graceful shutdown
          gracefulShutdown.setup(this.server!, async () => {
            await this.cleanup();
          });

          resolve();
        });

        this.server.on('error', (error: NodeJS.ErrnoException) => {
          if (error.code === 'EADDRINUSE') {
            logger.error({
              context: 'ContentServer',
              error,
              message: `Port ${this.config.port} is already in use`,
            });
          } else {
            logger.error({
              context: 'ContentServer',
              error,
              message: 'Server error',
            });
          }
          reject(error);
        });
      } catch (error) {
        logger.error({
          context: 'ContentServer',
          error,
          message: 'Failed to start server',
        });
        reject(error);
      }
    });
  }

  async stop(): Promise<void> {
    if (!this.server) {
      logger.warn({
        context: 'ContentServer',
        message: 'Server is not running',
      });
      return;
    }

    return new Promise((resolve, reject) => {
      this.server!.close((error) => {
        if (error) {
          logger.error({
            context: 'ContentServer',
            error,
            message: 'Error stopping server',
          });
          reject(error);
        } else {
          logger.info({
            context: 'ContentServer',
            message: 'Server stopped',
          });
          this.server = null;
          resolve();
        }
      });
    });
  }

  private async cleanup(): Promise<void> {
    logger.info({
      context: 'ContentServer',
      message: 'Running cleanup tasks',
    });

    // Add any cleanup tasks here (close DB connections, flush logs, etc.)
    // These will be called during graceful shutdown
  }

  // -------------------------------------------------------------------------
  // Getters
  // -------------------------------------------------------------------------
  getApp(): Application {
    return this.app;
  }

  getServer(): HTTPServer | null {
    return this.server;
  }

  isRunning(): boolean {
    return this.server !== null && this.server.listening;
  }

  getConfig(): ServerConfig {
    return { ...this.config };
  }
}

// ---------------------------------------------------------------------------
// Export singleton instance
// ---------------------------------------------------------------------------
export const contentServer = new ContentServer();