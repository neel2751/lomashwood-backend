import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { setupTestEnvironment, createTestRequest, createAdminTestRequest, createTestResponse } from '../../src/tests-helpers/setup';
import { mockBookingService } from '../../src/tests-helpers/mocks';
import { appointmentResponseFixture, appointmentsListResponseFixture } from '../fixtures/appointments.fixture';
import { createBookingPayload } from '../fixtures/bookings.fixture';
import { FIXED_IDS, BASE_PAGINATION_META } from '../fixtures/common.fixture';
import { BookingNotFoundError } from '../../src/shared/errors';

setupTestEnvironment();

let AppointmentController: any;

beforeEach(async () => {
  jest.resetModules();
  ({ AppointmentController } = await import('../../src/app/appointment/appointment.controller.ts'));
});

describe('AppointmentController.create', () => {
  it('returns 201 with created appointment', async () => {
    mockBookingService.createBooking.mockResolvedValue(appointmentResponseFixture);

    const controller = new AppointmentController({ bookingService: mockBookingService });
    const { res } = createTestResponse();
    const req = createTestRequest({ body: createBookingPayload, user: { userId: FIXED_IDS.customerId } });

    await controller.create(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.status(201).json).toHaveBeenCalledWith(
      expect.objectContaining({ id: FIXED_IDS.bookingId }),
    );
  });

  it('propagates errors to next middleware', async () => {
    mockBookingService.createBooking.mockRejectedValue(new Error('Slot conflict'));

    const controller = new AppointmentController({ bookingService: mockBookingService });
    const { res } = createTestResponse();
    const next = jest.fn();
    const req = createTestRequest({ body: createBookingPayload });

    await controller.create(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe('AppointmentController.getById', () => {
  it('returns 200 with appointment when found', async () => {
    mockBookingService.getBookingById.mockResolvedValue(appointmentResponseFixture);

    const controller = new AppointmentController({ bookingService: mockBookingService });
    const { res } = createTestResponse();
    const req = createTestRequest({ params: { id: FIXED_IDS.bookingId } });

    await controller.getById(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('calls next with BookingNotFoundError when not found', async () => {
    mockBookingService.getBookingById.mockRejectedValue(new BookingNotFoundError(FIXED_IDS.bookingId));

    const controller = new AppointmentController({ bookingService: mockBookingService });
    const { res } = createTestResponse();
    const next = jest.fn();
    const req = createTestRequest({ params: { id: 'nonexistent' } });

    await controller.getById(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(BookingNotFoundError));
  });
});

describe('AppointmentController.list', () => {
  it('returns 200 with paginated appointments', async () => {
    mockBookingService.getAllBookings.mockResolvedValue({
      data: appointmentsListResponseFixture,
      meta: { ...BASE_PAGINATION_META, total: appointmentsListResponseFixture.length },
    });

    const controller = new AppointmentController({ bookingService: mockBookingService });
    const { res } = createTestResponse();
    const req = createAdminTestRequest({ query: { page: '1', limit: '20' } });

    await controller.list(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });
});