import { publishEvent } from '../infrastructure/messaging/event-consumer';
import { ANALYTICS_EVENT_TOPICS } from '../infrastructure/messaging/event-topics';

export interface DashboardRefreshedPayload {
  dashboardId: string;
  dashboardName: string;
  dashboardType: string;
  widgetCount: number;
  triggeredBy: 'cron' | 'manual' | 'event';
  refreshedAt: string;
}

export async function emitDashboardRefreshed(
  payload: DashboardRefreshedPayload,
  meta?: { correlationId?: string; userId?: string },
): Promise<void> {
  await publishEvent(
    ANALYTICS_EVENT_TOPICS.PUBLISH.DASHBOARD_REFRESHED,
    payload,
    meta,
  );
}

export function buildDashboardRefreshedPayload(
  dashboardId: string,
  dashboardName: string,
  dashboardType: string,
  widgetCount: number,
  triggeredBy: DashboardRefreshedPayload['triggeredBy'] = 'cron',
): DashboardRefreshedPayload {
  return {
    dashboardId,
    dashboardName,
    dashboardType,
    widgetCount,
    triggeredBy,
    refreshedAt: new Date().toISOString(),
  };
}