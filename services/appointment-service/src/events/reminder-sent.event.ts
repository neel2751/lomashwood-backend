import { EventMetadata } from '../infrastructure/messaging/event-metadata';
import { EventTopics } from '../infrastructure/messaging/event-topics';

export enum ReminderChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
}

export enum ReminderType {
  APPOINTMENT_24H = 'APPOINTMENT_24H',
  APPOINTMENT_1H = 'APPOINTMENT_1H',
  APPOINTMENT_CONFIRMATION = 'APPOINTMENT_CONFIRMATION',
  APPOINTMENT_CANCELLATION = 'APPOINTMENT_CANCELLATION',
  APPOINTMENT_RESCHEDULED = 'APPOINTMENT_RESCHEDULED',
}

export interface ReminderSentPayload {
  reminderId: string;
  appointmentId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  appointmentDate: Date;
  appointmentType: string;
  isKitchen: boolean;
  isBedroom: boolean;
  showroomId: string | null;
  showroomName: string | null;
  showroomAddress: string | null;
  consultantId: string | null;
  consultantName: string | null;
  reminderType: ReminderType;
  channel: ReminderChannel;
  sentAt: Date;
  deliveredAt: Date | null;
  failedAt: Date | null;
  failureReason: string | null;
  retryCount: number;
  metadata: EventMetadata;
}

export interface ReminderSentEvent {
  topic: typeof EventTopics.REMINDER_SENT;
  payload: ReminderSentPayload;
}

export function buildReminderSentEvent(
  payload: Omit<ReminderSentPayload, 'metadata'> & { metadata?: Partial<EventMetadata> },
): ReminderSentEvent {
  const now = new Date();

  return {
    topic: EventTopics.REMINDER_SENT,
    payload: {
      ...payload,
      metadata: {
        eventId: payload.metadata?.eventId ?? crypto.randomUUID(),
        eventName: 'reminder.sent',
        eventVersion: payload.metadata?.eventVersion ?? '1.0.0',
        eventSource: 'appointment-service',
        correlationId: payload.metadata?.correlationId ?? crypto.randomUUID(),
        causationId: payload.metadata?.causationId ?? null,
        occurredAt: payload.metadata?.occurredAt ?? now,
        schemaVersion: payload.metadata?.schemaVersion ?? 1,
      },
    },
  };
}

export function isReminderSentEvent(event: unknown): event is ReminderSentEvent {
  if (typeof event !== 'object' || event === null) return false;
  const e = event as Record<string, unknown>;
  return e.topic === EventTopics.REMINDER_SENT && typeof e.payload === 'object';
}