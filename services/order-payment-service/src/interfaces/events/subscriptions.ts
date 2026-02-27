import { EventProducer, EventSubscription } from '../../infrastructure/messaging/event-producer';
import { OrderTopics, PaymentTopics, RefundTopics, WebhookTopics, CheckoutTopics } from '../../infrastructure/messaging/event-topics';
import { registerEventHandlers } from './handlers';
import { logger } from '../../config/logger';

type SubscriptionRegistry = {
  topic:        string;
  subscription: EventSubscription;
};

class EventSubscriptionManager {
  private readonly registry: SubscriptionRegistry[] = [];
  private initialised = false;

  bootstrap(eventProducer: EventProducer): void {
    if (this.initialised) {
      logger.warn('EventSubscriptionManager already initialised — skipping');
      return;
    }

    registerEventHandlers(eventProducer);

    this.register(eventProducer, OrderTopics.CREATED);
    this.register(eventProducer, OrderTopics.CANCELLED);
    this.register(eventProducer, OrderTopics.COMPLETED);
    this.register(eventProducer, OrderTopics.EXPIRED);
    this.register(eventProducer, OrderTopics.REFUNDED);
    this.register(eventProducer, OrderTopics.PARTIALLY_REFUNDED);
    this.register(eventProducer, OrderTopics.RAZORPAY_PAID);

    this.register(eventProducer, PaymentTopics.CREATED);
    this.register(eventProducer, PaymentTopics.PROCESSING);
    this.register(eventProducer, PaymentTopics.SUCCEEDED);
    this.register(eventProducer, PaymentTopics.FAILED);
    this.register(eventProducer, PaymentTopics.CANCELLED);
    this.register(eventProducer, PaymentTopics.REQUIRES_ACTION);
    this.register(eventProducer, PaymentTopics.REFUNDED);
    this.register(eventProducer, PaymentTopics.DISPUTE_CREATED);
    this.register(eventProducer, PaymentTopics.DISPUTE_UPDATED);
    this.register(eventProducer, PaymentTopics.RAZORPAY_AUTHORIZED);
    this.register(eventProducer, PaymentTopics.RAZORPAY_CAPTURED);
    this.register(eventProducer, PaymentTopics.RAZORPAY_FAILED);

    this.register(eventProducer, RefundTopics.INITIATED);
    this.register(eventProducer, RefundTopics.STATUS_UPDATED);
    this.register(eventProducer, RefundTopics.SUCCEEDED);
    this.register(eventProducer, RefundTopics.FAILED);
    this.register(eventProducer, RefundTopics.CANCELLED);
    this.register(eventProducer, RefundTopics.CHARGE_REFUNDED);
    this.register(eventProducer, RefundTopics.RAZORPAY_CREATED);
    this.register(eventProducer, RefundTopics.RAZORPAY_PROCESSED);
    this.register(eventProducer, RefundTopics.RAZORPAY_FAILED);

    this.register(eventProducer, WebhookTopics.RECEIVED);
    this.register(eventProducer, WebhookTopics.PROCESSED);
    this.register(eventProducer, WebhookTopics.FAILED);
    this.register(eventProducer, WebhookTopics.RETRYING);
    this.register(eventProducer, WebhookTopics.DEAD_LETTERED);

    this.register(eventProducer, CheckoutTopics.STARTED);
    this.register(eventProducer, CheckoutTopics.COMPLETED);
    this.register(eventProducer, CheckoutTopics.ABANDONED);
    this.register(eventProducer, CheckoutTopics.EXPIRED);

    this.initialised = true;

    logger.info('Event subscriptions bootstrapped', {
      total: this.registry.length,
      topics: this.registry.map((r) => r.topic),
    });
  }

  teardown(): void {
    for (const entry of this.registry) {
      try {
        entry.subscription.unsubscribe();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error('Failed to unsubscribe event handler', {
          topic: entry.topic,
          error: message,
        });
      }
    }

    this.registry.length = 0;
    this.initialised = false;

    logger.info('Event subscriptions torn down');
  }

  listTopics(): string[] {
    return this.registry.map((r) => r.topic);
  }

  isInitialised(): boolean {
    return this.initialised;
  }

  private register(
    eventProducer: EventProducer,
    topic: string,
  ): void {
    const subscription = eventProducer.subscribe(topic, async (envelope) => {
      logger.debug('Event received', {
        topic,
        eventId:   envelope.metadata.eventId,
        source:    envelope.metadata.source,
        timestamp: envelope.metadata.timestamp,
      });
    });

    this.registry.push({ topic, subscription });
  }
}

export const eventSubscriptionManager = new EventSubscriptionManager();