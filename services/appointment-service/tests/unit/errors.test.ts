import { describe, it, expect } from '@jest/globals';
import {
  AppointmentServiceError,
  AvailabilityNotFoundError,
  BookingAlreadyCancelledError,
  BookingAlreadyConfirmedError,
  BookingNotFoundError,
  BookingWindowExceededError,
  CalendarSyncFailedError,
  ConsultantNotActiveError,
  ConsultantNotFoundError,
  ConsultantSpecialisationMismatchError,
  DatabaseOperationError,
  EventPublishError,
  InvalidAppointmentTypeError,
  InvalidDateRangeError,
  NotificationDispatchFailedError,
  PastDateBookingError,
  ReminderAlreadySentError,
  ReminderNotFoundError,
  ShowroomNotFoundError,
  SlotConflictError,
  SlotNotFoundError,
  SlotUnavailableError,
  UnauthorisedAppointmentAccessError,
} from '../../src/shared/errors';

describe('AppointmentServiceError (base)', () => {
  it('sets message, statusCode, code and isOperational', () => {
    const err = new AppointmentServiceError('test message', 400, 'TEST_CODE');
    expect(err.message).toBe('test message');
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('TEST_CODE');
    expect(err.isOperational).toBe(true);
  });

  it('allows isOperational to be set to false', () => {
    const err = new AppointmentServiceError('msg', 500, 'CODE', false);
    expect(err.isOperational).toBe(false);
  });

  it('is an instance of Error', () => {
    const err = new AppointmentServiceError('msg', 400, 'CODE');
    expect(err).toBeInstanceOf(Error);
  });
});

describe('BookingNotFoundError', () => {
  it('returns 404 with BOOKING_NOT_FOUND code', () => {
    const err = new BookingNotFoundError('abc-123');
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('BOOKING_NOT_FOUND');
    expect(err.message).toContain('abc-123');
  });
});

describe('BookingAlreadyCancelledError', () => {
  it('returns 409 with BOOKING_ALREADY_CANCELLED code', () => {
    const err = new BookingAlreadyCancelledError('abc-123');
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe('BOOKING_ALREADY_CANCELLED');
  });
});

describe('BookingAlreadyConfirmedError', () => {
  it('returns 409 with BOOKING_ALREADY_CONFIRMED code', () => {
    const err = new BookingAlreadyConfirmedError('abc-123');
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe('BOOKING_ALREADY_CONFIRMED');
  });
});

describe('SlotUnavailableError', () => {
  it('returns 409 with SLOT_UNAVAILABLE code', () => {
    const err = new SlotUnavailableError('slot-001');
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe('SLOT_UNAVAILABLE');
    expect(err.message).toContain('slot-001');
  });
});

describe('SlotConflictError', () => {
  it('returns 409 with SLOT_CONFLICT code and includes consultantId and date', () => {
    const err = new SlotConflictError('consultant-001', '2026-02-24 10:00');
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe('SLOT_CONFLICT');
    expect(err.message).toContain('consultant-001');
    expect(err.message).toContain('2026-02-24 10:00');
  });
});

describe('SlotNotFoundError', () => {
  it('returns 404 with SLOT_NOT_FOUND code', () => {
    const err = new SlotNotFoundError('slot-001');
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('SLOT_NOT_FOUND');
  });
});

describe('ConsultantNotFoundError', () => {
  it('returns 404 with CONSULTANT_NOT_FOUND code', () => {
    const err = new ConsultantNotFoundError('c-001');
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('CONSULTANT_NOT_FOUND');
    expect(err.message).toContain('c-001');
  });
});

describe('ConsultantNotActiveError', () => {
  it('returns 422 with CONSULTANT_NOT_ACTIVE code', () => {
    const err = new ConsultantNotActiveError('c-001');
    expect(err.statusCode).toBe(422);
    expect(err.code).toBe('CONSULTANT_NOT_ACTIVE');
  });
});

describe('ConsultantSpecialisationMismatchError', () => {
  it('returns 422 with CONSULTANT_SPECIALISATION_MISMATCH code', () => {
    const err = new ConsultantSpecialisationMismatchError('c-001', 'KITCHEN');
    expect(err.statusCode).toBe(422);
    expect(err.code).toBe('CONSULTANT_SPECIALISATION_MISMATCH');
    expect(err.message).toContain('KITCHEN');
  });
});

