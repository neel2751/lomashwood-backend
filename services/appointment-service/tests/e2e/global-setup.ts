import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';

const prisma = new PrismaClient();

async function globalSetup() {
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL =
    process.env.TEST_DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/lomash_appointment_test';
  process.env.REDIS_URL = process.env.TEST_REDIS_URL || 'redis://localhost:6379/1';
  process.env.JWT_SECRET = 'e2e-test-jwt-secret-key-minimum-32-chars';
  process.env.JWT_REFRESH_SECRET = 'e2e-test-refresh-secret-key-minimum-32-chars';
  process.env.PORT = '4004';
  process.env.SMTP_HOST = 'localhost';
  process.env.SMTP_PORT = '1025';
  process.env.EMAIL_FROM = 'noreply@lomashwood.test';

  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
    stdio: 'inherit',
  });

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

  await prisma.user.createMany({
    data: [
      {
        id: 'e2e-admin-user-id',
        email: 'admin@lomashwood.test',
        name: 'E2E Admin',
        role: 'ADMIN',
        passwordHash: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
      },
      {
        id: 'e2e-customer-user-id',
        email: 'customer@lomashwood.test',
        name: 'E2E Customer',
        role: 'CUSTOMER',
        passwordHash: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
      },
      {
        id: 'e2e-customer-two-id',
        email: 'customer2@lomashwood.test',
        name: 'E2E Customer Two',
        role: 'CUSTOMER',
        passwordHash: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
      },
    ],
  });

  await prisma.serviceType.createMany({
    data: [
      {
        id: 'e2e-service-home',
        title: 'Home Measurement',
        description: 'We visit your home to measure your space',
        type: 'HOME_MEASUREMENT',
        durationMinutes: 60,
        isActive: true,
      },
      {
        id: 'e2e-service-online',
        title: 'Online Consultation',
        description: 'Virtual consultation via video call',
        type: 'ONLINE',
        durationMinutes: 45,
        isActive: true,
      },
      {
        id: 'e2e-service-showroom',
        title: 'Showroom Visit',
        description: 'Visit our showroom in person',
        type: 'SHOWROOM',
        durationMinutes: 90,
        isActive: true,
      },
    ],
  });

  await prisma.location.createMany({
    data: [
      {
        id: 'e2e-location-clapham',
        name: 'Lomash Wood Clapham',
        address: '123 High Street, Clapham',
        city: 'London',
        postcode: 'SW4 7AB',
        email: 'clapham@lomashwood.com',
        phone: '+442071234567',
        openingHours: {
          monday: '09:00-18:00',
          tuesday: '09:00-18:00',
          wednesday: '09:00-18:00',
          thursday: '09:00-18:00',
          friday: '09:00-18:00',
          saturday: '10:00-16:00',
          sunday: 'Closed',
        },
        mapLink: 'https://maps.google.com/?q=Lomash+Wood+Clapham',
        isActive: true,
      },
    ],
  });

  await prisma.consultant.createMany({
    data: [
      {
        id: 'e2e-consultant-alice',
        name: 'Alice Johnson',
        email: 'alice@lomashwood.com',
        phone: '+441234567890',
        specialisation: 'Kitchen Design',
        bio: 'Expert kitchen designer with 10 years experience',
        isActive: true,
      },
      {
        id: 'e2e-consultant-bob',
        name: 'Bob Smith',
        email: 'bob@lomashwood.com',
        phone: '+441234567891',
        specialisation: 'Bedroom Design',
        bio: 'Specialist in luxury bedroom design',
        isActive: true,
      },
    ],
  });

  await prisma.availability.createMany({
    data: [
      { consultantId: 'e2e-consultant-alice', dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
      { consultantId: 'e2e-consultant-alice', dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
      { consultantId: 'e2e-consultant-alice', dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
      { consultantId: 'e2e-consultant-alice', dayOfWeek: 4, startTime: '09:00', endTime: '17:00' },
      { consultantId: 'e2e-consultant-alice', dayOfWeek: 5, startTime: '09:00', endTime: '17:00' },
      { consultantId: 'e2e-consultant-bob', dayOfWeek: 1, startTime: '10:00', endTime: '18:00' },
      { consultantId: 'e2e-consultant-bob', dayOfWeek: 3, startTime: '10:00', endTime: '18:00' },
      { consultantId: 'e2e-consultant-bob', dayOfWeek: 5, startTime: '10:00', endTime: '18:00' },
    ],
  });

  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() + 1);

  const aliceSlots = Array.from({ length: 10 }, (_, i) => {
    const slotDate = new Date(baseDate);
    slotDate.setHours(9 + i, 0, 0, 0);
    return {
      id: `e2e-alice-slot-${i + 1}`,
      consultantId: 'e2e-consultant-alice',
      startsAt: new Date(slotDate),
      endsAt: new Date(slotDate.getTime() + 60 * 60 * 1000),
      isAvailable: true,
    };
  });

  const bobSlots = Array.from({ length: 10 }, (_, i) => {
    const slotDate = new Date(baseDate);
    slotDate.setHours(10 + i, 0, 0, 0);
    return {
      id: `e2e-bob-slot-${i + 1}`,
      consultantId: 'e2e-consultant-bob',
      startsAt: new Date(slotDate),
      endsAt: new Date(slotDate.getTime() + 60 * 60 * 1000),
      isAvailable: true,
    };
  });

  await prisma.timeSlot.createMany({ data: [...aliceSlots, ...bobSlots] });

  const redisClient = createClient({ url: process.env.REDIS_URL });
  await redisClient.connect();
  await redisClient.flushDb();
  await redisClient.disconnect();

  globalThis.__E2E_BASE_URL__ = `http://localhost:${process.env.PORT}`;
  globalThis.__E2E_ADMIN_EMAIL__ = 'admin@lomashwood.test';
  globalThis.__E2E_ADMIN_PASSWORD__ = 'password';
  globalThis.__E2E_CUSTOMER_EMAIL__ = 'customer@lomashwood.test';
  globalThis.__E2E_CUSTOMER_PASSWORD__ = 'password';
  globalThis.__E2E_CUSTOMER2_EMAIL__ = 'customer2@lomashwood.test';
  globalThis.__E2E_CUSTOMER2_PASSWORD__ = 'password';

  await prisma.$disconnect();
}

export default globalSetup;