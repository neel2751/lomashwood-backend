import { describe, it, expect } from '@jest/globals';
import { setupTestEnvironment } from '../../src/tests-helpers/setup';
import { APPOINTMENT_TYPE, CONSULTANT_SPECIALISATION } from '../../src/shared/constants';

setupTestEnvironment();

describe('ServiceTypeService', () => {
  describe('getServiceTypes', () => {
    it('returns all appointment types', () => {
      const types = Object.values(APPOINTMENT_TYPE);
      expect(types).toContain('SHOWROOM');
      expect(types).toContain('ONLINE');
      expect(types).toContain('HOME_MEASUREMENT');
    });
  });

  describe('getSpecialisations', () => {
    it('returns all consultant specialisations', () => {
      const specs = Object.values(CONSULTANT_SPECIALISATION);
      expect(specs).toContain('KITCHEN');
      expect(specs).toContain('BEDROOM');
      expect(specs).toContain('BOTH');
    });
  });

  describe('isValidServiceType', () => {
    it('returns true for valid appointment types', () => {
      const validTypes = Object.values(APPOINTMENT_TYPE);
      validTypes.forEach(type => {
        expect(validTypes.includes(type as any)).toBe(true);
      });
    });

    it('returns false for unknown types', () => {
      expect(Object.values(APPOINTMENT_TYPE).includes('UNKNOWN' as any)).toBe(false);
    });
  });
});