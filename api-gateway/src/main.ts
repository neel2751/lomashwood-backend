import 'dotenv/config';
import { bootstrap } from './bootstrap';
import { logger } from './utils/logger';
import { env } from './config/env';

process.on('uncaughtException', (error: Error) => {
  logger.error({ err: error }, 'Uncaught exception — shutting down');
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  logger.error({ reason }, 'Unhandled promise rejection — shutting down');
  process.exit(1);
});

(async () => {
  try {
    const server = await bootstrap();

    server.listen(env.PORT, () => {
      logger.info(
        {
          port: env.PORT,
          env: env.NODE_ENV,
          pid: process.pid,
        },
        `🪵 Lomash Wood API Gateway is running`,
      );
    });

    const shutdown = (signal: string) => {
      logger.info({ signal }, 'Shutdown signal received — closing server gracefully');

      server.close((err?: Error) => {
        if (err) {
          logger.error({ err }, 'Error during server close');
          process.exit(1);
        }

        logger.info('Server closed successfully');
        process.exit(0);
      });

      setTimeout(() => {
        logger.warn('Graceful shutdown timed out — forcing exit');
        process.exit(1);
      }, 10_000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error({ err: error }, 'Failed to start API Gateway');
    process.exit(1);
  }
})();