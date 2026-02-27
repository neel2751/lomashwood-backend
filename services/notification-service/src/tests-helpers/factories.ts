import { randomUUID } from 'crypto';

export const createUser = (overrides: Record<string, unknown> = {}) => ({
  id: randomUUID(),
  email: `user-${Date.now()}@test.com`,
  firstName: 'Test',
  lastName: 'User',
  role: 'user',
  createdAt: new Date(),
  ...overrides,
});

export const createEmailNotification = (overrides: Record<string, unknown> = {}) => ({
  id: randomUUID(),
  userId: randomUUID(),
  to: 'recipient@test.com',
  subject: 'Test Email',
  htmlBody: '<p>Hello</p>',
  textBody: 'Hello',
  provider: 'nodemailer',
  status: 'SENT',
  messageId: `msg-${randomUUID()}`,
  retryCount: 0,
  sentAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createSmsNotification = (overrides: Record<string, unknown> = {}) => ({
  id: randomUUID(),
  userId: randomUUID(),
  to: '+447700000000',
  body: 'Test SMS message',
  provider: 'twilio',
  status: 'SENT',
  messageId: `SM${randomUUID().replace(/-/g, '')}`,
  retryCount: 0,
  sentAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createPushNotification = (overrides: Record<string, unknown> = {}) => ({
  id: randomUUID(),
  userId: randomUUID(),
  token: `token-${randomUUID()}`,
  provider: 'firebase',
  title: 'Test Push',
  body: 'Test push notification body',
  data: {},
  status: 'SENT',
  priority: 'NORMAL',
  providerId: `projects/test/messages/${randomUUID()}`,
  retryCount: 0,
  sentAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createTemplate = (overrides: Record<string, unknown> = {}) => ({
  id: randomUUID(),
  name: 'Test Template',
  slug: `test-template-${Date.now()}`,
  channel: 'EMAIL',
  category: 'TRANSACTIONAL',
  status: 'ACTIVE',
  subject: 'Hello {{firstName}}',
  htmlBody: '<p>Hello {{firstName}}</p>',
  textBody: 'Hello {{firstName}}',
  title: null,
  variables: [{ key: 'firstName', description: 'First name', required: true }],
  metadata: {},
  version: 1,
  createdBy: randomUUID(),
  updatedBy: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createBookingCreatedPayload = (overrides: Record<string, unknown> = {}) => ({
  bookingId: randomUUID(),
  userId: randomUUID(),
  customerEmail: 'customer@test.com',
  customerPhone: '+447700000001',
  appointmentType: 'HOME_MEASUREMENT',
  isKitchen: true,
  isBedroom: false,
  scheduledAt: new Date(Date.now() + 86_400_000).toISOString(),
  createdAt: new Date().toISOString(),
  ...overrides,
});