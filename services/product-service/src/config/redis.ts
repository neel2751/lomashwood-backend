import { createClient, RedisClientType, RedisClientOptions } from 'redis';
import { env, isDevelopment, isProduction } from './env';
import { logger } from './logger';

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  keyPrefix: string;
  ttl: number;
  retryAttempts: number;
  retryDelay: number;
  enableOfflineQueue: boolean;
  connectTimeout: number;
  commandTimeout: number;
  keepAlive: number;
  maxRetriesPerRequest: number;
}

export const redisConfig: RedisConfig = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD,
  db: env.REDIS_DB,
  keyPrefix: env.REDIS_KEY_PREFIX,
  ttl: env.REDIS_TTL,
  retryAttempts: 3,
  retryDelay: 1000,
  enableOfflineQueue: true,
  connectTimeout: 10000,
  commandTimeout: 5000,
  keepAlive: 30000,
  maxRetriesPerRequest: 3,
};

export function createRedisClient(): RedisClientType {
  const options: RedisClientOptions = {
    socket: {
      host: redisConfig.host,
      port: redisConfig.port,
      connectTimeout: redisConfig.connectTimeout,
      keepAlive: redisConfig.keepAlive,
      reconnectStrategy: (retries: number) => {
        if (retries > redisConfig.retryAttempts) {
          logger.error('Redis max retry attempts reached', { retries });
          return new Error('Max retry attempts reached');
        }
        const delay = Math.min(retries * redisConfig.retryDelay, 5000);
        logger.warn('Redis reconnecting', { attempt: retries, delay });
        return delay;
      },
    },
    password: redisConfig.password,
    database: redisConfig.db,
  };

  const client = createClient(options);

  client.on('connect', () => {
    logger.info('Redis client connecting');
  });

  client.on('ready', () => {
    logger.info('Redis client ready', {
      host: redisConfig.host,
      port: redisConfig.port,
      db: redisConfig.db,
    });
  });

  client.on('error', (error: Error) => {
    logger.error('Redis client error', {
      error: error.message,
      stack: error.stack,
    });
  });

  client.on('reconnecting', () => {
    logger.warn('Redis client reconnecting');
  });

  client.on('end', () => {
    logger.info('Redis client connection closed');
  });

  return client as RedisClientType;
}

