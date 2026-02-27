import { Refund, RefundStatus, OrderStatus, Prisma } from '@prisma/client';

// ─── Prisma relation shapes ────────────────────────────────────────────────────

export type RefundOrderRelation = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  createdAt: Date;
  customer: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
};

export type RefundPaymentRelation = {
  id: string;
  stripePaymentIntentId: string | null;
  amount: Prisma.Decimal;
  currency: string;
  status: string;
  createdAt: Date;
};

export type RefundWithRelations = Refund & {
  order: RefundOrderRelation;
  payment: RefundPaymentRelation;
};

// ─── Service input types ───────────────────────────────────────────────────────

export type RefundCreateInput = {
  orderId: string;
  amount?: number;
  reason: string;
  notes?: string;
  metadata?: Record<string, unknown>;
};

export type RefundUpdateInput = Partial<{
  status: RefundStatus;
  stripeRefundId: string;
  failureReason: string | null;
  processedAt: Date;
  settledAt: Date;
  cancelledBy: string;
  cancelledAt: Date;
  lastRetriedBy: string;
  lastRetriedAt: Date;
  retryCount: { increment: number };
  notes: string;
  metadata: Record<string, unknown>;
}>;

// ─── Filter & pagination types ─────────────────────────────────────────────────

export type RefundFilters = {
  orderId?: string;
  paymentId?: string;
  status?: RefundStatus | RefundStatus[];
  requestedBy?: string;
  currency?: string;
  stripeRefundId?: string;
  amountMin?: number;
  amountMax?: number;
  createdFrom?: Date;
  createdTo?: Date;
  settledFrom?: Date;
  settledTo?: Date;
  search?: string;
};

// ─── Eligibility ───────────────────────────────────────────────────────────────

export type RefundEligibilityResult =
  | {
      eligible: true;
      maxRefundableAmount: number;
      currency: string;
    }
  | {
      eligible: false;
      reason: string;
    };

// ─── Summary ───────────────────────────────────────────────────────────────────

export type RefundSummaryInput = {
  orderId: string;
  totalPaid: number;
  totalRefunded: number;
  pendingRefunds: number;
  remainingRefundable: number;
  refundCount: number;
  currency: string;
};

export type RefundSummary = {
  orderId: string;
  currency: string;
  totalPaid: number;
  totalRefunded: number;
  pendingRefunds: number;
  remainingRefundable: number;
  refundCount: number;
  isFullyRefunded: boolean;
  isPartiallyRefunded: boolean;
};

// ─── Bulk refund ───────────────────────────────────────────────────────────────

export type BulkRefundSuccessItem = {
  orderId: string;
  refundId: string;
};

export type BulkRefundFailureItem = {
  orderId: string;
  error: string;
};

export type BulkRefundResult = {
  total: number;
  successful: BulkRefundSuccessItem[];
  failed: BulkRefundFailureItem[];
};

// ─── Status breakdown (analytics dashboard) ───────────────────────────────────

export type RefundStatusBreakdownItem = {
  status: RefundStatus;
  count: number;
  totalAmount: number;
};

export type RefundStatusBreakdown = RefundStatusBreakdownItem[];

// ─── Stale / retryable job payloads ───────────────────────────────────────────

export type StaleRefundRecord = Pick<
  Refund,
  'id' | 'orderId' | 'paymentId' | 'status' | 'processedAt' | 'retryCount'
>;

export type RetryableRefundRecord = Pick<
  Refund,
  'id' | 'orderId' | 'paymentId' | 'status' | 'retryCount' | 'failureReason'
>;

// ─── Event payloads ────────────────────────────────────────────────────────────

export type RefundInitiatedPayload = {
  refundId: string;
  orderId: string;
  amount: number;
  currency: string;
  requestedBy: string;
  timestamp: string;
};

export type RefundStatusUpdatedPayload = {
  refundId: string;
  orderId: string;
  newStatus: RefundStatus;
  stripeRefundId: string;
  timestamp: string;
};

export type RefundFailedPayload = {
  refundId: string;
  orderId: string;
  reason: string;
  timestamp: string;
};

export type RefundCancelledPayload = {
  refundId: string;
  orderId: string;
  cancelledBy: string;
  timestamp: string;
};

// ─── Controller response shapes ────────────────────────────────────────────────

export type RefundResponse = {
  id: string;
  orderId: string;
  paymentId: string;
  stripeRefundId: string | null;
  amount: number;
  currency: string;
  status: RefundStatus;
  reason: string;
  notes: string | null;
  failureReason: string | null;
  requestedBy: string;
  processedAt: Date | null;
  settledAt: Date | null;
  cancelledAt: Date | null;
  cancelledBy: string | null;
  retryCount: number;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  order: {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    customer: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
    };
  };
  payment: {
    id: string;
    stripePaymentIntentId: string | null;
    amount: number;
    currency: string;
    status: string;
  };
};

export type RefundListResponse = {
  data: RefundResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};