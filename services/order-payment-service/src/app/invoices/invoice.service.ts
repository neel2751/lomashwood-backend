import { InvoiceRepository } from './invoice.repository';
import {
  CreateInvoiceDTO,
  UpdateInvoiceDTO,
  InvoiceQueryParams,
  InvoiceEntity,
  InvoiceStatistics,
  InvoicePreview,
  InvoiceTemplate,
  InvoiceValidationResult,
  InvoiceHistoryEntry,
  BulkGenerateResult,
} from './invoice.types';
import { InvoiceMapper } from './invoice.mapper';
import { INVOICE_CONSTANTS, INVOICE_ERROR_CODES } from './invoice.constants';
import {
  InvoiceNotFoundError,
  InvoiceValidationError,
  InvoiceGenerationError,
  InvoiceAlreadyExistsError,
} from './invoice.errors';
import { EventProducer } from '../../infrastructure/messaging/event-producer';
import { RedisClient } from '../../infrastructure/cache/redis.client';
import { Logger } from '../../config/logger';
import { InvoiceStatus, Prisma } from '@prisma/client';
import { PDFGenerator } from '../../infrastructure/pdf/pdf-generator';
import { EmailClient } from '../../infrastructure/notifications/email.client';

export class InvoiceService {
  constructor(
    private readonly invoiceRepository: InvoiceRepository,
    private readonly eventProducer: EventProducer,
    private readonly redisClient: RedisClient,
    private readonly pdfGenerator: PDFGenerator,
    private readonly emailClient: EmailClient,
    private readonly logger: Logger
  ) {}

  async createInvoice(
    dto: CreateInvoiceDTO,
    userId?: string
  ): Promise<InvoiceEntity> {
    try {
      this.logger.info('Creating invoice', { dto, userId });

      await this.validateInvoiceCreation(dto);

      const existingInvoice = await this.invoiceRepository.findByOrderId(
        dto.orderId
      );

      if (existingInvoice) {
        throw new InvoiceAlreadyExistsError(dto.orderId);
      }

      const invoiceNumber = await this.generateInvoiceNumber();

      const calculations = this.calculateInvoiceAmounts(dto);

      const invoice = await this.invoiceRepository.create({
        orderId: dto.orderId,
        customerId: dto.customerId,
        invoiceNumber,
        invoiceDate: dto.invoiceDate || new Date(),
        dueDate: dto.dueDate || this.calculateDueDate(),
        status: InvoiceStatus.DRAFT,
        subtotal: calculations.subtotal,
        taxAmount: calculations.taxAmount,
        discountAmount: calculations.discountAmount,
        shippingAmount: calculations.shippingAmount,
        totalAmount: calculations.totalAmount,
        currency: dto.currency || 'INR',
        items: dto.items,
        billingAddress: dto.billingAddress,
        shippingAddress: dto.shippingAddress,
        notes: dto.notes,
        terms: dto.terms,
        metadata: dto.metadata,
      });

      await this.eventProducer.publish('invoice.created', {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        orderId: invoice.orderId,
        customerId: invoice.customerId,
        totalAmount: invoice.totalAmount.toNumber(),
      });

      await this.invalidateInvoiceCache(invoice.id);

      this.logger.info('Invoice created successfully', {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
      });

      return invoice;
    } catch (error) {
      this.logger.error('Failed to create invoice', { error, dto });
      throw error;
    }
  }

  async generateInvoiceFromOrder(
    orderId: string,
    userId?: string
  ): Promise<InvoiceEntity> {
    try {
      this.logger.info('Generating invoice from order', { orderId, userId });

      const order = await this.fetchOrderDetails(orderId);

      if (!order) {
        throw new InvoiceGenerationError(`Order ${orderId} not found`);
      }

      const invoiceDTO: CreateInvoiceDTO = {
        orderId: order.id,
        customerId: order.customerId,
        invoiceDate: new Date(),
        dueDate: this.calculateDueDate(),
        items: order.items.map((item) => ({
          description: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toNumber(),
          taxRate: 18,
          discount: item.discount.toNumber(),
        })),
        billingAddress: JSON.parse(order.billingAddress),
        shippingAddress: JSON.parse(order.shippingAddress),
        currency: 'INR',
        notes: order.notes || undefined,
        terms: INVOICE_CONSTANTS.DEFAULT_TERMS,
      };

      const invoice = await this.createInvoice(invoiceDTO, userId);

      await this.updateInvoiceStatus(invoice.id, InvoiceStatus.ISSUED, userId);

      return invoice;
    } catch (error) {
      this.logger.error('Failed to generate invoice from order', {
        error,
        orderId,
      });
      throw error;
    }
  }

