

export { env } from './env';
export type { Env } from './env';

export { logger, createLogger } from './logger';

export { corsMiddleware, adminCorsMiddleware } from './cors';

export {
  rateLimitMiddleware,
  writeRateLimitMiddleware,
  adminRateLimitMiddleware,
  publicReadRateLimitMiddleware,
  uploadRateLimitMiddleware,
  createRedisRateLimiter,
} from './rate-limit';

export {
  databaseConfig,
  prismaLogLevels,
  attachSlowQueryMonitor,
  validateDatabaseConnection,
} from './database';
export type { DatabaseConfig, PrismaLogLevel } from './database';

export {
  storageConfig,
  buildS3Key,
  resolvePublicUrl,
  isAllowedMimeType,
  isImageMimeType,
  isVideoMimeType,
  validateStorageConnection,
} from './storage';
export type { StorageConfig, S3Config, CdnConfig } from './storage';

export {
  messagingConfig,
  buildTopicName,
  buildDlqTopicName,
  validateMessagingConnection,
} from './messaging';
export type {
  MessagingConfig,
  KafkaBrokerConfig,
  KafkaProducerConfig,
  KafkaConsumerConfig,
  KafkaSaslConfig,
  KafkaRetryConfig,
} from './messaging';



import { env } from './env';
import { databaseConfig } from './database';
import { storageConfig } from './storage';
import { messagingConfig } from './messaging';

export const config = {
  env,
  database: databaseConfig,
  storage: storageConfig,
  messaging: messagingConfig,
} as const;

export type Config = typeof config;