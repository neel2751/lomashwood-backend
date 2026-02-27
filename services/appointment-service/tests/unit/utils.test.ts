import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  addDays,
  addHours,
  addMinutes,
  chunkArray,
  combineDateAndTime,
  daysBetween,
  doesSlotOverlap,
  endOfDay,
  formatAppointmentConfirmationDate,
  formatAppointmentTime,
  generateId,
  generateSlotEndTime,
  isDateInPast,
  isValidUUID,
  maskEmail,
  maskPhone,
  omitNullish,
  sanitiseString,
  sleep,
  startOfDay,
  toISODateString,
  toTimeString,
  validateBookingDate,
  validateDateRange,
} from '../../src/shared/utils';
import { BookingWindowExceededError, InvalidDateRangeError, PastDateBookingError } from '../../src/shared/errors';

describe('generateId', () => {
  it('returns a valid UUID v4', () => {
    const id = generateId();
    expect(isValidUUID(id)).toBe(true);
  });

  it('returns unique values on each call', () => {
    expect(generateId()).not.toBe(generateId());
  });
});

describe('isValidUUID', () => {
  it('returns true for valid UUID v4', () => {
    expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
  });

  it('returns false for invalid UUID strings', () => {
    expect(isValidUUID('not-a-uuid')).toBe(false);
    expect(isValidUUID('')).toBe(false);
    expect(isValidUUID('550e8400-e29b-41d4-a716')).toBe(false);
  });
});

describe('toISODateString', () => {
  it('returns YYYY-MM-DD format', () => {
    const date = new Date('2026-02-17T10:00:00.000Z');
    expect(toISODateString(date)).toBe('2026-02-17');
  });
});

describe('toTimeString', () => {
  it('returns HH:MM format', () => {
    const date = new Date('2026-02-17T10:30:00.000Z');
    const result = toTimeString(date);
    expect(result).toMatch(/^\d{2}:\d{2}$/);
  });
});

describe('combineDateAndTime', () => {
  it('combines a date with a time string correctly', () => {
    const date = new Date('2026-02-17T00:00:00.000Z');
    const result = combineDateAndTime(date, '10:30');
    expect(result.getHours()).toBe(10);
    expect(result.getMinutes()).toBe(30);
  });
});

describe('addMinutes', () => {
  it('adds minutes to a date', () => {
    const base = new Date('2026-02-17T10:00:00.000Z');
    const result = addMinutes(base, 30);
    expect(result.getTime()).toBe(base.getTime() + 30 * 60 * 1000);
  });
});

describe('addHours', () => {
  it('adds hours to a date', () => {
    const base = new Date('2026-02-17T10:00:00.000Z');
    const result = addHours(base, 2);
    expect(result.getTime()).toBe(base.getTime() + 2 * 60 * 60 * 1000);
  });
});

describe('addDays', () => {
  it('adds days to a date', () => {
    const base = new Date('2026-02-17T10:00:00.000Z');
    const result = addDays(base, 7);
    expect(result.getDate()).toBe(base.getDate() + 7);
  });
});

describe('startOfDay', () => {
  it('sets time to 00:00:00.000', () => {
    const date = new Date('2026-02-17T15:30:45.000Z');
    const result = startOfDay(date);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
    expect(result.getMilliseconds()).toBe(0);
  });
});

describe('endOfDay', () => {
  it('sets time to 23:59:59.999', () => {
    const date = new Date('2026-02-17T08:00:00.000Z');
    const result = endOfDay(date);
    expect(result.getHours()).toBe(23);
    expect(result.getMinutes()).toBe(59);
    expect(result.getSeconds()).toBe(59);
    expect(result.getMilliseconds()).toBe(999);
  });
});

describe('isDateInPast', () => {
  it('returns true for past date', () => {
    expect(isDateInPast(new Date('2020-01-01'))).toBe(true);
  });

  it('returns false for future date', () => {
    expect(isDateInPast(new Date('2099-01-01'))).toBe(false);
  });
});

describe('daysBetween', () => {
  it('calculates days between two dates', () => {
    const from = new Date('2026-02-17T00:00:00.000Z');
    const to = new Date('2026-02-24T00:00:00.000Z');
    expect(daysBetween(from, to)).toBe(7);
  });

  it('returns 0 for same day', () => {
    const date = new Date('2026-02-17T00:00:00.000Z');
    expect(daysBetween(date, date)).toBe(0);
  });
});

