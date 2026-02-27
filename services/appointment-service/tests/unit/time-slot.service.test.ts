import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { setupTestEnvironment } from '../../src/tests-helpers/setup';
import { mockSlotRepository, mockConsultantRepository } from '../../src/tests-helpers/mocks';
import {
  slotAvailableFixture,
  slotBookedFixture,
  availableSlotsListFixture,
  createSlotPayload,
} from '../fixtures/time-slots.fixture';
import { consultantKitchenFixture } from '../fixtures/consultants.fixture';
import { FIXED_IDS, futureDate } from '../fixtures/common.fixture';
import { SlotNotFoundError, ConsultantNotFoundError } from '../../src/shared/errors';
import { SLOT_STATUS } from '../../src/shared/constants';

setupTestEnvironment();

const mockDeps = {
  slotRepository: mockSlotRepository,
  consultantRepository: mockConsultantRepository,
};

let TimeSlotService: any;

beforeEach(async () => {
  jest.resetModules();
  ({ TimeSlotService } = await import('../../src/app/time-slot/time-slot.service'));
});

describe('TimeSlotService.getAvailableSlots', () => {
  it('returns available slots for a consultant within date range', async () => {
    mockConsultantRepository.findById.mockResolvedValue(consultantKitchenFixture);
    mockSlotRepository.findAvailable.mockResolvedValue(availableSlotsListFixture);

    const service = new TimeSlotService(mockDeps);
    const result = await service.getAvailableSlots({
      consultantId: FIXED_IDS.consultantId,
      dateFrom: futureDate(1),
      dateTo: futureDate(30),
    });

    expect(result).toHaveLength(availableSlotsListFixture.length);
    expect(result.every((s: any) => s.status === SLOT_STATUS.AVAILABLE)).toBe(true);
  });

  it('throws ConsultantNotFoundError when consultant does not exist', async () => {
    mockConsultantRepository.findById.mockResolvedValue(null);

    const service = new TimeSlotService(mockDeps);
    await expect(
      service.getAvailableSlots({ consultantId: 'nonexistent', dateFrom: futureDate(1), dateTo: futureDate(30) }),
    ).rejects.toThrow(ConsultantNotFoundError);
  });
});

describe('TimeSlotService.createSlot', () => {
  it('creates a new slot for a consultant', async () => {
    mockConsultantRepository.findById.mockResolvedValue(consultantKitchenFixture);
    mockSlotRepository.create.mockResolvedValue(slotAvailableFixture);

    const service = new TimeSlotService(mockDeps);
    const result = await service.createSlot(createSlotPayload);

    expect(result.status).toBe(SLOT_STATUS.AVAILABLE);
    expect(result.consultantId).toBe(FIXED_IDS.consultantId);
  });
});

describe('TimeSlotService.getSlotById', () => {
  it('returns slot when found', async () => {
    mockSlotRepository.findById.mockResolvedValue(slotAvailableFixture);

    const service = new TimeSlotService(mockDeps);
    const result = await service.getSlotById(FIXED_IDS.slotId);

    expect(result.id).toBe(FIXED_IDS.slotId);
  });

  it('throws SlotNotFoundError when slot does not exist', async () => {
    mockSlotRepository.findById.mockResolvedValue(null);

    const service = new TimeSlotService(mockDeps);
    await expect(service.getSlotById('nonexistent')).rejects.toThrow(SlotNotFoundError);
  });
});