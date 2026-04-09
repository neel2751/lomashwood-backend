-- Repair Project schema drift in production.
-- 1) Add missing slug column expected by Prisma model.
-- 2) Backfill deterministic slugs for existing rows.
-- 3) Align enum type for category with ProjectCategory.
-- 4) Ensure images is non-null to match String[] model contract.

ALTER TABLE "Project"
ADD COLUMN IF NOT EXISTS "slug" TEXT;

UPDATE "Project"
SET "slug" = CONCAT('project-', "id")
WHERE "slug" IS NULL OR TRIM("slug") = '';

ALTER TABLE "Project"
ALTER COLUMN "slug" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "Project_slug_key" ON "Project"("slug");
CREATE INDEX IF NOT EXISTS "Project_slug_idx" ON "Project"("slug");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'ProjectCategory'
  ) THEN
    CREATE TYPE "ProjectCategory" AS ENUM ('kitchen', 'bedroom', 'media_wall');
  END IF;
END $$;

ALTER TABLE "Project"
ALTER COLUMN "category" TYPE "ProjectCategory"
USING (
  CASE
    WHEN "category"::text = 'kitchen' THEN 'kitchen'::"ProjectCategory"
    WHEN "category"::text = 'bedroom' THEN 'bedroom'::"ProjectCategory"
    ELSE 'kitchen'::"ProjectCategory"
  END
);

UPDATE "Project"
SET "images" = ARRAY[]::TEXT[]
WHERE "images" IS NULL;

ALTER TABLE "Project"
ALTER COLUMN "images" SET NOT NULL;
