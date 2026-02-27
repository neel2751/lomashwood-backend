import type { IEventProducer } from '../infrastructure/messaging/event-producer';
import { buildEventMetadata, buildEventEnvelope } from '../infrastructure/messaging/event-metadata';
import { EVENT_TOPICS } from '../infrastructure/messaging/event-topics';

export interface SmsSentEventPayload {
  notificationId: string;
  to: string;
  provider: string;
  messageId?: string;
  userId?: string;
}

export async function publishSmsSentEvent(
  producer: IEventProducer,
  payload: SmsSentEventPayload,
): Promise<void> {
  const metadata = buildEventMetadata('notification-service', {
    userId: payload.userId,
  });
  const envelope = buildEventEnvelope(payload, metadata);
  await producer.publish(EVENT_TOPICS.NOTIFICATION.SMS_SENT, envelope);
}