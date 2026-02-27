import 'reflect-metadata';
import type { MockPrisma, MockRedis, MockLogger } from './mocks';
import { makeMockPrisma, makeMockRedis, makeMockLogger } from './mocks';

let mockPrismaInstance: MockPrisma;
let mockRedisInstance:  MockRedis;
let mockLoggerInstance: MockLogger;

jest.mock('../../infrastructure/db/prisma.client', () => ({
  get prisma() { return mockPrismaInstance; },
}));

jest.mock('../../infrastructure/cache/redis.client', () => ({
  get redisClient() { return mockRedisInstance; },
}));

jest.mock('../../config/logger', () => ({
  get logger() { return mockLoggerInstance; },
}));

jest.mock('../../config/env', () => ({
  env: {
    NODE_ENV:               'test',
    PORT:                   3000,
    DATABASE_URL:           'postgresql://test:test@localhost:5432/test_db',
    REDIS_URL:              'redis://localhost:6379',
    JWT_SECRET:             'test-jwt-secret-32-chars-minimum',
    ANALYTICS_CACHE_TTL:    60,
    REAL_TIME_POLL_INTERVAL: 10000,
  },
}));

beforeAll(() => {
  process.env.NODE_ENV         = 'test';
  process.env.TZ               = 'UTC';
  mockPrismaInstance           = makeMockPrisma();
  mockRedisInstance            = makeMockRedis();
  mockLoggerInstance           = makeMockLogger();
});

beforeEach(() => {
  jest.clearAllMocks();

  mockPrismaInstance  = makeMockPrisma();
  mockRedisInstance   = makeMockRedis();
  mockLoggerInstance  = makeMockLogger();
});

afterEach(() => {
  jest.restoreAllMocks();
});

afterAll(async () => {
  await new Promise<void>((resolve) => setTimeout(resolve, 100));
});

export function getMockPrisma():  MockPrisma  { return mockPrismaInstance; }
export function getMockRedis():   MockRedis   { return mockRedisInstance;  }
export function getMockLogger():  MockLogger  { return mockLoggerInstance; }

export function expectSuccessResponse(json: jest.Mock,): void {
  expect(json).toHaveBeenCalledWith(
    expect.objectContaining({ success: true }),
  );
}

export function expectErrorResponse(next: jest.Mock, statusCode: number): void {
  expect(next).toHaveBeenCalledWith(
    expect.objectContaining({ statusCode }),
  );
}

export function expectPaginatedResponse(
  json:       jest.Mock,
  dataLength: number,
): void {
  expect(json).toHaveBeenCalledWith(
    expect.objectContaining({
      success: true,
      data: expect.objectContaining({
        data:       expect.arrayContaining(new Array(dataLength).fill(expect.anything())),
        pagination: expect.objectContaining({
          page:       expect.any(Number),
          limit:      expect.any(Number),
          total:      expect.any(Number),
          totalPages: expect.any(Number),
          hasNext:    expect.any(Boolean),
          hasPrev:    expect.any(Boolean),
        }),
      }),
    }),
  );
}

export function expectTimeSeries(obj: unknown): void {
  expect(obj).toMatchObject({
    granularity: expect.any(String),
    points:      expect.arrayContaining([
      expect.objectContaining({
        timestamp: expect.any(String),
        value:     expect.any(Number),
      }),
    ]),
  });
}

export function expectNotificationMetrics(obj: unknown): void {
  expect(obj).toMatchObject({
    total:        expect.any(Number),
    sent:         expect.any(Number),
    delivered:    expect.any(Number),
    failed:       expect.any(Number),
    pending:      expect.any(Number),
    cancelled:    expect.any(Number),
    bounced:      expect.any(Number),
    deliveryRate: expect.any(Number),
    failureRate:  expect.any(Number),
    bounceRate:   expect.any(Number),
  });
}

export function expectEngagementMetrics(obj: unknown): void {
  expect(obj).toMatchObject({
    totalDelivered:    expect.any(Number),
    totalOpened:       expect.any(Number),
    totalClicked:      expect.any(Number),
    totalUnsubscribed: expect.any(Number),
    totalComplained:   expect.any(Number),
    openRate:          expect.any(Number),
    clickRate:         expect.any(Number),
    clickToOpenRate:   expect.any(Number),
    unsubscribeRate:   expect.any(Number),
    complaintRate:     expect.any(Number),
  });
}

export function expectRateInRange(rate: number): void {
  expect(rate).toBeGreaterThanOrEqual(0);
  expect(rate).toBeLessThanOrEqual(1);
}

export function expectDateRange(obj: unknown): void {
  expect(obj).toMatchObject({
    from: expect.any(Date),
    to:   expect.any(Date),
  });
}

export function withTimeout(fn: () => Promise<void>, ms = 5000): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Test timed out after ${ms}ms`)), ms);
    fn().then(resolve).catch(reject).finally(() => clearTimeout(timer));
  });
}

export function mockResolvedSequence<T>(mock: jest.Mock, values: T[]): void {
  values.forEach((val) => mock.mockResolvedValueOnce(val));
}

export function mockRejectedOnce(mock: jest.Mock, error: Error | string): void {
  mock.mockRejectedValueOnce(typeof error === 'string' ? new Error(error) : error);
}