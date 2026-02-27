export type AppointmentType = 'HOME_MEASUREMENT' | 'ONLINE' | 'SHOWROOM';

export type ReminderChannel = 'EMAIL' | 'SMS' | 'PUSH';

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';

export interface BaseEventPayload {
  eventId: string;
  timestamp: Date;
  version: string;
  source: string;
}

export interface BookingCreatedPayload extends BaseEventPayload {
  bookingId: string;
  customerId: string;
  consultantId: string;
  appointmentType: AppointmentType;
  scheduledAt: Date;
  isKitchen: boolean;
  isBedroom: boolean;
  showroomId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerPostcode: string;
  customerAddress: string;
  notes?: string;
}

export interface BookingCancelledPayload extends BaseEventPayload {
  bookingId: string;
  customerId: string;
  consultantId: string;
  cancelledAt: Date;
  cancelledBy: 'CUSTOMER' | 'ADMIN' | 'SYSTEM';
  reason?: string;
  appointmentType: AppointmentType;
  originalScheduledAt: Date;
}

export interface BookingRescheduledPayload extends BaseEventPayload {
  bookingId: string;
  customerId: string;
  consultantId: string;
  previousScheduledAt: Date;
  newScheduledAt: Date;
  rescheduledBy: 'CUSTOMER' | 'ADMIN';
  reason?: string;
}

export interface BookingConfirmedPayload extends BaseEventPayload {
  bookingId: string;
  customerId: string;
  consultantId: string;
  appointmentType: AppointmentType;
  confirmedAt: Date;
  scheduledAt: Date;
}

export interface BookingCompletedPayload extends BaseEventPayload {
  bookingId: string;
  customerId: string;
  consultantId: string;
  completedAt: Date;
  duration: number;
  notes?: string;
}

export interface ReminderSentPayload extends BaseEventPayload {
  reminderId: string;
  bookingId: string;
  customerId: string;
  channel: ReminderChannel;
  sentAt: Date;
  scheduledFor: Date;
  templateId: string;
  recipientAddress: string;
}

export interface ReminderFailedPayload extends BaseEventPayload {
  reminderId: string;
  bookingId: string;
  customerId: string;
  channel: ReminderChannel;
  failedAt: Date;
  reason: string;
  retryCount: number;
}

export interface ConsultantUpdatedPayload extends BaseEventPayload {
  consultantId: string;
  updatedFields: string[];
  updatedBy: string;
  previousData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
}

export interface ConsultantAvailabilityUpdatedPayload extends BaseEventPayload {
  consultantId: string;
  availableSlots: AvailableSlot[];
  effectiveFrom: Date;
  effectiveTo: Date;
}

export interface AvailableSlot {
  date: Date;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface SlotConflictDetectedPayload extends BaseEventPayload {
  bookingId: string;
  consultantId: string;
  requestedSlot: Date;
  conflictingBookingId: string;
}

export interface CalendarSyncedPayload extends BaseEventPayload {
  consultantId: string;
  provider: 'GOOGLE' | 'OUTLOOK' | 'APPLE';
  syncedAt: Date;
  slotsImported: number;
  slotsExported: number;
}

export interface PaymentSucceededPayload extends BaseEventPayload {
  orderId: string;
  customerId: string;
  amount: number;
  currency: string;
  paymentIntentId: string;
  metadata?: Record<string, unknown>;
}

export interface UserCreatedPayload extends BaseEventPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
  createdAt: Date;
}

export type EventPayload =
  | BookingCreatedPayload
  | BookingCancelledPayload
  | BookingRescheduledPayload
  | BookingConfirmedPayload
  | BookingCompletedPayload
  | ReminderSentPayload
  | ReminderFailedPayload
  | ConsultantUpdatedPayload
  | ConsultantAvailabilityUpdatedPayload
  | SlotConflictDetectedPayload
  | CalendarSyncedPayload
  | PaymentSucceededPayload
  | UserCreatedPayload;

export interface EventEnvelope<T extends EventPayload = EventPayload> {
  topic: string;
  partition?: number;
  key?: string;
  payload: T;
  headers?: Record<string, string>;
}