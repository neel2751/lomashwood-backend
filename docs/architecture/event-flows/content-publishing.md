# Content Publishing Event Flow

## Overview

This document describes the event-driven flow for content lifecycle management on the Lomash Wood platform. The content-service manages all CMS entities including blogs, pages, media, SEO metadata, and landing pages. Events are published at each stage of the content lifecycle to keep dependent services synchronised.

---

## Actors

| Actor | Role |
|---|---|
| Admin / Content Editor | Creates and manages content via CMS |
| API Gateway | Routes and authenticates CMS requests |
| Content Service | Masters all content state and publishes lifecycle events |
| Analytics Service | Tracks content performance metrics |
| Notification Service | Sends admin alerts for scheduled publish failures |
| Scheduled Jobs | Automate publishing and sitemap regeneration |

---

## Content Entities

| Entity | Route Prefix | SRS Reference |
|---|---|---|
| Blog Posts | `/v1/blog` | FR7.2, FR1.2 |
| CMS Pages | `/v1/pages` | FR7.4 |
| Landing Pages | `/v1/landing` | FR9.6 |
| Media Wall | `/v1/media` | FR7.3, FR1.7 |
| SEO Metadata | `/v1/seo` | NFR4.1 |

---

## Blog Post Publishing Flow

```
Admin (CMS)
  │
  └──► [POST /v1/blog] or [PATCH /v1/blog/:id]
            │
            ▼
       API Gateway ──► auth.middleware (role: ADMIN | EDITOR required)
            │
            ▼
       Content Service
            │
            ├──► [1] Validate request (Zod: blog.schemas.ts)
            │         ├── title, slug, content, images
            │         ├── publishedAt: immediate | scheduled ISO8601
            │         └── status: DRAFT | SCHEDULED | PUBLISHED
            │
            ├──► [2a] Immediate publish (publishedAt <= now)
            │         ├── INSERT / UPDATE blog record (status: PUBLISHED)
            │         ├── Generate/validate unique slug
            │         └── Publish: blog-published
            │
            ├──► [2b] Scheduled publish (publishedAt > now)
            │         ├── INSERT / UPDATE blog record (status: SCHEDULED)
            │         └── No event published yet (handled by job)
            │
            └──► [3] Return blog record to admin
```

### Scheduled Publish Job

```
publish-scheduled-posts.job.ts (cron: every 5 minutes)
  │
  ├──► [1] SELECT blogs WHERE status = SCHEDULED AND publishedAt <= now()
  │
  ├──► [2] For each blog:
  │         ├── UPDATE status = PUBLISHED
  │         └── Publish: blog-published
  │
  └──► [3] Publish: sitemap regeneration trigger (internal)
```

---

## Page Publishing Flow

```
Admin (CMS)
  │
  └──► [POST /v1/pages] or [PATCH /v1/pages/:id]
            │
            ▼
       Content Service
            │
            ├──► [1] Validate CMS page data
            │         ├── Dynamic pages: Finance, Media Wall, About Us, etc. (FR9.6)
            │         └── SEO fields: metaTitle, metaDescription, canonicalUrl
            │
            ├──► [2] Save page record
            │
            ├──► [3] Invalidate CDN/Redis cache for page route
            │         └── cdn.client.ts: purge /{page.slug}
            │
            └──► [4] Publish: page-published
```

---

## Media Upload Flow

```
Admin (CMS)
  │
  └──► [POST /v1/uploads] (multipart/form-data)
            │
            ▼
       API Gateway ──► auth.middleware
            │
            ▼
       Content Service
            │
            ├──► [1] Validate file type and size (Zod + multer)
            │         ├── Allowed: image/jpeg, image/png, image/webp, video/mp4
            │         └── Max size: 50MB
            │
            ├──► [2] Upload to S3
            │         └── s3.client.ts: PutObjectCommand
            │               ├── Bucket: lomash-media-{env}
            │               └── Key: {entity}/{uuid}/{filename}
            │
            ├──► [3] Generate CDN URL
            │         └── cdn.client.ts: {CDN_BASE_URL}/{key}
            │
            ├──► [4] Insert MediaAsset record in DB
            │         └── { url, cdnUrl, mimeType, size, entityType, entityId }
            │
            └──► [5] Publish: media-uploaded
```

---

## SEO Update Flow

```
Admin (CMS)
  │
  └──► [PATCH /v1/seo/:entityId]
            │
            ▼
       Content Service
            │
            ├──► [1] Update SEO metadata record
            │
            ├──► [2] Trigger sitemap regeneration
            │         └── regenerate-sitemap.job.ts (ad-hoc trigger)
            │               ├── Crawl all published pages and blogs
            │               └── Write sitemap.xml to S3 / public route
            │
            └──► [3] Publish: seo-updated
```

---

## Sitemap Regeneration Flow

