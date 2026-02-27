import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url:
        process.env.TEST_DATABASE_URL ||
        'postgresql://postgres:postgres@localhost:5432/lomash_appointment_test',
    },
  },
});

async function globalTeardown() {
  await prisma.$connect();

  await prisma.$executeRaw`TRUNCATE TABLE "Reminder" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "Reschedule" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "Cancellation" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "Booking" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "Appointment" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "TimeSlot" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "Availability" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "Consultant" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "Location" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "ServiceType" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "Session" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "User" CASCADE`;

  await prisma.$disconnect();

  const redisClient = createClient({
    url: process.env.TEST_REDIS_URL || 'redis://localhost:6379/1',
  });
  await redisClient.connect();
  await redisClient.flushDb();
  await redisClient.disconnect();
}

export default globalTeardown;