import Redis, { RedisOptions, ChainableCommander } from 'ioredis';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

const RECONNECT_DELAY_MS = 2000;
const MAX_RECONNECT_ATTEMPTS = 10;
const CONNECT_TIMEOUT_MS = 10000;
const COMMAND_TIMEOUT_MS = 5000;

function buildRedisOptions(): RedisOptions {
  return {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD || undefined,
    db: env.REDIS_DB ?? 0,
    tls: env.REDIS_TLS_ENABLED ? {} : undefined,
    connectTimeout: CONNECT_TIMEOUT_MS,
    commandTimeout: COMMAND_TIMEOUT_MS,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    enableOfflineQueue: true,
    lazyConnect: true,
    retryStrategy(times: number): number | null {
      if (times > MAX_RECONNECT_ATTEMPTS) {
        logger.error('Redis max reconnect attempts reached — giving up', { attempts: times });
        return null;
      }
      const delay = Math.min(times * RECONNECT_DELAY_MS, 10000);
      logger.warn('Redis reconnecting', { attempt: times, delayMs: delay });
      return delay;
    },
    reconnectOnError(error: Error): boolean {
      const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
      return targetErrors.some((e) => error.message.includes(e));
    },
  };
}

function createRedisClient(name: string): Redis {
  const options = buildRedisOptions();
  const client = new Redis(options);

  client.on('connect', () => {
    logger.info(`Redis ${name} client connecting`);
  });

  client.on('ready', () => {
    logger.info(`Redis ${name} client ready`);
  });

  client.on('error', (error: Error) => {
    logger.error(`Redis ${name} client error`, { error: error.message });
  });

  client.on('close', () => {
    logger.warn(`Redis ${name} client connection closed`);
  });

  client.on('reconnecting', (delay: number) => {
    logger.warn(`Redis ${name} client reconnecting`, { delayMs: delay });
  });

  client.on('end', () => {
    logger.warn(`Redis ${name} client connection ended`);
  });

  return client;
}

export const redisClient: Redis = createRedisClient('primary');
export const redisSubscriber: Redis = createRedisClient('subscriber');

export async function connectRedis(): Promise<void> {
  try {
    await redisClient.connect();
    logger.info('Redis primary client connected');
  } catch (error) {
    logger.error('Failed to connect Redis primary client', { error });
    throw error;
  }
}

export async function disconnectRedis(): Promise<void> {
  try {
    await Promise.all([
      redisClient.quit(),
      redisSubscriber.quit(),
    ]);
    logger.info('Redis clients disconnected');
  } catch (error) {
    logger.error('Failed to disconnect Redis clients', { error });
    throw error;
  }
}

export async function checkRedisHealth(): Promise<boolean> {
  try {
    const pong = await redisClient.ping();
    return pong === 'PONG';
  } catch (error) {
    logger.error('Redis health check failed', { error });
    return false;
  }
}

export class RedisService {
  constructor(private readonly client: Redis = redisClient) {}

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds !== undefined) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async setNX(key: string, value: string, ttlSeconds: number): Promise<boolean> {
    const result = await this.client.set(key, value, 'EX', ttlSeconds, 'NX');
    return result === 'OK';
  }

  async del(...keys: string[]): Promise<number> {
    return this.client.del(...keys);
  }

  async exists(...keys: string[]): Promise<number> {
    return this.client.exists(...keys);
  }

  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    const result = await this.client.expire(key, ttlSeconds);
    return result === 1;
  }

  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }

  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  async incrBy(key: string, increment: number): Promise<number> {
    return this.client.incrby(key, increment);
  }

  async hSet(key: string, field: string, value: string): Promise<number> {
    return this.client.hset(key, field, value);
  }

  async hGet(key: string, field: string): Promise<string | null> {
    return this.client.hget(key, field);
  }

  async hGetAll(key: string): Promise<Record<string, string>> {
    return this.client.hgetall(key);
  }

  async hDel(key: string, ...fields: string[]): Promise<number> {
    return this.client.hdel(key, ...fields);
  }

  async lPush(key: string, ...values: string[]): Promise<number> {
    return this.client.lpush(key, ...values);
  }

  async rPop(key: string): Promise<string | null> {
    return this.client.rpop(key);
  }

  async lRange(key: string, start: number, stop: number): Promise<string[]> {
    return this.client.lrange(key, start, stop);
  }

  async sAdd(key: string, ...members: string[]): Promise<number> {
    return this.client.sadd(key, ...members);
  }

  async sRem(key: string, ...members: string[]): Promise<number> {
    return this.client.srem(key, ...members);
  }

  async sIsMember(key: string, member: string): Promise<boolean> {
    const result = await this.client.sismember(key, member);
    return result === 1;
  }

  async sMembers(key: string): Promise<string[]> {
    return this.client.smembers(key);
  }

  async keys(pattern: string): Promise<string[]> {
    return this.client.keys(pattern);
  }

  async scan(
    pattern: string,
    count: number = 100,
  ): Promise<string[]> {
    const keys: string[] = [];
    let cursor = '0';

    do {
      const [nextCursor, batch] = await this.client.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        count,
      );
      cursor = nextCursor;
      keys.push(...batch);
    } while (cursor !== '0');

    return keys;
  }

  async deleteByPattern(pattern: string): Promise<number> {
    const keys = await this.scan(pattern);
    if (keys.length === 0) return 0;
    return this.client.del(...keys);
  }

  async getJson<T>(key: string): Promise<T | null> {
    const raw = await this.client.get(key);
    if (raw === null) return null;

    try {
      return JSON.parse(raw) as T;
    } catch {
      logger.warn('Redis getJson failed to parse value', { key });
      return null;
    }
  }

  async setJson<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const serialised = JSON.stringify(value);
    await this.set(key, serialised, ttlSeconds);
  }

  async acquireLock(
    lockKey: string,
    ttlSeconds: number,
    token: string,
  ): Promise<boolean> {
    return this.setNX(lockKey, token, ttlSeconds);
  }

  async releaseLock(lockKey: string, token: string): Promise<boolean> {
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    const result = await this.client.eval(script, 1, lockKey, token);
    return result === 1;
  }

  pipeline(): ChainableCommander {
    return this.client.pipeline();
  }

  async multi<T>(
    fn: (multi: ChainableCommander) => void,
  ): Promise<Array<[Error | null, T]>> {
    const multi = this.client.multi();
    fn(multi);
    return multi.exec() as Promise<Array<[Error | null, T]>>;
  }
}

export const redisService = new RedisService(redisClient);