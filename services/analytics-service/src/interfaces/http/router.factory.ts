import type { Application } from 'express';

import { trackingRouter } from '../../app/tracking/tracking.routes';
import { funnelRouter }    from '../../app/funnels/funnel.routes';
import { dashboardRouter } from '../../app/dashboards/dashboard.routes';
import { exportRouter }    from '../../app/exports/export.routes';
import { healthRouter }    from '../../infrastructure/http/health.routes';

const API_PREFIX = '/api/v1';

export function registerRoutes(app: Application): void {
  app.use('/', healthRouter);

  app.use(`${API_PREFIX}/tracking`,   trackingRouter);
  app.use(`${API_PREFIX}/funnels`,    funnelRouter);
  app.use(`${API_PREFIX}/dashboards`, dashboardRouter);
  app.use(`${API_PREFIX}/exports`,    exportRouter);
}