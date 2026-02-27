import { PrismaClient, PaymentStatus, OrderStatus } from '@prisma/client';
import Stripe from 'stripe';
import { createJobLogger } from '../../config/logger';
import { redisService } from '../../infrastructure/cache/redis.client';
import { RedisKeys, RedisTTL } from '../../infrastructure/cache/redis.keys';
import { EventProducer } from '../../infrastructure/messaging/event-producer';
import { PaymentTopics } from '../../infrastructure/messaging/event-topics';
import { TransactionHelper } from '../../infrastructure/db/transaction.helper';
import { PaymentMapper } from '../../infrastructure/payments/payment-mapper';

const JOB_NAME          = 'reconcile-payments';
const JOB_LOCK_TTL_SECS = 300;
const JOB_LOCK_TOKEN    = `${JOB_NAME}:${process.pid}`;
const BATCH_SIZE        = 50;
const STALE_MINUTES     = 30;

const logger = createJobLogger(JOB_NAME);

export type ReconcilePaymentsResult = {
  processed:  number;
  reconciled: number;
  failed:     number;
  skipped:    number;
};

export class ReconcilePaymentsJob {
  constructor(
    private readonly prisma:            PrismaClient,
    private readonly stripe:            Stripe,
    private readonly eventProducer:     EventProducer,
    private readonly transactionHelper: TransactionHelper,
  ) {}

  async run(): Promise<ReconcilePaymentsResult> {
    const result: ReconcilePaymentsResult = {
      processed:  0,
      reconciled: 0,
      failed:     0,
      skipped:    0,
    };

    const lockKey = RedisKeys.lock.reconcileJob();
    const acquired = await redisService.acquireLock(
      lockKey,
      JOB_LOCK_TTL_SECS,
      JOB_LOCK_TOKEN,
    );

    if (!acquired) {
      logger.warn('Job already running on another instance — skipping');
      return result;
    }

    logger.info('Job started');
    const start = Date.now();

    try {
      const stalePayments = await this.fetchStalePayments();

      result.processed = stalePayments.length;

      if (stalePayments.length === 0) {
        logger.info('No stale payments found');
        return result;
      }

      logger.info('Stale payments found', { count: stalePayments.length });

      for (const payment of stalePayments) {
        try {
          const reconciled = await this.reconcilePayment(payment);

          if (reconciled) {
            result.reconciled++;
          } else {
            result.skipped++;
          }
        } catch (error) {
          result.failed++;
          const message = error instanceof Error ? error.message : String(error);
          logger.error('Failed to reconcile payment', {
            paymentId: payment.id,
            error:     message,
          });
        }
      }

      logger.info('Job completed', {
        ...result,
        durationMs: Date.now() - start,
      });

      return result;
    } finally {
      await redisService.releaseLock(lockKey, JOB_LOCK_TOKEN);
    }
  }

  private async fetchStalePayments() {
    const cutoff = new Date(Date.now() - STALE_MINUTES * 60 * 1000);

    return this.prisma.payment.findMany({
      where: {
        status: { in: [PaymentStatus.PENDING, PaymentStatus.PROCESSING] },
        stripePaymentIntentId: { not: null },
        updatedAt: { lt: cutoff },
        deletedAt: null,
      },
      select: {
        id:                     true,
        stripePaymentIntentId:  true,
        amount:                 true,
        currency:               true,
        status:                 true,
        orderId:                true,
      },
      take: BATCH_SIZE,
      orderBy: { updatedAt: 'asc' },
    });
  }

  private async reconcilePayment(payment: {
    id:                    string;
    stripePaymentIntentId: string | null;
    amount:                unknown;
    currency:              string;
    status:                PaymentStatus;
    orderId:               string;
  }): Promise<boolean> {
    if (!payment.stripePaymentIntentId) return false;

    const intent = await this.stripe.paymentIntents.retrieve(
      payment.stripePaymentIntentId,
    );

    const internalStatus = PaymentMapper.stripeStatusToInternal(intent.status);

    if (internalStatus === payment.status) {
      logger.debug('Payment already in sync — skipping', {
        paymentId: payment.id,
        status:    payment.status,
      });
      return false;
    }

    await this.transactionHelper.run(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status:    internalStatus,
          updatedAt: new Date(),
        },
      });

      if (internalStatus === PaymentStatus.SUCCEEDED) {
        await tx.order.update({
          where: { id: payment.orderId },
          data: {
            status:    OrderStatus.PAID,
            updatedAt: new Date(),
          },
        });
      }

      if (
        internalStatus === PaymentStatus.FAILED ||
        internalStatus === PaymentStatus.CANCELLED
      ) {
        await tx.order.update({
          where: { id: payment.orderId },
          data: {
            status:    OrderStatus.PAYMENT_FAILED,
            updatedAt: new Date(),
          },
        });
      }
    });

    await redisService.del(
      RedisKeys.payment.byId(payment.id),
      RedisKeys.payment.byIntent(payment.stripePaymentIntentId),
      RedisKeys.order.byId(payment.orderId),
      RedisKeys.order.status(payment.orderId),
    );

    await this.eventProducer.publish(PaymentTopics.PROCESSING, {
      paymentIntentId: payment.stripePaymentIntentId,
      paymentId:       payment.id,
      orderId:         payment.orderId,
      previousStatus:  payment.status,
      newStatus:       internalStatus,
      reconciledAt:    new Date().toISOString(),
      timestamp:       new Date().toISOString(),
    });

    logger.info('Payment reconciled', {
      paymentId:      payment.id,
      previousStatus: payment.status,
      newStatus:      internalStatus,
      orderId:        payment.orderId,
    });

    return true;
  }
}