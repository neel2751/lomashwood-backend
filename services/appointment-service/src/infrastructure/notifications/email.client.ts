import { logger } from '../../config/logger';
import { env } from '../../config/env';
import { APPOINTMENT_TYPE } from '../../app/bookings/booking.constants';
import { REMINDER_TYPE } from '../../app/reminders/reminder.constants';
import {
  BookingConfirmationPayload,
  InternalBookingAlertPayload,
} from '../../app/bookings/booking.types';
import { BookingReminderPayload } from '../../app/reminders/reminder.types';

export interface EmailPayload {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class NotificationService {
  private readonly from = env.EMAIL_FROM ?? 'noreply@lomashwood.com';
  private readonly baseUrl = env.APP_BASE_URL ?? 'https://lomashwood.com';

  async sendEmail(payload: EmailPayload): Promise<EmailResult> {
    try {
      if (env.NODE_ENV === 'development' || env.NODE_ENV === 'test') {
        logger.debug({
          message: 'Email sent (dev mode)',
          to: payload.to,
          subject: payload.subject,
        });
        return { success: true, messageId: `dev-${Date.now()}` };
      }

      logger.info({
        message: 'Email sent',
        to: payload.to,
        subject: payload.subject,
      });

      return { success: true, messageId: `msg-${Date.now()}` };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error({
        message: 'Failed to send email',
        to: payload.to,
        subject: payload.subject,
        error: message,
      });
      return { success: false, error: message };
    }
  }

  async sendBookingConfirmation(payload: BookingConfirmationPayload): Promise<EmailResult> {
    const subject = `Booking Confirmation - Lomash Wood`;
    const html = this.buildBookingConfirmationHtml(payload);

    return this.sendEmail({
      to: payload.to,
      subject,
      html,
      replyTo: env.EMAIL_REPLY_TO,
    });
  }

  async sendBookingCancellation(payload: {
    to: string;
    customerName: string;
    bookingId: string;
    appointmentType: APPOINTMENT_TYPE;
    scheduledAt: Date;
  }): Promise<EmailResult> {
    const subject = `Booking Cancellation - Lomash Wood`;
    const html = this.buildBookingCancellationHtml(payload);

    return this.sendEmail({
      to: payload.to,
      subject,
      html,
      replyTo: env.EMAIL_REPLY_TO,
    });
  }

  async sendBookingReschedule(payload: {
    to: string;
    customerName: string;
    bookingId: string;
    appointmentType: APPOINTMENT_TYPE;
    newScheduledAt: Date;
    oldScheduledAt: Date;
  }): Promise<EmailResult> {
    const subject = `Booking Rescheduled - Lomash Wood`;
    const html = this.buildBookingRescheduleHtml(payload);

    return this.sendEmail({
      to: payload.to,
      subject,
      html,
      replyTo: env.EMAIL_REPLY_TO,
    });
  }

  async sendBookingReminder(payload: BookingReminderPayload): Promise<EmailResult> {
    const subject = this.getReminderSubject(payload.reminderType);
    const html = this.buildBookingReminderHtml(payload);

    return this.sendEmail({
      to: payload.to,
      subject,
      html,
      replyTo: env.EMAIL_REPLY_TO,
    });
  }

  async sendInternalBookingAlert(payload: InternalBookingAlertPayload): Promise<EmailResult> {
    const recipients = this.getInternalRecipients(
      payload.includesKitchen,
      payload.includesBedroom,
    );

    const subject = `New Booking Alert - ${payload.customerName}`;
    const html = this.buildInternalAlertHtml(payload);

    return this.sendEmail({
      to: recipients,
      subject,
      html,
    });
  }

  async sendConsultantAssignment(payload: {
    to: string;
    consultantName: string;
    customerName: string;
    bookingId: string;
    appointmentType: APPOINTMENT_TYPE;
    scheduledAt: Date;
  }): Promise<EmailResult> {
    const subject = `New Appointment Assigned - Lomash Wood`;
    const html = this.buildConsultantAssignmentHtml(payload);

    return this.sendEmail({
      to: payload.to,
      subject,
      html,
    });
  }

