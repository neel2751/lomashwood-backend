import { Payment, PaymentStatus, PaymentMethod, Prisma } from '@prisma/client';

export interface PaymentEntity extends Payment {
  order?: OrderInfo;
}

export interface CreatePaymentIntentDTO {
  orderId: string;
  customerId: string;
  amount: number;
  currency?: string;
  method: PaymentMethod;
  provider: 'stripe' | 'razorpay';
  metadata?: Record<string, any>;
}

export interface ProcessPaymentDTO {
  paymentId: string;
  transactionId?: string;
  signature?: string;
  metadata?: Record<string, any>;
}

export interface VerifyPaymentDTO {
  paymentId: string;
  transactionId: string;
  signature?: string;
}

export interface RefundPaymentDTO {
  amount?: number;
  reason: string;
  metadata?: Record<string, any>;
}

export interface CapturePaymentDTO {
  amount?: number;
}

export interface CancelPaymentDTO {
  reason?: string;
}

export interface CreatePaymentIntentResult {
  paymentId: string;
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
}

export interface PaymentVerificationResult {
  isValid: boolean;
  status: PaymentStatus;
  paymentId: string;
  transactionId?: string;
}

export interface RefundResult {
  refundId: string;
  status: string;
  amount: number;
  processedAt: Date;
}

