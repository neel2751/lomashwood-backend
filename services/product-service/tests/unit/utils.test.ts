import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import {
  formatPrice,
  formatDate,
  formatDateTime,
  calculateDiscount,
  calculateDiscountPercentage,
  generateSlug,
  sanitizeInput,
  validateEmail,
  validatePhone,
  validatePostcode,
  parseQueryParams,
  buildPaginationMeta,
  calculatePagination,
  isValidUrl,
  formatCurrency,
  truncateText,
  capitalizeFirstLetter,
  kebabCase,
  camelCase,
  snakeCase,
  generateRandomString,
  generateSKU,
  parseBoolean,
  deepClone,
  deepMerge,
  omit,
  pick,
  chunk,
  unique,
  groupBy,
  sortBy,
  debounce,
  throttle,
  retry,
  sleep,
  isEmptyObject,
  isPlainObject,
  getNestedValue,
  setNestedValue,
  flattenObject,
  unflattenObject,
  formatBytes,
  formatPercentage,
  clamp,
  randomInRange,
  roundToDecimals,
} from '../../src/shared/utils';

describe('Utils - Price and Currency Formatting', () => {
  describe('formatPrice', () => {
    it('should format price with default GBP currency', () => {
      expect(formatPrice(1000)).toBe('£1,000.00');
      expect(formatPrice(1234.56)).toBe('£1,234.56');
      expect(formatPrice(0)).toBe('£0.00');
    });

    it('should format price with different currencies', () => {
      expect(formatPrice(1000, 'USD')).toBe('$1,000.00');
      expect(formatPrice(1000, 'EUR')).toBe('€1,000.00');
    });

    it('should handle decimal places', () => {
      expect(formatPrice(1234.567, 'GBP', 2)).toBe('£1,234.57');
      expect(formatPrice(1234.567, 'GBP', 0)).toBe('£1,235');
    });

    it('should handle negative prices', () => {
      expect(formatPrice(-500)).toBe('-£500.00');
    });

    it('should handle very large numbers', () => {
      expect(formatPrice(1234567.89)).toBe('£1,234,567.89');
    });
  });

  describe('formatCurrency', () => {
    it('should format currency with symbols', () => {
      expect(formatCurrency(1500, 'GBP')).toBe('£1,500.00');
      expect(formatCurrency(2000, 'USD')).toBe('$2,000.00');
    });

    it('should handle zero values', () => {
      expect(formatCurrency(0, 'GBP')).toBe('£0.00');
    });
  });

  describe('calculateDiscount', () => {
    it('should calculate discount amount correctly', () => {
      expect(calculateDiscount(1000, 20)).toBe(200);
      expect(calculateDiscount(500, 10)).toBe(50);
      expect(calculateDiscount(1234.56, 15)).toBe(185.18);
    });

    it('should handle 0% discount', () => {
      expect(calculateDiscount(1000, 0)).toBe(0);
    });

    it('should handle 100% discount', () => {
      expect(calculateDiscount(1000, 100)).toBe(1000);
    });

    it('should round to 2 decimal places', () => {
      expect(calculateDiscount(99.99, 33.33)).toBe(33.33);
    });
  });

  describe('calculateDiscountPercentage', () => {
    it('should calculate discount percentage correctly', () => {
      expect(calculateDiscountPercentage(1000, 800)).toBe(20);
      expect(calculateDiscountPercentage(500, 250)).toBe(50);
      expect(calculateDiscountPercentage(100, 75)).toBe(25);
    });

    it('should handle no discount', () => {
      expect(calculateDiscountPercentage(1000, 1000)).toBe(0);
    });

    it('should handle 100% discount', () => {
      expect(calculateDiscountPercentage(1000, 0)).toBe(100);
    });

    it('should round to 2 decimal places', () => {
      expect(calculateDiscountPercentage(99, 66)).toBeCloseTo(33.33, 2);
    });
  });
});