  async getInvoiceById(id: string): Promise<InvoiceEntity> {
    try {
      const cached = await this.redisClient.get(`invoice:${id}`);
      if (cached) {
        return JSON.parse(cached);
      }

      const invoice = await this.invoiceRepository.findById(id);

      if (!invoice) {
        throw new InvoiceNotFoundError(id);
      }

      await this.redisClient.set(
        `invoice:${id}`,
        JSON.stringify(invoice),
        INVOICE_CONSTANTS.CACHE_TTL.INVOICE_DETAILS
      );

      return invoice;
    } catch (error) {
      this.logger.error('Failed to get invoice by ID', { error, id });
      throw error;
    }
  }

  async getInvoiceByNumber(invoiceNumber: string): Promise<InvoiceEntity> {
    try {
      const invoice = await this.invoiceRepository.findByInvoiceNumber(
        invoiceNumber
      );

      if (!invoice) {
        throw new InvoiceNotFoundError(invoiceNumber);
      }

      return invoice;
    } catch (error) {
      this.logger.error('Failed to get invoice by number', {
        error,
        invoiceNumber,
      });
      throw error;
    }
  }

  async getInvoiceByOrderId(orderId: string): Promise<InvoiceEntity> {
    try {
      const invoice = await this.invoiceRepository.findByOrderId(orderId);

      if (!invoice) {
        throw new InvoiceNotFoundError(orderId);
      }

      return invoice;
    } catch (error) {
      this.logger.error('Failed to get invoice by order ID', {
        error,
        orderId,
      });
      throw error;
    }
  }

  async getInvoices(
    params: InvoiceQueryParams
  ): Promise<{ invoices: InvoiceEntity[]; total: number }> {
    try {
      const filters = InvoiceMapper.toRepositoryFilters(params);
      const invoices = await this.invoiceRepository.findAll(
        filters,
        params.page || 1,
        params.limit || INVOICE_CONSTANTS.DEFAULT_PAGE_SIZE,
        params.sortBy,
        params.sortOrder
      );

      const total = await this.invoiceRepository.count(filters);

      return { invoices, total };
    } catch (error) {
      this.logger.error('Failed to get invoices', { error, params });
      throw error;
    }
  }

  async updateInvoice(
    id: string,
    dto: UpdateInvoiceDTO,
    userId?: string
  ): Promise<InvoiceEntity> {
    try {
      this.logger.info('Updating invoice', { id, dto, userId });

      const invoice = await this.invoiceRepository.findById(id);

      if (!invoice) {
        throw new InvoiceNotFoundError(id);
      }

      if (invoice.status === InvoiceStatus.PAID) {
        throw new InvoiceValidationError('Cannot update paid invoice');
      }

      if (invoice.status === InvoiceStatus.CANCELLED) {
        throw new InvoiceValidationError('Cannot update cancelled invoice');
      }

      const updatedInvoice = await this.invoiceRepository.update(id, dto);

      await this.eventProducer.publish('invoice.updated', {
        invoiceId: updatedInvoice.id,
        invoiceNumber: updatedInvoice.invoiceNumber,
        changes: dto,
      });

      await this.invalidateInvoiceCache(id);

      this.logger.info('Invoice updated successfully', { invoiceId: id });

      return updatedInvoice;
    } catch (error) {
      this.logger.error('Failed to update invoice', { error, id, dto });
      throw error;
    }
  }

