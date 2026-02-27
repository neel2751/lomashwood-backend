export enum REMINDER_TYPE {
  EMAIL_24H = 'EMAIL_24H',
  EMAIL_1H = 'EMAIL_1H',
  EMAIL_CONFIRMATION = 'EMAIL_CONFIRMATION',
  EMAIL_CANCELLATION = 'EMAIL_CANCELLATION',
  EMAIL_RESCHEDULE = 'EMAIL_RESCHEDULE',
  SMS_24H = 'SMS_24H',
  SMS_1H = 'SMS_1H',
}

export enum REMINDER_STATUS {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum REMINDER_CHANNEL {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  BOTH = 'BOTH',
}

export const REMINDER_ERRORS = {
  NOT_FOUND: 'Reminder not found',
  ALREADY_SENT: 'Reminder has already been sent',
  ALREADY_CANCELLED: 'Reminder has already been cancelled',
  BOOKING_NOT_FOUND: 'Associated booking not found',
  SEND_FAILED: 'Failed to send reminder',
  INVALID_SCHEDULED_DATE: 'Scheduled date must be in the future',
  PAST_SCHEDULED_DATE: 'Cannot reschedule to a past date',
} as const;

export const REMINDER_EVENTS = {
  CREATED: 'reminder.created',
  SENT: 'reminder.sent',
  FAILED: 'reminder.failed',
  CANCELLED: 'reminder.cancelled',
  RESCHEDULED: 'reminder.rescheduled',
} as const;

export const REMINDER_REDIS_KEYS = {
  reminderById: (id: string) => `reminder:${id}`,
  remindersByBooking: (bookingId: string) => `reminders:booking:${bookingId}`,
  pendingReminders: 'reminders:pending',
} as const;

export const REMINDER_CACHE_TTL = 300;

export const REMINDER_PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

export const REMINDER_SCHEDULE = {
  HOURS_BEFORE_24H: 24,
  HOURS_BEFORE_1H: 1,
  PROCESSING_INTERVAL_MINUTES: 5,
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MINUTES: 10,
} as const;

export const REMINDER_TYPE_LABELS: Record<REMINDER_TYPE, string> = {
  [REMINDER_TYPE.EMAIL_24H]: '24 Hour Email Reminder',
  [REMINDER_TYPE.EMAIL_1H]: '1 Hour Email Reminder',
  [REMINDER_TYPE.EMAIL_CONFIRMATION]: 'Booking Confirmation Email',
  [REMINDER_TYPE.EMAIL_CANCELLATION]: 'Booking Cancellation Email',
  [REMINDER_TYPE.EMAIL_RESCHEDULE]: 'Booking Reschedule Email',
  [REMINDER_TYPE.SMS_24H]: '24 Hour SMS Reminder',
  [REMINDER_TYPE.SMS_1H]: '1 Hour SMS Reminder',
};

export const REMINDER_STATUS_LABELS: Record<REMINDER_STATUS, string> = {
  [REMINDER_STATUS.PENDING]: 'Pending',
  [REMINDER_STATUS.SENT]: 'Sent',
  [REMINDER_STATUS.FAILED]: 'Failed',
  [REMINDER_STATUS.CANCELLED]: 'Cancelled',
};

export const REMINDER_CHANNEL_LABELS: Record<REMINDER_CHANNEL, string> = {
  [REMINDER_CHANNEL.EMAIL]: 'Email',
  [REMINDER_CHANNEL.SMS]: 'SMS',
  [REMINDER_CHANNEL.BOTH]: 'Email & SMS',
};

export const REMINDER_SUBJECT_TEMPLATES: Record<REMINDER_TYPE, string> = {
  [REMINDER_TYPE.EMAIL_24H]: 'Reminder: Your Lomash Wood appointment is tomorrow',
  [REMINDER_TYPE.EMAIL_1H]: 'Reminder: Your Lomash Wood appointment is in 1 hour',
  [REMINDER_TYPE.EMAIL_CONFIRMATION]: 'Booking Confirmation - Lomash Wood',
  [REMINDER_TYPE.EMAIL_CANCELLATION]: 'Booking Cancellation - Lomash Wood',
  [REMINDER_TYPE.EMAIL_RESCHEDULE]: 'Booking Rescheduled - Lomash Wood',
  [REMINDER_TYPE.SMS_24H]: 'Lomash Wood appointment reminder',
  [REMINDER_TYPE.SMS_1H]: 'Lomash Wood appointment in 1 hour',
};