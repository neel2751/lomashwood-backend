export class PaymentClientError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, statusCode: number, code: string, details?: unknown) {
    super(message);
    this.name = "PaymentClientError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, PaymentClientError.prototype);
  }
}

export class PaymentIntentCreationError extends PaymentClientError {
  constructor(message = "Failed to create payment intent") {
    super(message, 500, "PAYMENT_INTENT_CREATION_FAILED");
    this.name = "PaymentIntentCreationError";
    Object.setPrototypeOf(this, PaymentIntentCreationError.prototype);
  }
}

export class PaymentConfirmationError extends PaymentClientError {
  constructor(message = "Payment confirmation failed") {
    super(message, 402, "PAYMENT_CONFIRMATION_FAILED");
    this.name = "PaymentConfirmationError";
    Object.setPrototypeOf(this, PaymentConfirmationError.prototype);
  }
}

export class PaymentDeclinedError extends PaymentClientError {
  constructor(message = "Payment was declined") {
    super(message, 402, "PAYMENT_DECLINED");
    this.name = "PaymentDeclinedError";
    Object.setPrototypeOf(this, PaymentDeclinedError.prototype);
  }
}

export class InsufficientFundsError extends PaymentClientError {
  constructor(message = "Insufficient funds") {
    super(message, 402, "INSUFFICIENT_FUNDS");
    this.name = "InsufficientFundsError";
    Object.setPrototypeOf(this, InsufficientFundsError.prototype);
  }
}

export class CardExpiredError extends PaymentClientError {
  constructor(message = "Card has expired") {
    super(message, 402, "CARD_EXPIRED");
    this.name = "CardExpiredError";
    Object.setPrototypeOf(this, CardExpiredError.prototype);
  }
}

export class RefundError extends PaymentClientError {
  constructor(message = "Refund processing failed") {
    super(message, 500, "REFUND_FAILED");
    this.name = "RefundError";
    Object.setPrototypeOf(this, RefundError.prototype);
  }
}

export class RefundExceedsAmountError extends PaymentClientError {
  constructor(message = "Refund amount exceeds original payment") {
    super(message, 400, "REFUND_EXCEEDS_AMOUNT");
    this.name = "RefundExceedsAmountError";
    Object.setPrototypeOf(this, RefundExceedsAmountError.prototype);
  }
}

export class PaymentNotFoundError extends PaymentClientError {
  constructor(message = "Payment transaction not found") {
    super(message, 404, "PAYMENT_NOT_FOUND");
    this.name = "PaymentNotFoundError";
    Object.setPrototypeOf(this, PaymentNotFoundError.prototype);
  }
}

export class PaymentAlreadyProcessedError extends PaymentClientError {
  constructor(message = "Payment has already been processed") {
    super(message, 409, "PAYMENT_ALREADY_PROCESSED");
    this.name = "PaymentAlreadyProcessedError";
    Object.setPrototypeOf(this, PaymentAlreadyProcessedError.prototype);
  }
}

export class InvalidWebhookSignatureError extends PaymentClientError {
  constructor(message = "Invalid webhook signature") {
    super(message, 400, "INVALID_WEBHOOK_SIGNATURE");
    this.name = "InvalidWebhookSignatureError";
    Object.setPrototypeOf(this, InvalidWebhookSignatureError.prototype);
  }
}

export class PaymentGatewayError extends PaymentClientError {
  constructor(message = "Payment gateway error") {
    super(message, 502, "PAYMENT_GATEWAY_ERROR");
    this.name = "PaymentGatewayError";
    Object.setPrototypeOf(this, PaymentGatewayError.prototype);
  }
}

export class PaymentServiceUnavailableError extends PaymentClientError {
  constructor(message = "Payment service is currently unavailable") {
    super(message, 503, "PAYMENT_SERVICE_UNAVAILABLE");
    this.name = "PaymentServiceUnavailableError";
    Object.setPrototypeOf(this, PaymentServiceUnavailableError.prototype);
  }
}

export class PaymentNetworkError extends PaymentClientError {
  constructor(message = "Network error communicating with payment service") {
    super(message, 0, "PAYMENT_NETWORK_ERROR");
    this.name = "PaymentNetworkError";
    Object.setPrototypeOf(this, PaymentNetworkError.prototype);
  }
}

export class IdempotencyError extends PaymentClientError {
  constructor(message = "Idempotency key conflict") {
    super(message, 409, "IDEMPOTENCY_CONFLICT");
    this.name = "IdempotencyError";
    Object.setPrototypeOf(this, IdempotencyError.prototype);
  }
}

export function isPaymentClientError(error: unknown): error is PaymentClientError {
  return error instanceof PaymentClientError;
}

export function isPaymentDeclinedError(error: unknown): error is PaymentDeclinedError {
  return error instanceof PaymentDeclinedError;
}

export function isRefundError(error: unknown): error is RefundError {
  return error instanceof RefundError;
}

export function isPaymentGatewayError(error: unknown): error is PaymentGatewayError {
  return error instanceof PaymentGatewayError;
}