/*
  Warnings:

  - You are about to drop the column `kitchensOnDisplay` on the `Showroom` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Showroom" DROP COLUMN "kitchensOnDisplay";

-- CreateTable
CREATE TABLE "ShowroomDisplayProduct" (
    "id" TEXT NOT NULL,
    "showroomId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShowroomDisplayProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShowroomDisplayProduct_showroomId_idx" ON "ShowroomDisplayProduct"("showroomId");

-- CreateIndex
CREATE INDEX "ShowroomDisplayProduct_productId_idx" ON "ShowroomDisplayProduct"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ShowroomDisplayProduct_showroomId_productId_key" ON "ShowroomDisplayProduct"("showroomId", "productId");

-- AddForeignKey
ALTER TABLE "ShowroomDisplayProduct" ADD CONSTRAINT "ShowroomDisplayProduct_showroomId_fkey" FOREIGN KEY ("showroomId") REFERENCES "Showroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShowroomDisplayProduct" ADD CONSTRAINT "ShowroomDisplayProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
