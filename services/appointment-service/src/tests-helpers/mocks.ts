import { jest } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import type { BookingService } from '../app/bookings/booking.service';
import type { ConsultantService } from '../app/consultants/consultant.service';
import type { AvailabilityService } from '../app/availability/availability.service';
import type { ReminderService } from '../app/reminders/reminder.service';

// ── Generic helper ────────────────────────────────────────────────────────────
// Converts every method on a class/interface into a jest.MockedFunction while
// preserving the exact argument and return types. This is what kills 'never'.

type MockedService<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? jest.MockedFunction<(...args: A) => R>
    : T[K];
};

// ── Infrastructure mocks ──────────────────────────────────────────────────────

export const mockPrismaClient = {
  booking: {
    create:     jest.fn(),
    findUnique: jest.fn(),
    findFirst:  jest.fn(),
    findMany:   jest.fn(),
    update:     jest.fn(),
    delete:     jest.fn(),
    count:      jest.fn(),
  },
  slot: {
    create:     jest.fn(),
    findUnique: jest.fn(),
    findFirst:  jest.fn(),
    findMany:   jest.fn(),
    update:     jest.fn(),
    delete:     jest.fn(),
    count:      jest.fn(),
  },
  consultant: {
    create:     jest.fn(),
    findUnique: jest.fn(),
    findFirst:  jest.fn(),
    findMany:   jest.fn(),
    update:     jest.fn(),
    delete:     jest.fn(),
    count:      jest.fn(),
  },
  availability: {
    create:     jest.fn(),
    findUnique: jest.fn(),
    findFirst:  jest.fn(),
    findMany:   jest.fn(),
    update:     jest.fn(),
    delete:     jest.fn(),
    count:      jest.fn(),
  },
  reminder: {
    create:     jest.fn(),
    findUnique: jest.fn(),
    findFirst:  jest.fn(),
    findMany:   jest.fn(),
    update:     jest.fn(),
    delete:     jest.fn(),
    count:      jest.fn(),
  },
  showroom: {
    create:     jest.fn(),
    findUnique: jest.fn(),
    findFirst:  jest.fn(),
    findMany:   jest.fn(),
    update:     jest.fn(),
    delete:     jest.fn(),
    count:      jest.fn(),
  },
  $transaction: jest.fn(),
  $connect:     jest.fn(),
  $disconnect:  jest.fn(),
} as unknown as jest.Mocked<PrismaClient>;

export const mockRedisClient = {
  get:     jest.fn(),
  set:     jest.fn(),
  setex:   jest.fn(),
  del:     jest.fn(),
  exists:  jest.fn(),
  expire:  jest.fn(),
  keys:    jest.fn(),
  flushdb: jest.fn(),
  ping:    jest.fn(),
  quit:    jest.fn(),
};

export const mockEmailClient = {
  send:                    jest.fn(),
  sendBookingConfirmation: jest.fn(),
  sendBookingCancellation: jest.fn(),
  sendBookingRescheduled:  jest.fn(),
  sendInternalNotification: jest.fn(),
  sendReminder:            jest.fn(),
};

export const mockSmsClient = {
  send:                    jest.fn(),
  sendBookingConfirmation: jest.fn(),
  sendReminder:            jest.fn(),
};

export const mockPushClient = {
  send:         jest.fn(),
  sendReminder: jest.fn(),
};

export const mockEventProducer = {
  publish:      jest.fn(),
  publishBatch: jest.fn(),
};

// ── Repository mocks ──────────────────────────────────────────────────────────
// These stay as plain jest.fn() — repositories are consumed internally by
// services and never directly passed to controllers under test.

export const mockBookingRepository = {
  create:          jest.fn(),
  findById:        jest.fn(),
  findByCustomerId: jest.fn(),
  findAll:         jest.fn(),
  update:          jest.fn(),
  softDelete:      jest.fn(),
  count:           jest.fn(),
  existsConflict:  jest.fn(),
};

export const mockSlotRepository = {
  create:        jest.fn(),
  findById:      jest.fn(),
  findAvailable: jest.fn(),
  findAll:       jest.fn(),
  update:        jest.fn(),
  softDelete:    jest.fn(),
  count:         jest.fn(),
  markBooked:    jest.fn(),
  markAvailable: jest.fn(),
};

export const mockConsultantRepository = {
  create:                    jest.fn(),
  findById:                  jest.fn(),
  findAll:                   jest.fn(),
  update:                    jest.fn(),
  softDelete:                jest.fn(),
  count:                     jest.fn(),
  findActiveBySpecialisation: jest.fn(),
};

export const mockAvailabilityRepository = {
  create:              jest.fn(),
  findById:            jest.fn(),
  findByConsultantId:  jest.fn(),
  findAll:             jest.fn(),
  update:              jest.fn(),
  delete:              jest.fn(),
};

export const mockReminderRepository = {
  create:          jest.fn(),
  findById:        jest.fn(),
  findByBookingId: jest.fn(),
  findPending:     jest.fn(),
  findAll:         jest.fn(),
  update:          jest.fn(),
  markSent:        jest.fn(),
  markDelivered:   jest.fn(),
  markFailed:      jest.fn(),
  count:           jest.fn(),
};

export const mockShowroomRepository = {
  findById:   jest.fn(),
  findAll:    jest.fn(),
  findActive: jest.fn(),
};

// ── Service mocks (typed) ─────────────────────────────────────────────────────
// MockedService<T> preserves every method's argument + return types, which is
// what prevents mockResolvedValue(…) arguments collapsing to 'never'.

export const mockBookingService: MockedService<BookingService> = {
  createBooking:          jest.fn(),
  getBookingById:         jest.fn(),
  getAllBookings:          jest.fn(),
  getBookingsByCustomer:  jest.fn(),
  cancelBooking:          jest.fn(),
  rescheduleBooking:      jest.fn(),
  confirmBooking:         jest.fn(),
};

export const mockConsultantService: MockedService<ConsultantService> = {
  createConsultant:     jest.fn(),
  getConsultantById:    jest.fn(),
  getAllConsultants:     jest.fn(),
  updateConsultant:     jest.fn(),
  deactivateConsultant: jest.fn(),
  activateConsultant:   jest.fn(),
};

export const mockAvailabilityService: MockedService<AvailabilityService> = {
  getAvailableSlots:        jest.fn(),
  getConsultantAvailability: jest.fn(),
  createAvailability:       jest.fn(),
  updateAvailability:       jest.fn(),
  deleteAvailability:       jest.fn(),
};

export const mockReminderService: MockedService<ReminderService> = {
  scheduleReminder:      jest.fn(),
  sendReminder:          jest.fn(),
  cancelReminder:        jest.fn(),
  getRemindersByBooking: jest.fn(),
};

// ── Reset ─────────────────────────────────────────────────────────────────────

export function resetAllMocks(): void {
  jest.clearAllMocks();
}