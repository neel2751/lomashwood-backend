# content-service — Prisma Database Layer

This directory contains the Prisma ORM configuration, schema definition, migration history, and seed data for the **content-service** of the Lomash Wood platform.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Schema Overview](#schema-overview)
- [Data Models](#data-models)
- [Migrations](#migrations)
- [Seeding](#seeding)
- [Environment Setup](#environment-setup)
- [Common Commands](#common-commands)
- [Conventions](#conventions)
- [Relationships](#relationships)
- [Soft Deletes & Auditing](#soft-deletes--auditing)

---

## Overview

The content-service is responsible for all CMS-managed, publicly consumable content on the Lomash Wood platform. This includes blogs, media wall entries, CMS pages (About Us, Why Choose Us, Our Process, Finance, Careers, FAQs), SEO metadata, landing pages, and the home page slider.

All content entities are managed by administrators via the internal CMS and served to the customer-facing frontend through the API gateway.

---

## Tech Stack

| Layer      | Technology          |
|------------|---------------------|
| ORM        | Prisma 5.x          |
| Database   | PostgreSQL 15+      |
| Language   | TypeScript (strict) |
| Migrations | Prisma Migrate      |
| Seeding    | `prisma/seed.ts`    |

---

## Schema Overview

The Prisma schema (`schema.prisma`) defines the following primary domains for the content-service:

| Domain          | Models                                                                 |
|-----------------|------------------------------------------------------------------------|
| Blog            | `Blog`, `BlogCategory`, `BlogTag`, `BlogTagMap`                        |
| Media Wall      | `MediaWall`                                                            |
| CMS Pages       | `Page`                                                                 |
| SEO             | `SeoMeta`                                                              |
| Landing Pages   | `LandingPage`                                                          |
| Home Slider     | `HomeSlide`                                                            |
| Finance         | `FinanceContent`                                                       |
| Menus           | `Menu`, `MenuItem`                                                     |
| Banners         | `Banner`                                                               |
| FAQs            | `Faq`, `FaqCategory`                                                   |
| Testimonials    | `Testimonial`                                                          |
| Logos           | `Logo`                                                                 |
| Accreditations  | `Accreditation`                                                        |
| Newsletter      | `NewsletterSubscription`                                               |

---

## Data Models

### Blog

Manages the Inspiration/Blog section (`/blog`, `/blog/:slug`).

| Field          | Type       | Notes                                            |
|----------------|------------|--------------------------------------------------|
| `id`           | `String`   | CUID primary key                                 |
| `title`        | `String`   | Post title                                       |
| `slug`         | `String`   | Unique URL slug                                  |
| `excerpt`      | `String?`  | Short summary for listing cards                  |
| `content`      | `String`   | Full rich-text/markdown body                     |
| `coverImage`   | `String?`  | S3 URL for cover image                           |
| `status`       | `BlogStatus` | `DRAFT`, `PUBLISHED`, `ARCHIVED`               |
| `publishedAt`  | `DateTime?`| Nullable; set when status → PUBLISHED            |
| `authorId`     | `String`   | References admin user (auth-service)             |
| `categoryId`   | `String?`  | FK → `BlogCategory`                              |
| `isFeatured`   | `Boolean`  | Featured on home page                            |
| `deletedAt`    | `DateTime?`| Soft delete timestamp                            |
| `createdAt`    | `DateTime` | Auto-set on creation                             |
| `updatedAt`    | `DateTime` | Auto-updated on change                           |

### MediaWall

Powers the Media Wall section (`/media-wall`). Supports image or video entries with a background image.

| Field           | Type      | Notes                                    |
|-----------------|-----------|------------------------------------------|
| `id`            | `String`  | CUID primary key                         |
| `title`         | `String`  | Display title                            |
| `description`   | `String?` | Supporting text                          |
| `mediaType`     | `MediaType` | `IMAGE` or `VIDEO`                     |
| `mediaUrl`      | `String`  | S3/CDN URL for the primary media asset   |
| `backgroundImage` | `String?` | S3/CDN URL for section background      |
| `ctaText`       | `String?` | Call-to-action button label              |
| `ctaUrl`        | `String?` | Call-to-action destination URL           |
| `sortOrder`     | `Int`     | Display ordering                         |
| `isActive`      | `Boolean` | Visibility toggle                        |
| `deletedAt`     | `DateTime?` | Soft delete timestamp                  |
| `createdAt`     | `DateTime`| Auto-set on creation                     |
| `updatedAt`     | `DateTime`| Auto-updated on change                   |

### Page (CMS)

Dynamic singleton pages managed via CMS: About Us, Why Choose Us, Our Process, Contact Us, Customer Review, Careers, Terms & Conditions, Privacy Policy, Cookies.

| Field        | Type       | Notes                                    |
|--------------|------------|------------------------------------------|
| `id`         | `String`   | CUID primary key                         |
| `slug`       | `String`   | Unique identifier (e.g., `about-us`)     |
| `title`      | `String`   | Page heading                             |
| `content`    | `String`   | Rich-text body                           |
| `status`     | `PageStatus` | `DRAFT` or `PUBLISHED`                 |
| `deletedAt`  | `DateTime?`| Soft delete timestamp                    |
| `createdAt`  | `DateTime` | Auto-set on creation                     |
| `updatedAt`  | `DateTime` | Auto-updated on change                   |

### SeoMeta

Per-page SEO metadata (title, description, Open Graph, robots directive).

| Field           | Type      | Notes                                           |
|-----------------|-----------|-------------------------------------------------|
| `id`            | `String`  | CUID primary key                                |
| `entityType`    | `String`  | e.g., `blog`, `page`, `product`, `landing-page` |
| `entityId`      | `String`  | FK to the owning entity in its domain           |
| `metaTitle`     | `String?` | `<title>` tag override                          |
| `metaDescription` | `String?` | `<meta name="description">`                   |
| `ogTitle`       | `String?` | Open Graph title                                |
| `ogDescription` | `String?` | Open Graph description                          |
| `ogImage`       | `String?` | Open Graph image URL                            |
| `canonicalUrl`  | `String?` | Canonical link href                             |
| `robots`        | `String?` | e.g., `index,follow` or `noindex,nofollow`      |
| `createdAt`     | `DateTime`| Auto-set on creation                            |
| `updatedAt`     | `DateTime`| Auto-updated on change                          |

### HomeSlide

Manages the hero slider on the home page.

| Field        | Type      | Notes                               |
|--------------|-----------|-------------------------------------|
| `id`         | `String`  | CUID primary key                    |
| `image`      | `String`  | S3/CDN URL                          |
| `title`      | `String?` | Overlay title text                  |
| `description`| `String?` | Overlay subtitle/description        |
| `buttonText` | `String?` | CTA button label                    |
| `buttonUrl`  | `String?` | CTA button destination              |
| `sortOrder`  | `Int`     | Slide ordering                      |
| `isActive`   | `Boolean` | Visibility toggle                   |
| `createdAt`  | `DateTime`| Auto-set on creation                |
| `updatedAt`  | `DateTime`| Auto-updated on change              |

### FinanceContent

Single-record dynamic content for the Finance page.

| Field        | Type      | Notes                               |
|--------------|-----------|-------------------------------------|
| `id`         | `String`  | CUID primary key                    |
| `title`      | `String`  | Page heading                        |
| `description`| `String`  | Introductory text                   |
| `content`    | `String`  | Full rich-text body                 |
| `isActive`   | `Boolean` | Whether this record is live         |
| `updatedAt`  | `DateTime`| Auto-updated on change              |

### Faq / FaqCategory

FAQ entries organised into categories for the dynamic FAQ page.

### Testimonial

Customer testimonials displayed on the Customer Review page. Supports name, description, image or video URL.

### NewsletterSubscription

Stores email addresses submitted via the newsletter sign-up form.

| Field         | Type       | Notes                               |
|---------------|------------|-------------------------------------|
| `id`          | `String`   | CUID primary key                    |
| `email`       | `String`   | Unique subscriber email             |
| `subscribedAt`| `DateTime` | Subscription timestamp              |
| `isActive`    | `Boolean`  | Unsubscribe flag                    |

---

## Migrations

Migrations live in `prisma/migrations/` and are managed exclusively via Prisma Migrate. **Never edit migration SQL files manually.**

The `migration_lock.toml` file locks the provider to `postgresql`. Do not change this file.

### Migration History

| Migration               | Description                                    |
|-------------------------|------------------------------------------------|
| `0001_init`             | Initial schema — all content-service tables    |

Each migration directory contains:
- `migration.sql` — the raw SQL applied to the database
- `README.md` — a human-readable summary of the changes

---

## Seeding

The seed script populates the database with realistic development data for all content models.

```bash
# Run seed (development only)
pnpm prisma db seed
```

The seed script (`seed.ts`) creates:
- Sample blog posts across multiple categories with tags
- Home page slider slides
- Media wall entries (image and video)
- Finance page content
- CMS pages (About Us, Why Choose Us, Our Process, Contact Us, etc.)
- FAQ categories and entries
- Sample testimonials
- Logo and accreditation entries
- Banner records
- Menu and menu item hierarchy

---

## Environment Setup

Copy `.env.example` to `.env` and populate all required variables before running any Prisma commands.

```bash
cp .env.example .env
```

Required variables:

```dotenv
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/lomash_content?schema=public"
```

For local Docker development, the database host is typically `localhost` or the Docker service name defined in `infra/docker/docker-compose.yml`.

---

## Common Commands

```bash
# Generate Prisma client after schema changes
pnpm prisma generate

# Create and apply a new migration
pnpm prisma migrate dev --name <migration-name>

# Apply migrations in production/staging (no dev prompts)
pnpm prisma migrate deploy

# Reset database and re-run all migrations + seed (dev only — DESTRUCTIVE)
pnpm prisma migrate reset

# Open Prisma Studio to inspect data
pnpm prisma studio

# Check migration status
pnpm prisma migrate status

# Pull current DB schema into schema.prisma (introspection)
pnpm prisma db pull

# Push schema changes without creating a migration file (prototyping only)
pnpm prisma db push
```

> ⚠️ `prisma migrate reset` and `prisma db push` are **development-only** commands. They must never be run against staging or production databases.

---

## Conventions

- **Primary keys** use `@default(cuid())` throughout for URL-safe, distributed-safe IDs.
- **Timestamps** — every model includes `createdAt DateTime @default(now())` and `updatedAt DateTime @updatedAt`.
- **Soft deletes** — content-facing models include `deletedAt DateTime?`. A non-null value means the record is deleted. All repository queries filter `deletedAt: null` by default.
- **Enums** — database-level enums (e.g., `BlogStatus`, `PageStatus`, `MediaType`) are defined in `schema.prisma` and reflected in the generated Prisma client.
- **Indexes** — slug fields, status fields, and foreign keys are indexed for query performance.
- **Unique constraints** — slugs and email addresses carry `@unique` constraints at the database level.
- **Schema namespace** — this service uses the `public` schema. No cross-service schema access is permitted; inter-service communication uses the event bus or HTTP clients only.

---

## Relationships

```
Blog          ──< BlogTagMap >── BlogTag
Blog          >── BlogCategory
Page          ──  SeoMeta   (entityType = 'page')
Blog          ──  SeoMeta   (entityType = 'blog')
LandingPage   ──  SeoMeta   (entityType = 'landing-page')
Menu          ──< MenuItem
FaqCategory   ──< Faq
```

Cross-service references (e.g., `authorId` on `Blog` pointing to a user in auth-service) are stored as plain `String` fields — **no Prisma-level foreign key relations** are defined across service boundaries.

---

## Soft Deletes & Auditing

All primary content models implement soft deletion via `deletedAt DateTime?`. Records are never hard-deleted from the database in production. The Prisma repository layer (`blog.repository.ts`, `media.repository.ts`, etc.) enforces `where: { deletedAt: null }` on all default queries.

Audit fields (`createdAt`, `updatedAt`) are managed automatically by Prisma and must not be set manually in application code.

For compliance with GDPR data retention policies, see `docs/compliance/gdpr.md`.