# Migration: 0001_init

**Service:** content-service  
**Date:** 2026-02-17  
**Author:** Lomash Wood Engineering

---

## Overview

Initial schema migration for the `content-service`. Creates all tables, enums, indexes,
and foreign key constraints required for the full content management domain.

---

## Tables Created

| Table | Description | Soft Delete |
|---|---|---|
| `blogs` | Blog posts with categories, tags, SEO, scheduling, and featured flags | ✅ |
| `media_items` | Uploaded files (image / video / document) stored in S3 | ✅ |
| `media_wall_contents` | Curated media gallery blocks displayed on the site | ✅ |
| `media_wall_items` | Junction table linking media walls to individual media items | — |
| `cms_pages` | Flexible CMS pages built from JSON content blocks | ✅ |
| `seo_meta` | Per-path SEO metadata including OG/Twitter tags and structured data | — |
| `landing_pages` | Promotional landing pages built from JSON sections | ✅ |
| `home_sliders` | Hero slider items for homepage and category pages | ✅ |
| `finance_contents` | Finance page content block | — |
| `finance_features` | Feature bullets inside a finance content block | — |
| `process_steps` | Our Process steps (consultation → aftercare) | — |
| `why_choose_us_items` | Trust-building USP items | — |
| `faqs` | Frequently asked questions grouped by category | ✅ |
| `testimonials` | Customer reviews with optional photo/video | ✅ |
| `newsletter_subscriptions` | Email marketing opt-ins | — |
| `logos` | Partner and brand logo display | ✅ |
| `accreditations` | Awards, certifications, memberships, partnerships | ✅ |
| `banners` | Promotional banner images for scheduled placements | ✅ |
| `menus` | Named navigation menus (header, footer, hamburger) | — |
| `menu_items` | Self-referential navigation items with optional parent | — |
| `careers` | Job listings with salary bands and closing dates | ✅ |
| `brochure_requests` | Requests for a physical brochure | — |
| `business_inquiries` | Trade / agent / architect business enquiries | — |
| `contact_messages` | General website contact form submissions | — |
| `site_settings` | Key-value store for global site configuration | — |

---

## Enums Created

| Enum | Values |
|---|---|
| `ContentStatus` | `DRAFT`, `PUBLISHED`, `ARCHIVED`, `SCHEDULED` |
| `MediaType` | `IMAGE`, `VIDEO`, `DOCUMENT` |
| `PageType` | `STATIC`, `DYNAMIC`, `LANDING` |
| `BlogCategory` | `KITCHEN`, `BEDROOM`, `DESIGN`, `TIPS`, `NEWS`, `INSPIRATION` |
| `SeoIndexStatus` | `INDEX`, `NOINDEX` |
| `SliderTarget` | `HOME`, `KITCHEN`, `BEDROOM`, `SALE`, `FINANCE` |
| `MediaWallLayout` | `FULL_WIDTH`, `GRID_2`, `GRID_3`, `MASONRY` |
| `FaqCategory` | `GENERAL`, `PRODUCTS`, `DELIVERY`, `INSTALLATION`, `FINANCE`, `APPOINTMENTS`, `RETURNS` |
| `CareerType` | `FULL_TIME`, `PART_TIME`, `CONTRACT`, `INTERNSHIP` |
| `CareerDepartment` | `DESIGN`, `SALES`, `INSTALLATION`, `MARKETING`, `TECHNOLOGY`, `OPERATIONS`, `CUSTOMER_SERVICE` |
| `ProcessStepType` | `CONSULTATION`, `DESIGN`, `MANUFACTURING`, `DELIVERY`, `INSTALLATION`, `AFTERCARE` |
| `AccreditationType` | `AWARD`, `CERTIFICATION`, `PARTNERSHIP`, `MEMBERSHIP` |
| `BusinessType` | `AGENT`, `BUILDER`, `ARCHITECT`, `INTERIOR_DESIGNER`, `CONTRACTOR`, `DEVELOPER`, `OTHER` |
| `ContactSubject` | `GENERAL`, `PRODUCTS`, `APPOINTMENTS`, `COMPLAINTS`, `TRADE`, `PRESS`, `OTHER` |

