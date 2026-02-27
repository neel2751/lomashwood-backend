import { beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { MockPrismaClient, MockRedisClient, MockEventProducer, MockLogger } from './mocks';
import { resetAllMocks, setupMockDate, teardownMockDate, mockEnv } from './mocks';

let prismaClient: MockPrismaClient;
let redisClient: MockRedisClient;
let eventProducer: MockEventProducer;
let logger: MockLogger;
let restoreEnv: (() => void) | undefined;

export const setupTestEnvironment = () => {
  beforeAll(async () => {
    restoreEnv = mockEnv({
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      REDIS_URL: 'redis://localhost:6379',
      JWT_SECRET: 'test-secret',
      LOG_LEVEL: 'error'
    });

    prismaClient = new MockPrismaClient();
    redisClient = new MockRedisClient();
    eventProducer = new MockEventProducer();
    logger = new MockLogger();

    await prismaClient.$connect();
    await redisClient.connect();
    await eventProducer.connect();
  });

  beforeEach(() => {
    resetAllMocks();
    setupMockDate();
  });

  afterEach(() => {
    teardownMockDate();
  });

  afterAll(async () => {
    await prismaClient.$disconnect();
    await redisClient.disconnect();
    await eventProducer.disconnect();
    
    if (restoreEnv) {
      restoreEnv();
    }
  });
};

export const setupDatabaseTests = () => {
  beforeAll(async () => {
    prismaClient = new MockPrismaClient();
    await prismaClient.$connect();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await prismaClient.$disconnect();
  });
};

export const setupCacheTests = () => {
  beforeAll(async () => {
    redisClient = new MockRedisClient();
    await redisClient.connect();
  });

  beforeEach(async () => {
    await redisClient.flushall();
  });

  afterAll(async () => {
    await redisClient.disconnect();
  });
};

export const setupEventTests = () => {
  beforeAll(async () => {
    eventProducer = new MockEventProducer();
    await eventProducer.connect();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await eventProducer.disconnect();
  });
};

export const cleanDatabase = async () => {
  if (prismaClient) {
    await prismaClient.pricing.deleteMany();
    await prismaClient.inventory.deleteMany();
    await prismaClient.size.deleteMany();
    await prismaClient.colour.deleteMany();
    await prismaClient.category.deleteMany();
    await prismaClient.product.deleteMany();
  }
};

export const seedDatabase = async () => {
  const { factories } = await import('./factories');
  
  const categories = await Promise.all([
    prismaClient.category.create({ data: factories.category.createDTO() }),
    prismaClient.category.create({ data: factories.category.createDTO() })
  ]);

  const colours = await Promise.all([
    prismaClient.colour.create({ data: factories.colour.createDTO() }),
    prismaClient.colour.create({ data: factories.colour.createDTO() }),
    prismaClient.colour.create({ data: factories.colour.createDTO() })
  ]);

  const sizes = await Promise.all([
    prismaClient.size.create({ data: factories.size.createDTO() }),
    prismaClient.size.create({ data: factories.size.createDTO() })
  ]);

  const products = await Promise.all([
    prismaClient.product.create({ 
      data: factories.product.createDTO({ 
        colourIds: colours.map(c => c.id),
        sizeIds: sizes.map(s => s.id)
      }) 
    }),
    prismaClient.product.create({ 
      data: factories.product.createDTO({ 
        colourIds: colours.map(c => c.id),
        sizeIds: sizes.map(s => s.id)
      }) 
    })
  ]);

  return {
    categories,
    colours,
    sizes,
    products
  };
};

export const clearCache = async () => {
  if (redisClient) {
    await redisClient.flushall();
  }
};

export const clearEvents = () => {
  if (eventProducer) {
    jest.clearAllMocks();
  }
};

export const getTestPrismaClient = () => prismaClient;
export const getTestRedisClient = () => redisClient;
export const getTestEventProducer = () => eventProducer;
export const getTestLogger = () => logger;

export const withTransaction = async <T>(
  callback: (tx: MockPrismaClient) => Promise<T>
): Promise<T> => {
  return await prismaClient.$transaction(callback);
};

export const setupGlobalTestConfig = () => {
  jest.setTimeout(30000);
  
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'error';
  
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  };
};