export async function connectRedis(
  client: RedisClientType,
  retryAttempts: number = redisConfig.retryAttempts
): Promise<void> {
  let attempt = 0;

  while (attempt < retryAttempts) {
    try {
      if (!client.isOpen) {
        await client.connect();
      }
      logger.info('Redis connected successfully', {
        attempt: attempt + 1,
        host: redisConfig.host,
        port: redisConfig.port,
      });
      return;
    } catch (error) {
      attempt++;
      logger.error('Redis connection failed', {
        attempt,
        maxAttempts: retryAttempts,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      if (attempt >= retryAttempts) {
        throw new Error(
          `Failed to connect to Redis after ${retryAttempts} attempts`
        );
      }

      await new Promise(resolve =>
        setTimeout(resolve, redisConfig.retryDelay * attempt)
      );
    }
  }
}

export async function disconnectRedis(client: RedisClientType): Promise<void> {
  try {
    if (client.isOpen) {
      await client.quit();
    }
    logger.info('Redis disconnected successfully');
  } catch (error) {
    logger.error('Error disconnecting from Redis', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

export async function healthCheckRedis(
  client: RedisClientType
): Promise<{ healthy: boolean; responseTime: number; error?: string }> {
  const startTime = Date.now();

  try {
    if (!client.isOpen) {
      throw new Error('Redis client is not connected');
    }

    await client.ping();
    const responseTime = Date.now() - startTime;

    return {
      healthy: true,
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      healthy: false,
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function getRedisInfo(
  client: RedisClientType
): Promise<Record<string, string>> {
  try {
    if (!client.isOpen) {
      throw new Error('Redis client is not connected');
    }

    const info = await client.info();
    const lines = info.split('\r\n');
    const result: Record<string, string> = {};

    for (const line of lines) {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split(':');
        if (key && value) {
          result[key.trim()] = value.trim();
        }
      }
    }

    return result;
  } catch (error) {
    logger.error('Failed to get Redis info', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {};
  }
}

export async function getRedisMetrics(
  client: RedisClientType
): Promise<{
  connectedClients: number;
  usedMemory: string;
  totalKeys: number;
  hits: number;
  misses: number;
  hitRate: string;
}> {
  try {
    const info = await getRedisInfo(client);
    const hits = parseInt(info['keyspace_hits'] || '0', 10);
    const misses = parseInt(info['keyspace_misses'] || '0', 10);
    const total = hits + misses;
    const hitRate = total > 0 ? ((hits / total) * 100).toFixed(2) : '0.00';

    return {
      connectedClients: parseInt(info['connected_clients'] || '0', 10),
      usedMemory: info['used_memory_human'] || '0',
      totalKeys: parseInt(info[`db${redisConfig.db}`]?.split('keys=')[1]?.split(',')[0] || '0', 10),
      hits,
      misses,
      hitRate: `${hitRate}%`,
    };
  } catch (error) {
    logger.error('Failed to get Redis metrics', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      connectedClients: 0,
      usedMemory: '0',
      totalKeys: 0,
      hits: 0,
      misses: 0,
      hitRate: '0.00%',
    };
  }
}

export function buildRedisKey(...parts: string[]): string {
  return `${redisConfig.keyPrefix}${parts.join(':')}`;
}

export async function setCache(
  client: RedisClientType,
  key: string,
  value: any,
  ttl: number = redisConfig.ttl
): Promise<void> {
  try {
    const fullKey = buildRedisKey(key);
    const serialized = JSON.stringify(value);
    await client.setEx(fullKey, ttl, serialized);
    
    if (isDevelopment()) {
      logger.debug('Cache set', { key: fullKey, ttl });
    }
  } catch (error) {
    logger.error('Failed to set cache', {
      key,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export async function getCache<T>(
  client: RedisClientType,
  key: string
): Promise<T | null> {
  try {
    const fullKey = buildRedisKey(key);
    const cached = await client.get(fullKey);

    if (!cached) {
      if (isDevelopment()) {
        logger.debug('Cache miss', { key: fullKey });
      }
      return null;
    }

    if (isDevelopment()) {
      logger.debug('Cache hit', { key: fullKey });
    }

    return JSON.parse(cached) as T;
  } catch (error) {
    logger.error('Failed to get cache', {
      key,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

export async function deleteCache(
  client: RedisClientType,
  key: string
): Promise<void> {
  try {
    const fullKey = buildRedisKey(key);
    await client.del(fullKey);
    
    if (isDevelopment()) {
      logger.debug('Cache deleted', { key: fullKey });
    }
  } catch (error) {
    logger.error('Failed to delete cache', {
      key,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export async function deleteCachePattern(
  client: RedisClientType,
  pattern: string
): Promise<void> {
  try {
    const fullPattern = buildRedisKey(pattern);
    const keys = await client.keys(fullPattern);
    
    if (keys.length > 0) {
      await client.del(keys);
      logger.info('Cache pattern deleted', { pattern: fullPattern, count: keys.length });
    }
  } catch (error) {
    logger.error('Failed to delete cache pattern', {
      pattern,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export async function flushCache(client: RedisClientType): Promise<void> {
  try {
    await client.flushDb();
    logger.info('Cache flushed successfully');
  } catch (error) {
    logger.error('Failed to flush cache', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

export function validateRedisConfiguration(): {
  valid: boolean;
  warnings: string[];
  errors: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];

  if (!redisConfig.host) {
    errors.push('REDIS_HOST is not configured');
  }

  if (redisConfig.port < 1 || redisConfig.port > 65535) {
    errors.push('REDIS_PORT must be between 1 and 65535');
  }

  if (isProduction() && !redisConfig.password) {
    warnings.push('Redis password not set in production environment');
  }

  if (redisConfig.ttl < 60) {
    warnings.push('Redis TTL is very low (<60s)');
  }

  if (redisConfig.ttl > 86400) {
    warnings.push('Redis TTL is very high (>24h)');
  }

  if (redisConfig.retryAttempts < 1) {
    warnings.push('Redis retry attempts should be at least 1');
  }

  if (redisConfig.connectTimeout < 3000) {
    warnings.push('Redis connection timeout is very low (<3s)');
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors,
  };
}

export function logRedisConfiguration(): void {
  const validation = validateRedisConfiguration();

  logger.info('Redis configuration loaded', {
    environment: env.NODE_ENV,
    host: redisConfig.host,
    port: redisConfig.port,
    db: redisConfig.db,
    keyPrefix: redisConfig.keyPrefix,
    ttl: redisConfig.ttl,
    hasPassword: !!redisConfig.password,
  });

  if (validation.warnings.length > 0) {
    logger.warn('Redis configuration warnings', { warnings: validation.warnings });
  }

  if (validation.errors.length > 0) {
    logger.error('Redis configuration errors', { errors: validation.errors });
  }
}

export function getRedisConfig(): RedisConfig {
  return { ...redisConfig };
}

logRedisConfiguration();