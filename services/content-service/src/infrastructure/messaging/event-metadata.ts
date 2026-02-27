/**
 * content-service/src/infrastructure/messaging/event-metadata.ts
 *
 * Event metadata and envelope structures for the Content Service.
 * Provides:
 *   - Event envelope with metadata, tracing, and versioning
 *   - Event serialization and deserialization
 *   - Event validation and schema versioning
 *   - Correlation ID tracking for distributed tracing
 */

import { randomUUID } from 'node:crypto';
import { EventTopic } from './event-topics';

// ---------------------------------------------------------------------------
// Event Envelope Structure
// ---------------------------------------------------------------------------
export interface EventEnvelope<T = unknown> {
  // Event identification
  id: string;
  topic: EventTopic;
  version: string;

  // Event payload
  data: T;

  // Metadata
  metadata: EventMetadata;

  // Timestamps
  timestamp: Date;
  occurredAt: Date;
}

export interface EventMetadata {
  // Tracing
  correlationId: string;
  causationId?: string;
  conversationId?: string;

  // Source
  source: string;
  sourceVersion: string;

  // Actor (who/what triggered the event)
  actorId?: string;
  actorType?: 'user' | 'system' | 'service' | 'admin';

  // Context
  environment: string;
  tenantId?: string;

  // Delivery
  priority: number;
  retryCount: number;
  maxRetries: number;
  ttl?: number; // milliseconds

  // Custom attributes
  attributes?: Record<string, string | number | boolean>;
}

// ---------------------------------------------------------------------------
// Event Payload Types
// ---------------------------------------------------------------------------
export interface BlogEventPayload {
  blogId: string;
  slug: string;
  title: string;
  authorId: string;
  categoryId?: string;
  tags?: string[];
  publishedAt?: Date;
  previousVersion?: {
    title: string;
    slug: string;
  };
}

export interface PageEventPayload {
  pageId: string;
  slug: string;
  title: string;
  pageType: 'about' | 'contact' | 'terms' | 'privacy' | 'custom';
  publishedAt?: Date;
  previousVersion?: {
    title: string;
    slug: string;
  };
}

export interface MediaEventPayload {
  mediaId: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  contentType: 'blog' | 'page' | 'media-wall' | 'landing' | 'general';
  dimensions?: {
    width: number;
    height: number;
  };
  optimizedVersions?: Array<{
    url: string;
    width: number;
    height: number;
    format: string;
  }>;
}

export interface SEOEventPayload {
  entityId: string;
  entityType: 'blog' | 'page' | 'landing';
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
  canonical?: string;
}

export interface SitemapEventPayload {
  urlCount: number;
  lastModified: Date;
  sitemapUrl: string;
  indexUrl?: string;
}

export interface LandingPageEventPayload {
  landingPageId: string;
  slug: string;
  title: string;
  campaignId?: string;
  publishedAt?: Date;
  variant?: string;
}

export interface NewsletterEventPayload {
  email: string;
  source: string;
  categories?: string[];
  doubleOptIn: boolean;
  ipAddress?: string;
  userAgent?: string;
}

export interface CacheInvalidationPayload {
  paths: string[];
  tags?: string[];
  reason: string;
  invalidationType: 'full' | 'partial' | 'tag';
}

export interface SearchIndexPayload {
  entityId: string;
  entityType: 'blog' | 'page' | 'landing';
  action: 'index' | 'update' | 'delete';
  indexName: string;
}

// ---------------------------------------------------------------------------
// Event Factory
// ---------------------------------------------------------------------------
export class EventFactory {
  private readonly serviceName: string;
  private readonly serviceVersion: string;
  private readonly environment: string;

  constructor(
    serviceName = 'content-service',
    serviceVersion = '1.0.0',
    environment = process.env.NODE_ENV ?? 'development',
  ) {
    this.serviceName = serviceName;
    this.serviceVersion = serviceVersion;
    this.environment = environment;
  }

  createEvent<T>(
    topic: EventTopic,
    data: T,
    options: Partial<EventMetadata> = {},
  ): EventEnvelope<T> {
    const now = new Date();
    const correlationId = options.correlationId ?? randomUUID();

    return {
      id: randomUUID(),
      topic,
      version: this.getEventVersion(topic),
      data,
      metadata: {
        correlationId,
        causationId: options.causationId,
        conversationId: options.conversationId ?? correlationId,
        source: this.serviceName,
        sourceVersion: this.serviceVersion,
        actorId: options.actorId,
        actorType: options.actorType ?? 'system',
        environment: this.environment,
        tenantId: options.tenantId,
        priority: options.priority ?? 5,
        retryCount: 0,
        maxRetries: options.maxRetries ?? 3,
        ttl: options.ttl,
        attributes: options.attributes,
      },
      timestamp: now,
      occurredAt: now,
    };
  }

