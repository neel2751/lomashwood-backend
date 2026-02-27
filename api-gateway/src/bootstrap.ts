import http from 'http';
import { validateEnv } from './config/env';
import { createServer } from './server';
import { logger } from './utils/logger';

export async function bootstrap(): Promise<http.Server> {
 
  validateEnv();
  logger.info('Environment variables validated');

  
  const server = createServer();
  logger.info('HTTP server created');


  await checkDownstreamServices();

  return server;
}

async function checkDownstreamServices(): Promise<void> {
  const { serviceConfig } = await import('./config/services');

  const checks = Object.entries(serviceConfig).map(async ([name, url]) => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3_000);

      const res = await fetch(`${url}/health`, { signal: controller.signal });
      clearTimeout(timeout);

      if (res.ok) {
        logger.info({ service: name, url }, 'Downstream service reachable');
      } else {
        logger.warn({ service: name, url, status: res.status }, 'Downstream service unhealthy');
      }
    } catch (err) {
      logger.warn(
        { service: name, url, err },
        'Downstream service unreachable — gateway will start anyway',
      );
    }
  });

  await Promise.allSettled(checks);
}