# Content API

Base path: `/v1/blog`, `/v1/pages`, `/v1/media`, `/v1/uploads`

---

## Overview

The content-service manages all CMS-driven content on the Lomash Wood platform including blog posts, dynamic pages (Finance, About Us, Media Wall, FAQs, etc.), media assets, SEO metadata, and landing pages as defined in the SRS (FR7.0, FR9.6).

---

## Endpoints

### GET /v1/blog

List published blog posts, paginated and sorted by most recent.

**Auth required:** No

**Query Parameters**

| Parameter | Type | Description |
|---|---|---|
| `page` | integer | Page number (default: 1) |
| `limit` | integer | Items per page (default: 12) |
| `tag` | string | Filter by tag slug |

**Response `200`**

```json
{
  "data": [
    {
      "id": "uuid",
      "title": "10 Kitchen Design Trends for 2026",
      "slug": "kitchen-design-trends-2026",
      "excerpt": "Discover the top kitchen design trends...",
      "coverImageUrl": "https://cdn.lomashwood.co.uk/blog/...",
      "publishedAt": "2026-01-20T09:00:00Z",
      "author": "Lomash Wood Team",
      "tags": ["kitchen", "design", "trends"]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 34,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

### GET /v1/blog/:slug

Get a single published blog post by its URL slug.

**Auth required:** No

**Response `200`**

```json
{
  "id": "uuid",
  "title": "10 Kitchen Design Trends for 2026",
  "slug": "kitchen-design-trends-2026",
  "content": "<p>Full HTML or Markdown content...</p>",
  "excerpt": "Discover the top kitchen design trends...",
  "coverImageUrl": "https://cdn.lomashwood.co.uk/blog/...",
  "publishedAt": "2026-01-20T09:00:00Z",
  "author": "Lomash Wood Team",
  "tags": ["kitchen", "design", "trends"]
}
```

**Errors**

| Status | Code | Reason |
|---|---|---|
| 404 | `BLOG_NOT_FOUND` | No published post with this slug |

---

### POST /v1/blog (Admin/Editor)

Create a new blog post.

**Auth required:** Yes (ADMIN or EDITOR)

**Request Body**

```json
{
  "title": "10 Kitchen Design Trends for 2026",
  "slug": "kitchen-design-trends-2026",
  "content": "<p>Full content...</p>",
  "excerpt": "Short summary...",
  "coverImageId": "uuid",
  "tags": ["kitchen", "design"],
  "status": "PUBLISHED",
  "publishedAt": "2026-01-20T09:00:00Z"
}
```

| Field | Type | Rules |
|---|---|---|
| `title` | string | required |
| `slug` | string | required, unique, URL-safe |
| `content` | string | required |
| `excerpt` | string | optional |
| `coverImageId` | uuid | optional, must be an uploaded media asset |
| `tags` | string[] | optional |
| `status` | string | `DRAFT`, `SCHEDULED`, `PUBLISHED` |
| `publishedAt` | datetime | required when status is `SCHEDULED` |

**Response `201`** — returns the created `BlogPost` object.

---

### PATCH /v1/blog/:id (Admin/Editor)

Update a blog post.

**Auth required:** Yes (ADMIN or EDITOR)

**Request Body** — all fields optional.

**Response `200`** — returns the updated `BlogPost` object.

---

### DELETE /v1/blog/:id (Admin)

Soft-delete a blog post.

**Auth required:** Yes (ADMIN)

**Response `204`** — no content.

---

### GET /v1/pages/:slug

Get a dynamic CMS page by slug. Used for Finance, About Us, Media Wall, Our Process, Why Choose Us, and other editable pages (FR9.6).

**Auth required:** No

**Response `200`**

```json
{
  "id": "uuid",
  "slug": "finance",
  "pageType": "FINANCE",
  "title": "Kitchen Finance Options",
  "description": "Spread the cost of your dream kitchen...",
  "content": "<p>Full dynamic content...</p>",
  "seo": {
    "metaTitle": "Kitchen Finance | Lomash Wood",
    "metaDescription": "Flexible finance options for your new kitchen.",
    "canonicalUrl": "https://lomashwood.co.uk/finance"
  },
  "publishedAt": "2026-01-01T00:00:00Z"
}
```

**Errors**

| Status | Code | Reason |
|---|---|---|
| 404 | `PAGE_NOT_FOUND` | No published page with this slug |

---

### PATCH /v1/pages/:id (Admin/Editor)

Update a CMS page.

**Auth required:** Yes (ADMIN or EDITOR)

**Request Body**

```json
{
  "title": "Kitchen Finance Options",
  "description": "Updated description...",
  "content": "<p>Updated content...</p>",
  "seo": {
    "metaTitle": "Kitchen Finance | Lomash Wood",
    "metaDescription": "Updated meta description."
  }
}
```

**Response `200`** — returns the updated page object.

---

### GET /v1/media

List media assets. Admin use for the CMS media library.

**Auth required:** Yes (ADMIN or EDITOR)

**Query Parameters**

| Parameter | Type | Description |
|---|---|---|
| `page` | integer | Page number |
| `limit` | integer | Items per page |
| `entityType` | string | Filter by entity type |

**Response `200`**

```json
{
  "data": [
    {
      "id": "uuid",
      "url": "https://s3.eu-west-2.amazonaws.com/lomash-media-prod/...",
      "cdnUrl": "https://cdn.lomashwood.co.uk/...",
      "mimeType": "image/webp",
      "size": 204800,
      "entityType": "PRODUCT",
      "entityId": "uuid"
    }
  ],
  "pagination": { }
}
```

---

### POST /v1/uploads

Upload a media asset to S3 and register it in the media library.

**Auth required:** Yes (ADMIN or EDITOR)

**Request:** `multipart/form-data`

| Field | Type | Rules |
|---|---|---|
| `file` | binary | required, max 50MB |
| `entityType` | string | optional: `PRODUCT`, `BLOG`, `PAGE`, `MEDIA_WALL`, `SHOWROOM` |
| `entityId` | uuid | optional: links asset to an entity |

**Accepted MIME types:** `image/jpeg`, `image/png`, `image/webp`, `video/mp4`

**Response `201`**

```json
{
  "id": "uuid",
  "url": "https://s3.eu-west-2.amazonaws.com/lomash-media-prod/products/uuid/image.webp",
  "cdnUrl": "https://cdn.lomashwood.co.uk/products/uuid/image.webp",
  "mimeType": "image/webp",
  "size": 204800
}
```

**Errors**

| Status | Code | Reason |
|---|---|---|
| 400 | `INVALID_FILE_TYPE` | MIME type not allowed |
| 413 | `FILE_TOO_LARGE` | File exceeds 50MB limit |
| 401 | `UNAUTHORIZED` | Missing token |
| 403 | `FORBIDDEN` | Not ADMIN or EDITOR |

---

## CMS Page Types

| `pageType` | Slug | SRS Reference |
|---|---|---|
| `FINANCE` | `finance` | FR7.1 |
| `MEDIA_WALL` | `media-wall` | FR7.3 |
| `ABOUT` | `about-us` | FR7.4 |
| `REVIEWS` | `customer-reviews` | FR7.4 |
| `PROCESS` | `our-process` | FR7.4 |
| `CONTACT` | `contact-us` | FR7.4 |
| `WHY_CHOOSE_US` | `why-choose-us` | FR7.4 |
| `CAREERS` | `careers` | FR9.6 |
| `FAQS` | `faqs` | FR9.6 |
| `TERMS` | `terms-and-conditions` | Static |
| `PRIVACY` | `privacy-policy` | Static |
| `COOKIES` | `cookies` | Static |

---

## Scheduled Publishing

Blog posts with `status: SCHEDULED` and a future `publishedAt` are published automatically by the `publish-scheduled-posts.job.ts` cron job running every 5 minutes. The status transitions from `SCHEDULED` to `PUBLISHED` atomically, and the `blog-published` event is dispatched to the event bus triggering sitemap regeneration.