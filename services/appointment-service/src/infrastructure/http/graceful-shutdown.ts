import http from 'http';
import { PrismaClient } from '@prisma/client';
import { RedisClientType } from 'redis';
import { logger } from '../../config/logger';

export interface ShutdownOptions {
  timeout?: number;
  signals?: NodeJS.Signals[];
}

export interface ShutdownContext {
  server: http.Server;
  prisma: PrismaClient;
  redis: RedisClientType;
}

const DEFAULT_SHUTDOWN_OPTIONS: ShutdownOptions = {
  timeout: 30000,
  signals: ['SIGTERM', 'SIGINT'],
};

export function registerGracefulShutdown(
  context: ShutdownContext,
  options: ShutdownOptions = DEFAULT_SHUTDOWN_OPTIONS,
): void {
  const { timeout, signals } = { ...DEFAULT_SHUTDOWN_OPTIONS, ...options };
  const registeredSignals = signals ?? DEFAULT_SHUTDOWN_OPTIONS.signals!;

  registeredSignals.forEach((signal) => {
    process.on(signal, () => handleShutdown(signal, context, timeout!));
  });

  process.on('uncaughtException', (error: Error) => {
    logger.error({
      message: 'Uncaught exception during shutdown',
      error: error.message,
      stack: error.stack,
    });
    handleShutdown('uncaughtException', context, timeout!);
  });

  process.on('unhandledRejection', (reason: unknown) => {
    logger.error({
      message: 'Unhandled rejection during shutdown',
      reason: reason instanceof Error ? reason.message : String(reason),
    });
    handleShutdown('unhandledRejection', context, timeout!);
  });

  logger.info({
    message: 'Graceful shutdown handlers registered',
    signals: registeredSignals,
    timeout: `${timeout}ms`,
  });
}

async function handleShutdown(
  trigger: string,
  context: ShutdownContext,
  timeout: number,
): Promise<void> {
  logger.info({
    message: 'Graceful shutdown initiated',
    trigger,
    timeout: `${timeout}ms`,
  });

  const forceExitTimer = setTimeout(() => {
    logger.error({
      message: 'Graceful shutdown timed out, forcing exit',
      trigger,
      timeout: `${timeout}ms`,
    });
    process.exit(1);
  }, timeout);

  forceExitTimer.unref();

  try {
    await shutdownHttpServer(context.server);
    await shutdownDatabase(context.prisma);
    await shutdownCache(context.redis);

    clearTimeout(forceExitTimer);

    logger.info({
      message: 'Graceful shutdown completed',
      trigger,
    });

    process.exit(0);
  } catch (error) {
    clearTimeout(forceExitTimer);

    logger.error({
      message: 'Error during graceful shutdown',
      trigger,
      error: error instanceof Error ? error.message : String(error),
    });

    process.exit(1);
  }
}

async function shutdownHttpServer(server: http.Server): Promise<void> {
  logger.info({ message: 'Closing HTTP server' });

  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        logger.error({
          message: 'Error closing HTTP server',
          error: error.message,
        });
        reject(error);
        return;
      }
      logger.info({ message: 'HTTP server closed successfully' });
      resolve();
    });
  });
}

async function shutdownDatabase(prisma: PrismaClient): Promise<void> {
  logger.info({ message: 'Disconnecting from database' });

  try {
    await prisma.$disconnect();
    logger.info({ message: 'Database disconnected successfully' });
  } catch (error) {
    logger.error({
      message: 'Error disconnecting from database',
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

async function shutdownCache(redis: RedisClientType): Promise<void> {
  logger.info({ message: 'Disconnecting from Redis' });

  try {
    await redis.quit();
    logger.info({ message: 'Redis disconnected successfully' });
  } catch (error) {
    logger.error({
      message: 'Error disconnecting from Redis',
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export async function waitForConnections(
  server: http.Server,
  timeout: number = 5000,
): Promise<void> {
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      server.getConnections((error, count) => {
        if (error || count === 0) {
          clearInterval(interval);
          resolve();
        } else {
          logger.debug({
            message: 'Waiting for connections to close',
            activeConnections: count,
          });
        }
      });
    }, 500);

    setTimeout(() => {
      clearInterval(interval);
      logger.warn({
        message: 'Timeout waiting for connections to close',
        timeout: `${timeout}ms`,
      });
      resolve();
    }, timeout);
  });
}

export function trackConnections(server: http.Server): () => number {
  let connectionCount = 0;

  server.on('connection', (socket) => {
    connectionCount++;
    logger.debug({
      message: 'New connection established',
      total: connectionCount,
    });

    socket.on('close', () => {
      connectionCount--;
      logger.debug({
        message: 'Connection closed',
        total: connectionCount,
      });
    });
  });

  return () => connectionCount;
}