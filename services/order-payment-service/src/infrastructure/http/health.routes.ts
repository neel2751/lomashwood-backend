import { Router, Request, Response } from 'express';
import { checkDatabaseHealth } from '../db/prisma.client';
import { checkRedisHealth } from '../cache/redis.health';
import { stripeClient } from '../payments/stripe.client';
import { logger } from '../../config/logger';
import { env } from '../../config/env';

type ComponentHealth = {
  status: 'healthy' | 'degraded' | 'unhealthy';
  latencyMs?: number | null;
  detail?: string;
};

type HealthResponse = {
  status: 'healthy' | 'degraded' | 'unhealthy';
  service: string;
  version: string;
  environment: string;
  uptime: number;
  timestamp: string;
  components: {
    database: ComponentHealth;
    cache: ComponentHealth;
    stripe: ComponentHealth;
  };
};

type LivenessResponse = {
  status: 'ok';
  timestamp: string;
  pid: number;
};

type ReadinessResponse = {
  status: 'ready' | 'not_ready';
  timestamp: string;
  checks: {
    database: boolean;
    cache: boolean;
  };
};

function resolveOverallStatus(
  components: HealthResponse['components'],
): HealthResponse['status'] {
  const statuses = Object.values(components).map((c) => c.status);
  if (statuses.includes('unhealthy')) return 'unhealthy';
  if (statuses.includes('degraded')) return 'degraded';
  return 'healthy';
}

export function buildHealthRouter(): Router {
  const router = Router();

  router.get('/health', async (_req: Request, res: Response): Promise<void> => {
    const start = Date.now();

    const [dbHealthy, redisDetail, stripeHealthy] = await Promise.allSettled([
      checkDatabaseHealth(),
      checkRedisHealth(),
      stripeClient.checkHealth(),
    ]);

    const database: ComponentHealth = {
      status:
        dbHealthy.status === 'fulfilled' && dbHealthy.value
          ? 'healthy'
          : 'unhealthy',
    };

    const cache: ComponentHealth =
      redisDetail.status === 'fulfilled'
        ? {
            status: redisDetail.value.status,
            latencyMs: redisDetail.value.latencyMs,
          }
        : { status: 'unhealthy' };

    const stripe: ComponentHealth = {
      status:
        stripeHealthy.status === 'fulfilled' && stripeHealthy.value
          ? 'healthy'
          : 'degraded',
    };

    const components = { database, cache, stripe };
    const overallStatus = resolveOverallStatus(components);

    const body: HealthResponse = {
      status: overallStatus,
      service: 'order-payment-service',
      version: env.APP_VERSION ?? '1.0.0',
      environment: env.NODE_ENV,
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      components,
    };

    const httpStatus = overallStatus === 'unhealthy' ? 503 : 200;

    logger.debug('Health check completed', {
      status: overallStatus,
      durationMs: Date.now() - start,
    });

    res.status(httpStatus).json(body);
  });

  router.get('/health/live', (_req: Request, res: Response): void => {
    const body: LivenessResponse = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      pid: process.pid,
    };

    res.status(200).json(body);
  });

  router.get('/health/ready', async (_req: Request, res: Response): Promise<void> => {
    const [dbHealthy, redisDetail] = await Promise.allSettled([
      checkDatabaseHealth(),
      checkRedisHealth(),
    ]);

    const databaseReady =
      dbHealthy.status === 'fulfilled' && dbHealthy.value === true;

    const cacheReady =
      redisDetail.status === 'fulfilled' &&
      redisDetail.value.status !== 'unhealthy';

    const ready = databaseReady && cacheReady;

    const body: ReadinessResponse = {
      status: ready ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
      checks: {
        database: databaseReady,
        cache: cacheReady,
      },
    };

    res.status(ready ? 200 : 503).json(body);
  });

  return router;
}