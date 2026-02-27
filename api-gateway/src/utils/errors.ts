import { HTTP_STATUS, ERROR_CODES } from './constants';

export interface ErrorDetails {
  code: string;
  message: string;
  statusCode: number;
  details?: any;
  stack?: string;
  timestamp: Date;
  path?: string;
  method?: string;
  requestId?: string;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: any;
  public readonly isOperational: boolean;
  public readonly timestamp: Date;
  public readonly path?: string;
  public readonly method?: string;
  public readonly requestId?: string;

  constructor(
    message: string,
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    code: string = ERROR_CODES.INTERNAL_SERVER_ERROR,
    details?: any,
    isOperational: boolean = true
  ) {
    super(message);
    
    Object.setPrototypeOf(this, new.target.prototype);
    
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;
    this.timestamp = new Date();

    Error.captureStackTrace(this);
  }

  toJSON(): ErrorDetails {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
      stack: process.env.NODE_ENV === 'development' ? this.stack : undefined,
      timestamp: this.timestamp,
      path: this.path,
      method: this.method,
      requestId: this.requestId,
    };
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', details?: any) {
    super(message, HTTP_STATUS.UNPROCESSABLE_ENTITY, ERROR_CODES.VALIDATION_ERROR, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.AUTHENTICATION_ERROR);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHORIZATION_ERROR);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', resource?: string) {
    super(
      message,
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.RESOURCE_NOT_FOUND,
      resource ? { resource } : undefined
    );
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict', details?: any) {
    super(message, HTTP_STATUS.CONFLICT, ERROR_CODES.RESOURCE_CONFLICT, details);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request', details?: any) {
    super(message, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.BAD_REQUEST, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(message, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.AUTHENTICATION_ERROR);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, HTTP_STATUS.FORBIDDEN, ERROR_CODES.FORBIDDEN);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded', retryAfter?: number) {
    super(
      message,
      HTTP_STATUS.TOO_MANY_REQUESTS,
      ERROR_CODES.RATE_LIMIT_EXCEEDED,
      retryAfter ? { retryAfter } : undefined
    );
  }
}

export class ServiceError extends AppError {
  public readonly serviceName?: string;

  constructor(
    message: string,
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    code: string = ERROR_CODES.SERVICE_UNAVAILABLE,
    details?: any
  ) {
    super(message, statusCode, code, details);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database error', details?: any) {
    super(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.DATABASE_ERROR, details, false);
  }
}

export class NetworkError extends AppError {
  constructor(message: string = 'Network error', details?: any) {
    super(message, HTTP_STATUS.SERVICE_UNAVAILABLE, ERROR_CODES.NETWORK_ERROR, details);
  }
}

export class TimeoutError extends AppError {
  constructor(message: string = 'Request timeout') {
    super(message, HTTP_STATUS.GATEWAY_TIMEOUT, ERROR_CODES.TIMEOUT_ERROR);
  }
}

export class PaymentError extends AppError {
  constructor(message: string = 'Payment failed', details?: any) {
    super(message, HTTP_STATUS.PAYMENT_REQUIRED, ERROR_CODES.PAYMENT_FAILED, details);
  }
}

export class BookingError extends AppError {
  constructor(message: string = 'Booking failed', details?: any) {
    super(message, HTTP_STATUS.CONFLICT, ERROR_CODES.BOOKING_CONFLICT, details);
  }
}

export class FileUploadError extends AppError {
  constructor(message: string = 'File upload failed', details?: any) {
    super(message, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.UPLOAD_FAILED, details);
  }
}

export class InvalidFileTypeError extends AppError {
  constructor(message: string = 'Invalid file type', allowedTypes?: string[]) {
    super(
      message,
      HTTP_STATUS.UNSUPPORTED_MEDIA_TYPE,
      ERROR_CODES.INVALID_FILE_TYPE,
      allowedTypes ? { allowedTypes } : undefined
    );
  }
}

export class FileTooLargeError extends AppError {
  constructor(message: string = 'File too large', maxSize?: number) {
    super(
      message,
      HTTP_STATUS.PAYLOAD_TOO_LARGE,
      ERROR_CODES.FILE_TOO_LARGE,
      maxSize ? { maxSize } : undefined
    );
  }
}

export class InvalidCredentialsError extends AppError {
  constructor(message: string = 'Invalid credentials') {
    super(message, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.INVALID_CREDENTIALS);
  }
}

export class TokenExpiredError extends AppError {
  constructor(message: string = 'Token expired') {
    super(message, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.TOKEN_EXPIRED);
  }
}

export class TokenInvalidError extends AppError {
  constructor(message: string = 'Invalid token') {
    super(message, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.TOKEN_INVALID);
  }
}

export class SessionExpiredError extends AppError {
  constructor(message: string = 'Session expired') {
    super(message, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.SESSION_EXPIRED);
  }
}

export class InvalidSessionError extends AppError {
  constructor(message: string = 'Invalid session') {
    super(message, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.INVALID_SESSION);
  }
}

export class DuplicateEntryError extends AppError {
  constructor(message: string = 'Duplicate entry', field?: string) {
    super(
      message,
      HTTP_STATUS.CONFLICT,
      ERROR_CODES.DUPLICATE_ENTRY,
      field ? { field } : undefined
    );
  }
}

