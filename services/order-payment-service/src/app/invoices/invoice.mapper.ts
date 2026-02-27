import { Invoice, InvoiceStatus, Prisma } from '@prisma/client';
import {
  InvoiceEntity,
  InvoiceResponseDTO,
  InvoiceListResponseDTO,
  InvoiceSummary,
  CreateInvoiceDTO,
  UpdateInvoiceDTO,
  InvoiceQueryParams,
  InvoiceRepositoryFilters,
  InvoiceStatistics,
  InvoiceHistoryEntry,
  InvoiceItem,
  InvoiceAddress,
  InvoiceCalculation,
  TaxBreakdown,
  InvoiceAgingReport,
  InvoiceRevenueReport,
} from './invoice.types';

export class InvoiceMapper {
  static toResponseDTO(invoice: InvoiceEntity): InvoiceResponseDTO {
    return {
      id: invoice.id,
      orderId: invoice.orderId,
      customerId: invoice.customerId,
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      status: invoice.status,
      subtotal: invoice.subtotal.toNumber(),
      taxAmount: invoice.taxAmount.toNumber(),
      discountAmount: invoice.discountAmount.toNumber(),
      shippingAmount: invoice.shippingAmount.toNumber(),
      totalAmount: invoice.totalAmount.toNumber(),
      paidAmount: invoice.paidAmount?.toNumber() || undefined,
      currency: invoice.currency,
      items: invoice.items ? JSON.parse(invoice.items as string) : [],
      billingAddress: JSON.parse(invoice.billingAddress as string),
      shippingAddress: invoice.shippingAddress
        ? JSON.parse(invoice.shippingAddress as string)
        : undefined,
      paymentId: invoice.paymentId || undefined,
      paidAt: invoice.paidAt || undefined,
      sentAt: invoice.sentAt || undefined,
      cancelledAt: invoice.cancelledAt || undefined,
      cancelReason: invoice.cancelReason || undefined,
      voidedAt: invoice.voidedAt || undefined,
      voidReason: invoice.voidReason || undefined,
      notes: invoice.notes || undefined,
      terms: invoice.terms || undefined,
      metadata: invoice.metadata ? JSON.parse(invoice.metadata) : undefined,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    };
  }

