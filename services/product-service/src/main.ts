import { bootstrap } from './bootstrap';
import { logger } from './config/logger';
import { config } from './config';

async function main(): Promise<void> {
  try {
    logger.info('Starting Product Service...');
    logger.info(`Environment: ${config.env}`);
    logger.info(`Port: ${config.port}`);

    const app = await bootstrap();

    const server = app.listen(config.port, () => {
      logger.info(`Product Service is running on port ${config.port}`);
      logger.info(`Health check available at http://localhost:${config.port}/health`);
    });

    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          const { prisma } = await import('./infrastructure/db/prisma.client');
          await prisma.$disconnect();
          logger.info('Database connections closed');

          const { redisClient } = await import('./infrastructure/cache/redis.client');
          if (redisClient.isOpen) {
            await redisClient.quit();
            logger.info('Redis connection closed');
          }

          logger.info('Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during graceful shutdown:', error);
          process.exit(1);
        }
      });

      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });
  } catch (error) {
    logger.error('Failed to start Product Service:', error);
    process.exit(1);
  }
}

main();