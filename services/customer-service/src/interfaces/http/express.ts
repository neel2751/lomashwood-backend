import { Request } from 'express';

export interface AuthUser {
  id: string;
  userId: string;
  email: string;
  role: UserRole;
  sessionId: string;
}

export type UserRole = 'customer' | 'admin' | 'agent' | 'super_admin';

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: PaginationMeta;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  requestId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      requestId?: string;
      startTime?: number;
    }
  }
}

export type AuthenticatedRequest = Request & {
  user: AuthUser;
};

export type PaginatedRequest = Request & {
  pagination: {
    page: number;
    limit: number;
    skip: number;
  };
};