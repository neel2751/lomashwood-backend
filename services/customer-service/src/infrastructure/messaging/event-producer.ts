import { redisPublisher } from '../cache/redis.client';
import { logger } from '../../config/logger';
import { CustomerEventTopic } from './event-topics';
import {
  DomainEvent,
  buildDomainEvent,
  EventMetadata,
} from './event-metadata';

export class EventProducer {
  private static instance: EventProducer;

  static getInstance(): EventProducer {
    if (!EventProducer.instance) {
      EventProducer.instance = new EventProducer();
    }
    return EventProducer.instance;
  }

  async publish<T>(
    topic: CustomerEventTopic,
    payload: T,
    options: Partial<
      Pick<
        EventMetadata,
        'correlationId' | 'causationId' | 'userId' | 'customerId' | 'traceId'
      >
    > = {},
  ): Promise<void> {
    const event = buildDomainEvent(topic, payload, options);

    try {
      const serialized = JSON.stringify(event);
      await redisPublisher.publish(topic, serialized);

      logger.info(
        {
          topic,
          eventId: event.metadata.eventId,
          customerId: options.customerId,
        },
        'Event published',
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(
        { topic, error: message, eventId: event.metadata.eventId },
        'Failed to publish event',
      );
      throw error;
    }
  }

  async publishBatch<T>(
    events: Array<{
      topic: CustomerEventTopic;
      payload: T;
      options?: Partial<
        Pick<
          EventMetadata,
          'correlationId' | 'causationId' | 'userId' | 'customerId' | 'traceId'
        >
      >;
    }>,
  ): Promise<void> {
    const pipeline = redisPublisher.pipeline();

    const domainEvents: DomainEvent<T>[] = [];

    for (const { topic, payload, options = {} } of events) {
      const event = buildDomainEvent(topic, payload, options);
      domainEvents.push(event);
      pipeline.publish(topic, JSON.stringify(event));
    }

    try {
      await pipeline.exec();

      logger.info(
        { count: events.length },
        'Batch events published',
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(
        { error: message, count: events.length },
        'Failed to publish batch events',
      );
      throw error;
    }
  }

  async publishToStream<T>(
    streamKey: string,
    topic: CustomerEventTopic,
    payload: T,
    options: Partial<
      Pick<
        EventMetadata,
        'correlationId' | 'causationId' | 'userId' | 'customerId' | 'traceId'
      >
    > = {},
  ): Promise<string> {
    const event = buildDomainEvent(topic, payload, options);

    try {
      const id = await redisPublisher.xadd(
        streamKey,
        '*',
        'topic', topic,
        'eventId', event.metadata.eventId,
        'timestamp', event.metadata.timestamp,
        'payload', JSON.stringify(event),
      );

      logger.info(
        { streamKey, topic, eventId: event.metadata.eventId, streamId: id },
        'Event published to stream',
      );

      return id as string;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(
        { streamKey, topic, error: message },
        'Failed to publish event to stream',
      );
      throw error;
    }
  }
}

export const eventProducer = EventProducer.getInstance();