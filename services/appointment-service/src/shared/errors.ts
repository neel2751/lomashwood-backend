export class AppointmentServiceError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, code: string, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BookingNotFoundError extends AppointmentServiceError {
  constructor(bookingId: string) {
    super(`Booking with id ${bookingId} not found`, 404, 'BOOKING_NOT_FOUND');
  }
}

export class BookingAlreadyCancelledError extends AppointmentServiceError {
  constructor(bookingId: string) {
    super(`Booking ${bookingId} is already cancelled`, 409, 'BOOKING_ALREADY_CANCELLED');
  }
}

export class BookingAlreadyConfirmedError extends AppointmentServiceError {
  constructor(bookingId: string) {
    super(`Booking ${bookingId} is already confirmed`, 409, 'BOOKING_ALREADY_CONFIRMED');
  }
}

export class SlotUnavailableError extends AppointmentServiceError {
  constructor(slotId: string) {
    super(`Time slot ${slotId} is no longer available`, 409, 'SLOT_UNAVAILABLE');
  }
}

export class SlotConflictError extends AppointmentServiceError {
  constructor(consultantId: string, date: string) {
    super(
      `Consultant ${consultantId} already has a booking at ${date}`,
      409,
      'SLOT_CONFLICT',
    );
  }
}

export class SlotNotFoundError extends AppointmentServiceError {
  constructor(slotId: string) {
    super(`Time slot with id ${slotId} not found`, 404, 'SLOT_NOT_FOUND');
  }
}

export class ConsultantNotFoundError extends AppointmentServiceError {
  constructor(consultantId: string) {
    super(`Consultant with id ${consultantId} not found`, 404, 'CONSULTANT_NOT_FOUND');
  }
}

export class ConsultantNotActiveError extends AppointmentServiceError {
  constructor(consultantId: string) {
    super(`Consultant ${consultantId} is not currently active`, 422, 'CONSULTANT_NOT_ACTIVE');
  }
}

export class ConsultantSpecialisationMismatchError extends AppointmentServiceError {
  constructor(consultantId: string, required: string) {
    super(
      `Consultant ${consultantId} does not specialise in ${required}`,
      422,
      'CONSULTANT_SPECIALISATION_MISMATCH',
    );
  }
}

export class AvailabilityNotFoundError extends AppointmentServiceError {
  constructor(availabilityId: string) {
    super(`Availability with id ${availabilityId} not found`, 404, 'AVAILABILITY_NOT_FOUND');
  }
}

export class ReminderNotFoundError extends AppointmentServiceError {
  constructor(reminderId: string) {
    super(`Reminder with id ${reminderId} not found`, 404, 'REMINDER_NOT_FOUND');
  }
}

export class ReminderAlreadySentError extends AppointmentServiceError {
  constructor(reminderId: string) {
    super(`Reminder ${reminderId} has already been sent`, 409, 'REMINDER_ALREADY_SENT');
  }
}

export class ShowroomNotFoundError extends AppointmentServiceError {
  constructor(showroomId: string) {
    super(`Showroom with id ${showroomId} not found`, 404, 'SHOWROOM_NOT_FOUND');
  }
}

export class InvalidAppointmentTypeError extends AppointmentServiceError {
  constructor(type: string) {
    super(`Appointment type ${type} is invalid`, 422, 'INVALID_APPOINTMENT_TYPE');
  }
}

export class InvalidDateRangeError extends AppointmentServiceError {
  constructor() {
    super('Start date must be before end date', 422, 'INVALID_DATE_RANGE');
  }
}

export class PastDateBookingError extends AppointmentServiceError {
  constructor() {
    super('Cannot book an appointment in the past', 422, 'PAST_DATE_BOOKING');
  }
}

export class BookingWindowExceededError extends AppointmentServiceError {
  constructor(maxDays: number) {
    super(
      `Appointments can only be booked up to ${maxDays} days in advance`,
      422,
      'BOOKING_WINDOW_EXCEEDED',
    );
  }
}

export class CalendarSyncFailedError extends AppointmentServiceError {
  constructor(provider: string, reason: string) {
    super(
      `Calendar sync failed for provider ${provider}: ${reason}`,
      502,
      'CALENDAR_SYNC_FAILED',
    );
  }
}

export class NotificationDispatchFailedError extends AppointmentServiceError {
  constructor(channel: string, bookingId: string) {
    super(
      `Failed to dispatch ${channel} notification for booking ${bookingId}`,
      502,
      'NOTIFICATION_DISPATCH_FAILED',
    );
  }
}

export class UnauthorisedAppointmentAccessError extends AppointmentServiceError {
  constructor() {
    super('You are not authorised to access this appointment', 403, 'UNAUTHORISED_APPOINTMENT_ACCESS');
  }
}

export class DatabaseOperationError extends AppointmentServiceError {
  constructor(operation: string) {
    super(`Database operation failed: ${operation}`, 500, 'DATABASE_OPERATION_FAILED', false);
  }
}

export class EventPublishError extends AppointmentServiceError {
  constructor(eventName: string) {
    super(`Failed to publish event: ${eventName}`, 500, 'EVENT_PUBLISH_FAILED', false);
  }
}