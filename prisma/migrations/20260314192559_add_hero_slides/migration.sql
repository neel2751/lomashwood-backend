-- CreateEnum
CREATE TYPE "HeroSlideType" AS ENUM ('image', 'video');

-- CreateTable
CREATE TABLE "HeroSlide" (
    "id" TEXT NOT NULL,
    "type" "HeroSlideType" NOT NULL,
    "src" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT,
    "ctaText" TEXT,
    "ctaLink" TEXT,
    "secondaryCtaText" TEXT,
    "secondaryCtaLink" TEXT,
    "overlayOpacity" DOUBLE PRECISION NOT NULL DEFAULT 0.4,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HeroSlide_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HeroSlide_isActive_idx" ON "HeroSlide"("isActive");

-- CreateIndex
CREATE INDEX "HeroSlide_order_idx" ON "HeroSlide"("order");
