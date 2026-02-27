import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { config } from 'dotenv';

config({ path: '.env.test' });

let testPrisma: PrismaClient;
let redis: Redis;

export const setupTestDatabase = async (): Promise<PrismaClient> => {
  if (!testPrisma) {
    testPrisma = new PrismaClient();
    await testPrisma.$connect();
  }
  return testPrisma;
};

export const setupTestRedis = async (): Promise<Redis> => {
  if (!redis) {
    redis = new Redis({
      host: process.env['REDIS_HOST_TEST'] || 'localhost',
      port: parseInt(process.env['REDIS_PORT_TEST'] || '6379'),
      db: parseInt(process.env['REDIS_DB_TEST'] || '1'),
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        if (times > 3) return null;
        return Math.min(times * 50, 2000);
      },
    });
    await redis.ping();
  }
  return redis;
};

export const cleanupTestDatabase = async (): Promise<void> => {
  if (!testPrisma) return;

  const tablenames = await testPrisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname='public'
  `;

  const tables = tablenames
    .map(({ tablename }: { tablename: string }) => tablename)
    .filter((name: string) => name !== '_prisma_migrations')
    .map((name: string) => `"public"."${name}"`)
    .join(', ');

  try {
    await testPrisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
  } catch (error) {
    console.error('Error truncating tables:', error);
  }
};

export const cleanupTestRedis = async (): Promise<void> => {
  if (!redis) return;
  try {
    await redis.flushdb();
  } catch (error) {
    console.error('Error flushing Redis:', error);
  }
};

export const teardownTestDatabase = async (): Promise<void> => {
  if (testPrisma) {
    await testPrisma.$disconnect();
    testPrisma = null as unknown as PrismaClient;
  }
};

export const teardownTestRedis = async (): Promise<void> => {
  if (redis) {
    await redis.quit();
    redis = null as unknown as Redis;
  }
};

export const resetTestEnvironment = async (): Promise<void> => {
  await cleanupTestDatabase();
  await cleanupTestRedis();
};

export const seedTestData = async () => {
  const prismaClient = await setupTestDatabase();

  await (prismaClient.role as any).createMany({
    data: [
      {
        name: 'SUPER_ADMIN',
        description: 'Super Administrator with full access',
        permissions: ['*'],
      },
      {
        name: 'ADMIN',
        description: 'Administrator with management access',
        permissions: [
          'user:read',
          'user:write',
          'user:delete',
          'role:read',
          'role:write',
          'session:read',
          'session:write',
          'session:delete',
        ],
      },
      {
        name: 'MANAGER',
        description: 'Manager with limited administrative access',
        permissions: ['user:read', 'user:write', 'session:read'],
      },
      {
        name: 'STAFF',
        description: 'Staff member with basic access',
        permissions: ['user:read', 'session:read'],
      },
      {
        name: 'CUSTOMER',
        description: 'Customer with limited access',
        permissions: ['user:read'],
      },
      {
        name: 'GUEST',
        description: 'Guest with minimal access',
        permissions: [],
      },
    ],
    skipDuplicates: true,
  });
};

export const createTestUser = async (data: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  roleName?: string;
  emailVerified?: boolean;
}) => {
  const prismaClient = await setupTestDatabase();

  const role = data.roleName
    ? await prismaClient.role.findFirst({ where: { name: data.roleName } })
    : await prismaClient.role.findFirst({ where: { name: 'CUSTOMER' } });

  return prismaClient.user.create({
    data: {
      email: data.email,
      password: data.password,
      firstName: data.firstName ?? null,
      lastName: data.lastName ?? null,
      ...(role ? { roleId: role.id } : {}),
      isActive: true,

      emailVerifiedAt: (data.emailVerified ?? true) ? new Date() : null,
    } as any,
  });
};

export const createTestSession = async (data: {
  userId: string;
  token: string;
  refreshToken?: string;
  expiresAt?: Date;
}) => {
  const prismaClient = await setupTestDatabase();

  return prismaClient.session.create({
    data: {
      userId: data.userId,
      token: data.token,
      expiresAt: data.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      lastActivityAt: new Date(),
    } as any
  });
};

export const waitForCondition = async (
  condition: () => boolean | Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> => {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) return;
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error('Condition not met within timeout');
};

export const createTestContext = () => {
  let cleanup: Array<() => Promise<void>> = [];

  const addCleanup = (fn: () => Promise<void>) => {
    cleanup.push(fn);
  };

  const runCleanup = async () => {
    for (const fn of cleanup.reverse()) {
      await fn();
    }
    cleanup = [];
  };

  return { addCleanup, runCleanup };
};

export const mockDate = (date: Date | string) => {
  const mockedDate = new Date(date);
  const RealDate = Date;

  class MockDate extends RealDate {
    constructor();
    constructor(value: number | string | Date);
    constructor(
      year: number,
      month: number,
      date?: number,
      hours?: number,
      minutes?: number,
      seconds?: number,
      ms?: number
    );
    constructor(...args: unknown[]) {
      if (args.length === 0) {
        super(mockedDate.getTime());
      } else if (args.length === 1) {
        super(args[0] as number | string | Date);
      } else {
        super(
          args[0] as number,
          args[1] as number,
          args[2] as number | undefined,
          args[3] as number | undefined,
          args[4] as number | undefined,
          args[5] as number | undefined,
          args[6] as number | undefined
        );
      }
    }

    static override now() {
      return mockedDate.getTime();
    }
  }

  global.Date = MockDate as unknown as typeof Date;

  return () => {
    global.Date = RealDate;
  };
};

export const setupTestEnvironment = async () => {
  await setupTestDatabase();
  await setupTestRedis();
  await resetTestEnvironment();
  await seedTestData();
};

export const teardownTestEnvironment = async () => {
  await resetTestEnvironment();
  await teardownTestDatabase();
  await teardownTestRedis();
};

beforeAll(async () => {
  process.env['NODE_ENV'] = 'test';
  process.env['LOG_LEVEL'] = 'error';
});

afterAll(async () => {
  await teardownTestEnvironment();
});

beforeEach(async () => {
  jest.clearAllMocks();
});

export const testConfig = {
  database: {
    url: process.env['DATABASE_URL_TEST'] || process.env['DATABASE_URL'],
  },
  redis: {
    host: process.env['REDIS_HOST_TEST'] || 'localhost',
    port: parseInt(process.env['REDIS_PORT_TEST'] || '6379'),
    db: parseInt(process.env['REDIS_DB_TEST'] || '1'),
  },
  jwt: {
    secret: process.env['JWT_SECRET_TEST'] || 'test-secret-key',
    accessTokenExpiry: '15m',
    refreshTokenExpiry: '7d',
  },
  email: {
    from: process.env['EMAIL_FROM_TEST'] || 'test@example.com',
    enabled: false,
  },
  app: {
    port: parseInt(process.env['PORT_TEST'] || '3001'),
    env: 'test',
  },
};

export default {
  setupTestDatabase,
  setupTestRedis,
  cleanupTestDatabase,
  cleanupTestRedis,
  teardownTestDatabase,
  teardownTestRedis,
  resetTestEnvironment,
  seedTestData,
  createTestUser,
  createTestSession,
  waitForCondition,
  createTestContext,
  mockDate,
  setupTestEnvironment,
  teardownTestEnvironment,
  testConfig,
};