describe('validateBookingDate', () => {
  it('throws PastDateBookingError for past dates', () => {
    expect(() => validateBookingDate(new Date('2020-01-01'))).toThrow(PastDateBookingError);
  });

  it('throws BookingWindowExceededError for dates beyond 90 days', () => {
    const farFuture = addDays(new Date(), 91);
    expect(() => validateBookingDate(farFuture)).toThrow(BookingWindowExceededError);
  });

  it('does not throw for valid future dates within window', () => {
    const validDate = addDays(new Date(), 30);
    expect(() => validateBookingDate(validDate)).not.toThrow();
  });
});

describe('validateDateRange', () => {
  it('throws InvalidDateRangeError when from >= to', () => {
    const date = new Date('2026-02-17T10:00:00.000Z');
    expect(() => validateDateRange(date, date)).toThrow(InvalidDateRangeError);
  });

  it('does not throw when from < to', () => {
    const from = new Date('2026-02-17T10:00:00.000Z');
    const to = new Date('2026-02-24T10:00:00.000Z');
    expect(() => validateDateRange(from, to)).not.toThrow();
  });
});

describe('generateSlotEndTime', () => {
  it('adds 60 minutes to start time', () => {
    expect(generateSlotEndTime('10:00')).toBe('11:00');
    expect(generateSlotEndTime('09:30')).toBe('10:30');
    expect(generateSlotEndTime('23:00')).toBe('00:00');
  });
});

describe('doesSlotOverlap', () => {
  it('returns true when slots overlap', () => {
    expect(doesSlotOverlap('10:00', '11:00', '10:30', '11:30')).toBe(true);
  });

  it('returns false when slots do not overlap', () => {
    expect(doesSlotOverlap('10:00', '11:00', '11:00', '12:00')).toBe(false);
    expect(doesSlotOverlap('10:00', '11:00', '12:00', '13:00')).toBe(false);
  });

  it('returns true when one slot is fully inside another', () => {
    expect(doesSlotOverlap('09:00', '17:00', '10:00', '11:00')).toBe(true);
  });
});

describe('formatAppointmentTime', () => {
  it('formats morning time to 12-hour AM', () => {
    expect(formatAppointmentTime('09:00')).toBe('9:00 AM');
  });

  it('formats afternoon time to 12-hour PM', () => {
    expect(formatAppointmentTime('14:00')).toBe('2:00 PM');
  });

  it('formats midnight correctly', () => {
    expect(formatAppointmentTime('00:00')).toBe('12:00 AM');
  });

  it('formats noon correctly', () => {
    expect(formatAppointmentTime('12:00')).toBe('12:00 PM');
  });
});

describe('sanitiseString', () => {
  it('trims whitespace', () => {
    expect(sanitiseString('  hello  ')).toBe('hello');
  });

  it('collapses internal whitespace', () => {
    expect(sanitiseString('hello   world')).toBe('hello world');
  });
});

describe('maskEmail', () => {
  it('masks local part keeping first two chars', () => {
    const result = maskEmail('james.clarke@example.com');
    expect(result).toMatch(/^ja\*+@example\.com$/);
  });
});

describe('maskPhone', () => {
  it('keeps first 3 and last 3 digits', () => {
    const result = maskPhone('07798765432');
    expect(result).toMatch(/^077\*+432$/);
  });
});

describe('chunkArray', () => {
  it('splits array into chunks of given size', () => {
    const chunks = chunkArray([1, 2, 3, 4, 5], 2);
    expect(chunks).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('returns single chunk when size >= array length', () => {
    expect(chunkArray([1, 2, 3], 10)).toEqual([[1, 2, 3]]);
  });

  it('returns empty array for empty input', () => {
    expect(chunkArray([], 3)).toEqual([]);
  });
});

describe('omitNullish', () => {
  it('removes null and undefined values', () => {
    const input = { a: 1, b: null, c: undefined, d: 'hello' };
    expect(omitNullish(input)).toEqual({ a: 1, d: 'hello' });
  });

  it('keeps falsy non-nullish values like 0 and false', () => {
    const input = { a: 0, b: false, c: null };
    expect(omitNullish(input)).toEqual({ a: 0, b: false });
  });
});

describe('sleep', () => {
  it('resolves after given milliseconds', async () => {
    const start = Date.now();
    await sleep(50);
    expect(Date.now() - start).toBeGreaterThanOrEqual(45);
  });
});