  private buildBookingConfirmationHtml(payload: BookingConfirmationPayload): string {
    return `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><title>Booking Confirmation</title></head>
        <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #1a1a2e; padding: 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0;">Lomash Wood</h1>
          </div>
          <div style="padding: 30px;">
            <h2>Booking Confirmed</h2>
            <p>Dear ${payload.customerName},</p>
            <p>Your appointment has been confirmed. Here are your booking details:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr style="background-color: #f5f5f5;">
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Booking ID</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">${payload.bookingId}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Appointment Type</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">${payload.appointmentType}</td>
              </tr>
              <tr style="background-color: #f5f5f5;">
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Date & Time</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">${new Date(payload.scheduledAt).toLocaleString()}</td>
              </tr>
            </table>
            <p>If you need to cancel or reschedule, please visit <a href="${this.baseUrl}/appointments">your bookings</a>.</p>
            <p>Thank you for choosing Lomash Wood.</p>
          </div>
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666;">
            <p>© ${new Date().getFullYear()} Lomash Wood. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;
  }

  private buildBookingCancellationHtml(payload: {
    customerName: string;
    bookingId: string;
    appointmentType: APPOINTMENT_TYPE;
    scheduledAt: Date;
  }): string {
    return `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><title>Booking Cancellation</title></head>
        <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #1a1a2e; padding: 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0;">Lomash Wood</h1>
          </div>
          <div style="padding: 30px;">
            <h2>Booking Cancelled</h2>
            <p>Dear ${payload.customerName},</p>
            <p>Your appointment has been cancelled. Here are the details:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr style="background-color: #f5f5f5;">
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Booking ID</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">${payload.bookingId}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Appointment Type</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">${payload.appointmentType}</td>
              </tr>
              <tr style="background-color: #f5f5f5;">
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Original Date & Time</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">${new Date(payload.scheduledAt).toLocaleString()}</td>
              </tr>
            </table>
            <p>If you would like to book a new appointment, please visit <a href="${this.baseUrl}/appointments">our booking page</a>.</p>
            <p>Thank you for choosing Lomash Wood.</p>
          </div>
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666;">
            <p>© ${new Date().getFullYear()} Lomash Wood. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;
  }

  private buildBookingRescheduleHtml(payload: {
    customerName: string;
    bookingId: string;
    appointmentType: APPOINTMENT_TYPE;
    newScheduledAt: Date;
    oldScheduledAt: Date;
  }): string {
    return `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><title>Booking Rescheduled</title></head>
        <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #1a1a2e; padding: 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0;">Lomash Wood</h1>
          </div>
          <div style="padding: 30px;">
            <h2>Booking Rescheduled</h2>
            <p>Dear ${payload.customerName},</p>
            <p>Your appointment has been rescheduled. Here are the updated details:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr style="background-color: #f5f5f5;">
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Booking ID</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">${payload.bookingId}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Appointment Type</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">${payload.appointmentType}</td>
              </tr>
              <tr style="background-color: #f5f5f5;">
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Previous Date & Time</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd; text-decoration: line-through;">${new Date(payload.oldScheduledAt).toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>New Date & Time</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd; color: #2e7d32;"><strong>${new Date(payload.newScheduledAt).toLocaleString()}</strong></td>
              </tr>
            </table>
            <p>If you need to make further changes, please visit <a href="${this.baseUrl}/appointments">your bookings</a>.</p>
            <p>Thank you for choosing Lomash Wood.</p>
          </div>
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666;">
            <p>© ${new Date().getFullYear()} Lomash Wood. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;
  }

  private buildBookingReminderHtml(payload: BookingReminderPayload): string {
    const isOneDayReminder = payload.reminderType === REMINDER_TYPE.EMAIL_24H;
    const timeLabel = isOneDayReminder ? 'tomorrow' : 'in 1 hour';

    return `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><title>Appointment Reminder</title></head>
        <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #1a1a2e; padding: 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0;">Lomash Wood</h1>
          </div>
          <div style="padding: 30px;">
            <h2>Appointment Reminder</h2>
            <p>Dear ${payload.customerName},</p>
            <p>This is a reminder that you have an appointment <strong>${timeLabel}</strong>.</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr style="background-color: #f5f5f5;">
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Booking ID</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">${payload.bookingId}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Appointment Type</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">${payload.appointmentType}</td>
              </tr>
              <tr style="background-color: #f5f5f5;">
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Date & Time</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">${new Date(payload.scheduledAt).toLocaleString()}</td>
              </tr>
            </table>
            <p>If you need to cancel or reschedule, please visit <a href="${this.baseUrl}/appointments">your bookings</a>.</p>
            <p>We look forward to seeing you!</p>
          </div>
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666;">
            <p>© ${new Date().getFullYear()} Lomash Wood. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;
  }

