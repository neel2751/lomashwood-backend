import Redis from 'ioredis';

import { env } from '../../config/env';
import { logger } from '../../config/logger';

let redisInstance: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisInstance) {
    throw new Error('Redis client not initialized. Call connectRedis() first.');
  }
  return redisInstance;
}

export async function connectRedis(): Promise<void> {
  if (redisInstance) {
    return;
  }

  redisInstance = new Redis({
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD || undefined,
    db: env.REDIS_DB,
    keyPrefix: env.REDIS_KEY_PREFIX,
    retryStrategy: (times) => {
      if (times > 10) {
        logger.error('Redis max retry attempts reached');
        return null;
      }
      const delay = Math.min(times * 100, 3000);
      logger.warn({ attempt: times, delay }, 'Retrying Redis connection');
      return delay;
    },
    reconnectOnError: (err) => {
      const targetErrors = ['READONLY', 'ECONNRESET', 'ECONNREFUSED'];
      return targetErrors.some((e) => err.message.includes(e));
    },
    lazyConnect: true,
    enableReadyCheck: true,
    maxRetriesPerRequest: 3,
    connectTimeout: 10000,
    commandTimeout: 5000,
  });

  redisInstance.on('connect', () => {
    logger.info('Redis connected');
  });

  redisInstance.on('ready', () => {
    logger.info('Redis ready');
  });

  redisInstance.on('error', (err) => {
    logger.error({ error: err.message }, 'Redis error');
  });

  redisInstance.on('close', () => {
    logger.warn('Redis connection closed');
  });

  redisInstance.on('reconnecting', () => {
    logger.info('Redis reconnecting');
  });

  await redisInstance.connect();
}

export async function disconnectRedis(): Promise<void> {
  if (!redisInstance) {
    return;
  }

  await redisInstance.quit();
  redisInstance = null;
  logger.info('Redis disconnected');
}