import { Request, Response, NextFunction, RequestHandler } from 'express';
import { UnauthorizedError, ForbiddenError } from '../../shared/errors';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    roles: string[];
  };
}

export const requireAuth: RequestHandler = (req, res, next) => {
  const r = req as AuthenticatedRequest;
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    const error = new UnauthorizedError('Missing authentication token');
    res.status(error.statusCode).json(error.toJSON());
    return;
  }

  // TODO: Implement JWT verification
  // For now, pass through - authentication should be implemented in the JWT service
  next();
};

export const requireRole = (...allowedRoles: string[]) => {
  return ((req, res, next) => {
    const r = req as AuthenticatedRequest;
    if (!r.user) {
      const error = new UnauthorizedError('Authentication required');
      res.status(error.statusCode).json(error.toJSON());
      return;
    }

    const userRoles = r.user.roles || [];
    const hasRole = allowedRoles.some(role => userRoles.includes(role));

    if (!hasRole) {
      const error = new ForbiddenError(`Required roles: ${allowedRoles.join(', ')}`);
      res.status(error.statusCode).json(error.toJSON());
      return;
    }

    next();
  }) as RequestHandler;
};

export const createRouterFactory = () => {
  return {
    requireAuth,
    requireRole,
  };
};