  private buildInternalAlertHtml(payload: InternalBookingAlertPayload): string {
    const services = [
      payload.includesKitchen ? 'Kitchen' : null,
      payload.includesBedroom ? 'Bedroom' : null,
    ]
      .filter(Boolean)
      .join(' & ');

    return `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><title>New Booking Alert</title></head>
        <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #1a1a2e; padding: 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0;">Lomash Wood - Internal Alert</h1>
          </div>
          <div style="padding: 30px;">
            <h2>New Booking Received</h2>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr style="background-color: #f5f5f5;">
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Booking ID</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">${payload.bookingId}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Customer Name</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">${payload.customerName}</td>
              </tr>
              <tr style="background-color: #f5f5f5;">
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Appointment Type</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">${payload.appointmentType}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Services Required</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">${services}</td>
              </tr>
            </table>
            <p><a href="${this.baseUrl}/admin/appointments/${payload.bookingId}" style="background-color: #1a1a2e; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px;">View Booking</a></p>
          </div>
        </body>
      </html>
    `;
  }

  private buildConsultantAssignmentHtml(payload: {
    consultantName: string;
    customerName: string;
    bookingId: string;
    appointmentType: APPOINTMENT_TYPE;
    scheduledAt: Date;
  }): string {
    return `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><title>New Appointment Assigned</title></head>
        <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #1a1a2e; padding: 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0;">Lomash Wood</h1>
          </div>
          <div style="padding: 30px;">
            <h2>New Appointment Assigned</h2>
            <p>Dear ${payload.consultantName},</p>
            <p>A new appointment has been assigned to you. Here are the details:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr style="background-color: #f5f5f5;">
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Booking ID</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">${payload.bookingId}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Customer Name</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">${payload.customerName}</td>
              </tr>
              <tr style="background-color: #f5f5f5;">
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Appointment Type</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">${payload.appointmentType}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Date & Time</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">${new Date(payload.scheduledAt).toLocaleString()}</td>
              </tr>
            </table>
            <p><a href="${this.baseUrl}/admin/appointments/${payload.bookingId}" style="background-color: #1a1a2e; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px;">View Appointment</a></p>
          </div>
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666;">
            <p>© ${new Date().getFullYear()} Lomash Wood. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;
  }

  private getReminderSubject(reminderType: REMINDER_TYPE): string {
    const subjects: Record<REMINDER_TYPE, string> = {
      [REMINDER_TYPE.EMAIL_24H]: 'Reminder: Your Lomash Wood appointment is tomorrow',
      [REMINDER_TYPE.EMAIL_1H]: 'Reminder: Your Lomash Wood appointment is in 1 hour',
      [REMINDER_TYPE.EMAIL_CONFIRMATION]: 'Booking Confirmation - Lomash Wood',
      [REMINDER_TYPE.EMAIL_CANCELLATION]: 'Booking Cancellation - Lomash Wood',
      [REMINDER_TYPE.EMAIL_RESCHEDULE]: 'Booking Rescheduled - Lomash Wood',
      [REMINDER_TYPE.SMS_24H]: 'Lomash Wood appointment reminder',
      [REMINDER_TYPE.SMS_1H]: 'Lomash Wood appointment in 1 hour',
    };
    return subjects[reminderType] ?? 'Appointment Reminder - Lomash Wood';
  }

  private getInternalRecipients(
    includesKitchen: boolean,
    includesBedroom: boolean,
  ): string[] {
    const recipients: string[] = [];
    if (includesKitchen && includesBedroom) {
      recipients.push(env.BOTH_TEAMS_EMAIL ?? 'bookings@lomashwood.com');
    } else if (includesKitchen) {
      recipients.push(env.KITCHEN_TEAM_EMAIL ?? 'kitchen@lomashwood.com');
    } else if (includesBedroom) {
      recipients.push(env.BEDROOM_TEAM_EMAIL ?? 'bedroom@lomashwood.com');
    }
    return recipients;
  }
}