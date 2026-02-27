import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { setupTestEnvironment } from '../../src/tests-helpers/setup';
import { mockPrismaClient } from '../../src/tests-helpers/mocks';
import { bookingShowroomKitchenFixture, bookingsListFixture } from '../fixtures/bookings.fixture';
import { FIXED_IDS } from '../fixtures/common.fixture';
import { APPOINTMENT_TYPE, BOOKING_STATUS } from '../../src/shared/constants';

setupTestEnvironment();

let AppointmentRepository: any;

beforeEach(async () => {
  jest.resetModules();
  ({ AppointmentRepository } = await import('../../src/app/appointment/appointment.repository'));
});

describe('AppointmentRepository.findById', () => {
  it('returns appointment with relations when found', async () => {
    mockPrismaClient.booking.findUnique.mockResolvedValue(bookingShowroomKitchenFixture);

    const repo = new AppointmentRepository(mockPrismaClient);
    const result = await repo.findById(FIXED_IDS.bookingId);

    expect(result?.id).toBe(FIXED_IDS.bookingId);
  });

  it('returns null when not found', async () => {
    mockPrismaClient.booking.findUnique.mockResolvedValue(null);

    const repo = new AppointmentRepository(mockPrismaClient);
    expect(await repo.findById('missing')).toBeNull();
  });
});

describe('AppointmentRepository.findAll', () => {
  it('returns paginated appointments', async () => {
    mockPrismaClient.booking.findMany.mockResolvedValue(bookingsListFixture);
    mockPrismaClient.booking.count.mockResolvedValue(bookingsListFixture.length);

    const repo = new AppointmentRepository(mockPrismaClient);
    const result = await repo.findAll({}, { page: 1, limit: 20 });

    expect(result).toHaveLength(bookingsListFixture.length);
  });

  it('filters by appointmentType', async () => {
    const showroom = bookingsListFixture.filter(b => b.appointmentType === APPOINTMENT_TYPE.SHOWROOM);
    mockPrismaClient.booking.findMany.mockResolvedValue(showroom);

    const repo = new AppointmentRepository(mockPrismaClient);
    await repo.findAll({ appointmentType: APPOINTMENT_TYPE.SHOWROOM }, { page: 1, limit: 20 });

    expect(mockPrismaClient.booking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ appointmentType: APPOINTMENT_TYPE.SHOWROOM }),
      }),
    );
  });

  it('filters by isKitchen flag', async () => {
    mockPrismaClient.booking.findMany.mockResolvedValue(bookingsListFixture.filter(b => b.isKitchen));

    const repo = new AppointmentRepository(mockPrismaClient);
    await repo.findAll({ isKitchen: true }, { page: 1, limit: 20 });

    expect(mockPrismaClient.booking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isKitchen: true }),
      }),
    );
  });
});