  async updateInvoiceStatus(
    id: string,
    status: InvoiceStatus,
    userId?: string
  ): Promise<InvoiceEntity> {
    try {
      const invoice = await this.invoiceRepository.findById(id);

      if (!invoice) {
        throw new InvoiceNotFoundError(id);
      }

      const validTransition = this.isValidStatusTransition(
        invoice.status,
        status
      );

      if (!validTransition) {
        throw new InvoiceValidationError(
          `Invalid status transition from ${invoice.status} to ${status}`
        );
      }

      const updatedInvoice = await this.invoiceRepository.update(id, {
        status,
      });

      await this.eventProducer.publish('invoice.status.changed', {
        invoiceId: updatedInvoice.id,
        invoiceNumber: updatedInvoice.invoiceNumber,
        fromStatus: invoice.status,
        toStatus: status,
      });

      await this.invalidateInvoiceCache(id);

      return updatedInvoice;
    } catch (error) {
      this.logger.error('Failed to update invoice status', {
        error,
        id,
        status,
      });
      throw error;
    }
  }

  async downloadInvoice(id: string, format: string): Promise<Buffer> {
    try {
      const invoice = await this.getInvoiceById(id);

      if (format === 'pdf') {
        return await this.generateInvoicePDF(invoice);
      } else if (format === 'html') {
        return Buffer.from(await this.generateInvoiceHTML(invoice));
      } else {
        throw new InvoiceValidationError(`Unsupported format: ${format}`);
      }
    } catch (error) {
      this.logger.error('Failed to download invoice', { error, id, format });
      throw error;
    }
  }

  async sendInvoice(
    id: string,
    email: string,
    userId?: string
  ): Promise<void> {
    try {
      this.logger.info('Sending invoice', { id, email, userId });

      const invoice = await this.getInvoiceById(id);

      const pdfBuffer = await this.generateInvoicePDF(invoice);

      await this.emailClient.send({
        to: email,
        subject: `Invoice ${invoice.invoiceNumber} - Lomash Wood`,
        template: 'invoice-email',
        context: {
          invoiceNumber: invoice.invoiceNumber,
          totalAmount: invoice.totalAmount.toNumber(),
          dueDate: invoice.dueDate,
        },
        attachments: [
          {
            filename: `invoice_${invoice.invoiceNumber}.pdf`,
            content: pdfBuffer,
          },
        ],
      });

      await this.invoiceRepository.update(id, {
        sentAt: new Date(),
      });

      await this.eventProducer.publish('invoice.sent', {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        email,
      });

      this.logger.info('Invoice sent successfully', { invoiceId: id, email });
    } catch (error) {
      this.logger.error('Failed to send invoice', { error, id, email });
      throw error;
    }
  }

  async markAsPaid(
    id: string,
    paymentId: string,
    paidAmount?: number,
    userId?: string
  ): Promise<InvoiceEntity> {
    try {
      const invoice = await this.getInvoiceById(id);

      if (invoice.status === InvoiceStatus.PAID) {
        throw new InvoiceValidationError('Invoice is already paid');
      }

      const amountPaid = paidAmount || invoice.totalAmount.toNumber();

      const updatedInvoice = await this.invoiceRepository.update(id, {
        status: InvoiceStatus.PAID,
        paidAmount,
        paidAt: new Date(),
        paymentId,
      });

      await this.eventProducer.publish('invoice.paid', {
        invoiceId: updatedInvoice.id,
        invoiceNumber: updatedInvoice.invoiceNumber,
        paymentId,
        amount: amountPaid,
      });

      await this.invalidateInvoiceCache(id);

      this.logger.info('Invoice marked as paid', { invoiceId: id, paymentId });

      return updatedInvoice;
    } catch (error) {
      this.logger.error('Failed to mark invoice as paid', {
        error,
        id,
        paymentId,
      });
      throw error;
    }
  }

