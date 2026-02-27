import type { IEventProducer } from '../infrastructure/messaging/event-producer';
import { buildEventMetadata, buildEventEnvelope } from '../infrastructure/messaging/event-metadata';
import { EVENT_TOPICS } from '../infrastructure/messaging/event-topics';

export interface EmailSentEventPayload {
  notificationId: string;
  to: string;
  subject: string;
  provider: string;
  messageId?: string;
  userId?: string;
}

export async function publishEmailSentEvent(
  producer: IEventProducer,
  payload: EmailSentEventPayload,
): Promise<void> {
  const metadata = buildEventMetadata('notification-service', {
    userId: payload.userId,
  });
  const envelope = buildEventEnvelope(payload, metadata);
  await producer.publish(EVENT_TOPICS.NOTIFICATION.EMAIL_SENT, envelope);
}