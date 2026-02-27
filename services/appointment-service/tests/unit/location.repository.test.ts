import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { setupTestEnvironment } from '../../src/tests-helpers/setup';
import { mockPrismaClient } from '../../src/tests-helpers/mocks';
import { showroomClaphamFixture, showroomsListFixture, showroomInactiveFixture } from '../fixtures/locations.fixture';
import { FIXED_IDS } from '../fixtures/common.fixture';

setupTestEnvironment();

let LocationRepository: any;

beforeEach(async () => {
  jest.resetModules();
  ({ LocationRepository } = await import('../../src/app/location/location.repository'));
});

describe('LocationRepository.findById', () => {
  it('returns showroom when found', async () => {
    mockPrismaClient.showroom.findUnique.mockResolvedValue(showroomClaphamFixture);

    const repo = new LocationRepository(mockPrismaClient);
    expect(await repo.findById(FIXED_IDS.showroomId)).not.toBeNull();
  });

  it('returns null when not found', async () => {
    mockPrismaClient.showroom.findUnique.mockResolvedValue(null);

    const repo = new LocationRepository(mockPrismaClient);
    expect(await repo.findById('missing')).toBeNull();
  });
});

describe('LocationRepository.findAll', () => {
  it('returns all showrooms', async () => {
    const all = [...showroomsListFixture, showroomInactiveFixture];
    mockPrismaClient.showroom.findMany.mockResolvedValue(all);

    const repo = new LocationRepository(mockPrismaClient);
    const result = await repo.findAll();

    expect(result).toHaveLength(all.length);
  });
});

describe('LocationRepository.findActive', () => {
  it('returns only active showrooms', async () => {
    mockPrismaClient.showroom.findMany.mockResolvedValue(showroomsListFixture);

    const repo = new LocationRepository(mockPrismaClient);
    await repo.findActive();

    expect(mockPrismaClient.showroom.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isActive: true }),
      }),
    );
  });
});