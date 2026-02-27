import { PaymentRepository } from './payment.repository';
import {
  CreatePaymentIntentDTO,
  ProcessPaymentDTO,
  RefundPaymentDTO,
  PaymentQueryParams,
  VerifyPaymentDTO,
  PaymentEntity,
  CreatePaymentIntentResult,
  PaymentVerificationResult,
  RefundResult,
  PaymentStatistics,
  PaymentAnalytics,
  PaymentStatusCheck,
  ReconciliationResult,
  PaymentHistoryEntry,
  SavedPaymentMethod,
} from './payment.types';
import { PaymentMapper } from './payment.mapper';
import { PAYMENT_CONSTANTS, PAYMENT_ERROR_CODES } from './payment.constants';
import {
  PaymentNotFoundError,
  PaymentValidationError,
  PaymentProcessingError,
  RefundError,
  WebhookVerificationError,
} from './payment.errors';
import { StripeClient } from '../../infrastructure/payments/stripe.client';
import { RazorpayClient } from '../../infrastructure/payments/razorpay.client';
import { EventProducer } from '../../infrastructure/messaging/event-producer';
import { RedisClient } from '../../infrastructure/cache/redis.client';
import { Logger } from '../../config/logger';
import { PaymentStatus, PaymentMethod } from '@prisma/client';