  private getEventVersion(topic: EventTopic): string {
    // Version mapping for schema evolution
    const versionMap: Partial<Record<EventTopic, string>> = {
      [EventTopic.BLOG_CREATED]: 'v1',
      [EventTopic.BLOG_UPDATED]: 'v1',
      [EventTopic.BLOG_PUBLISHED]: 'v1',
      [EventTopic.PAGE_CREATED]: 'v1',
      [EventTopic.PAGE_UPDATED]: 'v1',
      [EventTopic.MEDIA_UPLOADED]: 'v1',
      [EventTopic.SEO_UPDATED]: 'v1',
      [EventTopic.LANDING_PAGE_CREATED]: 'v1',
      [EventTopic.NEWSLETTER_SUBSCRIBED]: 'v1',
      [EventTopic.CACHE_INVALIDATED]: 'v1',
      [EventTopic.SEARCH_INDEX_UPDATED]: 'v1',
    };

    return versionMap[topic] ?? 'v1';
  }
}

// ---------------------------------------------------------------------------
// Event Serialization
// ---------------------------------------------------------------------------
export class EventSerializer {
  static serialize<T>(event: EventEnvelope<T>): string {
    return JSON.stringify(event, (_, value) => {
      // Convert Dates to ISO strings
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    });
  }

  static serializeToBuffer<T>(event: EventEnvelope<T>): Buffer {
    return Buffer.from(this.serialize(event), 'utf-8');
  }

  static deserialize<T>(json: string): EventEnvelope<T> {
    const parsed = JSON.parse(json);

    // Convert ISO strings back to Dates
    if (parsed.timestamp) {
      parsed.timestamp = new Date(parsed.timestamp);
    }
    if (parsed.occurredAt) {
      parsed.occurredAt = new Date(parsed.occurredAt);
    }

    return parsed as EventEnvelope<T>;
  }

  static deserializeFromBuffer<T>(buffer: Buffer): EventEnvelope<T> {
    return this.deserialize(buffer.toString('utf-8'));
  }
}

