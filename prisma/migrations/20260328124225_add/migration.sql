-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "ProductCategory" NOT NULL,
    "location" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "images" TEXT[],
    "style" TEXT,
    "finish" TEXT,
    "layout" TEXT,
    "duration" TEXT,
    "details" JSONB,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Project_category_idx" ON "Project"("category");

-- CreateIndex
CREATE INDEX "Project_completedAt_idx" ON "Project"("completedAt");

-- CreateIndex
CREATE INDEX "Project_isPublished_idx" ON "Project"("isPublished");
