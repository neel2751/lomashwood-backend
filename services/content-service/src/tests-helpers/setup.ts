import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';
import { createPrismaMock, createRedisMock } from './mocks';

export function setupTestEnv(): void {
  process.env.NODE_ENV                = 'test';
  process.env.PORT                    = '4099';
  process.env.API_VERSION             = '1';
  process.env.SERVICE_NAME            = 'content-service-test';
  process.env.DATABASE_URL            = 'postgresql://test:test@localhost:5433/lomash_content_test';
  process.env.REDIS_URL               = 'redis://localhost:6380';
  process.env.REDIS_KEY_PREFIX        = 'test:content:';
  process.env.AWS_REGION              = 'eu-west-1';
  process.env.AWS_ACCESS_KEY_ID       = 'test-access-key-id';
  process.env.AWS_SECRET_ACCESS_KEY   = 'test-secret-access-key';
  process.env.AWS_S3_BUCKET           = 'lomash-test-bucket';
  process.env.AWS_S3_UPLOAD_PREFIX    = 'content/';
  process.env.KAFKA_BROKERS           = 'localhost:9092';
  process.env.KAFKA_CLIENT_ID         = 'content-service-test';
  process.env.KAFKA_GROUP_ID          = 'content-service-test-group';
  process.env.KAFKA_SSL_ENABLED       = 'false';
  process.env.CORS_ORIGINS            = 'http://localhost:3000';
  process.env.INTERNAL_SERVICE_SECRET = 'test-internal-secret-at-least-32-chars-long';
  process.env.LOG_LEVEL               = 'silent';
  process.env.LOG_PRETTY              = 'false';
  process.env.SITEMAP_BASE_URL        = 'https://lomashwood.test';
  process.env.SITEMAP_S3_KEY          = 'sitemap.xml';
  process.env.CDN_PURGE_ENABLED       = 'false';
  process.env.RATE_LIMIT_MAX_REQUESTS = '1000';
  process.env.RATE_LIMIT_WINDOW_MS    = '60000';
}

export function configureJest(): void {
  jest.setTimeout(15_000);
}

interface UnitTestContext {
  prisma: any;
  redis: ReturnType<typeof createRedisMock>;
  eventProducer: { publish: jest.Mock };
}

export function setupUnitTest(): UnitTestContext {
  setupTestEnv();

  const prisma        = createPrismaMock();
  const redis         = createRedisMock();
  const eventProducer = { publish: jest.fn() as jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    redis._store.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  return { prisma, redis, eventProducer };
}

let integrationPrisma: PrismaClient | null = null;
let integrationRedis: ReturnType<typeof createClient> | null = null;

export function setupIntegrationTest() {
  setupTestEnv();

  beforeAll(async () => {
    integrationPrisma = new PrismaClient({
      datasources: { db: { url: process.env.DATABASE_URL } },
      log: [],
    });

    await integrationPrisma.$connect();

    execSync('npx prisma migrate deploy', {
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
      stdio: 'pipe',
    });

    integrationRedis = createClient({ url: process.env.REDIS_URL });
    await integrationRedis.connect();
  });

  afterAll(async () => {
    await integrationPrisma?.$disconnect();
    await integrationRedis?.quit();
    integrationPrisma = null;
    integrationRedis = null;
  });

  beforeEach(async () => {
    await truncateTestTables(integrationPrisma!);
    await integrationRedis?.flushDb();
  });

  return {
    getPrisma: (): PrismaClient => integrationPrisma!,
    getRedis:  (): ReturnType<typeof createClient> => integrationRedis!,
  };
}

async function truncateTestTables(prisma: PrismaClient): Promise<void> {
  const tables = ['seo_meta', 'media', 'blog', 'cms_page', 'landing_page'];

  await prisma.$transaction(
    tables.map((table) =>
      prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE`),
    ),
  );
}

export async function setupE2ETest(createApp: () => Promise<{
  app: import('express').Application;
  shutdown: () => Promise<void>;
}>) {
  setupTestEnv();

  let app: import('express').Application;
  let shutdown: () => Promise<void>;

  beforeAll(async () => {
    const result = await createApp();
    app = result.app;
    shutdown = result.shutdown;
  });

  afterAll(async () => {
    await shutdown();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  return {
    getApp: (): import('express').Application => app,
  };
}

export function makeAuthHeader(user: {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
}): Record<string, string> {
  const payload = Buffer.from(JSON.stringify(user)).toString('base64');
  return {
    authorization: `Bearer test-token-${user.id}`,
    'x-user-payload': payload,
  };
}

export function makeAdminAuthHeader(): Record<string, string> {
  return makeAuthHeader({
    id: 'admin-user-id-for-tests',
    email: 'admin@lomashwood.com',
    role: 'ADMIN',
    firstName: 'Admin',
    lastName: 'Test',
  });
}

export function makeEditorAuthHeader(): Record<string, string> {
  return makeAuthHeader({
    id: 'editor-user-id-for-tests',
    email: 'editor@lomashwood.com',
    role: 'EDITOR',
    firstName: 'Editor',
    lastName: 'Test',
  });
}

export function makeCustomerAuthHeader(): Record<string, string> {
  return makeAuthHeader({
    id: 'customer-user-id-for-tests',
    email: 'customer@example.com',
    role: 'CUSTOMER',
    firstName: 'Customer',
    lastName: 'Test',
  });
}

export function expectSuccessResponse(body: Record<string, unknown>): void {
  expect(body).toHaveProperty('success', true);
  expect(body).toHaveProperty('data');
}

export function expectErrorResponse(body: Record<string, unknown>, code?: string): void {
  expect(body).toHaveProperty('success', false);
  expect(body).toHaveProperty('error');
  expect(body.error).toHaveProperty('code');
  expect(body.error).toHaveProperty('message');
  if (code) {
    expect((body.error as Record<string, unknown>).code).toBe(code);
  }
}

export function expectPaginatedResponse(body: Record<string, unknown>, expectedCount?: number): void {
  expectSuccessResponse(body);
  expect(body).toHaveProperty('meta');
  expect((body.meta as Record<string, unknown>)).toHaveProperty('pagination');

  const pagination = (body.meta as Record<string, Record<string, unknown>>).pagination;
  expect(pagination).toHaveProperty('page');
  expect(pagination).toHaveProperty('limit');
  expect(pagination).toHaveProperty('total');
  expect(pagination).toHaveProperty('totalPages');
  expect(pagination).toHaveProperty('hasNextPage');
  expect(pagination).toHaveProperty('hasPreviousPage');

  if (expectedCount !== undefined) {
    expect(Array.isArray(body.data)).toBe(true);
    expect((body.data as unknown[]).length).toBe(expectedCount);
  }
}

export function expectEventPublished(
  publishMock: jest.Mock,
  topic: string,
  partialData?: Record<string, unknown>,
): void {
  expect(publishMock).toHaveBeenCalledWith(
    topic,
    expect.objectContaining({
      type: expect.any(String),
      eventId: expect.any(String),
      occurredAt: expect.any(String),
      source: 'content-service',
      ...(partialData ? { data: expect.objectContaining(partialData) } : {}),
    }),
  );
}

export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeoutMs = 5_000,
  intervalMs = 50,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (await condition()) return;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error(`waitFor timed out after ${timeoutMs}ms`);
}