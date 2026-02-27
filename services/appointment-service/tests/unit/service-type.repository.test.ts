import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { setupTestEnvironment } from '../../src/tests-helpers/setup';
import { mockPrismaClient } from '../../src/tests-helpers/mocks';
import { APPOINTMENT_TYPE } from '../../src/shared/constants';

setupTestEnvironment();

let ServiceTypeRepository: any;

beforeEach(async () => {
  jest.resetModules();
  ({ ServiceTypeRepository } = await import('../../src/app/service-type/service-type.repository'));
});

describe('ServiceTypeRepository', () => {
  it('is importable and instantiable', () => {
    const repo = new ServiceTypeRepository(mockPrismaClient);
    expect(repo).toBeDefined();
  });

  describe('findAll', () => {
    it('returns static service type definitions', async () => {
      const repo = new ServiceTypeRepository(mockPrismaClient);
      const result = await repo.findAll();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('findByType', () => {
    it('returns the correct service type for SHOWROOM', async () => {
      const repo = new ServiceTypeRepository(mockPrismaClient);
      const result = await repo.findByType(APPOINTMENT_TYPE.SHOWROOM);
      expect(result).toBeDefined();
    });

    it('returns null for unknown type', async () => {
      const repo = new ServiceTypeRepository(mockPrismaClient);
      const result = await repo.findByType('UNKNOWN');
      expect(result).toBeNull();
    });
  });
});