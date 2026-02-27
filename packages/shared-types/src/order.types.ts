import type { Address } from './user.types.js';

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'FAILED';

export type PaymentStatus =
  | 'PENDING'
  | 'AUTHORISED'
  | 'CAPTURED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED'
  | 'DISPUTED';

export type PaymentMethod = 'CARD' | 'BANK_TRANSFER' | 'FINANCE' | 'VOUCHER' | 'CASH';

export type PaymentGateway = 'STRIPE' | 'RAZORPAY';

export type RefundStatus = 'PENDING' | 'APPROVED' | 'PROCESSED' | 'REJECTED' | 'FAILED';

export type RefundReason =
  | 'CUSTOMER_REQUEST'
  | 'PRODUCT_DEFECT'
  | 'INCORRECT_ITEM'
  | 'ITEM_NOT_DELIVERED'
  | 'DUPLICATE_ORDER'
  | 'FRAUD'
  | 'OTHER';

export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PAID' | 'VOID' | 'OVERDUE';

export interface OrderItem {
  readonly id: string;
  readonly orderId: string;
  readonly productId: string;
  readonly productTitle: string;
  readonly productImageUrl: string | null;
  readonly sku: string | null;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly totalPrice: number;
  readonly vatRate: number;
  readonly vatAmount: number;
  readonly discountAmount: number;
  readonly notes: string | null;
}

export interface OrderDiscount {
  readonly code: string | null;
  readonly type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  readonly value: number;
  readonly appliedAmount: number;
}

export interface OrderShipping {
  readonly method: string;
  readonly carrier: string | null;
  readonly trackingNumber: string | null;
  readonly trackingUrl: string | null;
  readonly estimatedDelivery: Date | null;
  readonly shippedAt: Date | null;
  readonly deliveredAt: Date | null;
  readonly cost: number;
}

export interface Order {
  readonly id: string;
  readonly orderNumber: string;
  readonly userId: string;
  readonly status: OrderStatus;
  readonly items: readonly OrderItem[];
  readonly subtotal: number;
  readonly vatAmount: number;
  readonly shippingCost: number;
  readonly discountAmount: number;
  readonly total: number;
  readonly currency: string;
  readonly billingAddress: Address;
  readonly shippingAddress: Address;
  readonly discount: OrderDiscount | null;
  readonly shipping: OrderShipping | null;
  readonly notes: string | null;
  readonly placedAt: Date;
  readonly confirmedAt: Date | null;
  readonly cancelledAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface OrderSummary {
  readonly id: string;
  readonly orderNumber: string;
  readonly userId: string;
  readonly status: OrderStatus;
  readonly itemCount: number;
  readonly total: number;
  readonly currency: string;
  readonly placedAt: Date;
}

export interface PaymentTransaction {
  readonly id: string;
  readonly orderId: string;
  readonly userId: string;
  readonly gateway: PaymentGateway;
  readonly gatewayTransactionId: string;
  readonly gatewayPaymentIntentId: string | null;
  readonly method: PaymentMethod;
  readonly status: PaymentStatus;
  readonly amount: number;
  readonly currency: string;
  readonly capturedAmount: number | null;
  readonly refundedAmount: number;
  readonly metadata: Record<string, unknown>;
  readonly failureCode: string | null;
  readonly failureMessage: string | null;
  readonly processedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface CreatePaymentIntentPayload {
  readonly orderId: string;
  readonly amount: number;
  readonly currency: string;
  readonly method: PaymentMethod;
  readonly metadata?: Record<string, string> | undefined;
  readonly idempotencyKey: string;
}

export interface PaymentIntentResult {
  readonly clientSecret: string;
  readonly paymentIntentId: string;
  readonly amount: number;
  readonly currency: string;
  readonly status: PaymentStatus;
}

export interface Refund {
  readonly id: string;
  readonly orderId: string;
  readonly paymentTransactionId: string;
  readonly userId: string;
  readonly status: RefundStatus;
  readonly reason: RefundReason;
  readonly notes: string | null;
  readonly amount: number;
  readonly currency: string;
  readonly gatewayRefundId: string | null;
  readonly requestedAt: Date;
  readonly processedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface Invoice {
  readonly id: string;
  readonly invoiceNumber: string;
  readonly orderId: string;
  readonly userId: string;
  readonly status: InvoiceStatus;
  readonly issuedAt: Date;
  readonly dueAt: Date | null;
  readonly paidAt: Date | null;
  readonly subtotal: number;
  readonly vatAmount: number;
  readonly total: number;
  readonly currency: string;
  readonly pdfUrl: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface StripeWebhookEvent {
  readonly id: string;
  readonly type: string;
  readonly data: Record<string, unknown>;
  readonly created: number;
  readonly livemode: boolean;
}

export interface OrderCreatedEventPayload {
  readonly orderId: string;
  readonly orderNumber: string;
  readonly userId: string;
  readonly total: number;
  readonly currency: string;
  readonly itemCount: number;
  readonly createdAt: Date;
}

export interface OrderCancelledEventPayload {
  readonly orderId: string;
  readonly orderNumber: string;
  readonly userId: string;
  readonly reason: string | null;
  readonly cancelledAt: Date;
}

export interface PaymentSucceededEventPayload {
  readonly paymentTransactionId: string;
  readonly orderId: string;
  readonly userId: string;
  readonly amount: number;
  readonly currency: string;
  readonly gateway: PaymentGateway;
  readonly processedAt: Date;
}

export interface RefundIssuedEventPayload {
  readonly refundId: string;
  readonly orderId: string;
  readonly userId: string;
  readonly amount: number;
  readonly currency: string;
  readonly reason: RefundReason;
  readonly processedAt: Date;
}