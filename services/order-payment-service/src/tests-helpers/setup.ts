import { jest, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { mockPrismaClient, mockRedisClient, mockStripeClient, mockLogger, resetAllMocks } from './mocks';

jest.mock('../infrastructure/db/prisma.client', () => ({
  getPrismaClient: jest.fn().mockReturnValue(mockPrismaClient),
  prisma: mockPrismaClient,
}));

jest.mock('../infrastructure/cache/redis.client', () => ({
  getRedisClient: jest.fn().mockReturnValue(mockRedisClient),
  redis: mockRedisClient,
}));

jest.mock('../infrastructure/payments/stripe.client', () => ({
  getStripeClient: jest.fn().mockReturnValue(mockStripeClient),
  stripe: mockStripeClient,
}));

jest.mock('../config/logger', () => ({
  createLogger: jest.fn().mockReturnValue(mockLogger),
  logger: mockLogger,
}));

jest.mock('node-cron', () => ({
  schedule: jest.fn().mockReturnValue({
    stop: jest.fn(),
    start: jest.fn(),
    destroy: jest.fn(),
  }),
}));

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => mockStripeClient);
});

const originalEnv = process.env;

export function setupTestEnv(): void {
  process.env = {
    ...originalEnv,
    NODE_ENV: 'test',
    PORT: '4001',
    DATABASE_URL: 'postgresql://test:test@localhost:5432/lomash_order_test',
    REDIS_URL: 'redis://localhost:6379/1',
    STRIPE_SECRET_KEY: 'sk_test_mock_key',
    STRIPE_WEBHOOK_SECRET: 'whsec_mock_secret',
    JWT_SECRET: 'test-jwt-secret-min-32-chars-long',
    CORS_ORIGINS: 'http://localhost:3000',
    LOG_LEVEL: 'silent',
  };
}

export function teardownTestEnv(): void {
  process.env = originalEnv;
}

export function setupUnitTest(): void {
  beforeAll(() => {
    setupTestEnv();
  });

  afterAll(() => {
    teardownTestEnv();
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    resetAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });
}

export function setupIntegrationTest(): void {
  beforeAll(async () => {
    setupTestEnv();
  });

  afterAll(async () => {
    teardownTestEnv();
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    resetAllMocks();
  });
}

export interface MockPrismaTransactionCallback<T> {
  (fn: (tx: typeof mockPrismaClient) => Promise<T>): Promise<T>;
}

export function setupPrismaTransactionMock(): void {
  mockPrismaClient.$transaction.mockImplementation(
    (fn: (tx: typeof mockPrismaClient) => Promise<unknown>) => fn(mockPrismaClient),
  );
}

export function setupPrismaTransactionError(error: Error): void {
  mockPrismaClient.$transaction.mockRejectedValueOnce(error);
}

export function mockDate(isoString: string): () => void {
  const fixedDate = new Date(isoString);
  const spy = jest.spyOn(global, 'Date').mockImplementation((arg?: unknown) => {
    if (arg !== undefined) {
      return new (jest.requireActual<typeof Date>('date'))(arg as string | number | Date);
    }
    return fixedDate;
  });

  (global.Date as unknown as { now: () => number }).now = jest.fn(() => fixedDate.getTime());

  return () => spy.mockRestore();
}

export function mockUUID(value: string): () => void {
  const { randomUUID } = jest.requireActual<typeof import('crypto')>('crypto');
  const spy = jest
    .spyOn(require('crypto'), 'randomUUID')
    .mockReturnValue(value as `${string}-${string}-${string}-${string}-${string}`);
  return () => spy.mockRestore();
}

export const testTimeouts = {
  unit: 5000,
  integration: 15000,
  e2e: 30000,
} as const;