  async cancelInvoice(
    id: string,
    reason?: string,
    userId?: string
  ): Promise<InvoiceEntity> {
    try {
      const invoice = await this.getInvoiceById(id);

      if (invoice.status === InvoiceStatus.PAID) {
        throw new InvoiceValidationError('Cannot cancel paid invoice');
      }

      if (invoice.status === InvoiceStatus.CANCELLED) {
        throw new InvoiceValidationError('Invoice is already cancelled');
      }

      const updatedInvoice = await this.invoiceRepository.update(id, {
        status: InvoiceStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelReason: reason,
      });

      await this.eventProducer.publish('invoice.cancelled', {
        invoiceId: updatedInvoice.id,
        invoiceNumber: updatedInvoice.invoiceNumber,
        reason,
      });

      await this.invalidateInvoiceCache(id);

      this.logger.info('Invoice cancelled', { invoiceId: id, reason });

      return updatedInvoice;
    } catch (error) {
      this.logger.error('Failed to cancel invoice', { error, id, reason });
      throw error;
    }
  }

  async voidInvoice(
    id: string,
    reason?: string,
    userId?: string
  ): Promise<InvoiceEntity> {
    try {
      const invoice = await this.getInvoiceById(id);

      if (invoice.status === InvoiceStatus.PAID) {
        throw new InvoiceValidationError('Cannot void paid invoice');
      }

      const updatedInvoice = await this.invoiceRepository.update(id, {
        status: InvoiceStatus.VOID,
        voidedAt: new Date(),
        voidReason: reason,
      });

      await this.eventProducer.publish('invoice.voided', {
        invoiceId: updatedInvoice.id,
        invoiceNumber: updatedInvoice.invoiceNumber,
        reason,
      });

      await this.invalidateInvoiceCache(id);

      return updatedInvoice;
    } catch (error) {
      this.logger.error('Failed to void invoice', { error, id, reason });
      throw error;
    }
  }

  async getInvoiceStatistics(
    fromDate: Date,
    toDate: Date
  ): Promise<InvoiceStatistics> {
    try {
      const stats = await this.invoiceRepository.getStatistics(
        fromDate,
        toDate
      );
      return stats;
    } catch (error) {
      this.logger.error('Failed to get invoice statistics', { error });
      throw error;
    }
  }

  async getOverdueInvoices(limit: number = 50): Promise<InvoiceEntity[]> {
    try {
      const invoices = await this.invoiceRepository.findOverdue(limit);
      return invoices;
    } catch (error) {
      this.logger.error('Failed to get overdue invoices', { error });
      throw error;
    }
  }

  async sendPaymentReminder(id: string, userId?: string): Promise<void> {
    try {
      const invoice = await this.getInvoiceById(id);

      if (invoice.status === InvoiceStatus.PAID) {
        throw new InvoiceValidationError('Cannot send reminder for paid invoice');
      }

      const customer = await this.fetchCustomerDetails(invoice.customerId);

      await this.emailClient.send({
        to: customer.email,
        subject: `Payment Reminder - Invoice ${invoice.invoiceNumber}`,
        template: 'payment-reminder',
        context: {
          invoiceNumber: invoice.invoiceNumber,
          totalAmount: invoice.totalAmount.toNumber(),
          dueDate: invoice.dueDate,
          customerName: customer.name,
        },
      });

      await this.eventProducer.publish('invoice.reminder.sent', {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        customerId: invoice.customerId,
      });

      this.logger.info('Payment reminder sent', { invoiceId: id });
    } catch (error) {
      this.logger.error('Failed to send payment reminder', { error, id });
      throw error;
    }
  }

  async exportInvoices(
    format: string,
    fromDate?: Date,
    toDate?: Date
  ): Promise<Buffer> {
    try {
      const invoices = await this.invoiceRepository.findAll(
        {
          dateRange:
            fromDate && toDate ? { from: fromDate, to: toDate } : undefined,
        },
        1,
        10000
      );

      return Buffer.from('export data');
    } catch (error) {
      this.logger.error('Failed to export invoices', { error });
      throw error;
    }
  }

