import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '../config/logger';
import { buildTopicName } from '../config/messaging';
import { PublishResult, PublishOptions } from '../infrastructure/messaging/event-producer';
import { EventEnvelope } from '../infrastructure/messaging/event-metadata';
import { env } from '../config/env';

const log = createLogger('PagePublishedEvent');

export type CmsPageType =
  | 'FINANCE'
  | 'ABOUT'
  | 'OUR_PROCESS'
  | 'WHY_CHOOSE_US'
  | 'CONTACT'
  | 'CAREERS'
  | 'MEDIA_WALL'
  | 'CUSTOMER_REVIEWS'
  | 'TERMS_CONDITIONS'
  | 'PRIVACY_POLICY'
  | 'COOKIES'
  | 'LANDING'
  | 'CUSTOM';

export interface PagePublishedEventData {
  pageId: string;
  slug: string;
  title: string;
  pageType: CmsPageType;
  heroImageUrl: string | null;
  isRepublish: boolean;
  slugChanged: boolean;
  previousSlug: string | null;
  isIndexable: boolean;
  publishedBy: string;
  publishedAt: string;
}

// Use a specific event type that allows the fully-qualified topic string
export type PagePublishedEvent = EventEnvelope<PagePublishedEventData> & {
  topic: string;
};

export const PAGE_PUBLISHED_TOPIC = buildTopicName('content.page.published');

export const PAGE_SITEMAP_PRIORITY: Record<CmsPageType, number> = {
  FINANCE:          0.7,
  ABOUT:            0.5,
  OUR_PROCESS:      0.5,
  WHY_CHOOSE_US:    0.5,
  CONTACT:          0.6,
  CAREERS:          0.5,
  MEDIA_WALL:       0.6,
  CUSTOMER_REVIEWS: 0.5,
  TERMS_CONDITIONS: 0.3,
  PRIVACY_POLICY:   0.3,
  COOKIES:          0.3,
  LANDING:          0.8,
  CUSTOM:           0.5,
};

export function getPageSitemapPriority(pageType: CmsPageType): number {
  return PAGE_SITEMAP_PRIORITY[pageType] ?? 0.5;
}

export function createPagePublishedEvent(data: PagePublishedEventData): PagePublishedEvent {
  const now = new Date();
  return {
    id: uuidv4(),
    topic: PAGE_PUBLISHED_TOPIC,
    version: 'v1',
    data,
    metadata: {
      correlationId: uuidv4(),
      source: 'content-service',
      sourceVersion: '1.0',
      environment: env.NODE_ENV || 'development',
      actorType: 'service',
      priority: 9,
      retryCount: 0,
      maxRetries: 3,
    },
    timestamp: now,
    occurredAt: now,
  } as PagePublishedEvent;
}


export interface IEventProducer {
  publish<T>(topic: string, event: EventEnvelope<T>, options?: PublishOptions): Promise<PublishResult>;
}

export async function publishPagePublishedEvent(
  producer: IEventProducer,
  data: PagePublishedEventData,
): Promise<void> {
  const event = createPagePublishedEvent(data);

  try {
    const result = await producer.publish(PAGE_PUBLISHED_TOPIC, event);
    if (!result.success) {
      throw result.error || new Error('Failed to publish page published event');
    }

    log.info(
      {
        eventId: event.id,
        pageId: data.pageId,
        slug: data.slug,
        pageType: data.pageType,
        isRepublish: data.isRepublish,
        slugChanged: data.slugChanged,
        isIndexable: data.isIndexable,
        topic: PAGE_PUBLISHED_TOPIC,
      },
      '[PagePublishedEvent] Event published',
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error(
      {
        eventId: event.id,
        pageId: data.pageId,
        topic: PAGE_PUBLISHED_TOPIC,
        error: message,
      },
      '[PagePublishedEvent] Failed to publish event',
    );
    throw err;
  }
}

export function requiresRedirect(data: PagePublishedEventData): boolean {
  return data.slugChanged && data.previousSlug !== null && data.previousSlug !== data.slug;
}

export const PAGE_PUBLISHED_CONSUMERS = ['content-service', 'analytics-service'] as const;