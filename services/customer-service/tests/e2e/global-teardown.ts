import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
    },
  },
});

export default async function globalTeardown(): Promise<void> {
  await prisma.$connect();

  await prisma.loyaltyTransaction.deleteMany();
  await prisma.loyaltyAccount.deleteMany();
  await prisma.supportTicketMessage.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.productReview.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.customerAddress.deleteMany();
  await prisma.notificationPreference.deleteMany();
  await prisma.customerProfile.deleteMany();

  await prisma.$disconnect();

  try {
    const redis = createClient({
      url: process.env.TEST_REDIS_URL || 'redis://localhost:6379/1',
    });
    await redis.connect();
    await redis.flushDb();
    await redis.disconnect();
  } catch {
    // Redis cleanup optional
  }
}