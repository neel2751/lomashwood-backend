const SERVICE = 'order-payment' as const;

const topic = (...parts: string[]): string => [SERVICE, ...parts].join('.');

export const OrderTopics = {
  CREATED:            topic('order', 'created'),
  UPDATED:            topic('order', 'updated'),
  CANCELLED:          topic('order', 'cancelled'),
  COMPLETED:          topic('order', 'completed'),
  EXPIRED:            topic('order', 'expired'),
  REFUNDED:           topic('order', 'refunded'),
  PARTIALLY_REFUNDED: topic('order', 'partially-refunded'),
  RAZORPAY_PAID:      topic('order', 'razorpay-paid'),
} as const;

export const PaymentTopics = {
  CREATED:            topic('payment', 'created'),
  PROCESSING:         topic('payment', 'processing'),
  SUCCEEDED:          topic('payment', 'succeeded'),
  FAILED:             topic('payment', 'failed'),
  CANCELLED:          topic('payment', 'cancelled'),
  REQUIRES_ACTION:    topic('payment', 'requires-action'),
  REFUNDED:           topic('payment', 'refunded'),
  DISPUTE_CREATED:    topic('payment', 'dispute-created'),
  DISPUTE_UPDATED:    topic('payment', 'dispute-updated'),

  RAZORPAY_AUTHORIZED: topic('payment', 'razorpay-authorized'),
  RAZORPAY_CAPTURED:   topic('payment', 'razorpay-captured'),
  RAZORPAY_FAILED:     topic('payment', 'razorpay-failed'),
} as const;

export const RefundTopics = {
  INITIATED:          topic('refund', 'initiated'),
  STATUS_UPDATED:     topic('refund', 'status-updated'),
  SUCCEEDED:          topic('refund', 'succeeded'),
  FAILED:             topic('refund', 'failed'),
  CANCELLED:          topic('refund', 'cancelled'),
  CHARGE_REFUNDED:    topic('refund', 'charge-refunded'),

  RAZORPAY_CREATED:   topic('refund', 'razorpay-created'),
  RAZORPAY_PROCESSED: topic('refund', 'razorpay-processed'),
  RAZORPAY_FAILED:    topic('refund', 'razorpay-failed'),
} as const;

export const InvoiceTopics = {
  GENERATED:          topic('invoice', 'generated'),
  SENT:               topic('invoice', 'sent'),
  VOID:               topic('invoice', 'void'),
} as const;

export const WebhookTopics = {
  RECEIVED:           topic('webhook', 'received'),
  PROCESSED:          topic('webhook', 'processed'),
  FAILED:             topic('webhook', 'failed'),
  RETRYING:           topic('webhook', 'retrying'),
  DEAD_LETTERED:      topic('webhook', 'dead-lettered'),
} as const;

export const CheckoutTopics = {
  STARTED:            topic('checkout', 'started'),
  COMPLETED:          topic('checkout', 'completed'),
  ABANDONED:          topic('checkout', 'abandoned'),
  EXPIRED:            topic('checkout', 'expired'),
} as const;

export const ALL_TOPICS = {
  ...OrderTopics,
  ...PaymentTopics,
  ...RefundTopics,
  ...InvoiceTopics,
  ...WebhookTopics,
  ...CheckoutTopics,
} as const;

export type OrderTopic   = (typeof OrderTopics)[keyof typeof OrderTopics];
export type PaymentTopic = (typeof PaymentTopics)[keyof typeof PaymentTopics];
export type RefundTopic  = (typeof RefundTopics)[keyof typeof RefundTopics];
export type InvoiceTopic = (typeof InvoiceTopics)[keyof typeof InvoiceTopics];
export type WebhookTopic = (typeof WebhookTopics)[keyof typeof WebhookTopics];
export type CheckoutTopic = (typeof CheckoutTopics)[keyof typeof CheckoutTopics];
export type AnyTopic     = (typeof ALL_TOPICS)[keyof typeof ALL_TOPICS];