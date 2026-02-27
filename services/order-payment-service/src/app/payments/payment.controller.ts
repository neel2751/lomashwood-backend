import { Request, Response, NextFunction } from 'express';
import { PaymentService } from './payment.service';
import {
  CreatePaymentIntentDTO,
  ProcessPaymentDTO,
  RefundPaymentDTO,
  PaymentQueryParams,
  VerifyPaymentDTO,
} from './payment.types';
import { PaymentMapper } from './payment.mapper';
import { PAYMENT_CONSTANTS } from './payment.constants';

export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  async createPaymentIntent(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const dto: CreatePaymentIntentDTO = req.body;
      const userId = req.user?.id;

      const result = await this.paymentService.createPaymentIntent(
        dto,
        userId
      );

      res.status(201).json({
        success: true,
        message: 'Payment intent created successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async processPayment(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const dto: ProcessPaymentDTO = req.body;

      const payment = await this.paymentService.processPayment(dto);
      const response = PaymentMapper.toResponseDTO(payment);

      res.status(200).json({
        success: true,
        message: 'Payment processed successfully',
        data: response,
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyPayment(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const dto: VerifyPaymentDTO = req.body;

      const result = await this.paymentService.verifyPayment(dto);

      res.status(200).json({
        success: true,
        message: 'Payment verified successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPaymentById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;

      const payment = await this.paymentService.getPaymentById(id);
      const response = PaymentMapper.toResponseDTO(payment);

      res.status(200).json({
        success: true,
        data: response,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPaymentByOrderId(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { orderId } = req.params;

      const payments = await this.paymentService.getPaymentsByOrderId(orderId);
      const response = payments.map((payment) =>
        PaymentMapper.toResponseDTO(payment)
      );

      res.status(200).json({
        success: true,
        data: response,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPaymentByTransactionId(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { transactionId } = req.params;

      const payment =
        await this.paymentService.getPaymentByTransactionId(transactionId);
      const response = PaymentMapper.toResponseDTO(payment);

      res.status(200).json({
        success: true,
        data: response,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPayments(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const queryParams: PaymentQueryParams = {
        page: parseInt(req.query.page as string) || 1,
        limit:
          parseInt(req.query.limit as string) ||
          PAYMENT_CONSTANTS.DEFAULT_PAGE_SIZE,
        status: req.query.status as any,
        method: req.query.method as any,
        orderId: req.query.orderId as string,
        customerId: req.query.customerId as string,
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

      const result = await this.paymentService.getPayments(queryParams);
      const response = PaymentMapper.toListResponseDTO(
        result.payments,
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

  async refundPayment(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const dto: RefundPaymentDTO = req.body;
      const userId = req.user?.id;

      const refund = await this.paymentService.refundPayment(id, dto, userId);

      res.status(200).json({
        success: true,
        message: 'Refund processed successfully',
        data: refund,
      });
    } catch (error) {
      next(error);
    }
  }

  async capturePayment(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { amount } = req.body;

      const payment = await this.paymentService.capturePayment(id, amount);
      const response = PaymentMapper.toResponseDTO(payment);

      res.status(200).json({
        success: true,
        message: 'Payment captured successfully',
        data: response,
      });
    } catch (error) {
      next(error);
    }
  }

  async cancelPayment(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const userId = req.user?.id;

      const payment = await this.paymentService.cancelPayment(
        id,
        reason,
        userId
      );
      const response = PaymentMapper.toResponseDTO(payment);

      res.status(200).json({
        success: true,
        message: 'Payment cancelled successfully',
        data: response,
      });
    } catch (error) {
      next(error);
    }
  }

  async handleStripeWebhook(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const signature = req.headers['stripe-signature'] as string;
      const payload = req.body;

      await this.paymentService.handleStripeWebhook(payload, signature);

      res.status(200).json({
        success: true,
        message: 'Webhook processed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async handleRazorpayWebhook(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const signature = req.headers['x-razorpay-signature'] as string;
      const payload = req.body;

      await this.paymentService.handleRazorpayWebhook(payload, signature);

      res.status(200).json({
        success: true,
        message: 'Webhook processed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getPaymentMethods(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const customerId = req.user?.id;

      const methods = await this.paymentService.getPaymentMethods(customerId);

      res.status(200).json({
        success: true,
        data: methods,
      });
    } catch (error) {
      next(error);
    }
  }

  async savePaymentMethod(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const customerId = req.user?.id;
      const { paymentMethodId, setAsDefault } = req.body;

      const result = await this.paymentService.savePaymentMethod(
        customerId!,
        paymentMethodId,
        setAsDefault
      );

      res.status(200).json({
        success: true,
        message: 'Payment method saved successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async deletePaymentMethod(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const customerId = req.user?.id;
      const { paymentMethodId } = req.params;

      await this.paymentService.deletePaymentMethod(
        customerId!,
        paymentMethodId
      );

      res.status(200).json({
        success: true,
        message: 'Payment method deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async retryFailedPayment(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { paymentMethodId } = req.body;

      const payment = await this.paymentService.retryFailedPayment(
        id,
        paymentMethodId
      );
      const response = PaymentMapper.toResponseDTO(payment);

      res.status(200).json({
        success: true,
        message: 'Payment retry initiated successfully',
        data: response,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPaymentStatistics(
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

      const statistics = await this.paymentService.getPaymentStatistics(
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

  async getPaymentHistory(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;

      const history = await this.paymentService.getPaymentHistory(id);

      res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }

  async exportPayments(
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

      const fileBuffer = await this.paymentService.exportPayments(
        format,
        fromDate,
        toDate
      );

      const filename = `payments_${Date.now()}.${format}`;

      res.setHeader('Content-Type', `application/${format}`);
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.send(fileBuffer);
    } catch (error) {
      next(error);
    }
  }

  async reconcilePayments(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { fromDate, toDate } = req.body;

      const result = await this.paymentService.reconcilePayments(
        new Date(fromDate),
        new Date(toDate)
      );

      res.status(200).json({
        success: true,
        message: 'Payment reconciliation completed',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPaymentAnalytics(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const period = (req.query.period as string) || 'month';
      const groupBy = (req.query.groupBy as string) || 'day';

      const analytics = await this.paymentService.getPaymentAnalytics(
        period,
        groupBy
      );

      res.status(200).json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  }

  async checkPaymentStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;

      const status = await this.paymentService.checkPaymentStatus(id);

      res.status(200).json({
        success: true,
        data: status,
      });
    } catch (error) {
      next(error);
    }
  }

  async validatePaymentAmount(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { orderId, amount } = req.body;

      const isValid = await this.paymentService.validatePaymentAmount(
        orderId,
        amount
      );

      res.status(200).json({
        success: true,
        data: { isValid },
      });
    } catch (error) {
      next(error);
    }
  }

  async getRefundDetails(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { refundId } = req.params;

      const refund = await this.paymentService.getRefundDetails(refundId);

      res.status(200).json({
        success: true,
        data: refund,
      });
    } catch (error) {
      next(error);
    }
  }

  async getRefundsByPayment(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { paymentId } = req.params;

      const refunds = await this.paymentService.getRefundsByPaymentId(
        paymentId
      );

      res.status(200).json({
        success: true,
        data: refunds,
      });
    } catch (error) {
      next(error);
    }
  }
}