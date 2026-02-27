import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { setupTestEnvironment } from '../../src/tests-helpers/setup';
import { mockBookingRepository, mockSlotRepository, mockEventProducer, mockEmailClient } from '../../src/tests-helpers/mocks';
import {
  bookingShowroomKitchenFixture,
  bookingPendingFixture,
  bookingsListFixture,
  createBookingPayload,
} from '../fixtures/bookings.fixture';
import { slotAvailableFixture, slotBookedFixture } from '../fixtures/time-slots.fixture';
import { FIXED_IDS } from '../fixtures/common.fixture';
import { cancelBookingServiceInput, rescheduleBookingServiceInput } from '../fixtures/services.fixture';
import {
  BookingAlreadyCancelledError,
  BookingNotFoundError,
  SlotUnavailableError,
  UnauthorisedAppointmentAccessError,
} from '../../src/shared/errors';
import { BOOKING_STATUS } from '../../src/shared/constants';

setupTestEnvironment();

const mockDeps = {
  bookingRepository: mockBookingRepository,
  slotRepository: mockSlotRepository,
  eventProducer: mockEventProducer,
  emailClient: mockEmailClient,
};

let BookingService: any;

beforeEach(async () => {
  jest.resetModules();
  ({ BookingService } = await import('../../src/app/booking/booking.service'));
});

describe('BookingService.createBooking', () => {
  it('creates a booking when slot is available', async () => {
    mockSlotRepository.findById.mockResolvedValue(slotAvailableFixture);
    mockBookingRepository.create.mockResolvedValue(bookingShowroomKitchenFixture);
    mockSlotRepository.markBooked.mockResolvedValue(undefined);
    mockEventProducer.publish.mockResolvedValue(undefined);
    mockEmailClient.sendBookingConfirmation.mockResolvedValue(undefined);

    const service = new BookingService(mockDeps);
    const result = await service.createBooking(createBookingPayload);

    expect(result.id).toBe(FIXED_IDS.bookingId);
    expect(mockSlotRepository.markBooked).toHaveBeenCalledWith(FIXED_IDS.slotId, expect.any(String));
    expect(mockEventProducer.publish).toHaveBeenCalled();
  });

  it('throws SlotUnavailableError when slot is booked', async () => {
    mockSlotRepository.findById.mockResolvedValue(slotBookedFixture);

    const service = new BookingService(mockDeps);
    await expect(service.createBooking(createBookingPayload)).rejects.toThrow(SlotUnavailableError);
  });

  it('throws SlotUnavailableError when slot is not found', async () => {
    mockSlotRepository.findById.mockResolvedValue(null);

    const service = new BookingService(mockDeps);
    await expect(service.createBooking(createBookingPayload)).rejects.toThrow(SlotUnavailableError);
  });
});

describe('BookingService.getBookingById', () => {
  it('returns booking for the owning customer', async () => {
    mockBookingRepository.findById.mockResolvedValue(bookingShowroomKitchenFixture);

    const service = new BookingService(mockDeps);
    const result = await service.getBookingById(FIXED_IDS.bookingId, FIXED_IDS.customerId, 'CUSTOMER');

    expect(result.id).toBe(FIXED_IDS.bookingId);
  });

  it('throws UnauthorisedAppointmentAccessError for a different customer', async () => {
    mockBookingRepository.findById.mockResolvedValue(bookingShowroomKitchenFixture);

    const service = new BookingService(mockDeps);
    await expect(
      service.getBookingById(FIXED_IDS.bookingId, 'other-customer-id', 'CUSTOMER'),
    ).rejects.toThrow(UnauthorisedAppointmentAccessError);
  });

  it('allows admin to access any booking', async () => {
    mockBookingRepository.findById.mockResolvedValue(bookingShowroomKitchenFixture);

    const service = new BookingService(mockDeps);
    const result = await service.getBookingById(FIXED_IDS.bookingId, FIXED_IDS.adminId, 'ADMIN');

    expect(result.id).toBe(FIXED_IDS.bookingId);
  });

  it('throws BookingNotFoundError when booking does not exist', async () => {
    mockBookingRepository.findById.mockResolvedValue(null);

    const service = new BookingService(mockDeps);
    await expect(
      service.getBookingById('nonexistent-id', FIXED_IDS.adminId, 'ADMIN'),
    ).rejects.toThrow(BookingNotFoundError);
  });
});

describe('BookingService.cancelBooking', () => {
  it('cancels a confirmed booking successfully', async () => {
    const cancelled = { ...bookingShowroomKitchenFixture, status: BOOKING_STATUS.CANCELLED };
    mockBookingRepository.findById.mockResolvedValue(bookingShowroomKitchenFixture);
    mockBookingRepository.update.mockResolvedValue(cancelled);
    mockSlotRepository.markAvailable.mockResolvedValue(undefined);
    mockEventProducer.publish.mockResolvedValue(undefined);
    mockEmailClient.sendBookingCancellation.mockResolvedValue(undefined);

    const service = new BookingService(mockDeps);
    const result = await service.cancelBooking(cancelBookingServiceInput);

    expect(result.status).toBe(BOOKING_STATUS.CANCELLED);
    expect(mockSlotRepository.markAvailable).toHaveBeenCalledWith(bookingShowroomKitchenFixture.slotId);
  });

  it('throws BookingAlreadyCancelledError when booking is already cancelled', async () => {
    const cancelled = { ...bookingShowroomKitchenFixture, status: BOOKING_STATUS.CANCELLED };
    mockBookingRepository.findById.mockResolvedValue(cancelled);

    const service = new BookingService(mockDeps);
    await expect(service.cancelBooking(cancelBookingServiceInput)).rejects.toThrow(BookingAlreadyCancelledError);
  });

  it('throws BookingNotFoundError when booking does not exist', async () => {
    mockBookingRepository.findById.mockResolvedValue(null);

    const service = new BookingService(mockDeps);
    await expect(service.cancelBooking(cancelBookingServiceInput)).rejects.toThrow(BookingNotFoundError);
  });
});

describe('BookingService.getAllBookings', () => {
  it('returns paginated bookings list', async () => {
    mockBookingRepository.findAll.mockResolvedValue(bookingsListFixture);
    mockBookingRepository.count.mockResolvedValue(bookingsListFixture.length);

    const service = new BookingService(mockDeps);
    const result = await service.getAllBookings({ page: 1, limit: 20 });

    expect(result.data).toHaveLength(bookingsListFixture.length);
    expect(result.meta.total).toBe(bookingsListFixture.length);
  });

  it('returns empty result when no bookings exist', async () => {
    mockBookingRepository.findAll.mockResolvedValue([]);
    mockBookingRepository.count.mockResolvedValue(0);

    const service = new BookingService(mockDeps);
    const result = await service.getAllBookings({ page: 1, limit: 20 });

    expect(result.data).toHaveLength(0);
    expect(result.meta.total).toBe(0);
  });
});