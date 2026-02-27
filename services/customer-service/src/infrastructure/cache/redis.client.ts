import Redis, { RedisOptions } from 'ioredis';
import { logger } from '../../config/logger';
import { env } from '../../config/env';

const redisOptions: RedisOptions = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
  db: env.REDIS_DB ?? 0,
  maxRetriesPerRequest: 3,
  retryStrategy(times: number) {
    if (times > 10) {
      logger.error('Redis max reconnection attempts reached');
      return null;
    }
    return Math.min(times * 100, 3000);
  },
  reconnectOnError(err: Error) {
    const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
    return targetErrors.some((e) => err.message.includes(e));
  },
  enableReadyCheck: true,
  lazyConnect: false,
  keepAlive: 10000,
  connectTimeout: 10000,
  commandTimeout: 5000,
};

class RedisClient {
  private static instance: Redis | null = null;
  private static subscriber: Redis | null = null;
  private static publisher: Redis | null = null;

  static getInstance(): Redis {
    if (!RedisClient.instance) {
      RedisClient.instance = new Redis(redisOptions);
      RedisClient.attachListeners(RedisClient.instance, 'main');
    }
    return RedisClient.instance;
  }

  static getSubscriber(): Redis {
    if (!RedisClient.subscriber) {
      RedisClient.subscriber = new Redis(redisOptions);
      RedisClient.attachListeners(RedisClient.subscriber, 'subscriber');
    }
    return RedisClient.subscriber;
  }

  static getPublisher(): Redis {
    if (!RedisClient.publisher) {
      RedisClient.publisher = new Redis(redisOptions);
      RedisClient.attachListeners(RedisClient.publisher, 'publisher');
    }
    return RedisClient.publisher;
  }

  private static attachListeners(client: Redis, name: string): void {
    client.on('connect', () => logger.info(`Redis [${name}] connecting`));
    client.on('ready', () => logger.info(`Redis [${name}] ready`));
    client.on('error', (err) => logger.error({ err }, `Redis [${name}] error`));
    client.on('close', () => logger.warn(`Redis [${name}] connection closed`));
    client.on('reconnecting', () => logger.warn(`Redis [${name}] reconnecting`));
    client.on('end', () => logger.warn(`Redis [${name}] connection ended`));
  }

  static async disconnect(): Promise<void> {
    const clients = [
      RedisClient.instance,
      RedisClient.subscriber,
      RedisClient.publisher,
    ].filter(Boolean) as Redis[];

    await Promise.all(clients.map((c) => c.quit()));

    RedisClient.instance = null;
    RedisClient.subscriber = null;
    RedisClient.publisher = null;

    logger.info('Redis connections closed');
  }
}

export const redis = RedisClient.getInstance();
export const redisSubscriber = RedisClient.getSubscriber();
export const redisPublisher = RedisClient.getPublisher();
export const disconnectRedis = RedisClient.disconnect.bind(RedisClient);

export async function setCache<T>(
  key: string,
  value: T,
  ttlSeconds?: number,
): Promise<void> {
  const serialized = JSON.stringify(value);
  if (ttlSeconds) {
    await redis.setex(key, ttlSeconds, serialized);
  } else {
    await redis.set(key, serialized);
  }
}

export async function getCache<T>(key: string): Promise<T | null> {
  const value = await redis.get(key);
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export async function deleteCache(key: string): Promise<void> {
  await redis.del(key);
}

export async function deleteCacheByPattern(pattern: string): Promise<void> {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

export async function setCacheNX<T>(
  key: string,
  value: T,
  ttlSeconds: number,
): Promise<boolean> {
  const serialized = JSON.stringify(value);
  const result = await redis.set(key, serialized, 'EX', ttlSeconds, 'NX');
  return result === 'OK';
}

export async function incrementCache(
  key: string,
  ttlSeconds?: number,
): Promise<number> {
  const count = await redis.incr(key);
  if (ttlSeconds && count === 1) {
    await redis.expire(key, ttlSeconds);
  }
  return count;
}