```
Trigger: cron OR seo-updated event OR blog-published event
  │
  ▼
regenerate-sitemap.job.ts
  │
  ├──► [1] Fetch all published pages from content-service DB
  │         ├── CMS pages
  │         ├── Blog posts
  │         ├── Product pages (HTTP: product-service /internal/products/sitemap)
  │         └── Showroom pages (HTTP: appointment-service /internal/showrooms/sitemap)
  │
  ├──► [2] Generate sitemap.xml
  │         └── Include: loc, lastmod, changefreq, priority
  │
  ├──► [3] Write to S3
  │         └── Key: public/sitemap.xml
  │
  └──► [4] Purge CDN cache for /sitemap.xml
```

---

## Events Published

### `blog-published`

**Topic:** `lomash.content.blog.published`

**Producer:** content-service

**Consumers:** analytics-service, notification-service (sitemap trigger)

```json
{
  "eventId": "uuid",
  "eventType": "blog-published",
  "timestamp": "ISO8601",
  "version": "1.0",
  "payload": {
    "blogId": "uuid",
    "slug": "string",
    "title": "string",
    "publishedAt": "ISO8601",
    "trigger": "IMMEDIATE | SCHEDULED_JOB"
  }
}
```

### `blog-updated`

**Topic:** `lomash.content.blog.updated`

**Producer:** content-service

**Consumers:** analytics-service

```json
{
  "eventId": "uuid",
  "eventType": "blog-updated",
  "timestamp": "ISO8601",
  "version": "1.0",
  "payload": {
    "blogId": "uuid",
    "slug": "string",
    "changedFields": ["title", "content", "images"],
    "updatedAt": "ISO8601"
  }
}
```

### `media-uploaded`

**Topic:** `lomash.content.media.uploaded`

**Producer:** content-service

**Consumers:** analytics-service

```json
{
  "eventId": "uuid",
  "eventType": "media-uploaded",
  "timestamp": "ISO8601",
  "version": "1.0",
  "payload": {
    "assetId": "uuid",
    "cdnUrl": "string",
    "mimeType": "string",
    "size": 1048576,
    "entityType": "PRODUCT | BLOG | PAGE | MEDIA_WALL | SHOWROOM",
    "entityId": "uuid"
  }
}
```

### `page-published`

**Topic:** `lomash.content.page.published`

**Producer:** content-service

**Consumers:** analytics-service

```json
{
  "eventId": "uuid",
  "eventType": "page-published",
  "timestamp": "ISO8601",
  "version": "1.0",
  "payload": {
    "pageId": "uuid",
    "slug": "string",
    "pageType": "CMS | LANDING | FINANCE | MEDIA_WALL | ABOUT | CAREERS | FAQS",
    "publishedAt": "ISO8601"
  }
}
```

### `seo-updated`

**Topic:** `lomash.content.seo.updated`

**Producer:** content-service

**Consumers:** analytics-service

```json
{
  "eventId": "uuid",
  "eventType": "seo-updated",
  "timestamp": "ISO8601",
  "version": "1.0",
  "payload": {
    "seoId": "uuid",
    "entityType": "PAGE | BLOG | PRODUCT",
    "entityId": "uuid",
    "changedFields": ["metaTitle", "metaDescription", "canonicalUrl"]
  }
}
```

---

## Cache Strategy

| Content Type | Cache Layer | Invalidation Trigger |
|---|---|---|
| Blog post | Redis (TTL: 1h) + CDN | `blog-updated`, `blog-published` |
| CMS page | Redis (TTL: 6h) + CDN | `page-published` |
| Media assets | CDN (immutable) | Never (versioned S3 keys) |
| Sitemap | CDN (TTL: 24h) | `regenerate-sitemap.job.ts` |
| SEO metadata | Redis (TTL: 1h) | `seo-updated` |

---

## Failure Scenarios

### S3 Upload Failure

- Endpoint returns 503 with retry guidance
- File not persisted to DB if S3 upload fails (atomic: upload first, then DB insert)
- Admin receives error notification via notification-service

### Scheduled Publish Job Failure

- `publish-scheduled-posts.job.ts` uses idempotent `status` field check
- Job logs failures with structured logger; alert fires if failure count > 3 in 15 minutes
- Manual admin re-trigger available via `POST /v1/admin/jobs/publish-scheduled`

### Sitemap Generation Failure

- Non-blocking: sitemap failure does not affect content availability
- Last successful sitemap remains in S3 until regeneration succeeds
- Failure logged and alert sent to admin team

---

## Monitoring

| Metric | Alert Threshold |
|---|---|
| `scheduled_posts_published_total` | Informational |
| `sitemap_generation_duration_ms` | > 10000ms |
| `s3_upload_failure_rate` | > 1% |
| `cdn_cache_purge_failure_total` | > 0 |
| `content_publish_lag_ms` | > 30000ms (30s from scheduled time) |