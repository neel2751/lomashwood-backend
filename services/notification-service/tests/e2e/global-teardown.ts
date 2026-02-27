import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url:
        process.env.TEST_DATABASE_URL ??
        'postgresql://postgres:postgres@localhost:5433/lomash_notification_test',
    },
  },
});

async function globalTeardown(): Promise<void> {
  console.log('\n🧹 [Notification E2E] Global teardown starting...');

  await prisma.$connect();

  await prisma.$transaction([
    prisma.$executeRawUnsafe(`TRUNCATE TABLE "NotificationLog" CASCADE`),
    prisma.$executeRawUnsafe(`TRUNCATE TABLE "NotificationTemplate" CASCADE`),
    prisma.$executeRawUnsafe(`TRUNCATE TABLE "NotificationPreference" CASCADE`),
    prisma.$executeRawUnsafe(`TRUNCATE TABLE "NotificationCampaign" CASCADE`),
    prisma.$executeRawUnsafe(`TRUNCATE TABLE "NotificationSubscription" CASCADE`),
    prisma.$executeRawUnsafe(`TRUNCATE TABLE "DeliveryReport" CASCADE`),
    prisma.$executeRawUnsafe(`TRUNCATE TABLE "WebhookEndpoint" CASCADE`),
  ]);

  await prisma.$disconnect();

  const redis = createClient({
    url: process.env.TEST_REDIS_URL ?? 'redis://localhost:6380',
  });
  await redis.connect();
  await redis.flushDb();
  await redis.disconnect();

  console.log('✅ [Notification E2E] Global teardown complete\n');
}

export default globalTeardown;