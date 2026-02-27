import http from 'http';
import { logger } from '../../config/logger';
import { disconnectDatabase } from '../db/prisma.client';
import { disconnectRedis } from '../cache/redis.client';

type ShutdownHandler = () => Promise<void>;

const shutdownHandlers: ShutdownHandler[] = [];
let isShuttingDown = false;

export function registerShutdownHandler(handler: ShutdownHandler): void {
  shutdownHandlers.push(handler);
}

export function setupGracefulShutdown(server: http.Server): void {
  const shutdown = async (signal: string): Promise<void> => {
    if (isShuttingDown) {
      logger.warn(`Shutdown already in progress, ignoring signal: ${signal}`);
      return;
    }

    isShuttingDown = true;
    logger.info({ signal }, 'Received shutdown signal, starting graceful shutdown');

    const shutdownTimeout = setTimeout(() => {
      logger.error('Graceful shutdown timed out, forcing exit');
      process.exit(1);
    }, 30000);

    shutdownTimeout.unref();

    try {
      await closeHttpServer(server);

      for (const handler of shutdownHandlers) {
        try {
          await handler();
        } catch (error) {
          logger.error(
            { error: (error as Error).message },
            'Error in shutdown handler',
          );
        }
      }

      await disconnectDatabase();
      await disconnectRedis();

      clearTimeout(shutdownTimeout);

      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error(
        { error: (error as Error).message },
        'Error during graceful shutdown',
      );
      clearTimeout(shutdownTimeout);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGHUP', () => shutdown('SIGHUP'));

  process.on('uncaughtException', (error) => {
    logger.fatal({ error: error.message, stack: error.stack }, 'Uncaught exception');
    shutdown('uncaughtException').catch(() => process.exit(1));
  });

  process.on('unhandledRejection', (reason) => {
    const message = reason instanceof Error ? reason.message : String(reason);
    const stack = reason instanceof Error ? reason.stack : undefined;
    logger.fatal({ reason: message, stack }, 'Unhandled promise rejection');
    shutdown('unhandledRejection').catch(() => process.exit(1));
  });
}

async function closeHttpServer(server: http.Server): Promise<void> {
  return new Promise((resolve, reject) => {
    logger.info('Closing HTTP server, stopping new connections');

    server.close((err) => {
      if (err) {
        logger.error({ error: err.message }, 'Error closing HTTP server');
        reject(err);
        return;
      }
      logger.info('HTTP server closed');
      resolve();
    });

    setTimeout(() => {
      logger.warn('Forcing HTTP server close after timeout');
      resolve();
    }, 10000).unref();
  });
}