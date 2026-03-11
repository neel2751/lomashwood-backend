-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "finishId" TEXT,
ADD COLUMN     "styleId" TEXT;

-- CreateIndex
CREATE INDEX "Product_styleId_idx" ON "Product"("styleId");

-- CreateIndex
CREATE INDEX "Product_finishId_idx" ON "Product"("finishId");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_styleId_fkey" FOREIGN KEY ("styleId") REFERENCES "Style"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_finishId_fkey" FOREIGN KEY ("finishId") REFERENCES "Finish"("id") ON DELETE SET NULL ON UPDATE CASCADE;
