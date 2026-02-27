import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { ParamsDictionary } from 'express-serve-static-core';

export interface TypedRequest<
  TBody = unknown,
  TQuery = unknown,
  TParams extends ParamsDictionary = Record<string, string>,
> extends Request<TParams, unknown, TBody> {
  body: TBody;
  query: TQuery & Record<string, string | string[] | undefined>;
  params: TParams;
}

export interface TypedResponse<T = unknown> extends Response {
  json: (body: ApiResponse<T>) => this;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: ValidationError[];
  meta?: ResponseMeta;
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface ResponseMeta {
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  timestamp: string;
  requestId?: string;
}

export interface PaginatedQuery {
  page?: string;
  limit?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    sessionId: string;
  };
  requestId?: string;
}

export type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void>;

export function asyncHandler(fn: AsyncHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}