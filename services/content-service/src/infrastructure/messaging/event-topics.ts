/**
 * content-service/src/infrastructure/messaging/event-topics.ts
 *
 * Event topic definitions for the Content Service.
 * Defines:
 *   - Topic names and routing keys
 *   - Event type registry
 *   - Topic-to-service mappings
 *   - Dead letter queue configuration
 */

// ---------------------------------------------------------------------------
// Topic Definitions
// ---------------------------------------------------------------------------
export enum EventTopic {
  // Blog events
  BLOG_CREATED = 'content.blog.created',
  BLOG_UPDATED = 'content.blog.updated',
  BLOG_PUBLISHED = 'content.blog.published',
  BLOG_UNPUBLISHED = 'content.blog.unpublished',
  BLOG_DELETED = 'content.blog.deleted',

  // Page events
  PAGE_CREATED = 'content.page.created',
  PAGE_UPDATED = 'content.page.updated',
  PAGE_PUBLISHED = 'content.page.published',
  PAGE_UNPUBLISHED = 'content.page.unpublished',
  PAGE_DELETED = 'content.page.deleted',

  // Media events
  MEDIA_UPLOADED = 'content.media.uploaded',
  MEDIA_UPDATED = 'content.media.updated',
  MEDIA_DELETED = 'content.media.deleted',
  MEDIA_OPTIMIZED = 'content.media.optimized',

  // SEO events
  SEO_UPDATED = 'content.seo.updated',
  SITEMAP_REGENERATED = 'content.sitemap.regenerated',

  // Landing page events
  LANDING_PAGE_CREATED = 'content.landing.created',
  LANDING_PAGE_UPDATED = 'content.landing.updated',
  LANDING_PAGE_PUBLISHED = 'content.landing.published',
  LANDING_PAGE_DELETED = 'content.landing.deleted',

  // Newsletter events
  NEWSLETTER_SUBSCRIBED = 'content.newsletter.subscribed',
  NEWSLETTER_UNSUBSCRIBED = 'content.newsletter.unsubscribed',

  // System events
  CACHE_INVALIDATED = 'content.cache.invalidated',
  SEARCH_INDEX_UPDATED = 'content.search.indexed',
}

// ---------------------------------------------------------------------------
// Exchange and Queue Configuration
// ---------------------------------------------------------------------------
export const CONTENT_EXCHANGE = 'lomash.content.events';
export const CONTENT_DLX = 'lomash.content.events.dlx';

export interface TopicConfig {
  topic: EventTopic;
  exchange: string;
  routingKey: string;
  deadLetterExchange: string;
  priority?: number;
  ttl?: number; // milliseconds
}