---

## Foreign Keys

| Table | Column | References | On Delete |
|---|---|---|---|
| `media_wall_items` | `mediaWallId` | `media_wall_contents.id` | CASCADE |
| `media_wall_items` | `mediaItemId` | `media_items.id` | CASCADE |
| `finance_features` | `financeContentId` | `finance_contents.id` | CASCADE |
| `menu_items` | `menuId` | `menus.id` | CASCADE |
| `menu_items` | `parentId` | `menu_items.id` | SET NULL |

---

## Soft Deletes

Tables marked with soft delete include a `deletedAt TIMESTAMP(3)` column.
The Prisma soft-delete extension (`prisma.extensions.ts`) automatically filters
`WHERE "deletedAt" IS NULL` on all `findMany`, `findFirst`, and `findUnique` queries
across these tables.

Hard deletes against the database are reserved for background cleanup jobs
(e.g. `cleanup-unused-media.job.ts`) which permanently remove records older
than 30 days after soft deletion.

---

## Running This Migration

```bash
# Apply via Prisma
npx prisma migrate deploy

# Or apply directly (dev/testing only)
psql $DATABASE_URL -f prisma/migrations/0001_init/migration.sql
```

---

## Rolling Back

Prisma does not natively generate rollback scripts. To roll back manually:

```sql
-- Drop all tables (order respects FK dependencies)
DROP TABLE IF EXISTS "menu_items" CASCADE;
DROP TABLE IF EXISTS "menus" CASCADE;
DROP TABLE IF EXISTS "media_wall_items" CASCADE;
DROP TABLE IF EXISTS "media_wall_contents" CASCADE;
DROP TABLE IF EXISTS "finance_features" CASCADE;
DROP TABLE IF EXISTS "finance_contents" CASCADE;
DROP TABLE IF EXISTS "blogs" CASCADE;
DROP TABLE IF EXISTS "media_items" CASCADE;
DROP TABLE IF EXISTS "cms_pages" CASCADE;
DROP TABLE IF EXISTS "seo_meta" CASCADE;
DROP TABLE IF EXISTS "landing_pages" CASCADE;
DROP TABLE IF EXISTS "home_sliders" CASCADE;
DROP TABLE IF EXISTS "process_steps" CASCADE;
DROP TABLE IF EXISTS "why_choose_us_items" CASCADE;
DROP TABLE IF EXISTS "faqs" CASCADE;
DROP TABLE IF EXISTS "testimonials" CASCADE;
DROP TABLE IF EXISTS "newsletter_subscriptions" CASCADE;
DROP TABLE IF EXISTS "logos" CASCADE;
DROP TABLE IF EXISTS "accreditations" CASCADE;
DROP TABLE IF EXISTS "banners" CASCADE;
DROP TABLE IF EXISTS "careers" CASCADE;
DROP TABLE IF EXISTS "brochure_requests" CASCADE;
DROP TABLE IF EXISTS "business_inquiries" CASCADE;
DROP TABLE IF EXISTS "contact_messages" CASCADE;
DROP TABLE IF EXISTS "site_settings" CASCADE;

-- Drop all enums
DROP TYPE IF EXISTS "ContentStatus";
DROP TYPE IF EXISTS "MediaType";
DROP TYPE IF EXISTS "PageType";
DROP TYPE IF EXISTS "BlogCategory";
DROP TYPE IF EXISTS "SeoIndexStatus";
DROP TYPE IF EXISTS "SliderTarget";
DROP TYPE IF EXISTS "MediaWallLayout";
DROP TYPE IF EXISTS "FaqCategory";
DROP TYPE IF EXISTS "CareerType";
DROP TYPE IF EXISTS "CareerDepartment";
DROP TYPE IF EXISTS "ProcessStepType";
DROP TYPE IF EXISTS "AccreditationType";
DROP TYPE IF EXISTS "BusinessType";
DROP TYPE IF EXISTS "ContactSubject";
```