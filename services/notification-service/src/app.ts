
import express, {
  type Application,
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import pinoHttp from 'pino-http';

import { corsMiddleware }         from './middleware/cors.middleware';
import { rateLimitMiddleware }    from './middleware/rate-limit.middleware';
import { timeoutMiddleware }      from './middleware/timeout.middleware';
import { validationMiddleware }   from './middleware/validation.middleware';
import { errorMiddleware }        from './middleware/error.middleware';
import { notFoundMiddleware }     from './middleware/not-found.middleware';
import { requestIdMiddleware }    from './middleware/request-id.middleware';

import { registerRoutes }         from './routes';
import { env }                    from './config/env';
import { createLogger }           from './config/logger';
import { AppError }               from './shared/errors';

const logger = createLogger('app');


export function createApp(): Application {
  const app = express();

  app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc:  ["'self'"],
          scriptSrc:   ["'self'"],
          styleSrc:    ["'self'"],
          imgSrc:      ["'self'", 'data:'],
          connectSrc:  ["'self'"],
          fontSrc:     ["'self'"],
          objectSrc:   ["'none'"],
          frameSrc:    ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
      crossOriginEmbedderPolicy: false, // Relaxed for API service
      hsts: {
        maxAge:            31_536_000, // 1 year
        includeSubDomains: true,
        preload:           true,
      },
    }),
  );

  app.use(corsMiddleware);

  app.use(
    compression({
      level:     6,
      threshold: 1024, // Only compress responses > 1KB
      filter: (req: Request, res: Response): boolean => {
        if (req.headers['x-no-compression'] !== undefined) {
          return false;
        }
        return compression.filter(req, res);
      },
    }),
  );

  app.use(requestIdMiddleware);

  app.use(
    pinoHttp({
      logger,
      quietReqLogger: false,
      customLogLevel: (_req: Request, res: Response, err?: Error): string => {
        if (err !== undefined || res.statusCode >= 500) { return 'error'; }
        if (res.statusCode >= 400)                       { return 'warn';  }
        return 'info';
      },
      customSuccessMessage: (req: Request, res: Response): string =>
        `${req.method} ${req.url} → ${res.statusCode}`,
      customErrorMessage: (req: Request, _res: Response, err: Error): string =>
        `${req.method} ${req.url} → ${err.message}`,
      serializers: {
        req: (req) => ({
          id:        req.id,
          method:    req.method,
          url:       req.url,
          userAgent: req.headers['user-agent'],
          ip:        req.remoteAddress,
        }),
        res: (res) => ({
          statusCode: res.statusCode,
        }),
      },
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'req.headers["x-api-key"]',
          'req.body.password',
          'req.body.token',
          'req.body.secret',
        ],
        censor: '[REDACTED]',
      },
    }),
  );

  app.use(
    express.json({
      limit:  env.REQUEST_BODY_LIMIT,
      strict: true,
    }),
  );

  app.use(
    express.urlencoded({
      extended: true,
      limit:    env.REQUEST_BODY_LIMIT,
    }),
  );

  app.use(cookieParser());

  app.use(timeoutMiddleware);

  app.use(rateLimitMiddleware);

  app.use(validationMiddleware);

  app.get(
    env.HEALTH_CHECK_PATH,
    (_req: Request, res: Response): void => {
      res.status(200).json({
        status:    'ok',
        service:   env.SERVICE_NAME,
        version:   env.SERVICE_VERSION,
        timestamp: new Date().toISOString(),
        uptime:    Math.floor(process.uptime()),
        env:       env.NODE_ENV,
      });
    },
  );

  app.get('/live', (_req: Request, res: Response): void => {
    res.status(200).json({ status: 'live' });
  });

  app.get('/ready', (_req: Request, res: Response): void => {
    res.status(200).json({ status: 'ready' });
  });

  registerRoutes(app);

  
  app.use(notFoundMiddleware);

  
  app.use(
    (
      err:  Error | AppError,
      req:  Request,
      res:  Response,
      next: NextFunction,
    ): void => {
      errorMiddleware(err, req, res, next);
    },
  );

  logger.info(
    { prefix: env.API_PREFIX, env: env.NODE_ENV },
    'Express application configured successfully.',
  );

  return app;
}