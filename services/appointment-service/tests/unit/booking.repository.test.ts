import { describe, it, expect, beforeEach } from '@jest/globals';
import { setupTestEnvironment } from '../../src/tests-helpers/setup';
import { mockPrismaClient } from '../../src/tests-helpers/mocks';
import {
  bookingShowroomKitchenFixture,
  bookingsListFixture,
  createBookingPayload,
} from '../fixtures/bookings.fixture';
import { FIXED_IDS } from '../fixtures/common.fixture';
import { BOOKING_STATUS } from '../../src/shared/constants';

setupTestEnvironment();

let BookingRepository: any;

beforeEach(async () => {
  jest.resetModules();
  ({ BookingRepository } = await import('../../src/app/booking/booking.repository'));
});

describe('BookingRepository.create', () => {
  it('calls prisma.booking.create with mapped input', async () => {
    mockPrismaClient.booking.create.mockResolvedValue(bookingShowroomKitchenFixture);

    const repo = new BookingRepository(mockPrismaClient);
    const result = await repo.create(createBookingPayload);

    expect(mockPrismaClient.booking.create).toHaveBeenCalledTimes(1);
    expect(result.id).toBe(FIXED_IDS.bookingId);
  });
});

describe('BookingRepository.findById', () => {
  it('returns the booking when found', async () => {
    mockPrismaClient.booking.findUnique.mockResolvedValue(bookingShowroomKitchenFixture);

    const repo = new BookingRepository(mockPrismaClient);
    const result = await repo.findById(FIXED_IDS.bookingId);

    expect(result).not.toBeNull();
    expect(result?.id).toBe(FIXED_IDS.bookingId);
  });

  it('returns null when booking is not found', async () => {
    mockPrismaClient.booking.findUnique.mockResolvedValue(null);

    const repo = new BookingRepository(mockPrismaClient);
    const result = await repo.findById('nonexistent-id');

    expect(result).toBeNull();
  });
});

describe('BookingRepository.findByCustomerId', () => {
  it('returns bookings for the given customer', async () => {
    mockPrismaClient.booking.findMany.mockResolvedValue(bookingsListFixture);

    const repo = new BookingRepository(mockPrismaClient);
    const result = await repo.findByCustomerId(FIXED_IDS.customerId);

    expect(result).toHaveLength(bookingsListFixture.length);
  });

  it('returns empty array when customer has no bookings', async () => {
    mockPrismaClient.booking.findMany.mockResolvedValue([]);

    const repo = new BookingRepository(mockPrismaClient);
    const result = await repo.findByCustomerId('customer-no-bookings');

    expect(result).toHaveLength(0);
  });
});

describe('BookingRepository.findAll', () => {
  it('returns paginated bookings with default pagination', async () => {
    mockPrismaClient.booking.findMany.mockResolvedValue(bookingsListFixture);
    mockPrismaClient.booking.count.mockResolvedValue(bookingsListFixture.length);

    const repo = new BookingRepository(mockPrismaClient);
    const result = await repo.findAll({}, { page: 1, limit: 20 });

    expect(result).toHaveLength(bookingsListFixture.length);
  });

  it('filters by status when provided', async () => {
    const confirmed = bookingsListFixture.filter(b => b.status === BOOKING_STATUS.CONFIRMED);
    mockPrismaClient.booking.findMany.mockResolvedValue(confirmed);

    const repo = new BookingRepository(mockPrismaClient);
    await repo.findAll({ status: BOOKING_STATUS.CONFIRMED }, { page: 1, limit: 20 });

    expect(mockPrismaClient.booking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: BOOKING_STATUS.CONFIRMED }),
      }),
    );
  });
});

describe('BookingRepository.update', () => {
  it('calls prisma.booking.update with the correct id and data', async () => {
    const updated = { ...bookingShowroomKitchenFixture, status: BOOKING_STATUS.CANCELLED };
    mockPrismaClient.booking.update.mockResolvedValue(updated);

    const repo = new BookingRepository(mockPrismaClient);
    const result = await repo.update(FIXED_IDS.bookingId, { status: BOOKING_STATUS.CANCELLED });

    expect(mockPrismaClient.booking.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: FIXED_IDS.bookingId },
        data: expect.objectContaining({ status: BOOKING_STATUS.CANCELLED }),
      }),
    );
    expect(result.status).toBe(BOOKING_STATUS.CANCELLED);
  });
});

describe('BookingRepository.count', () => {
  it('returns total booking count matching filters', async () => {
    mockPrismaClient.booking.count.mockResolvedValue(4);

    const repo = new BookingRepository(mockPrismaClient);
    const result = await repo.count({});

    expect(result).toBe(4);
  });
});