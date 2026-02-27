import { Logger } from 'winston';
import { EVENT_TOPICS } from './event-topics';
import { EventMetadata, parseEventMetadata } from './event-metadata';

export interface ConsumedEvent<T = unknown> {
  topic: string;
  payload: T;
  metadata: EventMetadata;
  partition: number;
  offset: string;
}

export type EventHandler<T = unknown> = (event: ConsumedEvent<T>) => Promise<void>;

export interface EventConsumerConfig {
  brokers: string[];
  groupId: string;
  clientId: string;
  sessionTimeoutMs?: number;
  heartbeatIntervalMs?: number;
  maxBytesPerPartition?: number;
  retryAttempts?: number;
  retryInitialDelayMs?: number;
}

export class EventConsumer {
  private consumer: import('kafkajs').Consumer | null = null;
  private readonly handlers = new Map<string, EventHandler[]>();
  private running = false;

  constructor(
    private readonly config: EventConsumerConfig,
    private readonly logger: Logger,
  ) {}

  // ---------------------------------------------------------------------------
  // Subscription registration
  // ---------------------------------------------------------------------------

  subscribe<T>(topic: string, handler: EventHandler<T>): void {
    const existing = this.handlers.get(topic) ?? [];
    existing.push(handler as EventHandler);
    this.handlers.set(topic, existing);
    this.logger.debug('Event handler registered', { topic });
  }

  subscribeToNotificationEvents(handlers: {
    onUserCreated?: EventHandler;
    onOrderCreated?: EventHandler;
    onOrderCancelled?: EventHandler;
    onPaymentSucceeded?: EventHandler;
    onRefundIssued?: EventHandler;
    onBookingCreated?: EventHandler;
    onBookingCancelled?: EventHandler;
    onReminderDue?: EventHandler;
    onBlogPublished?: EventHandler;
  }): void {
    const map: Record<string, EventHandler | undefined> = {
      [EVENT_TOPICS.AUTH.USER_CREATED]: handlers.onUserCreated,
      [EVENT_TOPICS.ORDER.ORDER_CREATED]: handlers.onOrderCreated,
      [EVENT_TOPICS.ORDER.ORDER_CANCELLED]: handlers.onOrderCancelled,
      [EVENT_TOPICS.ORDER.PAYMENT_SUCCEEDED]: handlers.onPaymentSucceeded,
      [EVENT_TOPICS.ORDER.REFUND_ISSUED]: handlers.onRefundIssued,
      [EVENT_TOPICS.APPOINTMENT.BOOKING_CREATED]: handlers.onBookingCreated,
      [EVENT_TOPICS.APPOINTMENT.BOOKING_CANCELLED]: handlers.onBookingCancelled,
      [EVENT_TOPICS.APPOINTMENT.REMINDER_SENT]: handlers.onReminderDue,
      [EVENT_TOPICS.CONTENT.BLOG_PUBLISHED]: handlers.onBlogPublished,
    };

    for (const [topic, handler] of Object.entries(map)) {
      if (handler) this.subscribe(topic, handler);
    }
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  async connect(): Promise<void> {
    const { Kafka } = await import('kafkajs');

    const kafka = new Kafka({
      clientId: this.config.clientId,
      brokers: this.config.brokers,
    });

    this.consumer = kafka.consumer({
      groupId: this.config.groupId,
      sessionTimeout: this.config.sessionTimeoutMs ?? 30_000,
      heartbeatInterval: this.config.heartbeatIntervalMs ?? 3_000,
      maxBytesPerPartition: this.config.maxBytesPerPartition ?? 1_048_576,
      retry: {
        initialRetryTime: this.config.retryInitialDelayMs ?? 300,
        retries: this.config.retryAttempts ?? 8,
      },
    });

    await this.consumer.connect();
    this.logger.info('Event consumer connected', { groupId: this.config.groupId });

    const topics = Array.from(this.handlers.keys());
    if (topics.length === 0) {
      this.logger.warn('No topics registered — consumer will be idle');
      return;
    }

    await this.consumer.subscribe({ topics, fromBeginning: false });
    this.logger.info('Event consumer subscribed', { topics });
  }

  async start(): Promise<void> {
    if (!this.consumer) throw new Error('EventConsumer not connected. Call connect() first.');
    if (this.running) return;

    this.running = true;

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const raw = message.value?.toString();
        if (!raw) return;

        let payload: unknown;
        let metadata: EventMetadata;

        try {
          const parsed = JSON.parse(raw) as { payload: unknown; metadata: unknown };
          payload = parsed.payload;
          metadata = parseEventMetadata(parsed.metadata);
        } catch (err) {
          this.logger.error('Failed to parse event message', {
            topic,
            error: (err as Error).message,
          });
          return;
        }

        const topicHandlers = this.handlers.get(topic) ?? [];

        for (const handler of topicHandlers) {
          try {
            await handler({
              topic,
              payload,
              metadata,
              partition,
              offset: message.offset,
            });
          } catch (err: unknown) {
            this.logger.error('Event handler threw', {
              topic,
              offset: message.offset,
              error: (err as Error).message,
            });
          }
        }
      },
    });

    this.logger.info('Event consumer running');
  }

  async disconnect(): Promise<void> {
    if (!this.consumer) return;
    this.running = false;
    await this.consumer.disconnect();
    this.logger.info('Event consumer disconnected');
  }

  isRunning(): boolean {
    return this.running;
  }
}