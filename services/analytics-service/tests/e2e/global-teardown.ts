
import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';

const prisma = new PrismaClient({
  // Prisma 5+ uses `datasourceUrl` instead of the nested `datasources` object.
  datasourceUrl:
    process.env.TEST_DATABASE_URL ??
    'postgresql://postgres:postgres@localhost:5433/lomash_analytics_test',
});

async function globalTeardown(): Promise<void> {
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

  await prisma.$disconnect();

  const redis = createClient({
    url: process.env.TEST_REDIS_URL ?? 'redis://localhost:6380',
  });
  await redis.connect();
  await redis.flushDb();
  await redis.disconnect();
}

export default globalTeardown;