describe('Utils - Date and Time Formatting', () => {
  describe('formatDate', () => {
    it('should format date in default format', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      expect(formatDate(date)).toMatch(/15\/01\/2024/);
    });

    it('should format date in custom format', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      expect(formatDate(date, 'YYYY-MM-DD')).toBe('2024-01-15');
    });

    it('should handle different date formats', () => {
      const date = new Date('2024-12-25T15:45:30Z');
      expect(formatDate(date, 'DD/MM/YYYY')).toMatch(/25\/12\/2024/);
      expect(formatDate(date, 'MMMM DD, YYYY')).toContain('December 25, 2024');
    });
  });

  describe('formatDateTime', () => {
    it('should format date and time', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const result = formatDateTime(date);
      expect(result).toContain('2024');
      expect(result).toContain('10:30');
    });

    it('should handle timezone formatting', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const result = formatDateTime(date, 'YYYY-MM-DD HH:mm:ss');
      expect(result).toMatch(/2024-01-15/);
    });
  });
});

describe('Utils - String Manipulation', () => {
  describe('generateSlug', () => {
    it('should generate slug from product name', () => {
      expect(generateSlug('Modern Kitchen White')).toBe('modern-kitchen-white');
      expect(generateSlug('Contemporary Bedroom Oak')).toBe('contemporary-bedroom-oak');
    });

    it('should handle special characters', () => {
      expect(generateSlug('Kitchen & Bedroom Design')).toBe('kitchen-and-bedroom-design');
      expect(generateSlug("O'Brien's Kitchen")).toBe('obriens-kitchen');
    });

    it('should handle multiple spaces', () => {
      expect(generateSlug('Multiple   Spaces   Here')).toBe('multiple-spaces-here');
    });

    it('should handle uppercase and lowercase', () => {
      expect(generateSlug('UPPERCASE text')).toBe('uppercase-text');
    });

    it('should remove trailing and leading spaces', () => {
      expect(generateSlug('  trimmed  ')).toBe('trimmed');
    });

    it('should handle numbers', () => {
      expect(generateSlug('Kitchen 2024 Model')).toBe('kitchen-2024-model');
    });
  });

  describe('sanitizeInput', () => {
    it('should remove script tags', () => {
      const input = '<script>alert("xss")</script>Hello';
      expect(sanitizeInput(input)).not.toContain('<script>');
    });

    it('should trim whitespace', () => {
      expect(sanitizeInput('  hello  ')).toBe('hello');
    });

    it('should preserve safe HTML entities', () => {
      const input = 'Hello &amp; World';
      expect(sanitizeInput(input)).toBe('Hello &amp; World');
    });

    it('should handle empty strings', () => {
      expect(sanitizeInput('')).toBe('');
    });
  });

  describe('truncateText', () => {
    it('should truncate long text', () => {
      const text = 'This is a very long description for a kitchen product';
      expect(truncateText(text, 20)).toBe('This is a very long...');
    });

    it('should not truncate short text', () => {
      const text = 'Short text';
      expect(truncateText(text, 20)).toBe('Short text');
    });

    it('should handle custom ellipsis', () => {
      const text = 'This is a long text';
      expect(truncateText(text, 10, '---')).toBe('This is a---');
    });
  });

  describe('capitalizeFirstLetter', () => {
    it('should capitalize first letter', () => {
      expect(capitalizeFirstLetter('hello')).toBe('Hello');
      expect(capitalizeFirstLetter('kitchen')).toBe('Kitchen');
    });

    it('should handle already capitalized strings', () => {
      expect(capitalizeFirstLetter('Hello')).toBe('Hello');
    });

    it('should handle empty strings', () => {
      expect(capitalizeFirstLetter('')).toBe('');
    });

    it('should handle single character', () => {
      expect(capitalizeFirstLetter('a')).toBe('A');
    });
  });

  describe('kebabCase', () => {
    it('should convert to kebab-case', () => {
      expect(kebabCase('modernKitchen')).toBe('modern-kitchen');
      expect(kebabCase('ModernKitchenWhite')).toBe('modern-kitchen-white');
    });

    it('should handle spaces', () => {
      expect(kebabCase('Modern Kitchen')).toBe('modern-kitchen');
    });

    it('should handle underscores', () => {
      expect(kebabCase('modern_kitchen')).toBe('modern-kitchen');
    });
  });

  describe('camelCase', () => {
    it('should convert to camelCase', () => {
      expect(camelCase('modern-kitchen')).toBe('modernKitchen');
      expect(camelCase('modern kitchen white')).toBe('modernKitchenWhite');
    });

    it('should handle underscores', () => {
      expect(camelCase('modern_kitchen')).toBe('modernKitchen');
    });

    it('should handle mixed separators', () => {
      expect(camelCase('modern-kitchen_design')).toBe('modernKitchenDesign');
    });
  });

  describe('snakeCase', () => {
    it('should convert to snake_case', () => {
      expect(snakeCase('modernKitchen')).toBe('modern_kitchen');
      expect(snakeCase('Modern Kitchen')).toBe('modern_kitchen');
    });

    it('should handle hyphens', () => {
      expect(snakeCase('modern-kitchen')).toBe('modern_kitchen');
    });
  });

  describe('generateRandomString', () => {
    it('should generate random string of specified length', () => {
      const str = generateRandomString(10);
      expect(str).toHaveLength(10);
    });

    it('should generate different strings', () => {
      const str1 = generateRandomString(10);
      const str2 = generateRandomString(10);
      expect(str1).not.toBe(str2);
    });

    it('should only contain alphanumeric characters', () => {
      const str = generateRandomString(20);
      expect(str).toMatch(/^[a-zA-Z0-9]+$/);
    });
  });

  describe('generateSKU', () => {
    it('should generate SKU for kitchen products', () => {
      const sku = generateSKU('KITCHEN', 'Modern White');
      expect(sku).toMatch(/^K-/);
      expect(sku).toContain('MODERN-WHITE');
    });

    it('should generate SKU for bedroom products', () => {
      const sku = generateSKU('BEDROOM', 'Oak Traditional');
      expect(sku).toMatch(/^B-/);
      expect(sku).toContain('OAK-TRADITIONAL');
    });

    it('should include timestamp component', () => {
      const sku1 = generateSKU('KITCHEN', 'Test');
      const sku2 = generateSKU('KITCHEN', 'Test');
      expect(sku1).not.toBe(sku2); // Different due to timestamp
    });
  });
});

