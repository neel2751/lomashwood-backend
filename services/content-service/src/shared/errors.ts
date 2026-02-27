export abstract class AppError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;

  constructor(
    message: string,
    public readonly context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      ...(this.context ? { context: this.context } : {}),
    };
  }
}

export class BadRequestError extends AppError {
  readonly code = 'BAD_REQUEST';
  readonly statusCode = 400;

  constructor(message = 'Bad request.', context?: Record<string, unknown>) {
    super(message, context);
  }
}

export class UnauthorizedError extends AppError {
  readonly code = 'UNAUTHORIZED';
  readonly statusCode = 401;

  constructor(message = 'Authentication is required.', context?: Record<string, unknown>) {
    super(message, context);
  }
}

export class ForbiddenError extends AppError {
  readonly code = 'FORBIDDEN';
  readonly statusCode = 403;

  constructor(message = 'You do not have permission to perform this action.', context?: Record<string, unknown>) {
    super(message, context);
  }
}

export class NotFoundError extends AppError {
  declare readonly code: string;
  readonly statusCode = 404;

  constructor(resource: string, identifier?: string | number) {
    super(
      identifier
        ? `${resource} with identifier '${identifier}' was not found.`
        : `${resource} was not found.`,
      { resource, identifier },
    );
    if (!(this as any).code) (this as any).code = 'NOT_FOUND';
  }
}

export class ConflictError extends AppError {
  declare readonly code: string;
  readonly statusCode = 409;

  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
    if (!(this as any).code) (this as any).code = 'CONFLICT';
  }
}

export class GoneError extends AppError {
  readonly code = 'GONE';
  readonly statusCode = 410;

  constructor(resource: string) {
    super(`${resource} has been permanently deleted.`, { resource });
  }
}

export interface FieldError {
  field: string;
  message: string;
}

export class ValidationError extends AppError {
  declare readonly code: string;
  readonly statusCode = 422;

  constructor(
    message = 'Request validation failed.',
    public readonly fields?: FieldError[],
    context?: Record<string, unknown>,
  ) {
    super(message, context);
    if (!(this as any).code) (this as any).code = 'VALIDATION_ERROR';
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      ...(this.fields ? { fields: this.fields } : {}),
    };
  }
}

export class RateLimitError extends AppError {
  readonly code = 'RATE_LIMIT_EXCEEDED';
  readonly statusCode = 429;

  constructor(retryAfterSeconds?: number) {
    super('Too many requests. Please slow down and try again later.', {
      retryAfterSeconds,
    });
  }
}

export class InternalServerError extends AppError {
  readonly code = 'INTERNAL_SERVER_ERROR';
  readonly statusCode = 500;

  constructor(message = 'An unexpected error occurred.', context?: Record<string, unknown>) {
    super(message, context);
  }
}

export class ExternalServiceError extends AppError {
  readonly code = 'EXTERNAL_SERVICE_ERROR';
  readonly statusCode = 502;

  constructor(service: string, cause?: string) {
    super(`External service '${service}' returned an unexpected error.`, {
      service,
      cause,
    });
  }
}

export class ServiceUnavailableError extends AppError {
  readonly code = 'SERVICE_UNAVAILABLE';
  readonly statusCode = 503;

  constructor(message = 'The service is temporarily unavailable. Please try again later.') {
    super(message);
  }
}

export class BlogNotFoundError extends NotFoundError {
  override readonly code = 'BLOG_NOT_FOUND';

  constructor(identifier: string) {
    super('Blog post', identifier);
  }
}

export class BlogSlugConflictError extends ConflictError {
  override readonly code = 'BLOG_SLUG_CONFLICT';

  constructor(slug: string) {
    super(`A blog post with slug '${slug}' already exists.`, { slug });
  }
}

export class BlogNotPublishedError extends AppError {
  readonly code = 'BLOG_NOT_PUBLISHED';
  readonly statusCode = 422;

  constructor(blogId: string) {
    super(`Blog post '${blogId}' cannot be published in its current state.`, { blogId });
  }
}

export class PageNotFoundError extends NotFoundError {
  override readonly code = 'PAGE_NOT_FOUND';

  constructor(identifier: string) {
    super('CMS page', identifier);
  }
}

export class PageSlugConflictError extends ConflictError {
  override readonly code = 'PAGE_SLUG_CONFLICT';

  constructor(slug: string) {
    super(`A CMS page with slug '${slug}' already exists.`, { slug });
  }
}

export class MediaNotFoundError extends NotFoundError {
  override readonly code = 'MEDIA_NOT_FOUND';

  constructor(identifier: string) {
    super('Media asset', identifier);
  }
}

export class MediaUploadError extends AppError {
  readonly code = 'MEDIA_UPLOAD_FAILED';
  readonly statusCode = 500;

  constructor(filename: string, cause?: string) {
    super(`Failed to upload media asset '${filename}'.`, { filename, cause });
  }
}

export class MediaTypeNotAllowedError extends ValidationError {
  override readonly code = 'MEDIA_TYPE_NOT_ALLOWED';

  constructor(mimeType: string) {
    super(`File type '${mimeType}' is not permitted.`, [
      { field: 'file', message: `File type '${mimeType}' is not allowed.` },
    ]);
  }
}

export class MediaSizeExceededError extends ValidationError {
  override readonly code = 'MEDIA_SIZE_EXCEEDED';

  constructor(maxBytes: number) {
    const maxMB = (maxBytes / 1024 / 1024).toFixed(0);
    super(`File size exceeds the maximum allowed limit of ${maxMB}MB.`, [
      { field: 'file', message: `File must be smaller than ${maxMB}MB.` },
    ]);
  }
}

export class SeoNotFoundError extends NotFoundError {
  override readonly code = 'SEO_NOT_FOUND';

  constructor(identifier: string) {
    super('SEO metadata', identifier);
  }
}

export class LandingPageNotFoundError extends NotFoundError {
  override readonly code = 'LANDING_PAGE_NOT_FOUND';

  constructor(identifier: string) {
    super('Landing page', identifier);
  }
}

export class ScheduledPublishError extends AppError {
  readonly code = 'SCHEDULED_PUBLISH_ERROR';
  readonly statusCode = 422;

  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}

export class StorageError extends AppError {
  readonly code = 'STORAGE_ERROR';
  readonly statusCode = 500;

  constructor(operation: string, cause?: string) {
    super(`Storage operation '${operation}' failed.`, { operation, cause });
  }
}

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}

export function isNotFoundError(err: unknown): err is NotFoundError {
  return err instanceof NotFoundError;
}

export function isValidationError(err: unknown): err is ValidationError {
  return err instanceof ValidationError;
}