import http from 'http';
import { logger } from '../../config/logger';
import { prisma } from '../db/prisma.client';
import redis from '../cache/redis.client';

export interface ShutdownConfig {
  timeout?: number;
  forceExit?: boolean;
}

const DEFAULT_SHUTDOWN_TIMEOUT = 10000;

export async function gracefulShutdown(
  server: http.Server | null,
  config: ShutdownConfig = {}
): Promise<void> {
  const { timeout = DEFAULT_SHUTDOWN_TIMEOUT, forceExit = true } = config;

  logger.info('Initiating graceful shutdown...');

  const shutdownPromises: Promise<void>[] = [];

  if (server) {
    shutdownPromises.push(closeHttpServer(server, timeout));
  }

  shutdownPromises.push(closeDatabaseConnections());
  shutdownPromises.push(closeCacheConnections());
  shutdownPromises.push(cleanupResources());

  try {
    await Promise.all(shutdownPromises);
    logger.info('Graceful shutdown completed successfully');
  } catch (error) {
    logger.error({ err: error }, 'Error during graceful shutdown');
    throw error;
  } finally {
    if (forceExit) {
      process.exit(0);
    }
  }
}

async function closeHttpServer(
  server: http.Server,
  timeout: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    logger.info('Closing HTTP server...');

    server.close((error) => {
      if (error) {
        logger.error({ err: error }, 'Error closing HTTP server');
        reject(error);
      } else {
        logger.info('HTTP server closed successfully');
        resolve();
      }
    });

    setTimeout(() => {
      logger.warn('HTTP server close timeout reached, forcing shutdown');
      server.closeAllConnections?.();
      resolve();
    }, timeout);
  });
}

async function closeDatabaseConnections(): Promise<void> {
  try {
    logger.info('Closing database connections...');
    await prisma.$disconnect();
    logger.info('Database connections closed successfully');
  } catch (error) {
    logger.error({ err: error }, 'Error closing database connections');
    throw error;
  }
}

async function closeCacheConnections(): Promise<void> {
  try {
    logger.info('Closing cache connections...');
    if (typeof (redis as any).disconnect === 'function') {
      await (redis as any).disconnect();
    } else if (typeof (redis as any).quit === 'function') {
      await (redis as any).quit();
    } else {
      logger.warn('No disconnect/quit method found on Redis client');
    }
    logger.info('Cache connections closed successfully');
  } catch (error) {
    logger.error({ err: error }, 'Error closing cache connections');
    throw error;
  }
}

async function cleanupResources(): Promise<void> {
  try {
    logger.info('Cleaning up resources...');
    if (global.gc) {
      global.gc();
      logger.info('Garbage collection triggered');
    }
    logger.info('Resource cleanup completed');
  } catch (error) {
    logger.error({ err: error }, 'Error during resource cleanup');
    throw error;
  }
}

export function setupShutdownHandlers(server: http.Server): void {
  const shutdown = () => {
    gracefulShutdown(server).catch((error) => {
      logger.error({ err: error }, 'Fatal error during shutdown');
      process.exit(1);
    });
  };

  process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received');
    shutdown();
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT signal received');
    shutdown();
  });

  process.on('uncaughtException', (error: Error) => {
    logger.error({ err: error }, 'Uncaught exception');
    shutdown();
  });

  process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
    logger.error({ reason, promise: String(promise) }, 'Unhandled rejection');
    shutdown();
  });
}

export async function checkServerHealth(): Promise<{
  isHealthy: boolean;
  checks: {
    database: boolean;
    cache: boolean;
    server: boolean;
  };
}> {
  const checks = {
    database: false,
    cache: false,
    server: false,
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch (error) {
    logger.error({ err: error }, 'Database health check failed');
  }

  try {
    await redis.ping();
    checks.cache = true;
  } catch (error) {
    logger.error({ err: error }, 'Cache health check failed');
  }

  checks.server = true;

  const isHealthy = checks.database && checks.cache && checks.server;

  return { isHealthy, checks };
}

export async function waitForPendingRequests(
  server: http.Server,
  maxWaitTime: number = 5000
): Promise<void> {
  const startTime = Date.now();

  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      server.getConnections((error, count) => {
        if (error) {
          logger.error({ err: error }, 'Error checking connections');
          clearInterval(checkInterval);
          resolve();
          return;
        }

        if (count === 0) {
          logger.info('All connections closed');
          clearInterval(checkInterval);
          resolve();
          return;
        }

        const elapsed = Date.now() - startTime;
        if (elapsed >= maxWaitTime) {
          logger.warn(`Timeout waiting for connections to close. ${count} connections remaining`);
          clearInterval(checkInterval);
          resolve();
          return;
        }

        logger.info(`Waiting for ${count} connections to close...`);
      });
    }, 500);
  });
}

export function getShutdownTimeout(): number {
  const timeout = process.env['SHUTDOWN_TIMEOUT'];
  if (timeout) {
    const parsed = parseInt(timeout, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return DEFAULT_SHUTDOWN_TIMEOUT;
}