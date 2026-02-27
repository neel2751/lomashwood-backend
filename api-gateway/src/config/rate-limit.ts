import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';
import { env, isDevelopment } from './env';
import { logger } from '../utils/logger';

let redisClient: ReturnType<typeof createClient> | null = null;

const initializeRedisClient = async () => {
  if (!env.REDIS_URL && !env.REDIS_HOST) {
    logger.warn('Redis not configured for rate limiting. Using in-memory store.');
    return null;
  }

  try {
    const client = createClient({
      url: env.REDIS_URL,
      socket: {
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
      },
      password: env.REDIS_PASSWORD,
      database: env.REDIS_DB,
    });

    client.on('error', (err) => {
      logger.error('Redis client error for rate limiting', { error: err });
    });

    client.on('connect', () => {
      logger.info('Redis client connected for rate limiting');
    });

    await client.connect();
    redisClient = client;
    return client;
  } catch (error) {
    logger.error('Failed to connect to Redis for rate limiting', { error });
    return null;
  }
};

const getStore = async () => {
  if (!redisClient) {
    const client = await initializeRedisClient();
    if (client) {
      return new RedisStore({
        sendCommand: (...args: string[]) => client.sendCommand(args),
        prefix: `${env.REDIS_KEY_PREFIX}ratelimit:`,
      });
    }
  } else {
    return new RedisStore({
      sendCommand: (...args: string[]) => redisClient!.sendCommand(args),
      prefix: `${env.REDIS_KEY_PREFIX}ratelimit:`,
    });
  }
  return undefined;
};

const createRateLimiter = async (
  windowMs: number,
  max: number,
  keyGenerator?: (req: any) => string,
  skipSuccessfulRequests = false,
  skipFailedRequests = false
): Promise<RateLimitRequestHandler> => {
  const store = await getStore();

  return rateLimit({
    windowMs,
    max: isDevelopment ? max * 10 : max,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    skipFailedRequests,
    store,
    keyGenerator: keyGenerator || ((req) => {
      return req.ip || 
             req.headers['x-forwarded-for'] as string || 
             req.headers['x-real-ip'] as string || 
             'unknown';
    }),
    handler: (req, res) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        method: req.method,
      });

      res.status(429).json({
        success: false,
        error: 'TOO_MANY_REQUESTS',
        message: 'Too many requests. Please try again later.',
        retryAfter: res.getHeader('Retry-After'),
      });
    },
    skip: (req) => {
      const whitelist = ['127.0.0.1', '::1', 'localhost'];
      const ip = req.ip || req.headers['x-forwarded-for'] as string;
      return isDevelopment && whitelist.includes(ip);
    },
  });
};

export const globalRateLimiter = async (): Promise<RateLimitRequestHandler> => {
  return createRateLimiter(
    env.RATE_LIMIT_WINDOW_MS,
    env.RATE_LIMIT_MAX_REQUESTS,
    undefined,
    env.RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS,
    env.RATE_LIMIT_SKIP_FAILED_REQUESTS
  );
};

export const authRateLimiter = async (): Promise<RateLimitRequestHandler> => {
  return createRateLimiter(
    900000,
    5,
    (req) => {
      const email = req.body?.email || req.body?.username || '';
      const ip = req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
      return `auth:${email}:${ip}`;
    },
    true,
    false
  );
};

export const registerRateLimiter = async (): Promise<RateLimitRequestHandler> => {
  return createRateLimiter(
    3600000,
    3,
    (req) => {
      const email = req.body?.email || '';
      const ip = req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
      return `register:${email}:${ip}`;
    },
    true,
    false
  );
};

export const passwordResetRateLimiter = async (): Promise<RateLimitRequestHandler> => {
  return createRateLimiter(
    3600000,
    3,
    (req) => {
      const email = req.body?.email || '';
      return `password-reset:${email}`;
    },
    true,
    false
  );
};

