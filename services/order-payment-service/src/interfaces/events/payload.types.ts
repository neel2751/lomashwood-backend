import { OrderStatus, PaymentStatus, RefundStatus } from '@prisma/client';

// ── Shared primitives ──────────────────────────────────────────────────────────

export type MoneyAmount = {
  value:    number;
  currency: string;
};

export type OrderItemPayload = {
  productId:   string;
  productName: string;
  quantity:    number;
  unitPrice:   number;
  totalPrice:  number;
};

export type AddressPayload = {
  line1:      string;
  line2:      string | null;
  city:       string;
  county:     string | null;
  postcode:   string;
  country:    string;
};

export type CustomerPayload = {
  id:        string;
  email:     string;
  firstName: string;
  lastName:  string;
};

// ── Order payloads ─────────────────────────────────────────────────────────────

export type OrderCreatedPayload = {
  orderId:          string;
  orderNumber:      string;
  customerId:       string;
  customer:         CustomerPayload;
  items:            OrderItemPayload[];
  subtotal:         number;
  discountAmount:   number;
  taxAmount:        number;
  shippingAmount:   number;
  total:            number;
  currency:         string;
  shippingAddress:  AddressPayload | null;
  couponCode:       string | null;
  notes:            string | null;
  timestamp:        string;
};

export type OrderUpdatedPayload = {
  orderId:      string;
  orderNumber:  string;
  customerId:   string;
  previousStatus: OrderStatus;
  newStatus:    OrderStatus;
  updatedBy:    string | null;
  timestamp:    string;
};

export type OrderCancelledPayload = {
  orderId:      string;
  orderNumber:  string;
  customerId:   string;
  reason:       string;
  cancelledBy:  string | null;
  refundIssued: boolean;
  timestamp:    string;
};

export type OrderCompletedPayload = {
  orderId:     string;
  orderNumber: string;
  customerId:  string;
  completedAt: string;
  timestamp:   string;
};

export type OrderExpiredPayload = {
  orderId:    string;
  orderNumber: string;
  customerId: string;
  expiredAt:  string;
  timestamp:  string;
};

export type OrderRefundedPayload = {
  orderId:       string;
  orderNumber:   string;
  customerId:    string;
  totalRefunded: number;
  currency:      string;
  fullyRefunded: boolean;
  timestamp:     string;
};

export type RazorpayOrderPaidPayload = {
  orderId:     string;
  receipt:     string | null;
  amountPaid:  number;
  currency:    string;
  timestamp:   string;
};

// ── Payment payloads ───────────────────────────────────────────────────────────

export type PaymentCreatedPayload = {
  paymentId:       string;
  orderId:         string;
  customerId:      string | null;
  amount:          number;
  currency:        string;
  provider:        'stripe' | 'razorpay';
  timestamp:       string;
};

export type PaymentProcessingPayload = {
  paymentIntentId: string;
  amount:          number;
  currency:        string;
  metadata:        Record<string, string>;
  timestamp:       string;
};

export type PaymentSucceededPayload = {
  paymentId:       string;
  paymentIntentId: string;
  orderId:         string;
  customerId:      string | null;
  amount:          number;
  currency:        string;
  paymentMethod:   string | null;
  receiptEmail:    string | null;
  timestamp:       string;
};

export type PaymentFailedPayload = {
  paymentIntentId: string;
  orderId:         string;
  customerId:      string | null;
  amount:          number;
  currency:        string;
  errorCode:       string | null;
  errorMessage:    string;
  timestamp:       string;
};

export type PaymentCancelledPayload = {
  paymentIntentId:    string;
  orderId:            string;
  cancellationReason: string | null;
  timestamp:          string;
};

export type PaymentRequiresActionPayload = {
  paymentIntentId: string;
  nextActionType:  string | null;
  clientSecret:    string | null;
  timestamp:       string;
};

export type PaymentRefundedPayload = {
  paymentId:      string;
  orderId:        string;
  amountRefunded: number;
  currency:       string;
  timestamp:      string;
};

export type DisputeCreatedPayload = {
  disputeId:       string;
  chargeId:        string;
  paymentIntentId: string | null;
  amount:          number;
  currency:        string;
  reason:          string;
  status:          string;
  timestamp:       string;
};

export type DisputeUpdatedPayload = {
  disputeId:  string;
  chargeId:   string;
  newStatus:  string;
  timestamp:  string;
};

export type RazorpayPaymentAuthorizedPayload = {
  paymentId:  string;
  orderId:    string;
  amount:     number;
  currency:   string;
  method:     string;
  timestamp:  string;
};

export type RazorpayPaymentCapturedPayload = {
  paymentId:  string;
  orderId:    string;
  amount:     number;
  currency:   string;
  timestamp:  string;
};

export type RazorpayPaymentFailedPayload = {
  paymentId:        string;
  orderId:          string;
  errorCode:        unknown;
  errorDescription: unknown;
  timestamp:        string;
};

// ── Refund payloads ────────────────────────────────────────────────────────────

export type RefundInitiatedPayload = {
  refundId:    string;
  orderId:     string;
  amount:      number;
  currency:    string;
  requestedBy: string;
  timestamp:   string;
};

export type RefundStatusUpdatedPayload = {
  refundId:       string;
  orderId:        string;
  newStatus:      RefundStatus;
  stripeRefundId: string;
  timestamp:      string;
};

export type RefundSucceededPayload = {
  refundId:       string;
  orderId:        string;
  amount:         number;
  currency:       string;
  stripeRefundId: string;
  settledAt:      string;
  timestamp:      string;
};

