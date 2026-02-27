import { logger } from '../../config/logger';
import { eventHandlerRegistry } from './handlers';
import { EventPayload } from './payload.types';

export interface EventSubscription {
  eventType: string;
  handler: (payload: any) => Promise<void>;
  retry?: {
    maxRetries: number;
    retryDelay: number;
  };
}

export interface SubscriptionConfig {
  consumerGroup: string;
  subscriptions: EventSubscription[];
  concurrency?: number;
  prefetch?: number;
}

export class EventSubscriptionManager {
  private subscriptions: Map<string, EventSubscription> = new Map();
  private isRunning: boolean = false;
  private readonly consumerGroup: string;
  private readonly concurrency: number;

  constructor(config: SubscriptionConfig) {
    this.consumerGroup = config.consumerGroup;
    this.concurrency = config.concurrency || 1;
    
    config.subscriptions.forEach((sub) => {
      this.subscribe(sub);
    });
  }

  public subscribe(subscription: EventSubscription): void {
    this.subscriptions.set(subscription.eventType, subscription);
    logger.info(`Subscribed to event: ${subscription.eventType}`, {
      consumerGroup: this.consumerGroup,
    });
  }

  public unsubscribe(eventType: string): void {
    this.subscriptions.delete(eventType);
    logger.info(`Unsubscribed from event: ${eventType}`);
  }

  public async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Event subscription manager already running');
      return;
    }

    this.isRunning = true;
    logger.info('Event subscription manager started', {
      consumerGroup: this.consumerGroup,
      subscriptions: Array.from(this.subscriptions.keys()),
    });
  }

  public async stop(): Promise<void> {
    if (!this.isRunning) {
      logger.warn('Event subscription manager not running');
      return;
    }

    this.isRunning = false;
    logger.info('Event subscription manager stopped');
  }

  public async processEvent(eventType: string, payload: EventPayload): Promise<void> {
    const subscription = this.subscriptions.get(eventType);

    if (!subscription) {
      logger.debug(`No subscription found for event type: ${eventType}`);
      return;
    }

    const maxRetries = subscription.retry?.maxRetries || 3;
    const retryDelay = subscription.retry?.retryDelay || 1000;

    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt < maxRetries) {
      try {
        await subscription.handler(payload);
        logger.info(`Event processed successfully: ${eventType}`, {
          attempt: attempt + 1,
          eventId: payload.eventId,
        });
        return;
      } catch (error) {
        lastError = error as Error;
        attempt++;

        logger.error(`Error processing event: ${eventType}`, {
          attempt,
          maxRetries,
          error,
          eventId: payload.eventId,
        });

        if (attempt < maxRetries) {
          await this.delay(retryDelay * attempt);
        }
      }
    }

    await this.handleFailedEvent(eventType, payload, lastError);
  }

  private async handleFailedEvent(
    eventType: string,
    payload: EventPayload,
    error: Error | null
  ): Promise<void> {
    logger.error(`Event processing failed after all retries: ${eventType}`, {
      eventId: payload.eventId,
      error,
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const productServiceSubscriptions: EventSubscription[] = [
  {
    eventType: 'product.created',
    handler: async (payload) => {
      await eventHandlerRegistry.handle('product.created', payload);
    },
    retry: {
      maxRetries: 3,
      retryDelay: 1000,
    },
  },
  {
    eventType: 'product.updated',
    handler: async (payload) => {
      await eventHandlerRegistry.handle('product.updated', payload);
    },
    retry: {
      maxRetries: 3,
      retryDelay: 1000,
    },
  },
  {
    eventType: 'inventory.updated',
    handler: async (payload) => {
      await eventHandlerRegistry.handle('inventory.updated', payload);
    },
    retry: {
      maxRetries: 5,
      retryDelay: 2000,
    },
  },
  {
    eventType: 'price.changed',
    handler: async (payload) => {
      await eventHandlerRegistry.handle('price.changed', payload);
    },
    retry: {
      maxRetries: 3,
      retryDelay: 1000,
    },
  },
  {
    eventType: 'order.created',
    handler: async (payload) => {
      await eventHandlerRegistry.handle('order.created', payload);
    },
    retry: {
      maxRetries: 5,
      retryDelay: 2000,
    },
  },
  {
    eventType: 'order.cancelled',
    handler: async (payload) => {
      await eventHandlerRegistry.handle('order.cancelled', payload);
    },
    retry: {
      maxRetries: 5,
      retryDelay: 2000,
    },
  },
  {
    eventType: 'category.created',
    handler: async (payload) => {
      logger.info('Category created event received', payload);
    },
    retry: {
      maxRetries: 3,
      retryDelay: 1000,
    },
  },
  {
    eventType: 'category.updated',
    handler: async (payload) => {
      logger.info('Category updated event received', payload);
    },
    retry: {
      maxRetries: 3,
      retryDelay: 1000,
    },
  },
  {
    eventType: 'colour.created',
    handler: async (payload) => {
      logger.info('Colour created event received', payload);
    },
    retry: {
      maxRetries: 3,
      retryDelay: 1000,
    },
  },
  {
    eventType: 'colour.updated',
    handler: async (payload) => {
      logger.info('Colour updated event received', payload);
    },
    retry: {
      maxRetries: 3,
      retryDelay: 1000,
    },
  },
];

export const subscriptionManager = new EventSubscriptionManager({
  consumerGroup: 'product-service',
  subscriptions: productServiceSubscriptions,
  concurrency: 5,
  prefetch: 10,
});

export async function startEventSubscriptions(): Promise<void> {
  try {
    await subscriptionManager.start();
    logger.info('Event subscriptions started successfully');
  } catch (error) {
    logger.error('Failed to start event subscriptions', error);
    throw error;
  }
}

export async function stopEventSubscriptions(): Promise<void> {
  try {
    await subscriptionManager.stop();
    logger.info('Event subscriptions stopped successfully');
  } catch (error) {
    logger.error('Failed to stop event subscriptions', error);
    throw error;
  }
}

export function subscribeToEvent(subscription: EventSubscription): void {
  subscriptionManager.subscribe(subscription);
}

export function unsubscribeFromEvent(eventType: string): void {
  subscriptionManager.unsubscribe(eventType);
}

export async function processIncomingEvent(
  eventType: string,
  payload: EventPayload
): Promise<void> {
  await subscriptionManager.processEvent(eventType, payload);
}