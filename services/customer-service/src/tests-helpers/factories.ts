import { randomUUID } from 'crypto';
import {
  Customer,
  CustomerProfile,
  CustomerAddress,
  SupportTicket,
  SupportMessage,
  LoyaltyAccount,
  LoyaltyTransaction,
  Review,
  TicketStatus,
  TicketPriority,
  TicketCategory,
  MessageSender,
  LoyaltyTransactionType,
  ReviewStatus,
} from '@prisma/client';

function now(): Date {
  return new Date();
}

function uuid(): string {
  return randomUUID();
}

export function createCustomerFactory(overrides: Partial<Customer> = {}): Customer {
  return {
    id: uuid(),
    userId: uuid(),
    email: `user-${uuid().slice(0, 8)}@example.com`,
    firstName: 'Test',
    lastName: 'User',
    phone: null,
    avatarUrl: null,
    isActive: true,
    deletedAt: null,
    createdAt: now(),
    updatedAt: now(),
    ...overrides,
  };
}

export function createCustomerProfileFactory(
  overrides: Partial<CustomerProfile> = {},
): CustomerProfile {
  return {
    id: uuid(),
    customerId: uuid(),
    dateOfBirth: null,
    gender: null,
    bio: null,
    preferredLanguage: 'en',
    preferredCurrency: 'GBP',
    marketingOptIn: false,
    smsOptIn: false,
    pushOptIn: false,
    createdAt: now(),
    updatedAt: now(),
    ...overrides,
  };
}

export function createCustomerAddressFactory(
  overrides: Partial<CustomerAddress> = {},
): CustomerAddress {
  return {
    id: uuid(),
    customerId: uuid(),
    label: 'Home',
    line1: '123 Test Street',
    line2: null,
    city: 'London',
    county: null,
    postcode: 'SW1A 1AA',
    country: 'GB',
    isDefault: false,
    deletedAt: null,
    createdAt: now(),
    updatedAt: now(),
    ...overrides,
  };
}

export function createSupportTicketFactory(
  overrides: Partial<SupportTicket> = {},
): SupportTicket {
  return {
    id: uuid(),
    customerId: uuid(),
    agentId: null,
    ticketRef: `TKT-${uuid().slice(0, 8).toUpperCase()}`,
    subject: 'Test support ticket',
    category: TicketCategory.GENERAL,
    priority: TicketPriority.MEDIUM,
    status: TicketStatus.OPEN,
    orderId: null,
    metadata: null,
    resolvedAt: null,
    deletedAt: null,
    createdAt: now(),
    updatedAt: now(),
    ...overrides,
  };
}

export function createSupportMessageFactory(
  overrides: Partial<SupportMessage> = {},
): SupportMessage {
  return {
    id: uuid(),
    ticketId: uuid(),
    sender: MessageSender.CUSTOMER,
    senderId: uuid(),
    body: 'Test message body',
    attachments: [],
    isInternal: false,
    createdAt: now(),
    ...overrides,
  };
}

export function createLoyaltyAccountFactory(
  overrides: Partial<LoyaltyAccount> = {},
): LoyaltyAccount {
  return {
    id: uuid(),
    customerId: uuid(),
    pointsBalance: 0,
    pointsEarned: 0,
    pointsRedeemed: 0,
    tier: 'BRONZE',
    createdAt: now(),
    updatedAt: now(),
    ...overrides,
  };
}

export function createLoyaltyTransactionFactory(
  overrides: Partial<LoyaltyTransaction> = {},
): LoyaltyTransaction {
  return {
    id: uuid(),
    accountId: uuid(),
    type: LoyaltyTransactionType.EARN,
    points: 100,
    description: 'Test earn transaction',
    reference: null,
    expiresAt: null,
    createdAt: now(),
    ...overrides,
  };
}

export function createReviewFactory(overrides: Partial<Review> = {}): Review {
  return {
    id: uuid(),
    customerId: uuid(),
    productId: uuid(),
    orderId: null,
    rating: 5,
    title: 'Great product',
    body: 'Really happy with this purchase.',
    images: [],
    status: ReviewStatus.PENDING,
    deletedAt: null,
    createdAt: now(),
    updatedAt: now(),
    ...overrides,
  };
}