import {
  formatPhoneNumber,
  sanitizeEmailAddress,
  renderTemplate,
  generateIdempotencyKey,
  truncateMessage,
  buildRedisKey,
  maskSensitiveData,
  isValidEmail,
  isValidPhoneNumber,
  chunkArray,
  sleepMs,
} from '../../shared/utils';

describe('utils', () => {
  describe('formatPhoneNumber', () => {
    it('formats UK mobile with country code', () => {
      expect(formatPhoneNumber('07911123456', 'GB')).toBe('+447911123456');
    });

    it('returns number unchanged when already in E.164 format', () => {
      expect(formatPhoneNumber('+447911123456', 'GB')).toBe('+447911123456');
    });

    it('strips non-numeric characters before formatting', () => {
      expect(formatPhoneNumber('079 11 123 456', 'GB')).toBe('+447911123456');
    });

    it('throws when phone number is invalid', () => {
      expect(() => formatPhoneNumber('not-a-number', 'GB')).toThrow();
    });
  });

  describe('sanitizeEmailAddress', () => {
    it('trims whitespace from email', () => {
      expect(sanitizeEmailAddress('  user@example.com  ')).toBe('user@example.com');
    });

    it('lowercases the email address', () => {
      expect(sanitizeEmailAddress('User@EXAMPLE.COM')).toBe('user@example.com');
    });

    it('returns empty string when given empty input', () => {
      expect(sanitizeEmailAddress('')).toBe('');
    });
  });

  describe('renderTemplate', () => {
    it('replaces all variable placeholders', () => {
      const template = 'Hello {{name}}, your code is {{code}}.';
      const result = renderTemplate(template, { name: 'Jake', code: '9876' });
      expect(result).toBe('Hello Jake, your code is 9876.');
    });

    it('leaves unmatched placeholders intact', () => {
      const template = 'Hello {{name}}, your order {{orderId}} is ready.';
      const result = renderTemplate(template, { name: 'Jake' });
      expect(result).toBe('Hello Jake, your order {{orderId}} is ready.');
    });

    it('replaces multiple occurrences of the same variable', () => {
      const template = '{{name}} booked for {{name}}';
      const result = renderTemplate(template, { name: 'Jake' });
      expect(result).toBe('Jake booked for Jake');
    });

    it('returns template unchanged when no variables provided', () => {
      const template = 'No variables here.';
      const result = renderTemplate(template, {});
      expect(result).toBe('No variables here.');
    });
  });

  describe('generateIdempotencyKey', () => {
    it('generates a non-empty string', () => {
      const key = generateIdempotencyKey();
      expect(typeof key).toBe('string');
      expect(key.length).toBeGreaterThan(0);
    });

    it('generates unique keys on each call', () => {
      const key1 = generateIdempotencyKey();
      const key2 = generateIdempotencyKey();
      expect(key1).not.toBe(key2);
    });

    it('generates key with provided prefix', () => {
      const key = generateIdempotencyKey('email');
      expect(key.startsWith('email')).toBe(true);
    });
  });

  describe('truncateMessage', () => {
    it('truncates message exceeding max length', () => {
      const msg = 'a'.repeat(200);
      const result = truncateMessage(msg, 160);
      expect(result.length).toBeLessThanOrEqual(160);
    });

    it('returns message unchanged when within limit', () => {
      const msg = 'Short message';
      expect(truncateMessage(msg, 160)).toBe('Short message');
    });

    it('appends ellipsis when truncating', () => {
      const msg = 'a'.repeat(200);
      const result = truncateMessage(msg, 160);
      expect(result.endsWith('...')).toBe(true);
    });
  });

  describe('buildRedisKey', () => {
    it('builds namespaced Redis key with all parts', () => {
      const key = buildRedisKey('rate-limit', 'email', 'user-1');
      expect(key).toBe('rate-limit:email:user-1');
    });

    it('handles single segment', () => {
      const key = buildRedisKey('session');
      expect(key).toBe('session');
    });
  });

  describe('maskSensitiveData', () => {
    it('masks all but last 4 characters of a string', () => {
      expect(maskSensitiveData('user@example.com')).toMatch(/^\*+.{4}$/);
    });

    it('masks phone number leaving last 4 digits', () => {
      const result = maskSensitiveData('+447911123456');
      expect(result.endsWith('3456')).toBe(true);
    });

    it('returns fully masked string for short input', () => {
      const result = maskSensitiveData('abc');
      expect(result).toBe('***');
    });
  });

  describe('isValidEmail', () => {
    it('returns true for valid email', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
    });

    it('returns false for email without domain', () => {
      expect(isValidEmail('user@')).toBe(false);
    });

    it('returns false for email without @', () => {
      expect(isValidEmail('userexample.com')).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('isValidPhoneNumber', () => {
    it('returns true for valid E.164 number', () => {
      expect(isValidPhoneNumber('+447911123456')).toBe(true);
    });

    it('returns false for number without country code', () => {
      expect(isValidPhoneNumber('07911123456')).toBe(false);
    });

    it('returns false for non-numeric input', () => {
      expect(isValidPhoneNumber('not-a-phone')).toBe(false);
    });
  });

  describe('chunkArray', () => {
    it('splits array into chunks of given size', () => {
      const result = chunkArray([1, 2, 3, 4, 5], 2);
      expect(result).toEqual([[1, 2], [3, 4], [5]]);
    });

    it('returns single chunk when array is smaller than size', () => {
      const result = chunkArray([1, 2], 10);
      expect(result).toEqual([[1, 2]]);
    });

    it('returns empty array when input is empty', () => {
      const result = chunkArray([], 5);
      expect(result).toEqual([]);
    });
  });

  describe('sleepMs', () => {
    it('resolves after approximately the given milliseconds', async () => {
      const start = Date.now();
      await sleepMs(50);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(45);
    });
  });
});