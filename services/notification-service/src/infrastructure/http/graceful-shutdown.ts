import http from 'http';
import { Logger } from 'winston';

const SHUTDOWN_TIMEOUT_MS = 15_000;

export function gracefulShutdown(
  server: http.Server,
  logger: Logger,
  onShutdown?: () => Promise<void>,
): void {
  let isShuttingDown = false;

  const shutdown = async (signal: string): Promise<void> => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    logger.info('Graceful shutdown initiated', { signal });

    const forceExit = setTimeout(() => {
      logger.error('Graceful shutdown timed out — forcing exit');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);

    forceExit.unref();

    try {
      // Stop accepting new connections
      await new Promise<void>((resolve, reject) => {
        server.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      logger.info('HTTP server closed');

      // Run caller-supplied cleanup (DB, Kafka consumer, Redis, etc.)
      if (onShutdown) {
        await onShutdown();
        logger.info('Service cleanup complete');
      }

      clearTimeout(forceExit);
      logger.info('Graceful shutdown complete');
      process.exit(0);
    } catch (err: unknown) {
      logger.error('Error during graceful shutdown', {
        error: (err as Error).message,
      });
      clearTimeout(forceExit);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception', { error: err.message, stack: err.stack });
    shutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection', { reason });
    shutdown('unhandledRejection');
  });
}