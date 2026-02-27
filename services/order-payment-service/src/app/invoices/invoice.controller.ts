import { Request, Response, NextFunction } from 'express';
import { InvoiceService } from './invoice.service';
import {
  CreateInvoiceDTO,
  UpdateInvoiceDTO,
  InvoiceQueryParams,
  GenerateInvoiceDTO,
  SendInvoiceDTO,
} from './invoice.types';
import { InvoiceMapper } from './invoice.mapper';
import { INVOICE_CONSTANTS } from './invoice.constants';

export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  async createInvoice(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const dto: CreateInvoiceDTO = req.body;
      const userId = req.user?.id;

      const invoice = await this.invoiceService.createInvoice(dto, userId);
      const response = InvoiceMapper.toResponseDTO(invoice);

      res.status(201).json({
        success: true,
        message: 'Invoice created successfully',
        data: response,
      });
    } catch (error) {
      next(error);
    }
  }

  async generateInvoice(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const dto: GenerateInvoiceDTO = req.body;
      const userId = req.user?.id;

      const invoice = await this.invoiceService.generateInvoiceFromOrder(
        dto.orderId,
        userId
      );
      const response = InvoiceMapper.toResponseDTO(invoice);

      res.status(201).json({
        success: true,
        message: 'Invoice generated successfully',
        data: response,
      });
    } catch (error) {
      next(error);
    }
  }

  async getInvoiceById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;

      const invoice = await this.invoiceService.getInvoiceById(id);
      const response = InvoiceMapper.toResponseDTO(invoice);

      res.status(200).json({
        success: true,
        data: response,
      });
    } catch (error) {
      next(error);
    }
  }

  async getInvoiceByNumber(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { invoiceNumber } = req.params;

      const invoice = await this.invoiceService.getInvoiceByNumber(invoiceNumber);
      const response = InvoiceMapper.toResponseDTO(invoice);

      res.status(200).json({
        success: true,
        data: response,
      });
    } catch (error) {
      next(error);
    }
  }

  async getInvoiceByOrderId(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { orderId } = req.params;

      const invoice = await this.invoiceService.getInvoiceByOrderId(orderId);
      const response = InvoiceMapper.toResponseDTO(invoice);

      res.status(200).json({
        success: true,
        data: response,
      });
    } catch (error) {
      next(error);
    }
  }

  async getInvoices(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const queryParams: InvoiceQueryParams = {
        page: parseInt(req.query.page as string) || 1,
        limit:
          parseInt(req.query.limit as string) ||
          INVOICE_CONSTANTS.DEFAULT_PAGE_SIZE,
        status: req.query.status as any,
        customerId: req.query.customerId as string,
        orderId: req.query.orderId as string,
        fromDate: req.query.fromDate
          ? new Date(req.query.fromDate as string)
          : undefined,
        toDate: req.query.toDate
          ? new Date(req.query.toDate as string)
          : undefined,
        minAmount: req.query.minAmount
          ? parseFloat(req.query.minAmount as string)
          : undefined,
        maxAmount: req.query.maxAmount
          ? parseFloat(req.query.maxAmount as string)
          : undefined,
        sortBy: req.query.sortBy as any,
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      };

      const result = await this.invoiceService.getInvoices(queryParams);
      const response = InvoiceMapper.toListResponseDTO(
        result.invoices,
        result.total,
        queryParams.page!,
        queryParams.limit!
      );

      res.status(200).json({
        success: true,
        data: response,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateInvoice(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const dto: UpdateInvoiceDTO = req.body;
      const userId = req.user?.id;

      const invoice = await this.invoiceService.updateInvoice(id, dto, userId);
      const response = InvoiceMapper.toResponseDTO(invoice);

      res.status(200).json({
        success: true,
        message: 'Invoice updated successfully',
        data: response,
      });
    } catch (error) {
      next(error);
    }
  }

  async downloadInvoice(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const format = (req.query.format as string) || 'pdf';

      const buffer = await this.invoiceService.downloadInvoice(id, format);
      const invoice = await this.invoiceService.getInvoiceById(id);

      const filename = `invoice_${invoice.invoiceNumber}.${format}`;

      res.setHeader('Content-Type', `application/${format}`);
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  async sendInvoice(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const dto: SendInvoiceDTO = req.body;
      const userId = req.user?.id;

      await this.invoiceService.sendInvoice(id, dto.email, userId);

      res.status(200).json({
        success: true,
        message: 'Invoice sent successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async markAsPaid(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { paymentId, paidAmount } = req.body;
      const userId = req.user?.id;

      const invoice = await this.invoiceService.markAsPaid(
        id,
        paymentId,
        paidAmount,
        userId
      );
      const response = InvoiceMapper.toResponseDTO(invoice);

      res.status(200).json({
        success: true,
        message: 'Invoice marked as paid',
        data: response,
      });
    } catch (error) {
      next(error);
    }
  }

  async cancelInvoice(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const userId = req.user?.id;

      const invoice = await this.invoiceService.cancelInvoice(
        id,
        reason,
        userId
      );
      const response = InvoiceMapper.toResponseDTO(invoice);

      res.status(200).json({
        success: true,
        message: 'Invoice cancelled successfully',
        data: response,
      });
    } catch (error) {
      next(error);
    }
  }

  async voidInvoice(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const userId = req.user?.id;

      const invoice = await this.invoiceService.voidInvoice(id, reason, userId);
      const response = InvoiceMapper.toResponseDTO(invoice);

      res.status(200).json({
        success: true,
        message: 'Invoice voided successfully',
        data: response,
      });
    } catch (error) {
      next(error);
    }
  }

  async getInvoiceStatistics(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const fromDate = req.query.fromDate
        ? new Date(req.query.fromDate as string)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const toDate = req.query.toDate
        ? new Date(req.query.toDate as string)
        : new Date();

      const statistics = await this.invoiceService.getInvoiceStatistics(
        fromDate,
        toDate
      );

      res.status(200).json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      next(error);
    }
  }

  async getOverdueInvoices(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;

      const invoices = await this.invoiceService.getOverdueInvoices(limit);
      const response = invoices.map((invoice) =>
        InvoiceMapper.toResponseDTO(invoice)
      );

      res.status(200).json({
        success: true,
        data: response,
      });
    } catch (error) {
      next(error);
    }
  }

  async sendPaymentReminder(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      await this.invoiceService.sendPaymentReminder(id, userId);

      res.status(200).json({
        success: true,
        message: 'Payment reminder sent successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async exportInvoices(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const format = (req.query.format as string) || 'csv';
      const fromDate = req.query.fromDate
        ? new Date(req.query.fromDate as string)
        : undefined;
      const toDate = req.query.toDate
        ? new Date(req.query.toDate as string)
        : undefined;

      const fileBuffer = await this.invoiceService.exportInvoices(
        format,
        fromDate,
        toDate
      );

      const filename = `invoices_${Date.now()}.${format}`;

      res.setHeader('Content-Type', `application/${format}`);
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.send(fileBuffer);
    } catch (error) {
      next(error);
    }
  }

  async regenerateInvoice(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const invoice = await this.invoiceService.regenerateInvoice(id, userId);
      const response = InvoiceMapper.toResponseDTO(invoice);

      res.status(200).json({
        success: true,
        message: 'Invoice regenerated successfully',
        data: response,
      });
    } catch (error) {
      next(error);
    }
  }

  async getInvoiceHistory(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;

      const history = await this.invoiceService.getInvoiceHistory(id);

      res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }

  async bulkGenerateInvoices(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { orderIds } = req.body;
      const userId = req.user?.id;

      const result = await this.invoiceService.bulkGenerateInvoices(
        orderIds,
        userId
      );

      res.status(201).json({
        success: true,
        message: 'Invoices generated successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async previewInvoice(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const dto: CreateInvoiceDTO = req.body;

      const preview = await this.invoiceService.previewInvoice(dto);

      res.status(200).json({
        success: true,
        data: preview,
      });
    } catch (error) {
      next(error);
    }
  }

  async getInvoiceTemplate(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { templateId } = req.params;

      const template = await this.invoiceService.getInvoiceTemplate(templateId);

      res.status(200).json({
        success: true,
        data: template,
      });
    } catch (error) {
      next(error);
    }
  }

  async validateInvoiceData(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const dto: CreateInvoiceDTO = req.body;

      const validation = await this.invoiceService.validateInvoiceData(dto);

      res.status(200).json({
        success: true,
        data: validation,
      });
    } catch (error) {
      next(error);
    }
  }

  async applyDiscount(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { discountAmount, discountPercentage, reason } = req.body;
      const userId = req.user?.id;

      const invoice = await this.invoiceService.applyDiscount(
        id,
        discountAmount,
        discountPercentage,
        reason,
        userId
      );
      const response = InvoiceMapper.toResponseDTO(invoice);

      res.status(200).json({
        success: true,
        message: 'Discount applied successfully',
        data: response,
      });
    } catch (error) {
      next(error);
    }
  }

  async addNote(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { note } = req.body;
      const userId = req.user?.id;

      const invoice = await this.invoiceService.addNote(id, note, userId);
      const response = InvoiceMapper.toResponseDTO(invoice);

      res.status(200).json({
        success: true,
        message: 'Note added successfully',
        data: response,
      });
    } catch (error) {
      next(error);
    }
  }

  async getInvoicesByCustomer(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { customerId } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;

      const invoices = await this.invoiceService.getInvoicesByCustomer(
        customerId,
        limit
      );
      const response = invoices.map((invoice) =>
        InvoiceMapper.toResponseDTO(invoice)
      );

      res.status(200).json({
        success: true,
        data: response,
      });
    } catch (error) {
      next(error);
    }
  }
}