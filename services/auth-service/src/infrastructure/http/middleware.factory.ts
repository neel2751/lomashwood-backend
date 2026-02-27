import { Request, Response, NextFunction } from 'express';

export function requestLoggerMiddleware(req: Request, _res: Response, next: NextFunction): void {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
}

export function errorMiddleware(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: { message: err.message },
    timestamp: new Date().toISOString(),
  });
}

export function timeoutMiddleware(_req: Request, res: Response, next: NextFunction): void {
  res.setTimeout(30000, () => {
    res.status(408).json({
      success: false,
      error: { code: 'REQUEST_TIMEOUT', message: 'Request timed out' },
    });
  });
  next();
}