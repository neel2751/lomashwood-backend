export { env } from './env';
export type { Env } from './env';

export { logger } from './logger';
export type { LogLevel, LogMeta, LogEntry, Logger } from './logger';

export { corsMiddleware, buildCorsConfig, corsOptions } from './cors';
export type { CorsOptions } from './cors';

export {
  createRateLimiter,
  globalRateLimit,
  bookingRateLimit,
  availabilityRateLimit,
  reminderRateLimit,
  consultantRateLimit,
  adminRateLimit,
  rateLimitConfig,
} from './rate-limit';
export type { RateLimitOptions, RateLimitStore } from './rate-limit';

export {
  databaseConfig,
  prismaClientConfig,
  onPrismaQuery,
  onPrismaWarn,
  onPrismaError,
  onPrismaInfo,
  checkDatabaseHealth,
  migrationConfig,
  seedConfig,
  databaseConnectionString,
} from './database';
export type { DatabaseConfig, DatabaseHealth } from './database';

export {
  redisConfig,
  redisConnectionOptions,
  REDIS_KEYS,
  REDIS_TTL,
  checkRedisHealth,
  buildRedisKey,
  parseRedisKey,
} from './redis';
export type { RedisConfig, RedisHealth } from './redis';

export {
  emailConfig,
  smsConfig,
  pushConfig,
  notificationTemplates,
  notificationChannelConfig,
  teamNotificationConfig,
  reminderConfig,
  notificationEventChannelMap,
} from './notifications';
export type {
  NotificationChannel,
  NotificationEvent,
  EmailProviderConfig,
  SmsProviderConfig,
  PushProviderConfig,
  NotificationTemplateConfig,
  NotificationChannelConfig,
  TeamNotificationConfig,
} from './notifications';