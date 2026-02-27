import { CustomerEventTopic } from './event-topics';

export interface EventMetadata {
  eventId: string;
  topic: CustomerEventTopic;
  version: string;
  timestamp: string;
  source: string;
  correlationId?: string;
  causationId?: string;
  userId?: string;
  customerId?: string;
  traceId?: string;
}

export interface DomainEvent<T = Record<string, unknown>> {
  metadata: EventMetadata;
  payload: T;
}

export function buildEventMetadata(
  topic: CustomerEventTopic,
  options: Partial<Pick<EventMetadata, 'correlationId' | 'causationId' | 'userId' | 'customerId' | 'traceId'>> = {},
): EventMetadata {
  return {
    eventId: crypto.randomUUID(),
    topic,
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    source: 'customer-service',
    ...options,
  };
}

export function buildDomainEvent<T>(
  topic: CustomerEventTopic,
  payload: T,
  options: Partial<Pick<EventMetadata, 'correlationId' | 'causationId' | 'userId' | 'customerId' | 'traceId'>> = {},
): DomainEvent<T> {
  return {
    metadata: buildEventMetadata(topic, options),
    payload,
  };
}

export interface ProfileUpdatedPayload {
  customerId: string;
  updatedFields: string[];
  updatedAt: string;
}

export interface ReviewCreatedPayload {
  reviewId: string;
  customerId: string;
  productId: string;
  rating: number;
  status: string;
  createdAt: string;
}

export interface SupportTicketCreatedPayload {
  ticketId: string;
  ticketRef: string;
  customerId: string;
  category: string;
  priority: string;
  subject: string;
  createdAt: string;
}

export interface SupportTicketUpdatedPayload {
  ticketId: string;
  ticketRef: string;
  customerId: string;
  status: string;
  agentId?: string;
  updatedAt: string;
}

export interface SupportMessageAddedPayload {
  messageId: string;
  ticketId: string;
  ticketRef: string;
  customerId: string;
  sender: string;
  isInternal: boolean;
  createdAt: string;
}

export interface LoyaltyPointsEarnedPayload {
  accountId: string;
  customerId: string;
  transactionId: string;
  points: number;
  newBalance: number;
  tier: string;
  description: string;
  reference?: string;
  expiresAt?: string;
}

export interface LoyaltyPointsRedeemedPayload {
  accountId: string;
  customerId: string;
  transactionId: string;
  points: number;
  newBalance: number;
  description: string;
  reference?: string;
}

export interface LoyaltyTierUpgradedPayload {
  accountId: string;
  customerId: string;
  previousTier: string;
  newTier: string;
  pointsEarned: number;
  upgradedAt: string;
}

export interface ReferralCreatedPayload {
  referralId: string;
  referrerId: string;
  referralCode: string;
  createdAt: string;
}

export interface ReferralCompletedPayload {
  referralId: string;
  referrerId: string;
  referredId: string;
  referralCode: string;
  completedAt: string;
}