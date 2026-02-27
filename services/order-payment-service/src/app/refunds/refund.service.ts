import { PrismaClient, Refund, RefundStatus, PaymentStatus, OrderStatus, Prisma } from '@prisma/client';
import Stripe from 'stripe';
import { AppError, NotFoundError, ConflictError, BadRequestError, ForbiddenError } from '../../shared/errors';
import { RefundCreateInput, RefundUpdateInput, RefundFilters, RefundWithRelations, RefundSummary, RefundEligibilityResult, BulkRefundResult } from './refund.types';
import { RefundMapper } from './refund.mapper';
import { RefundRepository } from './refund.repository';
import { REFUND_CONSTANTS, REFUND_REASONS, REFUNDABLE_STATUSES } from './refund.constants';
import { PaginationOptions, PaginatedResult } from '../../shared/pagination';
import { EventProducer } from '../../infrastructure/messaging/event-producer';
import { REFUND_EVENTS } from '../../events/refund-issued.event';
import { logger } from '../../config/logger';
import { TransactionHelper } from '../../infrastructure/db/transaction.helper';

export class RefundService {
  constructor(
    private readonly refundRepository: RefundRepository,
    private readonly prisma: PrismaClient,
    private readonly stripe: Stripe,
    private readonly eventProducer: EventProducer,
    private readonly transactionHelper: TransactionHelper,
  ) {}

