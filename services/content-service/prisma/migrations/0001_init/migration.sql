CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED', 'SCHEDULED');
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO', 'DOCUMENT');
CREATE TYPE "PageType" AS ENUM ('STATIC', 'DYNAMIC', 'LANDING');
CREATE TYPE "BlogCategory" AS ENUM ('KITCHEN', 'BEDROOM', 'DESIGN', 'TIPS', 'NEWS', 'INSPIRATION');
CREATE TYPE "SeoIndexStatus" AS ENUM ('INDEX', 'NOINDEX');
CREATE TYPE "SliderTarget" AS ENUM ('HOME', 'KITCHEN', 'BEDROOM', 'SALE', 'FINANCE');
CREATE TYPE "MediaWallLayout" AS ENUM ('FULL_WIDTH', 'GRID_2', 'GRID_3', 'MASONRY');
CREATE TYPE "FaqCategory" AS ENUM ('GENERAL', 'PRODUCTS', 'DELIVERY', 'INSTALLATION', 'FINANCE', 'APPOINTMENTS', 'RETURNS');
CREATE TYPE "CareerType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP');
CREATE TYPE "CareerDepartment" AS ENUM ('DESIGN', 'SALES', 'INSTALLATION', 'MARKETING', 'TECHNOLOGY', 'OPERATIONS', 'CUSTOMER_SERVICE');
CREATE TYPE "ProcessStepType" AS ENUM ('CONSULTATION', 'DESIGN', 'MANUFACTURING', 'DELIVERY', 'INSTALLATION', 'AFTERCARE');
CREATE TYPE "AccreditationType" AS ENUM ('AWARD', 'CERTIFICATION', 'PARTNERSHIP', 'MEMBERSHIP');
CREATE TYPE "BusinessType" AS ENUM ('AGENT', 'BUILDER', 'ARCHITECT', 'INTERIOR_DESIGNER', 'CONTRACTOR', 'DEVELOPER', 'OTHER');
CREATE TYPE "ContactSubject" AS ENUM ('GENERAL', 'PRODUCTS', 'APPOINTMENTS', 'COMPLAINTS', 'TRADE', 'PRESS', 'OTHER');
CREATE TABLE "blogs" (
    "id"              TEXT            NOT NULL,
    "title"           VARCHAR(200)    NOT NULL,
    "slug"            VARCHAR(220)    NOT NULL,
    "excerpt"         VARCHAR(500)    NOT NULL,
    "content"         TEXT            NOT NULL,
    "coverImageUrl"   TEXT,
    "coverImageKey"   TEXT,
    "category"        "BlogCategory"  NOT NULL,
    "tags"            JSONB           NOT NULL DEFAULT '[]',
    "authorName"      VARCHAR(100)    NOT NULL,
    "authorImageUrl"  TEXT,
    "status"          "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "isFeatured"      BOOLEAN         NOT NULL DEFAULT false,
    "readTimeMinutes" INTEGER         NOT NULL DEFAULT 5,
    "viewCount"       INTEGER         NOT NULL DEFAULT 0,
    "metaTitle"       VARCHAR(60),
    "metaDescription" VARCHAR(160),
    "publishedAt"     TIMESTAMP(3),
    "scheduledAt"     TIMESTAMP(3),
    "createdAt"       TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3)    NOT NULL,
    "deletedAt"       TIMESTAMP(3),

    CONSTRAINT "blogs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "blogs_slug_key" ON "blogs"("slug");
CREATE INDEX "blogs_slug_idx" ON "blogs"("slug");
CREATE INDEX "blogs_status_idx" ON "blogs"("status");
CREATE INDEX "blogs_category_idx" ON "blogs"("category");
CREATE INDEX "blogs_isFeatured_idx" ON "blogs"("isFeatured");
CREATE INDEX "blogs_publishedAt_idx" ON "blogs"("publishedAt");
CREATE INDEX "blogs_deletedAt_idx" ON "blogs"("deletedAt");

