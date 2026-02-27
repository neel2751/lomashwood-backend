import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { setupTestEnvironment } from '../../src/tests-helpers/setup';
import { mockPrismaClient } from '../../src/tests-helpers/mocks';
import { rescheduledBookingFixture, originalBookingAfterRescheduleFixture } from '../fixtures/reschedules.fixture';
import { FIXED_IDS } from '../fixtures/common.fixture';
import { BOOKING_STATUS } from '../../src/shared/constants';

setupTestEnvironment();

let RescheduleRepository: any;

beforeEach(async () => {
  jest.resetModules();
  ({ RescheduleRepository } = await import('../../src/app/reschedule/reschedule.repository'));
});

describe('RescheduleRepository.markRescheduled', () => {
  it('sets original booking status to RESCHEDULED', async () => {
    mockPrismaClient.booking.update.mockResolvedValue(originalBookingAfterRescheduleFixture);

    const repo = new RescheduleRepository(mockPrismaClient);
    const result = await repo.markRescheduled(FIXED_IDS.bookingId);

    expect(mockPrismaClient.booking.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: FIXED_IDS.bookingId },
        data: expect.objectContaining({ status: BOOKING_STATUS.RESCHEDULED }),
      }),
    );
    expect(result.status).toBe(BOOKING_STATUS.RESCHEDULED);
  });
});

describe('RescheduleRepository.createRescheduled', () => {
  it('creates a new booking linked to original via rescheduledFromId', async () => {
    mockPrismaClient.booking.create.mockResolvedValue(rescheduledBookingFixture);

    const repo = new RescheduleRepository(mockPrismaClient);
    const result = await repo.createRescheduled(rescheduledBookingFixture);

    expect(mockPrismaClient.booking.create).toHaveBeenCalledTimes(1);
    expect(result.rescheduledFromId).toBe(FIXED_IDS.bookingId);
  });
});