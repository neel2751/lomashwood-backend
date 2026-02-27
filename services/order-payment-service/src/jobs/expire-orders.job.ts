import { PrismaClient, OrderStatus } from '@prisma/client';
import { createJobLogger } from '../../config/logger';
import { redisService } from '../../infrastructure/cache/redis.client';
import { RedisKeys } from '../../infrastructure/cache/redis.keys';
import { EventProducer } from '../../infrastructure/messaging/event-producer';
import { OrderTopics } from '../../infrastructure/messaging/event-topics';
import { TransactionHelper } from '../../infrastructure/db/transaction.helper';

const JOB_NAME           = 'expire-orders';
const JOB_LOCK_TTL_SECS  = 120;
const JOB_LOCK_TOKEN     = `${JOB_NAME}:${process.pid}`;
const BATCH_SIZE         = 100;
const ORDER_EXPIRY_MINS  = 30;

const logger = createJobLogger(JOB_NAME);

export type ExpireOrdersResult = {
  processed: number;
  expired:   number;
  failed:    number;
};

export class ExpireOrdersJob {
  constructor(
    private readonly prisma:            PrismaClient,
    private readonly eventProducer:     EventProducer,
    private readonly transactionHelper: TransactionHelper,
  ) {}

  async run(): Promise<ExpireOrdersResult> {
    const result: ExpireOrdersResult = {
      processed: 0,
      expired:   0,
      failed:    0,
    };

    const lockKey  = RedisKeys.lock.expireOrdersJob();
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
      const orders = await this.fetchExpirableOrders();

      result.processed = orders.length;

      if (orders.length === 0) {
        logger.info('No expirable orders found');
        return result;
      }

      logger.info('Expirable orders found', { count: orders.length });

      for (const order of orders) {
        try {
          await this.expireOrder(order);
          result.expired++;
        } catch (error) {
          result.failed++;
          const message = error instanceof Error ? error.message : String(error);
          logger.error('Failed to expire order', {
            orderId: order.id,
            error:   message,
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

  private async fetchExpirableOrders() {
    const cutoff = new Date(Date.now() - ORDER_EXPIRY_MINS * 60 * 1000);

    return this.prisma.order.findMany({
      where: {
        status:    OrderStatus.PENDING,
        createdAt: { lt: cutoff },
        deletedAt: null,
      },
      select: {
        id:          true,
        orderNumber: true,
        customerId:  true,
        createdAt:   true,
      },
      take:    BATCH_SIZE,
      orderBy: { createdAt: 'asc' },
    });
  }

  private async expireOrder(order: {
    id:          string;
    orderNumber: string;
    customerId:  string;
    createdAt:   Date;
  }): Promise<void> {
    await this.transactionHelper.run(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: {
          status:    OrderStatus.EXPIRED,
          updatedAt: new Date(),
        },
      });
    });

    await redisService.del(
      RedisKeys.order.byId(order.id),
      RedisKeys.order.status(order.id),
      RedisKeys.order.eligibility(order.id),
      RedisKeys.order.summary(order.id),
      RedisKeys.order.list(order.customerId),
    );

    await this.eventProducer.publish(OrderTopics.EXPIRED, {
      orderId:     order.id,
      orderNumber: order.orderNumber,
      customerId:  order.customerId,
      expiredAt:   new Date().toISOString(),
      timestamp:   new Date().toISOString(),
    });

    logger.info('Order expired', {
      orderId:     order.id,
      orderNumber: order.orderNumber,
      customerId:  order.customerId,
      ageMs:       Date.now() - order.createdAt.getTime(),
    });
  }
}