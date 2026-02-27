/**
 * content-service/src/infrastructure/http/health.routes.ts
 *
 * Health check routes for the Content Service.
 * Provides:
 *   - Liveness probe (is the service running?)
 *   - Readiness probe (can the service handle traffic?)
 *   - Detailed health status (dependencies check)
 *   - Metrics endpoint (basic service metrics)
 */

import { Router, Request, Response } from 'express';
import { prismaClient } from '../db/prisma.client';
import { s3Client } from '../storage/s3.client';
import { cdnClient } from '../storage/cdn.client';
import { eventProducer } from '../messaging/event-producer';
import { isHealthChecksFailing } from './graceful-shutdown';
import { logger } from '../../config/logger';
import { envConfig } from '../../config/env';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  service: string;
}

export interface ReadinessStatus extends HealthStatus {
  dependencies: {
    database: DependencyStatus;
    storage: DependencyStatus;
    cdn: DependencyStatus;
    messaging: DependencyStatus;
  };
}

export interface DependencyStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message?: string;
  responseTime?: number;
  lastChecked?: string;
}

export interface MetricsData {
  uptime: number;
  timestamp: string;
  memory: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  cpu: {
    user: number;
    system: number;
  };
  eventLoop: {
    delay: number;
  };
}

// ---------------------------------------------------------------------------
// Health Router
// ---------------------------------------------------------------------------
export const healthRouter: Router = Router();

// Cache for dependency checks (avoid checking too frequently)
let lastDependencyCheck: {
  timestamp: number;
  status: ReadinessStatus['dependencies'];
} | null = null;

const DEPENDENCY_CHECK_CACHE_TTL = 10_000; // 10 seconds

// ---------------------------------------------------------------------------
// Liveness Probe
// Simple check that the process is alive and responding
// ---------------------------------------------------------------------------
healthRouter.get('/live', (_req: Request, res: Response) => {
  // If graceful shutdown is in progress, fail liveness
  if (isHealthChecksFailing()) {
    logger.debug({
      context: 'LivenessProbe',
      status: 'unhealthy',
      reason: 'Graceful shutdown in progress',
    });

    return res.status(503).json({
      status: 'unhealthy',
      message: 'Service is shutting down',
      timestamp: new Date().toISOString(),
    });
  }

  const response: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: envConfig.server.version,
    environment: envConfig.server.environment,
    service: 'content-service',
  };

  logger.debug({
    context: 'LivenessProbe',
    status: response.status,
  });

  return res.status(200).json(response);
});

