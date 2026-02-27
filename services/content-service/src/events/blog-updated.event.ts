import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '../config/logger';
import { buildTopicName } from '../config/messaging';
import { PublishResult, PublishOptions } from '../infrastructure/messaging/event-producer';
import { EventEnvelope } from '../infrastructure/messaging/event-metadata';
import { env } from '../config/env';

const log = createLogger('BlogUpdatedEvent');

// ─── Event Payload ────────────────────────────────────────────────────────────

export type BlogUpdatedField =
  | 'title'
  | 'slug'
  | 'excerpt'
  | 'content'
  | 'heroImageUrl'
  | 'images'
  | 'tags'
  | 'category'
  | 'seoTitle'
  | 'seoDescription'
  | 'status'
  | 'scheduledAt'
  | 'readTimeMinutes';

export interface BlogUpdatedEventData {
  blogId: string;
  slug: string;
  title: string;
  authorId: string;
  /** Fields that were modified in this update. */
  updatedFields: BlogUpdatedField[];
  /**
   * True when the slug changed — downstream services must update
   * any cached links or redirects referencing the old slug.
   */
  slugChanged: boolean;
  previousSlug: string | null;
  /** True when SEO-relevant fields (title, description, slug) changed. */
  seoImpacting: boolean;
  /** True when the hero image or gallery changed. */
  mediaChanged: boolean;
  updatedAt: string;
  updatedBy: string;
}

// Use a specific event type that allows the fully-qualified topic string
export type BlogUpdatedEvent = EventEnvelope<BlogUpdatedEventData> & {
  topic: string;
};

// ─── Topic ────────────────────────────────────────────────────────────────────

export const BLOG_UPDATED_TOPIC = buildTopicName('content.blog.updated');

// ─── SEO Impact Detector ──────────────────────────────────────────────────────

const SEO_IMPACTING_FIELDS: BlogUpdatedField[] = [
  'title',
  'slug',
  'excerpt',
  'seoTitle',
  'seoDescription',
];

const MEDIA_IMPACTING_FIELDS: BlogUpdatedField[] = ['heroImageUrl', 'images'];

export function isSeoImpacting(updatedFields: BlogUpdatedField[]): boolean {
  return updatedFields.some((f) => SEO_IMPACTING_FIELDS.includes(f));
}

export function isMediaChanged(updatedFields: BlogUpdatedField[]): boolean {
  return updatedFields.some((f) => MEDIA_IMPACTING_FIELDS.includes(f));
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createBlogUpdatedEvent(
  data: BlogUpdatedEventData,
): BlogUpdatedEvent {
  const now = new Date();
  return {
    id: uuidv4(),
    topic: BLOG_UPDATED_TOPIC,
    version: 'v1',
    data,
    metadata: {
      correlationId: uuidv4(),
      source: 'content-service',
      sourceVersion: '1.0',
      environment: env.NODE_ENV || 'development',
      actorType: 'service',
      priority: 5,
      retryCount: 0,
      maxRetries: 3,
    },
    timestamp: now,
    occurredAt: now,
  } as BlogUpdatedEvent;
}


// ─── Publisher ────────────────────────────────────────────────────────────────

export interface IEventProducer {
  publish<T>(topic: string, event: EventEnvelope<T>, options?: PublishOptions): Promise<PublishResult>;
}

export async function publishBlogUpdatedEvent(
  producer: IEventProducer,
  data: BlogUpdatedEventData,
): Promise<void> {
  const event = createBlogUpdatedEvent(data);

  try {
    const result = await producer.publish(BLOG_UPDATED_TOPIC, event);
    if (!result.success) {
      throw result.error || new Error('Failed to publish blog updated event');
    }

    log.info(
      {
        eventId: event.id,
        blogId: data.blogId,
        slug: data.slug,
        updatedFields: data.updatedFields,
        slugChanged: data.slugChanged,
        seoImpacting: data.seoImpacting,
        topic: BLOG_UPDATED_TOPIC,
      },
      '[BlogUpdatedEvent] Event published',
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error(
      {
        eventId: event.id,
        blogId: data.blogId,
        topic: BLOG_UPDATED_TOPIC,
        error: message,
      },
      '[BlogUpdatedEvent] Failed to publish event',
    );
    throw err;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Computes which fields changed between old and new blog snapshots.
 * Used by the blog service before publishing the update event.
 */
export function detectUpdatedFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): BlogUpdatedField[] {
  const tracked: BlogUpdatedField[] = [
    'title', 'slug', 'excerpt', 'content', 'heroImageUrl',
    'images', 'tags', 'category', 'seoTitle', 'seoDescription',
    'status', 'scheduledAt', 'readTimeMinutes',
  ];

  return tracked.filter((field) => {
    const prev = before[field];
    const next = after[field];

    if (Array.isArray(prev) && Array.isArray(next)) {
      return JSON.stringify(prev) !== JSON.stringify(next);
    }

    return prev !== next;
  });
}

// ─── Consumers ────────────────────────────────────────────────────────────────

/**
 * Downstream services that subscribe to this event:
 *
 * - content-service self → invalidates blog cache, refreshes SEO meta
 * - analytics-service   → records a content_updated event
 *
 * If `slugChanged` is true, any service caching blog URLs must update redirects.
 */
export const BLOG_UPDATED_CONSUMERS = [
  'content-service',
  'analytics-service',
] as const;