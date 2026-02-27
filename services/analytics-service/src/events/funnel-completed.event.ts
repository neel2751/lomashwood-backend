import { publishEvent } from '../infrastructure/messaging/event-consumer';
import { ANALYTICS_EVENT_TOPICS } from '../infrastructure/messaging/event-topics';

export interface FunnelCompletedPayload {
  funnelId: string;
  funnelName: string;
  funnelType: string;
  userId?: string;
  sessionId?: string;
  visitorId?: string;
  totalSteps: number;
  completedAt: string;
  durationMs?: number;
  properties?: Record<string, unknown>;
}

export async function emitFunnelCompleted(
  payload: FunnelCompletedPayload,
  meta?: { correlationId?: string; userId?: string },
): Promise<void> {
  await publishEvent(
    ANALYTICS_EVENT_TOPICS.PUBLISH.FUNNEL_COMPLETED,
    payload,
    meta,
  );
}

export function buildFunnelCompletedPayload(
  funnelId: string,
  funnelName: string,
  funnelType: string,
  totalSteps: number,
  options?: {
    userId?: string;
    sessionId?: string;
    visitorId?: string;
    durationMs?: number;
    properties?: Record<string, unknown>;
  },
): FunnelCompletedPayload {
  return {
    funnelId,
    funnelName,
    funnelType,
    totalSteps,
    userId: options?.userId,
    sessionId: options?.sessionId,
    visitorId: options?.visitorId,
    durationMs: options?.durationMs,
    properties: options?.properties,
    completedAt: new Date().toISOString(),
  };
}