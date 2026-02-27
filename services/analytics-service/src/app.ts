import express, { type Application, type Request, type Response, type NextFunction } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import { pinoHttp } from 'pino-http';
import { randomUUID } from 'crypto';

import { env } from './config/env';
import { corsMiddleware } from './config/cors';
import { rateLimitMiddleware } from './config/rate-limit';
import { logger } from './config/logger';
import { registerRoutes } from './interfaces/http/router.factory';

export function createApp(): Application {
  const app = express();

  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(
    helmet({
      contentSecurityPolicy: env.NODE_ENV === 'production',
      crossOriginEmbedderPolicy: false,
      hsts: env.NODE_ENV === 'production',
    }),
  );

  app.use(corsMiddleware as any);

  app.use(
  compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
      if ((req as unknown as Request).headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
  }) as unknown as any,
);

  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  // request-id middleware (inlined)
  app.use((req: Request, _res: Response, next: NextFunction) => {
    const id = req.headers['x-request-id'] ?? randomUUID();
    (req as any).id = id;
    next();
  });

  app.use(
    pinoHttp({
      logger,
      quietReqLogger: true,
      customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
      customSuccessMessage: (req, res) => `${req.method} ${req.url} — ${res.statusCode}`,
      customErrorMessage: (req, res, err) => `${req.method} ${req.url} — ${res.statusCode} — ${err.message}`,
      serializers: {
        req: (req: any) => ({
          id: req.id,
          method: req.method,
          url: req.url,
          userAgent: req.headers['user-agent'],
        }),
        res: (res: any) => ({
          statusCode: res.statusCode,
        }),
      },
    }),
  );

  // timeout middleware (inlined) — fixed: added missing `req` parameter
  app.use((_req: Request, res: Response, next: NextFunction) => {
    const timeout = env.REQUEST_TIMEOUT_MS ?? 30000;
    const timer = setTimeout(() => {
      res.status(503).json({ error: 'Request timeout' });
    }, timeout);
    res.on('finish', () => clearTimeout(timer));
    res.on('close', () => clearTimeout(timer));
    next();
  });

  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      service: env.SERVICE_NAME,
      version: env.SERVICE_VERSION,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  app.use(rateLimitMiddleware as any);

  registerRoutes(app);

  // not-found middleware (inlined)
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found' });
  });

  // error middleware (inlined)
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status ?? err.statusCode ?? 500;
    const message = err.message ?? 'Internal Server Error';
    logger.error({ err }, message);
    res.status(status).json({ error: message });
  });

  return app;
}

// Default export for use in tests and server entry point
export default createApp();