// ---------------------------------------------------------------------------
// Readiness Probe
// Checks if the service can handle traffic (dependencies are healthy)
// ---------------------------------------------------------------------------
healthRouter.get('/ready', async (_req: Request, res: Response) => {
  // If graceful shutdown is in progress, fail readiness
  if (isHealthChecksFailing()) {
    logger.debug({
      context: 'ReadinessProbe',
      status: 'unhealthy',
      reason: 'Graceful shutdown in progress',
    });

    return res.status(503).json({
      status: 'unhealthy',
      message: 'Service is shutting down',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    // Check dependencies (with caching)
    const dependencies = await checkDependencies();

    // Determine overall status
    const allHealthy = Object.values(dependencies).every(
      (dep) => dep.status === 'healthy',
    );
    const anyUnhealthy = Object.values(dependencies).some(
      (dep) => dep.status === 'unhealthy',
    );

    const overallStatus = anyUnhealthy
      ? 'unhealthy'
      : allHealthy
        ? 'healthy'
        : 'degraded';

    const response: ReadinessStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: envConfig.server.version,
      environment: envConfig.server.environment,
      service: 'content-service',
      dependencies,
    };

    logger.debug({
      context: 'ReadinessProbe',
      status: overallStatus,
      dependencies: Object.entries(dependencies).map(([name, dep]) => ({
        name,
        status: dep.status,
      })),
    });

    const statusCode = overallStatus === 'healthy' ? 200 : 503;
    return res.status(statusCode).json(response);
  } catch (error) {
    logger.error({
      context: 'ReadinessProbe',
      error,
      message: 'Health check failed',
    });

    return res.status(503).json({
      status: 'unhealthy',
      message: 'Health check failed',
      timestamp: new Date().toISOString(),
      error: (error as Error).message,
    });
  }
});

// ---------------------------------------------------------------------------
// Detailed Health Status
// Comprehensive health check with all dependency details
// ---------------------------------------------------------------------------
healthRouter.get('/status', async (_req: Request, res: Response) => {
  try {
    const dependencies = await checkDependencies();

    const allHealthy = Object.values(dependencies).every(
      (dep) => dep.status === 'healthy',
    );
    const anyUnhealthy = Object.values(dependencies).some(
      (dep) => dep.status === 'unhealthy',
    );

    const overallStatus = anyUnhealthy
      ? 'unhealthy'
      : allHealthy
        ? 'healthy'
        : 'degraded';

    const response = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: envConfig.server.version,
      environment: envConfig.server.environment,
      service: 'content-service',
      dependencies,
      system: {
        platform: process.platform,
        nodeVersion: process.version,
        pid: process.pid,
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
      },
    };

    logger.info({
      context: 'HealthStatus',
      status: overallStatus,
    });

    const statusCode = overallStatus === 'healthy' ? 200 : 503;
    return res.status(statusCode).json(response);
  } catch (error) {
    logger.error({
      context: 'HealthStatus',
      error,
      message: 'Health status check failed',
    });

    return res.status(503).json({
      status: 'unhealthy',
      message: 'Health status check failed',
      timestamp: new Date().toISOString(),
      error: (error as Error).message,
    });
  }
});

// ---------------------------------------------------------------------------
// Metrics Endpoint
// Basic service metrics for monitoring
// ---------------------------------------------------------------------------
healthRouter.get('/metrics', (_req: Request, res: Response) => {
  const memory = process.memoryUsage();
  const cpu = process.cpuUsage();

  const metrics: MetricsData = {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    memory: {
      heapUsed: memory.heapUsed,
      heapTotal: memory.heapTotal,
      external: memory.external,
      rss: memory.rss,
    },
    cpu: {
      user: cpu.user,
      system: cpu.system,
    },
    eventLoop: {
      delay: 0, // Could be measured with async-hooks or perf_hooks
    },
  };

  logger.debug({
    context: 'Metrics',
    metrics,
  });

  return res.status(200).json(metrics);
});

// ---------------------------------------------------------------------------
// Dependency Health Checks
// ---------------------------------------------------------------------------
async function checkDependencies(): Promise<ReadinessStatus['dependencies']> {
  const now = Date.now();

  // Return cached result if still valid
  if (
    lastDependencyCheck &&
    now - lastDependencyCheck.timestamp < DEPENDENCY_CHECK_CACHE_TTL
  ) {
    return lastDependencyCheck.status;
  }

  // Run all checks in parallel
  const [database, storage, cdn, messaging] = await Promise.allSettled([
    checkDatabase(),
    checkStorage(),
    checkCDN(),
    checkMessaging(),
  ]);

  const dependencies: ReadinessStatus['dependencies'] = {
    database: getDependencyStatus(database),
    storage: getDependencyStatus(storage),
    cdn: getDependencyStatus(cdn),
    messaging: getDependencyStatus(messaging),
  };

  // Cache the results
  lastDependencyCheck = {
    timestamp: now,
    status: dependencies,
  };

  return dependencies;
}

