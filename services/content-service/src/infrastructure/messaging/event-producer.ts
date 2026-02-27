// Note: Event producer is currently a stub pending proper Kafka/RabbitMQ integration
// The service uses Kafka as per env config (KAFKA_BROKERS) but the client library is not yet installed

import { logger } from '../../config/logger';
import {
  EventTopic,
} from './event-topics';
import {
  EventEnvelope,
  EventValidator,
} from './event-metadata';

export interface PublishOptions {
  persistent?: boolean;
  mandatory?: boolean;
  immediate?: boolean;
  expiration?: string;
  priority?: number;
  correlationId?: string;
  replyTo?: string;
  headers?: Record<string, unknown>;
}

export interface PublishResult {
  success: boolean;
  messageId: string;
  topic: EventTopic;
  error?: Error;
}

export interface ProducerConfig {
  url: string;
  prefetch?: number;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

export class EventProducer {
  private isConnected = false;
  private isConnecting = false;
  private reconnectAttempts = 0;

  private readonly pendingPublishes = new Map<string, (result: PublishResult) => void>();

  constructor(_config?: Partial<ProducerConfig>) {
    // Config not used in stub
  }

  async connect(): Promise<void> {
    if (this.isConnected || this.isConnecting) return;
    this.isConnecting = true;
    this.isConnected = true;
    this.isConnecting = false;
    logger.info({}, 'EventProducer stub connected (no actual connection)');
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
    logger.info({}, 'EventProducer stub disconnected');
  }

  async publish<T>(
    topic: EventTopic,
    event: EventEnvelope<T>,
    _options: PublishOptions = {},
  ): Promise<PublishResult> {
    const validation = EventValidator.validate(event);
    if (!validation.valid) {
      const error = new Error(`Event validation failed: ${validation.errors.join(', ')}`);
      return { success: false, messageId: event.id, topic, error };
    }

    logger.debug({ topic, eventId: event.id }, 'Stub: Event would be published');
    return { success: true, messageId: event.id, topic };
  }

  async publishBatch<T>(
    events: Array<{ topic: EventTopic; event: EventEnvelope<T> }>,
  ): Promise<PublishResult[]> {
    return events.map(({ topic, event }) => ({
      success: true,
      messageId: event.id,
      topic,
    }));
  }

  /* private async publishWithConfirmation<T>(
    exchange: string,
    routingKey: string,
    message: Buffer,
    options: Options.Publish,
    event: EventEnvelope<T>,
  ): Promise<PublishResult> {
    return new Promise((resolve) => {
      if (!this.channel) {
        resolve({ success: false, messageId: event.id, topic: event.topic, error: new Error('Channel not available') });
        return;
      }

      this.channel.publish(exchange, routingKey, message, options, (err: Error | null) => {
        if (err) {
          logger.error({ context: 'EventProducer', topic: event.topic, eventId: event.id, error: err }, 'Publish confirmation failed');
          resolve({ success: false, messageId: event.id, topic: event.topic, error: err });
        } else {
          logger.debug({ context: 'EventProducer', topic: event.topic, eventId: event.id, routingKey }, 'Event published successfully');
          resolve({ success: true, messageId: event.id, topic: event.topic });
        }
      });
    });
  async publishWithRetry<T>(
    topic: EventTopic,
    event: EventEnvelope<T>,
    options: PublishOptions = {},
  ): Promise<PublishResult> {
    const result = await this.publish(topic, event, options);
    return result;
  }

  */

  async healthCheck(): Promise<boolean> {
    return true;
  }

  getStatus(): { connected: boolean; reconnectAttempts: number; pendingPublishes: number } {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      pendingPublishes: this.pendingPublishes.size,
    };
  }

}

export const eventProducer = new EventProducer();