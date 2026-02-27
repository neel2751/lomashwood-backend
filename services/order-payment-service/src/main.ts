import { bootstrap } from './bootstrap';
import { logger } from './config/logger';
import { env } from './config/env';

async function main(): Promise<void> {
  try {
    logger.info('🚀 Starting Order Payment Service...');
    logger.info(`📍 Environment: ${env.NODE_ENV}`);
    logger.info(`📍 Service: ${env.SERVICE_NAME}`);
    logger.info(`📍 Version: ${env.SERVICE_VERSION}`);

    const server = await bootstrap();

    const shutdown = async (signal: string): Promise<void> => {
      logger.info(`\n⚠️  ${signal} received. Starting graceful shutdown...`);

      try {
        await server.close();
        logger.info('✅ Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
      logger.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
    });

    process.on('uncaughtException', (error: Error) => {
      logger.error('🚨 Uncaught Exception:', error);
      process.exit(1);
    });
  } catch (error) {
    logger.error('❌ Failed to start Order Payment Service:', error);
    process.exit(1);
  }
}

main();