import { createClient, RedisClientType } from 'redis';
import { logger } from '../../config/logger';
import { env } from '../../config/env';

type RedisClient = RedisClientType;

const createRedisClient = (): RedisClient => {
  const client = createClient({
    url: env.REDIS_URL,
    socket: {
      connectTimeout: 10000,
      reconnectStrategy: (retries: number) => {
        if (retries > 10) {
          logger.error({
            message: 'Redis max reconnection attempts reached',
            retries,
          });
          return new Error('Redis max reconnection attempts reached');
        }

        const delay = Math.min(retries * 100, 3000);
        logger.warn({
          message: 'Redis reconnecting',
          retries,
          delay: `${delay}ms`,
        });

        return delay;
      },
    },
  }) as RedisClient;

  client.on('connect', () => {
    logger.info({ message: 'Redis client connecting' });
  });

  client.on('ready', () => {
    logger.info({ message: 'Redis client ready' });
  });

  client.on('error', (error: Error) => {
    logger.error({
      message: 'Redis client error',
      error: error.message,
    });
  });

  client.on('end', () => {
    logger.info({ message: 'Redis client connection ended' });
  });

  client.on('reconnecting', () => {
    logger.warn({ message: 'Redis client reconnecting' });
  });

  return client;
};

export const redisClient = createRedisClient();

export const connectRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
    logger.info({ message: 'Redis connected successfully' });
  } catch (error) {
    logger.error({
      message: 'Failed to connect to Redis',
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

export const disconnectRedis = async (): Promise<void> => {
  try {
    await redisClient.quit();
    logger.info({ message: 'Redis disconnected successfully' });
  } catch (error) {
    logger.error({
      message: 'Failed to disconnect from Redis',
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

export const flushCache = async (): Promise<void> => {
  if (env.NODE_ENV === 'production') {
    logger.error({ message: 'Cache flush attempted in production environment' });
    throw new Error('Cache flush is not allowed in production');
  }

  await redisClient.flushAll();
  logger.warn({ message: 'Redis cache flushed', environment: env.NODE_ENV });
};

export const getCacheStats = async (): Promise<Record<string, string>> => {
  const info = await redisClient.info();
  const stats: Record<string, string> = {};

  info.split('\r\n').forEach((line) => {
    const [key, value] = line.split(':');
    if (key && value) {
      stats[key.trim()] = value.trim();
    }
  });

  return stats;
};
export const redis = redisClient;
export const setWithExpiry = async (
  key: string,
  value: string,
  ttlSeconds: number,
): Promise<void> => {
  await redisClient.setEx(key, ttlSeconds, value);
};

export const getOrSet = async <T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number,
): Promise<T> => {
  const cached = await redisClient.get(key);
  if (cached) {
    return JSON.parse(cached) as T;
  }

  const value = await fetcher();
  await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
  return value;
};

export const deletePattern = async (pattern: string): Promise<number> => {
  const keys = await redisClient.keys(pattern);
  if (keys.length === 0) return 0;

  const deleted = await redisClient.del(keys);
  logger.debug({
    message: 'Cache keys deleted by pattern',
    pattern,
    count: deleted,
  });

  return deleted;
};

export const incrementWithExpiry = async (
  key: string,
  ttlSeconds: number,
): Promise<number> => {
  const value = await redisClient.incr(key);
  if (value === 1) {
    await redisClient.expire(key, ttlSeconds);
  }
  return value;
};