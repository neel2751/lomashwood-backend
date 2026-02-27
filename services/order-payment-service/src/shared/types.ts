export enum OrderStatus {
  PENDING = 'PENDING',
  AWAITING_PAYMENT = 'AWAITING_PAYMENT',
  PAYMENT_PROCESSING = 'PAYMENT_PROCESSING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  DISPATCHED = 'DISPATCHED',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  ABANDONED = 'ABANDONED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
  DISPUTED = 'DISPUTED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
  DISPUTED = 'DISPUTED',
  VOIDED = 'VOIDED',
  REQUIRES_ACTION = 'REQUIRES_ACTION',
  REQUIRES_CAPTURE = 'REQUIRES_CAPTURE',
}

export enum RefundStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  ISSUED = 'ISSUED',
  PAID = 'PAID',
  VOID = 'VOID',
  UNCOLLECTIBLE = 'UNCOLLECTIBLE',
}

export enum CategoryType {
  KITCHEN = 'KITCHEN',
  BEDROOM = 'BEDROOM',
}

export enum PaymentGateway {
  STRIPE = 'STRIPE',
  RAZORPAY = 'RAZORPAY',
}

export enum PaymentMethod {
  CARD = 'CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  WALLET = 'WALLET',
  BUY_NOW_PAY_LATER = 'BUY_NOW_PAY_LATER',
  OTHER = 'OTHER',
}

export enum RefundType {
  FULL = 'FULL',
  PARTIAL = 'PARTIAL',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface SortOptions {
  field: string;
  order: SortOrder;
}

export interface DateRangeFilter {
  from?: Date;
  to?: Date;
}

export interface ServiceResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface Address {
  line1: string;
  line2: string | null;
  city: string;
  county: string | null;
  postcode: string;
  country: string;
}

export interface Money {
  amount: number;
  currency: string;
}

export interface OrderItemInput {
  productId: string;
  colourId: string | null;
  sizeId: string | null;
  quantity: number;
}

export interface CreateOrderInput {
  customerId: string;
  items: OrderItemInput[];
  shippingAddress: Address;
  billingAddress: Address;
  couponCode: string | null;
  appointmentId: string | null;
  source: 'WEB' | 'ADMIN' | 'API';
  idempotencyKey: string | null;
  metadata?: Record<string, unknown>;
}

export interface CancelOrderInput {
  orderId: string;
  cancellationReason: string;
  cancellationNote: string | null;
  cancelledByUserId: string | null;
  initiator: 'CUSTOMER' | 'ADMIN' | 'SYSTEM';
}

export interface CreatePaymentIntentInput {
  orderId: string;
  customerId: string;
  amount: number;
  currency: string;
  idempotencyKey: string | null;
  metadata?: Record<string, unknown>;
}

export interface ConfirmPaymentInput {
  paymentId: string;
  gatewayPaymentId: string;
  gatewayChargeId: string | null;
  gatewayReceiptUrl: string | null;
  gatewayBalanceTransactionId: string | null;
  amountCaptured: number;
  rawStatus: string;
  paidAt: Date;
}

export interface CreateRefundInput {
  paymentId: string;
  orderId: string;
  refundAmount: number;
  refundType: RefundType;
  refundReason: string;
  refundNote: string | null;
  initiatedByUserId: string | null;
  initiator: 'CUSTOMER' | 'ADMIN' | 'SYSTEM';
  idempotencyKey: string | null;
  itemIds?: string[];
}

export interface OrderFilters {
  customerId?: string;
  status?: OrderStatus | OrderStatus[];
  categoryType?: CategoryType;
  dateRange?: DateRangeFilter;
  minAmount?: number;
  maxAmount?: number;
  currency?: string;
  search?: string;
}

export interface PaymentFilters {
  orderId?: string;
  customerId?: string;
  status?: PaymentStatus | PaymentStatus[];
  gateway?: PaymentGateway;
  dateRange?: DateRangeFilter;
}

export interface RefundFilters {
  paymentId?: string;
  orderId?: string;
  customerId?: string;
  status?: RefundStatus | RefundStatus[];
  dateRange?: DateRangeFilter;
}

export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;

export type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};

export type WithTimestamps = {
  createdAt: Date;
  updatedAt: Date;
};

export type WithSoftDelete = {
  deletedAt: Date | null;
};

export type WithAudit = WithTimestamps & {
  createdById: string | null;
  updatedById: string | null;
};