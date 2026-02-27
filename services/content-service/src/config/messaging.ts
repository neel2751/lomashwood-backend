import { env } from './env';
import { logger } from './logger';



export interface KafkaBrokerConfig {
  brokers: string[];
  clientId: string;
  ssl: boolean;
  sasl: KafkaSaslConfig | null;
  connectionTimeoutMs: number;
  requestTimeoutMs: number;
  retry: KafkaRetryConfig;
}

export interface KafkaSaslConfig {
  mechanism: 'plain' | 'scram-sha-256' | 'scram-sha-512';
  username: string;
  password: string;
}

export interface KafkaRetryConfig {
  initialRetryTimeMs: number;
  maxRetryTimeMs: number;
  factor: number;
  multiplier: number;
  retries: number;
}

export interface KafkaProducerConfig {
  allowAutoTopicCreation: boolean;
  transactionTimeout: number;
  
  lingerMs: number;
 
  batchSize: number;

  idempotent: boolean;

  acks: -1 | 0 | 1;
}

export interface KafkaConsumerConfig {
  groupId: string;

  fromBeginning: boolean;
  
  maxBytesPerPartition: number;

  heartbeatIntervalMs: number;
 
  sessionTimeoutMs: number;
 
  autoCommitIntervalMs: number;
}

export interface MessagingConfig {
  broker: KafkaBrokerConfig;
  producer: KafkaProducerConfig;
  consumer: KafkaConsumerConfig;
 
  deadLetterSuffix: string;

  topicPrefix: string;
}



export const messagingConfig: MessagingConfig = {
  broker: {
    brokers: env.KAFKA_BROKERS,
    clientId: env.KAFKA_CLIENT_ID,
    ssl: env.KAFKA_SSL_ENABLED,
    sasl:
      env.KAFKA_SASL_USERNAME && env.KAFKA_SASL_PASSWORD
        ? {
            mechanism: 'scram-sha-256',
            username: env.KAFKA_SASL_USERNAME,
            password: env.KAFKA_SASL_PASSWORD,
          }
        : null,
    connectionTimeoutMs: env.KAFKA_CONNECTION_TIMEOUT_MS,
    requestTimeoutMs: env.KAFKA_REQUEST_TIMEOUT_MS,
    retry: {
      initialRetryTimeMs: 100,
      maxRetryTimeMs: 30_000,
      factor: 0.2,
      multiplier: 2,
      retries: 8,
    },
  },

  producer: {
    allowAutoTopicCreation: env.NODE_ENV !== 'production',
    transactionTimeout: 30_000,
    lingerMs: 10,
    batchSize: 16_384,  
    idempotent: true,
    acks: -1,           
  },

  consumer: {
    groupId: env.KAFKA_GROUP_ID,
    fromBeginning: false,
    maxBytesPerPartition: 1_048_576,  
    heartbeatIntervalMs: 3_000,
    sessionTimeoutMs: 30_000,
    autoCommitIntervalMs: 5_000,
  },

  deadLetterSuffix: '.dlq',
  topicPrefix: 'lomash.',
};


export function buildTopicName(baseTopic: string): string {
  return `${messagingConfig.topicPrefix}${baseTopic}`;
}

export function buildDlqTopicName(topic: string): string {
  return `${topic}${messagingConfig.deadLetterSuffix}`;
}



export async function validateMessagingConnection(admin: {
  connect: () => Promise<void>;
  listTopics: () => Promise<string[]>;
  disconnect: () => Promise<void>;
}): Promise<void> {
  try {
    await admin.connect();
    const topics = await admin.listTopics();
    await admin.disconnect();

    logger.info(
      {
        brokers: messagingConfig.broker.brokers,
        topicCount: topics.length,
      },
      '[Messaging] Kafka broker connection established',
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.fatal(
      { error: message, brokers: messagingConfig.broker.brokers },
      '[Messaging] Failed to connect to Kafka brokers',
    );
    throw err;
  }
}