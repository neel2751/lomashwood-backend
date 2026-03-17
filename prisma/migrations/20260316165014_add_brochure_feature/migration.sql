-- CreateEnum
CREATE TYPE "BrochureDeliveryMethod" AS ENUM ('download', 'post');

-- CreateTable
CREATE TABLE "Brochure" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "coverImage" TEXT,
    "pdfUrl" TEXT NOT NULL,
    "category" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "pages" INTEGER,
    "sizeMb" DOUBLE PRECISION,
    "year" INTEGER,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brochure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrochureRequest" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "postcode" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "deliveryMethod" "BrochureDeliveryMethod" NOT NULL,
    "marketingOptIn" BOOLEAN NOT NULL DEFAULT false,
    "brochureIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "brochureTitles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrochureRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_BrochureToBrochureRequest" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_BrochureToBrochureRequest_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Brochure_slug_key" ON "Brochure"("slug");

-- CreateIndex
CREATE INDEX "Brochure_isFeatured_idx" ON "Brochure"("isFeatured");

-- CreateIndex
CREATE INDEX "Brochure_isPublished_idx" ON "Brochure"("isPublished");

-- CreateIndex
CREATE INDEX "Brochure_sortOrder_idx" ON "Brochure"("sortOrder");

-- CreateIndex
CREATE INDEX "Brochure_category_idx" ON "Brochure"("category");

-- CreateIndex
CREATE INDEX "BrochureRequest_email_idx" ON "BrochureRequest"("email");

-- CreateIndex
CREATE INDEX "BrochureRequest_deliveryMethod_idx" ON "BrochureRequest"("deliveryMethod");

-- CreateIndex
CREATE INDEX "_BrochureToBrochureRequest_B_index" ON "_BrochureToBrochureRequest"("B");

-- AddForeignKey
ALTER TABLE "_BrochureToBrochureRequest" ADD CONSTRAINT "_BrochureToBrochureRequest_A_fkey" FOREIGN KEY ("A") REFERENCES "Brochure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BrochureToBrochureRequest" ADD CONSTRAINT "_BrochureToBrochureRequest_B_fkey" FOREIGN KEY ("B") REFERENCES "BrochureRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