  static toListResponseDTO(
    invoices: InvoiceEntity[],
    total: number,
    page: number,
    limit: number
  ): InvoiceListResponseDTO {
    return {
      invoices: invoices.map((invoice) => this.toResponseDTO(invoice)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static toSummaryDTO(invoice: InvoiceEntity): InvoiceSummary {
    const isOverdue =
      invoice.status === InvoiceStatus.ISSUED &&
      invoice.dueDate < new Date();

    return {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      totalAmount: invoice.totalAmount.toNumber(),
      dueDate: invoice.dueDate,
      isOverdue,
    };
  }

  static toPrismaCreateInput(
    dto: CreateInvoiceDTO,
    invoiceNumber: string,
    calculation: InvoiceCalculation
  ): Prisma.InvoiceCreateInput {
    return {
      order: {
        connect: { id: dto.orderId },
      },
      customerId: dto.customerId,
      invoiceNumber,
      invoiceDate: dto.invoiceDate || new Date(),
      dueDate: dto.dueDate || new Date(),
      status: InvoiceStatus.DRAFT,
      subtotal: new Prisma.Decimal(calculation.subtotal),
      taxAmount: new Prisma.Decimal(calculation.taxAmount),
      discountAmount: new Prisma.Decimal(calculation.discountAmount),
      shippingAmount: new Prisma.Decimal(calculation.shippingAmount),
      totalAmount: new Prisma.Decimal(calculation.totalAmount),
      currency: dto.currency || 'INR',
      items: JSON.stringify(dto.items),
      billingAddress: JSON.stringify(dto.billingAddress),
      shippingAddress: dto.shippingAddress
        ? JSON.stringify(dto.shippingAddress)
        : null,
      notes: dto.notes,
      terms: dto.terms,
      metadata: dto.metadata ? JSON.stringify(dto.metadata) : null,
    };
  }

  static toPrismaUpdateInput(dto: UpdateInvoiceDTO): Prisma.InvoiceUpdateInput {
    const updateData: Prisma.InvoiceUpdateInput = {};

    if (dto.dueDate !== undefined) {
      updateData.dueDate = dto.dueDate;
    }

    if (dto.status !== undefined) {
      updateData.status = dto.status;
    }

    if (dto.notes !== undefined) {
      updateData.notes = dto.notes;
    }

    if (dto.terms !== undefined) {
      updateData.terms = dto.terms;
    }

    return updateData;
  }

  static toRepositoryFilters(params: InvoiceQueryParams): InvoiceRepositoryFilters {
    const filters: InvoiceRepositoryFilters = {};

    if (params.status) {
      filters.status = Array.isArray(params.status)
        ? params.status
        : [params.status];
    }

    if (params.customerId) {
      filters.customerId = params.customerId;
    }

    if (params.orderId) {
      filters.orderId = params.orderId;
    }

    if (params.invoiceNumber) {
      filters.invoiceNumber = params.invoiceNumber;
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

    if (params.isPaid !== undefined) {
      filters.isPaid = params.isPaid;
    }

    if (params.isOverdue !== undefined) {
      filters.isOverdue = params.isOverdue;
    }

    return filters;
  }

  static toHistoryEntry(
    timestamp: Date,
    action: string,
    status: InvoiceStatus,
    metadata?: any
  ): InvoiceHistoryEntry {
    return {
      timestamp,
      action,
      status,
      amount: metadata?.amount,
      reason: metadata?.reason,
      performedBy: metadata?.performedBy,
    };
  }

  static toStatisticsDTO(data: {
    totalInvoices: number;
    draftInvoices: number;
    issuedInvoices: number;
    paidInvoices: number;
    overdueInvoices: number;
    cancelledInvoices: number;
    voidInvoices: number;
    totalAmount: number;
    paidAmount: number;
    outstandingAmount: number;
    averageInvoiceValue: number;
    averagePaymentTime: number;
    from: Date;
    to: Date;
  }): InvoiceStatistics {
    return {
      totalInvoices: data.totalInvoices,
      draftInvoices: data.draftInvoices,
      issuedInvoices: data.issuedInvoices,
      paidInvoices: data.paidInvoices,
      overdueInvoices: data.overdueInvoices,
      cancelledInvoices: data.cancelledInvoices,
      voidInvoices: data.voidInvoices,
      totalAmount: data.totalAmount,
      paidAmount: data.paidAmount,
      outstandingAmount: data.outstandingAmount,
      averageInvoiceValue: data.averageInvoiceValue,
      averagePaymentTime: data.averagePaymentTime,
      period: {
        from: data.from,
        to: data.to,
      },
    };
  }

  static parseItems(itemsJson: string): InvoiceItem[] {
    try {
      return JSON.parse(itemsJson);
    } catch {
      return [];
    }
  }

  static parseBillingAddress(addressJson: string): InvoiceAddress {
    return JSON.parse(addressJson);
  }

  static parseShippingAddress(addressJson: string | null): InvoiceAddress | undefined {
    if (!addressJson) return undefined;
    return JSON.parse(addressJson);
  }

  static parseMetadata(metadataJson: string | null): Record<string, any> | undefined {
    if (!metadataJson) return undefined;
    try {
      return JSON.parse(metadataJson);
    } catch {
      return undefined;
    }
  }

  static calculateItemTotal(item: InvoiceItem): number {
    const subtotal = item.quantity * item.unitPrice - (item.discount || 0);
    const taxAmount = (subtotal * item.taxRate) / 100;
    return subtotal + taxAmount;
  }

  static calculateInvoiceTotals(items: InvoiceItem[]): {
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
  } {
    const subtotal = items.reduce((sum, item) => {
      return sum + item.quantity * item.unitPrice - (item.discount || 0);
    }, 0);

    const taxAmount = items.reduce((sum, item) => {
      const itemSubtotal =
        item.quantity * item.unitPrice - (item.discount || 0);
      return sum + (itemSubtotal * item.taxRate) / 100;
    }, 0);

    const totalAmount = subtotal + taxAmount;

    return {
      subtotal,
      taxAmount,
      totalAmount,
    };
  }

  static calculateTaxBreakdown(items: InvoiceItem[]): TaxBreakdown {
    const totalTax = items.reduce((sum, item) => {
      const itemSubtotal =
        item.quantity * item.unitPrice - (item.discount || 0);
      return sum + (itemSubtotal * item.taxRate) / 100;
    }, 0);

    return {
      cgst: totalTax / 2,
      sgst: totalTax / 2,
      igst: 0,
      cess: 0,
      total: totalTax,
    };
  }

  static isInvoiceOverdue(invoice: InvoiceEntity): boolean {
    return (
      invoice.status === InvoiceStatus.ISSUED &&
      invoice.dueDate < new Date()
    );
  }

  static isInvoiceEditable(invoice: InvoiceEntity): boolean {
    return [InvoiceStatus.DRAFT, InvoiceStatus.ISSUED].includes(
      invoice.status
    );
  }

  static isInvoiceCancellable(invoice: InvoiceEntity): boolean {
    return ![
      InvoiceStatus.PAID,
      InvoiceStatus.CANCELLED,
      InvoiceStatus.VOID,
    ].includes(invoice.status);
  }

  static canMarkAsPaid(invoice: InvoiceEntity): boolean {
    return [InvoiceStatus.ISSUED, InvoiceStatus.OVERDUE].includes(
      invoice.status
    );
  }

  static getDaysUntilDue(invoice: InvoiceEntity): number {
    const now = new Date();
    const dueDate = invoice.dueDate;
    const diffTime = dueDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  static getDaysOverdue(invoice: InvoiceEntity): number {
    if (!this.isInvoiceOverdue(invoice)) return 0;

    const now = new Date();
    const dueDate = invoice.dueDate;
    const diffTime = now.getTime() - dueDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  static getOutstandingAmount(invoice: InvoiceEntity): number {
    const total = invoice.totalAmount.toNumber();
    const paid = invoice.paidAmount?.toNumber() || 0;
    return total - paid;
  }

  static getPaymentStatus(invoice: InvoiceEntity): string {
    if (invoice.status === InvoiceStatus.PAID) return 'PAID';
    if (invoice.paidAmount && invoice.paidAmount.toNumber() > 0) {
      return 'PARTIALLY_PAID';
    }
    if (this.isInvoiceOverdue(invoice)) return 'OVERDUE';
    if (invoice.status === InvoiceStatus.ISSUED) return 'PENDING';
    return 'UNPAID';
  }

  static groupByStatus(invoices: InvoiceEntity[]): Map<InvoiceStatus, InvoiceEntity[]> {
    const grouped = new Map<InvoiceStatus, InvoiceEntity[]>();

    invoices.forEach((invoice) => {
      const existing = grouped.get(invoice.status) || [];
      grouped.set(invoice.status, [...existing, invoice]);
    });

    return grouped;
  }

  static groupByCustomer(invoices: InvoiceEntity[]): Map<string, InvoiceEntity[]> {
    const grouped = new Map<string, InvoiceEntity[]>();

    invoices.forEach((invoice) => {
      const existing = grouped.get(invoice.customerId) || [];
      grouped.set(invoice.customerId, [...existing, invoice]);
    });

    return grouped;
  }

  static sortByDueDate(
    invoices: InvoiceEntity[],
    direction: 'asc' | 'desc' = 'asc'
  ): InvoiceEntity[] {
    return [...invoices].sort((a, b) => {
      const dateA = a.dueDate.getTime();
      const dateB = b.dueDate.getTime();
      return direction === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }

  static sortByAmount(
    invoices: InvoiceEntity[],
    direction: 'asc' | 'desc' = 'desc'
  ): InvoiceEntity[] {
    return [...invoices].sort((a, b) => {
      const amountA = a.totalAmount.toNumber();
      const amountB = b.totalAmount.toNumber();
      return direction === 'asc' ? amountA - amountB : amountB - amountA;
    });
  }

  static filterByDateRange(
    invoices: InvoiceEntity[],
    from: Date,
    to: Date
  ): InvoiceEntity[] {
    return invoices.filter(
      (invoice) =>
        invoice.invoiceDate >= from && invoice.invoiceDate <= to
    );
  }

  static filterOverdue(invoices: InvoiceEntity[]): InvoiceEntity[] {
    return invoices.filter((invoice) => this.isInvoiceOverdue(invoice));
  }

  static filterPaid(invoices: InvoiceEntity[]): InvoiceEntity[] {
    return invoices.filter(
      (invoice) => invoice.status === InvoiceStatus.PAID
    );
  }

  static filterUnpaid(invoices: InvoiceEntity[]): InvoiceEntity[] {
    return invoices.filter(
      (invoice) =>
        invoice.status === InvoiceStatus.ISSUED ||
        invoice.status === InvoiceStatus.OVERDUE
    );
  }

  static calculateTotalAmount(invoices: InvoiceEntity[]): number {
    return invoices.reduce(
      (sum, invoice) => sum + invoice.totalAmount.toNumber(),
      0
    );
  }

  static calculateTotalPaid(invoices: InvoiceEntity[]): number {
    return invoices.reduce(
      (sum, invoice) => sum + (invoice.paidAmount?.toNumber() || 0),
      0
    );
  }

  static calculateTotalOutstanding(invoices: InvoiceEntity[]): number {
    return this.filterUnpaid(invoices).reduce(
      (sum, invoice) => sum + invoice.totalAmount.toNumber(),
      0
    );
  }

  static getAverageInvoiceValue(invoices: InvoiceEntity[]): number {
    if (invoices.length === 0) return 0;
    return this.calculateTotalAmount(invoices) / invoices.length;
  }

  static toAgingReport(invoices: InvoiceEntity[]): InvoiceAgingReport {
    const unpaidInvoices = this.filterUnpaid(invoices);
    const now = new Date();

    const current = unpaidInvoices
      .filter((inv) => inv.dueDate >= now)
      .reduce((sum, inv) => sum + inv.totalAmount.toNumber(), 0);

    const days1to30 = unpaidInvoices
      .filter((inv) => {
        const daysOverdue = this.getDaysOverdue(inv);
        return daysOverdue >= 1 && daysOverdue <= 30;
      })
      .reduce((sum, inv) => sum + inv.totalAmount.toNumber(), 0);

    const days31to60 = unpaidInvoices
      .filter((inv) => {
        const daysOverdue = this.getDaysOverdue(inv);
        return daysOverdue >= 31 && daysOverdue <= 60;
      })
      .reduce((sum, inv) => sum + inv.totalAmount.toNumber(), 0);

    const days61to90 = unpaidInvoices
      .filter((inv) => {
        const daysOverdue = this.getDaysOverdue(inv);
        return daysOverdue >= 61 && daysOverdue <= 90;
      })
      .reduce((sum, inv) => sum + inv.totalAmount.toNumber(), 0);

    const days91Plus = unpaidInvoices
      .filter((inv) => this.getDaysOverdue(inv) > 90)
      .reduce((sum, inv) => sum + inv.totalAmount.toNumber(), 0);

    return {
      current,
      days1to30,
      days31to60,
      days61to90,
      days91Plus,
      totalOutstanding: current + days1to30 + days31to60 + days61to90 + days91Plus,
    };
  }

  static toRevenueReport(
    invoices: InvoiceEntity[],
    period: string
  ): InvoiceRevenueReport {
    const totalInvoiced = this.calculateTotalAmount(invoices);
    const totalPaid = this.calculateTotalPaid(invoices);
    const totalOutstanding = this.calculateTotalOutstanding(invoices);
    const invoiceCount = invoices.length;
    const averageInvoiceValue = this.getAverageInvoiceValue(invoices);

    return {
      period,
      totalInvoiced,
      totalPaid,
      totalOutstanding,
      invoiceCount,
      averageInvoiceValue,
    };
  }

  static generateInvoiceNumber(prefix: string, sequence: number): string {
    return `${prefix}${sequence.toString().padStart(6, '0')}`;
  }

  static formatCurrency(amount: number, currency: string = 'INR'): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
    }).format(amount);
  }

  static formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  }

  static toMinimalDTO(invoice: Invoice): {
    id: string;
    invoiceNumber: string;
    status: InvoiceStatus;
    totalAmount: number;
  } {
    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      totalAmount: invoice.totalAmount.toNumber(),
    };
  }
}