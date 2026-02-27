export const APPOINTMENT_SERVICE_NAME = 'appointment-service' as const;

export const APPOINTMENT_TYPE = {
  HOME_MEASUREMENT: 'HOME_MEASUREMENT',
  ONLINE: 'ONLINE',
  SHOWROOM: 'SHOWROOM',
} as const;

export type AppointmentType = (typeof APPOINTMENT_TYPE)[keyof typeof APPOINTMENT_TYPE];

export const BOOKING_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED',
  NO_SHOW: 'NO_SHOW',
  RESCHEDULED: 'RESCHEDULED',
} as const;

export type BookingStatus = (typeof BOOKING_STATUS)[keyof typeof BOOKING_STATUS];

export const REMINDER_STATUS = {
  PENDING: 'PENDING',
  SENT: 'SENT',
  DELIVERED: 'DELIVERED',
  FAILED: 'FAILED',
} as const;

export type ReminderStatus = (typeof REMINDER_STATUS)[keyof typeof REMINDER_STATUS];

export const REMINDER_CHANNEL = {
  EMAIL: 'EMAIL',
  SMS: 'SMS',
  PUSH: 'PUSH',
} as const;

export type ReminderChannel = (typeof REMINDER_CHANNEL)[keyof typeof REMINDER_CHANNEL];

export const REMINDER_TYPE = {
  APPOINTMENT_24H: 'APPOINTMENT_24H',
  APPOINTMENT_1H: 'APPOINTMENT_1H',
  APPOINTMENT_CONFIRMATION: 'APPOINTMENT_CONFIRMATION',
  APPOINTMENT_CANCELLATION: 'APPOINTMENT_CANCELLATION',
  APPOINTMENT_RESCHEDULED: 'APPOINTMENT_RESCHEDULED',
} as const;

export type ReminderType = (typeof REMINDER_TYPE)[keyof typeof REMINDER_TYPE];

export const CONSULTANT_SPECIALISATION = {
  KITCHEN: 'KITCHEN',
  BEDROOM: 'BEDROOM',
  BOTH: 'BOTH',
} as const;

export type ConsultantSpecialisation =
  (typeof CONSULTANT_SPECIALISATION)[keyof typeof CONSULTANT_SPECIALISATION];

export const SLOT_STATUS = {
  AVAILABLE: 'AVAILABLE',
  BOOKED: 'BOOKED',
  BLOCKED: 'BLOCKED',
} as const;

export type SlotStatus = (typeof SLOT_STATUS)[keyof typeof SLOT_STATUS];

export const DAY_OF_WEEK = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
} as const;

export const BOOKING_WINDOW_DAYS = 90;

export const SLOT_DURATION_MINUTES = 60;

export const MAX_RETRY_ATTEMPTS = 3;

export const REMINDER_OFFSETS_HOURS = {
  APPOINTMENT_24H: 24,
  APPOINTMENT_1H: 1,
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const CACHE_TTL = {
  AVAILABILITY: 60,
  CONSULTANT: 300,
  SHOWROOM: 600,
  BOOKING: 60,
} as const;

export const CACHE_PREFIX = {
  AVAILABILITY: 'availability',
  CONSULTANT: 'consultant',
  SHOWROOM: 'showroom',
  BOOKING: 'booking',
  SLOTS: 'slots',
} as const;

export const INTERNAL_NOTIFICATION_EMAILS = {
  KITCHEN_TEAM: process.env.KITCHEN_TEAM_EMAIL ?? 'kitchen@lomashwood.co.uk',
  BEDROOM_TEAM: process.env.BEDROOM_TEAM_EMAIL ?? 'bedroom@lomashwood.co.uk',
  ADMIN: process.env.ADMIN_EMAIL ?? 'admin@lomashwood.co.uk',
} as const;

export const APPOINTMENT_SERVICE_VERSION = '1.0.0' as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;