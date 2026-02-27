import {
  generateReferralCode,
  calculatePaginationMeta,
  sanitizePhone,
  formatCurrency,
  isValidPostcode,
  slugify,
  maskEmail,
  paginate,
  deepMerge,
  parseBoolean,
} from '../../src/shared/utils';

describe('generateReferralCode', () => {
  it('should generate a code with LW- prefix', () => {
    const code = generateReferralCode('John', 'Doe');

    expect(code).toMatch(/^LW-/);
  });

  it('should generate an uppercase code', () => {
    const code = generateReferralCode('jane', 'smith');

    expect(code).toBe(code.toUpperCase());
  });

  it('should generate unique codes for different calls', () => {
    const code1 = generateReferralCode('Alice', 'Brown');
    const code2 = generateReferralCode('Alice', 'Brown');

    expect(code1).not.toBe(code2);
  });

  it('should return a string of reasonable length', () => {
    const code = generateReferralCode('Bob', 'Jones');

    expect(code.length).toBeGreaterThan(5);
    expect(code.length).toBeLessThanOrEqual(20);
  });
});

describe('calculatePaginationMeta', () => {
  it('should return correct totalPages for exact division', () => {
    const meta = calculatePaginationMeta(20, 1, 10);

    expect(meta.totalPages).toBe(2);
    expect(meta.total).toBe(20);
    expect(meta.page).toBe(1);
    expect(meta.limit).toBe(10);
  });

  it('should round up totalPages for uneven division', () => {
    const meta = calculatePaginationMeta(25, 1, 10);

    expect(meta.totalPages).toBe(3);
  });

  it('should indicate hasNextPage correctly', () => {
    const meta = calculatePaginationMeta(25, 2, 10);

    expect(meta.hasNextPage).toBe(true);
    expect(meta.hasPrevPage).toBe(true);
  });

  it('should set hasNextPage false on last page', () => {
    const meta = calculatePaginationMeta(25, 3, 10);

    expect(meta.hasNextPage).toBe(false);
  });

  it('should set hasPrevPage false on first page', () => {
    const meta = calculatePaginationMeta(25, 1, 10);

    expect(meta.hasPrevPage).toBe(false);
  });

  it('should handle zero total correctly', () => {
    const meta = calculatePaginationMeta(0, 1, 10);

    expect(meta.totalPages).toBe(0);
    expect(meta.hasNextPage).toBe(false);
    expect(meta.hasPrevPage).toBe(false);
  });
});

describe('sanitizePhone', () => {
  it('should strip spaces from phone number', () => {
    expect(sanitizePhone('07700 900 123')).toBe('07700900123');
  });

  it('should strip hyphens from phone number', () => {
    expect(sanitizePhone('077-0090-0123')).toBe('07700900123');
  });

  it('should strip parentheses from phone number', () => {
    expect(sanitizePhone('(0770) 090 0123')).toBe('07700900123');
  });

  it('should preserve plus sign for international format', () => {
    expect(sanitizePhone('+44 7700 900123')).toBe('+447700900123');
  });
});

describe('formatCurrency', () => {
  it('should format pence to GBP string', () => {
    expect(formatCurrency(1999)).toBe('£19.99');
  });

  it('should format zero correctly', () => {
    expect(formatCurrency(0)).toBe('£0.00');
  });

  it('should format large amounts correctly', () => {
    expect(formatCurrency(1000000)).toBe('£10,000.00');
  });

  it('should handle single digit pence', () => {
    expect(formatCurrency(101)).toBe('£1.01');
  });
});

describe('isValidPostcode', () => {
  it('should return true for valid UK postcodes', () => {
    expect(isValidPostcode('SW1A 1AA')).toBe(true);
    expect(isValidPostcode('EC1A 1BB')).toBe(true);
    expect(isValidPostcode('W1A 0AX')).toBe(true);
    expect(isValidPostcode('M1 1AE')).toBe(true);
  });

  it('should return true for postcodes without space', () => {
    expect(isValidPostcode('SW1A1AA')).toBe(true);
  });

  it('should return false for invalid postcodes', () => {
    expect(isValidPostcode('INVALID')).toBe(false);
    expect(isValidPostcode('12345')).toBe(false);
    expect(isValidPostcode('')).toBe(false);
  });

  it('should be case insensitive', () => {
    expect(isValidPostcode('sw1a 1aa')).toBe(true);
  });
});

describe('slugify', () => {
  it('should convert spaces to hyphens', () => {
    expect(slugify('Luna White Kitchen')).toBe('luna-white-kitchen');
  });

  it('should lowercase the string', () => {
    expect(slugify('OSLO BEDROOM')).toBe('oslo-bedroom');
  });

  it('should remove special characters', () => {
    expect(slugify('Kitchen & Bedroom!')).toBe('kitchen-bedroom');
  });

  it('should collapse multiple hyphens', () => {
    expect(slugify('hello   world')).toBe('hello-world');
  });

  it('should trim leading and trailing hyphens', () => {
    expect(slugify('  hello  ')).toBe('hello');
  });
});

describe('maskEmail', () => {
  it('should mask the local part of an email', () => {
    expect(maskEmail('john.doe@example.com')).toBe('j*******@example.com');
  });

  it('should handle single character local part', () => {
    expect(maskEmail('j@example.com')).toBe('j@example.com');
  });

  it('should handle two character local part', () => {
    expect(maskEmail('jo@example.com')).toBe('j*@example.com');
  });
});

describe('paginate', () => {
  it('should calculate skip and take from page and limit', () => {
    expect(paginate(1, 10)).toEqual({ skip: 0, take: 10 });
    expect(paginate(2, 10)).toEqual({ skip: 10, take: 10 });
    expect(paginate(3, 25)).toEqual({ skip: 50, take: 25 });
  });
});

describe('deepMerge', () => {
  it('should merge two objects deeply', () => {
    const target = { a: 1, b: { c: 2, d: 3 } };
    const source = { b: { c: 10 }, e: 4 };

    const result = deepMerge(target, source);

    expect(result).toEqual({ a: 1, b: { c: 10, d: 3 }, e: 4 });
  });

  it('should not mutate the original objects', () => {
    const target = { a: { b: 1 } };
    const source = { a: { c: 2 } };

    deepMerge(target, source);

    expect(target).toEqual({ a: { b: 1 } });
  });
});

describe('parseBoolean', () => {
  it('should return true for truthy string values', () => {
    expect(parseBoolean('true')).toBe(true);
    expect(parseBoolean('1')).toBe(true);
    expect(parseBoolean('yes')).toBe(true);
  });

  it('should return false for falsy string values', () => {
    expect(parseBoolean('false')).toBe(false);
    expect(parseBoolean('0')).toBe(false);
    expect(parseBoolean('no')).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(parseBoolean(undefined)).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(parseBoolean('')).toBe(false);
  });
});