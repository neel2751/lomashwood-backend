export const REDIS_KEYS = {
  booking: {
    byId: (id: string) => `appointment:booking:${id}`,
    byCustomer: (customerId: string) => `appointment:bookings:customer:${customerId}`,
    byConsultant: (consultantId: string) => `appointment:bookings:consultant:${consultantId}`,
    bySlot: (slotId: string) => `appointment:booking:slot:${slotId}`,
    all: 'appointment:bookings:all',
    pending: 'appointment:bookings:pending',
    confirmed: 'appointment:bookings:confirmed',
  },

  availability: {
    byId: (id: string) => `appointment:availability:${id}`,
    byConsultant: (consultantId: string) => `appointment:availability:consultant:${consultantId}`,
    all: 'appointment:availabilities:all',
  },

  slot: {
    byId: (id: string) => `appointment:slot:${id}`,
    byConsultant: (consultantId: string) => `appointment:slots:consultant:${consultantId}`,
    byAvailability: (availabilityId: string) => `appointment:slots:availability:${availabilityId}`,
    available: 'appointment:slots:available',
    all: 'appointment:slots:all',
  },

  consultant: {
    byId: (id: string) => `appointment:consultant:${id}`,
    byShowroom: (showroomId: string) => `appointment:consultants:showroom:${showroomId}`,
    byEmail: (email: string) => `appointment:consultant:email:${email}`,
    active: 'appointment:consultants:active',
    all: 'appointment:consultants:all',
    stats: (id: string) => `appointment:consultant:stats:${id}`,
  },

  reminder: {
    byId: (id: string) => `appointment:reminder:${id}`,
    byBooking: (bookingId: string) => `appointment:reminders:booking:${bookingId}`,
    pending: 'appointment:reminders:pending',
    due: 'appointment:reminders:due',
    all: 'appointment:reminders:all',
  },

  rateLimit: {
    byIp: (ip: string) => `appointment:ratelimit:ip:${ip}`,
    byUser: (userId: string) => `appointment:ratelimit:user:${userId}`,
    bookingByUser: (userId: string) => `appointment:ratelimit:booking:user:${userId}`,
  },

  session: {
    byId: (sessionId: string) => `appointment:session:${sessionId}`,
    byUser: (userId: string) => `appointment:sessions:user:${userId}`,
  },

  lock: {
    slot: (slotId: string) => `appointment:lock:slot:${slotId}`,
    booking: (bookingId: string) => `appointment:lock:booking:${bookingId}`,
    consultant: (consultantId: string) => `appointment:lock:consultant:${consultantId}`,
  },

  health: 'appointment:health',
  lastSync: 'appointment:last-sync',
} as const;

export const REDIS_TTL = {
  booking: 300,
  availability: 300,
  slot: 300,
  consultant: 300,
  consultantStats: 60,
  reminder: 300,
  session: 3600,
  rateLimit: 60,
  lock: 30,
  health: 30,
} as const;

export const REDIS_PATTERNS = {
  allBookings: 'appointment:booking*',
  allAvailabilities: 'appointment:availability*',
  allSlots: 'appointment:slot*',
  allConsultants: 'appointment:consultant*',
  allReminders: 'appointment:reminder*',
  allRateLimits: 'appointment:ratelimit*',
  allLocks: 'appointment:lock*',
  allSessions: 'appointment:session*',
  serviceAll: 'appointment:*',
} as const;

export type RedisKeyType = typeof REDIS_KEYS;
export type RedisTTLType = typeof REDIS_TTL;
export type RedisPatternsType = typeof REDIS_PATTERNS;