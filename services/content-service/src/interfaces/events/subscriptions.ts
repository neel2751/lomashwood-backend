import { logger } from '../../config/logger';
import { ContentEventHandlers } from './handlers';
import { ContentEventPayload } from './payload.types';

// ─── Event Topic Constants ────────────────────────────────────────────────────

/**
 * All event topics the content-service subscribes to (inbound)
 * and publishes (outbound).
 */
export const CONTENT_EVENT_TOPICS = {
  // ── Inbound: from product-service ─────────────────────────────────────────
  PRODUCT_CREATED: 'product.created',
  PRODUCT_UPDATED: 'product.updated',

  // ── Inbound: from order-payment-service ───────────────────────────────────
  ORDER_CREATED: 'order.created',

  // ── Internal / outbound: content lifecycle ────────────────────────────────
  BLOG_PUBLISHED: 'content.blog.published',
  BLOG_UPDATED: 'content.blog.updated',
  MEDIA_UPLOADED: 'content.media.uploaded',
  PAGE_PUBLISHED: 'content.page.published',
  SEO_UPDATED: 'content.seo.updated',
  SITEMAP_REGENERATE: 'content.sitemap.regenerate',
} as const;

export type ContentEventTopic = (typeof CONTENT_EVENT_TOPICS)[keyof typeof CONTENT_EVENT_TOPICS];

// ─── Subscription Config ──────────────────────────────────────────────────────

export interface SubscriptionConfig {
  topic: ContentEventTopic;
  consumerGroup: string;
  /** How many messages to process in parallel per partition. */
  concurrency: number;
  /** Retry attempts before dead-lettering. */
  retries: number;
  /** Backoff in ms between retries. */
  retryDelayMs: number;
}

export const SUBSCRIPTION_CONFIGS: SubscriptionConfig[] = [
  {
    topic: CONTENT_EVENT_TOPICS.PRODUCT_CREATED,
    consumerGroup: 'content-service.product-created',
    concurrency: 5,
    retries: 3,
    retryDelayMs: 1_000,
  },
  {
    topic: CONTENT_EVENT_TOPICS.PRODUCT_UPDATED,
    consumerGroup: 'content-service.product-updated',
    concurrency: 5,
    retries: 3,
    retryDelayMs: 1_000,
  },
  {
    topic: CONTENT_EVENT_TOPICS.ORDER_CREATED,
    consumerGroup: 'content-service.order-created',
    concurrency: 3,
    retries: 3,
    retryDelayMs: 2_000,
  },
  {
    topic: CONTENT_EVENT_TOPICS.BLOG_PUBLISHED,
    consumerGroup: 'content-service.blog-published',
    concurrency: 2,
    retries: 5,
    retryDelayMs: 2_000,
  },
  {
    topic: CONTENT_EVENT_TOPICS.BLOG_UPDATED,
    consumerGroup: 'content-service.blog-updated',
    concurrency: 2,
    retries: 3,
    retryDelayMs: 1_000,
  },
  {
    topic: CONTENT_EVENT_TOPICS.MEDIA_UPLOADED,
    consumerGroup: 'content-service.media-uploaded',
    concurrency: 10,
    retries: 3,
    retryDelayMs: 500,
  },
  {
    topic: CONTENT_EVENT_TOPICS.PAGE_PUBLISHED,
    consumerGroup: 'content-service.page-published',
    concurrency: 2,
    retries: 5,
    retryDelayMs: 2_000,
  },
  {
    topic: CONTENT_EVENT_TOPICS.SEO_UPDATED,
    consumerGroup: 'content-service.seo-updated',
    concurrency: 3,
    retries: 3,
    retryDelayMs: 1_000,
  },
  {
    topic: CONTENT_EVENT_TOPICS.SITEMAP_REGENERATE,
    consumerGroup: 'content-service.sitemap-regenerate',
    concurrency: 1, // Sitemap builds are serial
    retries: 3,
    retryDelayMs: 5_000,
  },
];

// ─── Subscription Manager ─────────────────────────────────────────────────────

/**
 * EventSubscriptionManager wires SubscriptionConfigs to the
 * ContentEventHandlers dispatcher.
 *
 * In production this integrates with the shared event-bus package
 * (Kafka / RabbitMQ abstraction). The `registerAll` method is called
 * once during service bootstrap.
 */
export class EventSubscriptionManager {
  constructor(
    private readonly handlers: ContentEventHandlers,
    private readonly eventBus: IEventBus,
  ) {}

  /**
   * Register all subscriptions defined in SUBSCRIPTION_CONFIGS.
   * Called once at service startup.
   */
  async registerAll(): Promise<void> {
    logger.info(
      { count: SUBSCRIPTION_CONFIGS.length },
      '[EventSubscriptionManager] Registering event subscriptions',
    );

    const registrations = SUBSCRIPTION_CONFIGS.map((config) =>
      this.registerSubscription(config),
    );

    await Promise.all(registrations);

    logger.info('[EventSubscriptionManager] All subscriptions registered successfully');
  }

  /**
   * Gracefully deregister all subscriptions on shutdown.
   */
  async deregisterAll(): Promise<void> {
    logger.info('[EventSubscriptionManager] Deregistering all event subscriptions');
    await this.eventBus.disconnectAll();
  }

  // ─── Private ──────────────────────────────────────────────────────────────

  private async registerSubscription(config: SubscriptionConfig): Promise<void> {
    logger.info(
      { topic: config.topic, consumerGroup: config.consumerGroup },
      '[EventSubscriptionManager] Registering subscription',
    );

    await this.eventBus.subscribe({
      topic: config.topic,
      consumerGroup: config.consumerGroup,
      concurrency: config.concurrency,
      retries: config.retries,
      retryDelayMs: config.retryDelayMs,
      handler: async (rawPayload: unknown) => {
        const payload = rawPayload as ContentEventPayload;

        logger.debug(
          { topic: config.topic, eventId: payload.eventId },
          '[EventSubscriptionManager] Event received',
        );

        await this.handlers.dispatch(config.topic, payload);
      },
      onError: (err: Error, rawPayload: unknown) => {
        const payload = rawPayload as Partial<ContentEventPayload>;
        logger.error(
          {
            topic: config.topic,
            eventId: payload?.eventId,
            error: err.message,
            stack: err.stack,
          },
          '[EventSubscriptionManager] Event handling failed',
        );
      },
    });
  }
}

// ─── Event Bus Interface ──────────────────────────────────────────────────────

/**
 * Abstraction over the shared event-bus package.
 * Concrete implementation is injected via DI during bootstrap.
 */
export interface IEventBus {
  subscribe(options: {
    topic: string;
    consumerGroup: string;
    concurrency: number;
    retries: number;
    retryDelayMs: number;
    handler: (payload: unknown) => Promise<void>;
    onError: (err: Error, payload: unknown) => void;
  }): Promise<void>;

  disconnectAll(): Promise<void>;
}