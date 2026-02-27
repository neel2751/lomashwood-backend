import cron from 'node-cron';
import { PrismaClient, OrderStatus, PaymentStatus } from '@prisma/client';
import { EventProducer } from '../infrastructure/messaging/event-producer';
import { ORDER_ABANDONED_TOPIC } from '../infrastructure/messaging/event-topics';
import { createLogger } from '../config/logger';
import { AppError } from '../shared/errors';
import { ABANDONED_CHECKOUT_CONSTANTS } from '../shared/constants';

const logger = createLogger('close-abandoned-checkouts.job');

interface AbandonedCheckoutJobDependencies {
  prisma: PrismaClient;
  eventProducer: EventProducer;
}

interface AbandonedCheckoutResult {
  processedCount: number;
  closedCount: number;
  errorCount: number;
  skippedCount: number;
  executionTimeMs: number;
}


export class CloseAbandonedCheckoutsJob {
  private readonly prisma: PrismaClient;
  private readonly eventProducer: EventProducer;
  private cronJob: cron.ScheduledTask | null = null;

  constructor({ prisma, eventProducer }: AbandonedCheckoutJobDependencies) {
    this.prisma = prisma;
    this.eventProducer = eventProducer;
  }

  public start(): void {
    if (this.cronJob) {
      logger.warn('CloseAbandonedCheckoutsJob is already running');
      return;
    }

    // Every 15 minutes
    this.cronJob = cron.schedule('*/15 * * * *', async () => {
      await this.execute();
    });

    logger.info('CloseAbandonedCheckoutsJob scheduled — runs every 15 minutes');
  }

