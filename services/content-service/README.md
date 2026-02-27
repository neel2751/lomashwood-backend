# Content Service

Part of the **Lomash Wood** microservices backend. Manages all CMS-driven content including blogs, pages, media wall, SEO metadata, banners, menus, FAQs, and testimonials.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database](#database)
- [API Reference](#api-reference)
- [Background Jobs](#background-jobs)
- [Events](#events)
- [Testing](#testing)
- [Docker](#docker)

---

## Overview

The Content Service is responsible for:

- **Blog / Inspiration** — Create, schedule, and publish blog posts with tag and category management
- **CMS Pages** — Dynamic pages (About Us, Why Choose Us, Our Process, Finance, Careers, etc.)
- **Media Wall** — Image and video gallery management for the media wall section
- **SEO** — Per-entity meta tags, Open Graph, Twitter Cards, sitemap generation, and robots.txt
- **Banners** — Hero slider and offer slider banner management for the home page
- **Menus** — Header navigation, hamburger menu, and footer link management
- **FAQs** — Categorised FAQ entries with public search
- **Testimonials** — Customer review content (text, image, video) per SRS FR7.4
- **Landing Pages** — Dynamic landing page sections
- **Accreditations & Logos** — Brand trust badges for the home page

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 |
| Framework | Express.js |
| Language | TypeScript (strict mode) |
| ORM | Prisma |
| Database | PostgreSQL 15 |
| Cache | Redis 7 |
| Validation | Zod |
| Auth | Better Auth (JWT) |
| Storage | AWS S3 + CloudFront CDN |
| Messaging | Event Bus (internal) |
| Logging | Pino |
| Testing | Jest + Supertest |
| Container | Docker |

---

## Project Structure

```
content-service/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── src/
│   ├── main.ts
│   ├── app.ts
│   ├── bootstrap.ts
│   ├── app/
│   │   ├── blogs/
│   │   ├── media-wall/
│   │   ├── cms/
│   │   ├── seo/
│   │   └── landing-pages/
│   ├── infrastructure/
│   │   ├── db/
│   │   ├── storage/
│   │   └── messaging/
│   ├── interfaces/
│   │   ├── http/
│   │   └── events/
│   ├── config/
│   ├── jobs/
│   ├── events/
│   └── shared/
└── tests/
    ├── unit/
    ├── integration/
    ├── e2e/
    └── fixtures/
```

---

## Getting Started

### Prerequisites

- Node.js >= 20
- pnpm >= 9
- PostgreSQL 15
- Redis 7
- Docker (optional)

### Install Dependencies

```bash
pnpm install
```

### Run in Development

```bash
pnpm dev
```

### Build for Production

```bash
pnpm build
pnpm start
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

| Variable | Description | Required |
|---|---|---|
| `NODE_ENV` | Environment (`development`, `production`, `test`) | Yes |
| `PORT` | Service port (default: `4004`) | Yes |
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `REDIS_URL` | Redis connection string | Yes |
| `JWT_SECRET` | Shared JWT secret for auth verification | Yes |
| `AWS_REGION` | AWS region for S3 | Yes |
| `AWS_ACCESS_KEY_ID` | AWS access key | Yes |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | Yes |
| `S3_BUCKET_NAME` | S3 bucket for media uploads | Yes |
| `CDN_BASE_URL` | CloudFront CDN base URL | Yes |
| `MAX_UPLOAD_SIZE_MB` | Max file upload size in MB (default: `10`) | No |
| `ALLOWED_UPLOAD_TYPES` | Comma-separated MIME types | No |
| `EVENT_BUS_URL` | Internal event bus URL | Yes |
| `LOG_LEVEL` | Logging level (`info`, `debug`, `error`) | No |

---

## Database

### Run Migrations

```bash
pnpm prisma migrate deploy
```

### Generate Prisma Client

```bash
pnpm prisma generate
```

### Seed Development Data

```bash
pnpm prisma db seed
```

### Open Prisma Studio

```bash
pnpm prisma studio
```

---

## API Reference

All routes are prefixed with `/v1`. Public routes require no authentication. CMS routes require a valid `Authorization: Bearer <token>` header with `ADMIN` or `EDITOR` role.

### Public Routes

| Method | Path | Description |
|---|---|---|
| `GET` | `/v1/blog` | List published blog posts (paginated) |
| `GET` | `/v1/blog/:slug` | Get a published blog post by slug |
| `GET` | `/v1/blog/:slug/related` | Get related blog posts |
| `GET` | `/v1/content/pages/:slug` | Get a published CMS page by slug |
| `GET` | `/v1/content/media-wall` | Get active media wall configuration |
| `GET` | `/v1/content/banners` | Get active banners by type |
| `GET` | `/v1/content/menus` | Get a menu by location |
| `GET` | `/v1/content/faqs` | List active FAQs (filterable by category) |
| `GET` | `/v1/content/testimonials` | List active testimonials |
| `GET` | `/v1/content/testimonials/:id` | Get a single testimonial |
| `GET` | `/v1/content/accreditations` | List active accreditation badges |
| `GET` | `/v1/content/logos` | List active brand logos |
| `GET` | `/v1/content/home-slider` | Get active home page hero slides |
| `GET` | `/v1/content/search` | Full-text search across published content |
| `GET` | `/v1/content/search/suggestions` | Search autocomplete suggestions |
| `GET` | `/sitemap.xml` | Generated XML sitemap |
| `GET` | `/robots.txt` | Robots.txt file |
| `GET` | `/health` | Health check |
| `GET` | `/health/live` | Liveness probe |
| `GET` | `/health/ready` | Readiness probe |

### CMS Routes (Admin / Editor)

| Method | Path | Description |
|---|---|---|
| `GET` | `/v1/cms/dashboard/summary` | CMS content summary stats |
| `GET` | `/v1/cms/overview` | Recent activity overview |
| **Blogs** | | |
| `GET` | `/v1/cms/blogs` | List all blogs (all statuses) |
| `GET` | `/v1/cms/blogs/:id` | Get blog by ID |
| `POST` | `/v1/cms/blogs` | Create a new blog post |
| `PATCH` | `/v1/cms/blogs/:id` | Update a blog post |
| `POST` | `/v1/cms/blogs/:id/publish` | Publish a blog post |
| `POST` | `/v1/cms/blogs/:id/unpublish` | Unpublish a blog post |
| `POST` | `/v1/cms/blogs/:id/schedule` | Schedule a blog post |
| `PUT` | `/v1/cms/blogs/:id/seo` | Set SEO for a blog post |
| `DELETE` | `/v1/cms/blogs/:id` | Soft-delete a blog post (Admin only) |
| **Pages** | | |
| `GET` | `/v1/cms/pages` | List all CMS pages |
| `GET` | `/v1/cms/pages/:id` | Get page by ID |
| `POST` | `/v1/cms/pages` | Create a new page |
| `PATCH` | `/v1/cms/pages/:id` | Update a page |
| `POST` | `/v1/cms/pages/:id/publish` | Publish a page |
| `POST` | `/v1/cms/pages/:id/unpublish` | Unpublish a page |
| `DELETE` | `/v1/cms/pages/:id` | Soft-delete a page (Admin only) |
| `PUT` | `/v1/cms/pages/:slug/content` | Update special page content by slug |
| **Media** | | |
| `POST` | `/v1/media/upload` | Upload a media file |
| `GET` | `/v1/media` | List all media files |
| `GET` | `/v1/media/:id` | Get media file by ID |
| `PATCH` | `/v1/media/:id` | Update media metadata |
| `DELETE` | `/v1/media/:id` | Soft-delete a media file |
| **Media Wall** | | |
| `PATCH` | `/v1/cms/media-wall/:id` | Update media wall config |
| `POST` | `/v1/cms/media-wall/:id/items` | Add item to media wall |
| `PATCH` | `/v1/cms/media-wall/:id/reorder` | Reorder media wall items |
| **SEO** | | |
| `GET` | `/v1/cms/seo` | Get SEO by entity |
| `POST` | `/v1/cms/seo` | Create SEO metadata |
| `PATCH` | `/v1/cms/seo/:id` | Update SEO metadata |
| `DELETE` | `/v1/cms/seo/:id` | Delete SEO metadata |
| `POST` | `/v1/cms/seo/bulk-update` | Bulk update SEO entries |
| `GET` | `/v1/cms/seo/defaults` | Get global SEO defaults |
| `PUT` | `/v1/cms/seo/defaults` | Update global SEO defaults |
| `POST` | `/v1/cms/seo/regenerate-sitemap` | Trigger sitemap regeneration |
| **Banners** | | |
| `GET` | `/v1/cms/banners` | List all banners |
| `POST` | `/v1/cms/banners` | Create a banner |
| `PATCH` | `/v1/cms/banners/:id` | Update a banner |
| `PATCH` | `/v1/cms/banners/reorder` | Reorder banners |
| `DELETE` | `/v1/cms/banners/:id` | Delete a banner |
| **Menus** | | |
| `GET` | `/v1/cms/menus` | List all menus |
| `GET` | `/v1/cms/menus/:id` | Get menu by ID |
| `POST` | `/v1/cms/menus` | Create a menu |
| `POST` | `/v1/cms/menus/:id/items` | Add a menu item |
| `PATCH` | `/v1/cms/menus/:id/items/:itemId` | Update a menu item |
| `PATCH` | `/v1/cms/menus/:id/reorder` | Reorder menu items |
| `POST` | `/v1/cms/menus/:id/items/:itemId/children` | Add submenu children |
| `DELETE` | `/v1/cms/menus/:id/items/:itemId` | Remove a menu item |
| `DELETE` | `/v1/cms/menus/:id` | Delete a menu |
| **FAQs** | | |
| `GET` | `/v1/cms/faq-categories` | List FAQ categories |
| `POST` | `/v1/cms/faq-categories` | Create FAQ category |
| `DELETE` | `/v1/cms/faq-categories/:id` | Delete FAQ category |
| `GET` | `/v1/cms/faqs` | List FAQs |
| `POST` | `/v1/cms/faqs` | Create FAQ entry |
| `PATCH` | `/v1/cms/faqs/:id` | Update FAQ entry |
| `PATCH` | `/v1/cms/faqs/reorder` | Reorder FAQ entries |
| `DELETE` | `/v1/cms/faqs/:id` | Delete FAQ entry |
| **Testimonials** | | |
| `GET` | `/v1/cms/testimonials` | List all testimonials |
| `POST` | `/v1/cms/testimonials` | Create testimonial |
| `PATCH` | `/v1/cms/testimonials/:id` | Update testimonial |
| `PATCH` | `/v1/cms/testimonials/reorder` | Reorder testimonials |
| `DELETE` | `/v1/cms/testimonials/:id` | Soft-delete testimonial |
| **Misc CMS** | | |
| `POST` | `/v1/cms/accreditations` | Create accreditation |
| `DELETE` | `/v1/cms/accreditations/:id` | Delete accreditation |
| `POST` | `/v1/cms/logos` | Create logo |
| `DELETE` | `/v1/cms/logos/:id` | Delete logo |
| `GET` | `/v1/cms/newsletter/subscribers` | List newsletter subscribers |
| `POST` | `/v1/cms/home-slider` | Create hero slider item |
| `PATCH` | `/v1/cms/home-slider/:id` | Update hero slider item |
| `DELETE` | `/v1/cms/home-slider/:id` | Delete hero slider item |
| `GET` | `/v1/cms/search` | Admin content search (includes drafts) |
| `GET` | `/v1/cms/export` | Export CMS content as JSON |
| `POST` | `/v1/cms/import` | Import CMS content from JSON |

---

## Background Jobs

| Job | Schedule | Description |
|---|---|---|
| `publish-scheduled-posts` | Every 5 minutes | Publishes blog posts whose `scheduledAt` has passed |
| `regenerate-sitemap` | Daily at 02:00 | Rebuilds the XML sitemap from all published content |
| `cleanup-unused-media` | Weekly on Sunday | Removes orphaned media files from S3 and database |
| `rebuild-search-index` | Daily at 03:00 | Refreshes the full-text search index |

---

## Events

### Published Events

| Event | Trigger | Payload |
|---|---|---|
| `blog.published` | Blog post is published | `{ blogId, slug, title, publishedAt }` |
| `blog.updated` | Blog post is updated | `{ blogId, slug, updatedAt }` |
| `media.uploaded` | Media file is uploaded | `{ mediaId, type, url, folder }` |
| `page.published` | CMS page is published | `{ pageId, slug, publishedAt }` |
| `seo.updated` | SEO metadata is updated | `{ entityId, entityType }` |

### Consumed Events

| Event | Source | Action |
|---|---|---|
| `product.created` | product-service | Adds product to sitemap |
| `product.updated` | product-service | Invalidates related content cache |

---

## Testing

### Run All Tests

```bash
pnpm test
```

### Unit Tests Only

```bash
pnpm test:unit
```

### Integration Tests Only

```bash
pnpm test:integration
```

### E2E Tests Only

```bash
pnpm test:e2e
```

### Test Coverage Report

```bash
pnpm test:coverage
```

### E2E Test Environment

E2E tests use a dedicated test database and Redis instance. Ensure the following are available before running:

```bash
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5433/lomash_content_test
TEST_REDIS_URL=redis://localhost:6380
```

These are automatically started via `docker-compose.override.yml` in development.

---

## Docker

### Build Image

```bash
docker build -t lomash-wood/content-service:latest .
```

### Run Container

```bash
docker run -p 4004:4004 \
  --env-file .env \
  lomash-wood/content-service:latest
```

### Run with Docker Compose (full stack)

From the monorepo root:

```bash
docker compose up content-service
```

---

## Role-Based Access

| Role | Permissions |
|---|---|
| `ADMIN` | Full CRUD on all CMS resources, delete, export, import |
| `EDITOR` | Create and update content; cannot delete or access admin-only endpoints |
| Public | Read-only access to published/active content |