export const apiKeyRateLimiter = async (): Promise<RateLimitRequestHandler> => {
  return createRateLimiter(
    60000,
    100,
    (req) => {
      const apiKey = req.headers['x-api-key'] as string || 'unknown';
      return `api-key:${apiKey}`;
    },
    false,
    false
  );
};

export const uploadRateLimiter = async (): Promise<RateLimitRequestHandler> => {
  return createRateLimiter(
    3600000,
    50,
    (req) => {
      const userId = req.user?.id || req.ip || 'unknown';
      return `upload:${userId}`;
    },
    false,
    false
  );
};

export const bookingRateLimiter = async (): Promise<RateLimitRequestHandler> => {
  return createRateLimiter(
    86400000,
    10,
    (req) => {
      const userId = req.user?.id || req.ip || 'unknown';
      return `booking:${userId}`;
    },
    true,
    false
  );
};

export const brochureRateLimiter = async (): Promise<RateLimitRequestHandler> => {
  return createRateLimiter(
    86400000,
    5,
    (req) => {
      const email = req.body?.email || req.ip || 'unknown';
      return `brochure:${email}`;
    },
    true,
    false
  );
};

export const contactRateLimiter = async (): Promise<RateLimitRequestHandler> => {
  return createRateLimiter(
    3600000,
    5,
    (req) => {
      const email = req.body?.email || req.ip || 'unknown';
      return `contact:${email}`;
    },
    true,
    false
  );
};

export const newsletterRateLimiter = async (): Promise<RateLimitRequestHandler> => {
  return createRateLimiter(
    86400000,
    3,
    (req) => {
      const email = req.body?.email || req.ip || 'unknown';
      return `newsletter:${email}`;
    },
    true,
    false
  );
};

export const reviewRateLimiter = async (): Promise<RateLimitRequestHandler> => {
  return createRateLimiter(
    86400000,
    5,
    (req) => {
      const userId = req.user?.id || req.ip || 'unknown';
      return `review:${userId}`;
    },
    true,
    false
  );
};

export const searchRateLimiter = async (): Promise<RateLimitRequestHandler> => {
  return createRateLimiter(
    60000,
    30,
    (req) => {
      const userId = req.user?.id || req.ip || 'unknown';
      return `search:${userId}`;
    },
    false,
    false
  );
};

export const webhookRateLimiter = async (): Promise<RateLimitRequestHandler> => {
  return createRateLimiter(
    60000,
    100,
    (req) => {
      const signature = req.headers['x-webhook-signature'] as string || 'unknown';
      return `webhook:${signature}`;
    },
    false,
    false
  );
};

export const adminRateLimiter = async (): Promise<RateLimitRequestHandler> => {
  return createRateLimiter(
    60000,
    200,
    (req) => {
      const userId = req.user?.id || 'unknown';
      return `admin:${userId}`;
    },
    false,
    false
  );
};

export const createCustomRateLimiter = async (
  windowMs: number,
  max: number,
  prefix: string
): Promise<RateLimitRequestHandler> => {
  return createRateLimiter(
    windowMs,
    max,
    (req) => {
      const userId = req.user?.id || req.ip || 'unknown';
      return `${prefix}:${userId}`;
    }
  );
};

export const cleanupRateLimitStore = async (): Promise<void> => {
  if (redisClient) {
    try {
      const keys = await redisClient.keys(`${env.REDIS_KEY_PREFIX}ratelimit:*`);
      if (keys.length > 0) {
        await redisClient.del(keys);
        logger.info('Rate limit store cleaned up', { keysDeleted: keys.length });
      }
    } catch (error) {
      logger.error('Failed to cleanup rate limit store', { error });
    }
  }
};

export const disconnectRedis = async (): Promise<void> => {
  if (redisClient) {
    try {
      await redisClient.quit();
      logger.info('Redis client disconnected for rate limiting');
    } catch (error) {
      logger.error('Failed to disconnect Redis client', { error });
    }
  }
};

process.on('SIGTERM', async () => {
  await disconnectRedis();
});

process.on('SIGINT', async () => {
  await disconnectRedis();
});