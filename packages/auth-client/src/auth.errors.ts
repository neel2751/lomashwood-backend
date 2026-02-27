export class AuthClientError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, statusCode: number, code: string, details?: unknown) {
    super(message);
    this.name = "AuthClientError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AuthClientError.prototype);
  }
}

export class UnauthorizedError extends AuthClientError {
  constructor(message = "Unauthorized") {
    super(message, 401, "UNAUTHORIZED");
    this.name = "UnauthorizedError";
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

export class ForbiddenError extends AuthClientError {
  constructor(message = "Forbidden") {
    super(message, 403, "FORBIDDEN");
    this.name = "ForbiddenError";
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

export class InvalidCredentialsError extends AuthClientError {
  constructor(message = "Invalid email or password") {
    super(message, 401, "INVALID_CREDENTIALS");
    this.name = "InvalidCredentialsError";
    Object.setPrototypeOf(this, InvalidCredentialsError.prototype);
  }
}

export class TokenExpiredError extends AuthClientError {
  constructor(message = "Token has expired") {
    super(message, 401, "TOKEN_EXPIRED");
    this.name = "TokenExpiredError";
    Object.setPrototypeOf(this, TokenExpiredError.prototype);
  }
}

export class TokenInvalidError extends AuthClientError {
  constructor(message = "Token is invalid") {
    super(message, 401, "TOKEN_INVALID");
    this.name = "TokenInvalidError";
    Object.setPrototypeOf(this, TokenInvalidError.prototype);
  }
}

export class AccountNotVerifiedError extends AuthClientError {
  constructor(message = "Account email not verified") {
    super(message, 403, "ACCOUNT_NOT_VERIFIED");
    this.name = "AccountNotVerifiedError";
    Object.setPrototypeOf(this, AccountNotVerifiedError.prototype);
  }
}

export class AccountSuspendedError extends AuthClientError {
  constructor(message = "Account has been suspended") {
    super(message, 403, "ACCOUNT_SUSPENDED");
    this.name = "AccountSuspendedError";
    Object.setPrototypeOf(this, AccountSuspendedError.prototype);
  }
}

export class EmailAlreadyExistsError extends AuthClientError {
  constructor(message = "Email address is already registered") {
    super(message, 409, "EMAIL_ALREADY_EXISTS");
    this.name = "EmailAlreadyExistsError";
    Object.setPrototypeOf(this, EmailAlreadyExistsError.prototype);
  }
}

export class SessionExpiredError extends AuthClientError {
  constructor(message = "Session has expired") {
    super(message, 401, "SESSION_EXPIRED");
    this.name = "SessionExpiredError";
    Object.setPrototypeOf(this, SessionExpiredError.prototype);
  }
}

export class RefreshTokenExpiredError extends AuthClientError {
  constructor(message = "Refresh token has expired. Please login again.") {
    super(message, 401, "REFRESH_TOKEN_EXPIRED");
    this.name = "RefreshTokenExpiredError";
    Object.setPrototypeOf(this, RefreshTokenExpiredError.prototype);
  }
}

export class NetworkError extends AuthClientError {
  constructor(message = "Network error. Please check your connection.") {
    super(message, 0, "NETWORK_ERROR");
    this.name = "NetworkError";
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

export class ServiceUnavailableError extends AuthClientError {
  constructor(message = "Auth service is currently unavailable") {
    super(message, 503, "SERVICE_UNAVAILABLE");
    this.name = "ServiceUnavailableError";
    Object.setPrototypeOf(this, ServiceUnavailableError.prototype);
  }
}

export function isAuthClientError(error: unknown): error is AuthClientError {
  return error instanceof AuthClientError;
}

export function isUnauthorizedError(error: unknown): error is UnauthorizedError {
  return error instanceof UnauthorizedError;
}

export function isForbiddenError(error: unknown): error is ForbiddenError {
  return error instanceof ForbiddenError;
}

export function isTokenExpiredError(error: unknown): error is TokenExpiredError {
  return error instanceof TokenExpiredError;
}

export function isRefreshTokenExpiredError(error: unknown): error is RefreshTokenExpiredError {
  return error instanceof RefreshTokenExpiredError;
}