export const TOPIC_CONFIGS: Record<EventTopic, TopicConfig> = {
  // Blog topics
  [EventTopic.BLOG_CREATED]: {
    topic: EventTopic.BLOG_CREATED,
    exchange: CONTENT_EXCHANGE,
    routingKey: 'blog.created',
    deadLetterExchange: CONTENT_DLX,
    priority: 5,
  },
  [EventTopic.BLOG_UPDATED]: {
    topic: EventTopic.BLOG_UPDATED,
    exchange: CONTENT_EXCHANGE,
    routingKey: 'blog.updated',
    deadLetterExchange: CONTENT_DLX,
    priority: 5,
  },
  [EventTopic.BLOG_PUBLISHED]: {
    topic: EventTopic.BLOG_PUBLISHED,
    exchange: CONTENT_EXCHANGE,
    routingKey: 'blog.published',
    deadLetterExchange: CONTENT_DLX,
    priority: 8,
  },
  [EventTopic.BLOG_UNPUBLISHED]: {
    topic: EventTopic.BLOG_UNPUBLISHED,
    exchange: CONTENT_EXCHANGE,
    routingKey: 'blog.unpublished',
    deadLetterExchange: CONTENT_DLX,
    priority: 7,
  },
  [EventTopic.BLOG_DELETED]: {
    topic: EventTopic.BLOG_DELETED,
    exchange: CONTENT_EXCHANGE,
    routingKey: 'blog.deleted',
    deadLetterExchange: CONTENT_DLX,
    priority: 6,
  },

  // Page topics
  [EventTopic.PAGE_CREATED]: {
    topic: EventTopic.PAGE_CREATED,
    exchange: CONTENT_EXCHANGE,
    routingKey: 'page.created',
    deadLetterExchange: CONTENT_DLX,
    priority: 5,
  },
  [EventTopic.PAGE_UPDATED]: {
    topic: EventTopic.PAGE_UPDATED,
    exchange: CONTENT_EXCHANGE,
    routingKey: 'page.updated',
    deadLetterExchange: CONTENT_DLX,
    priority: 5,
  },
  [EventTopic.PAGE_PUBLISHED]: {
    topic: EventTopic.PAGE_PUBLISHED,
    exchange: CONTENT_EXCHANGE,
    routingKey: 'page.published',
    deadLetterExchange: CONTENT_DLX,
    priority: 9, // High priority - pages are critical
  },
  [EventTopic.PAGE_UNPUBLISHED]: {
    topic: EventTopic.PAGE_UNPUBLISHED,
    exchange: CONTENT_EXCHANGE,
    routingKey: 'page.unpublished',
    deadLetterExchange: CONTENT_DLX,
    priority: 8,
  },
  [EventTopic.PAGE_DELETED]: {
    topic: EventTopic.PAGE_DELETED,
    exchange: CONTENT_EXCHANGE,
    routingKey: 'page.deleted',
    deadLetterExchange: CONTENT_DLX,
    priority: 6,
  },

  // Media topics
  [EventTopic.MEDIA_UPLOADED]: {
    topic: EventTopic.MEDIA_UPLOADED,
    exchange: CONTENT_EXCHANGE,
    routingKey: 'media.uploaded',
    deadLetterExchange: CONTENT_DLX,
    priority: 4,
  },
  [EventTopic.MEDIA_UPDATED]: {
    topic: EventTopic.MEDIA_UPDATED,
    exchange: CONTENT_EXCHANGE,
    routingKey: 'media.updated',
    deadLetterExchange: CONTENT_DLX,
    priority: 4,
  },
  [EventTopic.MEDIA_DELETED]: {
    topic: EventTopic.MEDIA_DELETED,
    exchange: CONTENT_EXCHANGE,
    routingKey: 'media.deleted',
    deadLetterExchange: CONTENT_DLX,
    priority: 5,
  },
  [EventTopic.MEDIA_OPTIMIZED]: {
    topic: EventTopic.MEDIA_OPTIMIZED,
    exchange: CONTENT_EXCHANGE,
    routingKey: 'media.optimized',
    deadLetterExchange: CONTENT_DLX,
    priority: 3,
  },

  // SEO topics
  [EventTopic.SEO_UPDATED]: {
    topic: EventTopic.SEO_UPDATED,
    exchange: CONTENT_EXCHANGE,
    routingKey: 'seo.updated',
    deadLetterExchange: CONTENT_DLX,
    priority: 6,
  },
  [EventTopic.SITEMAP_REGENERATED]: {
    topic: EventTopic.SITEMAP_REGENERATED,
    exchange: CONTENT_EXCHANGE,
    routingKey: 'seo.sitemap.regenerated',
    deadLetterExchange: CONTENT_DLX,
    priority: 5,
  },

  // Landing page topics
  [EventTopic.LANDING_PAGE_CREATED]: {
    topic: EventTopic.LANDING_PAGE_CREATED,
    exchange: CONTENT_EXCHANGE,
    routingKey: 'landing.created',
    deadLetterExchange: CONTENT_DLX,
    priority: 7,
  },
  [EventTopic.LANDING_PAGE_UPDATED]: {
    topic: EventTopic.LANDING_PAGE_UPDATED,
    exchange: CONTENT_EXCHANGE,
    routingKey: 'landing.updated',
    deadLetterExchange: CONTENT_DLX,
    priority: 7,
  },
  [EventTopic.LANDING_PAGE_PUBLISHED]: {
    topic: EventTopic.LANDING_PAGE_PUBLISHED,
    exchange: CONTENT_EXCHANGE,
    routingKey: 'landing.published',
    deadLetterExchange: CONTENT_DLX,
    priority: 9, // High priority - landing pages drive conversions
  },
  [EventTopic.LANDING_PAGE_DELETED]: {
    topic: EventTopic.LANDING_PAGE_DELETED,
    exchange: CONTENT_EXCHANGE,
    routingKey: 'landing.deleted',
    deadLetterExchange: CONTENT_DLX,
    priority: 6,
  },

  // Newsletter topics
  [EventTopic.NEWSLETTER_SUBSCRIBED]: {
    topic: EventTopic.NEWSLETTER_SUBSCRIBED,
    exchange: CONTENT_EXCHANGE,
    routingKey: 'newsletter.subscribed',
    deadLetterExchange: CONTENT_DLX,
    priority: 5,
  },
  [EventTopic.NEWSLETTER_UNSUBSCRIBED]: {
    topic: EventTopic.NEWSLETTER_UNSUBSCRIBED,
    exchange: CONTENT_EXCHANGE,
    routingKey: 'newsletter.unsubscribed',
    deadLetterExchange: CONTENT_DLX,
    priority: 4,
  },

  // System topics
  [EventTopic.CACHE_INVALIDATED]: {
    topic: EventTopic.CACHE_INVALIDATED,
    exchange: CONTENT_EXCHANGE,
    routingKey: 'system.cache.invalidated',
    deadLetterExchange: CONTENT_DLX,
    priority: 10, // Highest priority - cache consistency is critical
    ttl: 10_000, // 10 seconds - stale cache events are useless
  },
  [EventTopic.SEARCH_INDEX_UPDATED]: {
    topic: EventTopic.SEARCH_INDEX_UPDATED,
    exchange: CONTENT_EXCHANGE,
    routingKey: 'system.search.indexed',
    deadLetterExchange: CONTENT_DLX,
    priority: 6,
  },
};

