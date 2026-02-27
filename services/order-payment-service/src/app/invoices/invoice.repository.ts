import { PrismaClient, Invoice, InvoiceStatus, Prisma } from '@prisma/client';
import {
  InvoiceEntity,
  InvoiceRepositoryFilters,
  InvoiceStatistics,
  InvoiceHistoryEntry,
} from './invoice.types';
import { INVOICE_CONSTANTS } from './invoice.constants';

export class InvoiceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: {
    orderId: string;
    customerId: string;
    invoiceNumber: string;
    invoiceDate: Date;
    dueDate: Date;
    status: InvoiceStatus;
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    shippingAmount: number;
    totalAmount: number;
    currency: string;
    items: any[];
    billingAddress: any;
    shippingAddress: any;
    notes?: string;
    terms?: string;
    metadata?: any;
  }): Promise<InvoiceEntity> {
    return await this.prisma.invoice.create({
      data: {
        order: {
          connect: { id: data.orderId },
        },
        customerId: data.customerId,
        invoiceNumber: data.invoiceNumber,
        invoiceDate: data.invoiceDate,
        dueDate: data.dueDate,
        status: data.status,
        subtotal: new Prisma.Decimal(data.subtotal),
        taxAmount: new Prisma.Decimal(data.taxAmount),
        discountAmount: new Prisma.Decimal(data.discountAmount),
        shippingAmount: new Prisma.Decimal(data.shippingAmount),
        totalAmount: new Prisma.Decimal(data.totalAmount),
        currency: data.currency,
        items: JSON.stringify(data.items),
        billingAddress: JSON.stringify(data.billingAddress),
        shippingAddress: JSON.stringify(data.shippingAddress),
        notes: data.notes,
        terms: data.terms,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      },
      include: {
        order: true,
      },
    });
  }

  async findById(id: string): Promise<InvoiceEntity | null> {
    return await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        order: true,
      },
    });
  }

  async findByInvoiceNumber(invoiceNumber: string): Promise<InvoiceEntity | null> {
    return await this.prisma.invoice.findUnique({
      where: { invoiceNumber },
      include: {
        order: true,
      },
    });
  }

  async findByOrderId(orderId: string): Promise<InvoiceEntity | null> {
    return await this.prisma.invoice.findFirst({
      where: { orderId },
      include: {
        order: true,
      },
    });
  }

  async findByCustomerId(
    customerId: string,
    limit: number = 20
  ): Promise<InvoiceEntity[]> {
    return await this.prisma.invoice.findMany({
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

  async findAll(
    filters: InvoiceRepositoryFilters,
    page: number = 1,
    limit: number = INVOICE_CONSTANTS.DEFAULT_PAGE_SIZE,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<InvoiceEntity[]> {
    const where = this.buildWhereClause(filters);
    const skip = (page - 1) * limit;

    return await this.prisma.invoice.findMany({
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

  async count(filters: InvoiceRepositoryFilters): Promise<number> {
    const where = this.buildWhereClause(filters);
    return await this.prisma.invoice.count({ where });
  }

  async update(
    id: string,
    data: {
      status?: InvoiceStatus;
      invoiceNumber?: string;
      dueDate?: Date;
      subtotal?: number;
      taxAmount?: number;
      discountAmount?: number;
      shippingAmount?: number;
      totalAmount?: number;
      paidAmount?: number;
      paidAt?: Date;
      paymentId?: string;
      sentAt?: Date;
      cancelledAt?: Date;
      cancelReason?: string;
      voidedAt?: Date;
      voidReason?: string;
      notes?: string;
      terms?: string;
      metadata?: string;
    }
  ): Promise<InvoiceEntity> {
    const updateData: Prisma.InvoiceUpdateInput = {};

    if (data.status !== undefined) {
      updateData.status = data.status;
    }

    if (data.invoiceNumber !== undefined) {
      updateData.invoiceNumber = data.invoiceNumber;
    }

    if (data.dueDate !== undefined) {
      updateData.dueDate = data.dueDate;
    }

    if (data.subtotal !== undefined) {
      updateData.subtotal = new Prisma.Decimal(data.subtotal);
    }

    if (data.taxAmount !== undefined) {
      updateData.taxAmount = new Prisma.Decimal(data.taxAmount);
    }

    if (data.discountAmount !== undefined) {
      updateData.discountAmount = new Prisma.Decimal(data.discountAmount);
    }

    if (data.shippingAmount !== undefined) {
      updateData.shippingAmount = new Prisma.Decimal(data.shippingAmount);
    }

    if (data.totalAmount !== undefined) {
      updateData.totalAmount = new Prisma.Decimal(data.totalAmount);
    }

    if (data.paidAmount !== undefined) {
      updateData.paidAmount = new Prisma.Decimal(data.paidAmount);
    }

    if (data.paidAt !== undefined) {
      updateData.paidAt = data.paidAt;
    }

    if (data.paymentId !== undefined) {
      updateData.paymentId = data.paymentId;
    }

    if (data.sentAt !== undefined) {
      updateData.sentAt = data.sentAt;
    }

    if (data.cancelledAt !== undefined) {
      updateData.cancelledAt = data.cancelledAt;
    }

    if (data.cancelReason !== undefined) {
      updateData.cancelReason = data.cancelReason;
    }

    if (data.voidedAt !== undefined) {
      updateData.voidedAt = data.voidedAt;
    }

    if (data.voidReason !== undefined) {
      updateData.voidReason = data.voidReason;
    }

    if (data.notes !== undefined) {
      updateData.notes = data.notes;
    }

    if (data.terms !== undefined) {
      updateData.terms = data.terms;
    }

    if (data.metadata !== undefined) {
      updateData.metadata = data.metadata;
    }

    return await this.prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        order: true,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.invoice.delete({
      where: { id },
    });
  }

  async findOverdue(limit: number = 50): Promise<InvoiceEntity[]> {
    return await this.prisma.invoice.findMany({
      where: {
        status: {
          in: [InvoiceStatus.ISSUED, InvoiceStatus.OVERDUE],
        },
        dueDate: {
          lt: new Date(),
        },
      },
      include: {
        order: true,
      },
      orderBy: {
        dueDate: 'asc',
      },
      take: limit,
    });
  }

  async findDueSoon(days: number = 7, limit: number = 50): Promise<InvoiceEntity[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return await this.prisma.invoice.findMany({
      where: {
        status: InvoiceStatus.ISSUED,
        dueDate: {
          gte: new Date(),
          lte: futureDate,
        },
      },
      include: {
        order: true,
      },
      orderBy: {
        dueDate: 'asc',
      },
      take: limit,
    });
  }

  async getStatistics(fromDate: Date, toDate: Date): Promise<InvoiceStatistics> {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        createdAt: {
          gte: fromDate,
          lte: toDate,
        },
      },
    });

    const totalInvoices = invoices.length;
    const draftInvoices = invoices.filter(
      (i) => i.status === InvoiceStatus.DRAFT
    ).length;
    const issuedInvoices = invoices.filter(
      (i) => i.status === InvoiceStatus.ISSUED
    ).length;
    const paidInvoices = invoices.filter(
      (i) => i.status === InvoiceStatus.PAID
    ).length;
    const overdueInvoices = invoices.filter(
      (i) => i.status === InvoiceStatus.OVERDUE
    ).length;
    const cancelledInvoices = invoices.filter(
      (i) => i.status === InvoiceStatus.CANCELLED
    ).length;
    const voidInvoices = invoices.filter(
      (i) => i.status === InvoiceStatus.VOID
    ).length;

    const totalAmount = invoices.reduce(
      (sum, i) => sum + i.totalAmount.toNumber(),
      0
    );

    const paidAmount = invoices
      .filter((i) => i.status === InvoiceStatus.PAID)
      .reduce((sum, i) => sum + (i.paidAmount?.toNumber() || 0), 0);

    const outstandingAmount = invoices
      .filter(
        (i) =>
          i.status === InvoiceStatus.ISSUED ||
          i.status === InvoiceStatus.OVERDUE
      )
      .reduce((sum, i) => sum + i.totalAmount.toNumber(), 0);

    const averageInvoiceValue = totalInvoices > 0 ? totalAmount / totalInvoices : 0;

    const averagePaymentTime = this.calculateAveragePaymentTime(invoices);

    return {
      totalInvoices,
      draftInvoices,
      issuedInvoices,
      paidInvoices,
      overdueInvoices,
      cancelledInvoices,
      voidInvoices,
      totalAmount,
      paidAmount,
      outstandingAmount,
      averageInvoiceValue,
      averagePaymentTime,
      period: {
        from: fromDate,
        to: toDate,
      },
    };
  }

  async getHistory(invoiceId: string): Promise<InvoiceHistoryEntry[]> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      return [];
    }

    const history: InvoiceHistoryEntry[] = [
      {
        timestamp: invoice.createdAt,
        action: 'CREATED',
        status: invoice.status,
      },
    ];

    if (invoice.sentAt) {
      history.push({
        timestamp: invoice.sentAt,
        action: 'SENT',
        status: invoice.status,
      });
    }

    if (invoice.paidAt) {
      history.push({
        timestamp: invoice.paidAt,
        action: 'PAID',
        status: InvoiceStatus.PAID,
        amount: invoice.paidAmount?.toNumber(),
      });
    }

    if (invoice.cancelledAt) {
      history.push({
        timestamp: invoice.cancelledAt,
        action: 'CANCELLED',
        status: InvoiceStatus.CANCELLED,
        reason: invoice.cancelReason || undefined,
      });
    }

    if (invoice.voidedAt) {
      history.push({
        timestamp: invoice.voidedAt,
        action: 'VOIDED',
        status: InvoiceStatus.VOID,
        reason: invoice.voidReason || undefined,
      });
    }

    return history.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async findByStatus(
    status: InvoiceStatus,
    limit: number = 100
  ): Promise<InvoiceEntity[]> {
    return await this.prisma.invoice.findMany({
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

  async findByDateRange(
    fromDate: Date,
    toDate: Date,
    limit?: number
  ): Promise<InvoiceEntity[]> {
    return await this.prisma.invoice.findMany({
      where: {
        invoiceDate: {
          gte: fromDate,
          lte: toDate,
        },
      },
      include: {
        order: true,
      },
      orderBy: {
        invoiceDate: 'desc',
      },
      take: limit,
    });
  }

  async getTotalRevenue(fromDate: Date, toDate: Date): Promise<number> {
    const result = await this.prisma.invoice.aggregate({
      where: {
        status: InvoiceStatus.PAID,
        paidAt: {
          gte: fromDate,
          lte: toDate,
        },
      },
      _sum: {
        paidAmount: true,
      },
    });

    return result._sum.paidAmount?.toNumber() || 0;
  }

  async getOutstandingAmount(): Promise<number> {
    const result = await this.prisma.invoice.aggregate({
      where: {
        status: {
          in: [InvoiceStatus.ISSUED, InvoiceStatus.OVERDUE],
        },
      },
      _sum: {
        totalAmount: true,
      },
    });

    return result._sum.totalAmount?.toNumber() || 0;
  }

  async markOverdueInvoices(): Promise<number> {
    const result = await this.prisma.invoice.updateMany({
      where: {
        status: InvoiceStatus.ISSUED,
        dueDate: {
          lt: new Date(),
        },
      },
      data: {
        status: InvoiceStatus.OVERDUE,
      },
    });

    return result.count;
  }

  async bulkUpdateStatus(
    invoiceIds: string[],
    status: InvoiceStatus
  ): Promise<number> {
    const result = await this.prisma.invoice.updateMany({
      where: {
        id: {
          in: invoiceIds,
        },
      },
      data: {
        status,
      },
    });

    return result.count;
  }

  async getInvoicesByPaymentId(paymentId: string): Promise<InvoiceEntity[]> {
    return await this.prisma.invoice.findMany({
      where: { paymentId },
      include: {
        order: true,
      },
    });
  }

  async getAveragePaymentDays(): Promise<number> {
    const paidInvoices = await this.prisma.invoice.findMany({
      where: {
        status: InvoiceStatus.PAID,
        paidAt: {
          not: null,
        },
      },
      select: {
        invoiceDate: true,
        paidAt: true,
      },
    });

    if (paidInvoices.length === 0) {
      return 0;
    }

    const totalDays = paidInvoices.reduce((sum, invoice) => {
      if (invoice.paidAt) {
        const days = Math.floor(
          (invoice.paidAt.getTime() - invoice.invoiceDate.getTime()) /
            (1000 * 60 * 60 * 24)
        );
        return sum + days;
      }
      return sum;
    }, 0);

    return totalDays / paidInvoices.length;
  }

  async findHighValueInvoices(
    threshold: number,
    limit: number = 50
  ): Promise<InvoiceEntity[]> {
    return await this.prisma.invoice.findMany({
      where: {
        totalAmount: {
          gte: new Prisma.Decimal(threshold),
        },
      },
      include: {
        order: true,
      },
      orderBy: {
        totalAmount: 'desc',
      },
      take: limit,
    });
  }

  async getUnpaidInvoicesCount(): Promise<number> {
    return await this.prisma.invoice.count({
      where: {
        status: {
          in: [InvoiceStatus.ISSUED, InvoiceStatus.OVERDUE],
        },
      },
    });
  }

  async getMonthlyRevenue(year: number, month: number): Promise<number> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const result = await this.prisma.invoice.aggregate({
      where: {
        status: InvoiceStatus.PAID,
        paidAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        paidAmount: true,
      },
    });

    return result._sum.paidAmount?.toNumber() || 0;
  }

  async searchInvoices(searchTerm: string, limit: number = 20): Promise<InvoiceEntity[]> {
    return await this.prisma.invoice.findMany({
      where: {
        OR: [
          {
            invoiceNumber: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
          {
            customerId: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
        ],
      },
      include: {
        order: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }

  private buildWhereClause(filters: InvoiceRepositoryFilters): Prisma.InvoiceWhereInput {
    const where: Prisma.InvoiceWhereInput = {};

    if (filters.status && filters.status.length > 0) {
      where.status = {
        in: filters.status,
      };
    }

    if (filters.customerId) {
      where.customerId = filters.customerId;
    }

    if (filters.orderId) {
      where.orderId = filters.orderId;
    }

    if (filters.invoiceNumber) {
      where.invoiceNumber = {
        contains: filters.invoiceNumber,
        mode: 'insensitive',
      };
    }

    if (filters.dateRange) {
      where.invoiceDate = {
        gte: filters.dateRange.from,
        lte: filters.dateRange.to,
      };
    }

    if (filters.dueRange) {
      where.dueDate = {
        gte: filters.dueRange.from,
        lte: filters.dueRange.to,
      };
    }

    if (filters.amountRange) {
      where.totalAmount = {
        gte: filters.amountRange.min
          ? new Prisma.Decimal(filters.amountRange.min)
          : undefined,
        lte: filters.amountRange.max
          ? new Prisma.Decimal(filters.amountRange.max)
          : undefined,
      };
    }

    if (filters.isPaid !== undefined) {
      where.status = filters.isPaid
        ? InvoiceStatus.PAID
        : {
            not: InvoiceStatus.PAID,
          };
    }

    if (filters.isOverdue !== undefined && filters.isOverdue) {
      where.status = InvoiceStatus.OVERDUE;
    }

    return where;
  }

  private calculateAveragePaymentTime(invoices: Invoice[]): number {
    const paidInvoices = invoices.filter(
      (i) => i.status === InvoiceStatus.PAID && i.paidAt
    );

    if (paidInvoices.length === 0) {
      return 0;
    }

    const totalDays = paidInvoices.reduce((sum, invoice) => {
      if (invoice.paidAt) {
        const days = Math.floor(
          (invoice.paidAt.getTime() - invoice.invoiceDate.getTime()) /
            (1000 * 60 * 60 * 24)
        );
        return sum + days;
      }
      return sum;
    }, 0);

    return totalDays / paidInvoices.length;
  }
}