CREATE TABLE "media_items" (
    "id"           TEXT          NOT NULL,
    "title"        VARCHAR(200)  NOT NULL,
    "description"  VARCHAR(1000),
    "type"         "MediaType"   NOT NULL,
    "url"          TEXT          NOT NULL,
    "key"          TEXT          NOT NULL,
    "thumbnailUrl" TEXT,
    "altText"      VARCHAR(200),
    "size"         INTEGER       NOT NULL,
    "mimeType"     VARCHAR(100)  NOT NULL,
    "width"        INTEGER,
    "height"       INTEGER,
    "duration"     DOUBLE PRECISION,
    "tags"         JSONB         NOT NULL DEFAULT '[]',
    "isPublic"     BOOLEAN       NOT NULL DEFAULT true,
    "sortOrder"    INTEGER       NOT NULL DEFAULT 0,
    "createdAt"    TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3)  NOT NULL,
    "deletedAt"    TIMESTAMP(3),

    CONSTRAINT "media_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "media_items_type_idx" ON "media_items"("type");
CREATE INDEX "media_items_isPublic_idx" ON "media_items"("isPublic");
CREATE INDEX "media_items_deletedAt_idx" ON "media_items"("deletedAt");

CREATE TABLE "media_wall_contents" (
    "id"                 TEXT              NOT NULL,
    "title"              VARCHAR(200)      NOT NULL,
    "description"        TEXT,
    "backgroundImageUrl" TEXT,
    "backgroundImageKey" TEXT,
    "backgroundVideoUrl" TEXT,
    "backgroundVideoKey" TEXT,
    "layout"             "MediaWallLayout" NOT NULL DEFAULT 'GRID_3',
    "ctaText"            VARCHAR(100),
    "ctaUrl"             VARCHAR(500),
    "status"             "ContentStatus"   NOT NULL DEFAULT 'DRAFT',
    "sortOrder"          INTEGER           NOT NULL DEFAULT 0,
    "publishedAt"        TIMESTAMP(3),
    "createdAt"          TIMESTAMP(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"          TIMESTAMP(3)      NOT NULL,
    "deletedAt"          TIMESTAMP(3),

    CONSTRAINT "media_wall_contents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "media_wall_contents_status_idx" ON "media_wall_contents"("status");
CREATE INDEX "media_wall_contents_deletedAt_idx" ON "media_wall_contents"("deletedAt");

CREATE TABLE "media_wall_items" (
    "id"           TEXT         NOT NULL,
    "mediaWallId"  TEXT         NOT NULL,
    "mediaItemId"  TEXT         NOT NULL,
    "sortOrder"    INTEGER      NOT NULL DEFAULT 0,
    "captionTitle" VARCHAR(200),
    "captionBody"  VARCHAR(500),
    "linkUrl"      VARCHAR(500),
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_wall_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "media_wall_items_mediaWallId_mediaItemId_key" ON "media_wall_items"("mediaWallId", "mediaItemId");
CREATE INDEX "media_wall_items_mediaWallId_idx" ON "media_wall_items"("mediaWallId");
CREATE INDEX "media_wall_items_mediaItemId_idx" ON "media_wall_items"("mediaItemId");

ALTER TABLE "media_wall_items"
    ADD CONSTRAINT "media_wall_items_mediaWallId_fkey"
    FOREIGN KEY ("mediaWallId") REFERENCES "media_wall_contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "media_wall_items"
    ADD CONSTRAINT "media_wall_items_mediaItemId_fkey"
    FOREIGN KEY ("mediaItemId") REFERENCES "media_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "cms_pages" (
    "id"              TEXT            NOT NULL,
    "title"           VARCHAR(200)    NOT NULL,
    "slug"            VARCHAR(220)    NOT NULL,
    "description"     VARCHAR(500),
    "type"            "PageType"      NOT NULL DEFAULT 'DYNAMIC',
    "status"          "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "blocks"          JSONB           NOT NULL DEFAULT '[]',
    "coverImageUrl"   TEXT,
    "metaTitle"       VARCHAR(60),
    "metaDescription" VARCHAR(160),
    "isIndexable"     BOOLEAN         NOT NULL DEFAULT true,
    "publishedAt"     TIMESTAMP(3),
    "createdAt"       TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3)    NOT NULL,
    "deletedAt"       TIMESTAMP(3),

    CONSTRAINT "cms_pages_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "cms_pages_slug_key" ON "cms_pages"("slug");
CREATE INDEX "cms_pages_slug_idx" ON "cms_pages"("slug");
CREATE INDEX "cms_pages_status_idx" ON "cms_pages"("status");
CREATE INDEX "cms_pages_type_idx" ON "cms_pages"("type");
CREATE INDEX "cms_pages_isIndexable_idx" ON "cms_pages"("isIndexable");
CREATE INDEX "cms_pages_deletedAt_idx" ON "cms_pages"("deletedAt");

CREATE TABLE "seo_meta" (
    "id"                 TEXT             NOT NULL,
    "pagePath"           VARCHAR(500)     NOT NULL,
    "title"              VARCHAR(60)      NOT NULL,
    "description"        VARCHAR(160),
    "keywords"           JSONB            NOT NULL DEFAULT '[]',
    "ogTitle"            VARCHAR(60),
    "ogDescription"      VARCHAR(160),
    "ogImageUrl"         TEXT,
    "twitterTitle"       VARCHAR(60),
    "twitterDescription" VARCHAR(160),
    "twitterImageUrl"    TEXT,
    "canonicalUrl"       TEXT,
    "indexStatus"        "SeoIndexStatus" NOT NULL DEFAULT 'INDEX',
    "structuredData"     JSONB,
    "createdAt"          TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"          TIMESTAMP(3)     NOT NULL,

    CONSTRAINT "seo_meta_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "seo_meta_pagePath_key" ON "seo_meta"("pagePath");
CREATE INDEX "seo_meta_pagePath_idx" ON "seo_meta"("pagePath");
CREATE INDEX "seo_meta_indexStatus_idx" ON "seo_meta"("indexStatus");

CREATE TABLE "landing_pages" (
    "id"                 TEXT            NOT NULL,
    "title"              VARCHAR(200)    NOT NULL,
    "slug"               VARCHAR(220)    NOT NULL,
    "headline"           VARCHAR(300)    NOT NULL,
    "subheadline"        VARCHAR(500),
    "status"             "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "sections"           JSONB           NOT NULL DEFAULT '[]',
    "coverImageUrl"      TEXT,
    "backgroundImageUrl" TEXT,
    "metaTitle"          VARCHAR(60),
    "metaDescription"    VARCHAR(160),
    "publishedAt"        TIMESTAMP(3),
    "createdAt"          TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"          TIMESTAMP(3)    NOT NULL,
    "deletedAt"          TIMESTAMP(3),

    CONSTRAINT "landing_pages_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "landing_pages_slug_key" ON "landing_pages"("slug");
CREATE INDEX "landing_pages_slug_idx" ON "landing_pages"("slug");
CREATE INDEX "landing_pages_status_idx" ON "landing_pages"("status");
CREATE INDEX "landing_pages_deletedAt_idx" ON "landing_pages"("deletedAt");


CREATE TABLE "home_sliders" (
    "id"          TEXT           NOT NULL,
    "title"       VARCHAR(200)   NOT NULL,
    "description" VARCHAR(500),
    "imageUrl"    TEXT           NOT NULL,
    "imageKey"    TEXT           NOT NULL,
    "videoUrl"    TEXT,
    "videoKey"    TEXT,
    "buttonText"  VARCHAR(100),
    "buttonUrl"   VARCHAR(500),
    "target"      "SliderTarget" NOT NULL DEFAULT 'HOME',
    "isActive"    BOOLEAN        NOT NULL DEFAULT true,
    "sortOrder"   INTEGER        NOT NULL DEFAULT 0,
    "createdAt"   TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3)   NOT NULL,
    "deletedAt"   TIMESTAMP(3),

    CONSTRAINT "home_sliders_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "home_sliders_target_idx" ON "home_sliders"("target");
CREATE INDEX "home_sliders_isActive_idx" ON "home_sliders"("isActive");
CREATE INDEX "home_sliders_sortOrder_idx" ON "home_sliders"("sortOrder");
CREATE INDEX "home_sliders_deletedAt_idx" ON "home_sliders"("deletedAt");

CREATE TABLE "finance_contents" (
    "id"              TEXT            NOT NULL,
    "title"           VARCHAR(200)    NOT NULL,
    "description"     VARCHAR(1000)   NOT NULL,
    "content"         TEXT            NOT NULL,
    "heroImageUrl"    TEXT,
    "heroImageKey"    TEXT,
    "ctaText"         VARCHAR(100),
    "ctaUrl"          VARCHAR(500),
    "status"          "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "metaTitle"       VARCHAR(60),
    "metaDescription" VARCHAR(160),
    "publishedAt"     TIMESTAMP(3),
    "createdAt"       TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3)    NOT NULL,

    CONSTRAINT "finance_contents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "finance_contents_status_idx" ON "finance_contents"("status");

CREATE TABLE "finance_features" (
    "id"               TEXT         NOT NULL,
    "financeContentId" TEXT         NOT NULL,
    "title"            VARCHAR(200) NOT NULL,
    "description"      VARCHAR(500) NOT NULL,
    "iconUrl"          TEXT,
    "sortOrder"        INTEGER      NOT NULL DEFAULT 0,
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_features_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "finance_features_financeContentId_idx" ON "finance_features"("financeContentId");

ALTER TABLE "finance_features"
    ADD CONSTRAINT "finance_features_financeContentId_fkey"
    FOREIGN KEY ("financeContentId") REFERENCES "finance_contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "process_steps" (
    "id"          TEXT              NOT NULL,
    "stepNumber"  INTEGER           NOT NULL,
    "type"        "ProcessStepType" NOT NULL,
    "title"       VARCHAR(200)      NOT NULL,
    "description" VARCHAR(1000)     NOT NULL,
    "iconUrl"     TEXT,
    "imageUrl"    TEXT,
    "imageKey"    TEXT,
    "ctaText"     VARCHAR(100),
    "ctaUrl"      VARCHAR(500),
    "isActive"    BOOLEAN           NOT NULL DEFAULT true,
    "createdAt"   TIMESTAMP(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3)      NOT NULL,

    CONSTRAINT "process_steps_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "process_steps_stepNumber_key" ON "process_steps"("stepNumber");
CREATE INDEX "process_steps_stepNumber_idx" ON "process_steps"("stepNumber");
CREATE INDEX "process_steps_isActive_idx" ON "process_steps"("isActive");

CREATE TABLE "why_choose_us_items" (
    "id"          TEXT         NOT NULL,
    "title"       VARCHAR(200) NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "iconUrl"     TEXT,
    "imageUrl"    TEXT,
    "imageKey"    TEXT,
    "sortOrder"   INTEGER      NOT NULL DEFAULT 0,
    "isActive"    BOOLEAN      NOT NULL DEFAULT true,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "why_choose_us_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "why_choose_us_items_isActive_idx" ON "why_choose_us_items"("isActive");
CREATE INDEX "why_choose_us_items_sortOrder_idx" ON "why_choose_us_items"("sortOrder");

CREATE TABLE "faqs" (
    "id"        TEXT          NOT NULL,
    "question"  VARCHAR(500)  NOT NULL,
    "answer"    TEXT          NOT NULL,
    "category"  "FaqCategory" NOT NULL DEFAULT 'GENERAL',
    "sortOrder" INTEGER       NOT NULL DEFAULT 0,
    "isActive"  BOOLEAN       NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3)  NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "faqs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "faqs_category_idx" ON "faqs"("category");
CREATE INDEX "faqs_isActive_idx" ON "faqs"("isActive");
CREATE INDEX "faqs_sortOrder_idx" ON "faqs"("sortOrder");
CREATE INDEX "faqs_deletedAt_idx" ON "faqs"("deletedAt");

CREATE TABLE "testimonials" (
    "id"           TEXT            NOT NULL,
    "customerName" VARCHAR(100)    NOT NULL,
    "customerCity" VARCHAR(100),
    "rating"       INTEGER         NOT NULL DEFAULT 5,
    "title"        VARCHAR(200),
    "body"         TEXT            NOT NULL,
    "imageUrl"     TEXT,
    "imageKey"     TEXT,
    "videoUrl"     TEXT,
    "videoKey"     TEXT,
    "projectType"  VARCHAR(100),
    "status"       "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "isFeatured"   BOOLEAN         NOT NULL DEFAULT false,
    "source"       VARCHAR(100),
    "sourceUrl"    TEXT,
    "publishedAt"  TIMESTAMP(3),
    "createdAt"    TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3)    NOT NULL,
    "deletedAt"    TIMESTAMP(3),

    CONSTRAINT "testimonials_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "testimonials_rating_check" CHECK ("rating" >= 1 AND "rating" <= 5)
);

CREATE INDEX "testimonials_status_idx" ON "testimonials"("status");
CREATE INDEX "testimonials_isFeatured_idx" ON "testimonials"("isFeatured");
CREATE INDEX "testimonials_rating_idx" ON "testimonials"("rating");
CREATE INDEX "testimonials_deletedAt_idx" ON "testimonials"("deletedAt");

CREATE TABLE "newsletter_subscriptions" (
    "id"             TEXT         NOT NULL,
    "email"          VARCHAR(255) NOT NULL,
    "firstName"      VARCHAR(100),
    "lastName"       VARCHAR(100),
    "source"         VARCHAR(100),
    "isActive"       BOOLEAN      NOT NULL DEFAULT true,
    "confirmedAt"    TIMESTAMP(3),
    "unsubscribedAt" TIMESTAMP(3),
    "ipAddress"      VARCHAR(45),
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL,

    CONSTRAINT "newsletter_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "newsletter_subscriptions_email_key" ON "newsletter_subscriptions"("email");
CREATE INDEX "newsletter_subscriptions_email_idx" ON "newsletter_subscriptions"("email");
CREATE INDEX "newsletter_subscriptions_isActive_idx" ON "newsletter_subscriptions"("isActive");
CREATE INDEX "newsletter_subscriptions_createdAt_idx" ON "newsletter_subscriptions"("createdAt");

CREATE TABLE "logos" (
    "id"        TEXT         NOT NULL,
    "name"      VARCHAR(200) NOT NULL,
    "imageUrl"  TEXT         NOT NULL,
    "imageKey"  TEXT         NOT NULL,
    "altText"   VARCHAR(200),
    "linkUrl"   VARCHAR(500),
    "sortOrder" INTEGER      NOT NULL DEFAULT 0,
    "isActive"  BOOLEAN      NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "logos_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "logos_isActive_idx" ON "logos"("isActive");
CREATE INDEX "logos_sortOrder_idx" ON "logos"("sortOrder");
CREATE INDEX "logos_deletedAt_idx" ON "logos"("deletedAt");

CREATE TABLE "accreditations" (
    "id"          TEXT                NOT NULL,
    "name"        VARCHAR(200)        NOT NULL,
    "type"        "AccreditationType" NOT NULL DEFAULT 'CERTIFICATION',
    "description" VARCHAR(500),
    "imageUrl"    TEXT                NOT NULL,
    "imageKey"    TEXT                NOT NULL,
    "altText"     VARCHAR(200),
    "linkUrl"     VARCHAR(500),
    "issuedAt"    TIMESTAMP(3),
    "expiresAt"   TIMESTAMP(3),
    "sortOrder"   INTEGER             NOT NULL DEFAULT 0,
    "isActive"    BOOLEAN             NOT NULL DEFAULT true,
    "createdAt"   TIMESTAMP(3)        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3)        NOT NULL,
    "deletedAt"   TIMESTAMP(3),

    CONSTRAINT "accreditations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "accreditations_type_idx" ON "accreditations"("type");
CREATE INDEX "accreditations_isActive_idx" ON "accreditations"("isActive");
CREATE INDEX "accreditations_sortOrder_idx" ON "accreditations"("sortOrder");
CREATE INDEX "accreditations_deletedAt_idx" ON "accreditations"("deletedAt");

CREATE TABLE "banners" (
    "id"             TEXT            NOT NULL,
    "title"          VARCHAR(200)    NOT NULL,
    "description"    VARCHAR(500),
    "imageUrl"       TEXT            NOT NULL,
    "imageKey"       TEXT            NOT NULL,
    "mobileImageUrl" TEXT,
    "mobileImageKey" TEXT,
    "altText"        VARCHAR(200),
    "linkUrl"        VARCHAR(500),
    "linkText"       VARCHAR(100),
    "placement"      VARCHAR(100)    NOT NULL,
    "status"         "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "sortOrder"      INTEGER         NOT NULL DEFAULT 0,
    "startsAt"       TIMESTAMP(3),
    "endsAt"         TIMESTAMP(3),
    "createdAt"      TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3)    NOT NULL,
    "deletedAt"      TIMESTAMP(3),

    CONSTRAINT "banners_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "banners_placement_idx" ON "banners"("placement");
CREATE INDEX "banners_status_idx" ON "banners"("status");
CREATE INDEX "banners_sortOrder_idx" ON "banners"("sortOrder");
CREATE INDEX "banners_startsAt_idx" ON "banners"("startsAt");
CREATE INDEX "banners_endsAt_idx" ON "banners"("endsAt");
CREATE INDEX "banners_deletedAt_idx" ON "banners"("deletedAt");

CREATE TABLE "menus" (
    "id"        TEXT         NOT NULL,
    "name"      VARCHAR(100) NOT NULL,
    "location"  VARCHAR(100) NOT NULL,
    "isActive"  BOOLEAN      NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menus_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "menus_name_key" ON "menus"("name");
CREATE INDEX "menus_location_idx" ON "menus"("location");
CREATE INDEX "menus_isActive_idx" ON "menus"("isActive");

CREATE TABLE "menu_items" (
    "id"        TEXT         NOT NULL,
    "menuId"    TEXT         NOT NULL,
    "parentId"  TEXT,
    "label"     VARCHAR(200) NOT NULL,
    "url"       VARCHAR(500),
    "target"    VARCHAR(20),
    "iconUrl"   TEXT,
    "sortOrder" INTEGER      NOT NULL DEFAULT 0,
    "isActive"  BOOLEAN      NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "menu_items_menuId_idx" ON "menu_items"("menuId");
CREATE INDEX "menu_items_parentId_idx" ON "menu_items"("parentId");
CREATE INDEX "menu_items_sortOrder_idx" ON "menu_items"("sortOrder");

ALTER TABLE "menu_items"
    ADD CONSTRAINT "menu_items_menuId_fkey"
    FOREIGN KEY ("menuId") REFERENCES "menus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "menu_items"
    ADD CONSTRAINT "menu_items_parentId_fkey"
    FOREIGN KEY ("parentId") REFERENCES "menu_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "careers" (
    "id"             TEXT               NOT NULL,
    "title"          VARCHAR(200)       NOT NULL,
    "slug"           VARCHAR(220)       NOT NULL,
    "department"     "CareerDepartment" NOT NULL,
    "type"           "CareerType"       NOT NULL,
    "location"       VARCHAR(200)       NOT NULL,
    "isRemote"       BOOLEAN            NOT NULL DEFAULT false,
    "description"    TEXT               NOT NULL,
    "requirements"   TEXT               NOT NULL,
    "benefits"       TEXT,
    "salaryMin"      DOUBLE PRECISION,
    "salaryMax"      DOUBLE PRECISION,
    "salaryCurrency" VARCHAR(10),
    "status"         "ContentStatus"    NOT NULL DEFAULT 'DRAFT',
    "publishedAt"    TIMESTAMP(3),
    "closingAt"      TIMESTAMP(3),
    "createdAt"      TIMESTAMP(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3)       NOT NULL,
    "deletedAt"      TIMESTAMP(3),

    CONSTRAINT "careers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "careers_slug_key" ON "careers"("slug");
CREATE INDEX "careers_slug_idx" ON "careers"("slug");
CREATE INDEX "careers_department_idx" ON "careers"("department");
CREATE INDEX "careers_type_idx" ON "careers"("type");
CREATE INDEX "careers_status_idx" ON "careers"("status");
CREATE INDEX "careers_publishedAt_idx" ON "careers"("publishedAt");
CREATE INDEX "careers_closingAt_idx" ON "careers"("closingAt");
CREATE INDEX "careers_deletedAt_idx" ON "careers"("deletedAt");

CREATE TABLE "brochure_requests" (
    "id"        TEXT         NOT NULL,
    "name"      VARCHAR(200) NOT NULL,
    "email"     VARCHAR(255) NOT NULL,
    "phone"     VARCHAR(30)  NOT NULL,
    "postcode"  VARCHAR(20)  NOT NULL,
    "address"   VARCHAR(500),
    "ipAddress" VARCHAR(45),
    "sentAt"    TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brochure_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "brochure_requests_email_idx" ON "brochure_requests"("email");
CREATE INDEX "brochure_requests_createdAt_idx" ON "brochure_requests"("createdAt");

CREATE TABLE "business_inquiries" (
    "id"           TEXT           NOT NULL,
    "name"         VARCHAR(200)   NOT NULL,
    "email"        VARCHAR(255)   NOT NULL,
    "phone"        VARCHAR(30)    NOT NULL,
    "businessType" "BusinessType" NOT NULL,
    "companyName"  VARCHAR(200),
    "message"      TEXT,
    "ipAddress"    VARCHAR(45),
    "notifiedAt"   TIMESTAMP(3),
    "createdAt"    TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3)   NOT NULL,

    CONSTRAINT "business_inquiries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "business_inquiries_email_idx" ON "business_inquiries"("email");
CREATE INDEX "business_inquiries_businessType_idx" ON "business_inquiries"("businessType");
CREATE INDEX "business_inquiries_createdAt_idx" ON "business_inquiries"("createdAt");

CREATE TABLE "contact_messages" (
    "id"        TEXT             NOT NULL,
    "name"      VARCHAR(200)     NOT NULL,
    "email"     VARCHAR(255)     NOT NULL,
    "phone"     VARCHAR(30),
    "subject"   "ContactSubject" NOT NULL DEFAULT 'GENERAL',
    "message"   TEXT             NOT NULL,
    "ipAddress" VARCHAR(45),
    "readAt"    TIMESTAMP(3),
    "repliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3)     NOT NULL,

    CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "contact_messages_email_idx" ON "contact_messages"("email");
CREATE INDEX "contact_messages_subject_idx" ON "contact_messages"("subject");
CREATE INDEX "contact_messages_readAt_idx" ON "contact_messages"("readAt");
CREATE INDEX "contact_messages_createdAt_idx" ON "contact_messages"("createdAt");

CREATE TABLE "site_settings" (
    "id"          TEXT         NOT NULL,
    "key"         VARCHAR(200) NOT NULL,
    "value"       JSONB        NOT NULL,
    "description" VARCHAR(500),
    "isPublic"    BOOLEAN      NOT NULL DEFAULT false,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "site_settings_key_key" ON "site_settings"("key");
CREATE INDEX "site_settings_key_idx" ON "site_settings"("key");
CREATE INDEX "site_settings_isPublic_idx" ON "site_settings"("isPublic");