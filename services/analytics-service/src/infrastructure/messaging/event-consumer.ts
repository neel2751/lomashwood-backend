import { getRedisClient } from '../cache/redis.client';
import { logger } from '../../config/logger';
import { ANALYTICS_EVENT_TOPICS } from './event-topics';
import type { ConsumedEventEnvelope } from './event-metadata';

type EventHandler<T = unknown> = (envelope: ConsumedEventEnvelope<T>) => Promise<void>;

interface RegisteredHandler {
  topic: string;
  handler: EventHandler;
}

const handlers: RegisteredHandler[] = [];

export function registerEventHandler<T = unknown>(
  topic: string,
  handler: EventHandler<T>,
): void {
  handlers.push({ topic, handler: handler as EventHandler });
  logger.debug({ topic }, 'Event handler registered');
}

export async function startEventConsumer(): Promise<void> {
  const redis = getRedisClient();
  const subscriber = redis.duplicate();

  const topics = Object.values(ANALYTICS_EVENT_TOPICS.SUBSCRIBE);

  await subscriber.subscribe(...topics);

  logger.info({ topics }, 'Analytics event consumer subscribed to topics');

  subscriber.on('message', async (channel, message) => {
    const handler = handlers.find((h) => h.topic === channel);

    if (!handler) {
      logger.debug({ channel }, 'No handler registered for topic');
      return;
    }

    try {
      const envelope = JSON.parse(message) as ConsumedEventEnvelope;

      logger.debug(
        { topic: channel, eventId: envelope.metadata.eventId },
        'Event received',
      );

      await handler.handler(envelope);

      logger.debug(
        { topic: channel, eventId: envelope.metadata.eventId },
        'Event processed successfully',
      );
    } catch (error) {
      logger.error({ error, channel, message }, 'Event processing failed');
    }
  });

  subscriber.on('error', (err) => {
    logger.error({ error: err.message }, 'Event consumer subscriber error');
  });
}

export async function publishEvent<T = unknown>(
  topic: string,
  payload: T,
  metadata?: Partial<{ correlationId: string; userId: string }>,
): Promise<void> {
  const redis = getRedisClient();

  const envelope: ConsumedEventEnvelope<T> = {
    metadata: {
      eventId: crypto.randomUUID(),
      topic,
      service: 'analytics-service',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      correlationId: metadata?.correlationId,
      userId: metadata?.userId,
    },
    payload,
  };

  await redis.publish(topic, JSON.stringify(envelope));

  logger.debug({ topic, eventId: envelope.metadata.eventId }, 'Event published');
}