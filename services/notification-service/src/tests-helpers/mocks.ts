import { jest } from '@jest/globals';

export const mockEmailService = {
  send: jest.fn().mockResolvedValue({ success: true, messageId: 'mock-email-id', provider: 'nodemailer' }),
  sendBulk: jest.fn().mockResolvedValue([]),
};

export const mockSmsService = {
  send: jest.fn().mockResolvedValue({ success: true, messageId: 'mock-sms-id', provider: 'twilio' }),
  sendBulk: jest.fn().mockResolvedValue({ successCount: 1, failureCount: 0, results: [] }),
};

export const mockPushService = {
  send: jest.fn().mockResolvedValue({ success: true, token: 'mock-token', messageId: 'mock-push-id' }),
  sendBulk: jest.fn().mockResolvedValue({ successCount: 1, failureCount: 0, results: [] }),
  sendToUser: jest.fn().mockResolvedValue({ successCount: 1, failureCount: 0, results: [] }),
  registerToken: jest.fn().mockResolvedValue(undefined),
  unregisterToken: jest.fn().mockResolvedValue(undefined),
  list: jest.fn().mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 }),
  getById: jest.fn().mockResolvedValue(null),
  checkProvidersHealth: jest.fn().mockResolvedValue({ firebase: true, webpush: true }),
};

export const mockTemplateService = {
  create: jest.fn().mockResolvedValue({}),
  update: jest.fn().mockResolvedValue({}),
  getById: jest.fn().mockResolvedValue({}),
  getBySlug: jest.fn().mockResolvedValue({}),
  list: jest.fn().mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 }),
  archive: jest.fn().mockResolvedValue({}),
  restore: jest.fn().mockResolvedValue({}),
  delete: jest.fn().mockResolvedValue(undefined),
  render: jest.fn().mockResolvedValue({ textBody: 'rendered', subject: 'subject', htmlBody: '<p>rendered</p>' }),
  listVersions: jest.fn().mockResolvedValue([]),
  getVersion: jest.fn().mockResolvedValue({}),
};

export const mockEventProducer = {
  publish: jest.fn().mockResolvedValue(undefined),
  connect: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn().mockResolvedValue(undefined),
};

export const mockEventConsumer = {
  subscribe: jest.fn(),
  subscribeToNotificationEvents: jest.fn(),
  connect: jest.fn().mockResolvedValue(undefined),
  start: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn().mockResolvedValue(undefined),
  isRunning: jest.fn().mockReturnValue(true),
};

export const mockPrisma = {
  emailNotification: {
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null),
    count: jest.fn().mockResolvedValue(0),
    deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
  },
  smsNotification: {
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null),
    count: jest.fn().mockResolvedValue(0),
    deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
  },
  pushNotification: {
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null),
    count: jest.fn().mockResolvedValue(0),
    deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
  },
  pushToken: {
    upsert: jest.fn(),
    findMany: jest.fn().mockResolvedValue([]),
    findFirst: jest.fn().mockResolvedValue(null),
    update: jest.fn(),
  },
  notificationTemplate: {
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null),
    findFirst: jest.fn().mockResolvedValue(null),
    count: jest.fn().mockResolvedValue(0),
    deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    delete: jest.fn(),
  },
  notificationTemplateVersion: {
    create: jest.fn(),
    findMany: jest.fn().mockResolvedValue([]),
    findFirst: jest.fn().mockResolvedValue(null),
    deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
  },
  $transaction: jest.fn((ops: unknown[]) => Promise.all(ops)),
  $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
};

export const mockRedis = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue('OK'),
  setEx: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
  ping: jest.fn().mockResolvedValue('PONG'),
};

export const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  http: jest.fn(),
};