  public stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      logger.info('CloseAbandonedCheckoutsJob stopped');
    }
  }

  public async execute(): Promise<AbandonedCheckoutResult> {
    const startTime = Date.now();
    const result: AbandonedCheckoutResult = {
      processedCount: 0,
      closedCount: 0,
      errorCount: 0,
      skippedCount: 0,
      executionTimeMs: 0,
    };

    logger.info('Starting CloseAbandonedCheckoutsJob execution');

    try {
      const thresholdDate = this.getAbandonedThresholdDate();

      const abandonedOrders = await this.fetchAbandonedOrders(thresholdDate);
      result.processedCount = abandonedOrders.length;

      if (abandonedOrders.length === 0) {
        logger.info('No abandoned checkouts found');
        result.executionTimeMs = Date.now() - startTime;
        return result;
      }

      logger.info(`Found ${abandonedOrders.length} potentially abandoned checkouts`);

      for (const order of abandonedOrders) {
        try {
          const closed = await this.processAbandonedOrder(order);
          if (closed) {
            result.closedCount++;
          } else {
            result.skippedCount++;
          }
        } catch (err) {
          result.errorCount++;
          logger.error(
            { orderId: order.id, error: err },
            'Failed to process abandoned order',
          );
        }
      }

      result.executionTimeMs = Date.now() - startTime;

      logger.info(
        {
          processedCount: result.processedCount,
          closedCount: result.closedCount,
          skippedCount: result.skippedCount,
          errorCount: result.errorCount,
          executionTimeMs: result.executionTimeMs,
        },
        'CloseAbandonedCheckoutsJob execution complete',
      );

      return result;
    } catch (err) {
      result.executionTimeMs = Date.now() - startTime;
      logger.error({ error: err }, 'CloseAbandonedCheckoutsJob failed with unexpected error');
      throw new AppError(
        'ABANDONED_CHECKOUT_JOB_FAILED',
        'CloseAbandonedCheckoutsJob encountered a fatal error',
        500,
        { cause: err },
      );
    }
  }


  private getAbandonedThresholdDate(): Date {
    const thresholdMinutes =
      ABANDONED_CHECKOUT_CONSTANTS.ABANDON_THRESHOLD_MINUTES ?? 30;
    const thresholdDate = new Date();
    thresholdDate.setMinutes(thresholdDate.getMinutes() - thresholdMinutes);
    return thresholdDate;
  }

  private async fetchAbandonedOrders(thresholdDate: Date) {
    return this.prisma.order.findMany({
      where: {
        status: {
          in: [OrderStatus.PENDING, OrderStatus.AWAITING_PAYMENT],
        },
        createdAt: {
          lte: thresholdDate,
        },
        deletedAt: null,
        isAbandoned: false,
      },
      include: {
        payment: true,
        orderItems: true,
        customer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: ABANDONED_CHECKOUT_CONSTANTS.BATCH_SIZE ?? 100,
    });
  }

  private async processAbandonedOrder(order: Awaited<ReturnType<typeof this.fetchAbandonedOrders>>[number]): Promise<boolean> {
    const logCtx = { orderId: order.id, customerId: order.customerId };

    // Guard: re-check inside transaction to avoid race conditions
    return this.prisma.$transaction(async (tx) => {
      const freshOrder = await tx.order.findUnique({
        where: { id: order.id },
        select: {
          id: true,
          status: true,
          isAbandoned: true,
          payment: {
            select: {
              id: true,
              stripePaymentIntentId: true,
              status: true,
            },
          },
        },
      });

      if (!freshOrder) {
        logger.warn(logCtx, 'Order no longer exists — skipping');
        return false;
      }

      if (
        freshOrder.isAbandoned ||
        ![OrderStatus.PENDING, OrderStatus.AWAITING_PAYMENT].includes(
          freshOrder.status as OrderStatus,
        )
      ) {
        logger.info(logCtx, 'Order status changed before processing — skipping');
        return false;
      }

      // Mark order as abandoned
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.ABANDONED,
          isAbandoned: true,
          abandonedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Void associated payment record if still open
      if (
        freshOrder.payment &&
        freshOrder.payment.status === PaymentStatus.PENDING
      ) {
        await tx.payment.update({
          where: { id: freshOrder.payment.id },
          data: {
            status: PaymentStatus.VOIDED,
            updatedAt: new Date(),
          },
        });
      }

      // Restore stock for each line item
      for (const item of order.orderItems) {
        await tx.inventoryReservation.deleteMany({
          where: {
            orderId: order.id,
            productId: item.productId,
          },
        });
      }

      logger.info(logCtx, 'Order marked as abandoned and inventory reservations released');

      return true;
    }).then(async (closed) => {
      if (closed) {
        await this.emitAbandonedEvent(order);
      }
      return closed;
    });
  }

  private async emitAbandonedEvent(
    order: Awaited<ReturnType<typeof this.fetchAbandonedOrders>>[number],
  ): Promise<void> {
    try {
      await this.eventProducer.publish(ORDER_ABANDONED_TOPIC, {
        eventType: 'ORDER_ABANDONED',
        orderId: order.id,
        customerId: order.customerId,
        customerEmail: order.customer?.email ?? null,
        customerName: order.customer
          ? `${order.customer.firstName} ${order.customer.lastName}`.trim()
          : null,
        orderTotal: order.totalAmount,
        currency: order.currency,
        itemCount: order.orderItems.length,
        abandonedAt: new Date().toISOString(),
        originalCreatedAt: order.createdAt.toISOString(),
        stripePaymentIntentId: order.payment?.stripePaymentIntentId ?? null,
        metadata: {
          source: 'close-abandoned-checkouts-job',
          jobRunAt: new Date().toISOString(),
        },
      });
    } catch (err) {
      // Non-fatal: log but do not re-throw — the order is already marked abandoned
      logger.error(
        { orderId: order.id, error: err },
        'Failed to emit order-abandoned event; order state is still persisted correctly',
      );
    }
  }
}

export function createCloseAbandonedCheckoutsJob(
  deps: AbandonedCheckoutJobDependencies,
): CloseAbandonedCheckoutsJob {
  return new CloseAbandonedCheckoutsJob(deps);
}