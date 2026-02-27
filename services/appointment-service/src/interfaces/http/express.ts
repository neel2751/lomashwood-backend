import { Request, Response, NextFunction } from 'express';
import { APPOINTMENT_TYPE } from '../../app/bookings/booking.constants';
import { BOOKING_STATUS } from '../../app/bookings/booking.constants';
import { REMINDER_TYPE, REMINDER_STATUS, REMINDER_CHANNEL } from '../../app/reminders/reminder.constants';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  sessionId: string;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

export interface PaginatedQuery {
  page?: string;
  limit?: string;
}

export interface BookingQuery extends PaginatedQuery {
  status?: BOOKING_STATUS;
  appointmentType?: APPOINTMENT_TYPE;
  consultantId?: string;
  from?: string;
  to?: string;
  search?: string;
}

export interface AvailabilityQuery extends PaginatedQuery {
  consultantId?: string;
  from?: string;
  to?: string;
  isAvailable?: string;
}

export interface ConsultantQuery extends PaginatedQuery {
  isActive?: string;
  showroomId?: string;
  specialization?: string;
  from?: string;
  to?: string;
  search?: string;
}

export interface ReminderQuery extends PaginatedQuery {
  status?: REMINDER_STATUS;
  type?: REMINDER_TYPE;
  channel?: REMINDER_CHANNEL;
  bookingId?: string;
  from?: string;
  to?: string;
}

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    stack?: string;
  };
  timestamp: string;
}

export interface ApiPaginatedResponse<T = unknown> {
  success: true;
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  timestamp: string;
}

export type ApiResponse<T = unknown> =
  | ApiSuccessResponse<T>
  | ApiErrorResponse
  | ApiPaginatedResponse<T>;

export type ExpressMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => void | Promise<void>;

export type ExpressErrorMiddleware = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => void | Promise<void>;

export type ExpressHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void>;

export type AuthenticatedHandler = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => Promise<void>;

export interface RequestWithBody<T> extends Request {
  body: T;
}

export interface RequestWithQuery<T> extends Request {
  query: T & { [key: string]: string | string[] | undefined };
}

export interface RequestWithParams<T> extends Request {
  params: T & { [key: string]: string };
}

export interface RequestWithAll<TBody, TQuery, TParams> extends Request {
  body: TBody;
  query: TQuery & { [key: string]: string | string[] | undefined };
  params: TParams & { [key: string]: string };
  user?: AuthenticatedUser;
}

export interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

export interface RequestWithFile extends Request {
  file?: MulterFile;
  files?: MulterFile[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      requestId?: string;
      startTime?: number;
    }
  }
}