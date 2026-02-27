import { describe, it, expect } from '@jest/globals';
import { setupTestEnvironment } from '../../src/tests-helpers/setup';
import { createBookingPayload, createOnlineBookingPayload } from '../fixtures/bookings.fixture';
import { APPOINTMENT_TYPE } from '../../src/shared/constants';
import { futureDate } from '../fixtures/common.fixture';

setupTestEnvironment();

let createBookingSchema: any;
let cancelBookingSchema: any;
let rescheduleBookingSchema: any;
let listBookingsSchema: any;

beforeEach(async () => {
  jest.resetModules();
  ({
    createBookingSchema,
    cancelBookingSchema,
    rescheduleBookingSchema,
    listBookingsSchema,
  } = await import('../../src/app/appointment/appointment.validator'));
});

describe('createBookingSchema', () => {
  it('passes for valid showroom booking payload', () => {
    const result = createBookingSchema.safeParse(createBookingPayload);
    expect(result.success).toBe(true);
  });

  it('passes for valid online booking payload', () => {
    const result = createBookingSchema.safeParse(createOnlineBookingPayload);
    expect(result.success).toBe(true);
  });

  it('fails when customerEmail is invalid', () => {
    const result = createBookingSchema.safeParse({
      ...createBookingPayload,
      customerEmail: 'not-an-email',
    });
    expect(result.success).toBe(false);
  });

  it('fails when neither isKitchen nor isBedroom is true', () => {
    const result = createBookingSchema.safeParse({
      ...createBookingPayload,
      isKitchen: false,
      isBedroom: false,
    });
    expect(result.success).toBe(false);
  });

  it('fails when slotId is missing', () => {
    const { slotId, ...rest } = createBookingPayload;
    const result = createBookingSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('fails when appointmentType is invalid', () => {
    const result = createBookingSchema.safeParse({
      ...createBookingPayload,
      appointmentType: 'INVALID_TYPE',
    });
    expect(result.success).toBe(false);
  });

  it('fails when customerPhone is empty', () => {
    const result = createBookingSchema.safeParse({
      ...createBookingPayload,
      customerPhone: '',
    });
    expect(result.success).toBe(false);
  });
});

describe('cancelBookingSchema', () => {
  it('passes with bookingId and cancellationReason', () => {
    const result = cancelBookingSchema.safeParse({
      bookingId: '44444444-4444-4444-a444-444444444444',
      cancellationReason: 'Change of plans.',
    });
    expect(result.success).toBe(true);
  });

  it('fails when bookingId is not a valid UUID', () => {
    const result = cancelBookingSchema.safeParse({
      bookingId: 'not-a-uuid',
      cancellationReason: 'Reason',
    });
    expect(result.success).toBe(false);
  });

  it('fails when cancellationReason is empty', () => {
    const result = cancelBookingSchema.safeParse({
      bookingId: '44444444-4444-4444-a444-444444444444',
      cancellationReason: '',
    });
    expect(result.success).toBe(false);
  });
});

describe('rescheduleBookingSchema', () => {
  it('passes with bookingId and newSlotId', () => {
    const result = rescheduleBookingSchema.safeParse({
      bookingId: '44444444-4444-4444-a444-444444444444',
      newSlotId: '55555555-5555-4555-a555-555555555555',
    });
    expect(result.success).toBe(true);
  });

  it('fails when newSlotId is not a valid UUID', () => {
    const result = rescheduleBookingSchema.safeParse({
      bookingId: '44444444-4444-4444-a444-444444444444',
      newSlotId: 'bad-id',
    });
    expect(result.success).toBe(false);
  });
});

describe('listBookingsSchema', () => {
  it('passes with default empty query', () => {
    const result = listBookingsSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('passes with valid filter params', () => {
    const result = listBookingsSchema.safeParse({
      page: '1',
      limit: '20',
      appointmentType: APPOINTMENT_TYPE.SHOWROOM,
      isKitchen: 'true',
    });
    expect(result.success).toBe(true);
  });

  it('fails when limit exceeds max', () => {
    const result = listBookingsSchema.safeParse({ limit: '999' });
    expect(result.success).toBe(false);
  });
});