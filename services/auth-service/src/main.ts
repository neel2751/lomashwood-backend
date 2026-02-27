import 'dotenv/config';
import { createApp } from './bootstrap';
import { logger } from './config/logger';
import { env } from './config/env';


async function main(): Promise<void> {
  try {
    logger.info('🚀 Starting Auth Service...');
    logger.info(`📍 Environment: ${env.NODE_ENV}`);
    logger.info(`📊 Port: ${env.PORT}`);

    
    const app = createApp();

    
    app.listen(env.PORT, () => {
      logger.info(`✅ Auth Service is running on port ${env.PORT}`);
      logger.info(`🔗 Health check: http://localhost:${env.PORT}/health`);
      logger.info(`📖 API Base: http://localhost:${env.PORT}/api/v1`);
    });

    
    process.on('SIGTERM', async () => {
      logger.info('⚠️  SIGTERM signal received: closing HTTP server');
      await gracefulShutdown();
    });

    process.on('SIGINT', async () => {
      logger.info('⚠️  SIGINT signal received: closing HTTP server');
      await gracefulShutdown();
    });

    
    process.on('unhandledRejection', (reason: Error | any) => {
      logger.error('❌ Unhandled Rejection:', reason);
      throw reason;
    });

    
    process.on('uncaughtException', (error: Error) => {
      logger.error('❌ Failed to start Auth Service:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    });

  } catch (error) {
    logger.error('❌ Failed to start Auth Service:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}


async function gracefulShutdown(): Promise<void> {
  try {
    logger.info('🔄 Initiating graceful shutdown...');

    
    const { prisma } = await import('./infrastructure/db/prisma.client');
    await prisma.$disconnect();
    logger.info('✅ Database connections closed');

    
    const { redisClient } = await import('./infrastructure/cache/redis.client');
    await redisClient.disconnect();
    logger.info('✅ Redis connections closed');

    logger.info('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Failed to start Auth Service:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}


main();