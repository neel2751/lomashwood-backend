import type { IEventProducer } from '../infrastructure/messaging/event-producer';
import { buildEventMetadata, buildEventEnvelope } from '../infrastructure/messaging/event-metadata';
import { EVENT_TOPICS } from '../infrastructure/messaging/event-topics';

export type NotificationChannel = 'EMAIL' | 'SMS' | 'PUSH';

export interface NotificationFailedEventPayload {
  notificationId: string;
  channel: NotificationChannel;
  provider: string;
  recipient: string;
  errorCode?: string;
  errorMessage?: string;
  userId?: string;
}

export async function publishNotificationFailedEvent(
  producer: IEventProducer,
  payload: NotificationFailedEventPayload,
): Promise<void> {
  const metadata = buildEventMetadata('notification-service', {
    userId: payload.userId,
  });
  const envelope = buildEventEnvelope(payload, metadata);
  await producer.publish(EVENT_TOPICS.NOTIFICATION.NOTIFICATION_FAILED, envelope);
}