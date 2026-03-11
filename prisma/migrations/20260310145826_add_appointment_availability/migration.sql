-- CreateTable
CREATE TABLE "Availability" (
    "id" TEXT NOT NULL,
    "consultantId" TEXT NOT NULL DEFAULT 'global',
    "date" TIMESTAMP(3) NOT NULL,
    "slots" TEXT[],
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Availability_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Availability_date_idx" ON "Availability"("date");

-- CreateIndex
CREATE INDEX "Availability_consultantId_idx" ON "Availability"("consultantId");

-- CreateIndex
CREATE UNIQUE INDEX "Availability_consultantId_date_key" ON "Availability"("consultantId", "date");
