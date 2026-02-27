import { prisma } from '../infrastructure/db/prisma.client';
import { deleteCacheByPattern } from '../infrastructure/cache/redis.client';
import { REDIS_KEYS } from '../infrastructure/cache/redis.keys';
import { eventProducer } from '../infrastructure/messaging/event-producer';
import { CUSTOMER_EVENT_TOPICS } from '../infrastructure/messaging/event-topics';
import { logger } from '../config/logger';

const INACTIVITY_THRESHOLD_DAYS = 730;
const BATCH_SIZE = 50;

export interface AnonymizeInactiveUsersResult {
  candidates: number;
  anonymized: number;
  skipped: number;
  errors: number;
  durationMs: number;
}

export async function anonymizeInactiveUsersJob(
  dryRun = false,
): Promise<AnonymizeInactiveUsersResult> {
  const startTime = Date.now();
  const jobLogger = logger.child({ job: 'anonymize-inactive-users', dryRun });

  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - INACTIVITY_THRESHOLD_DAYS);

  jobLogger.info(
    { thresholdDate: thresholdDate.toISOString(), dryRun },
    'Starting anonymize-inactive-users job',
  );

  let candidates = 0;
  let anonymized = 0;
  let skipped = 0;
  let errors = 0;
  let cursor: string | undefined;

  do {
    const inactiveCustomers = await prisma.customer.findMany({
      where: {
        updatedAt: { lte: thresholdDate },
        isActive: false,
        deletedAt: { not: null },
      },
      select: {
        id: true,
        userId: true,
        email: true,
        firstName: true,
        lastName: true,
        deletedAt: true,
      },
      take: BATCH_SIZE,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { id: 'asc' },
    });

    if (inactiveCustomers.length === 0) break;

    candidates += inactiveCustomers.length;
    cursor = inactiveCustomers[inactiveCustomers.length - 1]!.id;

    for (const customer of inactiveCustomers) {
      try {
        const hasActiveData = await hasActiveRelatedData(customer.id);

        if (hasActiveData) {
          skipped++;
          jobLogger.debug({ customerId: customer.id }, 'Skipping anonymization, active data found');
          continue;
        }

        if (dryRun) {
          jobLogger.info({ customerId: customer.id }, '[DRY RUN] Would anonymize customer');
          anonymized++;
          continue;
        }

        await prisma.$transaction(async (tx) => {
          const anonymizedEmail = `anonymized-${customer.id}@deleted.invalid`;
          const anonymizedName = 'Anonymized';

          await tx.customer.update({
            where: { id: customer.id },
            data: {
              email: anonymizedEmail,
              firstName: anonymizedName,
              lastName: 'User',
              phone: null,
              avatarUrl: null,
            },
          });

          await tx.customerProfile.updateMany({
            where: { customerId: customer.id },
            data: {
              dateOfBirth: null,
              gender: null,
              bio: null,
            },
          });

          await tx.customerAddress.updateMany({
            where: { customerId: customer.id },
            data: {
              line1: '[REDACTED]',
              line2: null,
              city: '[REDACTED]',
              county: null,
              postcode: '[REDACTED]',
            },
          });
        });

        await deleteCacheByPattern(REDIS_KEYS.customer.pattern());
        await deleteCacheByPattern(REDIS_KEYS.profile.pattern(customer.id));

        await eventProducer.publish(
          CUSTOMER_EVENT_TOPICS.PROFILE_DELETED,
          { customerId: customer.id, anonymizedAt: new Date().toISOString() },
          { customerId: customer.id },
        );

        anonymized++;

        jobLogger.info({ customerId: customer.id }, 'Customer anonymized');
      } catch (error) {
        errors++;
        jobLogger.error(
          { customerId: customer.id, error: (error as Error).message },
          'Failed to anonymize customer',
        );
      }
    }

    if (inactiveCustomers.length < BATCH_SIZE) break;
  } while (true);

  const result: AnonymizeInactiveUsersResult = {
    candidates,
    anonymized,
    skipped,
    errors,
    durationMs: Date.now() - startTime,
  };

  jobLogger.info(result, 'anonymize-inactive-users job completed');
  return result;
}

async function hasActiveRelatedData(customerId: string): Promise<boolean> {
  const [tickets, reviews] = await Promise.all([
    prisma.supportTicket.count({
      where: {
        customerId,
        status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_ON_CUSTOMER'] },
        deletedAt: null,
      },
    }),
    prisma.review.count({
      where: { customerId, status: 'PENDING', deletedAt: null },
    }),
  ]);

  return tickets > 0 || reviews > 0;
}