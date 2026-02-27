import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { authClient } from '../services/auth.client';
import { productClient } from '../services/product.client';
import { orderClient } from '../services/order.client';
import { contentClient } from '../services/content.client';

// Safe imports for clients with uncertain export patterns
let AppointmentClient: any;
let CustomerClient: any;
let NotificationClient: any;
let analyticsClient: any;

try { AppointmentClient = require('../services/appointment.client').AppointmentClient || require('../services/appointment.client').default; } catch {}
try { CustomerClient = require('../services/customer.client').CustomerClient || require('../services/customer.client').default; } catch {}
try { NotificationClient = require('../services/notification.client').NotificationClient || require('../services/notification.client').default; } catch {}
try {
  const analyticsModule = require('../services/analytics.client');
  analyticsClient = analyticsModule.analyticsClient
    || analyticsModule.default
    || (analyticsModule.AnalyticsClient ? new analyticsModule.AnalyticsClient() : null);
} catch {}

interface ServiceHealth {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime?: number;
  error?: string;
}

type AnyClient = Record<string, any>;

function SuccessResponse<T>(data: T) {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString()
  };
}

async function pingClient(client: AnyClient): Promise<void> {
  if (typeof client.request === 'function') {
    await client.request({ method: 'GET', path: '/health', timeout: 5000 });
  } else if (typeof client.get === 'function') {
    await client.get('/health', { timeout: 5000 });
  } else if (typeof client.ping === 'function') {
    await client.ping();
  } else if (typeof client.health === 'function') {
    await client.health();
  } else {
    throw new Error('No compatible health check method found on client');
  }
}

export class HealthController {
  async getHealth(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.APP_VERSION || '1.0.0'
      };

      res.status(200).json(SuccessResponse(health));
    } catch (error) {
      logger.error('Health check error', { error });
      next(error);
    }
  }

  async getLiveness(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json({
        status: 'alive',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Liveness check error', { error });
      next(error);
    }
  }

  async getReadiness(_req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const appointmentClient = AppointmentClient ? new AppointmentClient() : null;
      const customerClient = CustomerClient ? new CustomerClient() : null;
      const notificationClient = NotificationClient ? new NotificationClient() : null;

      const clientMap: Array<[string, AnyClient | null]> = [
        ['auth-service', authClient],
        ['product-service', productClient],
        ['appointment-service', appointmentClient],
        ['order-payment-service', orderClient],
        ['content-service', contentClient],
        ['customer-service', customerClient],
        ['notification-service', notificationClient],
        ['analytics-service', analyticsClient ?? null]
      ];

      const services: ServiceHealth[] = await Promise.all(
        clientMap.map(([name, client]) =>
          client
            ? this.checkServiceHealth(name, client)
            : Promise.resolve<ServiceHealth>({
                name,
                status: 'unhealthy',
                error: 'Client not available'
              })
        )
      );

      const allHealthy = services.every(s => s.status === 'healthy');
      const anyDegraded = services.some(s => s.status === 'degraded');

      const overallStatus = allHealthy ? 'ready' : anyDegraded ? 'degraded' : 'not_ready';
      const statusCode = allHealthy ? 200 : anyDegraded ? 200 : 503;

      res.status(statusCode).json({
        status: overallStatus,
        timestamp: new Date().toISOString(),
        services
      });
    } catch (error) {
      logger.error('Readiness check error', { error });
      res.status(503).json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        error: 'Failed to check service health'
      });
    }
  }

  async getMetrics(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const metrics = {
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: {
          total: process.memoryUsage().heapTotal,
          used: process.memoryUsage().heapUsed,
          external: process.memoryUsage().external,
          rss: process.memoryUsage().rss
        },
        cpu: {
          user: process.cpuUsage().user,
          system: process.cpuUsage().system
        },
        process: {
          pid: process.pid,
          version: process.version,
          platform: process.platform
        }
      };

      res.status(200).json(SuccessResponse(metrics));
    } catch (error) {
      logger.error('Metrics check error', { error });
      next(error);
    }
  }

  private async checkServiceHealth(serviceName: string, client: AnyClient): Promise<ServiceHealth> {
    const startTime = Date.now();

    try {
      await pingClient(client);
      const responseTime = Date.now() - startTime;

      return {
        name: serviceName,
        status: responseTime < 1000 ? 'healthy' : 'degraded',
        responseTime
      };
    } catch (error) {
      return {
        name: serviceName,
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const healthController = new HealthController();