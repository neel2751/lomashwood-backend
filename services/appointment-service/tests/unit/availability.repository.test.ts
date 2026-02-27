import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { setupTestEnvironment } from '../../src/tests-helpers/setup';
import { mockPrismaClient } from '../../src/tests-helpers/mocks';
import {
  availabilityMondayFixture,
  consultantAvailabilityListFixture,
  createAvailabilityPayload,
} from '../fixtures/availability.fixture';
import { FIXED_IDS } from '../fixtures/common.fixture';

setupTestEnvironment();

let AvailabilityRepository: any;

beforeEach(async () => {
  jest.resetModules();
  ({ AvailabilityRepository } = await import('../../src/app/availability/availability.repository'));
});

describe('AvailabilityRepository.create', () => {
  it('calls prisma.availability.create and returns created record', async () => {
    mockPrismaClient.availability.create.mockResolvedValue(availabilityMondayFixture);

    const repo = new AvailabilityRepository(mockPrismaClient);
    const result = await repo.create(createAvailabilityPayload);

    expect(mockPrismaClient.availability.create).toHaveBeenCalledTimes(1);
    expect(result.id).toBe(FIXED_IDS.availabilityId);
  });
});

describe('AvailabilityRepository.findById', () => {
  it('returns availability when found', async () => {
    mockPrismaClient.availability.findUnique.mockResolvedValue(availabilityMondayFixture);

    const repo = new AvailabilityRepository(mockPrismaClient);
    expect(await repo.findById(FIXED_IDS.availabilityId)).not.toBeNull();
  });

  it('returns null when not found', async () => {
    mockPrismaClient.availability.findUnique.mockResolvedValue(null);

    const repo = new AvailabilityRepository(mockPrismaClient);
    expect(await repo.findById('missing')).toBeNull();
  });
});

describe('AvailabilityRepository.findByConsultantId', () => {
  it('returns all availability records for a consultant', async () => {
    mockPrismaClient.availability.findMany.mockResolvedValue(consultantAvailabilityListFixture);

    const repo = new AvailabilityRepository(mockPrismaClient);
    const result = await repo.findByConsultantId(FIXED_IDS.consultantId);

    expect(result).toHaveLength(consultantAvailabilityListFixture.length);
    expect(mockPrismaClient.availability.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ consultantId: FIXED_IDS.consultantId }),
      }),
    );
  });
});

describe('AvailabilityRepository.delete', () => {
  it('calls prisma.availability.delete with the correct id', async () => {
    mockPrismaClient.availability.delete.mockResolvedValue(availabilityMondayFixture);

    const repo = new AvailabilityRepository(mockPrismaClient);
    await repo.delete(FIXED_IDS.availabilityId);

    expect(mockPrismaClient.availability.delete).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: FIXED_IDS.availabilityId } }),
    );
  });
});

describe('AvailabilityRepository.update', () => {
  it('updates and returns the availability record', async () => {
    const updated = { ...availabilityMondayFixture, isActive: false };
    mockPrismaClient.availability.update.mockResolvedValue(updated);

    const repo = new AvailabilityRepository(mockPrismaClient);
    const result = await repo.update(FIXED_IDS.availabilityId, { isActive: false });

    expect(result.isActive).toBe(false);
  });
});