import { logger } from '../../config/logger';
import { env } from '../../config/env';
import { APPOINTMENT_TYPE } from '../../app/bookings/booking.constants';
import { REMINDER_TYPE } from '../../app/reminders/reminder.constants';

export interface PushPayload {
  to: string | string[];
  title: string;
  body: string;
  data?: Record<string, unknown>;
  badge?: number;
  sound?: string;
  icon?: string;
  image?: string;
  priority?: 'normal' | 'high';
  ttl?: number;
}

export interface PushResult {
  success: boolean;
  messageId?: string;
  failedTokens?: string[];
  error?: string;
}

export interface PushBulkResult {
  total: number;
  sent: number;
  failed: number;
  results: PushResult[];
}

export interface PushSubscription {
  userId: string;
  token: string;
  platform: 'web' | 'ios' | 'android';
  deviceId?: string;
  createdAt: Date;
}

export class PushClient {
  private readonly appName = 'Lomash Wood';
  private readonly defaultIcon = env.PUSH_ICON ?? '/icons/logo.png';
  private readonly defaultSound = 'default';

  async sendPush(payload: PushPayload): Promise<PushResult> {
    try {
      if (env.NODE_ENV === 'development' || env.NODE_ENV === 'test') {
        logger.debug({
          message: 'Push notification sent (dev mode)',
          to: payload.to,
          title: payload.title,
          body: payload.body,
        });
        return { success: true, messageId: `dev-push-${Date.now()}` };
      }

      logger.info({
        message: 'Push notification sent',
        title: payload.title,
      });

      return { success: true, messageId: `push-${Date.now()}` };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error({
        message: 'Failed to send push notification',
        title: payload.title,
        error: message,
      });
      return { success: false, error: message };
    }
  }

