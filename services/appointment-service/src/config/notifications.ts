import { env } from './env';

export type NotificationChannel = 'EMAIL' | 'SMS' | 'PUSH';

export type NotificationEvent =
  | 'BOOKING_CREATED'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_CANCELLED'
  | 'BOOKING_RESCHEDULED'
  | 'BOOKING_COMPLETED'
  | 'REMINDER_24H'
  | 'REMINDER_1H'
  | 'MULTI_TEAM_ALERT'
  | 'ADMIN_NEW_BOOKING';

export interface EmailProviderConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: { user?: string; pass?: string };
  from: string;
  fromName: string;
  replyTo?: string;
  maxRetries: number;
  retryDelay: number;
}

export interface SmsProviderConfig {
  provider: 'twilio' | 'msg91';
  twilio: { accountSid?: string; authToken?: string; fromNumber?: string; messagingServiceSid?: string };
  msg91: { apiKey?: string; senderId?: string; route?: string };
  maxRetries: number;
  retryDelay: number;
}

export interface PushProviderConfig {
  provider: 'firebase' | 'webpush';
  firebase: { projectId?: string; privateKey?: string; clientEmail?: string; databaseUrl?: string };
  webpush: { vapidPublicKey?: string; vapidPrivateKey?: string; subject?: string };
  maxRetries: number;
  retryDelay: number;
}

export interface NotificationTemplateConfig {
  bookingCreated: { subject: string; templateId: string };
  bookingConfirmed: { subject: string; templateId: string };
  bookingCancelled: { subject: string; templateId: string };
  bookingRescheduled: { subject: string; templateId: string };
  bookingCompleted: { subject: string; templateId: string };
  reminder24h: { subject: string; templateId: string };
  reminder1h: { subject: string; templateId: string };
  multiTeamAlert: { subject: string; templateId: string };
  adminNewBooking: { subject: string; templateId: string };
}

export interface NotificationChannelConfig {
  enabled: boolean;
  channels: NotificationChannel[];
  retryPolicy: { maxAttempts: number; backoffMs: number; maxBackoffMs: number };
}

export interface TeamNotificationConfig {
  kitchenTeamEmail: string;
  bedroomTeamEmail: string;
  adminEmail: string;
  notifyOnDualBooking: boolean;
  notifyOnNewBooking: boolean;
  notifyOnCancellation: boolean;
}

export const emailConfig: EmailProviderConfig = {
  host: env.email.host,
  port: env.email.port,
  secure: env.email.port === 465,
  auth: { user: env.email.user, pass: env.email.pass },
  from: env.email.from,
  fromName: env.email.fromName,
  replyTo: env.email.from,
  maxRetries: 3,
  retryDelay: 5000,
};

export const smsConfig: SmsProviderConfig = {
  provider: env.sms.provider,
  twilio: {
    accountSid: env.sms.twilio.accountSid,
    authToken: env.sms.twilio.authToken,
    fromNumber: env.sms.twilio.fromNumber,
  },
  msg91: { apiKey: env.sms.msg91.apiKey, senderId: env.sms.msg91.senderId, route: '4' },
  maxRetries: 3,
  retryDelay: 3000,
};

export const pushConfig: PushProviderConfig = {
  provider: env.push.provider,
  firebase: {
    projectId: env.push.firebase.projectId,
    privateKey: env.push.firebase.privateKey,
    clientEmail: env.push.firebase.clientEmail,
  },
  webpush: {
    vapidPublicKey: process.env.VAPID_PUBLIC_KEY,
    vapidPrivateKey: process.env.VAPID_PRIVATE_KEY,
    subject: `mailto:${env.email.from}`,
  },
  maxRetries: 2,
  retryDelay: 2000,
};

export const notificationTemplates: NotificationTemplateConfig = {
  bookingCreated: { subject: 'Your Lomash Wood Appointment Has Been Booked', templateId: 'booking-created' },
  bookingConfirmed: { subject: 'Your Lomash Wood Appointment Is Confirmed', templateId: 'booking-confirmed' },
  bookingCancelled: { subject: 'Your Lomash Wood Appointment Has Been Cancelled', templateId: 'booking-cancelled' },
  bookingRescheduled: { subject: 'Your Lomash Wood Appointment Has Been Rescheduled', templateId: 'booking-rescheduled' },
  bookingCompleted: { subject: 'Thank You for Your Lomash Wood Consultation', templateId: 'booking-completed' },
  reminder24h: { subject: 'Reminder: Your Lomash Wood Appointment is Tomorrow', templateId: 'reminder-24h' },
  reminder1h: { subject: 'Reminder: Your Lomash Wood Appointment is in 1 Hour', templateId: 'reminder-1h' },
  multiTeamAlert: { subject: 'New Dual Booking Alert - Kitchen & Bedroom', templateId: 'multi-team-alert' },
  adminNewBooking: { subject: 'New Appointment Booking Received', templateId: 'admin-new-booking' },
};

export const notificationChannelConfig: NotificationChannelConfig = {
  enabled: true,
  channels: ['EMAIL', 'SMS', 'PUSH'],
  retryPolicy: { maxAttempts: 3, backoffMs: 1000, maxBackoffMs: 30000 },
};

export const teamNotificationConfig: TeamNotificationConfig = {
  kitchenTeamEmail: env.teams.kitchenEmail,
  bedroomTeamEmail: env.teams.bedroomEmail,
  adminEmail: env.teams.adminEmail,
  notifyOnDualBooking: true,
  notifyOnNewBooking: true,
  notifyOnCancellation: true,
};

export const reminderConfig = {
  schedules: [
    { label: '24h', hoursBefore: env.booking.reminderHoursBefore, channels: ['EMAIL', 'SMS'] as NotificationChannel[] },
    { label: '1h', hoursBefore: 1, channels: ['PUSH', 'SMS'] as NotificationChannel[] },
  ],
  maxRemindersPerBooking: 2,
  skipIfCancelled: true,
  skipIfCompleted: true,
};

export const notificationEventChannelMap: Record<NotificationEvent, NotificationChannel[]> = {
  BOOKING_CREATED: ['EMAIL'],
  BOOKING_CONFIRMED: ['EMAIL', 'SMS'],
  BOOKING_CANCELLED: ['EMAIL', 'SMS'],
  BOOKING_RESCHEDULED: ['EMAIL', 'SMS'],
  BOOKING_COMPLETED: ['EMAIL'],
  REMINDER_24H: ['EMAIL', 'SMS'],
  REMINDER_1H: ['PUSH', 'SMS'],
  MULTI_TEAM_ALERT: ['EMAIL'],
  ADMIN_NEW_BOOKING: ['EMAIL'],
};