import { vi, beforeEach, afterEach, afterAll } from 'vitest';

vi.mock('../infrastructure/db/prisma.client', () => ({
  prisma: {
    customer: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
    customerProfile: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    customerAddress: { findMany: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
    supportTicket: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
    supportMessage: { findMany: vi.fn(), create: vi.fn() },
    loyaltyAccount: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    loyaltyTransaction: { findMany: vi.fn(), create: vi.fn(), count: vi.fn() },
    review: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
    notificationPreference: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    $transaction: vi.fn((fn: (tx: unknown) => unknown) => fn({})),
    $queryRaw: vi.fn().mockResolvedValue([]),
    $connect: vi.fn(),
    $disconnect: vi.fn(),
  },
  connectDatabase: vi.fn(),
  disconnectDatabase: vi.fn(),
}));

vi.mock('../infrastructure/cache/redis.client', () => ({
  redis: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
    setex: vi.fn().mockResolvedValue('OK'),
    del: vi.fn().mockResolvedValue(1),
    keys: vi.fn().mockResolvedValue([]),
    incr: vi.fn().mockResolvedValue(1),
    expire: vi.fn().mockResolvedValue(1),
    ttl: vi.fn().mockResolvedValue(60),
    ping: vi.fn().mockResolvedValue('PONG'),
    on: vi.fn(),
    pipeline: vi.fn().mockReturnValue({ setex: vi.fn().mockReturnThis(), exec: vi.fn().mockResolvedValue([]) }),
  },
  redisPublisher: {
    publish: vi.fn().mockResolvedValue(1),
    pipeline: vi.fn().mockReturnValue({ publish: vi.fn().mockReturnThis(), exec: vi.fn().mockResolvedValue([]) }),
    xadd: vi.fn().mockResolvedValue('1-0'),
    on: vi.fn(),
  },
  redisSubscriber: {
    subscribe: vi.fn().mockResolvedValue(undefined),
    unsubscribe: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
  },
  setCache: vi.fn().mockResolvedValue(undefined),
  getCache: vi.fn().mockResolvedValue(null),
  deleteCache: vi.fn().mockResolvedValue(undefined),
  deleteCacheByPattern: vi.fn().mockResolvedValue(undefined),
  setCacheNX: vi.fn().mockResolvedValue(true),
  incrementCache: vi.fn().mockResolvedValue(1),
  disconnectRedis: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../infrastructure/messaging/event-producer', () => ({
  eventProducer: {
    publish: vi.fn().mockResolvedValue(undefined),
    publishBatch: vi.fn().mockResolvedValue(undefined),
    publishToStream: vi.fn().mockResolvedValue('1-0'),
  },
  EventProducer: {
    getInstance: vi.fn().mockReturnValue({
      publish: vi.fn().mockResolvedValue(undefined),
    }),
  },
}));

vi.mock('../config/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    fatal: vi.fn(),
    trace: vi.fn(),
    child: vi.fn().mockReturnValue({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      fatal: vi.fn(),
      trace: vi.fn(),
    }),
  },
  createChildLogger: vi.fn().mockReturnValue({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(() => {
  vi.resetAllMocks();
});

export function setupTestEnv(): void {
  process.env['NODE_ENV'] = 'test';
  process.env['DATABASE_URL'] = 'postgresql://test:test@localhost:5432/test';
  process.env['REDIS_HOST'] = 'localhost';
  process.env['REDIS_PORT'] = '6379';
  process.env['JWT_SECRET'] = 'test-secret-key-at-least-32-chars-long';
  process.env['PORT'] = '3004';
  process.env['LOG_LEVEL'] = 'silent';
}