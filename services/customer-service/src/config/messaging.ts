import { env } from './env';

export interface MessagingConfig {
  publishRetries: number;
  publishRetryDelayMs: number;
  subscribeMaxReconnects: number;
  eventTtlSeconds: number;
  streamMaxLength: number;
  deadLetterPrefix: string;
  enabled: boolean;
}

export const messagingConfig: MessagingConfig = {
  publishRetries: 3,
  publishRetryDelayMs: 100,
  subscribeMaxReconnects: 10,
  eventTtlSeconds: 60 * 60 * 24 * 7,
  streamMaxLength: 10000,
  deadLetterPrefix: 'dlq:customer-service',
  enabled: env.NODE_ENV !== 'test',
};

export const STREAM_KEYS = {
  CUSTOMER_EVENTS: 'streams:customer-service:events',
  INBOUND_EVENTS: 'streams:customer-service:inbound',
  DEAD_LETTER: `${messagingConfig.deadLetterPrefix}:events`,
} as const;

export const CONSUMER_GROUP = {
  NAME: 'customer-service-consumers',
  CONSUMER_ID: `customer-service-${process.pid}`,
} as const;