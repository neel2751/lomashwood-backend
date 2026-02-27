import { jest } from '@jest/globals';

export const mockPrismaOrder = {
  findUnique: jest.fn(),
  findFirst: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  updateMany: jest.fn(),
  delete: jest.fn(),
  deleteMany: jest.fn(),
  count: jest.fn(),
  upsert: jest.fn(),
  aggregate: jest.fn(),
};

export const mockPrismaPayment = {
  findUnique: jest.fn(),
  findFirst: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  updateMany: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
  upsert: jest.fn(),
};

export const mockPrismaRefund = {
  findUnique: jest.fn(),
  findFirst: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  updateMany: jest.fn(),
  count: jest.fn(),
};

export const mockPrismaInvoice = {
  findUnique: jest.fn(),
  findFirst: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  count: jest.fn(),
};

export const mockPrismaOrderItem = {
  findUnique: jest.fn(),
  findFirst: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  createMany: jest.fn(),
  update: jest.fn(),
  deleteMany: jest.fn(),
};

export const mockPrismaInventoryReservation = {
  findUnique: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  createMany: jest.fn(),
  deleteMany: jest.fn(),
};

export const mockPrismaClient = {
  order: mockPrismaOrder,
  payment: mockPrismaPayment,
  refund: mockPrismaRefund,
  invoice: mockPrismaInvoice,
  orderItem: mockPrismaOrderItem,
  inventoryReservation: mockPrismaInventoryReservation,
  $transaction: jest.fn((fn: (tx: unknown) => Promise<unknown>) => fn(mockPrismaClient)),
  $connect: jest.fn(),
  $disconnect: jest.fn(),
};

export const mockStripeClient = {
  paymentIntents: {
    create: jest.fn(),
    retrieve: jest.fn(),
    confirm: jest.fn(),
    cancel: jest.fn(),
    capture: jest.fn(),
    update: jest.fn(),
  },
  refunds: {
    create: jest.fn(),
    retrieve: jest.fn(),
    cancel: jest.fn(),
  },
  webhooks: {
    constructEvent: jest.fn(),
  },
  customers: {
    create: jest.fn(),
    retrieve: jest.fn(),
    update: jest.fn(),
  },
};

export const mockRazorpayClient = {
  orders: {
    create: jest.fn(),
    fetch: jest.fn(),
  },
  payments: {
    fetch: jest.fn(),
    capture: jest.fn(),
    refund: jest.fn(),
  },
};

export const mockRedisClient = {
  get: jest.fn(),
  set: jest.fn(),
  setex: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  expire: jest.fn(),
  ttl: jest.fn(),
  keys: jest.fn(),
  flushall: jest.fn(),
  ping: jest.fn().mockResolvedValue('PONG'),
};

export const mockEventProducer = {
  publish: jest.fn().mockResolvedValue(undefined),
  publishBatch: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn().mockResolvedValue(undefined),
};

export const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  fatal: jest.fn(),
  child: jest.fn().mockReturnThis(),
};

export const mockEmailClient = {
  sendTransactional: jest.fn().mockResolvedValue({ messageId: 'mock-message-id' }),
  sendBulk: jest.fn().mockResolvedValue([]),
};

export const mockOrderRepository = {
  findById: jest.fn(),
  findByOrderNumber: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
  count: jest.fn(),
  existsByIdempotencyKey: jest.fn(),
};

export const mockPaymentRepository = {
  findById: jest.fn(),
  findByOrderId: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  count: jest.fn(),
};

export const mockRefundRepository = {
  findById: jest.fn(),
  findByPaymentId: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  getTotalRefundedByPaymentId: jest.fn(),
};

export const mockInvoiceRepository = {
  findById: jest.fn(),
  findByOrderId: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
};

export const mockOrderService = {
  createOrder: jest.fn(),
  getOrder: jest.fn(),
  getOrders: jest.fn(),
  cancelOrder: jest.fn(),
  updateOrderStatus: jest.fn(),
};

export const mockPaymentService = {
  createPaymentIntent: jest.fn(),
  confirmPayment: jest.fn(),
  getPayment: jest.fn(),
  getPayments: jest.fn(),
};

export const mockRefundService = {
  issueRefund: jest.fn(),
  getRefund: jest.fn(),
  getRefunds: jest.fn(),
};

export const mockInvoiceService = {
  generateInvoice: jest.fn(),
  getInvoice: jest.fn(),
  getInvoices: jest.fn(),
};

export function resetAllMocks(): void {
  jest.clearAllMocks();
}

export function createMockRequest(overrides: Record<string, unknown> = {}) {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    user: null,
    ip: '127.0.0.1',
    get: jest.fn(),
    ...overrides,
  };
}

export function createMockResponse() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
  };
  return res;
}

export function createMockNext() {
  return jest.fn();
}