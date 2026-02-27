import { OrderStatus, RefundStatus } from '@prisma/client';

export const REFUND_CONSTANTS = {
  MAX_REFUND_AGE_DAYS: 90,
  MAX_REFUND_AMOUNT: 999_999.99,
  MAX_BULK_REFUND_SIZE: 50,
  MAX_RETRY_COUNT: 3,
  STALE_PROCESSING_THRESHOLD_MINUTES: 30,
  CURRENCY_DEFAULT: 'GBP',
} as const;

export const REFUND_REASONS = {
  DUPLICATE: 'duplicate',
  FRAUDULENT: 'fraudulent',
  REQUESTED_BY_CUSTOMER: 'requested_by_customer',
  ORDER_CANCELLED: 'order_cancelled',
  PRODUCT_NOT_DELIVERED: 'product_not_delivered',
  PRODUCT_DAMAGED: 'product_damaged',
  INCORRECT_ITEM: 'incorrect_item',
  QUALITY_ISSUE: 'quality_issue',
  CONSULTATION_CANCELLED: 'consultation_cancelled',
  GOODWILL: 'goodwill',
  OTHER: 'other',
} as const;

export type RefundReason = (typeof REFUND_REASONS)[keyof typeof REFUND_REASONS];

export const REFUNDABLE_STATUSES: OrderStatus[] = [
  OrderStatus.PAID,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
  OrderStatus.PARTIALLY_REFUNDED,
];

export const TERMINAL_REFUND_STATUSES: RefundStatus[] = [
  RefundStatus.SUCCEEDED,
  RefundStatus.FAILED,
  RefundStatus.CANCELLED,
];

export const ACTIVE_REFUND_STATUSES: RefundStatus[] = [
  RefundStatus.PENDING,
  RefundStatus.PROCESSING,
];

export const REFUND_ERROR_MESSAGES = {
  NOT_FOUND: (id: string) => `Refund ${id} not found`,
  ORDER_NOT_FOUND: (id: string) => `Order ${id} not found`,
  NOT_ELIGIBLE: 'This order is not eligible for a refund',
  AMOUNT_EXCEEDS_MAX: (requested: number, max: number) =>
    `Requested refund amount (${requested}) exceeds maximum refundable amount (${max})`,
  AMOUNT_ZERO: 'Refund amount must be greater than zero',
  ALREADY_TERMINAL: (status: RefundStatus) =>
    `Refund is already in a terminal state: ${status}`,
  CANCEL_NOT_PENDING: (status: RefundStatus) =>
    `Only PENDING refunds can be cancelled. Current status: ${status}`,
  RETRY_NOT_FAILED: (status: RefundStatus) =>
    `Only FAILED refunds can be retried. Current status: ${status}`,
  MAX_RETRIES_EXCEEDED: (max: number) =>
    `Refund has exceeded the maximum retry limit of ${max}`,
  MISSING_STRIPE_INTENT: 'Cannot process refund: missing Stripe Payment Intent ID',
  STRIPE_FAILED: (message: string) => `Stripe refund processing failed: ${message}`,
  BULK_LIMIT_EXCEEDED: (max: number) =>
    `Bulk refund limit is ${max} orders per request`,
  NO_SUCCESSFUL_PAYMENT: 'No successful payment found for this order',
  FULLY_REFUNDED: 'Order has already been fully refunded',
  WINDOW_EXPIRED: (days: number) => `Refund window of ${days} days has expired`,
} as const;

export const REFUND_LOG_CONTEXT = 'RefundService';

export const REFUND_STRIPE_STATUS_MAP: Record<string, RefundStatus> = {
  pending: RefundStatus.PROCESSING,
  succeeded: RefundStatus.SUCCEEDED,
  failed: RefundStatus.FAILED,
  canceled: RefundStatus.CANCELLED,
  requires_action: RefundStatus.PROCESSING,
};

export const REFUND_STRIPE_REASON_MAP: Record<
  string,
  'duplicate' | 'fraudulent' | 'requested_by_customer'
> = {
  [REFUND_REASONS.DUPLICATE]: 'duplicate',
  [REFUND_REASONS.FRAUDULENT]: 'fraudulent',
  [REFUND_REASONS.REQUESTED_BY_CUSTOMER]: 'requested_by_customer',
};