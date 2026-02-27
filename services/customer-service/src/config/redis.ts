import { RedisOptions } from 'ioredis';
import { env } from './env';

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  keyPrefix: string;
  connectTimeout: number;
  commandTimeout: number;
  maxRetriesPerRequest: number;
  keepAlive: number;
}

export const redisConfig: RedisConfig = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
  db: env.REDIS_DB,
  keyPrefix: 'customer-service:',
  connectTimeout: 10000,
  commandTimeout: 5000,
  maxRetriesPerRequest: 3,
  keepAlive: 10000,
};

export function buildRedisOptions(overrides: Partial<RedisOptions> = {}): RedisOptions {
  return {
    host: redisConfig.host,
    port: redisConfig.port,
    password: redisConfig.password,
    db: redisConfig.db,
    connectTimeout: redisConfig.connectTimeout,
    commandTimeout: redisConfig.commandTimeout,
    maxRetriesPerRequest: redisConfig.maxRetriesPerRequest,
    keepAlive: redisConfig.keepAlive,
    enableReadyCheck: true,
    lazyConnect: false,
    retryStrategy(times: number) {
      if (times > 10) return null;
      return Math.min(times * 100, 3000);
    },
    reconnectOnError(err: Error) {
      return ['READONLY', 'ECONNRESET', 'ETIMEDOUT'].some((e) =>
        err.message.includes(e),
      );
    },
    ...overrides,
  };
}

export function getRedisConnectionString(): string {
  const auth = redisConfig.password ? `:${redisConfig.password}@` : '';
  return `redis://${auth}${redisConfig.host}:${redisConfig.port}/${redisConfig.db}`;
}