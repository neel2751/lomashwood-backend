-- CreateTable
CREATE TABLE "AvailabilityWeeklyPattern" (
    "id" TEXT NOT NULL,
    "consultantId" TEXT NOT NULL DEFAULT 'global',
    "weekday" INTEGER NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "slotDuration" INTEGER NOT NULL DEFAULT 60,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AvailabilityWeeklyPattern_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AvailabilityWeeklyPattern_consultantId_idx" ON "AvailabilityWeeklyPattern"("consultantId");

-- CreateIndex
CREATE UNIQUE INDEX "AvailabilityWeeklyPattern_consultantId_weekday_key" ON "AvailabilityWeeklyPattern"("consultantId", "weekday");
