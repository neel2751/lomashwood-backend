import Redis, { RedisOptions, Redis as RedisInstance } from 'ioredis';
import { logger } from '../../../config/logger';

const globalForRedis = globalThis as unknown as {
  redis: RedisInstance | undefined;
};

function buildRedisOptions(): RedisOptions {
  return {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    password: process.env.REDIS_PASSWORD ?? undefined,
    db: parseInt(process.env.REDIS_DB ?? '0', 10),
    tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
    connectTimeout: 10000,
    commandTimeout: 5000,
    maxRetriesPerRequest: 3,
    retryStrategy(times: number): number | null {
      if (times > 10) {
        logger.error({ message: 'Redis max reconnection attempts reached' });
        return null;
      }
      const delay = Math.min(times * 100, 3000);
      logger.warn({ message: 'Redis reconnecting', attempt: times, delay });
      return delay;
    },
    lazyConnect: true,
    enableReadyCheck: true,
    enableOfflineQueue: true,
    keyPrefix: process.env.REDIS_KEY_PREFIX ?? 'lomash:',
  };
}

function createRedisClient(): RedisInstance {
  const client = new Redis(buildRedisOptions());

  client.on('connect', () => {
    logger.info({ message: 'Redis connecting' });
  });

  client.on('ready', () => {
    logger.info({ message: 'Redis connection ready' });
  });

  client.on('error', (error: Error) => {
    logger.error({ message: 'Redis error', error: error.message });
  });

  client.on('close', () => {
    logger.warn({ message: 'Redis connection closed' });
  });

  client.on('reconnecting', (delay: number) => {
    logger.warn({ message: 'Redis reconnecting', delay });
  });

  client.on('end', () => {
    logger.warn({ message: 'Redis connection ended' });
  });

  return client;
}

export const redis: RedisInstance =
  globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}

export async function connectRedis(): Promise<void> {
  try {
    await redis.connect();
    logger.info({ message: 'Redis connected successfully' });
  } catch (error) {
    logger.error({ message: 'Redis connection failed', error });
    throw error;
  }
}

export async function disconnectRedis(): Promise<void> {
  try {
    await redis.quit();
    logger.info({ message: 'Redis disconnected successfully' });
  } catch (error) {
    logger.error({ message: 'Redis disconnection failed', error });
    throw error;
  }
}

export async function get<T>(key: string): Promise<T | null> {
  try {
    const value = await redis.get(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  } catch (error) {
    logger.error({ message: 'Redis GET failed', key, error });
    return null;
  }
}

export async function set<T>(
  key: string,
  value: T,
  ttlSeconds?: number,
): Promise<void> {
  try {
    const serialized = JSON.stringify(value);
    if (ttlSeconds) {
      await redis.setex(key, ttlSeconds, serialized);
    } else {
      await redis.set(key, serialized);
    }
  } catch (error) {
    logger.error({ message: 'Redis SET failed', key, error });
  }
}

export async function del(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (error) {
    logger.error({ message: 'Redis DEL failed', key, error });
  }
}

export async function delMany(keys: string[]): Promise<void> {
  if (!keys.length) return;
  try {
    await redis.del(...keys);
  } catch (error) {
    logger.error({ message: 'Redis DEL many failed', keys, error });
  }
}

export async function exists(key: string): Promise<boolean> {
  try {
    const count = await redis.exists(key);
    return count > 0;
  } catch (error) {
    logger.error({ message: 'Redis EXISTS failed', key, error });
    return false;
  }
}

export async function expire(key: string, ttlSeconds: number): Promise<void> {
  try {
    await redis.expire(key, ttlSeconds);
  } catch (error) {
    logger.error({ message: 'Redis EXPIRE failed', key, error });
  }
}

export async function ttl(key: string): Promise<number> {
  try {
    return await redis.ttl(key);
  } catch (error) {
    logger.error({ message: 'Redis TTL failed', key, error });
    return -1;
  }
}

export async function scanKeys(pattern: string): Promise<string[]> {
  const keys: string[] = [];
  let cursor = '0';

  try {
    do {
      const [nextCursor, found] = await redis.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100,
      );
      cursor = nextCursor;
      keys.push(...found);
    } while (cursor !== '0');
  } catch (error) {
    logger.error({ message: 'Redis SCAN failed', pattern, error });
  }

  return keys;
}

export async function delByPattern(pattern: string): Promise<void> {
  try {
    const keys = await scanKeys(pattern);
    if (keys.length > 0) {
      await delMany(keys);
    }
  } catch (error) {
    logger.error({ message: 'Redis DEL by pattern failed', pattern, error });
  }
}

export async function getOrSet<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number,
): Promise<T> {
  const cached = await get<T>(key);
  if (cached !== null) return cached;

  const fresh = await fetcher();
  await set(key, fresh, ttlSeconds);
  return fresh;
}

export async function invalidate(key: string): Promise<void> {
  await del(key);
}

export async function invalidateMany(keys: string[]): Promise<void> {
  await delMany(keys);
}

export async function increment(
  key: string,
  by: number = 1,
): Promise<number> {
  try {
    return await redis.incrby(key, by);
  } catch (error) {
    logger.error({ message: 'Redis INCRBY failed', key, error });
    return 0;
  }
}

export async function hset<T extends Record<string, unknown>>(
  key: string,
  data: T,
): Promise<void> {
  try {
    const flat: Record<string, string> = {};
    for (const [field, val] of Object.entries(data)) {
      flat[field] = JSON.stringify(val);
    }
    await redis.hset(key, flat);
  } catch (error) {
    logger.error({ message: 'Redis HSET failed', key, error });
  }
}

export async function hget<T>(
  key: string,
  field: string,
): Promise<T | null> {
  try {
    const value = await redis.hget(key, field);
    if (!value) return null;
    return JSON.parse(value) as T;
  } catch (error) {
    logger.error({ message: 'Redis HGET failed', key, field, error });
    return null;
  }
}

export async function hgetall<T extends Record<string, unknown>>(
  key: string,
): Promise<T | null> {
  try {
    const data = await redis.hgetall(key);
    if (!data || !Object.keys(data).length) return null;
    const result: Record<string, unknown> = {};
    for (const [field, val] of Object.entries(data)) {
      result[field] = JSON.parse(val);
    }
    return result as T;
  } catch (error) {
    logger.error({ message: 'Redis HGETALL failed', key, error });
    return null;
  }
}

export default redis;