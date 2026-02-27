import { EventPayload, BookingCreatedPayload, BookingCancelledPayload, ReminderSentPayload, ConsultantUpdatedPayload } from './payload.types';

export type EventHandler<T = unknown> = (payload: T) => Promise<void>;

export interface HandlerRegistry {
  [topic: string]: EventHandler;
}

async function handleBookingCreated(payload: BookingCreatedPayload): Promise<void> {
  const { bookingId, customerId, consultantId, appointmentType, scheduledAt, isKitchen, isBedroom } = payload;

  if (isKitchen && isBedroom) {
    await notifyMultipleTeams(bookingId, customerId);
  }

  await scheduleReminder(bookingId, consultantId, scheduledAt);
  await sendBookingConfirmationEmail(bookingId, customerId, appointmentType);
}

async function handleBookingCancelled(payload: BookingCancelledPayload): Promise<void> {
  const { bookingId, customerId, consultantId, cancelledAt, reason } = payload;

  await cancelScheduledReminders(bookingId);
  await releaseConsultantSlot(consultantId, cancelledAt);
  await sendCancellationEmail(bookingId, customerId, reason);
}

async function handleReminderSent(payload: ReminderSentPayload): Promise<void> {
  const { bookingId, customerId, channel, sentAt } = payload;

  await markReminderDelivered(bookingId, channel, sentAt);
  await logReminderActivity(bookingId, customerId, channel);
}

async function handleConsultantUpdated(payload: ConsultantUpdatedPayload): Promise<void> {
  const { consultantId, updatedFields } = payload;

  await refreshConsultantCache(consultantId);

  if (updatedFields.includes('availability')) {
    await rebuildAvailabilitySlots(consultantId);
  }
}

async function notifyMultipleTeams(bookingId: string, customerId: string): Promise<void> {
  void bookingId;
  void customerId;
}

async function scheduleReminder(bookingId: string, consultantId: string, scheduledAt: Date): Promise<void> {
  void bookingId;
  void consultantId;
  void scheduledAt;
}

async function sendBookingConfirmationEmail(bookingId: string, customerId: string, appointmentType: string): Promise<void> {
  void bookingId;
  void customerId;
  void appointmentType;
}

async function cancelScheduledReminders(bookingId: string): Promise<void> {
  void bookingId;
}

async function releaseConsultantSlot(consultantId: string, cancelledAt: Date): Promise<void> {
  void consultantId;
  void cancelledAt;
}

async function sendCancellationEmail(bookingId: string, customerId: string, reason?: string): Promise<void> {
  void bookingId;
  void customerId;
  void reason;
}

async function markReminderDelivered(bookingId: string, channel: string, sentAt: Date): Promise<void> {
  void bookingId;
  void channel;
  void sentAt;
}

async function logReminderActivity(bookingId: string, customerId: string, channel: string): Promise<void> {
  void bookingId;
  void customerId;
  void channel;
}

async function refreshConsultantCache(consultantId: string): Promise<void> {
  void consultantId;
}

async function rebuildAvailabilitySlots(consultantId: string): Promise<void> {
  void consultantId;
}

export async function dispatchEvent(topic: string, payload: EventPayload): Promise<void> {
  const handler = eventHandlers[topic];

  if (!handler) {
    return;
  }

  await handler(payload);
}

export const eventHandlers: HandlerRegistry = {
  'appointment.booking.created': handleBookingCreated as EventHandler,
  'appointment.booking.cancelled': handleBookingCancelled as EventHandler,
  'appointment.reminder.sent': handleReminderSent as EventHandler,
  'appointment.consultant.updated': handleConsultantUpdated as EventHandler,
};