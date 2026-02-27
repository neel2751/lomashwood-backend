import { Express, RequestHandler, Request, Response, NextFunction } from 'express';
import { rateLimitMiddleware } from './rate-limit.middleware';
import { errorMiddleware } from './error.middleware';
import { requestLoggerMiddleware } from './request-logger.middleware';
import { timeoutMiddleware } from './timeout.middleware';

const corsMiddlewareModule = require('./cors.middleware');
const corsMiddleware: RequestHandler =
  corsMiddlewareModule.corsMiddleware ||
  corsMiddlewareModule.default ||
  corsMiddlewareModule;
  
function getRateLimitHandler(): RequestHandler {
  const rl = rateLimitMiddleware as any;
  if (typeof rl === 'function') return rl as RequestHandler;
  if (rl && typeof rl.global === 'function') return rl.global as RequestHandler;
  if (rl && typeof rl.default === 'function') return rl.default as RequestHandler;
  return function(_req: Request, _res: Response, next: NextFunction): void { next(); };
}

export function applyGlobalMiddleware(app: Express): void {
  app.use(corsMiddleware);
  app.use(requestLoggerMiddleware as RequestHandler);
  app.use(getRateLimitHandler());
  app.use(timeoutMiddleware as RequestHandler);
}

export function applyErrorMiddleware(app: Express): void {
  app.use(errorMiddleware as any);
}

export * from './auth.middleware';
export * from './rate-limit.middleware';
export * from './error.middleware';
export * from './timeout.middleware';
export * from './validation.middleware';

export {
  corsMiddleware
};

export {
  requestLoggerMiddleware,
  errorLoggerMiddleware,
  performanceLoggerMiddleware,
  securityLoggerMiddleware
} from './request-logger.middleware';