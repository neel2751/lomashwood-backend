import { env } from './config/env';
import { contentServer } from './infrastructure/http/server';
import { gracefulShutdown } from './infrastructure/http/graceful-shutdown';
import { prismaClient } from './infrastructure/db/prisma.client';
import { logger } from './config/logger';

export async function bootstrap(): Promise<void> {
  logger.info({}, 'Bootstrapping content-service…');

  logger.info({ nodeEnv: env.NODE_ENV }, 'Environment validated');

  try {
    await prismaClient.$connect();
    logger.info({}, 'PostgreSQL connection established');
  } catch (error) {
    logger.error({ error }, 'Failed to connect to PostgreSQL');
    throw error;
  }

  await contentServer.start();

  logger.info(
    { port: env.PORT, env: env.NODE_ENV },
    'content-service is ready',
  );

  gracefulShutdown.setup(contentServer.getServer()!, async () => {
    logger.info({}, 'Running content-service shutdown hooks…');

    await prismaClient.$disconnect();
    logger.info({}, 'Prisma disconnected');
  });
}