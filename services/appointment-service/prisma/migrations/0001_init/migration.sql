
CREATE TYPE "AppointmentType" AS ENUM ('HOME_MEASUREMENT', 'ONLINE', 'SHOWROOM');


CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW', 'RESCHEDULED');


CREATE TYPE "BookingCategory" AS ENUM ('KITCHEN', 'BEDROOM', 'BOTH');


CREATE TYPE "ReminderStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');


CREATE TYPE "ReminderType" AS ENUM ('EMAIL', 'SMS', 'PUSH');


CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');


CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "appointmentType" "AppointmentType" NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'PENDING',
    "category" "BookingCategory" NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerPostcode" TEXT NOT NULL,
    "customerAddress" TEXT NOT NULL,
    "consultantId" TEXT,
    "showroomId" TEXT,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "scheduledTime" TEXT NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 60,
    "endTime" TEXT,
    "notes" TEXT,
    "internalNotes" TEXT,
    "cancellationReason" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);


CREATE TABLE "consultants" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "specialization" TEXT[],
    "bio" TEXT,
    "profileImage" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consultants_pkey" PRIMARY KEY ("id")
);


CREATE TABLE "availability" (
    "id" TEXT NOT NULL,
    "consultantId" TEXT NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT true,
    "specificDate" TIMESTAMP(3),
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "blockReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "availability_pkey" PRIMARY KEY ("id")
);


CREATE TABLE "showrooms" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "postcode" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'United Kingdom',
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "mapLink" TEXT,
    "image" TEXT,
    "images" TEXT[],
    "openingHours" JSONB NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/London',
    "capacity" INTEGER NOT NULL DEFAULT 5,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "showrooms_pkey" PRIMARY KEY ("id")
);


CREATE TABLE "reminders" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "type" "ReminderType" NOT NULL,
    "status" "ReminderStatus" NOT NULL DEFAULT 'PENDING',
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "recipientEmail" TEXT,
    "recipientPhone" TEXT,
    "subject" TEXT,
    "message" TEXT NOT NULL,
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);


CREATE TABLE "time_slots" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 60,
    "consultantId" TEXT,
    "showroomId" TEXT,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "blockReason" TEXT,
    "maxBookings" INTEGER NOT NULL DEFAULT 1,
    "currentBookings" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "time_slots_pkey" PRIMARY KEY ("id")
);


CREATE TABLE "calendar_integrations" (
    "id" TEXT NOT NULL,
    "consultantId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "calendarId" TEXT NOT NULL,
    "syncEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_integrations_pkey" PRIMARY KEY ("id")
);


CREATE INDEX "bookings_appointmentType_idx" ON "bookings"("appointmentType");


CREATE INDEX "bookings_status_idx" ON "bookings"("status");


CREATE INDEX "bookings_category_idx" ON "bookings"("category");


CREATE INDEX "bookings_scheduledDate_idx" ON "bookings"("scheduledDate");


CREATE INDEX "bookings_consultantId_idx" ON "bookings"("consultantId");


CREATE INDEX "bookings_showroomId_idx" ON "bookings"("showroomId");


CREATE INDEX "bookings_customerEmail_idx" ON "bookings"("customerEmail");


CREATE INDEX "bookings_customerPhone_idx" ON "bookings"("customerPhone");


CREATE UNIQUE INDEX "consultants_userId_key" ON "consultants"("userId");


CREATE UNIQUE INDEX "consultants_email_key" ON "consultants"("email");


CREATE INDEX "consultants_email_idx" ON "consultants"("email");


CREATE INDEX "consultants_isActive_idx" ON "consultants"("isActive");


CREATE INDEX "consultants_isAvailable_idx" ON "consultants"("isAvailable");


CREATE INDEX "availability_consultantId_idx" ON "availability"("consultantId");


CREATE INDEX "availability_dayOfWeek_idx" ON "availability"("dayOfWeek");


CREATE INDEX "availability_specificDate_idx" ON "availability"("specificDate");


CREATE INDEX "showrooms_city_idx" ON "showrooms"("city");


CREATE INDEX "showrooms_postcode_idx" ON "showrooms"("postcode");


CREATE INDEX "showrooms_isActive_idx" ON "showrooms"("isActive");


CREATE INDEX "reminders_bookingId_idx" ON "reminders"("bookingId");


CREATE INDEX "reminders_status_idx" ON "reminders"("status");


CREATE INDEX "reminders_scheduledFor_idx" ON "reminders"("scheduledFor");


CREATE INDEX "reminders_type_idx" ON "reminders"("type");


CREATE INDEX "time_slots_date_idx" ON "time_slots"("date");


CREATE INDEX "time_slots_consultantId_idx" ON "time_slots"("consultantId");


CREATE INDEX "time_slots_showroomId_idx" ON "time_slots"("showroomId");


CREATE INDEX "time_slots_isAvailable_idx" ON "time_slots"("isAvailable");


CREATE UNIQUE INDEX "calendar_integrations_consultantId_key" ON "calendar_integrations"("consultantId");


CREATE INDEX "calendar_integrations_consultantId_idx" ON "calendar_integrations"("consultantId");


ALTER TABLE "bookings" ADD CONSTRAINT "bookings_consultantId_fkey" FOREIGN KEY ("consultantId") REFERENCES "consultants"("id") ON DELETE SET NULL ON UPDATE CASCADE;


ALTER TABLE "bookings" ADD CONSTRAINT "bookings_showroomId_fkey" FOREIGN KEY ("showroomId") REFERENCES "showrooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;


ALTER TABLE "availability" ADD CONSTRAINT "availability_consultantId_fkey" FOREIGN KEY ("consultantId") REFERENCES "consultants"("id") ON DELETE CASCADE ON UPDATE CASCADE;


ALTER TABLE "reminders" ADD CONSTRAINT "reminders_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;