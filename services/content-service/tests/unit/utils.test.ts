import {
  slugify,
  sanitizeHtml,
  truncateText,
  buildPageUrl,
  parseMetadata,
  mergeMetadata,
  generateCacheKey,
  isValidUrl,
  extractReadingTime,
  normalizeContentKey,
  formatPublishDate,
  isScheduledForFuture,
  sortByOrder,
  groupByField,
  paginateArray,
} from '../../src/shared/utils';

import { describe, it, expect } from '@jest/globals';

describe('Content Service Utils', () => {
  // ─── slugify ─────────────────────────────────────────────────────────────────

  describe('slugify', () => {
    it('should convert a string to a lowercase hyphen-separated slug', () => {
      expect(slugify('Design Your Dream Kitchen')).toBe('design-your-dream-kitchen');
    });

    it('should strip leading and trailing whitespace', () => {
      expect(slugify('  Modern Bedroom  ')).toBe('modern-bedroom');
    });

    it('should replace multiple spaces with a single hyphen', () => {
      expect(slugify('Kitchen   &   Bedroom')).toBe('kitchen-bedroom');
    });

    it('should remove special characters', () => {
      expect(slugify('Top 10 Kitchen Designs!')).toBe('top-10-kitchen-designs');
    });

    it('should handle strings that are already slugs', () => {
      expect(slugify('already-a-slug')).toBe('already-a-slug');
    });

    it('should return an empty string for empty input', () => {
      expect(slugify('')).toBe('');
    });

    it('should handle unicode characters by removing them', () => {
      expect(slugify('Café Kitchen')).toBe('cafe-kitchen');
    });

    it('should handle strings with only special characters', () => {
      expect(slugify('!!!')).toBe('');
    });
  });

  // ─── sanitizeHtml ────────────────────────────────────────────────────────────

  describe('sanitizeHtml', () => {
    it('should allow safe HTML tags', () => {
      const input = '<p>This is <strong>bold</strong> text.</p>';
      const result = sanitizeHtml(input);
      expect(result).toContain('<p>');
      expect(result).toContain('<strong>');
    });

    it('should strip script tags', () => {
      const input = '<p>Hello</p><script>alert("xss")</script>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
    });

    it('should strip on* event attributes', () => {
      const input = '<p onclick="alert(1)">Click me</p>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('onclick');
    });

    it('should strip iframe tags', () => {
      const input = '<iframe src="https://evil.com"></iframe>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('<iframe>');
    });

    it('should return empty string for empty input', () => {
      expect(sanitizeHtml('')).toBe('');
    });

    it('should preserve allowed link tags with href', () => {
      const input = '<a href="https://lomashwood.com">Visit Us</a>';
      const result = sanitizeHtml(input);
      expect(result).toContain('<a');
      expect(result).toContain('href');
    });

    it('should strip javascript: protocol from href', () => {
      const input = '<a href="javascript:alert(1)">Click</a>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('javascript:');
    });
  });

  // ─── truncateText ────────────────────────────────────────────────────────────

  describe('truncateText', () => {
    it('should truncate text to the given length and append ellipsis', () => {
      const result = truncateText('This is a long piece of text', 10);
      expect(result).toBe('This is a...');
      expect(result.length).toBeLessThanOrEqual(13);
    });

    it('should not truncate text shorter than the limit', () => {
      expect(truncateText('Short text', 100)).toBe('Short text');
    });

    it('should handle exact length text without truncation', () => {
      expect(truncateText('Hello', 5)).toBe('Hello');
    });

    it('should return empty string for empty input', () => {
      expect(truncateText('', 50)).toBe('');
    });

    it('should allow custom suffix', () => {
      const result = truncateText('This is a long text', 7, ' [more]');
      expect(result).toContain('[more]');
    });

    it('should handle zero length gracefully', () => {
      const result = truncateText('Some text', 0);
      expect(typeof result).toBe('string');
    });
  });

  // ─── buildPageUrl ────────────────────────────────────────────────────────────

  describe('buildPageUrl', () => {
    it('should build a canonical page URL from slug', () => {
      expect(buildPageUrl('about-us')).toBe('/about-us');
    });

    it('should handle blog post URLs with prefix', () => {
      expect(buildPageUrl('my-first-blog-post', 'blog')).toBe('/blog/my-first-blog-post');
    });

    it('should normalise double slashes', () => {
      const result = buildPageUrl('/already-has-slash');
      expect(result).not.toContain('//');
    });

    it('should return root path for empty slug', () => {
      expect(buildPageUrl('')).toBe('/');
    });

    it('should handle prefix with trailing slash', () => {
      const result = buildPageUrl('my-post', 'blog/');
      expect(result).not.toContain('//');
    });
  });

  // ─── parseMetadata ───────────────────────────────────────────────────────────

  describe('parseMetadata', () => {
    it('should parse valid JSON string to object', () => {
      const json = '{"alt": "image alt", "width": 800}';
      const result = parseMetadata(json);
      expect(result).toEqual({ alt: 'image alt', width: 800 });
    });

    it('should return the object if already parsed', () => {
      const obj = { alt: 'image alt' };
      expect(parseMetadata(obj)).toEqual(obj);
    });

    it('should return null for null input', () => {
      expect(parseMetadata(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(parseMetadata(undefined)).toBeNull();
    });

    it('should return null for invalid JSON string', () => {
      expect(parseMetadata('not-valid-json{')).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(parseMetadata('')).toBeNull();
    });
  });

  // ─── mergeMetadata ───────────────────────────────────────────────────────────

  describe('mergeMetadata', () => {
    it('should merge two metadata objects with later values winning', () => {
      const base = { alt: 'original', width: 800 };
      const override = { width: 1200, height: 600 };
      const result = mergeMetadata(base, override);
      expect(result).toEqual({ alt: 'original', width: 1200, height: 600 });
    });

    it('should return base when override is null', () => {
      const base = { alt: 'image' };
      expect(mergeMetadata(base, null)).toEqual(base);
    });

    it('should return override when base is null', () => {
      const override = { alt: 'image' };
      expect(mergeMetadata(null, override)).toEqual(override);
    });

    it('should return empty object when both are null', () => {
      expect(mergeMetadata(null, null)).toEqual({});
    });
  });

  // ─── generateCacheKey ────────────────────────────────────────────────────────

  describe('generateCacheKey', () => {
    it('should generate a deterministic cache key from parts', () => {
      const key = generateCacheKey('content', 'page', 'home');
      expect(key).toBe('content:page:home');
    });

    it('should handle a single part', () => {
      expect(generateCacheKey('blocks')).toBe('blocks');
    });

    it('should handle numeric parts', () => {
      const key = generateCacheKey('content', 'block', '42');
      expect(key).toBe('content:block:42');
    });

    it('should produce unique keys for different inputs', () => {
      const key1 = generateCacheKey('content', 'home');
      const key2 = generateCacheKey('content', 'about');
      expect(key1).not.toBe(key2);
    });
  });

  // ─── isValidUrl ──────────────────────────────────────────────────────────────

  describe('isValidUrl', () => {
    it('should return true for valid https URL', () => {
      expect(isValidUrl('https://lomashwood.com/image.jpg')).toBe(true);
    });

    it('should return true for valid http URL', () => {
      expect(isValidUrl('http://cdn.lomashwood.com/img.png')).toBe(true);
    });

    it('should return false for invalid URL', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isValidUrl('')).toBe(false);
    });

    it('should return false for URL without protocol', () => {
      expect(isValidUrl('lomashwood.com/image.jpg')).toBe(false);
    });

    it('should return false for javascript: protocol', () => {
      expect(isValidUrl('javascript:alert(1)')).toBe(false);
    });
  });

  // ─── extractReadingTime ──────────────────────────────────────────────────────

  describe('extractReadingTime', () => {
    it('should return 1 minute for very short content', () => {
      expect(extractReadingTime('Short text')).toBe(1);
    });

    it('should calculate reading time based on average 200 words per minute', () => {
      const words = Array(400).fill('word').join(' ');
      expect(extractReadingTime(words)).toBe(2);
    });

    it('should round up to the nearest minute', () => {
      const words = Array(250).fill('word').join(' ');
      expect(extractReadingTime(words)).toBe(2);
    });

    it('should return 1 for empty content', () => {
      expect(extractReadingTime('')).toBe(1);
    });

    it('should handle HTML content by stripping tags before counting', () => {
      const html = '<p>' + Array(200).fill('word').join(' ') + '</p>';
      expect(extractReadingTime(html)).toBe(1);
    });
  });

  // ─── normalizeContentKey ─────────────────────────────────────────────────────

  describe('normalizeContentKey', () => {
    it('should convert a human-readable label to a content key', () => {
      expect(normalizeContentKey('Home Hero Title')).toBe('home-hero-title');
    });

    it('should strip special characters', () => {
      expect(normalizeContentKey('Finance (CTA) Button!')).toBe('finance-cta-button');
    });

    it('should handle already-normalised keys', () => {
      expect(normalizeContentKey('already-normalised')).toBe('already-normalised');
    });

    it('should handle empty string', () => {
      expect(normalizeContentKey('')).toBe('');
    });
  });

  // ─── formatPublishDate ───────────────────────────────────────────────────────

  describe('formatPublishDate', () => {
    it('should format a date to a human-readable string', () => {
      const date = new Date('2025-06-15T00:00:00.000Z');
      const result = formatPublishDate(date);
      expect(result).toMatch(/June|Jun/);
      expect(result).toContain('2025');
    });

    it('should return empty string for null date', () => {
      expect(formatPublishDate(null)).toBe('');
    });

    it('should return empty string for undefined date', () => {
      expect(formatPublishDate(undefined)).toBe('');
    });

    it('should accept a locale parameter', () => {
      const date = new Date('2025-01-01T00:00:00.000Z');
      const result = formatPublishDate(date, 'en-GB');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  // ─── isScheduledForFuture ────────────────────────────────────────────────────

  describe('isScheduledForFuture', () => {
    it('should return true when publishDate is in the future', () => {
      const futureDate = new Date(Date.now() + 60 * 60 * 1000);
      expect(isScheduledForFuture(futureDate)).toBe(true);
    });

    it('should return false when publishDate is in the past', () => {
      const pastDate = new Date(Date.now() - 60 * 60 * 1000);
      expect(isScheduledForFuture(pastDate)).toBe(false);
    });

    it('should return false when publishDate is null', () => {
      expect(isScheduledForFuture(null)).toBe(false);
    });

    it('should return false when publishDate is undefined', () => {
      expect(isScheduledForFuture(undefined)).toBe(false);
    });
  });

  // ─── sortByOrder ─────────────────────────────────────────────────────────────

  describe('sortByOrder', () => {
    it('should sort items by sortOrder ascending', () => {
      const items = [
        { id: '3', sortOrder: 3 },
        { id: '1', sortOrder: 1 },
        { id: '2', sortOrder: 2 },
      ];
      const result = sortByOrder(items);
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('2');
      expect(result[2].id).toBe('3');
    });

    it('should return empty array for empty input', () => {
      expect(sortByOrder([])).toEqual([]);
    });

    it('should not mutate the original array', () => {
      const items = [{ id: '2', sortOrder: 2 }, { id: '1', sortOrder: 1 }];
      const original = [...items];
      sortByOrder(items);
      expect(items).toEqual(original);
    });

    it('should handle items with equal sortOrder stably', () => {
      const items = [
        { id: 'a', sortOrder: 1 },
        { id: 'b', sortOrder: 1 },
      ];
      const result = sortByOrder(items);
      expect(result).toHaveLength(2);
    });
  });

  // ─── groupByField ────────────────────────────────────────────────────────────

  describe('groupByField', () => {
    it('should group items by a specified field', () => {
      const items = [
        { id: '1', section: 'hero', content: 'A' },
        { id: '2', section: 'footer', content: 'B' },
        { id: '3', section: 'hero', content: 'C' },
      ];
      const result = groupByField(items, 'section');
      expect(result).toHaveProperty('hero');
      expect(result).toHaveProperty('footer');
      expect(result.hero).toHaveLength(2);
      expect(result.footer).toHaveLength(1);
    });

    it('should return empty object for empty array', () => {
      expect(groupByField([], 'section')).toEqual({});
    });

    it('should handle items where field value is undefined', () => {
      const items = [{ id: '1' }];
      const result = groupByField(items, 'section' as keyof typeof items[0]);
      expect(result).toHaveProperty('undefined');
    });
  });

  // ─── paginateArray ───────────────────────────────────────────────────────────

  describe('paginateArray', () => {
    const items = Array.from({ length: 25 }, (_, i) => ({ id: `item-${i + 1}` }));

    it('should return the correct page of items', () => {
      const result = paginateArray(items, 1, 10);
      expect(result.data).toHaveLength(10);
      expect(result.data[0].id).toBe('item-1');
    });

    it('should return the second page correctly', () => {
      const result = paginateArray(items, 2, 10);
      expect(result.data).toHaveLength(10);
      expect(result.data[0].id).toBe('item-11');
    });

    it('should return remaining items on last page', () => {
      const result = paginateArray(items, 3, 10);
      expect(result.data).toHaveLength(5);
      expect(result.data[0].id).toBe('item-21');
    });

    it('should include correct pagination metadata', () => {
      const result = paginateArray(items, 2, 10);
      expect(result.total).toBe(25);
      expect(result.page).toBe(2);
      expect(result.perPage).toBe(10);
      expect(result.totalPages).toBe(3);
      expect(result.hasNextPage).toBe(true);
      expect(result.hasPrevPage).toBe(true);
    });

    it('should indicate no next page on last page', () => {
      const result = paginateArray(items, 3, 10);
      expect(result.hasNextPage).toBe(false);
    });

    it('should indicate no prev page on first page', () => {
      const result = paginateArray(items, 1, 10);
      expect(result.hasPrevPage).toBe(false);
    });

    it('should return empty data for out-of-range page', () => {
      const result = paginateArray(items, 99, 10);
      expect(result.data).toHaveLength(0);
    });

    it('should handle empty array', () => {
      const result = paginateArray([], 1, 10);
      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });
  });
});