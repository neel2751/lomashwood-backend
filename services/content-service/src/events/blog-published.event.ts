import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '../config/logger';
import { buildTopicName } from '../config/messaging';
import { PublishResult, PublishOptions } from '../infrastructure/messaging/event-producer';
import { EventEnvelope } from '../infrastructure/messaging/event-metadata'; // Fix 1: removed EventTopic import since it's not exported
import { env } from '../config/env';

const log = createLogger('BlogPublishedEvent');

export interface BlogPublishedEventData {
  blogId: string;
  slug: string;
  title: string;
  excerpt: string | null;
  heroImageUrl: string | null;
  authorId: string;
  authorName: string;
  category: string;
  tags: string[];
  publishedAt: string;
  readTimeMinutes: number | null;
}

// Use a specific event type that allows the fully-qualified topic string
export type BlogPublishedEvent = EventEnvelope<BlogPublishedEventData> & {
  topic: string;
};

export const BLOG_PUBLISHED_TOPIC = buildTopicName('content.blog.published');

export function createBlogPublishedEvent(
  data: BlogPublishedEventData,
): BlogPublishedEvent {
  const now = new Date();
  return {
    id: uuidv4(),
    topic: BLOG_PUBLISHED_TOPIC as BlogPublishedEvent['topic'], // Fix 1: cast using the envelope's own topic type — no need to import EventTopic
    version: 'v1',
    data,
    metadata: {
      correlationId: uuidv4(),
      source: 'content-service',
      sourceVersion: '1.0',
      environment: env.NODE_ENV || 'development',
      actorType: 'service',
      priority: 8,
      retryCount: 0,           // Fix 2: was string '0', must be number 0
      maxRetries: 3,           // Fix 2: was string '3', must be number 3
    },
    timestamp: now,
    occurredAt: now,
  } as BlogPublishedEvent;
}

export interface IEventProducer {
  publish<T>(topic: string, event: EventEnvelope<T>, options?: PublishOptions): Promise<PublishResult>;
}

export async function publishBlogPublishedEvent(
  producer: IEventProducer,
  data: BlogPublishedEventData,
): Promise<void> {
  const event = createBlogPublishedEvent(data);

  try {
    const result = await producer.publish(BLOG_PUBLISHED_TOPIC, event);
    if (!result.success) {
      throw result.error || new Error('Failed to publish blog published event');
    }

    log.info(
      {
        eventId: event.id,
        blogId: data.blogId,
        slug: data.slug,
        topic: BLOG_PUBLISHED_TOPIC,
      },
      '[BlogPublishedEvent] Event published',
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error(
      {
        eventId: event.id,
        blogId: data.blogId,
        topic: BLOG_PUBLISHED_TOPIC,
        error: message,
      },
      '[BlogPublishedEvent] Failed to publish event',
    );
    throw err;
  }
}

export const BLOG_PUBLISHED_CONSUMERS = [
  'notification-service',
  'analytics-service',
  'content-service',
] as const;