export class InsufficientPermissionsError extends AppError {
  constructor(message: string = 'Insufficient permissions', requiredPermission?: string) {
    super(
      message,
      HTTP_STATUS.FORBIDDEN,
      ERROR_CODES.INSUFFICIENT_PERMISSIONS,
      requiredPermission ? { requiredPermission } : undefined
    );
  }
}

export class AccountLockedError extends AppError {
  constructor(message: string = 'Account locked') {
    super(message, HTTP_STATUS.FORBIDDEN, ERROR_CODES.ACCOUNT_LOCKED);
  }
}

export class AccountSuspendedError extends AppError {
  constructor(message: string = 'Account suspended') {
    super(message, HTTP_STATUS.FORBIDDEN, ERROR_CODES.ACCOUNT_SUSPENDED);
  }
}

export class EmailNotVerifiedError extends AppError {
  constructor(message: string = 'Email not verified') {
    super(message, HTTP_STATUS.FORBIDDEN, ERROR_CODES.EMAIL_NOT_VERIFIED);
  }
}

export class MaintenanceError extends AppError {
  constructor(message: string = 'Service under maintenance') {
    super(message, HTTP_STATUS.SERVICE_UNAVAILABLE, ERROR_CODES.MAINTENANCE_MODE);
  }
}

export class CircuitBreakerError extends AppError {
  constructor(serviceName: string) {
    super(
      `Circuit breaker open for service: ${serviceName}`,
      HTTP_STATUS.SERVICE_UNAVAILABLE,
      ERROR_CODES.CIRCUIT_BREAKER_OPEN,
      { serviceName }
    );
  }
}

export class ProductNotAvailableError extends AppError {
  constructor(message: string = 'Product not available', productId?: string) {
    super(
      message,
      HTTP_STATUS.CONFLICT,
      ERROR_CODES.PRODUCT_NOT_AVAILABLE,
      productId ? { productId } : undefined
    );
  }
}

export class ProductOutOfStockError extends AppError {
  constructor(message: string = 'Product out of stock', productId?: string) {
    super(
      message,
      HTTP_STATUS.CONFLICT,
      ERROR_CODES.PRODUCT_OUT_OF_STOCK,
      productId ? { productId } : undefined
    );
  }
}

export class SlotUnavailableError extends AppError {
  constructor(message: string = 'Time slot not available', slot?: string) {
    super(
      message,
      HTTP_STATUS.CONFLICT,
      ERROR_CODES.SLOT_UNAVAILABLE,
      slot ? { slot } : undefined
    );
  }
}

export class InsufficientLoyaltyPointsError extends AppError {
  constructor(message: string = 'Insufficient loyalty points', required?: number, available?: number) {
    super(
      message,
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.LOYALTY_INSUFFICIENT_POINTS,
      { required, available }
    );
  }
}

export class CouponInvalidError extends AppError {
  constructor(message: string = 'Invalid coupon', couponCode?: string) {
    super(
      message,
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.COUPON_INVALID,
      couponCode ? { couponCode } : undefined
    );
  }
}

export class CouponExpiredError extends AppError {
  constructor(message: string = 'Coupon expired', couponCode?: string) {
    super(
      message,
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.COUPON_EXPIRED,
      couponCode ? { couponCode } : undefined
    );
  }
}

export const isOperationalError = (error: Error): boolean => {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
};

export const handleError = (error: Error): AppError => {
  if (error instanceof AppError) {
    return error;
  }

  return new AppError(
    error.message || 'An unexpected error occurred',
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
    ERROR_CODES.INTERNAL_SERVER_ERROR,
    undefined,
    false
  );
};

export const createValidationError = (errors: any[]): ValidationError => {
  const formattedErrors = errors.map(err => ({
    field: err.path || err.field,
    message: err.message,
    value: err.value,
  }));

  return new ValidationError('Validation failed', formattedErrors);
};

export const createNotFoundError = (resource: string, identifier?: string | number): NotFoundError => {
  const message = identifier
    ? `${resource} with identifier '${identifier}' not found`
    : `${resource} not found`;
  
  return new NotFoundError(message, resource);
};

export const createConflictError = (resource: string, field?: string): ConflictError => {
  const message = field
    ? `${resource} with this ${field} already exists`
    : `${resource} already exists`;
  
  return new ConflictError(message, field ? { field } : undefined);
};

export default {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  RateLimitError,
  ServiceError,
  DatabaseError,
  NetworkError,
  TimeoutError,
  PaymentError,
  BookingError,
  FileUploadError,
  InvalidFileTypeError,
  FileTooLargeError,
  InvalidCredentialsError,
  TokenExpiredError,
  TokenInvalidError,
  SessionExpiredError,
  InvalidSessionError,
  DuplicateEntryError,
  InsufficientPermissionsError,
  AccountLockedError,
  AccountSuspendedError,
  EmailNotVerifiedError,
  MaintenanceError,
  CircuitBreakerError,
  ProductNotAvailableError,
  ProductOutOfStockError,
  SlotUnavailableError,
  InsufficientLoyaltyPointsError,
  CouponInvalidError,
  CouponExpiredError,
  isOperationalError,
  handleError,
  createValidationError,
  createNotFoundError,
  createConflictError,
};