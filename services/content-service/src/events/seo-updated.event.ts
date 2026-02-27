import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '../config/logger';
import { buildTopicName } from '../config/messaging';
import { PublishResult } from '../infrastructure/messaging/event-producer';

const log = createLogger('SeoUpdatedEvent');

// ─── Event Payload ────────────────────────────────────────────────────────────

export type SeoEntityType =
  | 'BLOG'
  | 'PAGE'
  | 'PRODUCT'
  | 'LANDING'
  | 'MEDIA_WALL'
  | 'SHOWROOM';

export interface SeoMetaSnapshot {
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImageUrl: string | null;
  twitterTitle: string | null;
  twitterDescription: string | null;
  twitterImageUrl: string | null;
  /** JSON-LD structured data blob (stringified). */
  structuredData: string | null;
  robotsDirective: 'index,follow' | 'noindex,nofollow' | 'noindex,follow' | 'index,nofollow';
}

export type SeoUpdatedField = keyof SeoMetaSnapshot;

export interface SeoUpdatedEventData {
  seoId: string;
  entityType: SeoEntityType;
  entityId: string;
  /** Human-readable identifier for the entity (slug or title). */
  entityRef: string;
  /** Fields that changed in this update. */
  updatedFields: SeoUpdatedField[];
  /** Snapshot of the new SEO values after the update. */
  after: SeoMetaSnapshot;
  /** Snapshot of the previous SEO values before the update. */
  before: Partial<SeoMetaSnapshot>;
  /**
   * True when the canonical URL changed.
   * Consumers must update any cached or pre-rendered pages.
   */
  canonicalChanged: boolean;
  /**
   * True when robots directive changed to noindex.
   * Search index consumers must remove this entity from their indexes.
   */
  deindexed: boolean;
  updatedBy: string;
  updatedAt: string;
}

export interface SeoUpdatedEvent {
  eventId: string;
  occurredAt: string;
  source: 'content-service';
  schemaVersion: '1.0';
  type: 'content.seo.updated';
  data: SeoUpdatedEventData;
}

// ─── Topic ────────────────────────────────────────────────────────────────────

export const SEO_UPDATED_TOPIC = buildTopicName('content.seo.updated');

// ─── Deindex Detector ─────────────────────────────────────────────────────────

const NOINDEX_DIRECTIVES = new Set([
  'noindex,nofollow',
  'noindex,follow',
]);

export function isDeindexed(after: SeoMetaSnapshot, before: Partial<SeoMetaSnapshot>): boolean {
  return (
    NOINDEX_DIRECTIVES.has(after.robotsDirective) &&
    before.robotsDirective !== undefined &&
    !NOINDEX_DIRECTIVES.has(before.robotsDirective)
  );
}

export function isCanonicalChanged(
  after: SeoMetaSnapshot,
  before: Partial<SeoMetaSnapshot>,
): boolean {
  return (
    before.canonicalUrl !== undefined &&
    before.canonicalUrl !== after.canonicalUrl
  );
}

// ─── Updated Fields Detector ──────────────────────────────────────────────────

export function detectSeoUpdatedFields(
  before: Partial<SeoMetaSnapshot>,
  after: SeoMetaSnapshot,
): SeoUpdatedField[] {
  const keys = Object.keys(after) as SeoUpdatedField[];
  return keys.filter((key) => before[key] !== after[key]);
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createSeoUpdatedEvent(data: SeoUpdatedEventData): SeoUpdatedEvent {
  return {
    eventId: uuidv4(),
    occurredAt: new Date().toISOString(),
    source: 'content-service',
    schemaVersion: '1.0',
    type: 'content.seo.updated',
    data,
  };
}

// ─── Publisher ────────────────────────────────────────────────────────────────

export interface IEventProducer {
  publish(topic: string, payload: unknown): Promise<PublishResult>;
}

export async function publishSeoUpdatedEvent(
  producer: IEventProducer,
  data: SeoUpdatedEventData,
): Promise<void> {
  const event = createSeoUpdatedEvent(data);

  try {
    const result = await producer.publish(SEO_UPDATED_TOPIC, event);
    if (!result.success) {
      throw result.error || new Error('Failed to publish seo updated event');
    }

    log.info(
      {
        eventId: event.eventId,
        seoId: data.seoId,
        entityType: data.entityType,
        entityId: data.entityId,
        updatedFields: data.updatedFields,
        canonicalChanged: data.canonicalChanged,
        deindexed: data.deindexed,
        topic: SEO_UPDATED_TOPIC,
      },
      '[SeoUpdatedEvent] Event published',
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error(
      {
        eventId: event.eventId,
        seoId: data.seoId,
        topic: SEO_UPDATED_TOPIC,
        error: message,
      },
      '[SeoUpdatedEvent] Failed to publish event',
    );
    throw err;
  }
}

// ─── Structured Data Helpers ──────────────────────────────────────────────────

/**
 * Builds a JSON-LD Article schema for blog posts.
 * Pass the output as `structuredData` in SeoMetaSnapshot.
 */
export function buildBlogArticleSchema(params: {
  title: string;
  description: string;
  url: string;
  imageUrl: string | null;
  authorName: string;
  publishedAt: string;
  updatedAt: string;
  organizationName?: string;
}): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: params.title,
    description: params.description,
    url: params.url,
    image: params.imageUrl ?? undefined,
    author: {
      '@type': 'Person',
      name: params.authorName,
    },
    publisher: {
      '@type': 'Organization',
      name: params.organizationName ?? 'Lomash Wood',
    },
    datePublished: params.publishedAt,
    dateModified: params.updatedAt,
  });
}

/**
 * Builds a JSON-LD Product schema for kitchen/bedroom products.
 */
export function buildProductSchema(params: {
  title: string;
  description: string;
  url: string;
  imageUrl: string | null;
  category: string;
  brandName?: string;
}): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: params.title,
    description: params.description,
    url: params.url,
    image: params.imageUrl ?? undefined,
    category: params.category,
    brand: {
      '@type': 'Brand',
      name: params.brandName ?? 'Lomash Wood',
    },
  });
}

/**
 * Builds a JSON-LD LocalBusiness schema for showroom pages.
 */
export function buildShowroomSchema(params: {
  name: string;
  address: string;
  phone: string;
  email: string;
  mapUrl: string;
  openingHours: string[];
}): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: params.name,
    address: {
      '@type': 'PostalAddress',
      streetAddress: params.address,
    },
    telephone: params.phone,
    email: params.email,
    url: params.mapUrl,
    openingHoursSpecification: params.openingHours.map((h) => ({
      '@type': 'OpeningHoursSpecification',
      description: h,
    })),
    brand: {
      '@type': 'Brand',
      name: 'Lomash Wood',
    },
  });
}

// ─── Consumers ────────────────────────────────────────────────────────────────

/**
 * Downstream services that subscribe to this event:
 *
 * - content-service self → invalidates SEO cache for entity
 * - analytics-service   → records seo_updated analytics event
 *
 * If `deindexed` is true:
 * - rebuild-search-index job removes the entity from search indexes
 * - sitemap job excludes the entity from next sitemap regeneration
 *
 * If `canonicalChanged` is true:
 * - CDN / API gateway redirect rules must be updated
 */
export const SEO_UPDATED_CONSUMERS = [
  'content-service',
  'analytics-service',
] as const;