describe('Utils - Validation', () => {
  describe('validateEmail', () => {
    it('should validate correct email formats', () => {
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('test.user@domain.co.uk')).toBe(true);
      expect(validateEmail('user+tag@example.com')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
      expect(validateEmail('user @domain.com')).toBe(false);
    });

    it('should handle empty strings', () => {
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('validatePhone', () => {
    it('should validate UK phone numbers', () => {
      expect(validatePhone('07700900123')).toBe(true);
      expect(validatePhone('+447700900123')).toBe(true);
      expect(validatePhone('020 7946 0958')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(validatePhone('123')).toBe(false);
      expect(validatePhone('abc')).toBe(false);
      expect(validatePhone('')).toBe(false);
    });

    it('should handle formatted numbers', () => {
      expect(validatePhone('+44 20 7946 0958')).toBe(true);
      expect(validatePhone('(020) 7946 0958')).toBe(true);
    });
  });

  describe('validatePostcode', () => {
    it('should validate UK postcodes', () => {
      expect(validatePostcode('SW1A 1AA')).toBe(true);
      expect(validatePostcode('M1 1AE')).toBe(true);
      expect(validatePostcode('CR2 6XH')).toBe(true);
      expect(validatePostcode('DN55 1PT')).toBe(true);
    });

    it('should reject invalid postcodes', () => {
      expect(validatePostcode('INVALID')).toBe(false);
      expect(validatePostcode('123')).toBe(false);
      expect(validatePostcode('')).toBe(false);
    });

    it('should handle postcodes without spaces', () => {
      expect(validatePostcode('SW1A1AA')).toBe(true);
      expect(validatePostcode('M11AE')).toBe(true);
    });
  });

  describe('isValidUrl', () => {
    it('should validate URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://lomashwood.com')).toBe(true);
      expect(isValidUrl('https://www.example.co.uk/path')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidUrl('not a url')).toBe(false);
      expect(isValidUrl('example.com')).toBe(false);
      expect(isValidUrl('')).toBe(false);
    });
  });
});

describe('Utils - Query and Pagination', () => {
  describe('parseQueryParams', () => {
    it('should parse query parameters', () => {
      const query = {
        page: '2',
        limit: '20',
        category: 'KITCHEN',
        colours: 'white,grey',
      };
      
      const result = parseQueryParams(query);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(20);
      expect(result.category).toBe('KITCHEN');
      expect(result.colours).toEqual(['white', 'grey']);
    });

    it('should handle missing parameters', () => {
      const query = {};
      const result = parseQueryParams(query);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should handle invalid numbers', () => {
      const query = { page: 'invalid', limit: 'abc' };
      const result = parseQueryParams(query);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });
  });

  describe('buildPaginationMeta', () => {
    it('should build pagination metadata', () => {
      const meta = buildPaginationMeta(100, 1, 10);
      expect(meta).toEqual({
        total: 100,
        page: 1,
        limit: 10,
        totalPages: 10,
        hasNextPage: true,
        hasPreviousPage: false,
      });
    });

    it('should handle last page', () => {
      const meta = buildPaginationMeta(95, 10, 10);
      expect(meta.hasNextPage).toBe(false);
      expect(meta.hasPreviousPage).toBe(true);
      expect(meta.totalPages).toBe(10);
    });

    it('should handle single page', () => {
      const meta = buildPaginationMeta(5, 1, 10);
      expect(meta.totalPages).toBe(1);
      expect(meta.hasNextPage).toBe(false);
      expect(meta.hasPreviousPage).toBe(false);
    });
  });

  describe('calculatePagination', () => {
    it('should calculate skip and take values', () => {
      const result = calculatePagination(1, 10);
      expect(result).toEqual({ skip: 0, take: 10 });
    });

    it('should calculate for page 2', () => {
      const result = calculatePagination(2, 10);
      expect(result).toEqual({ skip: 10, take: 10 });
    });

    it('should calculate for custom limit', () => {
      const result = calculatePagination(3, 20);
      expect(result).toEqual({ skip: 40, take: 20 });
    });
  });
});

describe('Utils - Array Operations', () => {
  describe('chunk', () => {
    it('should chunk array into smaller arrays', () => {
      const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      const result = chunk(arr, 3);
      expect(result).toEqual([[1, 2, 3], [4, 5, 6], [7, 8, 9]]);
    });

    it('should handle remainder', () => {
      const arr = [1, 2, 3, 4, 5];
      const result = chunk(arr, 2);
      expect(result).toEqual([[1, 2], [3, 4], [5]]);
    });

    it('should handle empty array', () => {
      const result = chunk([], 3);
      expect(result).toEqual([]);
    });
  });

  describe('unique', () => {
    it('should return unique values', () => {
      const arr = [1, 2, 2, 3, 3, 3, 4];
      expect(unique(arr)).toEqual([1, 2, 3, 4]);
    });

    it('should handle strings', () => {
      const arr = ['white', 'grey', 'white', 'oak'];
      expect(unique(arr)).toEqual(['white', 'grey', 'oak']);
    });

    it('should handle empty array', () => {
      expect(unique([])).toEqual([]);
    });
  });

  describe('groupBy', () => {
    it('should group array by key', () => {
      const products = [
        { id: 1, category: 'KITCHEN' },
        { id: 2, category: 'BEDROOM' },
        { id: 3, category: 'KITCHEN' },
      ];
      
      const result = groupBy(products, 'category');
      expect(result.KITCHEN).toHaveLength(2);
      expect(result.BEDROOM).toHaveLength(1);
    });

    it('should handle empty array', () => {
      const result = groupBy([], 'category');
      expect(result).toEqual({});
    });
  });

  describe('sortBy', () => {
    it('should sort array by key', () => {
      const products = [
        { id: 3, name: 'Charlie' },
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ];
      
      const result = sortBy(products, 'name');
      expect(result[0].name).toBe('Alice');
      expect(result[1].name).toBe('Bob');
      expect(result[2].name).toBe('Charlie');
    });

    it('should sort numbers', () => {
      const items = [{ value: 30 }, { value: 10 }, { value: 20 }];
      const result = sortBy(items, 'value');
      expect(result[0].value).toBe(10);
      expect(result[2].value).toBe(30);
    });
  });
});

describe('Utils - Object Operations', () => {
  describe('parseBoolean', () => {
    it('should parse boolean strings', () => {
      expect(parseBoolean('true')).toBe(true);
      expect(parseBoolean('false')).toBe(false);
      expect(parseBoolean('1')).toBe(true);
      expect(parseBoolean('0')).toBe(false);
    });

    it('should handle actual booleans', () => {
      expect(parseBoolean(true)).toBe(true);
      expect(parseBoolean(false)).toBe(false);
    });

    it('should handle case insensitivity', () => {
      expect(parseBoolean('TRUE')).toBe(true);
      expect(parseBoolean('False')).toBe(false);
    });
  });

  describe('deepClone', () => {
    it('should deep clone object', () => {
      const obj = { a: 1, b: { c: 2 } };
      const clone = deepClone(obj);
      clone.b.c = 3;
      expect(obj.b.c).toBe(2);
    });

    it('should handle arrays', () => {
      const arr = [1, [2, 3], { a: 4 }];
      const clone = deepClone(arr);
      clone[1][0] = 5;
      expect(arr[1][0]).toBe(2);
    });
  });

  describe('deepMerge', () => {
    it('should deep merge objects', () => {
      const obj1 = { a: 1, b: { c: 2 } };
      const obj2 = { b: { d: 3 }, e: 4 };
      const result = deepMerge(obj1, obj2);
      expect(result).toEqual({
        a: 1,
        b: { c: 2, d: 3 },
        e: 4,
      });
    });

    it('should override primitive values', () => {
      const obj1 = { a: 1 };
      const obj2 = { a: 2 };
      const result = deepMerge(obj1, obj2);
      expect(result.a).toBe(2);
    });
  });

  describe('omit', () => {
    it('should omit specified keys', () => {
      const obj = { a: 1, b: 2, c: 3 };
      const result = omit(obj, ['b', 'c']);
      expect(result).toEqual({ a: 1 });
    });

    it('should handle non-existent keys', () => {
      const obj = { a: 1, b: 2 };
      const result = omit(obj, ['c']);
      expect(result).toEqual({ a: 1, b: 2 });
    });
  });

  describe('pick', () => {
    it('should pick specified keys', () => {
      const obj = { a: 1, b: 2, c: 3 };
      const result = pick(obj, ['a', 'c']);
      expect(result).toEqual({ a: 1, c: 3 });
    });

    it('should ignore non-existent keys', () => {
      const obj = { a: 1, b: 2 };
      const result = pick(obj, ['a', 'c']);
      expect(result).toEqual({ a: 1 });
    });
  });

  describe('isEmptyObject', () => {
    it('should detect empty objects', () => {
      expect(isEmptyObject({})).toBe(true);
      expect(isEmptyObject({ a: 1 })).toBe(false);
    });

    it('should handle null and undefined', () => {
      expect(isEmptyObject(null)).toBe(true);
      expect(isEmptyObject(undefined)).toBe(true);
    });
  });

  describe('isPlainObject', () => {
    it('should detect plain objects', () => {
      expect(isPlainObject({})).toBe(true);
      expect(isPlainObject({ a: 1 })).toBe(true);
      expect(isPlainObject([])).toBe(false);
      expect(isPlainObject(null)).toBe(false);
    });
  });

  describe('getNestedValue', () => {
    it('should get nested values', () => {
      const obj = { a: { b: { c: 'value' } } };
      expect(getNestedValue(obj, 'a.b.c')).toBe('value');
    });

    it('should return undefined for missing paths', () => {
      const obj = { a: { b: 'value' } };
      expect(getNestedValue(obj, 'a.x.y')).toBeUndefined();
    });

    it('should return default value', () => {
      const obj = { a: 1 };
      expect(getNestedValue(obj, 'b.c', 'default')).toBe('default');
    });
  });

  describe('setNestedValue', () => {
    it('should set nested values', () => {
      const obj = { a: { b: {} } };
      setNestedValue(obj, 'a.b.c', 'value');
      expect(obj.a.b.c).toBe('value');
    });

    it('should create missing paths', () => {
      const obj = {};
      setNestedValue(obj, 'a.b.c', 'value');
      expect(obj.a.b.c).toBe('value');
    });
  });

  describe('flattenObject', () => {
    it('should flatten nested object', () => {
      const obj = { a: { b: { c: 1 } }, d: 2 };
      const result = flattenObject(obj);
      expect(result).toEqual({
        'a.b.c': 1,
        'd': 2,
      });
    });
  });

  describe('unflattenObject', () => {
    it('should unflatten object', () => {
      const obj = { 'a.b.c': 1, 'd': 2 };
      const result = unflattenObject(obj);
      expect(result).toEqual({
        a: { b: { c: 1 } },
        d: 2,
      });
    });
  });
});

describe('Utils - Math Operations', () => {
  describe('clamp', () => {
    it('should clamp value within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });
  });

  describe('randomInRange', () => {
    it('should generate random number in range', () => {
      const num = randomInRange(1, 10);
      expect(num).toBeGreaterThanOrEqual(1);
      expect(num).toBeLessThanOrEqual(10);
    });

    it('should handle negative ranges', () => {
      const num = randomInRange(-10, -1);
      expect(num).toBeGreaterThanOrEqual(-10);
      expect(num).toBeLessThanOrEqual(-1);
    });
  });

  describe('roundToDecimals', () => {
    it('should round to specified decimals', () => {
      expect(roundToDecimals(1.2345, 2)).toBe(1.23);
      expect(roundToDecimals(1.2367, 2)).toBe(1.24);
      expect(roundToDecimals(1.234, 0)).toBe(1);
    });

    it('should handle negative numbers', () => {
      expect(roundToDecimals(-1.2345, 2)).toBe(-1.23);
    });
  });

  describe('formatPercentage', () => {
    it('should format percentage', () => {
      expect(formatPercentage(0.25)).toBe('25%');
      expect(formatPercentage(0.5)).toBe('50%');
      expect(formatPercentage(1)).toBe('100%');
    });

    it('should handle decimal places', () => {
      expect(formatPercentage(0.3333, 2)).toBe('33.33%');
      expect(formatPercentage(0.6667, 1)).toBe('66.7%');
    });
  });
});

describe('Utils - Other Utilities', () => {
  describe('formatBytes', () => {
    it('should format bytes', () => {
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1048576)).toBe('1 MB');
      expect(formatBytes(1073741824)).toBe('1 GB');
    });

    it('should handle small values', () => {
      expect(formatBytes(500)).toBe('500 Bytes');
      expect(formatBytes(0)).toBe('0 Bytes');
    });

    it('should handle decimal places', () => {
      expect(formatBytes(1536, 2)).toBe('1.50 KB');
    });
  });

  describe('sleep', () => {
    it('should delay execution', async () => {
      const start = Date.now();
      await sleep(100);
      const end = Date.now();
      expect(end - start).toBeGreaterThanOrEqual(95);
    });
  });

  describe('debounce', () => {
    jest.useFakeTimers();

    it('should debounce function calls', () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 100);

      debounced();
      debounced();
      debounced();

      expect(fn).not.toHaveBeenCalled();

      jest.runAllTimers();

      expect(fn).toHaveBeenCalledTimes(1);
    });

    afterEach(() => {
      jest.useRealTimers();
    });
  });

  describe('throttle', () => {
    jest.useFakeTimers();

    it('should throttle function calls', () => {
      const fn = jest.fn();
      const throttled = throttle(fn, 100);

      throttled();
      throttled();
      throttled();

      expect(fn).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(100);
      throttled();

      expect(fn).toHaveBeenCalledTimes(2);
    });

    afterEach(() => {
      jest.useRealTimers();
    });
  });

  describe('retry', () => {
    it('should retry failed operations', async () => {
      let attempts = 0;
      const fn = jest.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Failed');
        }
        return 'success';
      });

      const result = await retry(fn, 3, 10);
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should throw after max retries', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Always fails'));

      await expect(retry(fn, 2, 10)).rejects.toThrow('Always fails');
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });
});