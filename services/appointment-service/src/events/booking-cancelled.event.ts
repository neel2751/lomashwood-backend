import { env, logger } from '../config';
import type { BookingCancelledPayload } from '../interfaces/http/events/payload.types';

export type CancelledBy = 'CUSTOMER' | 'ADMIN' | 'SYSTEM';

export interface BookingCancelledEventContext {
  publishEvent: (topic: string, payload: BookingCancelledPayload) => Promise<void>;
  sendCancellationEmail: (payload: BookingCancelledPayload) => Promise<void>;
  sendAdminCancellationNotification: (payload: BookingCancelledPayload) => Promise<void>;
  notifyConsultant: (payload: BookingCancelledPayload) => Promise<void>;
  cancelScheduledReminders: (bookingId: string) => Promise<void>;
  releaseConsultantSlot: (consultantId: string, scheduledAt: Date) => Promise<void>;
  invalidateBookingCache: (bookingId: string, customerId: string, consultantId: string) => Promise<void>;
  invalidateAvailabilityCache: (consultantId: string, date: string) => Promise<void>;
  logCancellationAudit: (data: CancellationAuditData) => Promise<void>;
}


export const BOOKING_CANCELLED_TOPIC = 'appointment.booking.cancelled' as const;