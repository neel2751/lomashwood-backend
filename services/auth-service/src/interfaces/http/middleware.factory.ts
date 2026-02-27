import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

export default class MiddlewareFactory {

  static authenticate() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'No token provided' },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const token = authHeader.split(' ')[1];

      (req as any).token = token;

      next();
    };
  }

  static authorize(...roles: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const user = (req as any).user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const userRoles: string[] = user.roles || [];
      const hasRole = roles.some((role) => userRoles.includes(role));

      if (!hasRole) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Insufficient permissions' },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      next();
    };
  }

  static validateRequest(schema: AnyZodObject) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        await schema.parseAsync({
          body: req.body,
          query: req.query,
          params: req.params,
        });
        next();
      } catch (error) {
        if (error instanceof ZodError) {
          res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid request data',
              details: error.errors,
            },
            timestamp: new Date().toISOString(),
          });
          return;
        }
        next(error);
      }
    };
  }

  static timeoutMiddleware(_req: Request, res: Response, next: NextFunction): void {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          error: { code: 'REQUEST_TIMEOUT', message: 'Request timed out' },
          timestamp: new Date().toISOString(),
        });
      }
    }, 30_000);

    res.on('finish', () => clearTimeout(timeout));
    res.on('close', () => clearTimeout(timeout));

    next();
  }

  static requestLoggerMiddleware(_req: Request, _res: Response, next: NextFunction): void {
    next();
  }

  static errorMiddleware(err: Error, _req: Request, res: Response, _next: NextFunction): void {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: err.message },
      timestamp: new Date().toISOString(),
    });
  }
}