export const setupIntegrationTestConfig = () => {
  jest.setTimeout(60000);
  
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'error';
};

export const setupE2ETestConfig = () => {
  jest.setTimeout(120000);
  
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'error';
};

export const expectToBeUUID = (value: string) => {
  expect(value).toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  );
};

export const expectToBeISODate = (value: string) => {
  expect(new Date(value).toISOString()).toBe(value);
};

export const expectPaginatedResponse = (response: any) => {
  expect(response).toHaveProperty('data');
  expect(response).toHaveProperty('meta');
  expect(response.meta).toHaveProperty('currentPage');
  expect(response.meta).toHaveProperty('itemsPerPage');
  expect(response.meta).toHaveProperty('totalItems');
  expect(response.meta).toHaveProperty('totalPages');
  expect(response.meta).toHaveProperty('hasNextPage');
  expect(response.meta).toHaveProperty('hasPreviousPage');
  expect(Array.isArray(response.data)).toBe(true);
};

export const expectSuccessResponse = (response: any) => {
  expect(response).toHaveProperty('success', true);
  expect(response).toHaveProperty('data');
};

export const expectErrorResponse = (response: any, statusCode?: number) => {
  expect(response).toHaveProperty('success', false);
  expect(response).toHaveProperty('error');
  expect(response.error).toHaveProperty('code');
  expect(response.error).toHaveProperty('message');
  expect(response.error).toHaveProperty('timestamp');
  
  if (statusCode) {
    expect(response.error).toHaveProperty('statusCode', statusCode);
  }
};

export const expectValidationError = (response: any) => {
  expectErrorResponse(response, 400);
  expect(response.error.code).toBe('VALIDATION_ERROR');
  expect(response.error).toHaveProperty('errors');
  expect(Array.isArray(response.error.errors)).toBe(true);
};

export const expectNotFoundError = (response: any, resourceType?: string) => {
  expectErrorResponse(response, 404);
  expect(response.error.code).toBe('NOT_FOUND');
  
  if (resourceType) {
    expect(response.error).toHaveProperty('resourceType', resourceType);
  }
};

export const createTestContext = () => {
  return {
    userId: 'test-user-id',
    correlationId: 'test-correlation-id',
    requestId: 'test-request-id',
    timestamp: new Date().toISOString()
  };
};

export const waitForAsync = async (ms: number = 100) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const runInParallel = async <T>(
  tasks: Array<() => Promise<T>>
): Promise<T[]> => {
  return await Promise.all(tasks.map(task => task()));
};

export const runSequentially = async <T>(
  tasks: Array<() => Promise<T>>
): Promise<T[]> => {
  const results: T[] = [];
  
  for (const task of tasks) {
    results.push(await task());
  }
  
  return results;
};

export const measureExecutionTime = async <T>(
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> => {
  const start = Date.now();
  const result = await fn();
  const duration = Date.now() - start;
  
  return { result, duration };
};

export const retryUntilSuccess = async <T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 100
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxAttempts) {
        await waitForAsync(delayMs * attempt);
      }
    }
  }
  
  throw lastError!;
};

export const testHelpers = {
  setup: {
    environment: setupTestEnvironment,
    database: setupDatabaseTests,
    cache: setupCacheTests,
    events: setupEventTests,
    global: setupGlobalTestConfig,
    integration: setupIntegrationTestConfig,
    e2e: setupE2ETestConfig
  },
  database: {
    clean: cleanDatabase,
    seed: seedDatabase
  },
  cache: {
    clear: clearCache
  },
  events: {
    clear: clearEvents
  },
  clients: {
    prisma: getTestPrismaClient,
    redis: getTestRedisClient,
    eventProducer: getTestEventProducer,
    logger: getTestLogger
  },
  transaction: withTransaction,
  expect: {
    uuid: expectToBeUUID,
    isoDate: expectToBeISODate,
    paginated: expectPaginatedResponse,
    success: expectSuccessResponse,
    error: expectErrorResponse,
    validation: expectValidationError,
    notFound: expectNotFoundError
  },
  context: createTestContext,
  async: {
    wait: waitForAsync,
    parallel: runInParallel,
    sequential: runSequentially,
    measure: measureExecutionTime,
    retry: retryUntilSuccess
  }
};