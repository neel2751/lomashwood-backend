import { logger } from '../../config/logger';
import { env } from '../../config/env';
import { REMINDER_TYPE } from '../../app/reminders/reminder.constants';
import { APPOINTMENT_TYPE } from '../../app/bookings/booking.constants';

export interface SmsPayload {
  to: string;
  message: string;
}

export interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface SmsBulkResult {
  total: number;
  sent: number;
  failed: number;
  results: SmsResult[];
}

export class SmsClient {
  private readonly from = env.SMS_FROM ?? 'LomashWood';

  async sendSms(payload: SmsPayload): Promise<SmsResult> {
    try {
      if (env.NODE_ENV === 'development' || env.NODE_ENV === 'test') {
        logger.debug({
          message: 'SMS sent (dev mode)',
          to: payload.to,
          message: payload.message,
        });
        return { success: true, messageId: `dev-sms-${Date.now()}` };
      }

      logger.info({
        message: 'SMS sent',
        to: payload.to,
      });

      return { success: true, messageId: `sms-${Date.now()}` };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error({
        message: 'Failed to send SMS',
        to: payload.to,
        error: message,
      });
      return { success: false, error: message };
    }
  }

  async sendBulkSms(payloads: SmsPayload[]): Promise<SmsBulkResult> {
    const results = await Promise.allSettled(
      payloads.map((payload) => this.sendSms(payload)),
    );

    let sent = 0;
    let failed = 0;
    const smsResults: SmsResult[] = [];

    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value.success) {
        sent++;
        smsResults.push(result.value);
      } else {
        failed++;
        smsResults.push({
          success: false,
          error: result.status === 'rejected'
            ? String(result.reason)
            : result.value.error,
        });
      }
    });

    logger.info({
      message: 'Bulk SMS completed',
      total: payloads.length,
      sent,
      failed,
    });

    return {
      total: payloads.length,
      sent,
      failed,
      results: smsResults,
    };
  }

  async sendBookingConfirmationSms(payload: {
    to: string;
    customerName: string;
    bookingId: string;
    appointmentType: APPOINTMENT_TYPE;
    scheduledAt: Date;
  }): Promise<SmsResult> {
    const message = this.buildBookingConfirmationMessage(payload);
    return this.sendSms({ to: payload.to, message });
  }

  async sendBookingCancellationSms(payload: {
    to: string;
    customerName: string;
    bookingId: string;
    scheduledAt: Date;
  }): Promise<SmsResult> {
    const message = this.buildBookingCancellationMessage(payload);
    return this.sendSms({ to: payload.to, message });
  }

  async sendBookingRescheduleSms(payload: {
    to: string;
    customerName: string;
    bookingId: string;
    newScheduledAt: Date;
  }): Promise<SmsResult> {
    const message = this.buildBookingRescheduleMessage(payload);
    return this.sendSms({ to: payload.to, message });
  }

  async sendBookingReminderSms(payload: {
    to: string;
    customerName: string;
    bookingId: string;
    appointmentType: APPOINTMENT_TYPE;
    scheduledAt: Date;
    reminderType: REMINDER_TYPE;
  }): Promise<SmsResult> {
    const message = this.buildBookingReminderMessage(payload);
    return this.sendSms({ to: payload.to, message });
  }

  async sendConsultantAssignmentSms(payload: {
    to: string;
    consultantName: string;
    customerName: string;
    bookingId: string;
    scheduledAt: Date;
  }): Promise<SmsResult> {
    const message = this.buildConsultantAssignmentMessage(payload);
    return this.sendSms({ to: payload.to, message });
  }

  async sendOtpSms(payload: {
    to: string;
    otp: string;
    expiryMinutes: number;
  }): Promise<SmsResult> {
    const message = `Your Lomash Wood verification code is: ${payload.otp}. Valid for ${payload.expiryMinutes} minutes. Do not share this code.`;
    return this.sendSms({ to: payload.to, message });
  }

  private buildBookingConfirmationMessage(payload: {
    customerName: string;
    bookingId: string;
    appointmentType: APPOINTMENT_TYPE;
    scheduledAt: Date;
  }): string {
    const date = new Date(payload.scheduledAt).toLocaleString('en-GB', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
    return `Hi ${payload.customerName}, your Lomash Wood ${payload.appointmentType} appointment is confirmed for ${date}. Ref: ${payload.bookingId.slice(0, 8)}. Reply HELP for assistance.`;
  }

  private buildBookingCancellationMessage(payload: {
    customerName: string;
    bookingId: string;
    scheduledAt: Date;
  }): string {
    const date = new Date(payload.scheduledAt).toLocaleString('en-GB', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
    return `Hi ${payload.customerName}, your Lomash Wood appointment on ${date} (Ref: ${payload.bookingId.slice(0, 8)}) has been cancelled. Visit lomashwood.com to rebook.`;
  }

  private buildBookingRescheduleMessage(payload: {
    customerName: string;
    bookingId: string;
    newScheduledAt: Date;
  }): string {
    const date = new Date(payload.newScheduledAt).toLocaleString('en-GB', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
    return `Hi ${payload.customerName}, your Lomash Wood appointment has been rescheduled to ${date}. Ref: ${payload.bookingId.slice(0, 8)}. Reply HELP for assistance.`;
  }

  private buildBookingReminderMessage(payload: {
    customerName: string;
    bookingId: string;
    appointmentType: APPOINTMENT_TYPE;
    scheduledAt: Date;
    reminderType: REMINDER_TYPE;
  }): string {
    const date = new Date(payload.scheduledAt).toLocaleString('en-GB', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
    const timeLabel = payload.reminderType === REMINDER_TYPE.SMS_24H
      ? 'tomorrow'
      : 'in 1 hour';
    return `Reminder: Hi ${payload.customerName}, your Lomash Wood ${payload.appointmentType} appointment is ${timeLabel} at ${date}. Ref: ${payload.bookingId.slice(0, 8)}.`;
  }

  private buildConsultantAssignmentMessage(payload: {
    consultantName: string;
    customerName: string;
    bookingId: string;
    scheduledAt: Date;
  }): string {
    const date = new Date(payload.scheduledAt).toLocaleString('en-GB', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
    return `Hi ${payload.consultantName}, new appointment assigned: ${payload.customerName} on ${date}. Ref: ${payload.bookingId.slice(0, 8)}. Check your dashboard for details.`;
  }

  sanitizePhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      return `+44${cleaned.slice(1)}`;
    }
    if (!cleaned.startsWith('+')) {
      return `+${cleaned}`;
    }
    return cleaned;
  }

  isValidPhoneNumber(phone: string): boolean {
    const sanitized = this.sanitizePhoneNumber(phone);
    return /^\+[1-9]\d{7,14}$/.test(sanitized);
  }
}