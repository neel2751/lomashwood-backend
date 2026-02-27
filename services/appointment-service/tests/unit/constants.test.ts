import { describe, it, expect } from '@jest/globals';
import {
  APPOINTMENT_TYPE,
  BOOKING_STATUS,
  BOOKING_WINDOW_DAYS,
  CACHE_PREFIX,
  CACHE_TTL,
  CONSULTANT_SPECIALISATION,
  DAY_OF_WEEK,
  MAX_RETRY_ATTEMPTS,
  PAGINATION,
  REMINDER_CHANNEL,
  REMINDER_OFFSETS_HOURS,
  REMINDER_STATUS,
  REMINDER_TYPE,
  SLOT_DURATION_MINUTES,
  SLOT_STATUS,
} from '../../src/shared/constants';

describe('constants', () => {
  describe('APPOINTMENT_TYPE', () => {
    it('contains HOME_MEASUREMENT, ONLINE and SHOWROOM', () => {
      expect(APPOINTMENT_TYPE.HOME_MEASUREMENT).toBe('HOME_MEASUREMENT');
      expect(APPOINTMENT_TYPE.ONLINE).toBe('ONLINE');
      expect(APPOINTMENT_TYPE.SHOWROOM).toBe('SHOWROOM');
    });

    it('has exactly 3 values', () => {
      expect(Object.keys(APPOINTMENT_TYPE)).toHaveLength(3);
    });
  });

  describe('BOOKING_STATUS', () => {
    it('contains all expected statuses', () => {
      expect(BOOKING_STATUS.PENDING).toBe('PENDING');
      expect(BOOKING_STATUS.CONFIRMED).toBe('CONFIRMED');
      expect(BOOKING_STATUS.CANCELLED).toBe('CANCELLED');
      expect(BOOKING_STATUS.COMPLETED).toBe('COMPLETED');
      expect(BOOKING_STATUS.NO_SHOW).toBe('NO_SHOW');
      expect(BOOKING_STATUS.RESCHEDULED).toBe('RESCHEDULED');
    });

    it('has exactly 6 statuses', () => {
      expect(Object.keys(BOOKING_STATUS)).toHaveLength(6);
    });
  });

  describe('SLOT_STATUS', () => {
    it('contains AVAILABLE, BOOKED and BLOCKED', () => {
      expect(SLOT_STATUS.AVAILABLE).toBe('AVAILABLE');
      expect(SLOT_STATUS.BOOKED).toBe('BOOKED');
      expect(SLOT_STATUS.BLOCKED).toBe('BLOCKED');
    });
  });

  describe('REMINDER_TYPE', () => {
    it('contains all reminder types', () => {
      expect(REMINDER_TYPE.APPOINTMENT_24H).toBe('APPOINTMENT_24H');
      expect(REMINDER_TYPE.APPOINTMENT_1H).toBe('APPOINTMENT_1H');
      expect(REMINDER_TYPE.APPOINTMENT_CONFIRMATION).toBe('APPOINTMENT_CONFIRMATION');
      expect(REMINDER_TYPE.APPOINTMENT_CANCELLATION).toBe('APPOINTMENT_CANCELLATION');
      expect(REMINDER_TYPE.APPOINTMENT_RESCHEDULED).toBe('APPOINTMENT_RESCHEDULED');
    });

    it('has exactly 5 reminder types', () => {
      expect(Object.keys(REMINDER_TYPE)).toHaveLength(5);
    });
  });

  describe('REMINDER_CHANNEL', () => {
    it('contains EMAIL, SMS and PUSH', () => {
      expect(REMINDER_CHANNEL.EMAIL).toBe('EMAIL');
      expect(REMINDER_CHANNEL.SMS).toBe('SMS');
      expect(REMINDER_CHANNEL.PUSH).toBe('PUSH');
    });
  });

  describe('REMINDER_STATUS', () => {
    it('contains PENDING, SENT, DELIVERED and FAILED', () => {
      expect(REMINDER_STATUS.PENDING).toBe('PENDING');
      expect(REMINDER_STATUS.SENT).toBe('SENT');
      expect(REMINDER_STATUS.DELIVERED).toBe('DELIVERED');
      expect(REMINDER_STATUS.FAILED).toBe('FAILED');
    });
  });

  describe('CONSULTANT_SPECIALISATION', () => {
    it('contains KITCHEN, BEDROOM and BOTH', () => {
      expect(CONSULTANT_SPECIALISATION.KITCHEN).toBe('KITCHEN');
      expect(CONSULTANT_SPECIALISATION.BEDROOM).toBe('BEDROOM');
      expect(CONSULTANT_SPECIALISATION.BOTH).toBe('BOTH');
    });
  });

  describe('DAY_OF_WEEK', () => {
    it('maps days correctly from 0 to 6', () => {
      expect(DAY_OF_WEEK.SUNDAY).toBe(0);
      expect(DAY_OF_WEEK.MONDAY).toBe(1);
      expect(DAY_OF_WEEK.TUESDAY).toBe(2);
      expect(DAY_OF_WEEK.WEDNESDAY).toBe(3);
      expect(DAY_OF_WEEK.THURSDAY).toBe(4);
      expect(DAY_OF_WEEK.FRIDAY).toBe(5);
      expect(DAY_OF_WEEK.SATURDAY).toBe(6);
    });

    it('has exactly 7 days', () => {
      expect(Object.keys(DAY_OF_WEEK)).toHaveLength(7);
    });
  });

  describe('numeric constants', () => {
    it('BOOKING_WINDOW_DAYS is 90', () => {
      expect(BOOKING_WINDOW_DAYS).toBe(90);
    });

    it('SLOT_DURATION_MINUTES is 60', () => {
      expect(SLOT_DURATION_MINUTES).toBe(60);
    });

    it('MAX_RETRY_ATTEMPTS is 3', () => {
      expect(MAX_RETRY_ATTEMPTS).toBe(3);
    });
  });

  describe('REMINDER_OFFSETS_HOURS', () => {
    it('APPOINTMENT_24H offset is 24', () => {
      expect(REMINDER_OFFSETS_HOURS.APPOINTMENT_24H).toBe(24);
    });

    it('APPOINTMENT_1H offset is 1', () => {
      expect(REMINDER_OFFSETS_HOURS.APPOINTMENT_1H).toBe(1);
    });
  });

  describe('PAGINATION', () => {
    it('DEFAULT_PAGE is 1', () => {
      expect(PAGINATION.DEFAULT_PAGE).toBe(1);
    });

    it('DEFAULT_LIMIT is 20', () => {
      expect(PAGINATION.DEFAULT_LIMIT).toBe(20);
    });

    it('MAX_LIMIT is 100', () => {
      expect(PAGINATION.MAX_LIMIT).toBe(100);
    });
  });

  describe('CACHE_TTL', () => {
    it('has valid TTL values for all entities', () => {
      expect(CACHE_TTL.AVAILABILITY).toBeGreaterThan(0);
      expect(CACHE_TTL.CONSULTANT).toBeGreaterThan(0);
      expect(CACHE_TTL.SHOWROOM).toBeGreaterThan(0);
      expect(CACHE_TTL.BOOKING).toBeGreaterThan(0);
    });
  });

  describe('CACHE_PREFIX', () => {
    it('has unique prefix strings', () => {
      const values = Object.values(CACHE_PREFIX);
      const unique = new Set(values);
      expect(unique.size).toBe(values.length);
    });
  });
});