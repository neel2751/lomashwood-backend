import { REMINDER_TYPE, REMINDER_STATUS, REMINDER_CHANNEL } from './reminder.constants';
import { PaginationMeta } from '../../shared/pagination';

export interface CreateReminderDto {
  bookingId: string;
  type: REMINDER_TYPE;
  scheduledAt: Date | string;
  channel?: REMINDER_CHANNEL;
  message?: string;
  status?: string;
}

export interface UpdateReminderDto {
  type?: REMINDER_TYPE;
  scheduledAt?: Date | string;
  channel?: REMINDER_CHANNEL;
  message?: string | null;
  status?: REMINDER_STATUS;
  sentAt?: Date;
  failureReason?: string;
}

export interface ReminderQueryDto {
  page?: number;
  limit?: number;
  status?: REMINDER_STATUS;
  type?: REMINDER_TYPE;
  channel?: REMINDER_CHANNEL;
  bookingId?: string;
  from?: string;
  to?: string;
}

export interface BookingSummary {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  appointmentType: string;
  scheduledAt: Date;
  status: string;
}

export interface ReminderResponse {
  id: string;
  bookingId: string;
  type: REMINDER_TYPE;
  scheduledAt: Date;
  status: REMINDER_STATUS;
  channel: REMINDER_CHANNEL;
  message?: string;
  sentAt?: Date;
  failureReason?: string;
  booking?: BookingSummary;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedReminderResponse {
  data: ReminderResponse[];
  meta: PaginationMeta;
}

export interface ProcessRemindersResult {
  total: number;
  sent: number;
  failed: number;
  errors: string[];
}

export interface ReminderCreatedEvent {
  reminderId: string;
  bookingId: string;
  type: REMINDER_TYPE;
  scheduledAt: Date | string;
}

export interface ReminderSentEvent {
  reminderId: string;
  bookingId: string;
  type: REMINDER_TYPE;
  sentAt: Date;
}

export interface ReminderFailedEvent {
  reminderId: string;
  bookingId: string;
  error: string;
}

export interface ReminderCancelledEvent {
  reminderId: string;
  bookingId: string;
}

export interface ReminderRescheduledEvent {
  reminderId: string;
  bookingId: string;
  newScheduledAt: Date;
}

export interface BookingReminderPayload {
  to: string;
  customerName: string;
  bookingId: string;
  appointmentType: string;
  scheduledAt: Date;
  reminderType: REMINDER_TYPE;
}