export interface PaymentResponseDTO {
  id: string;
  orderId: string;
  customerId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  provider: string;
  status: PaymentStatus;
  transactionId?: string;
  paymentIntentId?: string;
  paidAt?: Date;
  refundedAmount?: number;
  refundedAt?: Date;
  failureReason?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentListResponseDTO {
  payments: PaymentResponseDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaymentQueryParams {
  page?: number;
  limit?: number;
  status?: PaymentStatus | PaymentStatus[];
  method?: PaymentMethod | PaymentMethod[];
  provider?: string;
  orderId?: string;
  customerId?: string;
  transactionId?: string;
  fromDate?: Date;
  toDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: PaymentSortField;
  sortOrder?: 'asc' | 'desc';
}

export type PaymentSortField =
  | 'createdAt'
  | 'updatedAt'
  | 'amount'
  | 'status'
  | 'paidAt';

export interface PaymentRepositoryFilters {
  status?: PaymentStatus[];
  method?: PaymentMethod[];
  provider?: string;
  customerId?: string;
  orderId?: string;
  transactionId?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
  amountRange?: {
    min?: number;
    max?: number;
  };
}

export interface PaymentStatistics {
  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
  pendingPayments: number;
  refundedPayments: number;
  totalAmount: number;
  refundedAmount: number;
  netAmount: number;
  averagePaymentValue: number;
  successRate: number;
  methodBreakdown: Record<string, {
    count: number;
    amount: number;
  }>;
  period: {
    from: Date;
    to: Date;
  };
}

export interface PaymentAnalytics {
  period: string;
  groupBy: string;
  timeSeriesData: Array<{
    date: string;
    count: number;
    amount: number;
    successCount: number;
    failureCount: number;
  }>;
  totalTransactions: number;
  totalVolume: number;
}

export interface ReconciliationResult {
  totalProcessed: number;
  reconciled: number;
  discrepancies: number;
  discrepancyDetails: Array<{
    paymentId: string;
    reason: string;
  }>;
  period: {
    from: Date;
    to: Date;
  };
}

export interface PaymentHistoryEntry {
  timestamp: Date;
  action: string;
  status: PaymentStatus;
  amount?: number;
  transactionId?: string;
  reason?: string;
  metadata?: Record<string, any>;
}

export interface SavedPaymentMethod {
  id: string;
  type: string;
  brand?: string;
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  createdAt: Date;
}

export interface PaymentStatusCheck {
  paymentId: string;
  status: PaymentStatus;
  transactionId?: string;
  lastUpdated: Date;
}

export interface OrderInfo {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
  customerId: string;
}

export interface StripePaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  client_secret: string;
  metadata?: Record<string, any>;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
  notes?: Record<string, any>;
}

export interface PaymentWebhookEvent {
  id: string;
  type: string;
  data: any;
  createdAt: Date;
}

export interface PaymentGatewayConfig {
  provider: 'stripe' | 'razorpay';
  publicKey: string;
  secretKey: string;
  webhookSecret: string;
  apiVersion?: string;
}

export interface PaymentFees {
  amount: number;
  platformFee: number;
  processingFee: number;
  gst: number;
  totalFees: number;
  netAmount: number;
}

export interface SplitPayment {
  id: string;
  parentPaymentId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  description?: string;
}

export interface ScheduledPayment {
  id: string;
  orderId: string;
  customerId: string;
  amount: number;
  method: PaymentMethod;
  scheduledAt: Date;
  status: 'SCHEDULED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  attempts: number;
  lastAttemptAt?: Date;
  metadata?: Record<string, any>;
}

export interface PaymentDispute {
  id: string;
  paymentId: string;
  amount: number;
  reason: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'WON' | 'LOST' | 'CLOSED';
  evidence?: Record<string, any>;
  createdAt: Date;
  dueBy?: Date;
}

export interface PaymentPayout {
  id: string;
  amount: number;
  currency: string;
  destination: string;
  status: 'PENDING' | 'IN_TRANSIT' | 'PAID' | 'FAILED' | 'CANCELLED';
  description?: string;
  arrivalDate?: Date;
  metadata?: Record<string, any>;
}

export interface PaymentSubscription {
  id: string;
  customerId: string;
  planId: string;
  amount: number;
  interval: 'daily' | 'weekly' | 'monthly' | 'yearly';
  status: 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'EXPIRED';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  nextBillingDate?: Date;
  cancelAt?: Date;
}

export interface PaymentCard {
  id: string;
  customerId: string;
  brand: string;
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  country?: string;
  funding?: string;
  isDefault: boolean;
}

export interface PaymentUPI {
  id: string;
  customerId: string;
  vpa: string;
  verified: boolean;
  isDefault: boolean;
}

export interface PaymentWallet {
  id: string;
  customerId: string;
  provider: string;
  phone?: string;
  email?: string;
  isDefault: boolean;
}

export interface PaymentBankAccount {
  id: string;
  customerId: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
  accountType: 'SAVINGS' | 'CURRENT';
  verified: boolean;
  isDefault: boolean;
}

export interface PaymentAttempt {
  id: string;
  paymentId: string;
  attemptNumber: number;
  status: PaymentStatus;
  errorCode?: string;
  errorMessage?: string;
  attemptedAt: Date;
  metadata?: Record<string, any>;
}

export interface PaymentTransaction {
  id: string;
  paymentId: string;
  type: 'CHARGE' | 'REFUND' | 'DISPUTE' | 'PAYOUT';
  amount: number;
  currency: string;
  status: string;
  transactionId: string;
  gatewayResponse?: Record<string, any>;
  processedAt: Date;
}

export interface PaymentNotification {
  id: string;
  paymentId: string;
  type: 'EMAIL' | 'SMS' | 'PUSH' | 'WEBHOOK';
  recipient: string;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED';
  sentAt?: Date;
  deliveredAt?: Date;
  failureReason?: string;
}

export interface PaymentAuditLog {
  id: string;
  paymentId: string;
  action: string;
  performedBy: string;
  performedAt: Date;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface PaymentReport {
  id: string;
  type: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
  fromDate: Date;
  toDate: Date;
  totalPayments: number;
  totalAmount: number;
  totalRefunds: number;
  totalFees: number;
  netRevenue: number;
  generatedAt: Date;
  generatedBy: string;
}

export interface PaymentLink {
  id: string;
  orderId?: string;
  customerId?: string;
  amount: number;
  currency: string;
  description?: string;
  url: string;
  expiresAt?: Date;
  status: 'ACTIVE' | 'PAID' | 'EXPIRED' | 'CANCELLED';
  createdAt: Date;
}

export interface PaymentRecurring {
  id: string;
  customerId: string;
  paymentMethodId: string;
  amount: number;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  startDate: Date;
  endDate?: Date;
  nextChargeDate: Date;
  status: 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'COMPLETED';
}

export interface PaymentChargeback {
  id: string;
  paymentId: string;
  amount: number;
  reason: string;
  status: 'PENDING' | 'ACCEPTED' | 'REVERSED' | 'LOST';
  evidenceDeadline?: Date;
  resolvedAt?: Date;
  createdAt: Date;
}

export interface PaymentSettlement {
  id: string;
  batchId: string;
  paymentIds: string[];
  totalAmount: number;
  totalFees: number;
  netAmount: number;
  currency: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'SETTLED' | 'FAILED';
  settledAt?: Date;
  bankReference?: string;
}

export interface PaymentRiskAssessment {
  paymentId: string;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  flags: string[];
  reasons: string[];
  recommended: 'APPROVE' | 'REVIEW' | 'DECLINE';
  assessedAt: Date;
}

export interface PaymentFraudCheck {
  paymentId: string;
  ipAddress: string;
  deviceFingerprint?: string;
  velocity: number;
  cardBin?: string;
  country?: string;
  isFraudulent: boolean;
  fraudScore: number;
  checkedAt: Date;
}

export class PaymentNotFoundError extends Error {
  constructor(paymentId: string) {
    super(`Payment with ID ${paymentId} not found`);
    this.name = 'PaymentNotFoundError';
  }
}

export class PaymentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PaymentValidationError';
  }
}

export class PaymentProcessingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PaymentProcessingError';
  }
}

export class RefundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RefundError';
  }
}

export class WebhookVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WebhookVerificationError';
  }
}

export class PaymentGatewayError extends Error {
  constructor(message: string, public gatewayCode?: string) {
    super(message);
    this.name = 'PaymentGatewayError';
  }
}

export class InsufficientFundsError extends Error {
  constructor(message: string = 'Insufficient funds') {
    super(message);
    this.name = 'InsufficientFundsError';
  }
}

export class CardDeclinedError extends Error {
  constructor(message: string = 'Card declined') {
    super(message);
    this.name = 'CardDeclinedError';
  }
}

export class PaymentExpiredError extends Error {
  constructor(message: string = 'Payment session expired') {
    super(message);
    this.name = 'PaymentExpiredError';
  }
}

export class DuplicatePaymentError extends Error {
  constructor(message: string = 'Duplicate payment detected') {
    super(message);
    this.name = 'DuplicatePaymentError';
  }
}