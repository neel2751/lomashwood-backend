export const AVAILABILITY_ERRORS = {
  NOT_FOUND: 'Availability not found',
  SLOT_NOT_FOUND: 'Slot not found',
  SLOT_ALREADY_BOOKED: 'Slot is already booked',
  CONFLICT: 'Availability conflict detected for the given time range',
  INVALID_DATE_RANGE: 'Start time must be before end time',
  PAST_DATE: 'Availability date cannot be in the past',
  PAST_SLOT: 'Slot start time cannot be in the past',
  RECURRING_DAYS_REQUIRED: 'Recurring days must be provided when isRecurring is true',
} as const;

export const AVAILABILITY_REDIS_KEYS = {
  availabilityById: (id: string) => `availability:${id}`,
  availabilityByConsultant: (consultantId: string) => `availability:consultant:${consultantId}`,
  slotById: (id: string) => `slot:${id}`,
  slotsByConsultant: (consultantId: string) => `slots:consultant:${consultantId}`,
  availableSlots: 'slots:available',
} as const;

export const AVAILABILITY_CACHE_TTL = 300;

export const AVAILABILITY_EVENTS = {
  CREATED: 'availability.created',
  UPDATED: 'availability.updated',
  DELETED: 'availability.deleted',
  SLOT_CREATED: 'availability.slot.created',
  SLOT_UPDATED: 'availability.slot.updated',
  SLOT_DELETED: 'availability.slot.deleted',
  SLOT_BOOKED: 'availability.slot.booked',
  SLOT_RELEASED: 'availability.slot.released',
} as const;

export const AVAILABILITY_PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

export const SLOT_DURATION_MINUTES = {
  MIN: 15,
  MAX: 480,
  DEFAULT: 60,
} as const;

export const RECURRING_DAYS = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
} as const;

export const RECURRING_DAY_LABELS: Record<number, string> = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
};

export const AVAILABILITY_TIMEZONE_DEFAULT = 'UTC';

export const AVAILABILITY_LOOKAHEAD_DAYS = 30;

export const SLOT_GENERATION_BATCH_SIZE = 100;

export const AVAILABILITY_WORKING_HOURS = {
  START: '09:00',
  END: '17:00',
} as const;

export const AVAILABILITY_BUFFER_MINUTES = 15;