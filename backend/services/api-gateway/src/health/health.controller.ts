import { Request, Response } from 'express';
import { config } from '../config/configuration';

interface ServiceHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  error?: string;
}

interface HealthResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  services: Record<string, ServiceHealth>;
  uptime: number;
  version: string;
}

export class HealthController {
  private static startTime = Date.now();

  static async checkHealth(req: Request, res: Response): Promise<void> {
    const healthResponse: HealthResponse = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {},
      uptime: Date.now() - this.startTime,
      version: process.env.npm_package_version || '1.0.0',
    };

    try {
      // Check all services
      const serviceChecks = await Promise.allSettled([
        this.checkService('auth', config.services.auth),
        this.checkService('products', config.services.products),
        this.checkService('orders', config.services.orders),
        this.checkService('appointments', config.services.appointments),
        this.checkService('customers', config.services.customers),
        this.checkService('content', config.services.content),
        this.checkService('notifications', config.services.notifications),
        this.checkService('analytics', config.services.analytics),
        this.checkService('upload', config.services.upload),
      ]);

      const serviceNames = [
        'auth', 'products', 'orders', 'appointments', 
        'customers', 'content', 'notifications', 'analytics', 'upload'
      ];

      serviceChecks.forEach((result, index) => {
        const serviceName = serviceNames[index];
        if (result.status === 'fulfilled') {
          healthResponse.services[serviceName] = result.value;
        } else {
          healthResponse.services[serviceName] = {
            status: 'unhealthy',
            responseTime: 0,
            error: result.reason?.message || 'Unknown error',
          };
        }
      });

      // Determine overall health
      const serviceStatuses = Object.values(healthResponse.services);
      const unhealthyServices = serviceStatuses.filter(s => s.status === 'unhealthy');
      const degradedServices = serviceStatuses.filter(s => s.status === 'degraded');

      if (unhealthyServices.length > 0) {
        healthResponse.status = 'unhealthy';
      } else if (degradedServices.length > 0) {
        healthResponse.status = 'degraded';
      }

      const statusCode = healthResponse.status === 'healthy' ? 200 : 
                      healthResponse.status === 'degraded' ? 200 : 503;

      res.status(statusCode).json(healthResponse);
    } catch (error) {
      healthResponse.status = 'unhealthy';
      res.status(503).json(healthResponse);
    }
  }

  static async checkService(serviceName: string, serviceUrl: string): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${serviceUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(config.health.timeout),
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        return {
          status: 'healthy',
          responseTime,
        };
      } else {
        return {
          status: 'degraded',
          responseTime,
          error: `HTTP ${response.status}`,
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async readiness(req: Request, res: Response): Promise<void> {
    // Simple readiness check - just check if server is running
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  }

  static async liveness(req: Request, res: Response): Promise<void> {
    // Simple liveness check - check if server is responsive
    res.status(200).json({
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
    });
  }
}
