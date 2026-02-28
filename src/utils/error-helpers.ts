import { ApiError } from "@/lib/axios";
import type { ZodError } from "zod";

export type FieldErrors = Record<string, string>;

export type AppError = {
  message: string;
  status?: number;
  code?: string;
  fieldErrors?: FieldErrors;
};

export function parseError(error: unknown): AppError {
  if (error instanceof ApiError) {
    return {
      message: error.message,
      status: error.status,
      code: error.code,
      fieldErrors: isFieldErrorDetails(error.details) ? error.details : undefined,
    };
  }

  if (isZodError(error)) {
    const fieldErrors: FieldErrors = {};
    for (const issue of error.errors) {
      const path = issue.path.join(".");
      if (!fieldErrors[path]) {
        fieldErrors[path] = issue.message;
      }
    }
    return {
      message: "Validation failed. Please check the highlighted fields.",
      fieldErrors,
    };
  }

  if (error instanceof Error) {
    return { message: error.message };
  }

  if (typeof error === "string") {
    return { message: error };
  }

  return { message: "An unexpected error occurred. Please try again." };
}

export function getErrorMessage(error: unknown): string {
  return parseError(error).message;
}

export function getFieldErrors(error: unknown): FieldErrors {
  return parseError(error).fieldErrors ?? {};
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function isNetworkError(error: unknown): boolean {
  if (error instanceof ApiError) return error.status === 0;
  if (error instanceof Error) return error.message === "Network Error";
  return false;
}

export function isNotFoundError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}

export function isUnauthorizedError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}

export function isForbiddenError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 403;
}

export function isValidationError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 422;
}

export function isConflictError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 409;
}

export function isServerError(error: unknown): boolean {
  return error instanceof ApiError && error.status >= 500;
}

export function isRateLimitError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 429;
}

export function getHttpErrorTitle(status: number): string {
  const titles: Record<number, string> = {
    400: "Bad Request",
    401: "Unauthorised",
    403: "Access Denied",
    404: "Not Found",
    409: "Conflict",
    422: "Validation Error",
    429: "Too Many Requests",
    500: "Server Error",
    502: "Bad Gateway",
    503: "Service Unavailable",
  };
  return titles[status] ?? "Error";
}

export function shouldRetry(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.status >= 500 || error.status === 0 || error.status === 429;
  }
  return false;
}

export function formatValidationErrors(errors: FieldErrors): string {
  return Object.entries(errors)
    .map(([field, message]) => `• ${formatFieldName(field)}: ${message}`)
    .join("\n");
}

export function formatFieldName(key: string): string {
  return key
    .replace(/\./g, " → ")
    .replace(/([A-Z])/g, " $1")
    .replace(/[-_]/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function mergeFieldErrors(
  ...errorSets: (FieldErrors | undefined)[]
): FieldErrors {
  return Object.assign({}, ...errorSets.filter(Boolean));
}

export function clearFieldError(
  errors: FieldErrors,
  field: string,
): FieldErrors {
  const next = { ...errors };
  delete next[field];
  return next;
}

export function hasFieldError(errors: FieldErrors, field: string): boolean {
  return Boolean(errors[field]);
}

export function getFirstError(errors: FieldErrors): string | undefined {
  return Object.values(errors)[0];
}

export function logError(error: unknown, context?: string): void {
  const parsed = parseError(error);
  if (process.env.NODE_ENV !== "production") {
    console.error(`[${context ?? "Error"}]`, parsed);
  }
}

function isZodError(error: unknown): error is ZodError {
  return (
    typeof error === "object" &&
    error !== null &&
    "errors" in error &&
    Array.isArray((error as ZodError).errors)
  );
}

function isFieldErrorDetails(details: unknown): details is FieldErrors {
  return (
    typeof details === "object" &&
    details !== null &&
    !Array.isArray(details) &&
    Object.values(details).every((v) => typeof v === "string")
  );
}