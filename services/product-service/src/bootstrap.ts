import { Application } from 'express';
import { createApp } from './app';
import { logger } from './config/logger';
import { config } from './config';
import { prisma } from './infrastructure/db/prisma.client';
import { redisClient } from './infrastructure/cache/redis.client';
import { eventProducer } from './infrastructure/messaging/event-producer';

export async function bootstrap(): Promise<Application> {
  try {
    logger.info('Bootstrapping Product Service...');

    logger.info('Connecting to PostgreSQL database...');
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    logger.info('PostgreSQL database connected successfully');

    if (config.cache.enabled) {
      logger.info('Connecting to Redis...');
      await redisClient.connect();
      await redisClient.ping();
      logger.info('Redis connected successfully');
    } else {
      logger.warn('Redis cache is disabled');
    }

    if (config.messaging.enabled) {
      logger.info('Initializing event producer...');
      await eventProducer.initialize();
      logger.info('Event producer initialized successfully');
    } else {
      logger.warn('Event messaging is disabled');
    }

    logger.info('Creating Express application...');
    const app = createApp();
    logger.info('Express application created successfully');

    logger.info('Running database migrations check...');
    try {
      await prisma.$queryRaw`SELECT COUNT(*) FROM "Product"`;
      logger.info('Database schema verified');
    } catch (error) {
      logger.warn('Database schema verification failed. Migrations may need to be run.');
    }

    if (config.env === 'development') {
      logger.info('Development mode: Additional debugging enabled');
      app.locals.env = 'development';
    }

    logger.info('Product Service bootstrap completed successfully');
    return app;
  } catch (error) {
    logger.error('Failed to bootstrap Product Service:', error);
    
    try {
      await prisma.$disconnect();
      if (redisClient.isOpen) {
        await redisClient.quit();
      }
    } catch (cleanupError) {
      logger.error('Error during cleanup:', cleanupError);
    }

    throw error;
  }
}

process.on('beforeExit', async () => {
  logger.info('Process beforeExit event triggered');
  try {
    await prisma.$disconnect();
    if (redisClient.isOpen) {
      await redisClient.quit();
    }
    logger.info('Cleanup completed');
  } catch (error) {
    logger.error('Error during beforeExit cleanup:', error);
  }
});