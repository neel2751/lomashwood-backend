import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';
import { logger } from '../../config/logger';
import { env } from '../../config/env';

export type EventMetadata = {
  eventId: string;
  eventType: string;
  source: string;
  version: string;
  timestamp: string;
  correlationId?: string;
  causationId?: string;
};

export type EventEnvelope<T = unknown> = {
  metadata: EventMetadata;
  payload: T;
};

export type EventPublishOptions = {
  correlationId?: string;
  causationId?: string;
  version?: string;
};

export type EventHandler<T = unknown> = (
  envelope: EventEnvelope<T>,
) => Promise<void> | void;

export type EventSubscription = {
  unsubscribe: () => void;
};

const SERVICE_SOURCE = 'order-payment-service';
const DEFAULT_VERSION = '1.0';

export class EventProducer {
  private readonly emitter: EventEmitter;
  private readonly handlers: Map<string, Set<EventHandler>>;
  private readonly deadLetterQueue: EventEnvelope[];

  constructor() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(50);
    this.handlers = new Map();
    this.deadLetterQueue = [];
  }

  async publish<T>(
    eventType: string,
    payload: T,
    options: EventPublishOptions = {},
  ): Promise<void> {
    const envelope: EventEnvelope<T> = {
      metadata: {
        eventId: randomUUID(),
        eventType,
        source: SERVICE_SOURCE,
        version: options.version ?? DEFAULT_VERSION,
        timestamp: new Date().toISOString(),
        ...(options.correlationId ? { correlationId: options.correlationId } : {}),
        ...(options.causationId ? { causationId: options.causationId } : {}),
      },
      payload,
    };

    logger.debug('Publishing event', {
      eventId: envelope.metadata.eventId,
      eventType,
      source: SERVICE_SOURCE,
    });

    try {
      await this.dispatchToHandlers(eventType, envelope);
      this.emitter.emit(eventType, envelope);
      this.emitter.emit('*', envelope);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      logger.error('Failed to publish event', {
        eventId: envelope.metadata.eventId,
        eventType,
        error: message,
      });

      this.deadLetterQueue.push(envelope as EventEnvelope);

      if (env.NODE_ENV !== 'production') {
        throw error;
      }
    }
  }

  async publishBatch<T>(
    eventType: string,
    payloads: T[],
    options: EventPublishOptions = {},
  ): Promise<void> {
    await Promise.all(
      payloads.map((payload) => this.publish(eventType, payload, options)),
    );
  }

  subscribe<T>(
    eventType: string,
    handler: EventHandler<T>,
  ): EventSubscription {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }

    this.handlers.get(eventType)!.add(handler as EventHandler);

    logger.debug('Event handler subscribed', { eventType });

    return {
      unsubscribe: () => {
        this.handlers.get(eventType)?.delete(handler as EventHandler);
        logger.debug('Event handler unsubscribed', { eventType });
      },
    };
  }

  subscribeAll(handler: EventHandler): EventSubscription {
    return this.subscribe('*', handler);
  }

  once<T>(eventType: string, handler: EventHandler<T>): EventSubscription {
    let fired = false;

    const wrappedHandler: EventHandler<T> = async (envelope) => {
      if (fired) return;
      fired = true;
      subscription.unsubscribe();
      await handler(envelope);
    };

    const subscription = this.subscribe(eventType, wrappedHandler);
    return subscription;
  }

  getDeadLetterQueue(): EventEnvelope[] {
    return [...this.deadLetterQueue];
  }

  async replayDeadLetterQueue(): Promise<{
    replayed: number;
    failed: number;
  }> {
    const queue = [...this.deadLetterQueue];
    this.deadLetterQueue.length = 0;

    let replayed = 0;
    let failed = 0;

    for (const envelope of queue) {
      try {
        await this.dispatchToHandlers(envelope.metadata.eventType, envelope);
        this.emitter.emit(envelope.metadata.eventType, envelope);
        replayed++;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        logger.error('Dead letter replay failed', {
          eventId: envelope.metadata.eventId,
          eventType: envelope.metadata.eventType,
          error: message,
        });

        this.deadLetterQueue.push(envelope);
        failed++;
      }
    }

    logger.info('Dead letter queue replay completed', { replayed, failed });

    return { replayed, failed };
  }

  listenerCount(eventType: string): number {
    const handlers = this.handlers.get(eventType);
    return handlers?.size ?? 0;
  }

  removeAllListeners(eventType?: string): void {
    if (eventType) {
      this.handlers.delete(eventType);
      this.emitter.removeAllListeners(eventType);
    } else {
      this.handlers.clear();
      this.emitter.removeAllListeners();
    }
  }

  private async dispatchToHandlers(
    eventType: string,
    envelope: EventEnvelope,
  ): Promise<void> {
    const specificHandlers = this.handlers.get(eventType);
    const wildcardHandlers = this.handlers.get('*');

    const all: EventHandler[] = [
      ...(specificHandlers ? Array.from(specificHandlers) : []),
      ...(wildcardHandlers ? Array.from(wildcardHandlers) : []),
    ];

    if (all.length === 0) return;

    const results = await Promise.allSettled(
      all.map((handler) => handler(envelope)),
    );

    const failures = results.filter(
      (r): r is PromiseRejectedResult => r.status === 'rejected',
    );

    if (failures.length > 0) {
      for (const failure of failures) {
        logger.error('Event handler threw an error', {
          eventId: envelope.metadata.eventId,
          eventType,
          error:
            failure.reason instanceof Error
              ? failure.reason.message
              : String(failure.reason),
        });
      }

      throw new Error(
        `${failures.length} handler(s) failed for event "${eventType}"`,
      );
    }
  }
}

export const eventProducer = new EventProducer();