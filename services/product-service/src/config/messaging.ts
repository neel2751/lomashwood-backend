import { env, isDevelopment, isProduction } from './env';
import { logger } from './logger';

export interface MessagingConfig {
  enabled: boolean;
  provider: 'kafka' | 'redis' | 'in-memory';
  brokers: string[];
  clientId: string;
  groupId: string;
  connectionTimeout: number;
  requestTimeout: number;
  retryAttempts: number;
  retryDelay: number;
  enableAutoCommit: boolean;
  autoCommitInterval: number;
  sessionTimeout: number;
  heartbeatInterval: number;
  maxInFlightRequests: number;
  compression: 'none' | 'gzip' | 'snappy' | 'lz4';
}

export const messagingConfig: MessagingConfig = {
  enabled: env.KAFKA_ENABLED,
  provider: env.KAFKA_ENABLED ? 'kafka' : 'in-memory',
  brokers: env.KAFKA_BROKERS ? env.KAFKA_BROKERS.split(',') : [],
  clientId: env.KAFKA_CLIENT_ID,
  groupId: env.KAFKA_GROUP_ID,
  connectionTimeout: 30000,
  requestTimeout: 30000,
  retryAttempts: 5,
  retryDelay: 1000,
  enableAutoCommit: true,
  autoCommitInterval: 5000,
  sessionTimeout: 30000,
  heartbeatInterval: 3000,
  maxInFlightRequests: 5,
  compression: 'gzip',
};

export interface TopicConfig {
  name: string;
  numPartitions: number;
  replicationFactor: number;
  retentionMs: number;
  description?: string;
}

export const topicConfigs: TopicConfig[] = [
  {
    name: 'product-events',
    numPartitions: 3,
    replicationFactor: isProduction() ? 3 : 1,
    retentionMs: 7 * 24 * 60 * 60 * 1000,
    description: 'Product lifecycle events',
  },
  {
    name: 'inventory-events',
    numPartitions: 3,
    replicationFactor: isProduction() ? 3 : 1,
    retentionMs: 7 * 24 * 60 * 60 * 1000,
    description: 'Inventory update events',
  },
  {
    name: 'pricing-events',
    numPartitions: 2,
    replicationFactor: isProduction() ? 3 : 1,
    retentionMs: 30 * 24 * 60 * 60 * 1000,
    description: 'Price change events',
  },
  {
    name: 'category-events',
    numPartitions: 1,
    replicationFactor: isProduction() ? 3 : 1,
    retentionMs: 7 * 24 * 60 * 60 * 1000,
    description: 'Category management events',
  },
  {
    name: 'colour-events',
    numPartitions: 1,
    replicationFactor: isProduction() ? 3 : 1,
    retentionMs: 7 * 24 * 60 * 60 * 1000,
    description: 'Colour management events',
  },
  {
    name: 'order-events',
    numPartitions: 5,
    replicationFactor: isProduction() ? 3 : 1,
    retentionMs: 30 * 24 * 60 * 60 * 1000,
    description: 'Order lifecycle events',
  },
  {
    name: 'analytics-events',
    numPartitions: 10,
    replicationFactor: isProduction() ? 3 : 1,
    retentionMs: 7 * 24 * 60 * 60 * 1000,
    description: 'Analytics tracking events',
  },
  {
    name: 'notification-events',
    numPartitions: 3,
    replicationFactor: isProduction() ? 3 : 1,
    retentionMs: 3 * 24 * 60 * 60 * 1000,
    description: 'Notification events',
  },
  {
    name: 'dead-letter-queue',
    numPartitions: 1,
    replicationFactor: isProduction() ? 3 : 1,
    retentionMs: 14 * 24 * 60 * 60 * 1000,
    description: 'Failed message processing',
  },
];

export interface EventSchema {
  eventType: string;
  topic: string;
  version: string;
  description: string;
  requiredFields: string[];
}

export const eventSchemas: EventSchema[] = [
  {
    eventType: 'product.created',
    topic: 'product-events',
    version: '1.0.0',
    description: 'Product created event',
    requiredFields: ['productId', 'title', 'category', 'price'],
  },
  {
    eventType: 'product.updated',
    topic: 'product-events',
    version: '1.0.0',
    description: 'Product updated event',
    requiredFields: ['productId', 'changes'],
  },
  {
    eventType: 'product.deleted',
    topic: 'product-events',
    version: '1.0.0',
    description: 'Product deleted event',
    requiredFields: ['productId'],
  },
  {
    eventType: 'inventory.updated',
    topic: 'inventory-events',
    version: '1.0.0',
    description: 'Inventory updated event',
    requiredFields: ['productId', 'stockLevel', 'availableStock'],
  },
  {
    eventType: 'price.changed',
    topic: 'pricing-events',
    version: '1.0.0',
    description: 'Price changed event',
    requiredFields: ['productId', 'oldPrice', 'newPrice'],
  },
  {
    eventType: 'category.created',
    topic: 'category-events',
    version: '1.0.0',
    description: 'Category created event',
    requiredFields: ['categoryId', 'name'],
  },
  {
    eventType: 'colour.created',
    topic: 'colour-events',
    version: '1.0.0',
    description: 'Colour created event',
    requiredFields: ['colourId', 'name', 'hexCode'],
  },
  {
    eventType: 'order.created',
    topic: 'order-events',
    version: '1.0.0',
    description: 'Order created event',
    requiredFields: ['orderId', 'items', 'totalAmount'],
  },
];