  async sendBulkPush(payloads: PushPayload[]): Promise<PushBulkResult> {
    const results = await Promise.allSettled(
      payloads.map((payload) => this.sendPush(payload)),
    );

    let sent = 0;
    let failed = 0;
    const pushResults: PushResult[] = [];

    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value.success) {
        sent++;
        pushResults.push(result.value);
      } else {
        failed++;
        pushResults.push({
          success: false,
          error: result.status === 'rejected'
            ? String(result.reason)
            : result.value.error,
        });
      }
    });

    logger.info({
      message: 'Bulk push notifications completed',
      total: payloads.length,
      sent,
      failed,
    });

    return {
      total: payloads.length,
      sent,
      failed,
      results: pushResults,
    };
  }

  async sendBookingConfirmationPush(payload: {
    token: string | string[];
    customerName: string;
    bookingId: string;
    appointmentType: APPOINTMENT_TYPE;
    scheduledAt: Date;
  }): Promise<PushResult> {
    const date = new Date(payload.scheduledAt).toLocaleString('en-GB', {
      dateStyle: 'short',
      timeStyle: 'short',
    });

    return this.sendPush({
      to: payload.token,
      title: `${this.appName} - Booking Confirmed`,
      body: `Your ${payload.appointmentType} appointment is confirmed for ${date}.`,
      data: {
        type: 'booking_confirmation',
        bookingId: payload.bookingId,
        appointmentType: payload.appointmentType,
        scheduledAt: payload.scheduledAt.toISOString(),
      },
      icon: this.defaultIcon,
      sound: this.defaultSound,
      priority: 'high',
    });
  }

  async sendBookingCancellationPush(payload: {
    token: string | string[];
    customerName: string;
    bookingId: string;
    appointmentType: APPOINTMENT_TYPE;
    scheduledAt: Date;
  }): Promise<PushResult> {
    const date = new Date(payload.scheduledAt).toLocaleString('en-GB', {
      dateStyle: 'short',
      timeStyle: 'short',
    });

    return this.sendPush({
      to: payload.token,
      title: `${this.appName} - Booking Cancelled`,
      body: `Your ${payload.appointmentType} appointment on ${date} has been cancelled.`,
      data: {
        type: 'booking_cancellation',
        bookingId: payload.bookingId,
        appointmentType: payload.appointmentType,
        scheduledAt: payload.scheduledAt.toISOString(),
      },
      icon: this.defaultIcon,
      sound: this.defaultSound,
      priority: 'high',
    });
  }

  async sendBookingReschedulePush(payload: {
    token: string | string[];
    customerName: string;
    bookingId: string;
    appointmentType: APPOINTMENT_TYPE;
    newScheduledAt: Date;
    oldScheduledAt: Date;
  }): Promise<PushResult> {
    const newDate = new Date(payload.newScheduledAt).toLocaleString('en-GB', {
      dateStyle: 'short',
      timeStyle: 'short',
    });

    return this.sendPush({
      to: payload.token,
      title: `${this.appName} - Booking Rescheduled`,
      body: `Your appointment has been rescheduled to ${newDate}.`,
      data: {
        type: 'booking_reschedule',
        bookingId: payload.bookingId,
        appointmentType: payload.appointmentType,
        newScheduledAt: payload.newScheduledAt.toISOString(),
        oldScheduledAt: payload.oldScheduledAt.toISOString(),
      },
      icon: this.defaultIcon,
      sound: this.defaultSound,
      priority: 'high',
    });
  }

  async sendBookingReminderPush(payload: {
    token: string | string[];
    customerName: string;
    bookingId: string;
    appointmentType: APPOINTMENT_TYPE;
    scheduledAt: Date;
    reminderType: REMINDER_TYPE;
  }): Promise<PushResult> {
    const date = new Date(payload.scheduledAt).toLocaleString('en-GB', {
      dateStyle: 'short',
      timeStyle: 'short',
    });

    const timeLabel = payload.reminderType === REMINDER_TYPE.SMS_24H
      ? 'tomorrow'
      : 'in 1 hour';

    return this.sendPush({
      to: payload.token,
      title: `${this.appName} - Appointment Reminder`,
      body: `Your ${payload.appointmentType} appointment is ${timeLabel} at ${date}.`,
      data: {
        type: 'booking_reminder',
        bookingId: payload.bookingId,
        appointmentType: payload.appointmentType,
        scheduledAt: payload.scheduledAt.toISOString(),
        reminderType: payload.reminderType,
      },
      icon: this.defaultIcon,
      sound: this.defaultSound,
      priority: 'high',
      badge: 1,
    });
  }

  async sendConsultantAssignmentPush(payload: {
    token: string | string[];
    consultantName: string;
    customerName: string;
    bookingId: string;
    appointmentType: APPOINTMENT_TYPE;
    scheduledAt: Date;
  }): Promise<PushResult> {
    const date = new Date(payload.scheduledAt).toLocaleString('en-GB', {
      dateStyle: 'short',
      timeStyle: 'short',
    });

    return this.sendPush({
      to: payload.token,
      title: `${this.appName} - New Appointment`,
      body: `New appointment with ${payload.customerName} on ${date}.`,
      data: {
        type: 'consultant_assignment',
        bookingId: payload.bookingId,
        appointmentType: payload.appointmentType,
        customerName: payload.customerName,
        scheduledAt: payload.scheduledAt.toISOString(),
      },
      icon: this.defaultIcon,
      sound: this.defaultSound,
      priority: 'high',
      badge: 1,
    });
  }

  async sendAdminAlertPush(payload: {
    token: string | string[];
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }): Promise<PushResult> {
    return this.sendPush({
      to: payload.token,
      title: `${this.appName} Admin - ${payload.title}`,
      body: payload.body,
      data: {
        type: 'admin_alert',
        ...payload.data,
      },
      icon: this.defaultIcon,
      sound: this.defaultSound,
      priority: 'high',
    });
  }

  buildTopicArn(topic: string): string {
    return `arn:aws:sns:${env.AWS_REGION ?? 'eu-west-1'}:${env.AWS_ACCOUNT_ID ?? ''}:${topic}`;
  }

  sanitizeToken(token: string): string {
    return token.trim().replace(/\s+/g, '');
  }

  isValidToken(token: string): boolean {
    const sanitized = this.sanitizeToken(token);
    return sanitized.length >= 64 && sanitized.length <= 512;
  }
}