import rateLimit, { RateLimitRequestHandler, Options } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';
import { env } from './env';
import { logger } from './logger';



let redisClient: ReturnType<typeof createClient> | null = null;

async function getRedisClient(): Promise<ReturnType<typeof createClient>> {
  if (redisClient) return redisClient;

  redisClient = createClient({ url: env.REDIS_URL });

  redisClient.on('error', (err: Error) => {
    logger.error({ error: err.message }, '[RateLimit] Redis client error');
  });

  await redisClient.connect();
  return redisClient;
}



const baseConfig: Partial<Options> = {
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  standardHeaders: true,   
  legacyHeaders: false,     
  skipSuccessfulRequests: false,
  keyGenerator: (req) => {
    
    const userId = (req as { user?: { id: string } }).user?.id;
    return userId ? `user:${userId}` : (req.ip ?? 'unknown');
  },
  handler: (req, res) => {
    logger.warn(
      { ip: req.ip, url: req.originalUrl },
      '[RateLimit] Rate limit exceeded',
    );
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please slow down and try again later.',
        retryAfter: Math.ceil(env.RATE_LIMIT_WINDOW_MS / 1_000),
      },
    });
  },
};



export const rateLimitMiddleware: RateLimitRequestHandler = rateLimit({
  ...baseConfig,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many requests from this client.',
});



export const writeRateLimitMiddleware: RateLimitRequestHandler = rateLimit({
  ...baseConfig,
  windowMs: 60_000,
  max: 30,
  message: 'Too many write operations. Please wait before trying again.',
});



export const adminRateLimitMiddleware: RateLimitRequestHandler = rateLimit({
  ...baseConfig,
  windowMs: 60_000,
  max: 100,
  message: 'Admin rate limit exceeded.',
});



export const publicReadRateLimitMiddleware: RateLimitRequestHandler = rateLimit({
  ...baseConfig,
  windowMs: 60_000,
  max: 500,
  message: 'Read rate limit exceeded.',
});



export const uploadRateLimitMiddleware: RateLimitRequestHandler = rateLimit({
  ...baseConfig,
  windowMs: 60_000,
  max: 20,
  message: 'Upload rate limit exceeded. Please wait before uploading again.',
});



export async function createRedisRateLimiter(options: {
  max: number;
  windowMs?: number;
  prefix?: string;
}): Promise<RateLimitRequestHandler> {
  const client = await getRedisClient();

  return rateLimit({
    ...baseConfig,
    windowMs: options.windowMs ?? env.RATE_LIMIT_WINDOW_MS,
    max: options.max,
    store: new RedisStore({
      sendCommand: (...args: string[]) =>
        client.sendCommand(args) as Promise<number>,
      prefix: `${env.REDIS_KEY_PREFIX}rl:${options.prefix ?? 'default'}:`,
    }),
  });
}

// Compatibility simple config object
export const rateLimitConfig = {
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
} as const;