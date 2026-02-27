import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { setupTestEnvironment } from '../../src/tests-helpers/setup';
import { mockShowroomRepository } from '../../src/tests-helpers/mocks';
import {
  showroomClaphamFixture,
  showroomBrightonFixture,
  showroomsListFixture,
} from '../fixtures/locations.fixture';
import { FIXED_IDS } from '../fixtures/common.fixture';
import { ShowroomNotFoundError } from '../../src/shared/errors';

setupTestEnvironment();

const mockDeps = { showroomRepository: mockShowroomRepository };

let LocationService: any;

beforeEach(async () => {
  jest.resetModules();
  ({ LocationService } = await import('../../src/app/location/location.service'));
});

describe('LocationService.getShowroomById', () => {
  it('returns showroom when found', async () => {
    mockShowroomRepository.findById.mockResolvedValue(showroomClaphamFixture);

    const service = new LocationService(mockDeps);
    const result = await service.getShowroomById(FIXED_IDS.showroomId);

    expect(result.id).toBe(FIXED_IDS.showroomId);
    expect(result.name).toBe('Lomash Wood Clapham');
  });

  it('throws ShowroomNotFoundError when not found', async () => {
    mockShowroomRepository.findById.mockResolvedValue(null);

    const service = new LocationService(mockDeps);
    await expect(service.getShowroomById('nonexistent')).rejects.toThrow(ShowroomNotFoundError);
  });
});

describe('LocationService.getActiveShowrooms', () => {
  it('returns only active showrooms', async () => {
    mockShowroomRepository.findActive.mockResolvedValue(showroomsListFixture);

    const service = new LocationService(mockDeps);
    const result = await service.getActiveShowrooms();

    expect(result).toHaveLength(showroomsListFixture.length);
    expect(result.every((s: any) => s.isActive)).toBe(true);
  });
});

describe('LocationService.getAllShowrooms', () => {
  it('returns all showrooms including inactive', async () => {
    const all = [...showroomsListFixture, { ...showroomClaphamFixture, isActive: false }];
    mockShowroomRepository.findAll.mockResolvedValue(all);

    const service = new LocationService(mockDeps);
    const result = await service.getAllShowrooms();

    expect(result).toHaveLength(all.length);
  });
});