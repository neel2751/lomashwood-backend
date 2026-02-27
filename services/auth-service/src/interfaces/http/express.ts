import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { logger } from '../../config/logger';

export const corsMiddleware = cors({
  origin: process.env['ALLOWED_ORIGINS']?.split(',') || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

export const rateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

export const requestLoggerMiddleware = (
  req: Request,
  _res: Response,
  next: express.NextFunction
): void => {
  logger.info(`[${req.method}] ${req.path}`);
  next();
};

export const timeoutMiddleware = (
  _req: Request,
  res: Response,
  next: express.NextFunction
): void => {
  const TIMEOUT_MS = 30_000;
  const timer = setTimeout(() => {
    if (!res.headersSent) {
      res.status(503).json({ success: false, message: 'Request timeout' });
    }
  }, TIMEOUT_MS);

  res.on('finish', () => clearTimeout(timer));
  next();
};

export const errorMiddleware = (
  err: Error & { status?: number; statusCode?: number },
  _req: Request,
  res: Response,
  _next: express.NextFunction
): void => {
  const status = err.status ?? err.statusCode ?? 500;
  logger.error(`Error: ${err.message}`);
  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error',
  });
};

export class ExpressApp {
  private app: Application;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
  }

  private initializeMiddlewares(): void {
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
        hsts: {
          maxAge: 31_536_000,
          includeSubDomains: true,
          preload: true,
        },
      })
    );

    this.app.use(compression() as unknown as express.RequestHandler);
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    this.app.use(cookieParser());
    this.app.use(corsMiddleware);
    this.app.use(requestLoggerMiddleware);
    this.app.use(timeoutMiddleware);
    this.app.use(rateLimitMiddleware);

    this.app.disable('x-powered-by');
    this.app.set('trust proxy', 1);
  }

  public registerRoutes(routes: { path: string; router: express.Router }[]): void {
    routes.forEach(({ path, router }) => {
      this.app.use(path, router);
      logger.info(`Route registered: ${path}`);
    });
  }

  public registerHealthCheck(): void {
    this.app.get('/health', (_req: Request, res: Response) => {
      res.status(200).json({
        status: 'healthy',
        service: 'auth-service',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    });

    this.app.get('/ready', (_req: Request, res: Response) => {
      res.status(200).json({
        status: 'ready',
        service: 'auth-service',
        timestamp: new Date().toISOString(),
      });
    });

    logger.info('Health check routes registered');
  }

  public registerErrorHandlers(): void {
    this.app.use((_req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        message: 'Route not found',
        path: _req.path,
      });
    });

    this.app.use(errorMiddleware);

    logger.info('Error handlers registered');
  }

  public getApp(): Application {
    return this.app;
  }
}

export const createExpressApp = (): ExpressApp => new ExpressApp();