import { Application, Router } from 'express';
import { healthRoutes } from '../../infrastructure/http/health.routes';
import { supportRoutes } from '../../app/support/support.routes';
import { loyaltyRoutes } from '../../app/loyalty/loyalty.routes';
import { logger } from '../../config/logger';

const API_PREFIX = '/api/v1';

interface RouteDefinition {
  path: string;
  router: Router;
  description: string;
}

const routes: RouteDefinition[] = [
  {
    path: '/support',
    router: supportRoutes,
    description: 'Support ticket management',
  },
  {
    path: '/loyalty',
    router: loyaltyRoutes,
    description: 'Loyalty programme management',
  },
];

export function registerRoutes(app: Application): void {
  app.use('/', healthRoutes);

  for (const { path, router, description } of routes) {
    const fullPath = `${API_PREFIX}${path}`;
    app.use(fullPath, router);
    logger.debug({ path: fullPath, description }, 'Route registered');
  }

  logger.info({ count: routes.length, prefix: API_PREFIX }, 'All routes registered');
}

export function createRouter(): Router {
  return Router({ strict: true, mergeParams: true });
}

export function getRegisteredRoutes(): Array<{ path: string; description: string }> {
  return routes.map(({ path, description }) => ({
    path: `${API_PREFIX}${path}`,
    description,
  }));
}