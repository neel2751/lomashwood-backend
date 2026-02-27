import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { setupTestEnvironment } from '../../src/tests-helpers/setup';
import { mockConsultantRepository, mockEventProducer } from '../../src/tests-helpers/mocks';
import {
  consultantKitchenFixture,
  consultantInactiveFixture,
  consultantsListFixture,
  createConsultantPayload,
  updateConsultantPayload,
} from '../fixtures/consultants.fixture';
import { FIXED_IDS } from '../fixtures/common.fixture';
import {
  ConsultantNotActiveError,
  ConsultantNotFoundError,
} from '../../src/shared/errors';
import { CONSULTANT_SPECIALISATION } from '../../src/shared/constants';

setupTestEnvironment();

const mockDeps = {
  consultantRepository: mockConsultantRepository,
  eventProducer: mockEventProducer,
};

let ConsultantService: any;

beforeEach(async () => {
  jest.resetModules();
  ({ ConsultantService } = await import('../../src/app/consultant/consultant.service'));
});

describe('ConsultantService.createConsultant', () => {
  it('creates and returns a new consultant', async () => {
    mockConsultantRepository.create.mockResolvedValue(consultantKitchenFixture);
    mockEventProducer.publish.mockResolvedValue(undefined);

    const service = new ConsultantService(mockDeps);
    const result = await service.createConsultant(createConsultantPayload);

    expect(result.id).toBe(FIXED_IDS.consultantId);
    expect(mockConsultantRepository.create).toHaveBeenCalledTimes(1);
    expect(mockEventProducer.publish).toHaveBeenCalled();
  });
});

describe('ConsultantService.getConsultantById', () => {
  it('returns the consultant when found', async () => {
    mockConsultantRepository.findById.mockResolvedValue(consultantKitchenFixture);

    const service = new ConsultantService(mockDeps);
    const result = await service.getConsultantById(FIXED_IDS.consultantId);

    expect(result.id).toBe(FIXED_IDS.consultantId);
  });

  it('throws ConsultantNotFoundError when not found', async () => {
    mockConsultantRepository.findById.mockResolvedValue(null);

    const service = new ConsultantService(mockDeps);
    await expect(service.getConsultantById('nonexistent-id')).rejects.toThrow(ConsultantNotFoundError);
  });
});

describe('ConsultantService.getAllConsultants', () => {
  it('returns paginated consultants', async () => {
    mockConsultantRepository.findAll.mockResolvedValue(consultantsListFixture);
    mockConsultantRepository.count.mockResolvedValue(consultantsListFixture.length);

    const service = new ConsultantService(mockDeps);
    const result = await service.getAllConsultants({ page: 1, limit: 20 });

    expect(result.data).toHaveLength(consultantsListFixture.length);
    expect(result.meta.total).toBe(consultantsListFixture.length);
  });
});

describe('ConsultantService.updateConsultant', () => {
  it('updates and returns the consultant', async () => {
    const updated = { ...consultantKitchenFixture, ...updateConsultantPayload };
    mockConsultantRepository.findById.mockResolvedValue(consultantKitchenFixture);
    mockConsultantRepository.update.mockResolvedValue(updated);
    mockEventProducer.publish.mockResolvedValue(undefined);

    const service = new ConsultantService(mockDeps);
    const result = await service.updateConsultant(FIXED_IDS.consultantId, updateConsultantPayload);

    expect(result.name).toBe(updateConsultantPayload.name);
    expect(mockEventProducer.publish).toHaveBeenCalled();
  });

  it('throws ConsultantNotFoundError when consultant does not exist', async () => {
    mockConsultantRepository.findById.mockResolvedValue(null);

    const service = new ConsultantService(mockDeps);
    await expect(
      service.updateConsultant('nonexistent-id', updateConsultantPayload),
    ).rejects.toThrow(ConsultantNotFoundError);
  });
});

describe('ConsultantService.deactivateConsultant', () => {
  it('sets isActive to false and publishes event', async () => {
    const deactivated = { ...consultantKitchenFixture, isActive: false };
    mockConsultantRepository.findById.mockResolvedValue(consultantKitchenFixture);
    mockConsultantRepository.update.mockResolvedValue(deactivated);
    mockEventProducer.publish.mockResolvedValue(undefined);

    const service = new ConsultantService(mockDeps);
    const result = await service.deactivateConsultant(FIXED_IDS.consultantId);

    expect(result.isActive).toBe(false);
    expect(mockEventProducer.publish).toHaveBeenCalled();
  });
});

describe('ConsultantService.activateConsultant', () => {
  it('sets isActive to true for inactive consultant', async () => {
    const activated = { ...consultantInactiveFixture, isActive: true };
    mockConsultantRepository.findById.mockResolvedValue(consultantInactiveFixture);
    mockConsultantRepository.update.mockResolvedValue(activated);
    mockEventProducer.publish.mockResolvedValue(undefined);

    const service = new ConsultantService(mockDeps);
    const result = await service.activateConsultant(consultantInactiveFixture.id);

    expect(result.isActive).toBe(true);
  });
});