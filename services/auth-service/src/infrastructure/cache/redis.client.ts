import Redis from 'ioredis';
import { config } from '../../config';

class RedisClient {
  private client: Redis | null = null;
  private subscriber: Redis | null = null;
  private publisher: Redis | null = null;
  private isConnected: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    if (!config.redis.url) {
      console.warn('Redis URL not configured. Redis will not be initialized.');
      return;
    }

    try {
      this.client = new Redis(config.redis.url, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times: number) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        reconnectOnError: (err) => {
          const targetError = 'READONLY';
          if (err.message.includes(targetError)) {
            return true;
          }
          return false;
        },
        enableReadyCheck: true,
        lazyConnect: false,
      });

      this.subscriber = new Redis(config.redis.url, {
        maxRetriesPerRequest: 3,
        lazyConnect: false,
      });

      this.publisher = new Redis(config.redis.url, {
        maxRetriesPerRequest: 3,
        lazyConnect: false,
      });

      this.setupEventHandlers();
    } catch (error) {
      console.error('Failed to initialize Redis:', error);
      throw error;
    }
  }

  private setupEventHandlers(): void {
    if (!this.client) return;

    this.client.on('connect', () => {
      console.log('Redis client connected');
    });

    this.client.on('ready', () => {
      console.log('Redis client ready');
      this.isConnected = true;
    });

    this.client.on('error', (error) => {
      console.error('Redis client error:', error);
      this.isConnected = false;
    });

    this.client.on('close', () => {
      console.log('Redis client connection closed');
      this.isConnected = false;
    });

    this.client.on('reconnecting', () => {
      console.log('Redis client reconnecting');
    });

    if (this.subscriber) {
      this.subscriber.on('error', (error) => {
        console.error('Redis subscriber error:', error);
      });
    }

    if (this.publisher) {
      this.publisher.on('error', (error) => {
        console.error('Redis publisher error:', error);
      });
    }
  }

  getClient(): Redis {
    if (!this.client) {
      throw new Error('Redis client not initialized');
    }
    return this.client;
  }

  getSubscriber(): Redis {
    if (!this.subscriber) {
      throw new Error('Redis subscriber not initialized');
    }
    return this.subscriber;
  }

  getPublisher(): Redis {
    if (!this.publisher) {
      throw new Error('Redis publisher not initialized');
    }
    return this.publisher;
  }

  // ─── String Methods ───────────────────────────────────────────────

  async set(key: string, value: string | number | object, ttl?: number): Promise<void> {
    if (!this.client) return;
    const serializedValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    if (ttl) {
      await this.client.setex(key, ttl, serializedValue);
    } else {
      await this.client.set(key, serializedValue);
    }
  }

  async get<T = string>(key: string): Promise<T | null> {
    if (!this.client) return null;
    const value = await this.client.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  }

  async del(key: string | string[]): Promise<void> {
    if (!this.client) return;
    if (Array.isArray(key)) {
      await this.client.del(...key);
    } else {
      await this.client.del(key);
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.client) return false;
    const result = await this.client.exists(key);
    return result === 1;
  }

  async expire(key: string, seconds: number): Promise<void> {
    if (!this.client) return;
    await this.client.expire(key, seconds);
  }

  async ttl(key: string): Promise<number> {
    if (!this.client) return -2;
    return this.client.ttl(key);
  }

  async keys(pattern: string): Promise<string[]> {
    if (!this.client) return [];
    return this.client.keys(pattern);
  }

  async flushAll(): Promise<void> {
    if (!this.client) return;
    if (String(config.env) !== 'production') {
      await this.client.flushall();
    }
  }

  async flushDb(): Promise<void> {
    if (!this.client) return;
    if (String(config.env) !== 'production') {
      await this.client.flushdb();
    }
  }

  // ─── Hash Methods ─────────────────────────────────────────────────

  async hSet(key: string, field: string, value: string | number | object): Promise<void> {
    if (!this.client) return;
    const serializedValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    await this.client.hset(key, field, serializedValue);
  }

  async hGet<T = string>(key: string, field: string): Promise<T | null> {
    if (!this.client) return null;
    const value = await this.client.hget(key, field);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  }

  async hGetAll<T = Record<string, string>>(key: string): Promise<T | null> {
    if (!this.client) return null;
    const value = await this.client.hgetall(key);
    if (!value || Object.keys(value).length === 0) return null;
    try {
      const parsed: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value)) {
        try {
          parsed[k] = JSON.parse(v);
        } catch {
          parsed[k] = v;
        }
      }
      return parsed as T;
    } catch {
      return value as unknown as T;
    }
  }

  async hDel(key: string, field: string | string[]): Promise<void> {
    if (!this.client) return;
    if (Array.isArray(field)) {
      await this.client.hdel(key, ...field);
    } else {
      await this.client.hdel(key, field);
    }
  }

  // ─── Counter Methods ──────────────────────────────────────────────

  async incr(key: string): Promise<number> {
    if (!this.client) return 0;
    return this.client.incr(key);
  }

  async decr(key: string): Promise<number> {
    if (!this.client) return 0;
    return this.client.decr(key);
  }

  async incrBy(key: string, increment: number): Promise<number> {
    if (!this.client) return 0;
    return this.client.incrby(key, increment);
  }

  async decrBy(key: string, decrement: number): Promise<number> {
    if (!this.client) return 0;
    return this.client.decrby(key, decrement);
  }

  // ─── Set Methods ──────────────────────────────────────────────────

  async sAdd(key: string, members: string | string[]): Promise<void> {
    if (!this.client) return;
    if (Array.isArray(members)) {
      await this.client.sadd(key, ...members);
    } else {
      await this.client.sadd(key, members);
    }
  }

  async sMembers(key: string): Promise<string[]> {
    if (!this.client) return [];
    return this.client.smembers(key);
  }

  async sRem(key: string, members: string | string[]): Promise<void> {
    if (!this.client) return;
    if (Array.isArray(members)) {
      await this.client.srem(key, ...members);
    } else {
      await this.client.srem(key, members);
    }
  }

  // ─── List Methods ─────────────────────────────────────────────────

  async lpush(key: string, ...values: string[]): Promise<number> {
    if (!this.client) return 0;
    return this.client.lpush(key, ...values);
  }

  async rpush(key: string, ...values: string[]): Promise<number> {
    if (!this.client) return 0;
    return this.client.rpush(key, ...values);
  }

  async lpop(key: string): Promise<string | null> {
    if (!this.client) return null;
    return this.client.lpop(key);
  }

  async rpop(key: string): Promise<string | null> {
    if (!this.client) return null;
    return this.client.rpop(key);
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    if (!this.client) return [];
    return this.client.lrange(key, start, stop);
  }

  async ltrim(key: string, start: number, stop: number): Promise<void> {
    if (!this.client) return;
    await this.client.ltrim(key, start, stop);
  }

  async llen(key: string): Promise<number> {
    if (!this.client) return 0;
    return this.client.llen(key);
  }

  async lindex(key: string, index: number): Promise<string | null> {
    if (!this.client) return null;
    return this.client.lindex(key, index);
  }

  async lset(key: string, index: number, value: string): Promise<void> {
    if (!this.client) return;
    await this.client.lset(key, index, value);
  }

  async lrem(key: string, count: number, value: string): Promise<number> {
    if (!this.client) return 0;
    return this.client.lrem(key, count, value);
  }

  // ─── Pub/Sub Methods ──────────────────────────────────────────────

  async publish(channel: string, message: string | object): Promise<void> {
    if (!this.publisher) return;
    const serializedMessage = typeof message === 'object' ? JSON.stringify(message) : message;
    await this.publisher.publish(channel, serializedMessage);
  }

  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    if (!this.subscriber) return;
    await this.subscriber.subscribe(channel);
    this.subscriber.on('message', (ch, message) => {
      if (ch === channel) {
        callback(message);
      }
    });
  }

  async unsubscribe(channel: string): Promise<void> {
    if (!this.subscriber) return;
    await this.subscriber.unsubscribe(channel);
  }

  // ─── Utility Methods ──────────────────────────────────────────────

  async ping(): Promise<boolean> {
    if (!this.client) return false;
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }

  isReady(): boolean {
    return this.isConnected;
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
    }
    if (this.subscriber) {
      await this.subscriber.quit();
    }
    if (this.publisher) {
      await this.publisher.quit();
    }
    this.isConnected = false;
  }
}

export const redisClient = new RedisClient();
export default redisClient;