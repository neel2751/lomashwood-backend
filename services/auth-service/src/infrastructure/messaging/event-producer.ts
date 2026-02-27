import redis from '../cache/redis.client';
import { logger } from '../../config/logger';
import { EVENT_TOPICS } from './event-topics';

export interface EventMetadata {
  eventId: string;
  eventType: string;
  timestamp: Date;
  version: string;
  source: string;
  correlationId?: string;
  causationId?: string;
  userId?: string;
}

export interface Event<T = unknown> {
  metadata: EventMetadata;
  payload: T;
}

export interface PublishOptions {
  retries?: number;
  retryDelay?: number;
  persistent?: boolean;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = 'AppError';
  }
}

class EventProducer {
  private readonly defaultRetries = 3;
  private readonly defaultRetryDelay = 1000;
  private readonly serviceName = 'auth-service';

  async publish<T>(
    topic: string,
    eventType: string,
    payload: T,
    options: PublishOptions = {}
  ): Promise<void> {
    const {
      retries = this.defaultRetries,
      retryDelay = this.defaultRetryDelay,
    } = options;

    const event = this.createEvent(eventType, payload);

    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        await this.publishEvent(topic, event);

        logger.info(
          `Event published successfully: eventId=${event.metadata.eventId} eventType=${event.metadata.eventType} topic=${topic} attempt=${attempt + 1}`
        );

        return;
      } catch (error) {
        lastError = error as Error;
        logger.warn(
          `Event publish attempt ${attempt + 1} failed: eventId=${event.metadata.eventId} eventType=${event.metadata.eventType} topic=${topic} error=${(error as Error).message}`
        );

        if (attempt < retries) {
          await this.delay(retryDelay * (attempt + 1));
        }
      }
    }

    logger.error(
      `Event publish failed after all retries: eventId=${event.metadata.eventId} eventType=${event.metadata.eventType} topic=${topic} retries=${retries} error=${lastError?.message}`
    );

    throw new AppError(
      'Failed to publish event after multiple attempts',
      500,
      'EVENT_PUBLISH_FAILED'
    );
  }

  async publishBatch<T>(
    topic: string,
    events: Array<{ eventType: string; payload: T }>
  ): Promise<void> {
    try {
      const publishPromises = events.map(({ eventType, payload }) =>
        this.publish(topic, eventType, payload)
      );

      await Promise.all(publishPromises);

      logger.info(`Batch of ${events.length} events published successfully to topic=${topic}`);
    } catch (error) {
      logger.error(
        `Batch event publish failed: topic=${topic} eventCount=${events.length} error=${(error as Error).message}`
      );
      throw error;
    }
  }

  private async publishEvent<T>(topic: string, event: Event<T>): Promise<void> {
    try {
      const serializedEvent = JSON.stringify(event);

      const channel = `${topic}:${event.metadata.eventType}`;

      await redis.publish(channel, serializedEvent);

      await this.storeEventHistory(topic, event);
    } catch (error) {
      logger.error(
        `Error publishing event: eventId=${event.metadata.eventId} topic=${topic} error=${(error as Error).message}`
      );
      throw error;
    }
  }

  private async storeEventHistory<T>(
    topic: string,
    event: Event<T>
  ): Promise<void> {
    try {
      const historyKey = `event:history:${topic}`;
      const eventData = JSON.stringify(event);

      await redis.lpush(historyKey, eventData);
      await redis.ltrim(historyKey, 0, 999);
      await redis.expire(historyKey, 7 * 24 * 60 * 60);
    } catch (error) {
      logger.warn(
        `Failed to store event history: eventId=${event.metadata.eventId} topic=${topic} error=${(error as Error).message}`
      );
    }
  }

  private createEvent<T>(eventType: string, payload: T): Event<T> {
    const metadata: EventMetadata = {
      eventId: this.generateEventId(),
      eventType,
      timestamp: new Date(),
      version: '1.0.0',
      source: this.serviceName,
    };

    return {
      metadata,
      payload,
    };
  }

  private generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getEventHistory(topic: string, limit: number = 100): Promise<Event<unknown>[]> {
    try {
      const historyKey = `event:history:${topic}`;
      const events = await redis.lrange(historyKey, 0, limit - 1);

      return events.map((event: string) => JSON.parse(event) as Event<unknown>);
    } catch (error) {
      logger.error(
        `Error retrieving event history: topic=${topic} error=${(error as Error).message}`
      );
      return [];
    }
  }

  async clearEventHistory(topic: string): Promise<void> {
    try {
      const historyKey = `event:history:${topic}`;
      await redis.del(historyKey);

      logger.info(`Event history cleared: topic=${topic}`);
    } catch (error) {
      logger.error(
        `Error clearing event history: topic=${topic} error=${(error as Error).message}`
      );
    }
  }

  async getEventStats(topic: string): Promise<{
    totalEvents: number;
    oldestEventTimestamp: Date | null;
    newestEventTimestamp: Date | null;
  }> {
    try {
      const historyKey = `event:history:${topic}`;
      const totalEvents = await redis.llen(historyKey);

      let oldestEventTimestamp: Date | null = null;
      let newestEventTimestamp: Date | null = null;

      if (totalEvents > 0) {
        const oldestEvent = await redis.lindex(historyKey, -1);
        const newestEvent = await redis.lindex(historyKey, 0);

        if (oldestEvent) {
          const parsed = JSON.parse(oldestEvent) as Event<unknown>;
          oldestEventTimestamp = new Date(parsed.metadata.timestamp);
        }

        if (newestEvent) {
          const parsed = JSON.parse(newestEvent) as Event<unknown>;
          newestEventTimestamp = new Date(parsed.metadata.timestamp);
        }
      }

      return {
        totalEvents,
        oldestEventTimestamp,
        newestEventTimestamp,
      };
    } catch (error) {
      logger.error(
        `Error getting event stats: topic=${topic} error=${(error as Error).message}`
      );
      return {
        totalEvents: 0,
        oldestEventTimestamp: null,
        newestEventTimestamp: null,
      };
    }
  }
}

export const eventProducer = new EventProducer();

export async function publishUserCreatedEvent(payload: {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
}): Promise<void> {
  await eventProducer.publish(EVENT_TOPICS.USER, 'user.created', payload);
}

export async function publishUserLoggedInEvent(payload: {
  userId: string;
  email: string;
  ipAddress: string;
  userAgent: string;
}): Promise<void> {
  await eventProducer.publish(EVENT_TOPICS.USER, 'user.logged_in', payload);
}

export async function publishPasswordResetEvent(payload: {
  userId: string;
  email: string;
}): Promise<void> {
  await eventProducer.publish(EVENT_TOPICS.USER, 'user.password_reset', payload);
}

export async function publishEmailVerifiedEvent(payload: {
  userId: string;
  email: string;
}): Promise<void> {
  await eventProducer.publish(EVENT_TOPICS.USER, 'user.email_verified', payload);
}

export async function publishRoleUpdatedEvent(payload: {
  userId: string;
  email: string;
  roles: string[];
}): Promise<void> {
  await eventProducer.publish(EVENT_TOPICS.USER, 'user.role_updated', payload);
}

export async function publishUserDeactivatedEvent(payload: {
  userId: string;
  email: string;
  reason?: string;
}): Promise<void> {
  await eventProducer.publish(EVENT_TOPICS.USER, 'user.deactivated', payload);
}