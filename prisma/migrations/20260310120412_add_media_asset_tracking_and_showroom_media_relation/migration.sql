-- CreateEnum
CREATE TYPE "MediaStatus" AS ENUM ('active', 'in_use', 'archived', 'deleted', 'unused', 'untouched');

-- AlterTable
ALTER TABLE "Showroom" ADD COLUMN     "imageMediaId" TEXT;

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "fileName" TEXT,
    "mimeType" TEXT,
    "folder" TEXT,
    "sizeBytes" INTEGER,
    "status" "MediaStatus" NOT NULL DEFAULT 'untouched',
    "source" TEXT,
    "metadata" JSONB,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Media_key_key" ON "Media"("key");

-- CreateIndex
CREATE INDEX "Media_status_idx" ON "Media"("status");

-- CreateIndex
CREATE INDEX "Showroom_imageMediaId_idx" ON "Showroom"("imageMediaId");

-- AddForeignKey
ALTER TABLE "Showroom" ADD CONSTRAINT "Showroom_imageMediaId_fkey" FOREIGN KEY ("imageMediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
