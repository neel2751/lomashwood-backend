export enum APPOINTMENT_TYPE {
  HOME_MEASUREMENT = 'HOME_MEASUREMENT',
  ONLINE = 'ONLINE',
  SHOWROOM = 'SHOWROOM',
}

export enum BOOKING_STATUS {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  RESCHEDULED = 'RESCHEDULED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export const BOOKING_ERRORS = {
  NOT_FOUND: 'Booking not found',
  SLOT_UNAVAILABLE: 'Selected slot is not available',
  CANCELLATION_FAILED: 'Booking cancellation failed',
  RESCHEDULE_FAILED: 'Booking reschedule failed',
  UNAUTHORIZED_ACCESS: 'Unauthorized access to booking',
  ALREADY_CANCELLED: 'Booking is already cancelled',
  ALREADY_COMPLETED: 'Cannot modify a completed booking',
  MUST_INCLUDE_SERVICE: 'Booking must include at least kitchen or bedroom',
} as const;

export const BOOKING_REMINDER_HOURS_BEFORE = 24;

export const BOOKING_EXPIRY_HOURS = 48;

export const BOOKING_CANCELLATION_WINDOW_HOURS = 24;

export const BOOKING_RESCHEDULE_WINDOW_HOURS = 24;

export const BOOKING_REDIS_KEYS = {
  bookingById: (id: string) => `booking:${id}`,
  bookingsByCustomer: (customerId: string) => `bookings:customer:${customerId}`,
  bookingsByConsultant: (consultantId: string) => `bookings:consultant:${consultantId}`,
} as const;

export const BOOKING_CACHE_TTL = 300;

export const BOOKING_EVENTS = {
  CREATED: 'booking.created',
  UPDATED: 'booking.updated',
  CANCELLED: 'booking.cancelled',
  CONFIRMED: 'booking.confirmed',
  RESCHEDULED: 'booking.rescheduled',
  COMPLETED: 'booking.completed',
  REMINDER_SENT: 'booking.reminder.sent',
} as const;

export const BOOKING_PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

export const APPOINTMENT_TYPE_LABELS: Record<APPOINTMENT_TYPE, string> = {
  [APPOINTMENT_TYPE.HOME_MEASUREMENT]: 'Home Measurement',
  [APPOINTMENT_TYPE.ONLINE]: 'Online Consultation',
  [APPOINTMENT_TYPE.SHOWROOM]: 'Showroom Visit',
};

export const BOOKING_STATUS_LABELS: Record<BOOKING_STATUS, string> = {
  [BOOKING_STATUS.PENDING]: 'Pending',
  [BOOKING_STATUS.CONFIRMED]: 'Confirmed',
  [BOOKING_STATUS.RESCHEDULED]: 'Rescheduled',
  [BOOKING_STATUS.CANCELLED]: 'Cancelled',
  [BOOKING_STATUS.COMPLETED]: 'Completed',
};

export const INTERNAL_NOTIFICATION_RECIPIENTS = {
  KITCHEN: process.env.KITCHEN_TEAM_EMAIL ?? 'kitchen@lomashwood.com',
  BEDROOM: process.env.BEDROOM_TEAM_EMAIL ?? 'bedroom@lomashwood.com',
  BOTH: process.env.BOTH_TEAMS_EMAIL ?? 'bookings@lomashwood.com',
} as const;