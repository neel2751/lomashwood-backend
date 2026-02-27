import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { prismaClient } from './infrastructure/db/prisma.client';
import { redisClient } from './infrastructure/cache/redis.client';
import { setupGracefulShutdown } from './infrastructure/http/graceful-shutdown';

export async function bootstrap(): Promise<void> {
  await prismaClient.$connect();
  logger.info('Database connected');

  await redisClient.ping();
  logger.info('Redis connected');

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, 'Customer service started');
  });

  setupGracefulShutdown(server);
}