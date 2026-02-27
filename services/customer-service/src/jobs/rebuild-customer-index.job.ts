import { prisma } from '../infrastructure/db/prisma.client';
import { redis } from '../infrastructure/cache/redis.client';
import { REDIS_KEYS, REDIS_TTL } from '../infrastructure/cache/redis.keys';
import { logger } from '../config/logger';

const BATCH_SIZE = 200;
const PIPELINE_CHUNK_SIZE = 50;

export interface RebuildCustomerIndexResult {
  total: number;
  indexed: number;
  errors: number;
  durationMs: number;
}

export async function rebuildCustomerIndexJob(): Promise<RebuildCustomerIndexResult> {
  const startTime = Date.now();
  const jobLogger = logger.child({ job: 'rebuild-customer-index' });

  jobLogger.info('Starting rebuild-customer-index job');

  let total = 0;
  let indexed = 0;
  let errors = 0;
  let cursor: string | undefined;

  do {
    const customers = await prisma.customer.findMany({
      where: { deletedAt: null, isActive: true },
      select: {
        id: true,
        userId: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        createdAt: true,
        loyaltyAccount: {
          select: { tier: true, pointsBalance: true },
        },
      },
      take: BATCH_SIZE,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { id: 'asc' },
    });

    if (customers.length === 0) break;

    total += customers.length;
    cursor = customers[customers.length - 1]!.id;

    const chunks = chunkArray(customers, PIPELINE_CHUNK_SIZE);

    for (const chunk of chunks) {
      const pipeline = redis.pipeline();

      for (const customer of chunk) {
        try {
          const cachePayload = JSON.stringify({
            id: customer.id,
            userId: customer.userId,
            email: customer.email,
            firstName: customer.firstName,
            lastName: customer.lastName,
            isActive: customer.isActive,
            loyalty: customer.loyaltyAccount
              ? {
                  tier: customer.loyaltyAccount.tier,
                  pointsBalance: customer.loyaltyAccount.pointsBalance,
                }
              : null,
          });

          pipeline.setex(
            REDIS_KEYS.customer.byId(customer.id),
            REDIS_TTL.CUSTOMER,
            cachePayload,
          );

          pipeline.setex(
            REDIS_KEYS.customer.byUserId(customer.userId),
            REDIS_TTL.CUSTOMER,
            cachePayload,
          );

          pipeline.setex(
            REDIS_KEYS.customer.byEmail(customer.email),
            REDIS_TTL.CUSTOMER,
            cachePayload,
          );

          indexed++;
        } catch (error) {
          errors++;
          jobLogger.error(
            { customerId: customer.id, error: (error as Error).message },
            'Failed to build cache entry for customer',
          );
        }
      }

      try {
        await pipeline.exec();
      } catch (error) {
        errors += chunk.length;
        jobLogger.error(
          { error: (error as Error).message, chunkSize: chunk.length },
          'Pipeline execution failed',
        );
      }
    }

    jobLogger.debug(
      { batchSize: customers.length, total, indexed },
      'Processed rebuild-customer-index batch',
    );

    if (customers.length < BATCH_SIZE) break;
  } while (true);

  const result: RebuildCustomerIndexResult = {
    total,
    indexed,
    errors,
    durationMs: Date.now() - startTime,
  };

  jobLogger.info(result, 'rebuild-customer-index job completed');
  return result;
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}