describe('AvailabilityNotFoundError', () => {
  it('returns 404 with AVAILABILITY_NOT_FOUND code', () => {
    const err = new AvailabilityNotFoundError('a-001');
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('AVAILABILITY_NOT_FOUND');
  });
});

describe('ReminderNotFoundError', () => {
  it('returns 404 with REMINDER_NOT_FOUND code', () => {
    const err = new ReminderNotFoundError('r-001');
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('REMINDER_NOT_FOUND');
  });
});

describe('ReminderAlreadySentError', () => {
  it('returns 409 with REMINDER_ALREADY_SENT code', () => {
    const err = new ReminderAlreadySentError('r-001');
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe('REMINDER_ALREADY_SENT');
  });
});

describe('ShowroomNotFoundError', () => {
  it('returns 404 with SHOWROOM_NOT_FOUND code', () => {
    const err = new ShowroomNotFoundError('s-001');
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('SHOWROOM_NOT_FOUND');
  });
});

describe('InvalidAppointmentTypeError', () => {
  it('returns 422 with INVALID_APPOINTMENT_TYPE code', () => {
    const err = new InvalidAppointmentTypeError('UNKNOWN');
    expect(err.statusCode).toBe(422);
    expect(err.code).toBe('INVALID_APPOINTMENT_TYPE');
    expect(err.message).toContain('UNKNOWN');
  });
});

describe('InvalidDateRangeError', () => {
  it('returns 422 with INVALID_DATE_RANGE code', () => {
    const err = new InvalidDateRangeError();
    expect(err.statusCode).toBe(422);
    expect(err.code).toBe('INVALID_DATE_RANGE');
  });
});

describe('PastDateBookingError', () => {
  it('returns 422 with PAST_DATE_BOOKING code', () => {
    const err = new PastDateBookingError();
    expect(err.statusCode).toBe(422);
    expect(err.code).toBe('PAST_DATE_BOOKING');
  });
});

describe('BookingWindowExceededError', () => {
  it('returns 422 with BOOKING_WINDOW_EXCEEDED and includes maxDays', () => {
    const err = new BookingWindowExceededError(90);
    expect(err.statusCode).toBe(422);
    expect(err.code).toBe('BOOKING_WINDOW_EXCEEDED');
    expect(err.message).toContain('90');
  });
});

describe('CalendarSyncFailedError', () => {
  it('returns 502 with CALENDAR_SYNC_FAILED code', () => {
    const err = new CalendarSyncFailedError('Google', 'token expired');
    expect(err.statusCode).toBe(502);
    expect(err.code).toBe('CALENDAR_SYNC_FAILED');
    expect(err.message).toContain('Google');
    expect(err.message).toContain('token expired');
  });
});

describe('NotificationDispatchFailedError', () => {
  it('returns 502 with NOTIFICATION_DISPATCH_FAILED code', () => {
    const err = new NotificationDispatchFailedError('EMAIL', 'booking-001');
    expect(err.statusCode).toBe(502);
    expect(err.code).toBe('NOTIFICATION_DISPATCH_FAILED');
    expect(err.message).toContain('EMAIL');
  });
});

describe('UnauthorisedAppointmentAccessError', () => {
  it('returns 403 with UNAUTHORISED_APPOINTMENT_ACCESS code', () => {
    const err = new UnauthorisedAppointmentAccessError();
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe('UNAUTHORISED_APPOINTMENT_ACCESS');
  });
});

describe('DatabaseOperationError', () => {
  it('returns 500, isOperational false, with DATABASE_OPERATION_FAILED code', () => {
    const err = new DatabaseOperationError('findUnique');
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe('DATABASE_OPERATION_FAILED');
    expect(err.isOperational).toBe(false);
    expect(err.message).toContain('findUnique');
  });
});

describe('EventPublishError', () => {
  it('returns 500, isOperational false, with EVENT_PUBLISH_FAILED code', () => {
    const err = new EventPublishError('booking.created');
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe('EVENT_PUBLISH_FAILED');
    expect(err.isOperational).toBe(false);
    expect(err.message).toContain('booking.created');
  });
});