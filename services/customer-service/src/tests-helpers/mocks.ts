import { vi } from 'vitest';
import type { PrismaClient } from '@prisma/client';
import type { LoyaltyRepository } from '../app/loyalty/loyalty.repository';
import type { LoyaltyService } from '../app/loyalty/loyalty.service';
import type { SupportService } from '../app/support/support.service';
import { createLoyaltyAccountFactory, createLoyaltyTransactionFactory } from './factories';

export function createMockPrismaClient(): Record<string, unknown> {
  return {
    customer: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    customerProfile: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    customerAddress: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
    },
    supportTicket: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    supportMessage: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    loyaltyAccount: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    loyaltyTransaction: {
      findMany: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
    review: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    notificationPreference: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn((fn: (tx: unknown) => unknown) => fn(createMockPrismaClient())),
    $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
    $connect: vi.fn().mockResolvedValue(undefined),
    $disconnect: vi.fn().mockResolvedValue(undefined),
  } as unknown as PrismaClient;
}

export function createMockLoyaltyRepository(): jest.Mocked<LoyaltyRepository> {
  const account = createLoyaltyAccountFactory();
  const transaction = createLoyaltyTransactionFactory({ accountId: account.id });

  return {
    findAccountByCustomerId: vi.fn().mockResolvedValue(account),
    findAccountById: vi.fn().mockResolvedValue(account),
    createAccount: vi.fn().mockResolvedValue(account),
    earnPoints: vi.fn().mockResolvedValue({ account, transaction }),
    redeemPoints: vi.fn().mockResolvedValue({ account, transaction }),
    adjustPoints: vi.fn().mockResolvedValue({ account, transaction }),
    expirePoints: vi.fn().mockResolvedValue({ account, transaction }),
    findTransactions: vi.fn().mockResolvedValue({ data: [transaction], total: 1 }),
    findExpiringTransactions: vi.fn().mockResolvedValue([transaction]),
  } as unknown as jest.Mocked<LoyaltyRepository>;
}

export function createMockLoyaltyService(): jest.Mocked<LoyaltyService> {
  const account = createLoyaltyAccountFactory();
  const transaction = createLoyaltyTransactionFactory({ accountId: account.id });

  return {
    getOrCreateAccount: vi.fn().mockResolvedValue(account),
    getAccount: vi.fn().mockResolvedValue(account),
    earnPoints: vi.fn().mockResolvedValue({ account, transaction }),
    redeemPoints: vi.fn().mockResolvedValue({ account, transaction }),
    adjustPoints: vi.fn().mockResolvedValue({ account, transaction }),
    getTransactions: vi.fn().mockResolvedValue({
      data: [transaction],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    }),
    expirePoints: vi.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<LoyaltyService>;
}

export function createMockSupportService(): jest.Mocked<SupportService> {
  return {
    createTicket: vi.fn(),
    getMyTickets: vi.fn(),
    getTicketById: vi.fn(),
    updateTicket: vi.fn(),
    closeTicket: vi.fn(),
    addMessage: vi.fn(),
    getMessages: vi.fn(),
    getAllTickets: vi.fn(),
    assignTicket: vi.fn(),
    updateTicketStatus: vi.fn(),
    deleteTicket: vi.fn(),
  } as unknown as jest.Mocked<SupportService>;
}

export function createMockRedis(): Record<string, ReturnType<typeof vi.fn>> {
  return {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
    setex: vi.fn().mockResolvedValue('OK'),
    del: vi.fn().mockResolvedValue(1),
    keys: vi.fn().mockResolvedValue([]),
    incr: vi.fn().mockResolvedValue(1),
    expire: vi.fn().mockResolvedValue(1),
    ttl: vi.fn().mockResolvedValue(60),
    ping: vi.fn().mockResolvedValue('PONG'),
    quit: vi.fn().mockResolvedValue('OK'),
    publish: vi.fn().mockResolvedValue(1),
    subscribe: vi.fn().mockResolvedValue(undefined),
    unsubscribe: vi.fn().mockResolvedValue(undefined),
    pipeline: vi.fn().mockReturnValue({
      setex: vi.fn().mockReturnThis(),
      del: vi.fn().mockReturnThis(),
      publish: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([]),
    }),
    on: vi.fn(),
  };
}

export function createMockEventProducer(): Record<string, ReturnType<typeof vi.fn>> {
  return {
    publish: vi.fn().mockResolvedValue(undefined),
    publishBatch: vi.fn().mockResolvedValue(undefined),
    publishToStream: vi.fn().mockResolvedValue('1-0'),
  };
}

export function createMockRequest(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    user: { id: 'customer-123', userId: 'user-123', email: 'test@example.com', role: 'customer' },
    params: {},
    query: {},
    body: {},
    headers: {},
    requestId: 'req-123',
    ip: '127.0.0.1',
    ...overrides,
  };
}

export function createMockResponse(): {
  status: ReturnType<typeof vi.fn>;
  json: ReturnType<typeof vi.fn>;
  send: ReturnType<typeof vi.fn>;
} {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  };
  return res;
}