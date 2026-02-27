import 'reflect-metadata';
import { bootstrap } from './bootstrap';
import { createServer } from './infrastructure/http/server';
import { logger } from './config/logger';
import { env } from './config/env';

async function main(): Promise<void> {
  try {
    const { app, prisma, redis } = await bootstrap();

    const server = createServer(app);

    server.listen(env.PORT, () => {
      logger.info({
        message: 'Appointment service started',
        port: env.PORT,
        environment: env.NODE_ENV,
        service: 'appointment-service',
      });
    });

    const shutdown = async (signal: string): Promise<void> => {
      logger.info({ message: `${signal} received, initiating graceful shutdown` });

      server.close(async (err) => {
        if (err) {
          logger.error({ message: 'Error closing HTTP server', error: err });
          process.exit(1);
        }

        try {
          await prisma.$disconnect();
          logger.info({ message: 'Database connection closed' });

          await redis.quit();
          logger.info({ message: 'Redis connection closed' });

          logger.info({ message: 'Graceful shutdown complete' });
          process.exit(0);
        } catch (shutdownError) {
          logger.error({ message: 'Error during shutdown', error: shutdownError });
          process.exit(1);
        }
      });

      setTimeout(() => {
        logger.error({ message: 'Forced shutdown after timeout' });
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('uncaughtException', (error: Error) => {
      logger.error({ message: 'Uncaught exception', error: error.message, stack: error.stack });
      process.exit(1);
    });

    process.on('unhandledRejection', (reason: unknown) => {
      logger.error({ message: 'Unhandled rejection', reason });
      process.exit(1);
    });
  } catch (error) {
    logger.error({ message: 'Failed to start appointment service', error });
    process.exit(1);
  }
}

main();