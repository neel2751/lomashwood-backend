import { env } from './env';
import { logger } from './logger';

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  tls: boolean;
  keyPrefix: string;
  ttl: number;
  retryAttempts: number;
  retryDelay: number;
  connectTimeout: number;
  commandTimeout: number;
  maxRetriesPerRequest: number;
  enableReadyCheck: boolean;
  lazyConnect: boolean;
}

export interface RedisHealth {
  connected: boolean;
  latencyMs?: number;
  usedMemory?: string;
  connectedClients?: number;
  error?: string;
}

export const redisConfig: RedisConfig = {
  host: env.redis.host,
  port: env.redis.port,
  password: env.redis.password,
  db: env.redis.db,
  tls: env.redis.tls,
  keyPrefix: env.redis.keyPrefix,
  ttl: env.redis.ttl,
  retryAttempts: 10,
  retryDelay: 3000,
  connectTimeout: 10000,
  commandTimeout: 5000,
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
};

export const redisConnectionOptions = {
  host: redisConfig.host,
  port: redisConfig.port,
  password: redisConfig.password,
  db: redisConfig.db,
  keyPrefix: redisConfig.keyPrefix,
  connectTimeout: redisConfig.connectTimeout,
  commandTimeout: redisConfig.commandTimeout,
  maxRetriesPerRequest: redisConfig.maxRetriesPerRequest,
  enableReadyCheck: redisConfig.enableReadyCheck,
  lazyConnect: redisConfig.lazyConnect,
  ...(redisConfig.tls ? { tls: {} } : {}),
  retryStrategy: (times: number): number | null => {
    if (times > redisConfig.retryAttempts) {
      logger.error('Redis max retry attempts reached', { attempts: times });
      return null;
    }

    const delay = Math.min(times * redisConfig.retryDelay, 30000);
    logger.warn('Redis connection retry', { attempt: times, delayMs: delay });
    return delay;
  },
  reconnectOnError: (err: Error): boolean => {
    const targetErrors = ['READONLY', 'ECONNRESET', 'ECONNREFUSED'];
    const shouldReconnect = targetErrors.some((e) => err.message.includes(e));

    if (shouldReconnect) {
      logger.warn('Redis reconnecting on error', { error: err.message });
    }

    return shouldReconnect;
  },
};

export const REDIS_KEYS = {
  booking: {
    byId: (id: string) => `booking:${id}`,
    byCustomer: (customerId: string) => `bookings:customer:${customerId}`,
    byConsultant: (consultantId: string) => `bookings:consultant:${consultantId}`,
    availability: (consultantId: string, date: string) =>
      `availability:${consultantId}:${date}`,
    slots: (consultantId: string) => `slots:${consultantId}`,
    lock: (slotId: string) => `lock:slot:${slotId}`,
  },
  consultant: {
    byId: (id: string) => `consultant:${id}`,
    list: () => 'consultants:list',
    availability: (id: string) => `consultant:availability:${id}`,
  },
  reminder: {
    byId: (id: string) => `reminder:${id}`,
    pending: () => 'reminders:pending',
    schedule: (bookingId: string) => `reminder:schedule:${bookingId}`,
  },
  session: {
    user: (userId: string) => `session:user:${userId}`,
    token: (token: string) => `session:token:${token}`,
  },
  rateLimit: {
    booking: (key: string) => `ratelimit:booking:${key}`,
    availability: (key: string) => `ratelimit:availability:${key}`,
    reminder: (key: string) => `ratelimit:reminder:${key}`,
  },
} as const;

export const REDIS_TTL = {
  booking: 60 * 60 * 24,
  consultant: 60 * 60 * 2,
  availability: 60 * 60,
  slots: 60 * 15,
  reminder: 60 * 60 * 48,
  session: 60 * 60 * 24 * 7,
  lock: 30,
  rateLimit: 60,
} as const;

export async function checkRedisHealth(
  ping: () => Promise<string>
): Promise<RedisHealth> {
  const start = Date.now();

  try {
    await ping();
    const latencyMs = Date.now() - start;

    return {
      connected: true,
      latencyMs,
    };
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown Redis error';

    logger.error('Redis health check failed', { error });

    return {
      connected: false,
      error,
    };
  }
}

export function buildRedisKey(parts: string[]): string {
  return parts.join(':');
}

export function parseRedisKey(key: string): string[] {
  const prefix = redisConfig.keyPrefix;
  const stripped = key.startsWith(prefix) ? key.slice(prefix.length) : key;
  return stripped.split(':');
}