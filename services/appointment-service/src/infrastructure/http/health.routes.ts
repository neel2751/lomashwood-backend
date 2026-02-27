import { Router, Request, Response } from 'express';
import { prismaClient } from '../db/prisma.client';
import { checkRedisHealth } from '../cache/redis.health';
import { logger } from '../../config/logger';
import { env } from '../../config/env';

const router = Router();

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  service: string;
  version: string;
  environment: string;
  timestamp: string;
  uptime: number;
  checks: {
    database: DatabaseHealthCheck;
    cache: CacheHealthCheck;
    memory: MemoryHealthCheck;
  };
}

interface DatabaseHealthCheck {
  status: 'healthy' | 'unhealthy';
  latencyMs?: number;
  error?: string;
}

interface CacheHealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  connected: boolean;
  latencyMs?: number;
  memoryUsageMb?: number;
  error?: string;
}

interface MemoryHealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  heapUsedMb: number;
  heapTotalMb: number;
  externalMb: number;
  rssMb: number;
  usagePercent: number;
}

async function checkDatabaseHealth(): Promise<DatabaseHealthCheck> {
  try {
    const start = performance.now();
    await prismaClient.$queryRaw`SELECT 1`;
    const latencyMs = parseFloat((performance.now() - start).toFixed(2));

    return { status: 'healthy', latencyMs };
  } catch (error) {
    logger.error({
      message: 'Database health check failed',
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function checkMemoryHealth(): MemoryHealthCheck {
  const memUsage = process.memoryUsage();
  const heapUsedMb = parseFloat((memUsage.heapUsed / 1024 / 1024).toFixed(2));
  const heapTotalMb = parseFloat((memUsage.heapTotal / 1024 / 1024).toFixed(2));
  const externalMb = parseFloat((memUsage.external / 1024 / 1024).toFixed(2));
  const rssMb = parseFloat((memUsage.rss / 1024 / 1024).toFixed(2));
  const usagePercent = parseFloat(((heapUsedMb / heapTotalMb) * 100).toFixed(2));

  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  if (usagePercent >= 95) {
    status = 'unhealthy';
  } else if (usagePercent >= 80) {
    status = 'degraded';
  }

  return {
    status,
    heapUsedMb,
    heapTotalMb,
    externalMb,
    rssMb,
    usagePercent,
  };
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const [database, cache] = await Promise.all([
      checkDatabaseHealth(),
      checkRedisHealth(),
    ]);

    const memory = checkMemoryHealth();

    const overallStatus: HealthStatus['status'] =
      database.status === 'unhealthy' || cache.status === 'unhealthy' || memory.status === 'unhealthy'
        ? 'unhealthy'
        : database.status === 'healthy' && cache.status === 'healthy' && memory.status === 'healthy'
          ? 'healthy'
          : 'degraded';

    const healthStatus: HealthStatus = {
      status: overallStatus,
      service: 'appointment-service',
      version: env.APP_VERSION ?? '1.0.0',
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        database,
        cache: {
          status: cache.status,
          connected: cache.connected,
          latencyMs: cache.latencyMs,
          memoryUsageMb: cache.memoryUsageMb,
          error: cache.error,
        },
        memory,
      },
    };

    const statusCode = overallStatus === 'healthy'
      ? 200
      : overallStatus === 'degraded'
        ? 200
        : 503;

    res.status(statusCode).json(healthStatus);
  } catch (error) {
    logger.error({
      message: 'Health check failed',
      error: error instanceof Error ? error.message : String(error),
    });

    res.status(503).json({
      status: 'unhealthy',
      service: 'appointment-service',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Health check failed',
    });
  }
});

router.get('/live', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    service: 'appointment-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

router.get('/ready', async (req: Request, res: Response) => {
  try {
    const [database, cache] = await Promise.all([
      checkDatabaseHealth(),
      checkRedisHealth(),
    ]);

    const isReady = database.status === 'healthy' && cache.connected;

    if (!isReady) {
      res.status(503).json({
        status: 'not_ready',
        service: 'appointment-service',
        timestamp: new Date().toISOString(),
        checks: {
          database: database.status,
          cache: cache.status,
        },
      });
      return;
    }

    res.status(200).json({
      status: 'ready',
      service: 'appointment-service',
      timestamp: new Date().toISOString(),
      checks: {
        database: database.status,
        cache: cache.status,
      },
    });
  } catch (error) {
    logger.error({
      message: 'Readiness check failed',
      error: error instanceof Error ? error.message : String(error),
    });

    res.status(503).json({
      status: 'not_ready',
      service: 'appointment-service',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Readiness check failed',
    });
  }
});

router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    res.status(200).json({
      service: 'appointment-service',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        heapUsedMb: parseFloat((memUsage.heapUsed / 1024 / 1024).toFixed(2)),
        heapTotalMb: parseFloat((memUsage.heapTotal / 1024 / 1024).toFixed(2)),
        externalMb: parseFloat((memUsage.external / 1024 / 1024).toFixed(2)),
        rssMb: parseFloat((memUsage.rss / 1024 / 1024).toFixed(2)),
      },
      cpu: {
        userMs: parseFloat((cpuUsage.user / 1000).toFixed(2)),
        systemMs: parseFloat((cpuUsage.system / 1000).toFixed(2)),
      },
      process: {
        pid: process.pid,
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      },
    });
  } catch (error) {
    logger.error({
      message: 'Metrics endpoint failed',
      error: error instanceof Error ? error.message : String(error),
    });

    res.status(500).json({
      error: 'Failed to retrieve metrics',
    });
  }
});

export { router as healthRoutes };