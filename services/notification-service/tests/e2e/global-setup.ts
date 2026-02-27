import { execSync } from 'child_process';
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

async function globalSetup(): Promise<void> {
  console.log('\n🚀 [Notification E2E] Global setup starting...');

  execSync('npx prisma migrate deploy', {
    env: {
      ...process.env,
      DATABASE_URL:
        process.env.TEST_DATABASE_URL ??
        'postgresql://postgres:postgres@localhost:5433/lomash_notification_test',
    },
    stdio: 'inherit',
  });

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

  await seedBaselineData();

  const redis = createClient({
    url: process.env.TEST_REDIS_URL ?? 'redis://localhost:6380',
  });
  await redis.connect();
  await redis.flushDb();
  await redis.disconnect();

  await prisma.$disconnect();
  console.log('✅ [Notification E2E] Global setup complete\n');
}

async function seedBaselineData(): Promise<void> {
  await prisma.notificationTemplate.createMany({
    skipDuplicates: true,
    data: [
      {
        id: 'tpl-email-welcome',
        name: 'Welcome Email',
        channel: 'EMAIL',
        subject: 'Welcome to Lomash Wood!',
        body: '<h1>Welcome, {{name}}!</h1>',
        variables: ['name'],
        isActive: true,
      },
      {
        id: 'tpl-sms-otp',
        name: 'OTP SMS',
        channel: 'SMS',
        subject: null,
        body: 'Your OTP is {{otp}}. Valid 10 mins.',
        variables: ['otp'],
        isActive: true,
      },
      {
        id: 'tpl-push-promo',
        name: 'Promo Push',
        channel: 'PUSH',
        subject: '🎉 Special Offer!',
        body: '{{discount}}% off kitchens this weekend.',
        variables: ['discount'],
        isActive: true,
      },
      {
        id: 'tpl-email-booking',
        name: 'Booking Confirmation',
        channel: 'EMAIL',
        subject: 'Appointment Confirmed',
        body: '<p>Hi {{name}}, your appointment on {{date}} is confirmed.</p>',
        variables: ['name', 'date'],
        isActive: true,
      },
    ],
  });

  await prisma.webhookEndpoint.createMany({
    skipDuplicates: true,
    data: [
      {
        id: 'wh-e2e-001',
        url: 'http://localhost:9999/webhook-receiver',
        secret: 'e2e-webhook-secret-abc123',
        events: ['notification.sent', 'notification.failed'],
        isActive: true,
      },
    ],
  });

  await prisma.notificationPreference.createMany({
    skipDuplicates: true,
    data: [
      {
        id: 'pref-e2e-user-001',
        userId: 'e2e-user-001',
        emailEnabled: true,
        smsEnabled: true,
        pushEnabled: true,
        marketingEnabled: true,
      },
    ],
  });
}

export default globalSetup;