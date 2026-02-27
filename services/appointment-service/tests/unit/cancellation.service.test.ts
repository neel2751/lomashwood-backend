import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { setupTestEnvironment } from '../../src/tests-helpers/setup';
import { mockBookingRepository, mockSlotRepository, mockEventProducer, mockEmailClient } from '../../src/tests-helpers/mocks';
import {
  bookingShowroomKitchenFixture,
  cancelledBookingFixture,
} from '../fixtures/bookings.fixture';
import {
  cancellationByCustomerPayload,
  cancellationByAdminPayload,
  alreadyCancelledBookingFixture,
} from '../fixtures/cancellations.fixture';
import { FIXED_IDS } from '../fixtures/common.fixture';
import {
  BookingAlreadyCancelledError,
  BookingNotFoundError,
} from '../../src/shared/errors';
import { BOOKING_STATUS } from '../../src/shared/constants';

setupTestEnvironment();

const mockDeps = {
  bookingRepository: mockBookingRepository,
  slotRepository: mockSlotRepository,
  eventProducer: mockEventProducer,
  emailClient: mockEmailClient,
};

let CancellationService: any;

beforeEach(async () => {
  jest.resetModules();
  ({ CancellationService } = await import('../../src/app/cancellation/cancellation.service'));
});

describe('CancellationService.cancelBooking', () => {
  it('cancels a confirmed booking and frees the slot', async () => {
    mockBookingRepository.findById.mockResolvedValue(bookingShowroomKitchenFixture);
    mockBookingRepository.update.mockResolvedValue(cancelledBookingFixture);
    mockSlotRepository.markAvailable.mockResolvedValue(undefined);
    mockEventProducer.publish.mockResolvedValue(undefined);
    mockEmailClient.sendBookingCancellation.mockResolvedValue(undefined);

    const service = new CancellationService(mockDeps);
    const result = await service.cancelBooking(cancellationByCustomerPayload);

    expect(result.status).toBe(BOOKING_STATUS.CANCELLED);
    expect(mockSlotRepository.markAvailable).toHaveBeenCalledWith(bookingShowroomKitchenFixture.slotId);
    expect(mockEventProducer.publish).toHaveBeenCalled();
    expect(mockEmailClient.sendBookingCancellation).toHaveBeenCalled();
  });

  it('cancels a booking by admin with admin reason', async () => {
    mockBookingRepository.findById.mockResolvedValue(bookingShowroomKitchenFixture);
    mockBookingRepository.update.mockResolvedValue({
      ...cancelledBookingFixture,
      cancellationReason: cancellationByAdminPayload.cancellationReason,
    });
    mockSlotRepository.markAvailable.mockResolvedValue(undefined);
    mockEventProducer.publish.mockResolvedValue(undefined);
    mockEmailClient.sendBookingCancellation.mockResolvedValue(undefined);

    const service = new CancellationService(mockDeps);
    const result = await service.cancelBooking(cancellationByAdminPayload);

    expect(result.cancellationReason).toBe(cancellationByAdminPayload.cancellationReason);
  });

  it('throws BookingNotFoundError when booking does not exist', async () => {
    mockBookingRepository.findById.mockResolvedValue(null);

    const service = new CancellationService(mockDeps);
    await expect(service.cancelBooking(cancellationByCustomerPayload)).rejects.toThrow(BookingNotFoundError);
  });

  it('throws BookingAlreadyCancelledError when booking is already cancelled', async () => {
    mockBookingRepository.findById.mockResolvedValue(alreadyCancelledBookingFixture);

    const service = new CancellationService(mockDeps);
    await expect(service.cancelBooking(cancellationByCustomerPayload)).rejects.toThrow(BookingAlreadyCancelledError);
  });

  it('does not call markAvailable if cancellation update fails', async () => {
    mockBookingRepository.findById.mockResolvedValue(bookingShowroomKitchenFixture);
    mockBookingRepository.update.mockRejectedValue(new Error('DB error'));

    const service = new CancellationService(mockDeps);
    await expect(service.cancelBooking(cancellationByCustomerPayload)).rejects.toThrow();
    expect(mockSlotRepository.markAvailable).not.toHaveBeenCalled();
  });
});