  async regenerateInvoice(id: string, userId?: string): Promise<InvoiceEntity> {
    try {
      const invoice = await this.getInvoiceById(id);

      const newInvoiceNumber = await this.generateInvoiceNumber();

      const updatedInvoice = await this.invoiceRepository.update(id, {
        invoiceNumber: newInvoiceNumber,
      });

      await this.invalidateInvoiceCache(id);

      return updatedInvoice;
    } catch (error) {
      this.logger.error('Failed to regenerate invoice', { error, id });
      throw error;
    }
  }

  async getInvoiceHistory(id: string): Promise<InvoiceHistoryEntry[]> {
    try {
      const history = await this.invoiceRepository.getHistory(id);
      return history;
    } catch (error) {
      this.logger.error('Failed to get invoice history', { error, id });
      throw error;
    }
  }

  async bulkGenerateInvoices(
    orderIds: string[],
    userId?: string
  ): Promise<BulkGenerateResult> {
    try {
      const results: BulkGenerateResult = {
        successful: [],
        failed: [],
        total: orderIds.length,
      };

      for (const orderId of orderIds) {
        try {
          const invoice = await this.generateInvoiceFromOrder(orderId, userId);
          results.successful.push({
            orderId,
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
          });
        } catch (error) {
          results.failed.push({
            orderId,
            reason: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      return results;
    } catch (error) {
      this.logger.error('Failed to bulk generate invoices', { error, orderIds });
      throw error;
    }
  }

  async previewInvoice(dto: CreateInvoiceDTO): Promise<InvoicePreview> {
    try {
      const calculations = this.calculateInvoiceAmounts(dto);

      return {
        subtotal: calculations.subtotal,
        taxAmount: calculations.taxAmount,
        discountAmount: calculations.discountAmount,
        shippingAmount: calculations.shippingAmount,
        totalAmount: calculations.totalAmount,
        items: dto.items,
      };
    } catch (error) {
      this.logger.error('Failed to preview invoice', { error, dto });
      throw error;
    }
  }

  async getInvoiceTemplate(templateId: string): Promise<InvoiceTemplate> {
    try {
      return {
        id: templateId,
        name: 'Default Template',
        content: '<html>...</html>',
      };
    } catch (error) {
      this.logger.error('Failed to get invoice template', { error, templateId });
      throw error;
    }
  }

  async validateInvoiceData(
    dto: CreateInvoiceDTO
  ): Promise<InvoiceValidationResult> {
    try {
      const errors: string[] = [];
      const warnings: string[] = [];

      if (!dto.orderId) {
        errors.push('Order ID is required');
      }

      if (!dto.customerId) {
        errors.push('Customer ID is required');
      }

      if (!dto.items || dto.items.length === 0) {
        errors.push('At least one item is required');
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      this.logger.error('Failed to validate invoice data', { error, dto });
      throw error;
    }
  }

  async applyDiscount(
    id: string,
    discountAmount?: number,
    discountPercentage?: number,
    reason?: string,
    userId?: string
  ): Promise<InvoiceEntity> {
    try {
      const invoice = await this.getInvoiceById(id);

      let discount = 0;

      if (discountAmount) {
        discount = discountAmount;
      } else if (discountPercentage) {
        discount = (invoice.subtotal.toNumber() * discountPercentage) / 100;
      }

      const totalAmount =
        invoice.subtotal.toNumber() +
        invoice.taxAmount.toNumber() +
        invoice.shippingAmount.toNumber() -
        discount;

      const updatedInvoice = await this.invoiceRepository.update(id, {
        discountAmount: discount,
        totalAmount,
      });

      await this.invalidateInvoiceCache(id);

      return updatedInvoice;
    } catch (error) {
      this.logger.error('Failed to apply discount', { error, id });
      throw error;
    }
  }

  async addNote(
    id: string,
    note: string,
    userId?: string
  ): Promise<InvoiceEntity> {
    try {
      const invoice = await this.getInvoiceById(id);

      const updatedInvoice = await this.invoiceRepository.update(id, {
        notes: note,
      });

      await this.invalidateInvoiceCache(id);

      return updatedInvoice;
    } catch (error) {
      this.logger.error('Failed to add note', { error, id });
      throw error;
    }
  }

  async getInvoicesByCustomer(
    customerId: string,
    limit: number = 20
  ): Promise<InvoiceEntity[]> {
    try {
      const invoices = await this.invoiceRepository.findByCustomerId(
        customerId,
        limit
      );
      return invoices;
    } catch (error) {
      this.logger.error('Failed to get invoices by customer', {
        error,
        customerId,
      });
      throw error;
    }
  }

  private async validateInvoiceCreation(dto: CreateInvoiceDTO): Promise<void> {
    if (!dto.orderId) {
      throw new InvoiceValidationError('Order ID is required');
    }

    if (!dto.customerId) {
      throw new InvoiceValidationError('Customer ID is required');
    }

    if (!dto.items || dto.items.length === 0) {
      throw new InvoiceValidationError('At least one item is required');
    }
  }

  private calculateInvoiceAmounts(dto: CreateInvoiceDTO): {
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    shippingAmount: number;
    totalAmount: number;
  } {
    const subtotal = dto.items.reduce((sum, item) => {
      return sum + item.quantity * item.unitPrice - (item.discount || 0);
    }, 0);

    const taxAmount = dto.items.reduce((sum, item) => {
      const itemSubtotal =
        item.quantity * item.unitPrice - (item.discount || 0);
      return sum + (itemSubtotal * (item.taxRate || 0)) / 100;
    }, 0);

    const discountAmount = 0;
    const shippingAmount = 0;
    const totalAmount = subtotal + taxAmount + shippingAmount - discountAmount;

    return {
      subtotal,
      taxAmount,
      discountAmount,
      shippingAmount,
      totalAmount,
    };
  }

  private async generateInvoiceNumber(): Promise<string> {
    const prefix = INVOICE_CONSTANTS.INVOICE_NUMBER_PREFIX;
    const year = new Date().getFullYear();
    const count = await this.invoiceRepository.count({});
    const sequence = (count + 1).toString().padStart(6, '0');
    return `${prefix}${year}${sequence}`;
  }

  private calculateDueDate(): Date {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + INVOICE_CONSTANTS.DEFAULT_DUE_DAYS);
    return dueDate;
  }

  private isValidStatusTransition(
    fromStatus: InvoiceStatus,
    toStatus: InvoiceStatus
  ): boolean {
    const validTransitions: Record<InvoiceStatus, InvoiceStatus[]> = {
      [InvoiceStatus.DRAFT]: [
        InvoiceStatus.ISSUED,
        InvoiceStatus.CANCELLED,
        InvoiceStatus.VOID,
      ],
      [InvoiceStatus.ISSUED]: [
        InvoiceStatus.PAID,
        InvoiceStatus.OVERDUE,
        InvoiceStatus.CANCELLED,
        InvoiceStatus.VOID,
      ],
      [InvoiceStatus.OVERDUE]: [
        InvoiceStatus.PAID,
        InvoiceStatus.CANCELLED,
        InvoiceStatus.VOID,
      ],
      [InvoiceStatus.PAID]: [],
      [InvoiceStatus.CANCELLED]: [],
      [InvoiceStatus.VOID]: [],
      [InvoiceStatus.PARTIALLY_PAID]: [InvoiceStatus.PAID],
    };

    return validTransitions[fromStatus]?.includes(toStatus) || false;
  }

  private async generateInvoicePDF(invoice: InvoiceEntity): Promise<Buffer> {
    const html = await this.generateInvoiceHTML(invoice);
    return await this.pdfGenerator.generateFromHTML(html);
  }

  private async generateInvoiceHTML(invoice: InvoiceEntity): Promise<string> {
    return `<html><body>Invoice ${invoice.invoiceNumber}</body></html>`;
  }

  private async fetchOrderDetails(orderId: string): Promise<any> {
    return {};
  }

  private async fetchCustomerDetails(customerId: string): Promise<any> {
    return { email: '', name: '' };
  }

  private async invalidateInvoiceCache(invoiceId: string): Promise<void> {
    await this.redisClient.del(`invoice:${invoiceId}`);
  }
}