import type { Server } from 'http';

import { createApp }             from './app';
import { env }                   from './config/env';
import { createLogger }          from './config/logger';
import { prisma }                from './infrastructure/db/prisma.client';
import { runMigrations }         from './infrastructure/db/migrations';
import { redisClient }           from './infrastructure/cache/redis.client';
import { checkRedisHealth }      from './infrastructure/cache/redis.health';
import { startEmailWorker }      from './infrastructure/messaging/workers/email.worker';
import { startSmsWorker }        from './infrastructure/messaging/workers/sms.worker';
import { startPushWorker }       from './infrastructure/messaging/workers/push.worker';
import { registerCronJobs }      from './interfaces/cron/scheduler';
import { registerEventHandlers } from './interfaces/events/handlers';
import { gracefulShutdown }      from './infrastructure/http/graceful-shutdown';

const logger = createLogger('bootstrap');

export async function bootstrap(): Promise<Server> {
  logger.info('Bootstrapping notification service...');

  logger.info('Step 1/9 — Validating environment...');
  validateEnvironment();

  logger.info('Step 2/9 — Running database migrations...');
  await runMigrations();

  logger.info('Step 3/9 — Connecting to PostgreSQL...');
  await connectDatabase();

  logger.info('Step 4/9 — Connecting to Redis...');
  await connectRedis();

  logger.info('Step 5/9 — Registering event handlers...');
  registerEventHandlers();

  logger.info('Step 6/9 — Starting queue workers...');
  await startQueueWorkers();

  logger.info('Step 7/9 — Registering cron jobs...');
  registerCronJobs();

  logger.info('Step 8/9 — Starting HTTP server...');
  const server = await startHttpServer();

  logger.info('Step 9/9 — Registering shutdown handlers...');
  registerShutdownHandlers(server);

  logger.info(
    {
      port:    env.PORT,
      env:     env.NODE_ENV,
      service: env.SERVICE_NAME,
      version: env.SERVICE_VERSION,
    },
    `Notification service is ready on port ${env.PORT}`,
  );

  return server;
}

function validateEnvironment(): void {
  const required: string[] = [
    'DATABASE_URL',
    'REDIS_HOST',
    'REDIS_PORT',
    'JWT_SECRET',
    'INTERNAL_SERVICE_SECRET',
  ];

  const missing = required.filter((key) => {
    const val = process.env[key];
    return val === undefined || val.trim() === '';
  });

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
      `Check your .env file against .env.example.`,
    );
  }

  logger.info('Environment validation passed.');
}

async function connectDatabase(): Promise<void> {
  const timeoutMs = env.DATABASE_CONNECTION_TIMEOUT_MS;

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`PostgreSQL connection timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    prisma
      .$connect()
      .then(() => {
        clearTimeout(timer);
        resolve();
      })
      .catch((err: unknown) => {
        clearTimeout(timer);
        reject(err);
      });
  });

  await prisma.$queryRaw`SELECT 1`;

  logger.info('PostgreSQL connected successfully.');
}

async function connectRedis(): Promise<void> {
  const healthy = await checkRedisHealth(redisClient);

  if (!healthy) {
    throw new Error(
      'Redis health check failed — service cannot start without a healthy Redis connection.',
    );
  }

  logger.info('Redis connected successfully.');
}

async function startQueueWorkers(): Promise<void> {
  const workers: Array<{ name: string; start: () => Promise<void> }> = [];

  if (env.FEATURE_EMAIL_ENABLED) {
    workers.push({ name: 'email-worker', start: startEmailWorker });
  }

  if (env.FEATURE_SMS_ENABLED) {
    workers.push({ name: 'sms-worker', start: startSmsWorker });
  }

  if (env.FEATURE_PUSH_ENABLED) {
    workers.push({ name: 'push-worker', start: startPushWorker });
  }

  await Promise.all(
    workers.map(async ({ name, start }) => {
      try {
        await start();
        logger.info(`Queue worker started: ${name}`);
      } catch (err: unknown) {
        logger.error({ err, worker: name }, `Failed to start queue worker: ${name}`);
        throw err;
      }
    }),
  );

  logger.info(
    `${workers.length} queue worker(s) started: ${workers.map((w) => w.name).join(', ')}`,
  );
}

async function startHttpServer(): Promise<Server> {
  const app  = createApp();
  const port = env.PORT;
  const host = '0.0.0.0';

  return new Promise<Server>((resolve, reject) => {
    const server = app.listen(port, host, () => {
      logger.info(
        { host, port, prefix: env.API_PREFIX },
        `HTTP server listening on ${host}:${port}`,
      );
      resolve(server);
    });

    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        logger.error({ port }, `Port ${port} is already in use.`);
      }
      reject(err);
    });

    server.keepAliveTimeout = env.REQUEST_KEEP_ALIVE_TIMEOUT_MS;
    server.headersTimeout    = env.REQUEST_KEEP_ALIVE_TIMEOUT_MS + 1000;
  });
}

function registerShutdownHandlers(server: Server): void {
  const onShutdown = async (): Promise<void> => {
    logger.info('Shutdown initiated — draining connections...');

    await gracefulShutdown(server, {
      onShutdown: async () => {
        logger.info('Closing queue workers...');
        await Promise.allSettled([
          emailQueue.close(),
          smsQueue.close(),
          pushQueue.close(),
        ]);

        logger.info('Disconnecting Prisma...');
        await prisma.$disconnect();

        logger.info('Disconnecting Redis...');
        await redisClient.quit();

        logger.info('All connections closed cleanly.');
      },
    });
  };

  process.on('SIGTERM', () => { void onShutdown(); });
  process.on('SIGINT',  () => { void onShutdown(); });
}