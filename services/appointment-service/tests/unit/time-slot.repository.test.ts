import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { setupTestEnvironment } from '../../src/tests-helpers/setup';
import { mockPrismaClient } from '../../src/tests-helpers/mocks';
import {
  slotAvailableFixture,
  slotBookedFixture,
  availableSlotsListFixture,
  createSlotPayload,
} from '../fixtures/time-slots.fixture';
import { FIXED_IDS, futureDate } from '../fixtures/common.fixture';
import { SLOT_STATUS } from '../../src/shared/constants';

setupTestEnvironment();

let SlotRepository: any;

beforeEach(async () => {
  jest.resetModules();
  ({ SlotRepository } = await import('../../src/app/time-slot/time-slot.repository'));
});

describe('SlotRepository.create', () => {
  it('creates and returns a new slot', async () => {
    mockPrismaClient.slot.create.mockResolvedValue(slotAvailableFixture);

    const repo = new SlotRepository(mockPrismaClient);
    const result = await repo.create(createSlotPayload);

    expect(mockPrismaClient.slot.create).toHaveBeenCalledTimes(1);
    expect(result.status).toBe(SLOT_STATUS.AVAILABLE);
  });
});

describe('SlotRepository.findById', () => {
  it('returns slot when found', async () => {
    mockPrismaClient.slot.findUnique.mockResolvedValue(slotAvailableFixture);

    const repo = new SlotRepository(mockPrismaClient);
    expect(await repo.findById(FIXED_IDS.slotId)).not.toBeNull();
  });

  it('returns null when not found', async () => {
    mockPrismaClient.slot.findUnique.mockResolvedValue(null);

    const repo = new SlotRepository(mockPrismaClient);
    expect(await repo.findById('missing')).toBeNull();
  });
});

describe('SlotRepository.findAvailable', () => {
  it('returns only AVAILABLE slots within date range', async () => {
    mockPrismaClient.slot.findMany.mockResolvedValue(availableSlotsListFixture);

    const repo = new SlotRepository(mockPrismaClient);
    await repo.findAvailable(FIXED_IDS.consultantId, futureDate(1), futureDate(30));

    expect(mockPrismaClient.slot.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: SLOT_STATUS.AVAILABLE,
          consultantId: FIXED_IDS.consultantId,
        }),
      }),
    );
  });
});

describe('SlotRepository.markBooked', () => {
  it('updates slot status to BOOKED and sets bookingId', async () => {
    const booked = { ...slotAvailableFixture, status: SLOT_STATUS.BOOKED, bookingId: FIXED_IDS.bookingId };
    mockPrismaClient.slot.update.mockResolvedValue(booked);

    const repo = new SlotRepository(mockPrismaClient);
    await repo.markBooked(FIXED_IDS.slotId, FIXED_IDS.bookingId);

    expect(mockPrismaClient.slot.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: FIXED_IDS.slotId },
        data: expect.objectContaining({ status: SLOT_STATUS.BOOKED, bookingId: FIXED_IDS.bookingId }),
      }),
    );
  });
});

describe('SlotRepository.markAvailable', () => {
  it('updates slot status back to AVAILABLE and clears bookingId', async () => {
    const available = { ...slotBookedFixture, status: SLOT_STATUS.AVAILABLE, bookingId: null };
    mockPrismaClient.slot.update.mockResolvedValue(available);

    const repo = new SlotRepository(mockPrismaClient);
    await repo.markAvailable(FIXED_IDS.secondSlotId);

    expect(mockPrismaClient.slot.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: FIXED_IDS.secondSlotId },
        data: expect.objectContaining({ status: SLOT_STATUS.AVAILABLE, bookingId: null }),
      }),
    );
  });
});