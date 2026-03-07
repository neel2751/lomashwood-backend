import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { config } from '../config/configuration';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    permissions: string[];
  };
}

export class JwtStrategy {
  static authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        res.status(401).json({
          success: false,
          message: 'Authorization header is required',
          error: 'AUTHORIZATION_HEADER_MISSING',
        });
        return;
      }

      const token = authHeader.split(' ')[1];
      
      if (!token) {
        res.status(401).json({
          success: false,
          message: 'Token is required',
          error: 'TOKEN_MISSING',
        });
        return;
      }

      const decoded = jwt.verify(token, config.jwt.secret) as any;
      
      req.user = {
        id: decoded.sub,
        email: decoded.email,
        role: decoded.role,
        permissions: decoded.permissions || [],
      };

      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        res.status(401).json({
          success: false,
          message: 'Token has expired',
          error: 'TOKEN_EXPIRED',
        });
        return;
      }
      
      if (error instanceof jwt.JsonWebTokenError) {
        res.status(401).json({
          success: false,
          message: 'Invalid token',
          error: 'TOKEN_INVALID',
        });
        return;
      }

      res.status(401).json({
        success: false,
        message: 'Authentication failed',
        error: 'AUTHENTICATION_FAILED',
      });
    }
  }

  static optional(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return next();
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as any;
      
      req.user = {
        id: decoded.sub,
        email: decoded.email,
        role: decoded.role,
        permissions: decoded.permissions || [],
      };
    } catch (error) {
      // Ignore errors for optional authentication
    }

    next();
  }

  static requireRole(role: string | string[]) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          error: 'AUTHENTICATION_REQUIRED',
        });
        return;
      }

      const requiredRoles = Array.isArray(role) ? role : [role];
      
      if (!requiredRoles.includes(req.user.role)) {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
          error: 'INSUFFICIENT_PERMISSIONS',
        });
        return;
      }

      next();
    };
  }

  static requirePermission(permission: string) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          error: 'AUTHENTICATION_REQUIRED',
        });
        return;
      }

      if (!req.user.permissions.includes(permission)) {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
          error: 'INSUFFICIENT_PERMISSIONS',
        });
        return;
      }

      next();
    };
  }
}
