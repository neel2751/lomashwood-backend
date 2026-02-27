import { env, logger, REDIS_KEYS, REDIS_TTL } from '../config';
import { reminderConfig, notificationEventChannelMap } from '../config/notifications';
import type { NotificationChannel } from '../config/notifications';

export interface ReminderJobContext {
  findUpcomingBookings: (withinHours: number) => Promise<UpcomingBooking[]>;
  hasReminderBeenSent: (bookingId: string, label: string) => Promise<boolean>;
  markReminderSent: (bookingId: string, label: string, ttlSeconds: number) => Promise<void>;
  sendNotification: (payload: ReminderNotificationPayload) => Promise<void>;
  publishEvent: (topic: string, payload: unknown) => Promise<void>;
}

export interface UpcomingBooking {
  id: string;
  customerId: string;
  consultantId: string;
  appointmentType: 'HOME_MEASUREMENT' | 'ONLINE' | 'SHOWROOM';
  scheduledAt: Date;
  status: 'PENDING' | 'CONFIRMED';
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerPushToken?: string;
  isKitchen: boolean;
  isBedroom: boolean;
}

export interface ReminderNotificationPayload {
  bookingId: string;
  customerId: string;
  channel: NotificationChannel;
  label: string;
  templateId: string;
  recipientAddress: string;
  data: Record<string, unknown>;
}

export interface ReminderJobResult {
  processed: number;
  sent: number;
  skipped: number;
  failed: number;
  errors: Array<{ bookingId: string; error: string }>;
  durationMs: number;
}

