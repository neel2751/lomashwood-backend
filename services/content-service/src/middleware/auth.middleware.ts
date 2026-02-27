import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';

interface User {
  id: string;
  role: string;
  email?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7);

  try {
    // In test environment, decode from base64
    if (process.env.NODE_ENV === 'test') {
      const payload = JSON.parse(Buffer.from(token, 'base64').toString());
      req.user = payload;
    } else {
      // In real environment, verify JWT
      // For now, mock
      req.user = { id: 'user-1', role: 'USER' };
    }
    next();
  } catch (error) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ error: 'Invalid token' });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(StatusCodes.FORBIDDEN).json({ error: 'Admin access required' });
  }
  next();
}