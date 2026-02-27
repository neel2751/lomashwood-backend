import { Payment, PaymentStatus, PaymentMethod, Prisma } from '@prisma/client';
import {
  PaymentEntity,
  PaymentResponseDTO,
  PaymentListResponseDTO,
  CreatePaymentIntentDTO,
  PaymentQueryParams,
  PaymentRepositoryFilters,
  PaymentStatistics,
  PaymentAnalytics,
  SavedPaymentMethod,
  PaymentHistoryEntry,
  ReconciliationResult,
  PaymentStatusCheck,
  PaymentFees,
  SplitPayment,
  ScheduledPayment,
} from './payment.types';

export class PaymentMapper {
  static toResponseDTO(payment: PaymentEntity): PaymentResponseDTO {
    return {
      id: payment.id,
      orderId: payment.orderId,
      customerId: payment.customerId,
      amount: payment.amount.toNumber(),
      currency: payment.currency,
      method: payment.method,
      provider: payment.provider,
      status: payment.status,
      transactionId: payment.transactionId || undefined,
      paymentIntentId: payment.paymentIntentId || undefined,
      paidAt: payment.paidAt || undefined,
      refundedAmount: payment.refundedAmount?.toNumber() || undefined,
      refundedAt: payment.refundedAt || undefined,
      failureReason: payment.failureReason || undefined,
      metadata: payment.metadata ? JSON.parse(payment.metadata) : undefined,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  }

  static toListResponseDTO(
    payments: PaymentEntity[],
    total: number,
    page: number,
    limit: number
  ): PaymentListResponseDTO {
    return {
      payments: payments.map((payment) => this.toResponseDTO(payment)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static toPrismaCreateInput(
    dto: CreatePaymentIntentDTO,
    paymentIntentId: string
  ): Prisma.PaymentCreateInput {
    return {
      order: {
        connect: { id: dto.orderId },
      },
      customerId: dto.customerId,
      amount: new Prisma.Decimal(dto.amount),
      currency: dto.currency || 'INR',
      method: dto.method,
      provider: dto.provider,
      status: PaymentStatus.PENDING,
      paymentIntentId,
      metadata: dto.metadata ? JSON.stringify(dto.metadata) : null,
    };
  }

  static toRepositoryFilters(params: PaymentQueryParams): PaymentRepositoryFilters {
    const filters: PaymentRepositoryFilters = {};

    if (params.status) {
      filters.status = Array.isArray(params.status)
        ? params.status
        : [params.status];
    }

    if (params.method) {
      filters.method = Array.isArray(params.method)
        ? params.method
        : [params.method];
    }

    if (params.provider) {
      filters.provider = params.provider;
    }

    if (params.customerId) {
      filters.customerId = params.customerId;
    }

    if (params.orderId) {
      filters.orderId = params.orderId;
    }

    if (params.transactionId) {
      filters.transactionId = params.transactionId;
    }

    if (params.fromDate || params.toDate) {
      filters.dateRange = {
        from: params.fromDate || new Date(0),
        to: params.toDate || new Date(),
      };
    }

    if (params.minAmount || params.maxAmount) {
      filters.amountRange = {
        min: params.minAmount,
        max: params.maxAmount,
      };
    }

    return filters;
  }

  static toStatusCheckDTO(payment: PaymentEntity): PaymentStatusCheck {
    return {
      paymentId: payment.id,
      status: payment.status,
      transactionId: payment.transactionId || undefined,
      lastUpdated: payment.updatedAt,
    };
  }

  static toSavedPaymentMethod(method: any): SavedPaymentMethod {
    return {
      id: method.id,
      type: method.type || method.object,
      brand: method.card?.brand || method.brand,
      last4: method.card?.last4 || method.last4,
      expiryMonth: method.card?.exp_month || method.exp_month,
      expiryYear: method.card?.exp_year || method.exp_year,
      isDefault: method.is_default || false,
      createdAt: method.created
        ? new Date(method.created * 1000)
        : new Date(),
    };
  }

  static toHistoryEntry(
    timestamp: Date,
    action: string,
    status: PaymentStatus,
    metadata?: any
  ): PaymentHistoryEntry {
    return {
      timestamp,
      action,
      status,
      amount: metadata?.amount,
      transactionId: metadata?.transactionId,
      reason: metadata?.reason,
      metadata,
    };
  }

  static toPaymentStatisticsDTO(data: {
    totalPayments: number;
    successfulPayments: number;
    failedPayments: number;
    pendingPayments: number;
    refundedPayments: number;
    totalAmount: number;
    refundedAmount: number;
    averagePaymentValue: number;
    successRate: number;
    methodBreakdown: Record<string, { count: number; amount: number }>;
    from: Date;
    to: Date;
  }): PaymentStatistics {
    return {
      totalPayments: data.totalPayments,
      successfulPayments: data.successfulPayments,
      failedPayments: data.failedPayments,
      pendingPayments: data.pendingPayments,
      refundedPayments: data.refundedPayments,
      totalAmount: data.totalAmount,
      refundedAmount: data.refundedAmount,
      netAmount: data.totalAmount - data.refundedAmount,
      averagePaymentValue: data.averagePaymentValue,
      successRate: data.successRate,
      methodBreakdown: data.methodBreakdown,
      period: {
        from: data.from,
        to: data.to,
      },
    };
  }

  static toAnalyticsDTO(
    period: string,
    groupBy: string,
    timeSeriesData: Array<{
      date: string;
      count: number;
      amount: number;
      successCount: number;
      failureCount: number;
    }>,
    totalTransactions: number,
    totalVolume: number
  ): PaymentAnalytics {
    return {
      period,
      groupBy,
      timeSeriesData,
      totalTransactions,
      totalVolume,
    };
  }

  static toReconciliationResult(
    totalProcessed: number,
    reconciled: number,
    discrepancies: number,
    discrepancyDetails: Array<{ paymentId: string; reason: string }>,
    from: Date,
    to: Date
  ): ReconciliationResult {
    return {
      totalProcessed,
      reconciled,
      discrepancies,
      discrepancyDetails,
      period: {
        from,
        to,
      },
    };
  }

  static toMinimalDTO(payment: Payment): {
    id: string;
    orderId: string;
    status: PaymentStatus;
    amount: number;
  } {
    return {
      id: payment.id,
      orderId: payment.orderId,
      status: payment.status,
      amount: payment.amount.toNumber(),
    };
  }

  static toFeesBreakdown(
    amount: number,
    method: PaymentMethod,
    provider: string
  ): PaymentFees {
    let platformFeeRate = 0;
    let processingFeeRate = 0;

    if (provider === 'stripe') {
      if (method === PaymentMethod.CARD) {
        processingFeeRate = 0.029;
        platformFeeRate = 0.01;
      } else if (method === PaymentMethod.UPI) {
        processingFeeRate = 0.01;
      } else if (method === PaymentMethod.NET_BANKING) {
        processingFeeRate = 0.02;
      }
    } else if (provider === 'razorpay') {
      if (method === PaymentMethod.CARD) {
        processingFeeRate = 0.02;
        platformFeeRate = 0.01;
      } else if (method === PaymentMethod.UPI) {
        processingFeeRate = 0.005;
      } else if (method === PaymentMethod.NET_BANKING) {
        processingFeeRate = 0.015;
      }
    }

    const processingFee = amount * processingFeeRate;
    const platformFee = amount * platformFeeRate;
    const gst = (processingFee + platformFee) * 0.18;
    const totalFees = processingFee + platformFee + gst;
    const netAmount = amount - totalFees;

    return {
      amount,
      platformFee: Math.round(platformFee * 100) / 100,
      processingFee: Math.round(processingFee * 100) / 100,
      gst: Math.round(gst * 100) / 100,
      totalFees: Math.round(totalFees * 100) / 100,
      netAmount: Math.round(netAmount * 100) / 100,
    };
  }

  static toSplitPaymentDTO(
    split: any,
    parentPaymentId: string
  ): SplitPayment {
    return {
      id: split.id,
      parentPaymentId,
      amount: split.amount,
      method: split.method,
      status: split.status,
      description: split.description,
    };
  }

  static toScheduledPaymentDTO(scheduled: any): ScheduledPayment {
    return {
      id: scheduled.id,
      orderId: scheduled.orderId,
      customerId: scheduled.customerId,
      amount: scheduled.amount,
      method: scheduled.method,
      scheduledAt: scheduled.scheduledAt,
      status: scheduled.status,
      attempts: scheduled.attempts || 0,
      lastAttemptAt: scheduled.lastAttemptAt,
      metadata: scheduled.metadata ? JSON.parse(scheduled.metadata) : undefined,
    };
  }

  static enrichWithMetadata(
    payment: PaymentEntity,
    metadata: Record<string, any>
  ): PaymentEntity {
    const existingMetadata = payment.metadata
      ? JSON.parse(payment.metadata)
      : {};

    return {
      ...payment,
      metadata: JSON.stringify({
        ...existingMetadata,
        ...metadata,
      }),
    };
  }

  static extractGatewayData(payment: PaymentEntity): Record<string, any> | null {
    if (!payment.metadata) return null;

    try {
      const metadata = JSON.parse(payment.metadata);
      return metadata.gatewayResponse || metadata.stripePaymentIntent || null;
    } catch {
      return null;
    }
  }

  static isPaymentRefundable(payment: PaymentEntity): boolean {
    if (payment.status !== PaymentStatus.PAID) {
      return false;
    }

    const refundedAmount = payment.refundedAmount?.toNumber() || 0;
    const totalAmount = payment.amount.toNumber();

    return refundedAmount < totalAmount;
  }

  static calculateRefundableAmount(payment: PaymentEntity): number {
    if (!this.isPaymentRefundable(payment)) {
      return 0;
    }

    const refundedAmount = payment.refundedAmount?.toNumber() || 0;
    const totalAmount = payment.amount.toNumber();

    return totalAmount - refundedAmount;
  }

  static isPaymentExpired(payment: PaymentEntity, timeoutMinutes: number = 30): boolean {
    if (payment.status !== PaymentStatus.PENDING) {
      return false;
    }

    const createdAt = payment.createdAt.getTime();
    const now = Date.now();
    const diffMinutes = (now - createdAt) / 1000 / 60;

    return diffMinutes > timeoutMinutes;
  }

  static getPaymentAge(payment: PaymentEntity): {
    days: number;
    hours: number;
    minutes: number;
  } {
    const createdAt = payment.createdAt.getTime();
    const now = Date.now();
    const diffMs = now - createdAt;

    return {
      days: Math.floor(diffMs / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)),
    };
  }

  static groupByStatus(payments: PaymentEntity[]): Map<PaymentStatus, PaymentEntity[]> {
    const grouped = new Map<PaymentStatus, PaymentEntity[]>();

    payments.forEach((payment) => {
      const existing = grouped.get(payment.status) || [];
      grouped.set(payment.status, [...existing, payment]);
    });

    return grouped;
  }

  static groupByMethod(payments: PaymentEntity[]): Map<PaymentMethod, PaymentEntity[]> {
    const grouped = new Map<PaymentMethod, PaymentEntity[]>();

    payments.forEach((payment) => {
      const existing = grouped.get(payment.method) || [];
      grouped.set(payment.method, [...existing, payment]);
    });

    return grouped;
  }

  static groupByProvider(payments: PaymentEntity[]): Map<string, PaymentEntity[]> {
    const grouped = new Map<string, PaymentEntity[]>();

    payments.forEach((payment) => {
      const existing = grouped.get(payment.provider) || [];
      grouped.set(payment.provider, [...existing, payment]);
    });

    return grouped;
  }

  static sortByAmount(
    payments: PaymentEntity[],
    direction: 'asc' | 'desc' = 'desc'
  ): PaymentEntity[] {
    return [...payments].sort((a, b) => {
      const amountA = a.amount.toNumber();
      const amountB = b.amount.toNumber();
      return direction === 'asc' ? amountA - amountB : amountB - amountA;
    });
  }

  static sortByDate(
    payments: PaymentEntity[],
    direction: 'asc' | 'desc' = 'desc'
  ): PaymentEntity[] {
    return [...payments].sort((a, b) => {
      const dateA = a.createdAt.getTime();
      const dateB = b.createdAt.getTime();
      return direction === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }

  static filterByDateRange(
    payments: PaymentEntity[],
    from: Date,
    to: Date
  ): PaymentEntity[] {
    return payments.filter(
      (payment) => payment.createdAt >= from && payment.createdAt <= to
    );
  }

  static filterByAmountRange(
    payments: PaymentEntity[],
    min: number,
    max: number
  ): PaymentEntity[] {
    return payments.filter((payment) => {
      const amount = payment.amount.toNumber();
      return amount >= min && amount <= max;
    });
  }

  static calculateTotalAmount(payments: PaymentEntity[]): number {
    return payments.reduce(
      (sum, payment) => sum + payment.amount.toNumber(),
      0
    );
  }

  static calculateAverageAmount(payments: PaymentEntity[]): number {
    if (payments.length === 0) return 0;
    return this.calculateTotalAmount(payments) / payments.length;
  }

  static calculateSuccessRate(payments: PaymentEntity[]): number {
    if (payments.length === 0) return 0;

    const successfulPayments = payments.filter(
      (p) => p.status === PaymentStatus.PAID
    ).length;

    return (successfulPayments / payments.length) * 100;
  }

  static getPaymentsByCustomer(
    payments: PaymentEntity[],
    customerId: string
  ): PaymentEntity[] {
    return payments.filter((p) => p.customerId === customerId);
  }

  static getPaymentsByOrder(
    payments: PaymentEntity[],
    orderId: string
  ): PaymentEntity[] {
    return payments.filter((p) => p.orderId === orderId);
  }

  static getFailedPayments(payments: PaymentEntity[]): PaymentEntity[] {
    return payments.filter((p) => p.status === PaymentStatus.FAILED);
  }

  static getPendingPayments(payments: PaymentEntity[]): PaymentEntity[] {
    return payments.filter((p) => p.status === PaymentStatus.PENDING);
  }

  static getRefundedPayments(payments: PaymentEntity[]): PaymentEntity[] {
    return payments.filter(
      (p) =>
        p.status === PaymentStatus.REFUNDED ||
        p.status === PaymentStatus.PARTIALLY_REFUNDED
    );
  }

  static generatePaymentReference(provider: string, orderId: string): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const providerPrefix = provider.substring(0, 3).toUpperCase();
    return `${providerPrefix}-${orderId.substring(0, 8)}-${timestamp}-${random}`;
  }

  static sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(metadata)) {
      if (
        key !== 'password' &&
        key !== 'secret' &&
        key !== 'apiKey' &&
        key !== 'token'
      ) {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  static maskSensitiveData(payment: PaymentEntity): PaymentEntity {
    const masked = { ...payment };

    if (masked.transactionId) {
      const length = masked.transactionId.length;
      masked.transactionId =
        '*'.repeat(Math.max(0, length - 4)) +
        masked.transactionId.substring(length - 4);
    }

    if (masked.metadata) {
      const metadata = JSON.parse(masked.metadata);
      masked.metadata = JSON.stringify(this.sanitizeMetadata(metadata));
    }

    return masked;
  }
}