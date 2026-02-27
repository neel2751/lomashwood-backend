import { PrismaClient, Payment, PaymentStatus, PaymentMethod, Prisma } from '@prisma/client';
import {
  PaymentEntity,
  PaymentRepositoryFilters,
  PaymentStatistics,
  PaymentAnalytics,
  ReconciliationResult,
  PaymentHistoryEntry,
} from './payment.types';
import { PAYMENT_CONSTANTS } from './payment.constants';

export class PaymentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: {
    orderId: string;
    customerId: string;
    amount: number;
    currency: string;
    method: PaymentMethod;
    provider: string;
    status: PaymentStatus;
    paymentIntentId?: string;
    metadata?: string | null;
  }): Promise<PaymentEntity> {
    return await this.prisma.payment.create({
      data: {
        order: {
          connect: { id: data.orderId },
        },
        customerId: data.customerId,
        amount: new Prisma.Decimal(data.amount),
        currency: data.currency,
        method: data.method,
        provider: data.provider,
        status: data.status,
        paymentIntentId: data.paymentIntentId,
        metadata: data.metadata,
      },
      include: {
        order: true,
      },
    });
  }

  async findById(id: string): Promise<PaymentEntity | null> {
    return await this.prisma.payment.findUnique({
      where: { id },
      include: {
        order: true,
      },
    });
  }

  async findByOrderId(orderId: string): Promise<PaymentEntity[]> {
    return await this.prisma.payment.findMany({
      where: { orderId },
      include: {
        order: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByTransactionId(transactionId: string): Promise<PaymentEntity | null> {
    return await this.prisma.payment.findFirst({
      where: { transactionId },
      include: {
        order: true,
      },
    });
  }

  async findByPaymentIntentId(paymentIntentId: string): Promise<PaymentEntity | null> {
    return await this.prisma.payment.findFirst({
      where: { paymentIntentId },
      include: {
        order: true,
      },
    });
  }

  async findAll(
    filters: PaymentRepositoryFilters,
    page: number = 1,
    limit: number = PAYMENT_CONSTANTS.DEFAULT_PAGE_SIZE,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<PaymentEntity[]> {
    const where = this.buildWhereClause(filters);
    const skip = (page - 1) * limit;

    return await this.prisma.payment.findMany({
      where,
      include: {
        order: true,
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip,
      take: limit,
    });
  }

  async count(filters: PaymentRepositoryFilters): Promise<number> {
    const where = this.buildWhereClause(filters);
    return await this.prisma.payment.count({ where });
  }

  async update(
    id: string,
    data: {
      status?: PaymentStatus;
      transactionId?: string;
      paidAt?: Date;
      refundedAmount?: number;
      refundedAt?: Date;
      failureReason?: string | null;
      metadata?: string;
    }
  ): Promise<PaymentEntity> {
    const updateData: Prisma.PaymentUpdateInput = {};

    if (data.status !== undefined) {
      updateData.status = data.status;
    }

    if (data.transactionId !== undefined) {
      updateData.transactionId = data.transactionId;
    }

    if (data.paidAt !== undefined) {
      updateData.paidAt = data.paidAt;
    }

    if (data.refundedAmount !== undefined) {
      updateData.refundedAmount = new Prisma.Decimal(data.refundedAmount);
    }

    if (data.refundedAt !== undefined) {
      updateData.refundedAt = data.refundedAt;
    }

    if (data.failureReason !== undefined) {
      updateData.failureReason = data.failureReason;
    }

    if (data.metadata !== undefined) {
      updateData.metadata = data.metadata;
    }

    return await this.prisma.payment.update({
      where: { id },
      data: updateData,
      include: {
        order: true,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.payment.delete({
      where: { id },
    });
  }

  async findByCustomerId(customerId: string, limit: number = 10): Promise<PaymentEntity[]> {
    return await this.prisma.payment.findMany({
      where: { customerId },
      include: {
        order: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }

  async findPendingPayments(olderThan: Date): Promise<PaymentEntity[]> {
    return await this.prisma.payment.findMany({
      where: {
        status: PaymentStatus.PENDING,
        createdAt: {
          lt: olderThan,
        },
      },
      include: {
        order: true,
      },
    });
  }

  async findFailedPayments(fromDate: Date, toDate: Date): Promise<PaymentEntity[]> {
    return await this.prisma.payment.findMany({
      where: {
        status: PaymentStatus.FAILED,
        createdAt: {
          gte: fromDate,
          lte: toDate,
        },
      },
      include: {
        order: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getStatistics(fromDate: Date, toDate: Date): Promise<PaymentStatistics> {
    const payments = await this.prisma.payment.findMany({
      where: {
        createdAt: {
          gte: fromDate,
          lte: toDate,
        },
      },
    });

    const totalPayments = payments.length;
    const successfulPayments = payments.filter(p => p.status === PaymentStatus.PAID).length;
    const failedPayments = payments.filter(p => p.status === PaymentStatus.FAILED).length;
    const pendingPayments = payments.filter(p => p.status === PaymentStatus.PENDING).length;
    const refundedPayments = payments.filter(p => p.status === PaymentStatus.REFUNDED).length;

    const totalAmount = payments
      .filter(p => p.status === PaymentStatus.PAID)
      .reduce((sum, p) => sum + p.amount.toNumber(), 0);

    const refundedAmount = payments
      .filter(p => p.status === PaymentStatus.REFUNDED || p.status === PaymentStatus.PARTIALLY_REFUNDED)
      .reduce((sum, p) => sum + (p.refundedAmount?.toNumber() || 0), 0);

    const averagePaymentValue = successfulPayments > 0 ? totalAmount / successfulPayments : 0;

    const successRate = totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0;

    const methodBreakdown = payments.reduce((acc, payment) => {
      const method = payment.method;
      if (!acc[method]) {
        acc[method] = { count: 0, amount: 0 };
      }
      acc[method].count++;
      if (payment.status === PaymentStatus.PAID) {
        acc[method].amount += payment.amount.toNumber();
      }
      return acc;
    }, {} as Record<string, { count: number; amount: number }>);

    return {
      totalPayments,
      successfulPayments,
      failedPayments,
      pendingPayments,
      refundedPayments,
      totalAmount,
      refundedAmount,
      netAmount: totalAmount - refundedAmount,
      averagePaymentValue,
      successRate,
      methodBreakdown,
      period: {
        from: fromDate,
        to: toDate,
      },
    };
  }

  async getAnalytics(period: string, groupBy: string): Promise<PaymentAnalytics> {
    const now = new Date();
    let fromDate: Date;

    switch (period) {
      case 'day':
        fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        fromDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const payments = await this.prisma.payment.findMany({
      where: {
        createdAt: {
          gte: fromDate,
          lte: now,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const timeSeriesData: Array<{
      date: string;
      count: number;
      amount: number;
      successCount: number;
      failureCount: number;
    }> = [];

    const grouped = this.groupPaymentsByTime(payments, groupBy);

    for (const [date, groupPayments] of Object.entries(grouped)) {
      timeSeriesData.push({
        date,
        count: groupPayments.length,
        amount: groupPayments
          .filter(p => p.status === PaymentStatus.PAID)
          .reduce((sum, p) => sum + p.amount.toNumber(), 0),
        successCount: groupPayments.filter(p => p.status === PaymentStatus.PAID).length,
        failureCount: groupPayments.filter(p => p.status === PaymentStatus.FAILED).length,
      });
    }

    return {
      period,
      groupBy,
      timeSeriesData,
      totalTransactions: payments.length,
      totalVolume: payments
        .filter(p => p.status === PaymentStatus.PAID)
        .reduce((sum, p) => sum + p.amount.toNumber(), 0),
    };
  }

  async reconcile(fromDate: Date, toDate: Date): Promise<ReconciliationResult> {
    const payments = await this.prisma.payment.findMany({
      where: {
        createdAt: {
          gte: fromDate,
          lte: toDate,
        },
      },
    });

    const reconciled: string[] = [];
    const discrepancies: Array<{ paymentId: string; reason: string }> = [];

    for (const payment of payments) {
      if (payment.status === PaymentStatus.PAID && !payment.transactionId) {
        discrepancies.push({
          paymentId: payment.id,
          reason: 'Missing transaction ID for paid payment',
        });
      } else if (payment.status === PaymentStatus.PAID && payment.transactionId) {
        reconciled.push(payment.id);
      }
    }

    return {
      totalProcessed: payments.length,
      reconciled: reconciled.length,
      discrepancies: discrepancies.length,
      discrepancyDetails: discrepancies,
      period: {
        from: fromDate,
        to: toDate,
      },
    };
  }

  async getHistory(paymentId: string): Promise<PaymentHistoryEntry[]> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      return [];
    }

    const history: PaymentHistoryEntry[] = [
      {
        timestamp: payment.createdAt,
        action: 'CREATED',
        status: payment.status,
        metadata: payment.metadata ? JSON.parse(payment.metadata) : undefined,
      },
    ];

    if (payment.paidAt) {
      history.push({
        timestamp: payment.paidAt,
        action: 'PAID',
        status: PaymentStatus.PAID,
        transactionId: payment.transactionId || undefined,
      });
    }

    if (payment.refundedAt) {
      history.push({
        timestamp: payment.refundedAt,
        action: 'REFUNDED',
        status: payment.status,
        amount: payment.refundedAmount?.toNumber(),
      });
    }

    if (payment.status === PaymentStatus.FAILED && payment.failureReason) {
      history.push({
        timestamp: payment.updatedAt,
        action: 'FAILED',
        status: PaymentStatus.FAILED,
        reason: payment.failureReason,
      });
    }

    return history.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async bulkUpdateStatus(
    paymentIds: string[],
    status: PaymentStatus
  ): Promise<number> {
    const result = await this.prisma.payment.updateMany({
      where: {
        id: {
          in: paymentIds,
        },
      },
      data: {
        status,
      },
    });

    return result.count;
  }

  async getTotalRevenueByMethod(
    method: PaymentMethod,
    fromDate: Date,
    toDate: Date
  ): Promise<number> {
    const result = await this.prisma.payment.aggregate({
      where: {
        method,
        status: PaymentStatus.PAID,
        createdAt: {
          gte: fromDate,
          lte: toDate,
        },
      },
      _sum: {
        amount: true,
      },
    });

    return result._sum.amount?.toNumber() || 0;
  }

  async getAveragePaymentTime(fromDate: Date, toDate: Date): Promise<number> {
    const payments = await this.prisma.payment.findMany({
      where: {
        status: PaymentStatus.PAID,
        createdAt: {
          gte: fromDate,
          lte: toDate,
        },
        paidAt: {
          not: null,
        },
      },
      select: {
        createdAt: true,
        paidAt: true,
      },
    });

    if (payments.length === 0) {
      return 0;
    }

    const totalTime = payments.reduce((sum, payment) => {
      if (payment.paidAt) {
        return sum + (payment.paidAt.getTime() - payment.createdAt.getTime());
      }
      return sum;
    }, 0);

    return totalTime / payments.length / 1000;
  }

  async getPaymentsByStatus(
    status: PaymentStatus,
    limit: number = 100
  ): Promise<PaymentEntity[]> {
    return await this.prisma.payment.findMany({
      where: { status },
      include: {
        order: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }

  async getHighValuePayments(
    threshold: number,
    fromDate: Date,
    toDate: Date
  ): Promise<PaymentEntity[]> {
    return await this.prisma.payment.findMany({
      where: {
        amount: {
          gte: new Prisma.Decimal(threshold),
        },
        createdAt: {
          gte: fromDate,
          lte: toDate,
        },
      },
      include: {
        order: true,
      },
      orderBy: {
        amount: 'desc',
      },
    });
  }

  async markAsReconciled(paymentId: string): Promise<PaymentEntity> {
    return await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        metadata: JSON.stringify({
          reconciled: true,
          reconciledAt: new Date().toISOString(),
        }),
      },
      include: {
        order: true,
      },
    });
  }

  async findDuplicatePayments(
    orderId: string,
    amount: number
  ): Promise<PaymentEntity[]> {
    return await this.prisma.payment.findMany({
      where: {
        orderId,
        amount: new Prisma.Decimal(amount),
        status: {
          in: [PaymentStatus.PAID, PaymentStatus.PROCESSING],
        },
      },
      include: {
        order: true,
      },
    });
  }

  private buildWhereClause(filters: PaymentRepositoryFilters): Prisma.PaymentWhereInput {
    const where: Prisma.PaymentWhereInput = {};

    if (filters.status && filters.status.length > 0) {
      where.status = {
        in: filters.status,
      };
    }

    if (filters.method && filters.method.length > 0) {
      where.method = {
        in: filters.method,
      };
    }

    if (filters.provider) {
      where.provider = filters.provider;
    }

    if (filters.customerId) {
      where.customerId = filters.customerId;
    }

    if (filters.orderId) {
      where.orderId = filters.orderId;
    }

    if (filters.transactionId) {
      where.transactionId = filters.transactionId;
    }

    if (filters.dateRange) {
      where.createdAt = {
        gte: filters.dateRange.from,
        lte: filters.dateRange.to,
      };
    }

    if (filters.amountRange) {
      where.amount = {
        gte: filters.amountRange.min
          ? new Prisma.Decimal(filters.amountRange.min)
          : undefined,
        lte: filters.amountRange.max
          ? new Prisma.Decimal(filters.amountRange.max)
          : undefined,
      };
    }

    return where;
  }

  private groupPaymentsByTime(
    payments: Payment[],
    groupBy: string
  ): Record<string, Payment[]> {
    const grouped: Record<string, Payment[]> = {};

    payments.forEach(payment => {
      let key: string;
      const date = payment.createdAt;

      switch (groupBy) {
        case 'hour':
          key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:00`;
          break;
        case 'day':
          key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = `${weekStart.getFullYear()}-${weekStart.getMonth() + 1}-${weekStart.getDate()}`;
          break;
        case 'month':
          key = `${date.getFullYear()}-${date.getMonth() + 1}`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(payment);
    });

    return grouped;
  }
}