export class BaseError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly timestamp: string;
  public readonly code: string;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this);
  }
}

export class ValidationError extends BaseError {
  public readonly errors: Array<{ field: string; message: string }>;

  constructor(message: string, errors: Array<{ field: string; message: string }> = []) {
    super(message, 400, 'VALIDATION_ERROR', true);
    this.errors = errors;
  }
}

export class NotFoundError extends BaseError {
  public readonly resourceType: string;
  public readonly resourceId?: string;

  constructor(resourceType: string, resourceId?: string) {
    const message = resourceId
      ? `${resourceType} with id '${resourceId}' not found`
      : `${resourceType} not found`;
    super(message, 404, 'NOT_FOUND', true);
    this.resourceType = resourceType;
    this.resourceId = resourceId;
  }
}

export class UnauthorizedError extends BaseError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 401, 'UNAUTHORIZED', true);
  }
}

export class ForbiddenError extends BaseError {
  constructor(message: string = 'Access forbidden') {
    super(message, 403, 'FORBIDDEN', true);
  }
}

export class ConflictError extends BaseError {
  public readonly conflictingField?: string;

  constructor(message: string, conflictingField?: string) {
    super(message, 409, 'CONFLICT', true);
    this.conflictingField = conflictingField;
  }
}

export class BadRequestError extends BaseError {
  constructor(message: string) {
    super(message, 400, 'BAD_REQUEST', true);
  }
}

export class InternalServerError extends BaseError {
  constructor(message: string = 'Internal server error') {
    super(message, 500, 'INTERNAL_SERVER_ERROR', false);
  }
}

export class DatabaseError extends BaseError {
  public readonly operation: string;

  constructor(message: string, operation: string) {
    super(message, 500, 'DATABASE_ERROR', false);
    this.operation = operation;
  }
}

export class ProductNotFoundError extends NotFoundError {
  constructor(productId: string) {
    super('Product', productId);
  }
}

export class CategoryNotFoundError extends NotFoundError {
  constructor(categoryId: string) {
    super('Category', categoryId);
  }
}

export class ColourNotFoundError extends NotFoundError {
  constructor(colourId: string) {
    super('Colour', colourId);
  }
}

export class SizeNotFoundError extends NotFoundError {
  constructor(sizeId: string) {
    super('Size', sizeId);
  }
}

export class InventoryNotFoundError extends NotFoundError {
  constructor(inventoryId: string) {
    super('Inventory', inventoryId);
  }
}

export class PricingNotFoundError extends NotFoundError {
  constructor(pricingId: string) {
    super('Pricing', pricingId);
  }
}

export class ProductAlreadyExistsError extends ConflictError {
  constructor(title: string) {
    super(`Product with title '${title}' already exists`, 'title');
  }
}

export class ColourAlreadyExistsError extends ConflictError {
  constructor(name: string) {
    super(`Colour with name '${name}' already exists`, 'name');
  }
}

export class InsufficientInventoryError extends BadRequestError {
  public readonly productId: string;
  public readonly requestedQuantity: number;
  public readonly availableQuantity: number;

  constructor(productId: string, requestedQuantity: number, availableQuantity: number) {
    super(
      `Insufficient inventory for product '${productId}'. Requested: ${requestedQuantity}, Available: ${availableQuantity}`
    );
    this.productId = productId;
    this.requestedQuantity = requestedQuantity;
    this.availableQuantity = availableQuantity;
  }
}

export class InvalidPriceError extends BadRequestError {
  constructor(price: number, reason?: string) {
    const message = reason
      ? `Invalid price ${price}: ${reason}`
      : `Invalid price ${price}`;
    super(message);
  }
}

export class InvalidCategoryError extends BadRequestError {
  constructor(category: string) {
    super(`Invalid category '${category}'. Must be 'KITCHEN' or 'BEDROOM'`);
  }
}

export class InvalidColourHexCodeError extends BadRequestError {
  constructor(hexCode: string) {
    super(`Invalid hex code '${hexCode}'. Must be in format #RRGGBB`);
  }
}

export class DuplicateImageError extends ConflictError {
  constructor(imageUrl: string) {
    super(`Image '${imageUrl}' is already associated with this product`, 'imageUrl');
  }
}

export class InvalidImageOrderError extends BadRequestError {
  constructor(order: number) {
    super(`Invalid image order '${order}'. Order must be non-negative`);
  }
}

export class PriceChangeNotAllowedError extends ForbiddenError {
  constructor(reason: string) {
    super(`Price change not allowed: ${reason}`);
  }
}

export class InventoryUpdateNotAllowedError extends ForbiddenError {
  constructor(reason: string) {
    super(`Inventory update not allowed: ${reason}`);
  }
}

export class ExternalServiceError extends BaseError {
  public readonly service: string;
  public readonly originalError?: Error;

  constructor(service: string, message: string, originalError?: Error) {
    super(`External service error from ${service}: ${message}`, 502, 'EXTERNAL_SERVICE_ERROR', true);
    this.service = service;
    this.originalError = originalError;
  }
}

export class RateLimitError extends BaseError {
  public readonly retryAfter?: number;

  constructor(message: string = 'Rate limit exceeded', retryAfter?: number) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', true);
    this.retryAfter = retryAfter;
  }
}

export class TimeoutError extends BaseError {
  public readonly operation: string;

  constructor(operation: string, timeout: number) {
    super(`Operation '${operation}' timed out after ${timeout}ms`, 408, 'TIMEOUT', true);
    this.operation = operation;
  }
}

export const isOperationalError = (error: Error): boolean => {
  if (error instanceof BaseError) {
    return error.isOperational;
  }
  return false;
};

export const formatErrorResponse = (error: BaseError) => {
  return {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      timestamp: error.timestamp,
      ...(error instanceof ValidationError && { errors: error.errors }),
      ...(error instanceof NotFoundError && {
        resourceType: error.resourceType,
        resourceId: error.resourceId
      }),
      ...(error instanceof ConflictError && { conflictingField: error.conflictingField }),
      ...(error instanceof InsufficientInventoryError && {
        productId: error.productId,
        requestedQuantity: error.requestedQuantity,
        availableQuantity: error.availableQuantity
      }),
      ...(error instanceof RateLimitError && { retryAfter: error.retryAfter })
    }
  };
};