// ---------------------------------------------------------------------------
// Topic-to-Service Subscriptions
// ---------------------------------------------------------------------------
export interface ServiceSubscription {
  service: string;
  topics: EventTopic[];
  queueName: string;
}

export const SERVICE_SUBSCRIPTIONS: ServiceSubscription[] = [
  // Analytics Service - tracks all content events
  {
    service: 'analytics-service',
    topics: [
      EventTopic.BLOG_PUBLISHED,
      EventTopic.PAGE_PUBLISHED,
      EventTopic.LANDING_PAGE_PUBLISHED,
      EventTopic.MEDIA_UPLOADED,
      EventTopic.NEWSLETTER_SUBSCRIBED,
    ],
    queueName: 'analytics.content.events',
  },

  // Notification Service - sends alerts on publications
  {
    service: 'notification-service',
    topics: [
      EventTopic.BLOG_PUBLISHED,
      EventTopic.NEWSLETTER_SUBSCRIBED,
      EventTopic.NEWSLETTER_UNSUBSCRIBED,
    ],
    queueName: 'notification.content.events',
  },

  // Customer Service - tracks user content interactions
  {
    service: 'customer-service',
    topics: [
      EventTopic.NEWSLETTER_SUBSCRIBED,
      EventTopic.NEWSLETTER_UNSUBSCRIBED,
    ],
    queueName: 'customer.content.events',
  },
];

