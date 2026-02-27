import { eventProducer } from '../infrastructure/messaging/event-producer';
import { CUSTOMER_EVENT_TOPICS } from '../infrastructure/messaging/event-topics';
import { ReviewCreatedPayload } from '../infrastructure/messaging/event-metadata';
import { deleteCacheByPattern } from '../infrastructure/cache/redis.client';
import { REDIS_KEYS } from '../infrastructure/cache/redis.keys';
import { LoyaltyRepository } from '../app/loyalty/loyalty.repository';
import { LoyaltyService } from '../app/loyalty/loyalty.service';
import { LOYALTY_POINTS_RULES } from '../app/loyalty/loyalty.constants';
import { prisma } from '../infrastructure/db/prisma.client';
import { logger } from '../config/logger';

const loyaltyRepository = new LoyaltyRepository(prisma);
const loyaltyService = new LoyaltyService(loyaltyRepository);

export interface ReviewCreatedEventOptions {
  correlationId?: string;
  userId?: string;
  awardLoyaltyPoints?: boolean;
}

export async function publishReviewCreatedEvent(
  review: {
    id: string;
    customerId: string;
    productId: string;
    rating: number;
    status: string;
  },
  options: ReviewCreatedEventOptions = {},
): Promise<void> {
  const payload: ReviewCreatedPayload = {
    reviewId: review.id,
    customerId: review.customerId,
    productId: review.productId,
    rating: review.rating,
    status: review.status,
    createdAt: new Date().toISOString(),
  };

  try {
    const tasks: Promise<unknown>[] = [
      eventProducer.publish(
        CUSTOMER_EVENT_TOPICS.REVIEW_CREATED,
        payload,
        {
          customerId: review.customerId,
          correlationId: options.correlationId,
          userId: options.userId,
        },
      ),
      invalidateReviewCache(review.customerId, review.productId),
    ];

    if (options.awardLoyaltyPoints !== false) {
      tasks.push(
        awardReviewPoints(review.customerId, review.id).catch((err) => {
          logger.warn(
            { customerId: review.customerId, error: err.message },
            'Failed to award loyalty points for review, non-critical',
          );
        }),
      );
    }

    await Promise.all(tasks);

    logger.debug(
      { reviewId: review.id, customerId: review.customerId },
      'review-created event published',
    );
  } catch (error) {
    logger.error(
      { reviewId: review.id, error: (error as Error).message },
      'Failed to publish review-created event',
    );
    throw error;
  }
}

async function awardReviewPoints(customerId: string, reviewId: string): Promise<void> {
  const points = LOYALTY_POINTS_RULES.REVIEW_REWARD;

  const result = await loyaltyService.earnPoints({
    customerId,
    points,
    description: `Points awarded for submitting a review`,
    reference: reviewId,
  });

  await eventProducer.publish(
    CUSTOMER_EVENT_TOPICS.LOYALTY_POINTS_EARNED,
    {
      accountId: result.account.id,
      customerId,
      transactionId: result.transaction.id,
      points,
      newBalance: result.account.pointsBalance,
      tier: result.account.tier,
      description: result.transaction.description,
      reference: reviewId,
    },
    { customerId },
  );
}

async function invalidateReviewCache(customerId: string, productId: string): Promise<void> {
  await Promise.all([
    deleteCacheByPattern(REDIS_KEYS.review.pattern(productId)),
    deleteCacheByPattern(REDIS_KEYS.review.byCustomer(customerId)),
    deleteCacheByPattern(REDIS_KEYS.review.stats(productId)),
  ]);
}