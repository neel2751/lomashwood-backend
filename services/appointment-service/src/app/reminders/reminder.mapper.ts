import { Reminder } from '@prisma/client';
import { ReminderResponse, BookingSummary } from './reminder.types';
import { REMINDER_TYPE, REMINDER_STATUS, REMINDER_CHANNEL } from './reminder.constants';

type ReminderWithRelations = Reminder & {
  booking?: {
    id: string;
    customerId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    appointmentType: string;
    scheduledAt: Date;
    status: string;
  } | null;
};

export class ReminderMapper {
  toResponse(reminder: ReminderWithRelations): ReminderResponse {
    return {
      id: reminder.id,
      bookingId: reminder.bookingId,
      type: reminder.type as REMINDER_TYPE,
      scheduledAt: reminder.scheduledAt,
      status: reminder.status as REMINDER_STATUS,
      channel: reminder.channel as REMINDER_CHANNEL,
      message: reminder.message ?? undefined,
      sentAt: reminder.sentAt ?? undefined,
      failureReason: reminder.failureReason ?? undefined,
      booking: reminder.booking
        ? this.toBookingSummary(reminder.booking)
        : undefined,
      createdAt: reminder.createdAt,
      updatedAt: reminder.updatedAt,
    };
  }

  toResponseList(reminders: ReminderWithRelations[]): ReminderResponse[] {
    return reminders.map((r) => this.toResponse(r));
  }

  private toBookingSummary(booking: {
    id: string;
    customerId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    appointmentType: string;
    scheduledAt: Date;
    status: string;
  }): BookingSummary {
    return {
      id: booking.id,
      customerId: booking.customerId,
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      customerPhone: booking.customerPhone,
      appointmentType: booking.appointmentType,
      scheduledAt: booking.scheduledAt,
      status: booking.status,
    };
  }
}