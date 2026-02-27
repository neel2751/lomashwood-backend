// ─── Base Event Envelope ──────────────────────────────────────────────────────

/**
 * Every event published on the bus must conform to this envelope.
 * The `data` field carries the domain-specific payload.
 */
export interface ContentEventPayload<T = unknown> {
  /** Globally unique event identifier (UUID v4). */
  eventId: string;
  /** ISO-8601 timestamp of when the event was produced. */
  occurredAt: string;
  /** Service that emitted this event. */
  source: string;
  /** Semantic version of the event schema. */
  schemaVersion: string;
  /** Domain-specific payload. */
  data: T;
}

// ─── Inbound: Product Service Events ─────────────────────────────────────────

export interface ProductCreatedData {
  productId: string;
  title: string;
  /** 'KITCHEN' | 'BEDROOM' */
  category: string;
  slug: string;
  createdAt: string;
}

export type ProductCreatedPayload = ContentEventPayload<ProductCreatedData>;

export interface ProductUpdatedData {
  productId: string;
  title: string;
  /** 'KITCHEN' | 'BEDROOM' */
  category: string;
  slug: string;
  updatedFields: string[];
  updatedAt: string;
}

export type ProductUpdatedPayload = ContentEventPayload<ProductUpdatedData>;

// ─── Inbound: Order / Payment Service Events ──────────────────────────────────

export interface OrderCreatedData {
  orderId: string;
  customerId: string;
  /** 'KITCHEN' | 'BEDROOM' | 'BOTH' */
  category: string;
  totalAmount: number;
  currency: string;
  createdAt: string;
}

export type OrderCreatedPayload = ContentEventPayload<OrderCreatedData>;

// ─── Internal: Blog Lifecycle Events ─────────────────────────────────────────

export interface BlogPublishedData {
  blogId: string;
  slug: string;
  title: string;
  authorId: string;
  /** ISO-8601 */
  publishedAt: string;
  tags: string[];
  /** 'KITCHEN' | 'BEDROOM' | 'GENERAL' */
  category: string;
}

export type BlogPublishedPayload = ContentEventPayload<BlogPublishedData>;

export interface BlogUpdatedData {
  blogId: string;
  slug: string;
  title: string;
  updatedFields: string[];
  updatedAt: string;
}

export type BlogUpdatedPayload = ContentEventPayload<BlogUpdatedData>;

// ─── Internal: Media Lifecycle Events ─────────────────────────────────────────

export interface MediaUploadedData {
  mediaId: string;
  /** The parent entity this media belongs to. */
  entityType: 'BLOG' | 'PAGE' | 'PRODUCT' | 'MEDIA_WALL' | 'SHOWROOM' | 'LANDING';
  entityId: string;
  /** Full CDN URL. */
  url: string;
  /** Original filename. */
  filename: string;
  mimeType: string;
  /** Bytes */
  sizeBytes: number;
  uploadedBy: string;
  uploadedAt: string;
}

export type MediaUploadedPayload = ContentEventPayload<MediaUploadedData>;

// ─── Internal: Page Lifecycle Events ─────────────────────────────────────────

export interface PagePublishedData {
  pageId: string;
  slug: string;
  title: string;
  /** 'FINANCE' | 'ABOUT' | 'PROCESS' | 'WHY_CHOOSE_US' | 'CONTACT' | 'CAREERS' | 'CUSTOM' */
  pageType: string;
  publishedBy: string;
  publishedAt: string;
}

export type PagePublishedPayload = ContentEventPayload<PagePublishedData>;

// ─── Internal: SEO Lifecycle Events ──────────────────────────────────────────

export interface SeoUpdatedData {
  seoId: string;
  entityType: 'BLOG' | 'PAGE' | 'PRODUCT' | 'LANDING' | 'MEDIA_WALL';
  entityId: string;
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string | null;
  updatedBy: string;
  updatedAt: string;
}

export type SeoUpdatedPayload = ContentEventPayload<SeoUpdatedData>;

// ─── Internal: Sitemap Events ─────────────────────────────────────────────────

export interface SitemapRegenerateData {
  /** Service or job that triggered the rebuild. */
  triggeredBy: string;
  /** ISO-8601 */
  requestedAt: string;
  /** Optional: limit rebuild to specific content types. */
  scope?: Array<'BLOGS' | 'PAGES' | 'PRODUCTS' | 'LANDING'>;
}

export type SitemapRegeneratePayload = ContentEventPayload<SitemapRegenerateData>;

// ─── Outbound: Events Published by Content Service ───────────────────────────

/**
 * Emitted after a blog post goes live.
 * Consumed by: notification-service (email digest), analytics-service.
 */
export interface ContentBlogPublishedOutbound {
  blogId: string;
  slug: string;
  title: string;
  previewImageUrl: string | null;
  category: string;
  publishedAt: string;
}

/**
 * Emitted after a CMS page is published.
 * Consumed by: analytics-service (page-view seeding).
 */
export interface ContentPagePublishedOutbound {
  pageId: string;
  slug: string;
  pageType: string;
  publishedAt: string;
}

/**
 * Emitted after sitemap.xml is successfully rebuilt.
 * Consumed by: analytics-service (for crawl-tracking).
 */
export interface ContentSitemapRebuiltOutbound {
  totalUrls: number;
  rebuiltAt: string;
  triggeredBy: string;
}

/**
 * Emitted when media processing (thumbnail, CDN sync) completes.
 * Consumed by: product-service, notification-service.
 */
export interface ContentMediaProcessedOutbound {
  mediaId: string;
  entityType: string;
  entityId: string;
  processedUrl: string;
  thumbnailUrl: string | null;
  processedAt: string;
}

// ─── Union of all payload types (for exhaustive type checks) ─────────────────

export type AnyContentEventPayload =
  | ProductCreatedPayload
  | ProductUpdatedPayload
  | OrderCreatedPayload
  | BlogPublishedPayload
  | BlogUpdatedPayload
  | MediaUploadedPayload
  | PagePublishedPayload
  | SeoUpdatedPayload
  | SitemapRegeneratePayload;