// ---------------------------------------------------------------------------
// Routing Patterns
// ---------------------------------------------------------------------------
export const ROUTING_PATTERNS = {
  ALL_BLOG_EVENTS: 'blog.*',
  ALL_PAGE_EVENTS: 'page.*',
  ALL_MEDIA_EVENTS: 'media.*',
  ALL_SEO_EVENTS: 'seo.*',
  ALL_LANDING_EVENTS: 'landing.*',
  ALL_NEWSLETTER_EVENTS: 'newsletter.*',
  ALL_SYSTEM_EVENTS: 'system.*',
  ALL_PUBLISHED_EVENTS: '*.published',
  ALL_DELETED_EVENTS: '*.deleted',
  ALL_CONTENT_EVENTS: '*.*',
} as const;

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------
export const getTopicConfig = (topic: EventTopic): TopicConfig => {
  return TOPIC_CONFIGS[topic];
};

export const getRoutingKey = (topic: EventTopic): string => {
  return TOPIC_CONFIGS[topic].routingKey;
};

export const getTopicsByPattern = (pattern: string): EventTopic[] => {
  const regex = new RegExp(
    `^${pattern.replace(/\*/g, '.*').replace(/\./g, '\\.')}$`,
  );

  return Object.values(EventTopic).filter((topic) =>
    regex.test(getRoutingKey(topic)),
  );
};

export const isPublishEvent = (topic: EventTopic): boolean => {
  return topic.endsWith('.published');
};

export const isDeleteEvent = (topic: EventTopic): boolean => {
  return topic.endsWith('.deleted');
};

export const isCriticalEvent = (topic: EventTopic): boolean => {
  const config = getTopicConfig(topic);
  return (config.priority ?? 0) >= 8;
};

// ---------------------------------------------------------------------------
// Exchange Configuration
// ---------------------------------------------------------------------------
export interface ExchangeConfig {
  name: string;
  type: 'topic' | 'direct' | 'fanout' | 'headers';
  durable: boolean;
  autoDelete: boolean;
}

export const EXCHANGE_CONFIGS: ExchangeConfig[] = [
  {
    name: CONTENT_EXCHANGE,
    type: 'topic',
    durable: true,
    autoDelete: false,
  },
  {
    name: CONTENT_DLX,
    type: 'topic',
    durable: true,
    autoDelete: false,
  },
];

// ---------------------------------------------------------------------------
// Queue Configuration Templates
// ---------------------------------------------------------------------------
export interface QueueConfig {
  name: string;
  durable: boolean;
  exclusive: boolean;
  autoDelete: boolean;
  deadLetterExchange?: string;
  messageTtl?: number;
  maxLength?: number;
  maxPriority?: number;
}

export const getDefaultQueueConfig = (
  queueName: string,
  options: Partial<QueueConfig> = {},
): QueueConfig => {
  return {
    name: queueName,
    durable: true,
    exclusive: false,
    autoDelete: false,
    deadLetterExchange: CONTENT_DLX,
    maxPriority: 10,
    messageTtl: 86_400_000, // 24 hours
    maxLength: 10_000,
    ...options,
  };
};

// ---------------------------------------------------------------------------
// Dead Letter Queue Configuration
// ---------------------------------------------------------------------------
export const getDLQConfig = (originalQueueName: string): QueueConfig => {
  return {
    name: `${originalQueueName}.dlq`,
    durable: true,
    exclusive: false,
    autoDelete: false,
    messageTtl: 604_800_000, // 7 days
    maxLength: 1_000,
  };
};

// ---------------------------------------------------------------------------
// Event Type Guards
// ---------------------------------------------------------------------------
export const isBlogEvent = (topic: EventTopic): boolean => {
  return topic.startsWith('content.blog.');
};

export const isPageEvent = (topic: EventTopic): boolean => {
  return topic.startsWith('content.page.');
};

export const isMediaEvent = (topic: EventTopic): boolean => {
  return topic.startsWith('content.media.');
};

export const isSEOEvent = (topic: EventTopic): boolean => {
  return topic.startsWith('content.seo.');
};

export const isLandingPageEvent = (topic: EventTopic): boolean => {
  return topic.startsWith('content.landing.');
};

export const isNewsletterEvent = (topic: EventTopic): boolean => {
  return topic.startsWith('content.newsletter.');
};

export const isSystemEvent = (topic: EventTopic): boolean => {
  return topic.startsWith('content.system.');
};