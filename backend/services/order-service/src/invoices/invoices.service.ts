import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from './entities/invoice.entity';
import { GenerateInvoiceDto } from './dto/generate-invoice.dto';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private invoicesRepository: Repository<Invoice>,
  ) {}

  async findAll(params: {
    page: number;
    limit: number;
    status?: string;
    orderId?: string;
  }): Promise<{ invoices: Invoice[]; total: number; page: number; limit: number }> {
    const { page, limit, status, orderId } = params;
    const skip = (page - 1) * limit;

    const query = this.invoicesRepository.createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.order', 'order')
      .leftJoinAndSelect('order.user', 'user');

    if (status) {
      query.andWhere('invoice.status = :status', { status });
    }

    if (orderId) {
      query.andWhere('invoice.orderId = :orderId', { orderId });
    }

    const [invoices, total] = await query
      .orderBy('invoice.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      invoices,
      total,
      page,
      limit,
    };
  }

  async findById(id: string): Promise<Invoice | null> {
    return this.invoicesRepository.findOne({
      where: { id },
      relations: ['order', 'order.user', 'order.items'],
    });
  }

  async findByOrder(orderId: string): Promise<Invoice[]> {
    return this.invoicesRepository.find({
      where: { orderId },
      relations: ['order'],
      order: { createdAt: 'DESC' },
    });
  }

  async generate(generateInvoiceDto: GenerateInvoiceDto): Promise<Invoice> {
    const { orderId, dueDate, notes } = generateInvoiceDto;

    // Calculate invoice totals
    const invoice = this.invoicesRepository.create({
      orderId,
      invoiceNumber: this.generateInvoiceNumber(),
      status: 'DRAFT',
      dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      notes,
    });

    return this.invoicesRepository.save(invoice);
  }

  async updateStatus(id: string, status: string, notes?: string): Promise<Invoice | null> {
    await this.invoicesRepository.update(id, {
      status,
      notes,
      updatedAt: new Date(),
    });

    return this.findById(id);
  }

  async markAsPaid(
    id: string,
    paymentData?: {
      paymentDate?: Date;
      paymentMethod?: string;
      notes?: string;
    }
  ): Promise<Invoice | null> {
    await this.invoicesRepository.update(id, {
      status: 'PAID',
      paidAt: paymentData?.paymentDate || new Date(),
      paymentMethod: paymentData?.paymentMethod,
      notes: paymentData?.notes,
      updatedAt: new Date(),
    });

    return this.findById(id);
  }

  async sendInvoice(
    id: string,
    email?: string,
    subject?: string,
    message?: string
  ): Promise<{ success: boolean; message: string }> {
    const invoice = await this.findById(id);
    if (!invoice) {
      return {
        success: false,
        message: 'Invoice not found',
      };
    }

    try {
      // Here you would integrate with an email service
      // For now, just return success
      return {
        success: true,
        message: 'Invoice sent successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to send invoice',
      };
    }
  }

  async generatePdf(id: string): Promise<Buffer | null> {
    const invoice = await this.findById(id);
    if (!invoice) {
      return null;
    }

    // Here you would integrate with a PDF generation library
    // For now, return a mock PDF buffer
    const pdfContent = `Invoice: ${invoice.invoiceNumber}\nOrder: ${invoice.orderId}\nTotal: ${invoice.totalAmount}`;
    return Buffer.from(pdfContent);
  }

  async getStats(
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalInvoices: number;
    totalAmount: number;
    paidAmount: number;
    unpaidAmount: number;
    overdueAmount: number;
    statusBreakdown: Record<string, number>;
  }> {
    const query = this.invoicesRepository.createQueryBuilder('invoice');

    if (startDate) {
      query.andWhere('invoice.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('invoice.createdAt <= :endDate', { endDate });
    }

    const invoices = await query.getMany();

    const totalInvoices = invoices.length;
    const totalAmount = invoices.reduce((sum, invoice) => sum + (invoice.totalAmount || 0), 0);
    const paidAmount = invoices
      .filter(inv => inv.status === 'PAID')
      .reduce((sum, invoice) => sum + (invoice.totalAmount || 0), 0);
    const unpaidAmount = invoices
      .filter(inv => inv.status === 'SENT' || inv.status === 'DRAFT')
      .reduce((sum, invoice) => sum + (invoice.totalAmount || 0), 0);

    const now = new Date();
    const overdueAmount = invoices
      .filter(inv => inv.status === 'SENT' && inv.dueDate && inv.dueDate < now)
      .reduce((sum, invoice) => sum + (invoice.totalAmount || 0), 0);

    const statusBreakdown = invoices.reduce((acc, invoice) => {
      acc[invoice.status] = (acc[invoice.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalInvoices,
      totalAmount,
      paidAmount,
      unpaidAmount,
      overdueAmount,
      statusBreakdown,
    };
  }

  private generateInvoiceNumber(): string {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `INV-${timestamp}-${random}`;
  }

  async calculateTotals(orderId: string): Promise<{
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
  }> {
    // This would calculate totals based on order items
    // For now, return mock data
    return {
      subtotal: 0,
      taxAmount: 0,
      totalAmount: 0,
    };
  }
}
