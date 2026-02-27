import 'reflect-metadata';

import { logger } from './config/logger';
import { bootstrap } from './bootstrap';

process.on('uncaughtException', (error: Error) => {
  logger.error(
    { error: error.message, stack: error.stack },
    'Uncaught exception — shutting down',
  );
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  logger.error({ reason }, 'Unhandled promise rejection — shutting down');
  process.exit(1);
});

bootstrap().catch((error: Error) => {
  logger.error(
    { error: error.message, stack: error.stack },
    'Fatal error during bootstrap',
  );
  process.exit(1);
});