import { Application } from 'express';
import { createApp } from './app';
import { prismaClient } from './infrastructure/db/prisma.client';
import { redisClient } from './infrastructure/cache/redis.client';
import { logger } from './config/logger';
import { env } from './config/env';
import { validateEnv } from './config/env';
import { registerJobs } from './interfaces/cron/jobs';
import { registerEventSubscriptions } from './interfaces/events/subscriptions';

interface BootstrapResult {
  app: Application;
  prisma: typeof prismaClient;
  redis: typeof redisClient;
}

export async function bootstrap(): Promise<BootstrapResult> {
  validateEnv();

  logger.info({ message: 'Starting appointment service bootstrap', environment: env.NODE_ENV });

  await prismaClient.$connect();
  logger.info({ message: 'Database connection established' });

  await redisClient.connect();
  logger.info({ message: 'Redis connection established' });

  await registerEventSubscriptions();
  logger.info({ message: 'Event subscriptions registered' });

  await registerJobs();
  logger.info({ message: 'Background jobs registered' });

  const app = createApp();
  logger.info({ message: 'Express application initialized' });

  return { app, prisma: prismaClient, redis: redisClient };
}