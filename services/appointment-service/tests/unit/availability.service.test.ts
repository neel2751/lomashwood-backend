import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { setupTestEnvironment } from '../../src/tests-helpers/setup';
import { mockAvailabilityRepository, mockConsultantRepository } from '../../src/tests-helpers/mocks';
import {
  availabilityMondayFixture,
  consultantAvailabilityListFixture,
  createAvailabilityPayload,
} from '../fixtures/availability.fixture';
import { consultantKitchenFixture, consultantInactiveFixture } from '../fixtures/consultants.fixture';
import { FIXED_IDS } from '../fixtures/common.fixture';
import { AvailabilityNotFoundError, ConsultantNotFoundError } from '../../src/shared/errors';

setupTestEnvironment();

const mockDeps = {
  availabilityRepository: mockAvailabilityRepository,
  consultantRepository: mockConsultantRepository,
};

let AvailabilityService: any;

beforeEach(async () => {
  jest.resetModules();
  ({ AvailabilityService } = await import('../../src/app/availability/availability.service'));
});

describe('AvailabilityService.getConsultantAvailability', () => {
  it('returns availability list for an existing consultant', async () => {
    mockConsultantRepository.findById.mockResolvedValue(consultantKitchenFixture);
    mockAvailabilityRepository.findByConsultantId.mockResolvedValue(consultantAvailabilityListFixture);

    const service = new AvailabilityService(mockDeps);
    const result = await service.getConsultantAvailability(FIXED_IDS.consultantId);

    expect(result).toHaveLength(consultantAvailabilityListFixture.length);
  });

  it('throws ConsultantNotFoundError when consultant does not exist', async () => {
    mockConsultantRepository.findById.mockResolvedValue(null);

    const service = new AvailabilityService(mockDeps);
    await expect(service.getConsultantAvailability('nonexistent')).rejects.toThrow(ConsultantNotFoundError);
  });
});

describe('AvailabilityService.createAvailability', () => {
  it('creates availability for an active consultant', async () => {
    mockConsultantRepository.findById.mockResolvedValue(consultantKitchenFixture);
    mockAvailabilityRepository.create.mockResolvedValue(availabilityMondayFixture);

    const service = new AvailabilityService(mockDeps);
    const result = await service.createAvailability(createAvailabilityPayload);

    expect(result.id).toBe(FIXED_IDS.availabilityId);
    expect(result.dayOfWeek).toBe(1);
  });
});

describe('AvailabilityService.deleteAvailability', () => {
  it('deletes an existing availability record', async () => {
    mockAvailabilityRepository.findById.mockResolvedValue(availabilityMondayFixture);
    mockAvailabilityRepository.delete.mockResolvedValue(undefined);

    const service = new AvailabilityService(mockDeps);
    await expect(service.deleteAvailability(FIXED_IDS.availabilityId)).resolves.not.toThrow();
    expect(mockAvailabilityRepository.delete).toHaveBeenCalledWith(FIXED_IDS.availabilityId);
  });

  it('throws AvailabilityNotFoundError when record does not exist', async () => {
    mockAvailabilityRepository.findById.mockResolvedValue(null);

    const service = new AvailabilityService(mockDeps);
    await expect(service.deleteAvailability('nonexistent')).rejects.toThrow(AvailabilityNotFoundError);
  });
});