// ---------------------------------------------------------------------------
// Event Validation
// ---------------------------------------------------------------------------
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export class EventValidator {
  static validate<T>(event: EventEnvelope<T>): ValidationResult {
    const errors: string[] = [];

    // Required fields
    if (!event.id) errors.push('Event ID is required');
    if (!event.topic) errors.push('Event topic is required');
    if (!event.version) errors.push('Event version is required');
    if (!event.data) errors.push('Event data is required');
    if (!event.timestamp) errors.push('Event timestamp is required');
    if (!event.occurredAt) errors.push('Event occurredAt is required');

    // Metadata validation
    if (!event.metadata) {
      errors.push('Event metadata is required');
    } else {
      if (!event.metadata.correlationId) {
        errors.push('Correlation ID is required');
      }
      if (!event.metadata.source) {
        errors.push('Event source is required');
      }
      if (!event.metadata.sourceVersion) {
        errors.push('Source version is required');
      }
      if (!event.metadata.environment) {
        errors.push('Environment is required');
      }
      if (typeof event.metadata.priority !== 'number') {
        errors.push('Priority must be a number');
      }
      if (typeof event.metadata.retryCount !== 'number') {
        errors.push('Retry count must be a number');
      }
      if (typeof event.metadata.maxRetries !== 'number') {
        errors.push('Max retries must be a number');
      }
    }

    // Version format validation
    if (event.version && !/^v\d+$/.test(event.version)) {
      errors.push('Version must be in format: v1, v2, etc.');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  static validatePayload<T>(
    data: T,
    schema: Record<string, 'string' | 'number' | 'boolean' | 'object' | 'array'>,
  ): ValidationResult {
    const errors: string[] = [];

    for (const [key, expectedType] of Object.entries(schema)) {
      const value = (data as Record<string, unknown>)[key];

      if (value === undefined || value === null) {
        errors.push(`Missing required field: ${key}`);
        continue;
      }

      const actualType = Array.isArray(value) ? 'array' : typeof value;

      if (actualType !== expectedType) {
        errors.push(`Field ${key} must be of type ${expectedType}, got ${actualType}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// ---------------------------------------------------------------------------
// Event Enrichment
// ---------------------------------------------------------------------------
export class EventEnricher {
  static enrichWithTracing<T>(
    event: EventEnvelope<T>,
    parentEvent?: EventEnvelope<unknown>,
  ): EventEnvelope<T> {
    if (parentEvent) {
      event.metadata.correlationId = parentEvent.metadata.correlationId;
      event.metadata.causationId = parentEvent.id;
      event.metadata.conversationId = parentEvent.metadata.conversationId;
    }

    return event;
  }

  static enrichWithActor<T>(
    event: EventEnvelope<T>,
    actorId: string,
    actorType: 'user' | 'system' | 'service' | 'admin',
  ): EventEnvelope<T> {
    event.metadata.actorId = actorId;
    event.metadata.actorType = actorType;
    return event;
  }

  static enrichWithAttributes<T>(
    event: EventEnvelope<T>,
    attributes: Record<string, string | number | boolean>,
  ): EventEnvelope<T> {
    event.metadata.attributes = {
      ...event.metadata.attributes,
      ...attributes,
    };
    return event;
  }
}

// ---------------------------------------------------------------------------
// Event Retry Logic
// ---------------------------------------------------------------------------
export interface RetryPolicy {
  maxRetries: number;
  backoffMultiplier: number;
  initialDelayMs: number;
  maxDelayMs: number;
}

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxRetries: 3,
  backoffMultiplier: 2,
  initialDelayMs: 1000,
  maxDelayMs: 30_000,
};

export class EventRetryHelper {
  static shouldRetry<T>(event: EventEnvelope<T>): boolean {
    return event.metadata.retryCount < event.metadata.maxRetries;
  }

  static incrementRetryCount<T>(event: EventEnvelope<T>): EventEnvelope<T> {
    return {
      ...event,
      metadata: {
        ...event.metadata,
        retryCount: event.metadata.retryCount + 1,
      },
    };
  }

  static calculateBackoff(
    retryCount: number,
    policy: RetryPolicy = DEFAULT_RETRY_POLICY,
  ): number {
    const delay = Math.min(
      policy.initialDelayMs * Math.pow(policy.backoffMultiplier, retryCount),
      policy.maxDelayMs,
    );

    // Add jitter (±20%)
    const jitter = delay * 0.2 * (Math.random() * 2 - 1);
    return Math.floor(delay + jitter);
  }

  static isExpired<T>(event: EventEnvelope<T>): boolean {
    if (!event.metadata.ttl) {
      return false;
    }

    const expiresAt = event.timestamp.getTime() + event.metadata.ttl;
    return Date.now() > expiresAt;
  }
}

// ---------------------------------------------------------------------------
// Event Filtering
// ---------------------------------------------------------------------------
export class EventFilter {
  static byTopic(events: EventEnvelope<unknown>[], topic: EventTopic): EventEnvelope<unknown>[] {
    return events.filter((e) => e.topic === topic);
  }

  static byCorrelationId(
    events: EventEnvelope<unknown>[],
    correlationId: string,
  ): EventEnvelope<unknown>[] {
    return events.filter((e) => e.metadata.correlationId === correlationId);
  }

  static byActorId(
    events: EventEnvelope<unknown>[],
    actorId: string,
  ): EventEnvelope<unknown>[] {
    return events.filter((e) => e.metadata.actorId === actorId);
  }

  static byPriority(
    events: EventEnvelope<unknown>[],
    minPriority: number,
  ): EventEnvelope<unknown>[] {
    return events.filter((e) => e.metadata.priority >= minPriority);
  }

  static byTimeRange(
    events: EventEnvelope<unknown>[],
    start: Date,
    end: Date,
  ): EventEnvelope<unknown>[] {
    return events.filter(
      (e) => e.timestamp >= start && e.timestamp <= end,
    );
  }
}

// ---------------------------------------------------------------------------
// Export helper instances
// ---------------------------------------------------------------------------
export const eventFactory = new EventFactory();
export const eventSerializer = EventSerializer;
export const eventValidator = EventValidator;
export const eventEnricher = EventEnricher;
export const eventRetryHelper = EventRetryHelper;
export const eventFilter = EventFilter;