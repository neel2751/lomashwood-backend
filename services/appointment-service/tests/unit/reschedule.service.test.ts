import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { setupTestEnvironment } from '../../src/tests-helpers/setup';
import { mockBookingRepository, mockSlotRepository, mockEventProducer, mockEmailClient } from '../../src/tests-helpers/mocks';
import {
  bookingShowroomKitchenFixture,
  bookingCompletedFixture,
} from '../fixtures/bookings.fixture';
import {
  reschedulePayload,
  rescheduledBookingFixture,
  originalBookingAfterRescheduleFixture,
  rescheduleToSameSlotPayload,
  rescheduleCompletedBookingPayload,
} from '../fixtures/reschedules.fixture';
import { slotAvailableFixture, slotRescheduleTargetFixture, slotBookedFixture } from '../fixtures/time-slots.fixture';
import { FIXED_IDS } from '../fixtures/common.fixture';
import {
  BookingNotFoundError,
  SlotUnavailableError,
} from '../../src/shared/errors';
import { BOOKING_STATUS } from '../../src/shared/constants';

setupTestEnvironment();

const mockDeps = {
  bookingRepository: mockBookingRepository,
  slotRepository: mockSlotRepository,
  eventProducer: mockEventProducer,
  emailClient: mockEmailClient,
};

let RescheduleService: any;

beforeEach(async () => {
  jest.resetModules();
  ({ RescheduleService } = await import('../../src/app/reschedule/reschedule.service'));
});

describe('RescheduleService.rescheduleBooking', () => {
  it('reschedules booking, frees old slot, marks new slot booked', async () => {
    mockBookingRepository.findById.mockResolvedValue(bookingShowroomKitchenFixture);
    mockSlotRepository.findById.mockResolvedValue(slotRescheduleTargetFixture);
    mockBookingRepository.update.mockResolvedValueOnce(originalBookingAfterRescheduleFixture);
    mockBookingRepository.create.mockResolvedValue(rescheduledBookingFixture);
    mockSlotRepository.markAvailable.mockResolvedValue(undefined);
    mockSlotRepository.markBooked.mockResolvedValue(undefined);
    mockEventProducer.publish.mockResolvedValue(undefined);
    mockEmailClient.sendBookingRescheduled.mockResolvedValue(undefined);

    const service = new RescheduleService(mockDeps);
    const result = await service.rescheduleBooking(reschedulePayload);

    expect(result.rescheduledFromId).toBe(FIXED_IDS.bookingId);
    expect(mockSlotRepository.markAvailable).toHaveBeenCalledWith(bookingShowroomKitchenFixture.slotId);
    expect(mockSlotRepository.markBooked).toHaveBeenCalledWith(FIXED_IDS.rescheduleSlotId, expect.any(String));
    expect(mockEventProducer.publish).toHaveBeenCalled();
    expect(mockEmailClient.sendBookingRescheduled).toHaveBeenCalled();
  });

  it('throws BookingNotFoundError when original booking does not exist', async () => {
    mockBookingRepository.findById.mockResolvedValue(null);

    const service = new RescheduleService(mockDeps);
    await expect(service.rescheduleBooking(reschedulePayload)).rejects.toThrow(BookingNotFoundError);
  });

  it('throws SlotUnavailableError when target slot is already booked', async () => {
    mockBookingRepository.findById.mockResolvedValue(bookingShowroomKitchenFixture);
    mockSlotRepository.findById.mockResolvedValue(slotBookedFixture);

    const service = new RescheduleService(mockDeps);
    await expect(service.rescheduleBooking(reschedulePayload)).rejects.toThrow(SlotUnavailableError);
  });

  it('throws SlotUnavailableError when target slot does not exist', async () => {
    mockBookingRepository.findById.mockResolvedValue(bookingShowroomKitchenFixture);
    mockSlotRepository.findById.mockResolvedValue(null);

    const service = new RescheduleService(mockDeps);
    await expect(service.rescheduleBooking(reschedulePayload)).rejects.toThrow(SlotUnavailableError);
  });

  it('throws when trying to reschedule to the same slot', async () => {
    mockBookingRepository.findById.mockResolvedValue(bookingShowroomKitchenFixture);

    const service = new RescheduleService(mockDeps);
    await expect(service.rescheduleBooking(rescheduleToSameSlotPayload)).rejects.toThrow();
  });
});