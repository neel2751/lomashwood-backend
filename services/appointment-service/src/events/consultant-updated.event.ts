import { EventMetadata } from '../infrastructure/messaging/event-metadata';
import { EventTopics } from '../infrastructure/messaging/event-topics';

export enum ConsultantUpdateType {
  PROFILE_UPDATED = 'PROFILE_UPDATED',
  AVAILABILITY_UPDATED = 'AVAILABILITY_UPDATED',
  SHOWROOM_ASSIGNED = 'SHOWROOM_ASSIGNED',
  SHOWROOM_UNASSIGNED = 'SHOWROOM_UNASSIGNED',
  ACTIVATED = 'ACTIVATED',
  DEACTIVATED = 'DEACTIVATED',
  SPECIALISATION_UPDATED = 'SPECIALISATION_UPDATED',
}

export enum ConsultantSpecialisation {
  KITCHEN = 'KITCHEN',
  BEDROOM = 'BEDROOM',
  BOTH = 'BOTH',
}

export interface ConsultantAvailabilitySlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface ConsultantPreviousState {
  name: string | null;
  email: string | null;
  phone: string | null;
  specialisation: ConsultantSpecialisation | null;
  showroomId: string | null;
  showroomName: string | null;
  isActive: boolean | null;
  availabilitySlots: ConsultantAvailabilitySlot[] | null;
}

export interface ConsultantCurrentState {
  name: string;
  email: string;
  phone: string;
  specialisation: ConsultantSpecialisation;
  showroomId: string | null;
  showroomName: string | null;
  isActive: boolean;
  availabilitySlots: ConsultantAvailabilitySlot[];
}

export interface ConsultantUpdatedPayload {
  consultantId: string;
  updateType: ConsultantUpdateType;
  updatedByAdminId: string;
  previous: ConsultantPreviousState;
  current: ConsultantCurrentState;
  affectedAppointmentIds: string[];
  updatedAt: Date;
  metadata: EventMetadata;
}

export interface ConsultantUpdatedEvent {
  topic: typeof EventTopics.CONSULTANT_UPDATED;
  payload: ConsultantUpdatedPayload;
}

export function buildConsultantUpdatedEvent(
  payload: Omit<ConsultantUpdatedPayload, 'metadata'> & { metadata?: Partial<EventMetadata> },
): ConsultantUpdatedEvent {
  const now = new Date();

  return {
    topic: EventTopics.CONSULTANT_UPDATED,
    payload: {
      ...payload,
      metadata: {
        eventId: payload.metadata?.eventId ?? crypto.randomUUID(),
        eventName: 'consultant.updated',
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

export function isConsultantUpdatedEvent(event: unknown): event is ConsultantUpdatedEvent {
  if (typeof event !== 'object' || event === null) return false;
  const e = event as Record<string, unknown>;
  return e.topic === EventTopics.CONSULTANT_UPDATED && typeof e.payload === 'object';
}