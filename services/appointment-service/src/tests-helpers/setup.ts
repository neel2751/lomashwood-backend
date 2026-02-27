import { jest, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { mockPrismaClient, mockRedisClient, resetAllMocks } from './mocks';

jest.mock('../infrastructure/db/prisma.client', () => ({
  getPrismaClient: jest.fn(() => mockPrismaClient),
}));

jest.mock('../infrastructure/cache/redis.client', () => ({
  getRedisClient: jest.fn(() => mockRedisClient),
}));

jest.mock('../infrastructure/messaging/event-producer', () => ({
  EventProducer: jest.fn().mockImplementation(() => ({
    publish: jest.fn(),
    publishBatch: jest.fn(),
  })),
}));

jest.mock('../infrastructure/notifications/email.client', () => ({
  EmailClient: jest.fn().mockImplementation(() => ({
    send: jest.fn(),
    sendBookingConfirmation: jest.fn(),
    sendBookingCancellation: jest.fn(),
    sendBookingRescheduled: jest.fn(),
    sendInternalNotification: jest.fn(),
    sendReminder: jest.fn(),
  })),
}));

jest.mock('../infrastructure/notifications/sms.client', () => ({
  SmsClient: jest.fn().mockImplementation(() => ({
    send: jest.fn(),
    sendBookingConfirmation: jest.fn(),
    sendReminder: jest.fn(),
  })),
}));

jest.mock('../infrastructure/notifications/push.client', () => ({
  PushClient: jest.fn().mockImplementation(() => ({
    send: jest.fn(),
    sendReminder: jest.fn(),
  })),
}));

export function setupTestEnvironment(): void {
  beforeAll(() => {
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/lomashwood_appointment_test';
    process.env.REDIS_URL = 'redis://localhost:6379/1';
    process.env.JWT_SECRET = 'test-jwt-secret-key-for-unit-tests-only';
    process.env.KITCHEN_TEAM_EMAIL = 'kitchen-test@lomashwood.co.uk';
    process.env.BEDROOM_TEAM_EMAIL = 'bedroom-test@lomashwood.co.uk';
    process.env.ADMIN_EMAIL = 'admin-test@lomashwood.co.uk';
    process.env.APP_PORT = '3002';
  });

  beforeEach(() => {
    resetAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    jest.resetModules();
  });
}

export function setupIntegrationTestEnvironment(prisma: PrismaClient): void {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await prisma.$connect();
  });

  beforeEach(async () => {
    await prisma.$transaction([
      prisma.reminder.deleteMany(),
      prisma.booking.deleteMany(),
      prisma.slot.deleteMany(),
      prisma.availability.deleteMany(),
      prisma.consultant.deleteMany(),
      prisma.showroom.deleteMany(),
    ]);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
}

export function createTestRequest(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    headers: {
      authorization: 'Bearer test-token',
      'content-type': 'application/json',
    },
    user: {
      userId: 'test-user-id',
      email: 'test@example.com',
      role: 'CUSTOMER',
    },
    params: {},
    query: {},
    body: {},
    ...overrides,
  };
}

export function createAdminTestRequest(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return createTestRequest({
    user: {
      userId: 'test-admin-id',
      email: 'admin@lomashwood.co.uk',
      role: 'ADMIN',
    },
    ...overrides,
  });
}

// ── Typed mock response ───────────────────────────────────────────────────────

/** Mirrors the Express Response chaining contract used in controllers. */
export interface MockResponse {
  status: jest.MockedFunction<(code: number) => MockResponse>;
  json:   jest.MockedFunction<(body?: unknown) => MockResponse>;
  send:   jest.MockedFunction<(body?: unknown) => MockResponse>;
  locals: Record<string, unknown>;
}

export function createTestResponse(): {
  status: MockResponse['status'];
  json:   MockResponse['json'];
  send:   MockResponse['send'];
  res:    MockResponse;
} {
  // Build `res` first so the mocks can close over it and return it,
  // enabling the res.status(201).json(…) chaining pattern.
  const res = { locals: {} } as MockResponse;

  res.status = jest.fn().mockReturnValue(res) as MockResponse['status'];
  res.json   = jest.fn().mockReturnValue(res) as MockResponse['json'];
  res.send   = jest.fn().mockReturnValue(res) as MockResponse['send'];

  return { status: res.status, json: res.json, send: res.send, res };
}

export const testIds = {
  bookingId:      '550e8400-e29b-41d4-a716-446655440001',
  slotId:         '550e8400-e29b-41d4-a716-446655440002',
  consultantId:   '550e8400-e29b-41d4-a716-446655440003',
  showroomId:     '550e8400-e29b-41d4-a716-446655440004',
  customerId:     '550e8400-e29b-41d4-a716-446655440005',
  availabilityId: '550e8400-e29b-41d4-a716-446655440006',
  reminderId:     '550e8400-e29b-41d4-a716-446655440007',
  adminId:        '550e8400-e29b-41d4-a716-446655440008',
} as const;