import http from 'http';
import { prisma } from '../db/prisma.client';
import { disconnectRedis } from '../cache/redis.client';
import { logger } from '../../config/logger';

const SHUTDOWN_TIMEOUT_MS = 15_000;

type ShutdownHook = () => Promise<void>;

class GracefulShutdown {
  private server: http.Server | null = null;
  private readonly hooks: ShutdownHook[] = [];
  private isShuttingDown = false;

  register(server: http.Server): void {
    this.server = server;
    this.bindSignals();
  }

  addHook(hook: ShutdownHook): void {
    this.hooks.push(hook);
  }

  private bindSignals(): void {
    process.once('SIGTERM', () => this.shutdown('SIGTERM'));
    process.once('SIGINT',  () => this.shutdown('SIGINT'));
    process.once('SIGUSR2', () => this.shutdown('SIGUSR2'));

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', { error: error.message, stack: error.stack });
      this.shutdown('uncaughtException').finally(() => process.exit(1));
    });

    process.on('unhandledRejection', (reason) => {
      const message = reason instanceof Error ? reason.message : String(reason);
      const stack   = reason instanceof Error ? reason.stack  : undefined;
      logger.error('Unhandled promise rejection', { reason: message, stack });
      this.shutdown('unhandledRejection').finally(() => process.exit(1));
    });
  }

  private async shutdown(signal: string): Promise<void> {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;

    logger.info('Graceful shutdown initiated', { signal });

    const timer = setTimeout(() => {
      logger.error('Shutdown timeout exceeded — forcing exit', {
        timeoutMs: SHUTDOWN_TIMEOUT_MS,
      });
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);

    timer.unref();

    try {
      await this.closeServer();
      await this.runHooks();
      await this.disconnectDatabase();
      await this.disconnectCache();

      logger.info('Graceful shutdown complete');
      clearTimeout(timer);
      process.exit(0);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Error during graceful shutdown', { error: message });
      clearTimeout(timer);
      process.exit(1);
    }
  }

  private closeServer(): Promise<void> {
    if (!this.server) return Promise.resolve();

    return new Promise((resolve) => {
      this.server!.close((error) => {
        if (error) {
          logger.warn('HTTP server close error', { error: error.message });
        } else {
          logger.info('HTTP server closed — no longer accepting connections');
        }
        resolve();
      });
    });
  }

  private async runHooks(): Promise<void> {
    for (const hook of this.hooks) {
      try {
        await hook();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error('Shutdown hook threw an error', { error: message });
      }
    }
  }

  private async disconnectDatabase(): Promise<void> {
    try {
      await prisma.$disconnect();
      logger.info('Database disconnected');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Failed to disconnect database', { error: message });
    }
  }

  private async disconnectCache(): Promise<void> {
    try {
      await disconnectRedis();
      logger.info('Redis disconnected');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Failed to disconnect Redis', { error: message });
    }
  }
}

export const gracefulShutdown = new GracefulShutdown();