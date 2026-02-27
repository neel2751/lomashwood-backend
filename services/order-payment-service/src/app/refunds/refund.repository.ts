import {
  PrismaClient,
  Refund,
  RefundStatus,
  Prisma,
} from '@prisma/client';
import { RefundFilters, RefundWithRelations } from './refund.types';
import { PaginationOptions, PaginatedResult, buildPaginationMeta } from '../../shared/pagination';
import { logger } from '../../config/logger';

// ─── Include shape ────────────────────────────────────────────────────────────

const refundWithRelations = {
  order: {
    select: {
      id: true,
      orderNumber: true,
      status: true,
      createdAt: true,
      customer: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  },
  payment: {
    select: {
      id: true,
      stripePaymentIntentId: true,
      amount: true,
      currency: true,
      status: true,
      createdAt: true,
    },
  },
} satisfies Prisma.RefundInclude;

// ─── Repository ───────────────────────────────────────────────────────────────

export class RefundRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // ── Create ────────────────────────────────────────────────────────────────

  async create(
    data: Prisma.RefundCreateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Refund> {
    const client = tx ?? this.prisma;

    const refund = await client.refund.create({ data });

    logger.debug('RefundRepository.create', { refundId: refund.id, orderId: refund.orderId });

    return refund;
  }

  // ── Read — single ─────────────────────────────────────────────────────────

  async findById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Refund | null> {
    const client = tx ?? this.prisma;

    return client.refund.findUnique({ where: { id } });
  }

  async findByIdWithRelations(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<RefundWithRelations> {
    const client = tx ?? this.prisma;

    const refund = await client.refund.findUnique({
      where: { id },
      include: refundWithRelations,
    });

    if (!refund) {
      // Caller (service) is responsible for throwing NotFoundError — repository
      // only returns null so the service can compose the right error message.
      return null as unknown as RefundWithRelations;
    }

    return refund as RefundWithRelations;
  }

  async findByStripeRefundId(
    stripeRefundId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Refund | null> {
    const client = tx ?? this.prisma;

    return client.refund.findFirst({ where: { stripeRefundId } });
  }

  // ── Read — collections ────────────────────────────────────────────────────

  async findByOrderId(
    orderId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<RefundWithRelations[]> {
    const client = tx ?? this.prisma;

    const refunds = await client.refund.findMany({
      where: { orderId, deletedAt: null },
      include: refundWithRelations,
      orderBy: { createdAt: 'desc' },
    });

    return refunds as RefundWithRelations[];
  }

  async findByPaymentId(
    paymentId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<RefundWithRelations[]> {
    const client = tx ?? this.prisma;

    const refunds = await client.refund.findMany({
      where: { paymentId, deletedAt: null },
      include: refundWithRelations,
      orderBy: { createdAt: 'desc' },
    });

    return refunds as RefundWithRelations[];
  }

  async findMany(
    filters: RefundFilters,
    pagination: PaginationOptions,
    tx?: Prisma.TransactionClient,
  ): Promise<PaginatedResult<RefundWithRelations>> {
    const client = tx ?? this.prisma;

    const where = this.buildWhereClause(filters);
    const orderBy = this.buildOrderBy(pagination.sortBy, pagination.sortOrder);

    const [total, records] = await Promise.all([
      client.refund.count({ where }),
      client.refund.findMany({
        where,
        include: refundWithRelations,
        orderBy,
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
      }),
    ]);

    return {
      data: records as RefundWithRelations[],
      meta: buildPaginationMeta(total, pagination),
    };
  }

  // ── Update ────────────────────────────────────────────────────────────────

  async update(
    id: string,
    data: Prisma.RefundUpdateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Refund> {
    const client = tx ?? this.prisma;

    const refund = await client.refund.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    logger.debug('RefundRepository.update', {
      refundId: id,
      fields: Object.keys(data),
    });

    return refund;
  }

  async updateByStripeRefundId(
    stripeRefundId: string,
    data: Prisma.RefundUpdateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Refund | null> {
    const client = tx ?? this.prisma;

    const existing = await client.refund.findFirst({ where: { stripeRefundId } });
    if (!existing) return null;

    return client.refund.update({
      where: { id: existing.id },
      data: { ...data, updatedAt: new Date() },
    });
  }

  // ── Soft delete ───────────────────────────────────────────────────────────

  async softDelete(
    id: string,
    deletedBy: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Refund> {
    const client = tx ?? this.prisma;

    return client.refund.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy,
        updatedAt: new Date(),
      },
    });
  }

  // ── Aggregates ────────────────────────────────────────────────────────────

  async sumByOrderId(
    orderId: string,
    statusFilter?: RefundStatus[],
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const client = tx ?? this.prisma;

    const result = await client.refund.aggregate({
      where: {
        orderId,
        deletedAt: null,
        ...(statusFilter && statusFilter.length > 0
          ? { status: { in: statusFilter } }
          : {}),
      },
      _sum: { amount: true },
    });

    return result._sum.amount?.toNumber() ?? 0;
  }

  async countByStatus(
    status: RefundStatus,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const client = tx ?? this.prisma;

    return client.refund.count({ where: { status, deletedAt: null } });
  }

  async countByOrderId(
    orderId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const client = tx ?? this.prisma;

    return client.refund.count({ where: { orderId, deletedAt: null } });
  }

  // ── Specialised queries ───────────────────────────────────────────────────

  /**
   * Returns all PENDING refunds older than `olderThanMinutes`.
   * Used by the reconcile-payments background job.
   */
  async findStaleProcessingRefunds(
    olderThanMinutes: number,
    tx?: Prisma.TransactionClient,
  ): Promise<Refund[]> {
    const client = tx ?? this.prisma;

    const cutoff = new Date(Date.now() - olderThanMinutes * 60 * 1000);

    return client.refund.findMany({
      where: {
        status: { in: [RefundStatus.PENDING, RefundStatus.PROCESSING] },
        processedAt: { lt: cutoff },
        deletedAt: null,
      },
      orderBy: { processedAt: 'asc' },
    });
  }

  /**
   * Returns all FAILED refunds that have not exceeded the max retry count.
   * Used by the retry-failed-webhooks background job.
   */
  async findRetryableFailedRefunds(
    maxRetries: number,
    tx?: Prisma.TransactionClient,
  ): Promise<Refund[]> {
    const client = tx ?? this.prisma;

    return client.refund.findMany({
      where: {
        status: RefundStatus.FAILED,
        retryCount: { lt: maxRetries },
        deletedAt: null,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Fetches a lightweight summary per status for the admin dashboard.
   */
  async getStatusBreakdown(tx?: Prisma.TransactionClient): Promise<
    Array<{ status: RefundStatus; count: number; totalAmount: number }>
  > {
    const client = tx ?? this.prisma;

    const rows = await client.refund.groupBy({
      by: ['status'],
      where: { deletedAt: null },
      _count: { id: true },
      _sum: { amount: true },
    });

    return rows.map((r) => ({
      status: r.status,
      count: r._count.id,
      totalAmount: r._sum.amount?.toNumber() ?? 0,
    }));
  }

  /**
   * Returns the most recent refund for a given order, regardless of status.
   */
  async findLatestByOrderId(
    orderId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Refund | null> {
    const client = tx ?? this.prisma;

    return client.refund.findFirst({
      where: { orderId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Checks whether a refund with the given Stripe refund ID already exists
   * (idempotency guard for webhook redeliveries).
   */
  async existsByStripeRefundId(
    stripeRefundId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<boolean> {
    const client = tx ?? this.prisma;

    const count = await client.refund.count({ where: { stripeRefundId } });
    return count > 0;
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private buildWhereClause(filters: RefundFilters): Prisma.RefundWhereInput {
    const where: Prisma.RefundWhereInput = { deletedAt: null };

    if (filters.orderId) {
      where.orderId = filters.orderId;
    }

    if (filters.paymentId) {
      where.paymentId = filters.paymentId;
    }

    if (filters.status) {
      where.status = Array.isArray(filters.status)
        ? { in: filters.status }
        : filters.status;
    }

    if (filters.requestedBy) {
      where.requestedBy = filters.requestedBy;
    }

    if (filters.currency) {
      where.currency = filters.currency;
    }

    if (filters.stripeRefundId) {
      where.stripeRefundId = filters.stripeRefundId;
    }

    if (filters.amountMin !== undefined || filters.amountMax !== undefined) {
      where.amount = {
        ...(filters.amountMin !== undefined
          ? { gte: new Prisma.Decimal(filters.amountMin) }
          : {}),
        ...(filters.amountMax !== undefined
          ? { lte: new Prisma.Decimal(filters.amountMax) }
          : {}),
      };
    }

    if (filters.createdFrom || filters.createdTo) {
      where.createdAt = {
        ...(filters.createdFrom ? { gte: filters.createdFrom } : {}),
        ...(filters.createdTo ? { lte: filters.createdTo } : {}),
      };
    }

    if (filters.settledFrom || filters.settledTo) {
      where.settledAt = {
        ...(filters.settledFrom ? { gte: filters.settledFrom } : {}),
        ...(filters.settledTo ? { lte: filters.settledTo } : {}),
      };
    }

    if (filters.search) {
      where.OR = [
        { id: { contains: filters.search, mode: 'insensitive' } },
        { stripeRefundId: { contains: filters.search, mode: 'insensitive' } },
        { reason: { contains: filters.search, mode: 'insensitive' } },
        { notes: { contains: filters.search, mode: 'insensitive' } },
        {
          order: {
            orderNumber: { contains: filters.search, mode: 'insensitive' },
          },
        },
      ];
    }

    return where;
  }

  private buildOrderBy(
    sortBy?: string,
    sortOrder?: 'asc' | 'desc',
  ): Prisma.RefundOrderByWithRelationInput {
    const direction: Prisma.SortOrder = sortOrder === 'asc' ? 'asc' : 'desc';

    const sortableFields: Record<string, Prisma.RefundOrderByWithRelationInput> = {
      createdAt: { createdAt: direction },
      updatedAt: { updatedAt: direction },
      amount: { amount: direction },
      status: { status: direction },
      settledAt: { settledAt: direction },
      processedAt: { processedAt: direction },
    };

    return sortableFields[sortBy ?? 'createdAt'] ?? { createdAt: 'desc' };
  }
}