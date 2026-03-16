-- AlterTable
ALTER TABLE "Colour" ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Colour_isFeatured_idx" ON "Colour"("isFeatured");
