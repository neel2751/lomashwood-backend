import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL,
    },
  },
});

export default async function globalSetup(): Promise<void> {
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/lomash_wood_customer_test';
  process.env.REDIS_URL = process.env.TEST_REDIS_URL || 'redis://localhost:6379/1';
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-e2e-tests';
  process.env.PORT = '4006';

  try {
    execSync('npx prisma migrate deploy --schema=./prisma/schema.prisma', {
      env: {
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL,
      },
      stdio: 'pipe',
    });
  } catch {
    execSync('npx prisma db push --schema=./prisma/schema.prisma --force-reset', {
      env: {
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL,
      },
      stdio: 'pipe',
    });
  }

  await prisma.$connect();
  await seedTestData();
  await prisma.$disconnect();
}

async function seedTestData(): Promise<void> {
  await prisma.customerProfile.deleteMany();

  await prisma.customerProfile.createMany({
    data: [
      {
        userId: 'seed-user-001',
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'alice@example.com',
        phone: '+447911123456',
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: 'seed-user-002',
        firstName: 'Bob',
        lastName: 'Smith',
        email: 'bob@example.com',
        phone: '+447911654321',
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  });
}