export class PaymentService {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly stripeClient: StripeClient,
    private readonly razorpayClient: RazorpayClient,
    private readonly eventProducer: EventProducer,
    private readonly redisClient: RedisClient,
    private readonly logger: Logger
  ) {}

  async createPaymentIntent(
    dto: CreatePaymentIntentDTO,
    userId?: string
  ): Promise<CreatePaymentIntentResult> {
    try {
      this.logger.info('Creating payment intent', { dto, userId });

      this.validatePaymentAmount(dto.amount);

      const order = await this.validateOrder(dto.orderId);

      if (order.totalAmount !== dto.amount) {
        throw new PaymentValidationError('Payment amount mismatch with order');
      }

      let paymentIntent;
      let clientSecret: string;
      let paymentIntentId: string;

      if (dto.provider === 'stripe') {
        const stripeIntent = await this.stripeClient.createPaymentIntent({
          amount: Math.round(dto.amount * 100),
          currency: dto.currency || 'inr',
          metadata: {
            orderId: dto.orderId,
            customerId: dto.customerId,
          },
          paymentMethodTypes: ['card'],
        });

        clientSecret = stripeIntent.client_secret!;
        paymentIntentId = stripeIntent.id;
      } else if (dto.provider === 'razorpay') {
        const razorpayOrder = await this.razorpayClient.createOrder({
          amount: Math.round(dto.amount * 100),
          currency: dto.currency || 'INR',
          receipt: `order_${dto.orderId}`,
          notes: {
            orderId: dto.orderId,
            customerId: dto.customerId,
          },
        });

        clientSecret = razorpayOrder.id;
        paymentIntentId = razorpayOrder.id;
      } else {
        throw new PaymentValidationError('Unsupported payment provider');
      }

      const payment = await this.paymentRepository.create({
        orderId: dto.orderId,
        customerId: dto.customerId,
        amount: dto.amount,
        currency: dto.currency || 'INR',
        method: dto.method,
        provider: dto.provider,
        status: PaymentStatus.PENDING,
        paymentIntentId,
        metadata: dto.metadata ? JSON.stringify(dto.metadata) : null,
      });

      await this.eventProducer.publish('payment.intent.created', {
        paymentId: payment.id,
        orderId: dto.orderId,
        amount: dto.amount,
      });

      this.logger.info('Payment intent created successfully', {
        paymentId: payment.id,
      });

      return {
        paymentId: payment.id,
        clientSecret,
        paymentIntentId,
        amount: dto.amount,
        currency: dto.currency || 'INR',
      };
    } catch (error) {
      this.logger.error('Failed to create payment intent', { error, dto });
      throw error;
    }
  }

  async processPayment(dto: ProcessPaymentDTO): Promise<PaymentEntity> {
    try {
      this.logger.info('Processing payment', { dto });

      const payment = await this.paymentRepository.findById(dto.paymentId);

      if (!payment) {
        throw new PaymentNotFoundError(dto.paymentId);
      }

      if (payment.status !== PaymentStatus.PENDING) {
        throw new PaymentProcessingError(
          `Payment already processed with status: ${payment.status}`
        );
      }

      let updatedPayment: PaymentEntity;

      if (payment.provider === 'stripe') {
        const paymentIntent = await this.stripeClient.retrievePaymentIntent(
          payment.paymentIntentId!
        );

        if (paymentIntent.status === 'succeeded') {
          updatedPayment = await this.paymentRepository.update(payment.id, {
            status: PaymentStatus.PAID,
            transactionId: paymentIntent.id,
            paidAt: new Date(),
            metadata: JSON.stringify({
              ...JSON.parse(payment.metadata || '{}'),
              stripePaymentIntent: paymentIntent,
            }),
          });
        } else {
          throw new PaymentProcessingError(
            `Payment intent status: ${paymentIntent.status}`
          );
        }
      } else if (payment.provider === 'razorpay') {
        const isValid = await this.razorpayClient.verifyPaymentSignature({
          orderId: payment.paymentIntentId!,
          paymentId: dto.transactionId!,
          signature: dto.signature!,
        });

        if (!isValid) {
          throw new PaymentProcessingError('Invalid payment signature');
        }

        updatedPayment = await this.paymentRepository.update(payment.id, {
          status: PaymentStatus.PAID,
          transactionId: dto.transactionId,
          paidAt: new Date(),
        });
      } else {
        throw new PaymentProcessingError('Unsupported payment provider');
      }

      await this.updateOrderPaymentStatus(payment.orderId, PaymentStatus.PAID);

      await this.eventProducer.publish('payment.success', {
        paymentId: updatedPayment.id,
        orderId: payment.orderId,
        amount: payment.amount.toNumber(),
        transactionId: updatedPayment.transactionId,
      });

      await this.invalidatePaymentCache(payment.id);

      this.logger.info('Payment processed successfully', {
        paymentId: payment.id,
      });

      return updatedPayment;
    } catch (error) {
      this.logger.error('Failed to process payment', { error, dto });

      if (dto.paymentId) {
        await this.paymentRepository.update(dto.paymentId, {
          status: PaymentStatus.FAILED,
          failureReason: error instanceof Error ? error.message : 'Unknown',
        });

        await this.eventProducer.publish('payment.failed', {
          paymentId: dto.paymentId,
          reason: error instanceof Error ? error.message : 'Unknown',
        });
      }

      throw error;
    }
  }

  async verifyPayment(dto: VerifyPaymentDTO): Promise<PaymentVerificationResult> {
    try {
      this.logger.info('Verifying payment', { dto });

      const payment = await this.paymentRepository.findById(dto.paymentId);

      if (!payment) {
        throw new PaymentNotFoundError(dto.paymentId);
      }

      let isValid = false;
      let status = payment.status;

      if (payment.provider === 'stripe') {
        const paymentIntent = await this.stripeClient.retrievePaymentIntent(
          payment.paymentIntentId!
        );
        isValid = paymentIntent.status === 'succeeded';
        status = this.mapStripeStatusToPaymentStatus(paymentIntent.status);
      } else if (payment.provider === 'razorpay') {
        if (dto.signature) {
          isValid = await this.razorpayClient.verifyPaymentSignature({
            orderId: payment.paymentIntentId!,
            paymentId: dto.transactionId!,
            signature: dto.signature,
          });
        }

        const razorpayPayment = await this.razorpayClient.fetchPayment(
          dto.transactionId!
        );
        status = this.mapRazorpayStatusToPaymentStatus(razorpayPayment.status);
      }

      if (status !== payment.status) {
        await this.paymentRepository.update(payment.id, { status });
      }

      return {
        isValid,
        status,
        paymentId: payment.id,
        transactionId: payment.transactionId || dto.transactionId,
      };
    } catch (error) {
      this.logger.error('Failed to verify payment', { error, dto });
      throw error;
    }
  }

  async getPaymentById(id: string): Promise<PaymentEntity> {
    try {
      const cached = await this.redisClient.get(`payment:${id}`);
      if (cached) {
        return JSON.parse(cached);
      }

      const payment = await this.paymentRepository.findById(id);

      if (!payment) {
        throw new PaymentNotFoundError(id);
      }

      await this.redisClient.set(
        `payment:${id}`,
        JSON.stringify(payment),
        PAYMENT_CONSTANTS.CACHE_TTL.PAYMENT_DETAILS
      );

      return payment;
    } catch (error) {
      this.logger.error('Failed to get payment by ID', { error, id });
      throw error;
    }
  }

  async getPaymentsByOrderId(orderId: string): Promise<PaymentEntity[]> {
    try {
      const payments = await this.paymentRepository.findByOrderId(orderId);
      return payments;
    } catch (error) {
      this.logger.error('Failed to get payments by order ID', {
        error,
        orderId,
      });
      throw error;
    }
  }

  async getPaymentByTransactionId(
    transactionId: string
  ): Promise<PaymentEntity> {
    try {
      const payment =
        await this.paymentRepository.findByTransactionId(transactionId);

      if (!payment) {
        throw new PaymentNotFoundError(transactionId);
      }

      return payment;
    } catch (error) {
      this.logger.error('Failed to get payment by transaction ID', {
        error,
        transactionId,
      });
      throw error;
    }
  }

  async getPayments(
    params: PaymentQueryParams
  ): Promise<{ payments: PaymentEntity[]; total: number }> {
    try {
      const filters = PaymentMapper.toRepositoryFilters(params);
      const payments = await this.paymentRepository.findAll(
        filters,
        params.page || 1,
        params.limit || PAYMENT_CONSTANTS.DEFAULT_PAGE_SIZE,
        params.sortBy,
        params.sortOrder
      );

      const total = await this.paymentRepository.count(filters);

      return { payments, total };
    } catch (error) {
      this.logger.error('Failed to get payments', { error, params });
      throw error;
    }
  }

  async refundPayment(
    paymentId: string,
    dto: RefundPaymentDTO,
    userId?: string
  ): Promise<RefundResult> {
    try {
      this.logger.info('Processing refund', { paymentId, dto, userId });

      const payment = await this.paymentRepository.findById(paymentId);

      if (!payment) {
        throw new PaymentNotFoundError(paymentId);
      }

      if (payment.status !== PaymentStatus.PAID) {
        throw new RefundError('Only paid payments can be refunded');
      }

      const refundAmount = dto.amount || payment.amount.toNumber();

      if (refundAmount > payment.amount.toNumber()) {
        throw new RefundError('Refund amount exceeds payment amount');
      }

      let refundId: string;
      let refundStatus: string;

      if (payment.provider === 'stripe') {
        const refund = await this.stripeClient.createRefund({
          paymentIntent: payment.paymentIntentId!,
          amount: Math.round(refundAmount * 100),
          reason: dto.reason as any,
        });

        refundId = refund.id;
        refundStatus = refund.status;
      } else if (payment.provider === 'razorpay') {
        const refund = await this.razorpayClient.createRefund({
          paymentId: payment.transactionId!,
          amount: Math.round(refundAmount * 100),
          notes: {
            reason: dto.reason,
            processedBy: userId,
          },
        });

        refundId = refund.id;
        refundStatus = refund.status;
      } else {
        throw new RefundError('Unsupported payment provider');
      }

      const newStatus =
        refundAmount === payment.amount.toNumber()
          ? PaymentStatus.REFUNDED
          : PaymentStatus.PARTIALLY_REFUNDED;

      await this.paymentRepository.update(payment.id, {
        status: newStatus,
        refundedAmount: refundAmount,
        refundedAt: new Date(),
      });

      await this.eventProducer.publish('payment.refunded', {
        paymentId: payment.id,
        orderId: payment.orderId,
        refundId,
        amount: refundAmount,
        reason: dto.reason,
      });

      await this.invalidatePaymentCache(payment.id);

      this.logger.info('Refund processed successfully', {
        paymentId,
        refundId,
      });

      return {
        refundId,
        status: refundStatus,
        amount: refundAmount,
        processedAt: new Date(),
      };
    } catch (error) {
      this.logger.error('Failed to process refund', { error, paymentId, dto });
      throw error;
    }
  }

  async capturePayment(
    paymentId: string,
    amount?: number
  ): Promise<PaymentEntity> {
    try {
      const payment = await this.paymentRepository.findById(paymentId);

      if (!payment) {
        throw new PaymentNotFoundError(paymentId);
      }

      if (payment.provider === 'stripe') {
        await this.stripeClient.capturePaymentIntent(
          payment.paymentIntentId!,
          amount ? Math.round(amount * 100) : undefined
        );
      } else {
        throw new PaymentProcessingError(
          'Capture not supported for this provider'
        );
      }

      const updatedPayment = await this.paymentRepository.update(payment.id, {
        status: PaymentStatus.PAID,
        paidAt: new Date(),
      });

      await this.eventProducer.publish('payment.captured', {
        paymentId: payment.id,
        amount: amount || payment.amount.toNumber(),
      });

      return updatedPayment;
    } catch (error) {
      this.logger.error('Failed to capture payment', { error, paymentId });
      throw error;
    }
  }

  async cancelPayment(
    paymentId: string,
    reason?: string,
    userId?: string
  ): Promise<PaymentEntity> {
    try {
      const payment = await this.paymentRepository.findById(paymentId);

      if (!payment) {
        throw new PaymentNotFoundError(paymentId);
      }

      if (payment.provider === 'stripe') {
        await this.stripeClient.cancelPaymentIntent(payment.paymentIntentId!);
      } else if (payment.provider === 'razorpay') {
      }

      const updatedPayment = await this.paymentRepository.update(payment.id, {
        status: PaymentStatus.CANCELLED,
        failureReason: reason,
      });

      await this.eventProducer.publish('payment.cancelled', {
        paymentId: payment.id,
        reason,
        cancelledBy: userId,
      });

      return updatedPayment;
    } catch (error) {
      this.logger.error('Failed to cancel payment', { error, paymentId });
      throw error;
    }
  }

  async handleStripeWebhook(payload: any, signature: string): Promise<void> {
    try {
      const event = await this.stripeClient.verifyWebhook(payload, signature);

      this.logger.info('Processing Stripe webhook', { type: event.type });

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailure(event.data.object);
          break;
        case 'charge.refunded':
          await this.handleRefundProcessed(event.data.object);
          break;
        default:
          this.logger.warn('Unhandled webhook event type', {
            type: event.type,
          });
      }
    } catch (error) {
      this.logger.error('Failed to process Stripe webhook', { error });
      throw new WebhookVerificationError('Invalid webhook signature');
    }
  }

  async handleRazorpayWebhook(payload: any, signature: string): Promise<void> {
    try {
      const isValid = await this.razorpayClient.verifyWebhook(
        payload,
        signature
      );

      if (!isValid) {
        throw new WebhookVerificationError('Invalid webhook signature');
      }

      this.logger.info('Processing Razorpay webhook', {
        event: payload.event,
      });

      switch (payload.event) {
        case 'payment.captured':
          await this.handlePaymentSuccess(payload.payload.payment.entity);
          break;
        case 'payment.failed':
          await this.handlePaymentFailure(payload.payload.payment.entity);
          break;
        case 'refund.processed':
          await this.handleRefundProcessed(payload.payload.refund.entity);
          break;
        default:
          this.logger.warn('Unhandled webhook event', { event: payload.event });
      }
    } catch (error) {
      this.logger.error('Failed to process Razorpay webhook', { error });
      throw error;
    }
  }

  async getPaymentMethods(customerId: string): Promise<SavedPaymentMethod[]> {
    try {
      const methods = await this.stripeClient.getPaymentMethods(customerId);
      return methods.map(PaymentMapper.toSavedPaymentMethod);
    } catch (error) {
      this.logger.error('Failed to get payment methods', { error, customerId });
      throw error;
    }
  }

  async savePaymentMethod(
    customerId: string,
    paymentMethodId: string,
    setAsDefault: boolean = false
  ): Promise<SavedPaymentMethod> {
    try {
      const method = await this.stripeClient.attachPaymentMethod(
        paymentMethodId,
        customerId
      );

      if (setAsDefault) {
        await this.stripeClient.setDefaultPaymentMethod(
          customerId,
          paymentMethodId
        );
      }

      return PaymentMapper.toSavedPaymentMethod(method);
    } catch (error) {
      this.logger.error('Failed to save payment method', {
        error,
        customerId,
      });
      throw error;
    }
  }

  async deletePaymentMethod(
    customerId: string,
    paymentMethodId: string
  ): Promise<void> {
    try {
      await this.stripeClient.detachPaymentMethod(paymentMethodId);
    } catch (error) {
      this.logger.error('Failed to delete payment method', {
        error,
        customerId,
        paymentMethodId,
      });
      throw error;
    }
  }

  async retryFailedPayment(
    paymentId: string,
    paymentMethodId?: string
  ): Promise<PaymentEntity> {
    try {
      const payment = await this.paymentRepository.findById(paymentId);

      if (!payment) {
        throw new PaymentNotFoundError(paymentId);
      }

      if (payment.status !== PaymentStatus.FAILED) {
        throw new PaymentProcessingError('Only failed payments can be retried');
      }

      const updatedPayment = await this.paymentRepository.update(payment.id, {
        status: PaymentStatus.PENDING,
        failureReason: null,
      });

      return updatedPayment;
    } catch (error) {
      this.logger.error('Failed to retry payment', { error, paymentId });
      throw error;
    }
  }

  async getPaymentStatistics(
    fromDate: Date,
    toDate: Date
  ): Promise<PaymentStatistics> {
    try {
      const stats = await this.paymentRepository.getStatistics(
        fromDate,
        toDate
      );
      return stats;
    } catch (error) {
      this.logger.error('Failed to get payment statistics', { error });
      throw error;
    }
  }

  async getPaymentHistory(paymentId: string): Promise<PaymentHistoryEntry[]> {
    try {
      const history = await this.paymentRepository.getHistory(paymentId);
      return history;
    } catch (error) {
      this.logger.error('Failed to get payment history', { error, paymentId });
      throw error;
    }
  }

  async exportPayments(
    format: string,
    fromDate?: Date,
    toDate?: Date
  ): Promise<Buffer> {
    try {
      const payments = await this.paymentRepository.findAll(
        {
          dateRange: fromDate && toDate ? { from: fromDate, to: toDate } : undefined,
        },
        1,
        10000
      );

      return Buffer.from('export data');
    } catch (error) {
      this.logger.error('Failed to export payments', { error });
      throw error;
    }
  }

  async reconcilePayments(
    fromDate: Date,
    toDate: Date
  ): Promise<ReconciliationResult> {
    try {
      const result = await this.paymentRepository.reconcile(fromDate, toDate);
      return result;
    } catch (error) {
      this.logger.error('Failed to reconcile payments', { error });
      throw error;
    }
  }

  async getPaymentAnalytics(
    period: string,
    groupBy: string
  ): Promise<PaymentAnalytics> {
    try {
      const analytics = await this.paymentRepository.getAnalytics(
        period,
        groupBy
      );
      return analytics;
    } catch (error) {
      this.logger.error('Failed to get payment analytics', { error });
      throw error;
    }
  }

  async checkPaymentStatus(paymentId: string): Promise<PaymentStatusCheck> {
    try {
      const payment = await this.paymentRepository.findById(paymentId);

      if (!payment) {
        throw new PaymentNotFoundError(paymentId);
      }

      return {
        paymentId: payment.id,
        status: payment.status,
        transactionId: payment.transactionId,
        lastUpdated: payment.updatedAt,
      };
    } catch (error) {
      this.logger.error('Failed to check payment status', { error, paymentId });
      throw error;
    }
  }

  async validatePaymentAmount(orderId: string, amount: number): Promise<boolean> {
    try {
      const order = await this.validateOrder(orderId);
      return order.totalAmount === amount;
    } catch (error) {
      this.logger.error('Failed to validate payment amount', { error, orderId });
      throw error;
    }
  }

  async getRefundDetails(refundId: string): Promise<any> {
    try {
      const refund = await this.stripeClient.getRefund(refundId);
      return refund;
    } catch (error) {
      this.logger.error('Failed to get refund details', { error, refundId });
      throw error;
    }
  }

  async getRefundsByPaymentId(paymentId: string): Promise<any[]> {
    try {
      const payment = await this.paymentRepository.findById(paymentId);

      if (!payment) {
        throw new PaymentNotFoundError(paymentId);
      }

      const refunds = await this.stripeClient.getRefundsByPaymentIntent(
        payment.paymentIntentId!
      );
      return refunds;
    } catch (error) {
      this.logger.error('Failed to get refunds by payment ID', {
        error,
        paymentId,
      });
      throw error;
    }
  }

  private validatePaymentAmount(amount: number): void {
    if (amount < PAYMENT_CONSTANTS.MIN_PAYMENT_AMOUNT) {
      throw new PaymentValidationError(
        `Payment amount must be at least ₹${PAYMENT_CONSTANTS.MIN_PAYMENT_AMOUNT}`
      );
    }

    if (amount > PAYMENT_CONSTANTS.MAX_PAYMENT_AMOUNT) {
      throw new PaymentValidationError(
        `Payment amount cannot exceed ₹${PAYMENT_CONSTANTS.MAX_PAYMENT_AMOUNT}`
      );
    }
  }

  private async validateOrder(orderId: string): Promise<any> {
    return { totalAmount: 0 };
  }

  private async updateOrderPaymentStatus(
    orderId: string,
    status: PaymentStatus
  ): Promise<void> {
    await this.eventProducer.publish('order.payment.updated', {
      orderId,
      paymentStatus: status,
    });
  }

  private async handlePaymentSuccess(paymentData: any): Promise<void> {
    const payment = await this.paymentRepository.findByPaymentIntentId(
      paymentData.id
    );

    if (payment) {
      await this.paymentRepository.update(payment.id, {
        status: PaymentStatus.PAID,
        transactionId: paymentData.id,
        paidAt: new Date(),
      });

      await this.eventProducer.publish('payment.success', {
        paymentId: payment.id,
        orderId: payment.orderId,
      });
    }
  }

  private async handlePaymentFailure(paymentData: any): Promise<void> {
    const payment = await this.paymentRepository.findByPaymentIntentId(
      paymentData.id
    );

    if (payment) {
      await this.paymentRepository.update(payment.id, {
        status: PaymentStatus.FAILED,
        failureReason: paymentData.last_payment_error?.message,
      });

      await this.eventProducer.publish('payment.failed', {
        paymentId: payment.id,
        reason: paymentData.last_payment_error?.message,
      });
    }
  }

  private async handleRefundProcessed(refundData: any): Promise<void> {
    this.logger.info('Refund processed', { refundData });
  }

  private async invalidatePaymentCache(paymentId: string): Promise<void> {
    await this.redisClient.del(`payment:${paymentId}`);
  }

  private mapStripeStatusToPaymentStatus(status: string): PaymentStatus {
    const mapping: Record<string, PaymentStatus> = {
      succeeded: PaymentStatus.PAID,
      processing: PaymentStatus.PROCESSING,
      requires_payment_method: PaymentStatus.PENDING,
      requires_confirmation: PaymentStatus.PENDING,
      requires_action: PaymentStatus.PENDING,
      canceled: PaymentStatus.CANCELLED,
    };

    return mapping[status] || PaymentStatus.FAILED;
  }

  private mapRazorpayStatusToPaymentStatus(status: string): PaymentStatus {
    const mapping: Record<string, PaymentStatus> = {
      captured: PaymentStatus.PAID,
      authorized: PaymentStatus.PROCESSING,
      created: PaymentStatus.PENDING,
      failed: PaymentStatus.FAILED,
    };

    return mapping[status] || PaymentStatus.PENDING;
  }
}