  async createRefund(input: RefundCreateInput, requestedBy: string): Promise<RefundWithRelations> {
    const order = await this.prisma.order.findUnique({
      where: { id: input.orderId },
      include: {
        payments: {
          where: { status: PaymentStatus.SUCCEEDED },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        refunds: {
          where: {
            status: {
              notIn: [RefundStatus.FAILED, RefundStatus.CANCELLED],
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundError(`Order ${input.orderId} not found`);
    }

    if (!REFUNDABLE_STATUSES.includes(order.status as OrderStatus)) {
      throw new BadRequestError(
        `Order with status "${order.status}" is not eligible for a refund`,
      );
    }

    const successfulPayment = order.payments[0];
    if (!successfulPayment) {
      throw new BadRequestError('No successful payment found for this order');
    }

    const eligibility = await this.checkRefundEligibility(input.orderId);
    if (!eligibility.eligible) {
      throw new BadRequestError(eligibility.reason ?? 'Refund not eligible for this order');
    }

    const totalRefundedSoFar = order.refunds.reduce(
      (acc, r) => acc + r.amount.toNumber(),
      0,
    );

    const requestedAmount = input.amount ?? successfulPayment.amount.toNumber() - totalRefundedSoFar;

    if (requestedAmount <= 0) {
      throw new BadRequestError('Refund amount must be greater than zero');
    }

    const maxRefundable = successfulPayment.amount.toNumber() - totalRefundedSoFar;
    if (requestedAmount > maxRefundable) {
      throw new BadRequestError(
        `Requested refund amount (${requestedAmount}) exceeds maximum refundable amount (${maxRefundable})`,
      );
    }

    const refund = await this.transactionHelper.run(async (tx) => {
      const newRefund = await this.refundRepository.create(
        {
          order: { connect: { id: input.orderId } },
          payment: { connect: { id: successfulPayment.id } },
          amount: new Prisma.Decimal(requestedAmount),
          currency: successfulPayment.currency,
          reason: input.reason,
          notes: input.notes,
          status: RefundStatus.PENDING,
          requestedBy,
          metadata: input.metadata ?? Prisma.JsonNull,
        },
        tx,
      );

      logger.info('Refund record created', {
        refundId: newRefund.id,
        orderId: input.orderId,
        amount: requestedAmount,
        requestedBy,
      });

      return newRefund;
    });

    const processedRefund = await this.processStripeRefund(refund.id, successfulPayment.stripePaymentIntentId!);

    await this.eventProducer.publish(REFUND_EVENTS.REFUND_INITIATED, {
      refundId: processedRefund.id,
      orderId: input.orderId,
      amount: requestedAmount,
      currency: processedRefund.currency,
      requestedBy,
      timestamp: new Date().toISOString(),
    });

    return this.refundRepository.findByIdWithRelations(processedRefund.id);
  }

  async processStripeRefund(refundId: string, stripePaymentIntentId: string): Promise<Refund> {
    const refund = await this.refundRepository.findById(refundId);
    if (!refund) {
      throw new NotFoundError(`Refund ${refundId} not found`);
    }

    if (refund.status !== RefundStatus.PENDING) {
      throw new ConflictError(`Refund is already in status "${refund.status}"`);
    }

    try {
      const stripeRefund = await this.stripe.refunds.create({
        payment_intent: stripePaymentIntentId,
        amount: Math.round(refund.amount.toNumber() * 100),
        reason: this.mapReasonToStripe(refund.reason),
        metadata: {
          refundId: refund.id,
          orderId: refund.orderId,
        },
      });

      const updated = await this.refundRepository.update(refundId, {
        status: RefundStatus.PROCESSING,
        stripeRefundId: stripeRefund.id,
        processedAt: new Date(),
      });

      logger.info('Stripe refund initiated', {
        refundId,
        stripeRefundId: stripeRefund.id,
        status: stripeRefund.status,
      });

      return updated;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown Stripe error';

      await this.refundRepository.update(refundId, {
        status: RefundStatus.FAILED,
        failureReason: errorMessage,
      });

      logger.error('Stripe refund failed', {
        refundId,
        stripePaymentIntentId,
        error: errorMessage,
      });

      await this.eventProducer.publish(REFUND_EVENTS.REFUND_FAILED, {
        refundId,
        orderId: refund.orderId,
        reason: errorMessage,
        timestamp: new Date().toISOString(),
      });

      throw new AppError(`Stripe refund processing failed: ${errorMessage}`, 502);
    }
  }

  async handleStripeWebhook(stripeRefund: Stripe.Refund): Promise<void> {
    const refundId = stripeRefund.metadata?.['refundId'];
    if (!refundId) {
      logger.warn('Stripe refund webhook missing refundId in metadata', {
        stripeRefundId: stripeRefund.id,
      });
      return;
    }

    const refund = await this.refundRepository.findById(refundId);
    if (!refund) {
      logger.warn('Refund not found for Stripe webhook', { refundId, stripeRefundId: stripeRefund.id });
      return;
    }

    const newStatus = this.mapStripeStatusToInternal(stripeRefund.status as string);

    await this.transactionHelper.run(async (tx) => {
      await this.refundRepository.update(
        refundId,
        {
          status: newStatus,
          stripeRefundId: stripeRefund.id,
          ...(newStatus === RefundStatus.SUCCEEDED && { settledAt: new Date() }),
          ...(newStatus === RefundStatus.FAILED && {
            failureReason: stripeRefund.failure_reason ?? 'Unknown failure from Stripe',
          }),
        },
        tx,
      );

      if (newStatus === RefundStatus.SUCCEEDED) {
        await this.updateOrderStatusAfterRefund(refund.orderId, tx);
      }
    });

    await this.eventProducer.publish(REFUND_EVENTS.REFUND_STATUS_UPDATED, {
      refundId,
      orderId: refund.orderId,
      newStatus,
      stripeRefundId: stripeRefund.id,
      timestamp: new Date().toISOString(),
    });

    logger.info('Refund status updated via Stripe webhook', {
      refundId,
      newStatus,
      stripeRefundId: stripeRefund.id,
    });
  }

  async getRefundById(refundId: string): Promise<RefundWithRelations> {
    const refund = await this.refundRepository.findByIdWithRelations(refundId);
    if (!refund) {
      throw new NotFoundError(`Refund ${refundId} not found`);
    }
    return refund;
  }

  async getRefundsByOrder(orderId: string): Promise<RefundWithRelations[]> {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundError(`Order ${orderId} not found`);
    }
    return this.refundRepository.findByOrderId(orderId);
  }

  async listRefunds(
    filters: RefundFilters,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<RefundWithRelations>> {
    return this.refundRepository.findMany(filters, pagination);
  }

  async cancelRefund(refundId: string, cancelledBy: string): Promise<RefundWithRelations> {
    const refund = await this.refundRepository.findById(refundId);
    if (!refund) {
      throw new NotFoundError(`Refund ${refundId} not found`);
    }

    if (refund.status !== RefundStatus.PENDING) {
      throw new ConflictError(
        `Only PENDING refunds can be cancelled. Current status: "${refund.status}"`,
      );
    }

    const updated = await this.refundRepository.update(refundId, {
      status: RefundStatus.CANCELLED,
      cancelledBy,
      cancelledAt: new Date(),
    });

    await this.eventProducer.publish(REFUND_EVENTS.REFUND_CANCELLED, {
      refundId,
      orderId: refund.orderId,
      cancelledBy,
      timestamp: new Date().toISOString(),
    });

    logger.info('Refund cancelled', { refundId, cancelledBy });

    return this.refundRepository.findByIdWithRelations(updated.id);
  }

  async checkRefundEligibility(orderId: string): Promise<RefundEligibilityResult> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payments: {
          where: { status: PaymentStatus.SUCCEEDED },
        },
        refunds: {
          where: {
            status: {
              notIn: [RefundStatus.FAILED, RefundStatus.CANCELLED],
            },
          },
        },
      },
    });

    if (!order) {
      return { eligible: false, reason: `Order ${orderId} not found` };
    }

    if (!REFUNDABLE_STATUSES.includes(order.status as OrderStatus)) {
      return {
        eligible: false,
        reason: `Orders with status "${order.status}" cannot be refunded`,
      };
    }

    const successfulPayments = order.payments;
    if (successfulPayments.length === 0) {
      return { eligible: false, reason: 'No successful payment found for this order' };
    }

    const totalPaid = successfulPayments.reduce((sum, p) => sum + p.amount.toNumber(), 0);
    const totalRefunded = order.refunds.reduce((sum, r) => sum + r.amount.toNumber(), 0);
    const remainingRefundable = totalPaid - totalRefunded;

    if (remainingRefundable <= 0) {
      return { eligible: false, reason: 'Order has already been fully refunded' };
    }

    const orderAgeMs = Date.now() - order.createdAt.getTime();
    const maxRefundAgeMs = REFUND_CONSTANTS.MAX_REFUND_AGE_DAYS * 24 * 60 * 60 * 1000;

    if (orderAgeMs > maxRefundAgeMs) {
      return {
        eligible: false,
        reason: `Refund window of ${REFUND_CONSTANTS.MAX_REFUND_AGE_DAYS} days has expired`,
      };
    }

    return {
      eligible: true,
      maxRefundableAmount: remainingRefundable,
      currency: successfulPayments[0]!.currency,
    };
  }

  async getRefundSummaryForOrder(orderId: string): Promise<RefundSummary> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payments: { where: { status: PaymentStatus.SUCCEEDED } },
        refunds: true,
      },
    });

    if (!order) {
      throw new NotFoundError(`Order ${orderId} not found`);
    }

    const totalPaid = order.payments.reduce((sum, p) => sum + p.amount.toNumber(), 0);
    const totalRefunded = order.refunds
      .filter((r) => r.status === RefundStatus.SUCCEEDED)
      .reduce((sum, r) => sum + r.amount.toNumber(), 0);

    const pendingRefunds = order.refunds
      .filter((r) => r.status === RefundStatus.PENDING || r.status === RefundStatus.PROCESSING)
      .reduce((sum, r) => sum + r.amount.toNumber(), 0);

    return RefundMapper.toSummary({
      orderId,
      totalPaid,
      totalRefunded,
      pendingRefunds,
      remainingRefundable: totalPaid - totalRefunded - pendingRefunds,
      refundCount: order.refunds.length,
      currency: order.payments[0]?.currency ?? 'GBP',
    });
  }

  async processBulkRefunds(
    orderIds: string[],
    reason: string,
    requestedBy: string,
  ): Promise<BulkRefundResult> {
    if (orderIds.length > REFUND_CONSTANTS.MAX_BULK_REFUND_SIZE) {
      throw new BadRequestError(
        `Bulk refund limit is ${REFUND_CONSTANTS.MAX_BULK_REFUND_SIZE} orders per request`,
      );
    }

    const results: BulkRefundResult = {
      successful: [],
      failed: [],
      total: orderIds.length,
    };

    await Promise.allSettled(
      orderIds.map(async (orderId) => {
        try {
          const refund = await this.createRefund({ orderId, reason }, requestedBy);
          results.successful.push({ orderId, refundId: refund.id });
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          results.failed.push({ orderId, error: errorMessage });
          logger.warn('Bulk refund failed for order', { orderId, error: errorMessage });
        }
      }),
    );

    logger.info('Bulk refund completed', {
      total: results.total,
      successful: results.successful.length,
      failed: results.failed.length,
      requestedBy,
    });

    return results;
  }

  async retryFailedRefund(refundId: string, requestedBy: string): Promise<RefundWithRelations> {
    const refund = await this.refundRepository.findByIdWithRelations(refundId);
    if (!refund) {
      throw new NotFoundError(`Refund ${refundId} not found`);
    }

    if (refund.status !== RefundStatus.FAILED) {
      throw new ConflictError(`Only FAILED refunds can be retried. Current status: "${refund.status}"`);
    }

    if (!refund.payment?.stripePaymentIntentId) {
      throw new BadRequestError('Cannot retry refund: missing Stripe Payment Intent ID');
    }

    await this.refundRepository.update(refundId, {
      status: RefundStatus.PENDING,
      failureReason: null,
      retryCount: { increment: 1 },
      lastRetriedAt: new Date(),
      lastRetriedBy: requestedBy,
    });

    logger.info('Retrying failed refund', { refundId, requestedBy });

    await this.processStripeRefund(refundId, refund.payment.stripePaymentIntentId);

    return this.refundRepository.findByIdWithRelations(refundId);
  }

  private async updateOrderStatusAfterRefund(
    orderId: string,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        payments: { where: { status: PaymentStatus.SUCCEEDED } },
        refunds: { where: { status: RefundStatus.SUCCEEDED } },
      },
    });

    if (!order) return;

    const totalPaid = order.payments.reduce((sum, p) => sum + p.amount.toNumber(), 0);
    const totalRefunded = order.refunds.reduce((sum, r) => sum + r.amount.toNumber(), 0);

    const newStatus = totalRefunded >= totalPaid ? OrderStatus.REFUNDED : OrderStatus.PARTIALLY_REFUNDED;

    await tx.order.update({
      where: { id: orderId },
      data: { status: newStatus },
    });

    logger.info('Order status updated after refund', { orderId, newStatus, totalPaid, totalRefunded });
  }

  private mapReasonToStripe(reason: string): Stripe.RefundCreateParams.Reason | undefined {
    const map: Record<string, Stripe.RefundCreateParams.Reason> = {
      [REFUND_REASONS.DUPLICATE]: 'duplicate',
      [REFUND_REASONS.FRAUDULENT]: 'fraudulent',
      [REFUND_REASONS.REQUESTED_BY_CUSTOMER]: 'requested_by_customer',
    };
    return map[reason];
  }

  private mapStripeStatusToInternal(stripeStatus: string): RefundStatus {
    const map: Record<string, RefundStatus> = {
      pending: RefundStatus.PROCESSING,
      succeeded: RefundStatus.SUCCEEDED,
      failed: RefundStatus.FAILED,
      canceled: RefundStatus.CANCELLED,
      requires_action: RefundStatus.PROCESSING,
    };
    return map[stripeStatus] ?? RefundStatus.PROCESSING;
  }
}