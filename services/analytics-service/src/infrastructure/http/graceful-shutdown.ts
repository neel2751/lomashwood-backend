import http from 'http';

import { logger } from '../../config/logger';
import { env } from '../../config/env';
import { disconnectDatabase } from '../db/prisma.client';
import { disconnectRedis } from '../cache/redis.client';

export function setupGracefulShutdown(server: http.Server): void {
  let isShuttingDown = false;

  const shutdown = async (signal: string): Promise<void> => {
    if (isShuttingDown) {
      logger.warn({ signal }, 'Shutdown already in progress');
      return;
    }

    isShuttingDown = true;

    logger.info({ signal }, 'Received shutdown signal, starting graceful shutdown');

    const shutdownTimer = setTimeout(() => {
      logger.error('Graceful shutdown timed out, forcing exit');
      process.exit(1);
    }, env.GRACEFUL_SHUTDOWN_TIMEOUT_MS);

    shutdownTimer.unref();

    server.close(async (err) => {
      if (err) {
        logger.error({ error: err }, 'Error closing HTTP server');
      } else {
        logger.info('HTTP server closed');
      }

      try {
        await disconnectDatabase();
        logger.info('Database disconnected');
      } catch (dbErr) {
        logger.error({ error: dbErr }, 'Error disconnecting database');
      }

      try {
        await disconnectRedis();
        logger.info('Redis disconnected');
      } catch (redisErr) {
        logger.error({ error: redisErr }, 'Error disconnecting Redis');
      }

      clearTimeout(shutdownTimer);

      logger.info('Graceful shutdown complete');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('uncaughtException', (error) => {
    logger.fatal({ error }, 'Uncaught exception');
    shutdown('uncaughtException').finally(() => process.exit(1));
  });

  process.on('unhandledRejection', (reason) => {
    logger.fatal({ reason }, 'Unhandled promise rejection');
    shutdown('unhandledRejection').finally(() => process.exit(1));
  });
}