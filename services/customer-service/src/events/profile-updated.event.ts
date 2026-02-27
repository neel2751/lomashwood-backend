import { eventProducer } from '../infrastructure/messaging/event-producer';
import { CUSTOMER_EVENT_TOPICS } from '../infrastructure/messaging/event-topics';
import { ProfileUpdatedPayload } from '../infrastructure/messaging/event-metadata';
import { deleteCacheByPattern } from '../infrastructure/cache/redis.client';
import { REDIS_KEYS } from '../infrastructure/cache/redis.keys';
import { logger } from '../config/logger';

export interface ProfileUpdatedEventOptions {
  correlationId?: string;
  userId?: string;
}

export async function publishProfileUpdatedEvent(
  customerId: string,
  updatedFields: string[],
  options: ProfileUpdatedEventOptions = {},
): Promise<void> {
  const payload: ProfileUpdatedPayload = {
    customerId,
    updatedFields,
    updatedAt: new Date().toISOString(),
  };

  try {
    await Promise.all([
      eventProducer.publish(
        CUSTOMER_EVENT_TOPICS.PROFILE_UPDATED,
        payload,
        {
          customerId,
          correlationId: options.correlationId,
          userId: options.userId,
        },
      ),
      invalidateProfileCache(customerId),
    ]);

    logger.debug(
      { customerId, updatedFields },
      'profile-updated event published',
    );
  } catch (error) {
    logger.error(
      { customerId, error: (error as Error).message },
      'Failed to publish profile-updated event',
    );
    throw error;
  }
}

async function invalidateProfileCache(customerId: string): Promise<void> {
  await Promise.all([
    deleteCacheByPattern(REDIS_KEYS.customer.pattern()),
    deleteCacheByPattern(REDIS_KEYS.profile.pattern(customerId)),
    deleteCacheByPattern(REDIS_KEYS.notificationPreference.byCustomerId(customerId)),
  ]);
}