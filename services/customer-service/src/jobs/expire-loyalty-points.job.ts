import { prisma } from '../infrastructure/db/prisma.client';
import { LoyaltyRepository } from '../app/loyalty/loyalty.repository';
import { LoyaltyService } from '../app/loyalty/loyalty.service';
import { eventProducer } from '../infrastructure/messaging/event-producer';
import { CUSTOMER_EVENT_TOPICS } from '../infrastructure/messaging/event-topics';
import { logger } from '../config/logger';

const loyaltyRepository = new LoyaltyRepository(prisma);
const loyaltyService = new LoyaltyService(loyaltyRepository);

export interface ExpireLoyaltyPointsResult {
  processed: number;
  expired: number;
  errors: number;
  durationMs: number;
}

export async function expireLoyaltyPointsJob(): Promise<ExpireLoyaltyPointsResult> {
  const startTime = Date.now();
  const jobLogger = logger.child({ job: 'expire-loyalty-points' });

  jobLogger.info('Starting expire-loyalty-points job');

  let processed = 0;
  let expired = 0;
  let errors = 0;

  try {
    const expiringTransactions = await loyaltyRepository.findExpiringTransactions(new Date());

    const accountGroups = groupByAccountId(expiringTransactions);
    const accountIds = Object.keys(accountGroups);

    jobLogger.info({ accounts: accountIds.length, transactions: expiringTransactions.length }, 'Found expiring transactions');

    for (const accountId of accountIds) {
      processed++;

      try {
        const account = await loyaltyRepository.findAccountById(accountId);
        if (!account) continue;

        const transactions = accountGroups[accountId]!;
        const totalExpiring = transactions.reduce((sum, t) => sum + Math.abs(t.points), 0);
        const pointsToExpire = Math.min(totalExpiring, account.pointsBalance);

        if (pointsToExpire <= 0) continue;

        const result = await loyaltyRepository.expirePoints(
          accountId,
          pointsToExpire,
          `${pointsToExpire} points expired`,
        );

        await eventProducer.publish(
          CUSTOMER_EVENT_TOPICS.LOYALTY_POINTS_EXPIRED,
          {
            accountId,
            customerId: account.customerId,
            transactionId: result.transaction.id,
            points: pointsToExpire,
            newBalance: result.account.pointsBalance,
            description: result.transaction.description,
          },
          { customerId: account.customerId },
        );

        expired++;

        jobLogger.debug(
          { accountId, customerId: account.customerId, pointsExpired: pointsToExpire },
          'Points expired for account',
        );
      } catch (error) {
        errors++;
        jobLogger.error(
          { accountId, error: (error as Error).message },
          'Failed to expire points for account',
        );
      }
    }
  } catch (error) {
    jobLogger.error({ error: (error as Error).message }, 'expire-loyalty-points job failed');
    throw error;
  }

  const result: ExpireLoyaltyPointsResult = {
    processed,
    expired,
    errors,
    durationMs: Date.now() - startTime,
  };

  jobLogger.info(result, 'expire-loyalty-points job completed');
  return result;
}

function groupByAccountId(
  transactions: Array<{ accountId: string; points: number }>,
): Record<string, Array<{ accountId: string; points: number }>> {
  return transactions.reduce(
    (acc, t) => {
      if (!acc[t.accountId]) acc[t.accountId] = [];
      acc[t.accountId]!.push(t);
      return acc;
    },
    {} as Record<string, Array<{ accountId: string; points: number }>>,
  );
}