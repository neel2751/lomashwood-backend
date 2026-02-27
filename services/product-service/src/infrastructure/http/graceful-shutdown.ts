import { Server } from 'http';
import { logger } from '../../config/logger';
import { prismaClient } from '../db/prisma.client';
import { redisClient } from '../cache/redis.client';
import { eventProducer } from '../messaging/event-producer';

const SHUTDOWN_TIMEOUT = 30000;

export async function gracefulShutdown(server: Server | null): Promise<void> {
  const shutdownStartTime = Date.now();

  if (!server) {
    logger.warn('No server instance to shutdown');
    return;
  }

  let isShuttingDown = false;

  const forceShutdown = setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT);

  try {
    if (isShuttingDown) {
      logger.warn('Shutdown already in progress');
      return;
    }

    isShuttingDown = true;

    logger.info('Closing HTTP server...');
    await closeServer(server);
    logger.info('HTTP server closed successfully');

    logger.info('Disconnecting from database...');
    await prismaClient.$disconnect();
    logger.info('Database disconnected successfully');

    logger.info('Closing Redis connection...');
    await redisClient.disconnect();
    logger.info('Redis disconnected successfully');

    logger.info('Closing message producer...');
    await eventProducer.disconnect();
    logger.info('Message producer closed successfully');

    clearTimeout(forceShutdown);

    const shutdownDuration = Date.now() - shutdownStartTime;
    logger.info(`Graceful shutdown completed in ${shutdownDuration}ms`);

    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown', error);
    clearTimeout(forceShutdown);
    process.exit(1);
  }
}

function closeServer(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((err) => {
      if (err) {
        logger.error('Error closing server', err);
        reject(err);
      } else {
        resolve();
      }
    });

    setTimeout(() => {
      logger.warn('Server close timeout - destroying connections');
      server.closeAllConnections?.();
      resolve();
    }, 10000);
  });
}

process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received');
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received');
});