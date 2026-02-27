import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import * as fs from 'fs';
import * as path from 'path';

declare global {
  var __PG_CONTAINER__: StartedTestContainer;
  var __REDIS_CONTAINER__: StartedTestContainer;
  var __PRISMA__: PrismaClient;
  var __E2E_ADMIN_TOKEN__: string;
  var __E2E_USER_TOKEN__: string;
  var __E2E_USER_ID__: string;
  var __E2E_ADMIN_ID__: string;
}

const E2E_TIMEOUT = 120_000;

export default async function globalSetup(): Promise<void> {
  console.log('\n🚀 [E2E] Starting global test environment...');

  // ── 1. Spin up PostgreSQL container ──────────────────────────────────────
  console.log('📦 [E2E] Starting PostgreSQL container...');
  const pgContainer = await new GenericContainer('postgres:15-alpine')
    .withEnvironment({
      POSTGRES_USER: 'lomash_test',
      POSTGRES_PASSWORD: 'lomash_test_pw',
      POSTGRES_DB: 'lomash_order_payment_test',
    })
    .withExposedPorts(5432)
    .withWaitStrategy(Wait.forLogMessage('database system is ready to accept connections'))
    .withStartupTimeout(E2E_TIMEOUT)
    .start();

  const pgHost = pgContainer.getHost();
  const pgPort = pgContainer.getMappedPort(5432);
  const databaseUrl = `postgresql://lomash_test:lomash_test_pw@${pgHost}:${pgPort}/lomash_order_payment_test`;

  global.__PG_CONTAINER__ = pgContainer;
  process.env.DATABASE_URL = databaseUrl;
  console.log(`✅ [E2E] PostgreSQL ready at ${pgHost}:${pgPort}`);

  // ── 2. Spin up Redis container ────────────────────────────────────────────
  console.log('📦 [E2E] Starting Redis container...');
  const redisContainer = await new GenericContainer('redis:7-alpine')
    .withExposedPorts(6379)
    .withWaitStrategy(Wait.forLogMessage('Ready to accept connections'))
    .withStartupTimeout(E2E_TIMEOUT)
    .start();

  const redisHost = redisContainer.getHost();
  const redisPort = redisContainer.getMappedPort(6379);

  global.__REDIS_CONTAINER__ = redisContainer;
  process.env.REDIS_URL = `redis://${redisHost}:${redisPort}`;
  console.log(`✅ [E2E] Redis ready at ${redisHost}:${redisPort}`);

  // ── 3. Set required env vars ──────────────────────────────────────────────
  process.env.NODE_ENV = 'test';
  process.env.PORT = '0';
  process.env.JWT_SECRET = 'e2e-test-jwt-secret-32-chars-long!!';
  process.env.JWT_EXPIRES_IN = '1h';
  process.env.STRIPE_SECRET_KEY = 'sk_test_placeholder_for_e2e';
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_placeholder';
  process.env.BCRYPT_ROUNDS = '1'; // Fast hashing in tests

  // ── 4. Run Prisma migrations ──────────────────────────────────────────────
  console.log('🔄 [E2E] Running database migrations...');
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'pipe',
  });
  console.log('✅ [E2E] Migrations complete');

  // ── 5. Seed test data ─────────────────────────────────────────────────────
  console.log('🌱 [E2E] Seeding test data...');
  const prisma = new PrismaClient();
  global.__PRISMA__ = prisma;

  const passwordHash = await bcrypt.hash('TestPassword123!', 1);

  // Seed admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@lomashwood-test.com' },
    update: {},
    create: {
      id: 'e2e-admin-uuid-001',
      email: 'admin@lomashwood-test.com',
      name: 'E2E Admin',
      password: passwordHash,
      role: 'ADMIN',
      emailVerified: true,
    },
  });

  // Seed customer user
  const customerUser = await prisma.user.upsert({
    where: { email: 'customer@lomashwood-test.com' },
    update: {},
    create: {
      id: 'e2e-customer-uuid-001',
      email: 'customer@lomashwood-test.com',
      name: 'E2E Customer',
      password: passwordHash,
      role: 'CUSTOMER',
      emailVerified: true,
    },
  });

  // Seed product
  await prisma.product.upsert({
    where: { id: 'e2e-product-uuid-001' },
    update: {},
    create: {
      id: 'e2e-product-uuid-001',
      title: 'Luna White Kitchen',
      description: 'A stunning modern white kitchen',
      price: 150000,
      category: 'KITCHEN',
      isActive: true,
    },
  });

  // Seed shipping rate
  await prisma.shippingRate.upsert({
    where: { id: 'e2e-ship-rate-uuid-001' },
    update: {},
    create: {
      id: 'e2e-ship-rate-uuid-001',
      name: 'Standard Delivery',
      description: '3-5 business days',
      method: 'STANDARD',
      price: 995,
      freeThreshold: 50000,
      estimatedDays: 5,
      isActive: true,
      countries: ['GB'],
    },
  });

  // Seed tax rule
  await prisma.taxRule.upsert({
    where: { id: 'e2e-tax-uuid-001' },
    update: {},
    create: {
      id: 'e2e-tax-uuid-001',
      name: 'UK Standard VAT',
      type: 'PERCENTAGE',
      rate: 20,
      country: 'GB',
      category: 'GENERAL',
      isDefault: true,
      isActive: true,
    },
  });

  // Seed coupon
  await prisma.coupon.upsert({
    where: { id: 'e2e-coupon-uuid-001' },
    update: {},
    create: {
      id: 'e2e-coupon-uuid-001',
      code: 'E2ETEST20',
      description: 'E2E Test coupon - 20% off',
      type: 'PERCENTAGE',
      value: 20,
      minOrderAmount: 50000,
      maxDiscountAmount: 30000,
      usageLimit: 999,
      usageCount: 0,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
      status: 'ACTIVE',
    },
  });

  console.log('✅ [E2E] Seed data committed');

  // ── 6. Generate auth tokens ───────────────────────────────────────────────
  const jwtSecret = process.env.JWT_SECRET!;

  global.__E2E_ADMIN_ID__ = adminUser.id;
  global.__E2E_USER_ID__ = customerUser.id;

  global.__E2E_ADMIN_TOKEN__ = jwt.sign(
    { id: adminUser.id, email: adminUser.email, role: 'ADMIN' },
    jwtSecret,
    { expiresIn: '1h' },
  );

  global.__E2E_USER_TOKEN__ = jwt.sign(
    { id: customerUser.id, email: customerUser.email, role: 'CUSTOMER' },
    jwtSecret,
    { expiresIn: '1h' },
  );

  // ── 7. Write state file for cross-process access ─────────────────────────
  const stateFilePath = path.join(__dirname, '.e2e-state.json');
  fs.writeFileSync(
    stateFilePath,
    JSON.stringify({
      databaseUrl,
      redisUrl: process.env.REDIS_URL,
      adminToken: global.__E2E_ADMIN_TOKEN__,
      userToken: global.__E2E_USER_TOKEN__,
      adminId: global.__E2E_ADMIN_ID__,
      userId: global.__E2E_USER_ID__,
    }),
    'utf-8',
  );

  console.log('✅ [E2E] Global setup complete\n');
}