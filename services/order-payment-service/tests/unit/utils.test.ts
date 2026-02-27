import { describe, it, expect, jest } from '@jest/globals';
import { setupUnitTest } from '../../src/tests-helpers/setup';
import {
  generateOrderNumber,
  generateInvoiceNumber,
  generateIdempotencyKey,
  toPence,
  fromPence,
  formatCurrency,
  calculateVat,
  calculateSubtotalFromItems,
  roundToTwoDecimals,
  isValidPostcode,
  sanitisePostcode,
  isValidEmail,
  maskCardNumber,
  maskEmail,
  sleep,
  calculateBackoffDelay,
  omitNullish,
  chunkArray,
  isoNow,
  addDays,
  addMinutes,
  isExpired,
  pickFields,
  safeJsonParse,
} from '../../src/shared/utils';
import { ORDER_CONSTANTS, INVOICE_CONSTANTS } from '../../src/shared/constants';

setupUnitTest();

describe('Utils', () => {
  describe('generateOrderNumber', () => {
    it('starts with ORDER_NUMBER_PREFIX', () => {
      expect(generateOrderNumber().startsWith(ORDER_CONSTANTS.ORDER_NUMBER_PREFIX)).toBe(true);
    });

    it('generates unique values', () => {
      const numbers = new Set(Array.from({ length: 50 }, generateOrderNumber));
      expect(numbers.size).toBe(50);
    });
  });

  describe('generateInvoiceNumber', () => {
    it('starts with INVOICE_NUMBER_PREFIX', () => {
      expect(generateInvoiceNumber().startsWith(INVOICE_CONSTANTS.INVOICE_NUMBER_PREFIX)).toBe(true);
    });
  });

  describe('generateIdempotencyKey', () => {
    it('produces consistent hash for same input', () => {
      const key1 = generateIdempotencyKey('order:cust-123:1700000000');
      const key2 = generateIdempotencyKey('order:cust-123:1700000000');
      expect(key1).toBe(key2);
    });

    it('produces different hashes for different inputs', () => {
      const key1 = generateIdempotencyKey('order:cust-123');
      const key2 = generateIdempotencyKey('order:cust-456');
      expect(key1).not.toBe(key2);
    });
  });

  describe('toPence / fromPence', () => {
    it('converts 2998.80 to 299880 pence', () => expect(toPence(2998.80)).toBe(299880));
    it('converts 299880 pence to 2998.80', () => expect(fromPence(299880)).toBe(2998.80));
    it('handles zero', () => { expect(toPence(0)).toBe(0); expect(fromPence(0)).toBe(0); });
    it('rounds half-penny correctly', () => expect(toPence(0.005)).toBe(1));
  });

  describe('formatCurrency', () => {
    it('formats GBP correctly', () => {
      expect(formatCurrency(2998.80, 'GBP')).toContain('2,998');
    });
  });

  describe('calculateVat', () => {
    it('calculates 20% VAT', () => expect(calculateVat(2499.00, 0.2)).toBe(499.80));
    it('returns 0 for zero rate', () => expect(calculateVat(2499.00, 0)).toBe(0));
  });

  describe('calculateSubtotalFromItems', () => {
    it('sums line totals correctly', () => {
      const items = [{ unitPrice: 100, quantity: 2 }, { unitPrice: 50, quantity: 3 }];
      expect(calculateSubtotalFromItems(items)).toBe(350);
    });
    it('returns 0 for empty array', () => expect(calculateSubtotalFromItems([])).toBe(0));
  });

  describe('roundToTwoDecimals', () => {
    it('rounds 2.345 to 2.35', () => expect(roundToTwoDecimals(2.345)).toBe(2.35));
    it('preserves 2.34', () => expect(roundToTwoDecimals(2.34)).toBe(2.34));
  });

  describe('isValidPostcode', () => {
    it('accepts valid UK postcodes', () => {
      ['SW1A 1AA', 'M1 1AE', 'B1 1BB', 'LS1 1BA', 'BS1 1AA'].forEach((pc) => {
        expect(isValidPostcode(pc)).toBe(true);
      });
    });

    it('rejects invalid postcodes', () => {
      ['INVALID', '12345', 'AA AA AA'].forEach((pc) => {
        expect(isValidPostcode(pc)).toBe(false);
      });
    });
  });

  describe('sanitisePostcode', () => {
    it('uppercases and normalises spacing', () => {
      expect(sanitisePostcode('sw1a 1aa')).toBe('SW1A 1AA');
      expect(sanitisePostcode('  m1  1ae  ')).toBe('M1 1AE');
    });
  });

  describe('isValidEmail', () => {
    it('accepts valid emails', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('user+tag@sub.domain.co.uk')).toBe(true);
    });

    it('rejects invalid emails', () => {
      ['not-an-email', '@domain.com', 'user@', 'user @domain.com'].forEach((e) => {
        expect(isValidEmail(e)).toBe(false);
      });
    });
  });

  describe('maskCardNumber', () => {
    it('masks all but last 4 digits', () => {
      expect(maskCardNumber('4242')).toBe('**** **** **** 4242');
    });
  });

  describe('maskEmail', () => {
    it('masks local part of email', () => {
      const masked = maskEmail('james.smith@example.com');
      expect(masked).toContain('@example.com');
      expect(masked).toMatch(/^ja/);
    });
  });

  describe('calculateBackoffDelay', () => {
    it('increases delay with each attempt', () => {
      const d1 = calculateBackoffDelay(1, 1000, 30000);
      const d2 = calculateBackoffDelay(2, 1000, 30000);
      const d3 = calculateBackoffDelay(3, 1000, 30000);
      expect(d2).toBeGreaterThan(d1);
      expect(d3).toBeGreaterThan(d2);
    });

    it('never exceeds maxDelayMs', () => {
      for (let i = 1; i <= 20; i++) {
        expect(calculateBackoffDelay(i, 1000, 5000)).toBeLessThanOrEqual(5000);
      }
    });
  });

  describe('omitNullish', () => {
    it('removes null and undefined values', () => {
      const result = omitNullish({ a: 1, b: null, c: undefined, d: 'keep' });
      expect(result).toEqual({ a: 1, d: 'keep' });
    });

    it('preserves falsy non-nullish values', () => {
      const result = omitNullish({ a: 0, b: false, c: '' });
      expect(result).toEqual({ a: 0, b: false, c: '' });
    });
  });

  describe('chunkArray', () => {
    it('splits array into chunks of given size', () => {
      const chunks = chunkArray([1, 2, 3, 4, 5], 2);
      expect(chunks).toEqual([[1, 2], [3, 4], [5]]);
    });

    it('returns single chunk when array fits within size', () => {
      expect(chunkArray([1, 2], 5)).toEqual([[1, 2]]);
    });

    it('returns empty array for empty input', () => {
      expect(chunkArray([], 3)).toEqual([]);
    });
  });

  describe('addDays', () => {
    it('adds days to date', () => {
      const base = new Date('2025-01-01');
      expect(addDays(base, 30).getDate()).toBe(31);
    });
  });

  describe('addMinutes', () => {
    it('adds minutes to date', () => {
      const base = new Date('2025-01-01T10:00:00Z');
      const result = addMinutes(base, 30);
      expect(result.getTime()).toBe(base.getTime() + 30 * 60 * 1000);
    });
  });

  describe('isExpired', () => {
    it('returns true for past dates', () => {
      expect(isExpired(new Date(Date.now() - 1000))).toBe(true);
    });

    it('returns false for future dates', () => {
      expect(isExpired(new Date(Date.now() + 100000))).toBe(false);
    });
  });

  describe('pickFields', () => {
    it('returns only specified keys', () => {
      const obj = { id: '1', name: 'test', secret: 'hidden' };
      expect(pickFields(obj, ['id', 'name'])).toEqual({ id: '1', name: 'test' });
    });
  });

  describe('safeJsonParse', () => {
    it('parses valid JSON', () => {
      expect(safeJsonParse('{"key":"value"}', {})).toEqual({ key: 'value' });
    });

    it('returns fallback for invalid JSON', () => {
      expect(safeJsonParse('not-json', { fallback: true })).toEqual({ fallback: true });
    });
  });

  describe('sleep', () => {
    it('resolves after specified milliseconds', async () => {
      jest.useFakeTimers();
      const promise = sleep(100);
      jest.advanceTimersByTime(100);
      await expect(promise).resolves.toBeUndefined();
      jest.useRealTimers();
    });
  });
});