import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { setupTestEnvironment } from '../../src/tests-helpers/setup';
import { mockPrismaClient } from '../../src/tests-helpers/mocks';
import {
  consultantKitchenFixture,
  consultantsListFixture,
  createConsultantPayload,
} from '../fixtures/consultants.fixture';
import { FIXED_IDS } from '../fixtures/common.fixture';
import { CONSULTANT_SPECIALISATION } from '../../src/shared/constants';

setupTestEnvironment();

let ConsultantRepository: any;

beforeEach(async () => {
  jest.resetModules();
  ({ ConsultantRepository } = await import('../../src/app/consultant/consultant.repository'));
});

describe('ConsultantRepository.create', () => {
  it('calls prisma.consultant.create and returns the created consultant', async () => {
    mockPrismaClient.consultant.create.mockResolvedValue(consultantKitchenFixture);

    const repo = new ConsultantRepository(mockPrismaClient);
    const result = await repo.create(createConsultantPayload);

    expect(mockPrismaClient.consultant.create).toHaveBeenCalledTimes(1);
    expect(result.id).toBe(FIXED_IDS.consultantId);
  });
});

describe('ConsultantRepository.findById', () => {
  it('returns consultant when found', async () => {
    mockPrismaClient.consultant.findUnique.mockResolvedValue(consultantKitchenFixture);

    const repo = new ConsultantRepository(mockPrismaClient);
    const result = await repo.findById(FIXED_IDS.consultantId);

    expect(result?.id).toBe(FIXED_IDS.consultantId);
  });

  it('returns null when not found', async () => {
    mockPrismaClient.consultant.findUnique.mockResolvedValue(null);

    const repo = new ConsultantRepository(mockPrismaClient);
    expect(await repo.findById('missing-id')).toBeNull();
  });
});

describe('ConsultantRepository.findAll', () => {
  it('returns all consultants without filters', async () => {
    mockPrismaClient.consultant.findMany.mockResolvedValue(consultantsListFixture);

    const repo = new ConsultantRepository(mockPrismaClient);
    const result = await repo.findAll({});

    expect(result).toHaveLength(consultantsListFixture.length);
  });

  it('filters by specialisation when provided', async () => {
    const kitchen = consultantsListFixture.filter(
      c => c.specialisation === CONSULTANT_SPECIALISATION.KITCHEN,
    );
    mockPrismaClient.consultant.findMany.mockResolvedValue(kitchen);

    const repo = new ConsultantRepository(mockPrismaClient);
    await repo.findAll({ specialisation: CONSULTANT_SPECIALISATION.KITCHEN });

    expect(mockPrismaClient.consultant.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          specialisation: CONSULTANT_SPECIALISATION.KITCHEN,
        }),
      }),
    );
  });

  it('filters by isActive when provided', async () => {
    const active = consultantsListFixture.filter(c => c.isActive);
    mockPrismaClient.consultant.findMany.mockResolvedValue(active);

    const repo = new ConsultantRepository(mockPrismaClient);
    await repo.findAll({ isActive: true });

    expect(mockPrismaClient.consultant.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isActive: true }),
      }),
    );
  });
});

describe('ConsultantRepository.update', () => {
  it('calls prisma update with correct id and data', async () => {
    const updated = { ...consultantKitchenFixture, name: 'Updated Name' };
    mockPrismaClient.consultant.update.mockResolvedValue(updated);

    const repo = new ConsultantRepository(mockPrismaClient);
    const result = await repo.update(FIXED_IDS.consultantId, { name: 'Updated Name' });

    expect(mockPrismaClient.consultant.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: FIXED_IDS.consultantId } }),
    );
    expect(result.name).toBe('Updated Name');
  });
});

describe('ConsultantRepository.findActiveBySpecialisation', () => {
  it('returns active consultants matching specialisation', async () => {
    mockPrismaClient.consultant.findMany.mockResolvedValue([consultantKitchenFixture]);

    const repo = new ConsultantRepository(mockPrismaClient);
    const result = await repo.findActiveBySpecialisation(CONSULTANT_SPECIALISATION.KITCHEN);

    expect(mockPrismaClient.consultant.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isActive: true,
          specialisation: expect.objectContaining({ in: expect.arrayContaining([CONSULTANT_SPECIALISATION.KITCHEN]) }),
        }),
      }),
    );
  });
});