

export interface RedisOptions {
  lazyConnect?:          boolean;
  enableReadyCheck?:     boolean;
  maxRetriesPerRequest?: number | null;
  retryStrategy?:        (times: number) => number | null;
  reconnectOnError?:     (err: Error) => boolean;
  tls?:                  Record<string, unknown> | undefined;
  keyPrefix?:            string;
  connectionName?:       string;
  host?:                 string;
  port?:                 number;
  password?:             string;
  db?:                   number;
  url?:                  string;
}


const env = {
  REDIS_MAX_RETRY_ATTEMPTS: Number(process.env['REDIS_MAX_RETRY_ATTEMPTS'] ?? 10),
  REDIS_RETRY_DELAY_MS:     Number(process.env['REDIS_RETRY_DELAY_MS']     ?? 200),
  REDIS_TLS_ENABLED:        process.env['REDIS_TLS_ENABLED']                === 'true',
  REDIS_KEY_PREFIX:         process.env['REDIS_KEY_PREFIX']                 ?? 'lomash:auth:',
  REDIS_URL:                process.env['REDIS_URL']                        ?? 'redis://localhost:6379/0',
  REDIS_PASSWORD:           process.env['REDIS_PASSWORD']                   ?? '',
  REDIS_DEFAULT_TTL:        Number(process.env['REDIS_DEFAULT_TTL']         ?? 3600),
  REDIS_MAX_CONNECTIONS:    Number(process.env['REDIS_MAX_CONNECTIONS']     ?? 10),
  SERVICE_NAME:             process.env['SERVICE_NAME']                     ?? 'auth-service',
};


export const redisOptions: RedisOptions = {
  lazyConnect:          true,
  enableReadyCheck:     true,
  maxRetriesPerRequest: 3,
  retryStrategy: (times: number): number | null => {
    if (times > env.REDIS_MAX_RETRY_ATTEMPTS) {
      return null;
    }
    return Math.min(times * env.REDIS_RETRY_DELAY_MS, 3000);
  },
  reconnectOnError: (err: Error): boolean => {
    const targetErrors = ['READONLY', 'ECONNRESET', 'ECONNREFUSED'];
    return targetErrors.some((e) => err.message.includes(e));
  },
  tls:            env.REDIS_TLS_ENABLED ? {} : undefined,
  keyPrefix:      env.REDIS_KEY_PREFIX,
  connectionName: env.SERVICE_NAME,
};

export const redisConfig = {
  url:            env.REDIS_URL,
  password:       env.REDIS_PASSWORD || undefined,
  defaultTtl:     env.REDIS_DEFAULT_TTL,
  maxConnections: env.REDIS_MAX_CONNECTIONS,
  keyPrefix:      env.REDIS_KEY_PREFIX,
} as const;