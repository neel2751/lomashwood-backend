export type PaymentGateway = "STRIPE" | "RAZORPAY";

export type PaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED";

export type RefundStatus = "PENDING" | "PROCESSING" | "SUCCEEDED" | "FAILED" | "CANCELLED";

export type PaymentMethodType = "CARD" | "BANK_TRANSFER" | "WALLET" | "CASH";

export type Currency = "GBP" | "USD" | "EUR" | "INR";

export type RefundReason =
  | "DUPLICATE"
  | "FRAUDULENT"
  | "CUSTOMER_REQUEST"
  | "PRODUCT_DEFECT"
  | "OTHER";

export interface PaymentClientConfig {
  baseUrl: string;
  timeout?: number;
  getAccessToken?: () => string | null;
  onUnauthorized?: () => void;
}

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  gateway: PaymentGateway;
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  holderName?: string;
  isDefault: boolean;
}

export interface PaymentIntent {
  id: string;
  orderId: string;
  gateway: PaymentGateway;
  gatewayIntentId: string;
  clientSecret: string;
  amount: number;
  currency: Currency;
  status: PaymentStatus;
  metadata: Record<string, string>;
  createdAt: string;
  expiresAt: string;
}

export interface PaymentTransaction {
  id: string;
  orderId: string;
  paymentIntentId: string;
  gateway: PaymentGateway;
  gatewayTransactionId: string;
  amount: number;
  currency: Currency;
  status: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  metadata: Record<string, unknown>;
  failureCode?: string;
  failureMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Refund {
  id: string;
  transactionId: string;
  orderId: string;
  gateway: PaymentGateway;
  gatewayRefundId: string;
  amount: number;
  currency: Currency;
  status: RefundStatus;
  reason: RefundReason;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentIntentPayload {
  orderId: string;
  paymentMethod: "STRIPE" | "RAZORPAY" | "BANK_TRANSFER" | "CASH";
  currency?: Currency;
  savePaymentMethod?: boolean;
  returnUrl?: string;
}

export interface CreatePaymentIntentResponse {
  paymentIntent: PaymentIntent;
  publishableKey?: string;
}

export interface ConfirmPaymentPayload {
  paymentIntentId: string;
  paymentMethodId?: string;
}

export interface ConfirmPaymentResponse {
  transaction: PaymentTransaction;
  requiresAction: boolean;
  nextActionUrl?: string;
}

export interface CreateRefundPayload {
  orderId: string;
  amount?: number;
  reason: RefundReason;
  description?: string;
  items?: Array<{
    orderItemId: string;
    quantity: number;
  }>;
}

export interface CreateRefundResponse {
  refund: Refund;
  transaction: PaymentTransaction;
}

export interface PaymentSummary {
  total: number;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  currency: Currency;
}

export interface OrderPaymentStatus {
  orderId: string;
  paymentStatus: PaymentStatus;
  paidAmount: number;
  refundedAmount: number;
  currency: Currency;
  transactions: PaymentTransaction[];
  refunds: Refund[];
}

export interface WebhookVerificationPayload {
  gateway: PaymentGateway;
  signature: string;
  rawBody: string;
  secret: string;
}

export interface WebhookVerificationResult {
  valid: boolean;
  event?: Record<string, unknown>;
}

export interface PaymentTransactionFilter {
  orderId?: string;
  userId?: string;
  status?: PaymentStatus;
  gateway?: PaymentGateway;
  currency?: Currency;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  limit?: number;
  sortBy?: "created_asc" | "created_desc" | "amount_asc" | "amount_desc";
}

export interface PaginatedTransactions {
  data: PaymentTransaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface StripeWebhookEvent {
  id: string;
  type: string;
  created: number;
  data: {
    object: Record<string, unknown>;
  };
  livemode: boolean;
}

export interface PaymentReconciliationReport {
  fromDate: string;
  toDate: string;
  totalTransactions: number;
  totalAmount: number;
  successfulAmount: number;
  failedAmount: number;
  refundedAmount: number;
  currency: Currency;
  gateway: PaymentGateway;
  discrepancies: Array<{
    transactionId: string;
    expectedAmount: number;
    actualAmount: number;
    difference: number;
  }>;
}