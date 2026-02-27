import { Response } from 'express';

export type ApiStatus = 'success' | 'error' | 'fail';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiResponse<T = unknown> {
  status: ApiStatus;
  message: string;
  data?: T;
  meta?: PaginationMeta;
  errors?: ApiErrorDetail[];
  timestamp: string;
  requestId?: string;
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

export interface TrackingEventResponse {
  eventId: string;
  sessionId: string;
  tracked: boolean;
  timestamp: string;
}

export interface FunnelSummaryResponse {
  funnelId: string;
  name: string;
  totalSteps: number;
  conversionRate: number;
  dropOffStep?: string;
}

export interface DashboardMetricResponse {
  metric: string;
  value: number;
  unit?: string;
  change?: number;
  changePeriod?: string;
}

export interface ExportResponse {
  exportId: string;
  format: 'csv' | 'json' | 'xlsx';
  downloadUrl?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  expiresAt?: string;
}

class ResponseBuilder {

  success<T>(
    res: Response,
    data: T,
    message = 'Request successful',
    statusCode = 200,
    meta?: PaginationMeta,
    requestId?: string,
  ): Response {
    const body: ApiResponse<T> = {
      status: 'success',
      message,
      data,
      timestamp: new Date().toISOString(),
      ...(meta && { meta }),
      ...(requestId && { requestId }),
    };
    return res.status(statusCode).json(body);
  }

  created<T>(
    res: Response,
    data: T,
    message = 'Resource created successfully',
    requestId?: string,
  ): Response {
    return this.success(res, data, message, 201, undefined, requestId);
  }

  paginated<T>(
    res: Response,
    data: T[],
    meta: PaginationMeta,
    message = 'Data retrieved successfully',
    requestId?: string,
  ): Response {
    return this.success(res, data, message, 200, meta, requestId);
  }

  noContent(res: Response): Response {
    return res.status(204).send();
  }

  badRequest(
    res: Response,
    message = 'Bad request',
    errors?: ApiErrorDetail[],
    requestId?: string,
  ): Response {
    const body: ApiResponse<null> = {
      status: 'fail',
      message,
      data: null,
      timestamp: new Date().toISOString(),
      ...(errors && { errors }),
      ...(requestId && { requestId }),
    };
    return res.status(400).json(body);
  }

  unauthorized(
    res: Response,
    message = 'Authentication required',
    requestId?: string,
  ): Response {
    const body: ApiResponse<null> = {
      status: 'fail',
      message,
      data: null,
      timestamp: new Date().toISOString(),
      ...(requestId && { requestId }),
    };
    return res.status(401).json(body);
  }

  forbidden(
    res: Response,
    message = 'Access denied',
    requestId?: string,
  ): Response {
    const body: ApiResponse<null> = {
      status: 'fail',
      message,
      data: null,
      timestamp: new Date().toISOString(),
      ...(requestId && { requestId }),
    };
    return res.status(403).json(body);
  }

  notFound(
    res: Response,
    message = 'Resource not found',
    requestId?: string,
  ): Response {
    const body: ApiResponse<null> = {
      status: 'fail',
      message,
      data: null,
      timestamp: new Date().toISOString(),
      ...(requestId && { requestId }),
    };
    return res.status(404).json(body);
  }

  conflict(
    res: Response,
    message = 'Resource conflict',
    requestId?: string,
  ): Response {
    const body: ApiResponse<null> = {
      status: 'fail',
      message,
      data: null,
      timestamp: new Date().toISOString(),
      ...(requestId && { requestId }),
    };
    return res.status(409).json(body);
  }

  validationError(
    res: Response,
    errors: ApiErrorDetail[],
    message = 'Validation failed',
    requestId?: string,
  ): Response {
    const body: ApiResponse<null> = {
      status: 'fail',
      message,
      data: null,
      errors,
      timestamp: new Date().toISOString(),
      ...(requestId && { requestId }),
    };
    return res.status(422).json(body);
  }

  tooManyRequests(
    res: Response,
    message = 'Too many requests. Please slow down.',
    requestId?: string,
  ): Response {
    const body: ApiResponse<null> = {
      status: 'fail',
      message,
      data: null,
      timestamp: new Date().toISOString(),
      ...(requestId && { requestId }),
    };
    return res.status(429).json(body);
  }

  internalError(
    res: Response,
    message = 'An unexpected error occurred',
    requestId?: string,
  ): Response {
    const body: ApiResponse<null> = {
      status: 'error',
      message,
      data: null,
      timestamp: new Date().toISOString(),
      ...(requestId && { requestId }),
    };
    return res.status(500).json(body);
  }

  serviceUnavailable(
    res: Response,
    message = 'Service temporarily unavailable',
    requestId?: string,
  ): Response {
    const body: ApiResponse<null> = {
      status: 'error',
      message,
      data: null,
      timestamp: new Date().toISOString(),
      ...(requestId && { requestId }),
    };
    return res.status(503).json(body);
  }

  eventTracked(
    res: Response,
    payload: TrackingEventResponse,
    requestId?: string,
  ): Response {
    return this.created(res, payload, 'Event tracked successfully', requestId);
  }

  funnelResult<T>(
    res: Response,
    data: T,
    message = 'Funnel data retrieved',
    requestId?: string,
  ): Response {
    return this.success(res, data, message, 200, undefined, requestId);
  }

  dashboardData<T>(
    res: Response,
    data: T,
    message = 'Dashboard data retrieved',
    requestId?: string,
  ): Response {
    return this.success(res, data, message, 200, undefined, requestId);
  }

  exportAccepted(
    res: Response,
    payload: ExportResponse,
    requestId?: string,
  ): Response {
    const body: ApiResponse<ExportResponse> = {
      status: 'success',
      message: 'Export job queued successfully',
      data: payload,
      timestamp: new Date().toISOString(),
      ...(requestId && { requestId }),
    };
    return res.status(202).json(body);
  }
}

export const sendResponse = new ResponseBuilder();

export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number,
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

export function mapZodErrors(
  issues: Array<{ path: (string | number)[]; message: string; code: string }>,
): ApiErrorDetail[] {
  return issues.map((issue) => ({
    field: issue.path.join('.') || undefined,
    message: issue.message,
    code: issue.code,
  }));
}

export function sendSuccess(res: Response, data: unknown, statusCode: number): Response {
  return sendResponse.success(res, data, 'Request successful', statusCode);
}

export function sendCreated(res: Response, data: unknown): Response {
  return sendResponse.created(res, data);
}