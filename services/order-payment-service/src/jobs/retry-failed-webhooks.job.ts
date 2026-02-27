import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import { createJobLogger } from '../../config/logger';
import { redisService } from '../../infrastructure/cache/redis.client';
import { RedisKeys } from '../../infrastructure/cache/redis.keys';
import { EventProducer } from '../../infrastructure/messaging/event-producer';
import { WebhookTopics } from '../../infrastructure/messaging/event-topics';
import { TransactionHelper } from '../../infrastructure/db/transaction.helper';

const JOB_NAME          = 'retry-failed-webhooks';
const JOB_LOCK_TTL_SECS = 120;
const JOB_LOCK_TOKEN    = `${JOB_NAME}:${process.pid}`;
const BATCH_SIZE        = 50;
const MAX_RETRIES       = 5;
const BASE_BACKOFF_MS   = 60_000;

const logger = createJobLogger(JOB_NAME);

export type RetryFailedWebhooksResult = {
  processed: number;
  retried:   number;
  succeeded: number;
  failed:    number;
  exhausted: number;
};

export class RetryFailedWebhooksJob {
  constructor(
    private readonly prisma:            PrismaClient,
    private readonly stripe:            Stripe,
    private readonly eventProducer:     EventProducer,
    private readonly transactionHelper: TransactionHelper,
  ) {}

  async run(): Promise<RetryFailedWebhooksResult> {
    const result: RetryFailedWebhooksResult = {
      processed: 0,
      retried:   0,
      succeeded: 0,
      failed:    0,
      exhausted: 0,
    };

    const lockKey  = RedisKeys.lock.retryWebhooksJob();
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
      const pending = await this.fetchPendingRetries();

      result.processed = pending.length;

      if (pending.length === 0) {
        logger.info('No failed webhooks pending retry');
        return result;
      }

      logger.info('Failed webhooks found for retry', { count: pending.length });

      for (const webhook of pending) {
        try {
          if (webhook.retryCount >= MAX_RETRIES) {
            await this.markExhausted(webhook);
            result.exhausted++;
            continue;
          }

          if (!this.isEligibleForRetry(webhook)) {
            result.failed++;
            continue;
          }

          result.retried++;
          const success = await this.retryWebhook(webhook);

          if (success) {
            result.succeeded++;
          } else {
            result.failed++;
          }
        } catch (error) {
          result.failed++;
          const message = error instanceof Error ? error.message : String(error);
          logger.error('Retry attempt threw an error', {
            webhookId: webhook.id,
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

  private async fetchPendingRetries() {
    return this.prisma.webhookEvent.findMany({
      where: {
        processed:  false,
        retryCount: { lt: MAX_RETRIES },
        deletedAt:  null,
      },
      select: {
        id:          true,
        provider:    true,
        eventId:     true,
        eventType:   true,
        payload:     true,
        retryCount:  true,
        lastRetriedAt: true,
        failureReason: true,
        createdAt:   true,
      },
      take:    BATCH_SIZE,
      orderBy: { createdAt: 'asc' },
    });
  }

  private isEligibleForRetry(webhook: {
    retryCount:    number;
    lastRetriedAt: Date | null;
  }): boolean {
    if (!webhook.lastRetriedAt) return true;

    const backoffMs   = BASE_BACKOFF_MS * Math.pow(2, webhook.retryCount - 1);
    const nextRetryAt = webhook.lastRetriedAt.getTime() + backoffMs;

    return Date.now() >= nextRetryAt;
  }

  private async retryWebhook(webhook: {
    id:          string;
    provider:    string;
    eventId:     string;
    eventType:   string;
    payload:     unknown;
    retryCount:  number;
    failureReason: string | null;
  }): Promise<boolean> {
    logger.info('Retrying webhook', {
      webhookId:  webhook.id,
      eventId:    webhook.eventId,
      eventType:  webhook.eventType,
      attempt:    webhook.retryCount + 1,
    });

    try {
      if (webhook.provider === 'stripe') {
        await this.reprocessStripeEvent(webhook.eventId);
      }

      await this.transactionHelper.run(async (tx) => {
        await tx.webhookEvent.update({
          where: { id: webhook.id },
          data: {
            processed:     true,
            retryCount:    { increment: 1 },
            lastRetriedAt: new Date(),
            failureReason: null,
            updatedAt:     new Date(),
          },
        });
      });

      await this.eventProducer.publish(WebhookTopics.PROCESSED, {
        provider:  webhook.provider,
        eventId:   webhook.eventId,
        eventType: webhook.eventType,
        timestamp: new Date().toISOString(),
      });

      logger.info('Webhook retry succeeded', {
        webhookId: webhook.id,
        eventId:   webhook.eventId,
      });

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      await this.transactionHelper.run(async (tx) => {
        await tx.webhookEvent.update({
          where: { id: webhook.id },
          data: {
            retryCount:    { increment: 1 },
            lastRetriedAt: new Date(),
            failureReason: message,
            updatedAt:     new Date(),
          },
        });
      });

      await this.eventProducer.publish(WebhookTopics.RETRYING, {
        provider:   webhook.provider,
        eventId:    webhook.eventId,
        eventType:  webhook.eventType,
        attempt:    webhook.retryCount + 1,
        error:      message,
        timestamp:  new Date().toISOString(),
      });

      logger.warn('Webhook retry failed', {
        webhookId: webhook.id,
        eventId:   webhook.eventId,
        attempt:   webhook.retryCount + 1,
        error:     message,
      });

      return false;
    }
  }

  private async reprocessStripeEvent(eventId: string): Promise<void> {
    const event = await this.stripe.events.retrieve(eventId);

    if (!event) {
      throw new Error(`Stripe event ${eventId} not found`);
    }

    logger.debug('Stripe event retrieved for reprocessing', {
      eventId,
      type: event.type,
    });
  }

  private async markExhausted(webhook: {
    id:        string;
    eventId:   string;
    eventType: string;
    provider:  string;
    retryCount: number;
    failureReason: string | null;
  }): Promise<void> {
    await this.transactionHelper.run(async (tx) => {
      await tx.webhookEvent.update({
        where: { id: webhook.id },
        data: {
          exhausted:  true,
          updatedAt:  new Date(),
        },
      });
    });

    await this.eventProducer.publish(WebhookTopics.DEAD_LETTERED, {
      provider:  webhook.provider,
      eventId:   webhook.eventId,
      eventType: webhook.eventType,
      attempts:  webhook.retryCount,
      lastError: webhook.failureReason ?? 'Unknown',
      timestamp: new Date().toISOString(),
    });

    logger.error('Webhook retries exhausted — dead lettered', {
      webhookId:  webhook.id,
      eventId:    webhook.eventId,
      eventType:  webhook.eventType,
      retryCount: webhook.retryCount,
    });
  }
}