export function getTopicForEventType(eventType: string): string | undefined {
  const schema = eventSchemas.find(s => s.eventType === eventType);
  return schema?.topic;
}

export function getEventSchema(eventType: string): EventSchema | undefined {
  return eventSchemas.find(s => s.eventType === eventType);
}

export function validateEventPayload(
  eventType: string,
  payload: any
): { valid: boolean; errors: string[] } {
  const schema = getEventSchema(eventType);
  
  if (!schema) {
    return {
      valid: false,
      errors: [`No schema found for event type: ${eventType}`],
    };
  }

  const errors: string[] = [];

  for (const field of schema.requiredFields) {
    if (!(field in payload)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function getProducerConfig() {
  return {
    clientId: messagingConfig.clientId,
    brokers: messagingConfig.brokers,
    connectionTimeout: messagingConfig.connectionTimeout,
    requestTimeout: messagingConfig.requestTimeout,
    retry: {
      maxRetryTime: 30000,
      initialRetryTime: messagingConfig.retryDelay,
      retries: messagingConfig.retryAttempts,
    },
    compression: messagingConfig.compression,
  };
}

export function getConsumerConfig() {
  return {
    groupId: messagingConfig.groupId,
    sessionTimeout: messagingConfig.sessionTimeout,
    heartbeatInterval: messagingConfig.heartbeatInterval,
    maxInFlightRequests: messagingConfig.maxInFlightRequests,
    retry: {
      maxRetryTime: 30000,
      initialRetryTime: messagingConfig.retryDelay,
      retries: messagingConfig.retryAttempts,
    },
  };
}

export function validateMessagingConfiguration(): {
  valid: boolean;
  warnings: string[];
  errors: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];

  if (messagingConfig.enabled) {
    if (!messagingConfig.brokers || messagingConfig.brokers.length === 0) {
      errors.push('Kafka brokers not configured');
    }

    if (!messagingConfig.clientId) {
      errors.push('Kafka client ID not configured');
    }

    if (!messagingConfig.groupId) {
      errors.push('Kafka consumer group ID not configured');
    }

    if (messagingConfig.brokers.length === 1 && isProduction()) {
      warnings.push('Single Kafka broker configured in production');
    }

    if (messagingConfig.sessionTimeout < 10000) {
      warnings.push('Kafka session timeout is very low (<10s)');
    }

    if (messagingConfig.heartbeatInterval > messagingConfig.sessionTimeout / 3) {
      warnings.push('Kafka heartbeat interval should be less than 1/3 of session timeout');
    }
  } else {
    if (isProduction()) {
      warnings.push('Messaging is disabled in production');
    }
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors,
  };
}

export function logMessagingConfiguration(): void {
  const validation = validateMessagingConfiguration();

  logger.info('Messaging configuration loaded', {
    environment: env.NODE_ENV,
    enabled: messagingConfig.enabled,
    provider: messagingConfig.provider,
    brokers: messagingConfig.enabled ? messagingConfig.brokers.length : 0,
    clientId: messagingConfig.clientId,
    groupId: messagingConfig.groupId,
  });

  if (validation.warnings.length > 0) {
    logger.warn('Messaging configuration warnings', { warnings: validation.warnings });
  }

  if (validation.errors.length > 0) {
    logger.error('Messaging configuration errors', { errors: validation.errors });
  }

  if (isDevelopment()) {
    logger.debug('Registered topics', {
      count: topicConfigs.length,
      topics: topicConfigs.map(t => t.name),
    });

    logger.debug('Registered event schemas', {
      count: eventSchemas.length,
      eventTypes: eventSchemas.map(s => s.eventType),
    });
  }
}

export function getMessagingStats(): {
  enabled: boolean;
  provider: string;
  brokerCount: number;
  topicCount: number;
  schemaCount: number;
} {
  return {
    enabled: messagingConfig.enabled,
    provider: messagingConfig.provider,
    brokerCount: messagingConfig.brokers.length,
    topicCount: topicConfigs.length,
    schemaCount: eventSchemas.length,
  };
}

export function isMessagingEnabled(): boolean {
  return messagingConfig.enabled;
}

export function getMessagingConfig(): MessagingConfig {
  return { ...messagingConfig };
}

export function getAllTopics(): string[] {
  return topicConfigs.map(t => t.name);
}

export function getAllEventTypes(): string[] {
  return eventSchemas.map(s => s.eventType);
}

logMessagingConfiguration();