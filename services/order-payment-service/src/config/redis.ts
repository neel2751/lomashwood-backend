import { RedisOptions } from 'ioredis';
import { env } from './env';

const RECONNECT_MAX_ATTEMPTS  = 10;
const RECONNECT_BASE_DELAY_MS = 2_000;
const CONNECT_TIMEOUT_MS      = 10_000;
const COMMAND_TIMEOUT_MS      = 5_000;

export type RedisConfig = {
  host:            string;
  port:            number;
  password:        string | undefined;
  db:              number;
  tls:             boolean;
  connectTimeout:  number;
  commandTimeout:  number;
  maxRetries:      number;
  keyPrefix:       string;
};

export function buildRedisConfig(): RedisConfig {
  return {
    host:           env.REDIS_HOST,
    port:           env.REDIS_PORT,
    password:       env.REDIS_PASSWORD || undefined,
    db:             env.REDIS_DB,
    tls:            env.REDIS_TLS_ENABLED,
    connectTimeout: CONNECT_TIMEOUT_MS,
    commandTimeout: COMMAND_TIMEOUT_MS,
    maxRetries:     RECONNECT_MAX_ATTEMPTS,
    keyPrefix:      'order-payment:',
  };
}

export function buildRedisOptions(): RedisOptions {
  const config = buildRedisConfig();

  return {
    host:                  config.host,
    port:                  config.port,
    password:              config.password,
    db:                    config.db,
    tls:                   config.tls ? {} : undefined,
    connectTimeout:        config.connectTimeout,
    commandTimeout:        config.commandTimeout,
    maxRetriesPerRequest:  3,
    enableReadyCheck:      true,
    enableOfflineQueue:    true,
    lazyConnect:           true,
    retryStrategy(times: number): number | null {
      if (times > RECONNECT_MAX_ATTEMPTS) return null;
      return Math.min(times * RECONNECT_BASE_DELAY_MS, 10_000);
    },
    reconnectOnError(error: Error): boolean {
      const retryTargets = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
      return retryTargets.some((e) => error.message.includes(e));
    },
  };
}