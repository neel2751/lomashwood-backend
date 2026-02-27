
import 'reflect-metadata';
import { bootstrap } from './bootstrap';
import { createLogger } from './config/logger';

const logger = createLogger('main');

async function main(): Promise<void> {
  logger.info('Starting Lomash Wood Notification Service...');

  const server = await bootstrap();

 

  const shutdown = (signal: string): void => {
    logger.info(`Received ${signal} — initiating graceful shutdown...`);

    const timeoutMs = Number(process.env['SHUTDOWN_TIMEOUT_MS'] ?? 10_000);

    const forceExitTimer = setTimeout(() => {
      logger.error('Graceful shutdown timed out — forcing process exit.');
      process.exit(1);
    }, timeoutMs);

    
    forceExitTimer.unref();

    server.close((err?: Error) => {
      if (err !== undefined) {
        logger.error({ err }, 'Error during server close');
        process.exit(1);
      }

      logger.info('HTTP server closed successfully.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => { shutdown('SIGTERM'); });
  process.on('SIGINT',  () => { shutdown('SIGINT');  });


  process.on('unhandledRejection', (reason: unknown) => {
    logger.error({ reason }, 'Unhandled promise rejection — shutting down.');
    process.exit(1);
  });

  process.on('uncaughtException', (err: Error) => {
    logger.error({ err }, 'Uncaught exception — shutting down.');
    process.exit(1);
  });
}

main().catch((err: unknown) => {
  
  console.error('[main] Fatal error during startup:', err);
  process.exit(1);
});