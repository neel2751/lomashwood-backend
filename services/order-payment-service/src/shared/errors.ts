export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context: Record<string, unknown>;

  constructor(
    code: string,
    message: string,
    statusCode = 500,
    context: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = true;
    this.context = context;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  public readonly fields: Record<string, string[]>;

  constructor(message: string, fields: Record<string, string[]> = {}) {
    super('VALIDATION_ERROR', message, 422, { fields });
    this.name = 'ValidationError';
    this.fields = fields;
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, identifier: string | number) {
    super('NOT_FOUND', `${resource} with identifier '${identifier}' was not found`, 404, {
      resource,
      identifier,
    });
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string, context: Record<string, unknown> = {}) {
    super('CONFLICT', message, 409, context);
    this.name = 'ConflictError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super('UNAUTHORIZED', message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super('FORBIDDEN', message, 403);
    this.name = 'ForbiddenError';
  }
}

export class PaymentError extends AppError {
  public readonly gatewayCode: string | null;

  constructor(
    message: string,
    gatewayCode: string | null = null,
    context: Record<string, unknown> = {},
  ) {
    super('PAYMENT_ERROR', message, 402, { ...context, gatewayCode });
    this.name = 'PaymentError';
    this.gatewayCode = gatewayCode;
  }
}

export class PaymentIntentError extends PaymentError {
  constructor(message: string, gatewayCode: string | null = null) {
    super(message, gatewayCode, {});
    this.name = 'PaymentIntentError';
    this.code = 'PAYMENT_INTENT_ERROR';
  }
}

export class WebhookVerificationError extends AppError {
  constructor(message = 'Webhook signature verification failed') {
    super('WEBHOOK_VERIFICATION_FAILED', message, 400);
    this.name = 'WebhookVerificationError';
  }
}

export class OrderNotFoundError extends NotFoundError {
  constructor(orderId: string) {
    super('Order', orderId);
    this.name = 'OrderNotFoundError';
    this.code = 'ORDER_NOT_FOUND';
  }
}

export class OrderAlreadyCancelledError extends ConflictError {
  constructor(orderId: string) {
    super(`Order '${orderId}' has already been cancelled`, { orderId });
    this.name = 'OrderAlreadyCancelledError';
    this.code = 'ORDER_ALREADY_CANCELLED';
  }
}

export class OrderNotCancellableError extends ConflictError {
  constructor(orderId: string, currentStatus: string) {
    super(`Order '${orderId}' cannot be cancelled in status '${currentStatus}'`, {
      orderId,
      currentStatus,
    });
    this.name = 'OrderNotCancellableError';
    this.code = 'ORDER_NOT_CANCELLABLE';
  }
}

export class OrderAbandonedError extends ConflictError {
  constructor(orderId: string) {
    super(`Order '${orderId}' has been abandoned and cannot be modified`, { orderId });
    this.name = 'OrderAbandonedError';
    this.code = 'ORDER_ABANDONED';
  }
}

export class InvoiceNotFoundError extends NotFoundError {
  constructor(invoiceId: string) {
    super('Invoice', invoiceId);
    this.name = 'InvoiceNotFoundError';
    this.code = 'INVOICE_NOT_FOUND';
  }
}

export class RefundNotFoundError extends NotFoundError {
  constructor(refundId: string) {
    super('Refund', refundId);
    this.name = 'RefundNotFoundError';
    this.code = 'REFUND_NOT_FOUND';
  }
}

export class RefundNotEligibleError extends ConflictError {
  constructor(orderId: string, reason: string) {
    super(`Order '${orderId}' is not eligible for refund: ${reason}`, { orderId, reason });
    this.name = 'RefundNotEligibleError';
    this.code = 'REFUND_NOT_ELIGIBLE';
  }
}

export class RefundExceedsAmountError extends ConflictError {
  constructor(requestedAmount: number, maxRefundable: number, currency: string) {
    super(
      `Refund amount ${requestedAmount} ${currency} exceeds maximum refundable amount ${maxRefundable} ${currency}`,
      { requestedAmount, maxRefundable, currency },
    );
    this.name = 'RefundExceedsAmountError';
    this.code = 'REFUND_EXCEEDS_AMOUNT';
  }
}

export class DuplicateOrderError extends ConflictError {
  constructor(idempotencyKey: string) {
    super(`Order with idempotency key '${idempotencyKey}' already exists`, { idempotencyKey });
    this.name = 'DuplicateOrderError';
    this.code = 'DUPLICATE_ORDER';
  }
}

export class InventoryUnavailableError extends ConflictError {
  constructor(productId: string, requested: number, available: number) {
    super(
      `Insufficient inventory for product '${productId}': requested ${requested}, available ${available}`,
      { productId, requested, available },
    );
    this.name = 'InventoryUnavailableError';
    this.code = 'INVENTORY_UNAVAILABLE';
  }
}

export class EventPublishError extends AppError {
  constructor(topic: string, cause: unknown) {
    super('EVENT_PUBLISH_FAILED', `Failed to publish event to topic '${topic}'`, 500, {
      topic,
      cause,
    });
    this.name = 'EventPublishError';
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, cause: unknown) {
    super('DATABASE_ERROR', message, 500, { cause });
    this.name = 'DatabaseError';
  }
}

export class ExternalServiceError extends AppError {
  public readonly service: string;

  constructor(service: string, message: string, context: Record<string, unknown> = {}) {
    super('EXTERNAL_SERVICE_ERROR', message, 502, { ...context, service });
    this.name = 'ExternalServiceError';
    this.service = service;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function isOperationalError(error: unknown): boolean {
  return isAppError(error) && error.isOperational;
}

export function toAppError(error: unknown): AppError {
  if (isAppError(error)) return error;
  if (error instanceof Error) {
    return new AppError('UNKNOWN_ERROR', error.message, 500, { originalError: error.name });
  }
  return new AppError('UNKNOWN_ERROR', 'An unexpected error occurred', 500);
}