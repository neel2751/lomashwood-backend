import { prisma } from '../infrastructure/db/prisma.client';
import { deleteCacheByPattern } from '../infrastructure/cache/redis.client';
import { REDIS_KEYS } from '../infrastructure/cache/redis.keys';
import { eventProducer } from '../infrastructure/messaging/event-producer';
import { CUSTOMER_EVENT_TOPICS } from '../infrastructure/messaging/event-topics';
import { logger } from '../config/logger';

const BATCH_SIZE = 100;

export interface SyncCustomerDataResult {
  total: number;
  synced: number;
  cacheInvalidated: number;
  errors: number;
  durationMs: number;
}

export async function syncCustomerDataJob(
  since?: Date,
): Promise<SyncCustomerDataResult> {
  const startTime = Date.now();
  const jobLogger = logger.child({ job: 'sync-customer-data' });
  const syncSince = since ?? new Date(Date.now() - 24 * 60 * 60 * 1000);

  jobLogger.info({ since: syncSince.toISOString() }, 'Starting sync-customer-data job');

  let total = 0;
  let synced = 0;
  let cacheInvalidated = 0;
  let errors = 0;
  let cursor: string | undefined;

  do {
    const customers = await prisma.customer.findMany({
      where: {
        updatedAt: { gte: syncSince },
        deletedAt: null,
      },
      select: {
        id: true,
        userId: true,
        email: true,
        updatedAt: true,
        loyaltyAccount: { select: { tier: true, pointsBalance: true } },
      },
      take: BATCH_SIZE,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { id: 'asc' },
    });

    if (customers.length === 0) break;

    total += customers.length;
    cursor = customers[customers.length - 1]!.id;

    for (const customer of customers) {
      try {
        await deleteCacheByPattern(REDIS_KEYS.customer.pattern());
        await deleteCacheByPattern(REDIS_KEYS.loyalty.pattern(customer.id));
        cacheInvalidated++;

        await eventProducer.publish(
          CUSTOMER_EVENT_TOPICS.PROFILE_UPDATED,
          {
            customerId: customer.id,
            updatedFields: ['sync'],
            updatedAt: customer.updatedAt.toISOString(),
          },
          { customerId: customer.id, userId: customer.userId },
        );

        synced++;
      } catch (error) {
        errors++;
        jobLogger.error(
          { customerId: customer.id, error: (error as Error).message },
          'Failed to sync customer',
        );
      }
    }

    jobLogger.debug(
      { batchSize: customers.length, total, synced },
      'Processed customer sync batch',
    );

    if (customers.length < BATCH_SIZE) break;
  } while (true);

  const result: SyncCustomerDataResult = {
    total,
    synced,
    cacheInvalidated,
    errors,
    durationMs: Date.now() - startTime,
  };

  jobLogger.info(result, 'sync-customer-data job completed');
  return result;
}