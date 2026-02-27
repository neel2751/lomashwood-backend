import { eventProducer } from '../infrastructure/messaging/event-producer';
import { CUSTOMER_EVENT_TOPICS } from '../infrastructure/messaging/event-topics';
import {
  LoyaltyPointsEarnedPayload,
  LoyaltyTierUpgradedPayload,
} from '../infrastructure/messaging/event-metadata';
import { deleteCacheByPattern } from '../infrastructure/cache/redis.client';
import { REDIS_KEYS } from '../infrastructure/cache/redis.keys';
import { LOYALTY_TIER_THRESHOLDS } from '../app/loyalty/loyalty.constants';
import { LoyaltyTier } from '../app/loyalty/loyalty.types';
import { logger } from '../config/logger';

export interface LoyaltyPointsEarnedEventOptions {
  correlationId?: string;
  userId?: string;
  previousTier?: LoyaltyTier;
}

export async function publishLoyaltyPointsEarnedEvent(
  data: {
    accountId: string;
    customerId: string;
    transactionId: string;
    points: number;
    newBalance: number;
    pointsEarned: number;
    tier: LoyaltyTier;
    description: string;
    reference?: string;
    expiresAt?: string;
  },
  options: LoyaltyPointsEarnedEventOptions = {},
): Promise<void> {
  const payload: LoyaltyPointsEarnedPayload = {
    accountId: data.accountId,
    customerId: data.customerId,
    transactionId: data.transactionId,
    points: data.points,
    newBalance: data.newBalance,
    tier: data.tier,
    description: data.description,
    reference: data.reference,
    expiresAt: data.expiresAt,
  };

  try {
    const tasks: Promise<unknown>[] = [
      eventProducer.publish(
        CUSTOMER_EVENT_TOPICS.LOYALTY_POINTS_EARNED,
        payload,
        {
          customerId: data.customerId,
          correlationId: options.correlationId,
          userId: options.userId,
        },
      ),
      invalidateLoyaltyCache(data.customerId),
    ];

    if (options.previousTier && didTierUpgrade(options.previousTier, data.tier, data.pointsEarned)) {
      tasks.push(
        publishTierUpgradedEvent(
          {
            accountId: data.accountId,
            customerId: data.customerId,
            previousTier: options.previousTier,
            newTier: data.tier,
            pointsEarned: data.pointsEarned,
          },
          { correlationId: options.correlationId, userId: options.userId },
        ),
      );
    }

    await Promise.all(tasks);

    logger.debug(
      {
        accountId: data.accountId,
        customerId: data.customerId,
        points: data.points,
        newBalance: data.newBalance,
        tier: data.tier,
      },
      'loyalty-points-earned event published',
    );
  } catch (error) {
    logger.error(
      { accountId: data.accountId, error: (error as Error).message },
      'Failed to publish loyalty-points-earned event',
    );
    throw error;
  }
}

export async function publishLoyaltyPointsRedeemedEvent(
  data: {
    accountId: string;
    customerId: string;
    transactionId: string;
    points: number;
    newBalance: number;
    description: string;
    reference?: string;
  },
  options: { correlationId?: string; userId?: string } = {},
): Promise<void> {
  try {
    await Promise.all([
      eventProducer.publish(
        CUSTOMER_EVENT_TOPICS.LOYALTY_POINTS_REDEEMED,
        data,
        { customerId: data.customerId, ...options },
      ),
      invalidateLoyaltyCache(data.customerId),
    ]);

    logger.debug(
      { accountId: data.accountId, points: data.points },
      'loyalty-points-redeemed event published',
    );
  } catch (error) {
    logger.error(
      { accountId: data.accountId, error: (error as Error).message },
      'Failed to publish loyalty-points-redeemed event',
    );
    throw error;
  }
}

async function publishTierUpgradedEvent(
  data: {
    accountId: string;
    customerId: string;
    previousTier: LoyaltyTier;
    newTier: LoyaltyTier;
    pointsEarned: number;
  },
  options: { correlationId?: string; userId?: string } = {},
): Promise<void> {
  const payload: LoyaltyTierUpgradedPayload = {
    accountId: data.accountId,
    customerId: data.customerId,
    previousTier: data.previousTier,
    newTier: data.newTier,
    pointsEarned: data.pointsEarned,
    upgradedAt: new Date().toISOString(),
  };

  await eventProducer.publish(
    CUSTOMER_EVENT_TOPICS.LOYALTY_TIER_UPGRADED,
    payload,
    { customerId: data.customerId, ...options },
  );

  logger.info(
    { customerId: data.customerId, from: data.previousTier, to: data.newTier },
    'Loyalty tier upgraded event published',
  );
}

function didTierUpgrade(
  previousTier: LoyaltyTier,
  currentTier: LoyaltyTier,
  pointsEarned: number,
): boolean {
  const tierOrder: LoyaltyTier[] = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];
  const previousIndex = tierOrder.indexOf(previousTier);
  const currentIndex = tierOrder.indexOf(currentTier);
  const thresholds = Object.values(LOYALTY_TIER_THRESHOLDS);
  return currentIndex > previousIndex && thresholds.some((t) => pointsEarned >= t);
}

async function invalidateLoyaltyCache(customerId: string): Promise<void> {
  await deleteCacheByPattern(REDIS_KEYS.loyalty.pattern(customerId));
}