// ---------------------------------------------------------------------------
// Individual Dependency Checks
// ---------------------------------------------------------------------------
async function checkDatabase(): Promise<DependencyStatus> {
  const start = Date.now();

  try {
    // Simple query to check database connectivity
    await prismaClient.$queryRaw`SELECT 1`;

    return {
      status: 'healthy',
      responseTime: Date.now() - start,
      lastChecked: new Date().toISOString(),
    };
  } catch (error) {
    logger.error({
      context: 'HealthCheck',
      dependency: 'database',
      error,
    });

    return {
      status: 'unhealthy',
      message: (error as Error).message,
      responseTime: Date.now() - start,
      lastChecked: new Date().toISOString(),
    };
  }
}

async function checkStorage(): Promise<DependencyStatus> {
  const start = Date.now();

  try {
    const isHealthy = await s3Client.healthCheck();

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      message: isHealthy ? undefined : 'S3 health check failed',
      responseTime: Date.now() - start,
      lastChecked: new Date().toISOString(),
    };
  } catch (error) {
    logger.error({
      context: 'HealthCheck',
      dependency: 'storage',
      error,
    });

    return {
      status: 'unhealthy',
      message: (error as Error).message,
      responseTime: Date.now() - start,
      lastChecked: new Date().toISOString(),
    };
  }
}

async function checkCDN(): Promise<DependencyStatus> {
  const start = Date.now();

  try {
    const isHealthy = await cdnClient.healthCheck();

    return {
      status: isHealthy ? 'healthy' : 'degraded',
      message: isHealthy ? undefined : 'CDN health check failed',
      responseTime: Date.now() - start,
      lastChecked: new Date().toISOString(),
    };
  } catch (error) {
    logger.warn({
      context: 'HealthCheck',
      dependency: 'cdn',
      error,
      message: 'CDN check failed - marking as degraded',
    });

    // CDN is not critical - mark as degraded instead of unhealthy
    return {
      status: 'degraded',
      message: (error as Error).message,
      responseTime: Date.now() - start,
      lastChecked: new Date().toISOString(),
    };
  }
}

async function checkMessaging(): Promise<DependencyStatus> {
  const start = Date.now();

  try {
    const isHealthy = await eventProducer.healthCheck();

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      message: isHealthy ? undefined : 'Message broker connection failed',
      responseTime: Date.now() - start,
      lastChecked: new Date().toISOString(),
    };
  } catch (error) {
    logger.error({
      context: 'HealthCheck',
      dependency: 'messaging',
      error,
    });

    return {
      status: 'unhealthy',
      message: (error as Error).message,
      responseTime: Date.now() - start,
      lastChecked: new Date().toISOString(),
    };
  }
}

// ---------------------------------------------------------------------------
// Utility: Extract Status from Promise Result
// ---------------------------------------------------------------------------
function getDependencyStatus(
  result: PromiseSettledResult<DependencyStatus>,
): DependencyStatus {
  if (result.status === 'fulfilled') {
    return result.value;
  }

  return {
    status: 'unhealthy',
    message: result.reason?.message ?? 'Check failed',
    lastChecked: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Startup Check
// Verify all dependencies are healthy before marking service as ready
// ---------------------------------------------------------------------------
export async function performStartupHealthCheck(): Promise<void> {
  logger.info({
    context: 'StartupHealthCheck',
    message: 'Performing startup health check',
  });

  const dependencies = await checkDependencies();

  const unhealthyDeps = Object.entries(dependencies)
    .filter(([_, dep]) => dep.status === 'unhealthy')
    .map(([name]) => name);

  if (unhealthyDeps.length > 0) {
    const message = `Startup health check failed. Unhealthy dependencies: ${unhealthyDeps.join(', ')}`;

    logger.error({
      context: 'StartupHealthCheck',
      message,
      dependencies,
    });

    throw new Error(message);
  }

  logger.info({
    context: 'StartupHealthCheck',
    message: 'All dependencies healthy',
    dependencies: Object.entries(dependencies).map(([name, dep]) => ({
      name,
      status: dep.status,
      responseTime: dep.responseTime,
    })),
  });
}