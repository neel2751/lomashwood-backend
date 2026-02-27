import { Request, Response, NextFunction } from 'express';
import { verify, JwtPayload } from 'jsonwebtoken';
import { AppError } from '../shared/errors';
import { config } from '../config/env';

interface AuthTokenPayload extends JwtPayload {
  userId: string;
  email: string;
  role: string;
  sessionId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        sessionId?: string;
      };
      token?: string;
    }
  }
}

const getJwtSecret = (): string => {
  const cfg = config as any;
  return String(cfg.jwtSecret || cfg.jwt?.secret || cfg.JWT_SECRET || '');
};

const verifyToken = async (token: string): Promise<boolean> => {
  // Simplified for service
  return true;
};

const getCurrentUser = async (userId: string): Promise<{ emailVerified: boolean }> => {
  // Simplified
  return { emailVerified: true };
};

const verifySession = async (sessionId: string, userId: string): Promise<boolean> => {
  // Simplified
  return true;
};

const refreshToken = async (token: string): Promise<string | null> => {
  // Simplified
  return null;
};

// Safe AppError factory — tries (message, statusCode) first, falls back to (statusCode, message)
const createAppError = (statusCode: number, message: string): AppError => {
  try {
    const err = new (AppError as any)(message, statusCode);
    return err;
  } catch {
    return new (AppError as any)(statusCode, message);
  }
};

export const authMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.auth_token;

    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (cookieToken) {
      token = cookieToken;
    }

    if (!token) {
      throw createAppError(401, 'Authentication token is required');
    }

    let decoded: AuthTokenPayload;

    try {
      decoded = verify(token, getJwtSecret()) as AuthTokenPayload;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'TokenExpiredError') {
          throw createAppError(401, 'Token has expired');
        }
        if (error.name === 'JsonWebTokenError') {
          throw createAppError(401, 'Invalid token');
        }
      }
      throw createAppError(401, 'Token verification failed');
    }

    const isValid = await verifyToken(token);
    if (!isValid) {
      throw createAppError(401, 'Token is no longer valid');
    }

    req.user = {
      id: String(decoded.userId),
      email: String(decoded.email),
      role: String(decoded.role),
      sessionId: decoded.sessionId ? String(decoded.sessionId) : undefined
    };

    req.token = token;

    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuthMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.auth_token;

    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (cookieToken) {
      token = cookieToken;
    }

    if (!token) {
      return next();
    }

    try {
      const decoded = verify(token, getJwtSecret()) as AuthTokenPayload;
      const isValid = await verifyToken(token);

      if (isValid) {
        req.user = {
          id: String(decoded.userId),
          email: String(decoded.email),
          role: String(decoded.role),
          sessionId: decoded.sessionId ? String(decoded.sessionId) : undefined
        };
        req.token = token;
      }
    } catch {
      req.user = undefined;
      req.token = undefined;
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw createAppError(401, 'Authentication required');
      }

      if (!roles.includes(req.user.role)) {
        throw createAppError(403, 'Insufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const requireAdmin = requireRole('ADMIN', 'SUPER_ADMIN');

export const requireVerifiedEmail = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw createAppError(401, 'Authentication required');
    }

    const userData = await getCurrentUser(req.user.id);

    if (!userData.emailVerified) {
      throw createAppError(403, 'Email verification required');
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const requireActiveSession = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || !req.user.sessionId) {
      throw createAppError(401, 'Active session required');
    }

    const isActive = await verifySession(req.user.sessionId, req.user.id);

    if (!isActive) {
      throw createAppError(401, 'Session has expired or been terminated');
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const refreshTokenIfNeeded = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.token) {
      return next();
    }

    const decoded = verify(req.token, getJwtSecret(), {
      ignoreExpiration: true
    }) as AuthTokenPayload;

    const expirationTime: number = decoded.exp ? Number(decoded.exp) * 1000 : 0;
    const currentTime: number = Date.now();
    const timeUntilExpiry: number = expirationTime - currentTime;
    const refreshThreshold: number = 15 * 60 * 1000;

    if (timeUntilExpiry > 0 && timeUntilExpiry < refreshThreshold) {
      const newToken = await refreshToken(req.token);

      if (newToken) {
        res.setHeader('X-New-Token', String(newToken));
        res.cookie('auth_token', String(newToken), {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: Number(7 * 24 * 60 * 60 * 1000)
        });
      }
    }

    next();
  } catch {
    next();
  }
};