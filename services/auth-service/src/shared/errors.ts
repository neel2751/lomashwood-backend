export class BaseError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly timestamp: Date;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number,
    isOperational = true,
    details?: unknown
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date();
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends BaseError {
  constructor(message: string, details?: unknown) {
    super(message, 400, true, details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends BaseError {
  constructor(message: string = 'Authentication failed', details?: unknown) {
    super(message, 401, true, details);
    this.name = 'AuthenticationError';
  }
}

export class UnauthorizedError extends BaseError {
  constructor(message: string = 'Unauthorized access', details?: unknown) {
    super(message, 403, true, details);
    this.name = 'UnauthorizedError';
  }
}

export class NotFoundError extends BaseError {
  constructor(message: string = 'Resource not found', details?: unknown) {
    super(message, 404, true, details);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends BaseError {
  constructor(message: string = 'Resource conflict', details?: unknown) {
    super(message, 409, true, details);
    this.name = 'ConflictError';
  }
}

export class InternalServerError extends BaseError {
  constructor(message: string = 'Internal server error', details?: unknown) {
    super(message, 500, false, details);
    this.name = 'InternalServerError';
  }
}

export class BadRequestError extends BaseError {
  constructor(message: string = 'Bad request', details?: unknown) {
    super(message, 400, true, details);
    this.name = 'BadRequestError';
  }
}

export class TokenExpiredError extends BaseError {
  constructor(message: string = 'Token has expired', details?: unknown) {
    super(message, 401, true, details);
    this.name = 'TokenExpiredError';
  }
}

export class InvalidTokenError extends BaseError {
  constructor(message: string = 'Invalid token', details?: unknown) {
    super(message, 401, true, details);
    this.name = 'InvalidTokenError';
  }
}

export class InvalidCredentialsError extends BaseError {
  constructor(message: string = 'Invalid credentials', details?: unknown) {
    super(message, 401, true, details);
    this.name = 'InvalidCredentialsError';
  }
}

export class UserAlreadyExistsError extends BaseError {
  constructor(message: string = 'User already exists', details?: unknown) {
    super(message, 409, true, details);
    this.name = 'UserAlreadyExistsError';
  }
}

export class UserNotFoundError extends BaseError {
  constructor(message: string = 'User not found', details?: unknown) {
    super(message, 404, true, details);
    this.name = 'UserNotFoundError';
  }
}

export class SessionExpiredError extends BaseError {
  constructor(message: string = 'Session has expired', details?: unknown) {
    super(message, 401, true, details);
    this.name = 'SessionExpiredError';
  }
}

export class SessionNotFoundError extends BaseError {
  constructor(message: string = 'Session not found', details?: unknown) {
    super(message, 404, true, details);
    this.name = 'SessionNotFoundError';
  }
}

export class RoleNotFoundError extends BaseError {
  constructor(message: string = 'Role not found', details?: unknown) {
    super(message, 404, true, details);
    this.name = 'RoleNotFoundError';
  }
}

export class PermissionDeniedError extends BaseError {
  constructor(message: string = 'Permission denied', details?: unknown) {
    super(message, 403, true, details);
    this.name = 'PermissionDeniedError';
  }
}

export class RateLimitError extends BaseError {
  constructor(message: string = 'Too many requests', details?: unknown) {
    super(message, 429, true, details);
    this.name = 'RateLimitError';
  }
}

export class DatabaseError extends BaseError {
  constructor(message: string = 'Database operation failed', details?: unknown) {
    super(message, 500, false, details);
    this.name = 'DatabaseError';
  }
}

export class CacheError extends BaseError {
  constructor(message: string = 'Cache operation failed', details?: unknown) {
    super(message, 500, false, details);
    this.name = 'CacheError';
  }
}

export class EventPublishError extends BaseError {
  constructor(message: string = 'Failed to publish event', details?: unknown) {
    super(message, 500, false, details);
    this.name = 'EventPublishError';
  }
}

export class PasswordResetTokenExpiredError extends BaseError {
  constructor(message: string = 'Password reset token has expired', details?: unknown) {
    super(message, 401, true, details);
    this.name = 'PasswordResetTokenExpiredError';
  }
}

export class InvalidPasswordResetTokenError extends BaseError {
  constructor(message: string = 'Invalid password reset token', details?: unknown) {
    super(message, 401, true, details);
    this.name = 'InvalidPasswordResetTokenError';
  }
}

export class WeakPasswordError extends BaseError {
  constructor(message: string = 'Password does not meet security requirements', details?: unknown) {
    super(message, 400, true, details);
    this.name = 'WeakPasswordError';
  }
}

export class AccountLockedError extends BaseError {
  constructor(message: string = 'Account is locked', details?: unknown) {
    super(message, 423, true, details);
    this.name = 'AccountLockedError';
  }
}

export class AccountDisabledError extends BaseError {
  constructor(message: string = 'Account is disabled', details?: unknown) {
    super(message, 403, true, details);
    this.name = 'AccountDisabledError';
  }
}

export class EmailNotVerifiedError extends BaseError {
  constructor(message: string = 'Email not verified', details?: unknown) {
    super(message, 403, true, details);
    this.name = 'EmailNotVerifiedError';
  }
}

export class DuplicateEmailError extends BaseError {
  constructor(message: string = 'Email already in use', details?: unknown) {
    super(message, 409, true, details);
    this.name = 'DuplicateEmailError';
  }
}

export class OTPExpiredError extends BaseError {
  constructor(message: string = 'OTP has expired', details?: unknown) {
    super(message, 401, true, details);
    this.name = 'OTPExpiredError';
  }
}

export class InvalidOTPError extends BaseError {
  constructor(message: string = 'Invalid OTP', details?: unknown) {
    super(message, 401, true, details);
    this.name = 'InvalidOTPError';
  }
}

export class MaxLoginAttemptsError extends BaseError {
  constructor(message: string = 'Maximum login attempts exceeded', details?: unknown) {
    super(message, 429, true, details);
    this.name = 'MaxLoginAttemptsError';
  }
}

export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  UNAUTHORIZED_ERROR: 'UNAUTHORIZED_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  CONFLICT_ERROR: 'CONFLICT_ERROR',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  BAD_REQUEST_ERROR: 'BAD_REQUEST_ERROR',
  TOKEN_EXPIRED_ERROR: 'TOKEN_EXPIRED_ERROR',
  INVALID_TOKEN_ERROR: 'INVALID_TOKEN_ERROR',
  INVALID_CREDENTIALS_ERROR: 'INVALID_CREDENTIALS_ERROR',
  USER_ALREADY_EXISTS_ERROR: 'USER_ALREADY_EXISTS_ERROR',
  USER_NOT_FOUND_ERROR: 'USER_NOT_FOUND_ERROR',
  SESSION_EXPIRED_ERROR: 'SESSION_EXPIRED_ERROR',
  SESSION_NOT_FOUND_ERROR: 'SESSION_NOT_FOUND_ERROR',
  ROLE_NOT_FOUND_ERROR: 'ROLE_NOT_FOUND_ERROR',
  PERMISSION_DENIED_ERROR: 'PERMISSION_DENIED_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  CACHE_ERROR: 'CACHE_ERROR',
  EVENT_PUBLISH_ERROR: 'EVENT_PUBLISH_ERROR',
  PASSWORD_RESET_TOKEN_EXPIRED_ERROR: 'PASSWORD_RESET_TOKEN_EXPIRED_ERROR',
  INVALID_PASSWORD_RESET_TOKEN_ERROR: 'INVALID_PASSWORD_RESET_TOKEN_ERROR',
  WEAK_PASSWORD_ERROR: 'WEAK_PASSWORD_ERROR',
  ACCOUNT_LOCKED_ERROR: 'ACCOUNT_LOCKED_ERROR',
  ACCOUNT_DISABLED_ERROR: 'ACCOUNT_DISABLED_ERROR',
  EMAIL_NOT_VERIFIED_ERROR: 'EMAIL_NOT_VERIFIED_ERROR',
  DUPLICATE_EMAIL_ERROR: 'DUPLICATE_EMAIL_ERROR',
  OTP_EXPIRED_ERROR: 'OTP_EXPIRED_ERROR',
  INVALID_OTP_ERROR: 'INVALID_OTP_ERROR',
  MAX_LOGIN_ATTEMPTS_ERROR: 'MAX_LOGIN_ATTEMPTS_ERROR',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];