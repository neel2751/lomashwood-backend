import 'dotenv/config';

import { bootstrap } from './bootstrap';
import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { createServer } from './infrastructure/http/server';
import { setupGracefulShutdown } from './infrastructure/http/graceful-shutdown';
import { connectDatabase } from './infrastructure/db/prisma.client';
import { connectRedis } from './infrastructure/cache/redis.client';

async function main(): Promise<void> {
  try {
    logger.info({ service: env.SERVICE_NAME, version: env.SERVICE_VERSION, env: env.NODE_ENV }, 'Starting analytics service');

    await connectDatabase();
    logger.info('Database connection established');

    await connectRedis();
    logger.info('Redis connection established');

    await bootstrap();
    logger.info('Bootstrap completed');

    const app = createApp();
    const server = createServer(app);

    server.listen(env.PORT, () => {
      logger.info({ port: env.PORT, env: env.NODE_ENV }, `Analytics service listening on port ${env.PORT}`);
    });

    setupGracefulShutdown(server);
  } catch (error) {
    logger.error({ error }, 'Failed to start analytics service');
    process.exit(1);
  }
}

main();