export type RefundFailedPayload = {
  refundId:  string;
  orderId:   string;
  reason:    string;
  timestamp: string;
};

export type RefundCancelledPayload = {
  refundId:    string;
  orderId:     string;
  cancelledBy: string;
  timestamp:   string;
};

export type ChargeRefundedPayload = {
  chargeId:        string;
  paymentIntentId: string | null;
  amountRefunded:  number;
  currency:        string;
  refunded:        boolean;
  timestamp:       string;
};

export type RazorpayRefundCreatedPayload = {
  refundId:   string;
  paymentId:  string;
  amount:     unknown;
  currency:   unknown;
  status:     unknown;
  timestamp:  string;
};

export type RazorpayRefundProcessedPayload = {
  refundId:   string;
  paymentId:  string;
  amount:     unknown;
  currency:   unknown;
  timestamp:  string;
};

export type RazorpayRefundFailedPayload = {
  refundId:   string;
  paymentId:  string;
  amount:     unknown;
  currency:   unknown;
  timestamp:  string;
};

// ── Webhook payloads ───────────────────────────────────────────────────────────

export type WebhookReceivedPayload = {
  provider:  'stripe' | 'razorpay';
  eventId:   string;
  eventType: string;
  timestamp: string;
};

export type WebhookProcessedPayload = {
  provider:  'stripe' | 'razorpay';
  eventId:   string;
  eventType: string;
  timestamp: string;
};

export type WebhookFailedPayload = {
  provider:  'stripe' | 'razorpay';
  eventId:   string;
  eventType: string;
  error:     string;
  timestamp: string;
};

export type WebhookDeadLetteredPayload = {
  provider:   'stripe' | 'razorpay';
  eventId:    string;
  eventType:  string;
  attempts:   number;
  lastError:  string;
  timestamp:  string;
};

// ── Checkout payloads ──────────────────────────────────────────────────────────

export type CheckoutStartedPayload = {
  checkoutId:  string;
  orderId:     string;
  customerId:  string;
  amount:      number;
  currency:    string;
  timestamp:   string;
};

export type CheckoutCompletedPayload = {
  checkoutId:  string;
  orderId:     string;
  customerId:  string;
  paymentId:   string;
  timestamp:   string;
};

export type CheckoutAbandonedPayload = {
  checkoutId:  string;
  orderId:     string;
  customerId:  string;
  lastStep:    string;
  timestamp:   string;
};

export type CheckoutExpiredPayload = {
  checkoutId:  string;
  orderId:     string;
  customerId:  string;
  expiredAt:   string;
  timestamp:   string;
};

// ── Topic → payload map ────────────────────────────────────────────────────────

export type EventPayloadMap = {
  'order-payment.order.created':            OrderCreatedPayload;
  'order-payment.order.updated':            OrderUpdatedPayload;
  'order-payment.order.cancelled':          OrderCancelledPayload;
  'order-payment.order.completed':          OrderCompletedPayload;
  'order-payment.order.expired':            OrderExpiredPayload;
  'order-payment.order.refunded':           OrderRefundedPayload;
  'order-payment.order.partially-refunded': OrderRefundedPayload;
  'order-payment.order.razorpay-paid':      RazorpayOrderPaidPayload;

  'order-payment.payment.created':           PaymentCreatedPayload;
  'order-payment.payment.processing':        PaymentProcessingPayload;
  'order-payment.payment.succeeded':         PaymentSucceededPayload;
  'order-payment.payment.failed':            PaymentFailedPayload;
  'order-payment.payment.cancelled':         PaymentCancelledPayload;
  'order-payment.payment.requires-action':   PaymentRequiresActionPayload;
  'order-payment.payment.refunded':          PaymentRefundedPayload;
  'order-payment.payment.dispute-created':   DisputeCreatedPayload;
  'order-payment.payment.dispute-updated':   DisputeUpdatedPayload;
  'order-payment.payment.razorpay-authorized': RazorpayPaymentAuthorizedPayload;
  'order-payment.payment.razorpay-captured':   RazorpayPaymentCapturedPayload;
  'order-payment.payment.razorpay-failed':     RazorpayPaymentFailedPayload;

  'order-payment.refund.initiated':          RefundInitiatedPayload;
  'order-payment.refund.status-updated':     RefundStatusUpdatedPayload;
  'order-payment.refund.succeeded':          RefundSucceededPayload;
  'order-payment.refund.failed':             RefundFailedPayload;
  'order-payment.refund.cancelled':          RefundCancelledPayload;
  'order-payment.refund.charge-refunded':    ChargeRefundedPayload;
  'order-payment.refund.razorpay-created':   RazorpayRefundCreatedPayload;
  'order-payment.refund.razorpay-processed': RazorpayRefundProcessedPayload;
  'order-payment.refund.razorpay-failed':    RazorpayRefundFailedPayload;

  'order-payment.webhook.received':          WebhookReceivedPayload;
  'order-payment.webhook.processed':         WebhookProcessedPayload;
  'order-payment.webhook.failed':            WebhookFailedPayload;
  'order-payment.webhook.dead-lettered':     WebhookDeadLetteredPayload;

  'order-payment.checkout.started':          CheckoutStartedPayload;
  'order-payment.checkout.completed':        CheckoutCompletedPayload;
  'order-payment.checkout.abandoned':        CheckoutAbandonedPayload;
  'order-payment.checkout.expired':          CheckoutExpiredPayload;
};