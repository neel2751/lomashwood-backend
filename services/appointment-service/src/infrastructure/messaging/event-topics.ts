export const BOOKING_TOPICS = {
  CREATED: 'appointment.booking.created',
  UPDATED: 'appointment.booking.updated',
  CONFIRMED: 'appointment.booking.confirmed',
  CANCELLED: 'appointment.booking.cancelled',
  RESCHEDULED: 'appointment.booking.rescheduled',
  COMPLETED: 'appointment.booking.completed',
  REMINDER_SENT: 'appointment.booking.reminder.sent',
  DEAD_LETTER: 'appointment.booking.dead_letter',
} as const;

export const AVAILABILITY_TOPICS = {
  CREATED: 'appointment.availability.created',
  UPDATED: 'appointment.availability.updated',
  DELETED: 'appointment.availability.deleted',
  SLOT_CREATED: 'appointment.availability.slot.created',
  SLOT_UPDATED: 'appointment.availability.slot.updated',
  SLOT_DELETED: 'appointment.availability.slot.deleted',
  SLOT_BOOKED: 'appointment.availability.slot.booked',
  SLOT_RELEASED: 'appointment.availability.slot.released',
  DEAD_LETTER: 'appointment.availability.dead_letter',
} as const;

export const CONSULTANT_TOPICS = {
  CREATED: 'appointment.consultant.created',
  UPDATED: 'appointment.consultant.updated',
  DELETED: 'appointment.consultant.deleted',
  ACTIVATED: 'appointment.consultant.activated',
  DEACTIVATED: 'appointment.consultant.deactivated',
  DEAD_LETTER: 'appointment.consultant.dead_letter',
} as const;

export const REMINDER_TOPICS = {
  CREATED: 'appointment.reminder.created',
  SENT: 'appointment.reminder.sent',
  FAILED: 'appointment.reminder.failed',
  CANCELLED: 'appointment.reminder.cancelled',
  RESCHEDULED: 'appointment.reminder.rescheduled',
  DEAD_LETTER: 'appointment.reminder.dead_letter',
} as const;

export const NOTIFICATION_TOPICS = {
  BOOKING_CONFIRMATION: 'notification.booking.confirmation',
  BOOKING_CANCELLATION: 'notification.booking.cancellation',
  BOOKING_REMINDER_24H: 'notification.booking.reminder.24h',
  BOOKING_REMINDER_1H: 'notification.booking.reminder.1h',
  BOOKING_RESCHEDULE: 'notification.booking.reschedule',
  CONSULTANT_ASSIGNED: 'notification.consultant.assigned',
} as const;

export const ANALYTICS_TOPICS = {
  BOOKING_CREATED: 'analytics.appointment.booking.created',
  BOOKING_CANCELLED: 'analytics.appointment.booking.cancelled',
  BOOKING_COMPLETED: 'analytics.appointment.booking.completed',
  SLOT_UTILIZATION: 'analytics.appointment.slot.utilization',
  CONSULTANT_PERFORMANCE: 'analytics.appointment.consultant.performance',
} as const;

export const INBOUND_TOPICS = {
  USER_DELETED: 'auth.user.deleted',
  SHOWROOM_UPDATED: 'content.showroom.updated',
  SHOWROOM_DELETED: 'content.showroom.deleted',
  ORDER_CREATED: 'order.created',
  ORDER_CANCELLED: 'order.cancelled',
} as const;

export const ALL_TOPICS = {
  ...BOOKING_TOPICS,
  ...AVAILABILITY_TOPICS,
  ...CONSULTANT_TOPICS,
  ...REMINDER_TOPICS,
  ...NOTIFICATION_TOPICS,
  ...ANALYTICS_TOPICS,
  ...INBOUND_TOPICS,
} as const;

export type BookingTopic = (typeof BOOKING_TOPICS)[keyof typeof BOOKING_TOPICS];
export type AvailabilityTopic = (typeof AVAILABILITY_TOPICS)[keyof typeof AVAILABILITY_TOPICS];
export type ConsultantTopic = (typeof CONSULTANT_TOPICS)[keyof typeof CONSULTANT_TOPICS];
export type ReminderTopic = (typeof REMINDER_TOPICS)[keyof typeof REMINDER_TOPICS];
export type NotificationTopic = (typeof NOTIFICATION_TOPICS)[keyof typeof NOTIFICATION_TOPICS];
export type AnalyticsTopic = (typeof ANALYTICS_TOPICS)[keyof typeof ANALYTICS_TOPICS];
export type InboundTopic = (typeof INBOUND_TOPICS)[keyof typeof INBOUND_TOPICS];
export type AllTopics = (typeof ALL_TOPICS)[keyof typeof ALL_TOPICS];