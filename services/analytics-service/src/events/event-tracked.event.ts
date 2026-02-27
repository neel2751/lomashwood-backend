import { publishEvent } from '../infrastructure/messaging/event-consumer';
import { ANALYTICS_EVENT_TOPICS } from '../infrastructure/messaging/event-topics';

export interface EventTrackedPayload {
  eventId: string;
  sessionId: string;
  visitorId: string;
  userId?: string;
  eventType: string;
  eventName: string;
  page?: string;
  createdAt: string;
}

export async function emitEventTracked(
  payload: EventTrackedPayload,
  meta?: { correlationId?: string; userId?: string },
): Promise<void> {
  await publishEvent(
    ANALYTICS_EVENT_TOPICS.PUBLISH.EVENT_TRACKED,
    payload,
    meta,
  );
}

export function buildEventTrackedPayload(
  eventId: string,
  sessionId: string,
  visitorId: string,
  eventType: string,
  eventName: string,
  options?: { userId?: string; page?: string },
): EventTrackedPayload {
  return {
    eventId,
    sessionId,
    visitorId,
    userId: options?.userId,
    eventType,
    eventName,
    page: options?.page,
    createdAt: new Date().toISOString(),
  };
}