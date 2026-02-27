import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { setupTestEnvironment } from '../../src/tests-helpers/setup';
import { mockPrismaClient } from '../../src/tests-helpers/mocks';
import { bookingShowroomKitchenFixture, cancelledBookingFixture } from '../fixtures/bookings.fixture';
import { FIXED_IDS } from '../fixtures/common.fixture';
import { BOOKING_STATUS } from '../../src/shared/constants';

setupTestEnvironment();

let CancellationRepository: any;

beforeEach(async () => {
  jest.resetModules();
  ({ CancellationRepository } = await import('../../src/app/cancellation/cancellation.repository'));
});

describe('CancellationRepository.cancel', () => {
  it('updates booking status to CANCELLED with reason', async () => {
    mockPrismaClient.booking.update.mockResolvedValue(cancelledBookingFixture);

    const repo = new CancellationRepository(mockPrismaClient);
    const result = await repo.cancel(FIXED_IDS.bookingId, 'Change of plans.');

    expect(mockPrismaClient.booking.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: FIXED_IDS.bookingId },
        data: expect.objectContaining({
          status: BOOKING_STATUS.CANCELLED,
          cancellationReason: 'Change of plans.',
        }),
      }),
    );
    expect(result.status).toBe(BOOKING_STATUS.CANCELLED);
  });
});

describe('CancellationRepository.findCancelledByBookingId', () => {
  it('returns cancelled booking by ID', async () => {
    mockPrismaClient.booking.findFirst.mockResolvedValue(cancelledBookingFixture);

    const repo = new CancellationRepository(mockPrismaClient);
    const result = await repo.findCancelledByBookingId(FIXED_IDS.bookingId);

    expect(result?.status).toBe(BOOKING_STATUS.CANCELLED);
  });
});