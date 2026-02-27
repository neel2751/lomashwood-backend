
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';

const prisma = new PrismaClient({
  // Prisma 5+ uses `datasourceUrl` instead of the nested `datasources` object.
  datasourceUrl:
    process.env.TEST_DATABASE_URL ??
    'postgresql://postgres:postgres@localhost:5433/lomash_analytics_test',
});

async function globalSetup(): Promise<void> {
  execSync('npx prisma migrate deploy', {
    env: {
      ...process.env,
      DATABASE_URL:
        process.env.TEST_DATABASE_URL ??
        'postgresql://postgres:postgres@localhost:5433/lomash_analytics_test',
    },
    stdio: 'inherit',
  });

  await prisma.$connect();

  await prisma.$transaction([
    prisma.$executeRawUnsafe(`TRUNCATE TABLE "AnalyticsEvent" CASCADE`),
    prisma.$executeRawUnsafe(`TRUNCATE TABLE "AnalyticsSession" CASCADE`),
    prisma.$executeRawUnsafe(`TRUNCATE TABLE "AnalyticsPageview" CASCADE`),
    prisma.$executeRawUnsafe(`TRUNCATE TABLE "AnalyticsConversion" CASCADE`),
    prisma.$executeRawUnsafe(`TRUNCATE TABLE "AnalyticsFunnel" CASCADE`),
    prisma.$executeRawUnsafe(`TRUNCATE TABLE "AnalyticsCohort" CASCADE`),
    prisma.$executeRawUnsafe(`TRUNCATE TABLE "AnalyticsDashboard" CASCADE`),
    prisma.$executeRawUnsafe(`TRUNCATE TABLE "AnalyticsReport" CASCADE`),
    prisma.$executeRawUnsafe(`TRUNCATE TABLE "AnalyticsExport" CASCADE`),
    prisma.$executeRawUnsafe(`TRUNCATE TABLE "IngestionLog" CASCADE`),
  ]);

  await seedBaselineData();

  const redis = createClient({
    url: process.env.TEST_REDIS_URL ?? 'redis://localhost:6380',
  });
  await redis.connect();
  await redis.flushDb();
  await redis.disconnect();

  await prisma.$disconnect();
}

async function seedBaselineData(): Promise<void> {
  await prisma.analyticsFunnel.createMany({
    skipDuplicates: true,
    data: [
      {
        id: 'funnel-seed-001',
        name: 'Appointment Booking Funnel',
        steps: [
          { name: 'Product Viewed', eventName: 'product_viewed', order: 1 },
          { name: 'CTA Clicked', eventName: 'cta_clicked', order: 2 },
          { name: 'Booking Started', eventName: 'booking_started', order: 3 },
          { name: 'Appointment Booked', eventName: 'appointment_booked', order: 4 },
        ],
        isActive: true,
      },
    ],
  });

  await prisma.analyticsDashboard.createMany({
    skipDuplicates: true,
    data: [
      {
        id: 'dashboard-seed-001',
        name: 'Default Overview',
        widgets: [
          { type: 'METRIC', title: 'Total Sessions', metric: 'sessions', period: '7d' },
          { type: 'TIMESERIES', title: 'Daily Pageviews', metric: 'pageviews', period: '30d' },
        ],
        isDefault: true,
      },
    ],
  });
}

export default globalSetup;