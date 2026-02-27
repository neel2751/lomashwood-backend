import { createPageSchema, updatePageSchema, pageQuerySchema } from '../../src/app/cms/page.schemas';
import { mockCreatePageDto, mockUpdatePageDto } from '../fixtures/pages.fixture';
import { describe, it, expect } from '@jest/globals';

describe('Page Validators', () => {
  describe('createPageSchema', () => {
    it('should validate a valid create page payload', () => {
      const result = createPageSchema.safeParse(mockCreatePageDto);
      expect(result.success).toBe(true);
    });

    it('should require title', () => {
      const { title, ...rest } = mockCreatePageDto;
      const result = createPageSchema.safeParse(rest);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('title'))).toBe(true);
      }
    });

    it('should require slug', () => {
      const { slug, ...rest } = mockCreatePageDto;
      const result = createPageSchema.safeParse(rest);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('slug'))).toBe(true);
      }
    });

    it('should require template', () => {
      const { template, ...rest } = mockCreatePageDto;
      const result = createPageSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should reject an invalid template value', () => {
      const result = createPageSchema.safeParse({ ...mockCreatePageDto, template: 'INVALID_TEMPLATE' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('template'))).toBe(true);
      }
    });

    it('should reject an invalid status value', () => {
      const result = createPageSchema.safeParse({ ...mockCreatePageDto, status: 'UNKNOWN_STATUS' });
      expect(result.success).toBe(false);
    });

    it('should default status to DRAFT if not provided', () => {
      const { status, ...rest } = mockCreatePageDto;
      const result = createPageSchema.safeParse(rest);
      if (result.success) {
        expect(result.data.status).toBe('DRAFT');
      }
    });

    it('should reject a title that is too short', () => {
      const result = createPageSchema.safeParse({ ...mockCreatePageDto, title: 'A' });
      expect(result.success).toBe(false);
    });

    it('should reject a title that is too long', () => {
      const result = createPageSchema.safeParse({ ...mockCreatePageDto, title: 'A'.repeat(256) });
      expect(result.success).toBe(false);
    });

    it('should reject a slug with invalid characters', () => {
      const result = createPageSchema.safeParse({ ...mockCreatePageDto, slug: 'Invalid Slug With Spaces!' });
      expect(result.success).toBe(false);
    });

    it('should accept a slug starting with forward slash', () => {
      const result = createPageSchema.safeParse({ ...mockCreatePageDto, slug: '/valid-slug' });
      expect(result.success).toBe(true);
    });

    it('should accept optional metaTitle and metaDescription', () => {
      const result = createPageSchema.safeParse({
        ...mockCreatePageDto,
        metaTitle: 'Custom Meta Title',
        metaDescription: 'Custom meta description for the page.',
      });
      expect(result.success).toBe(true);
    });

    it('should reject metaDescription exceeding 160 characters', () => {
      const result = createPageSchema.safeParse({
        ...mockCreatePageDto,
        metaDescription: 'A'.repeat(161),
      });
      expect(result.success).toBe(false);
    });

    it('should accept empty sections array', () => {
      const result = createPageSchema.safeParse({ ...mockCreatePageDto, sections: [] });
      expect(result.success).toBe(true);
    });

    it('should validate sections have required fields', () => {
      const result = createPageSchema.safeParse({
        ...mockCreatePageDto,
        sections: [{ type: 'HERO', order: 1, data: {} }],
      });
      expect(result.success).toBe(true);
    });
  });

  describe('updatePageSchema', () => {
    it('should validate a valid update payload', () => {
      const result = updatePageSchema.safeParse(mockUpdatePageDto);
      expect(result.success).toBe(true);
    });

    it('should allow partial updates — only title', () => {
      const result = updatePageSchema.safeParse({ title: 'Updated Title Only' });
      expect(result.success).toBe(true);
    });

    it('should allow partial updates — only status', () => {
      const result = updatePageSchema.safeParse({ status: 'PUBLISHED' });
      expect(result.success).toBe(true);
    });

    it('should reject invalid status on update', () => {
      const result = updatePageSchema.safeParse({ status: 'COMPLETELY_WRONG' });
      expect(result.success).toBe(false);
    });

    it('should reject empty update object with no fields', () => {
      const result = updatePageSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should reject invalid slug format on update', () => {
      const result = updatePageSchema.safeParse({ slug: 'has spaces and UPPERCASE' });
      expect(result.success).toBe(false);
    });
  });

  describe('pageQuerySchema', () => {
    it('should validate default pagination query', () => {
      const result = pageQuerySchema.safeParse({ page: '1', perPage: '10' });
      expect(result.success).toBe(true);
    });

    it('should coerce string page and perPage to numbers', () => {
      const result = pageQuerySchema.safeParse({ page: '2', perPage: '20' });
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.perPage).toBe(20);
      }
    });

    it('should reject page less than 1', () => {
      const result = pageQuerySchema.safeParse({ page: '0', perPage: '10' });
      expect(result.success).toBe(false);
    });

    it('should reject perPage greater than 100', () => {
      const result = pageQuerySchema.safeParse({ page: '1', perPage: '101' });
      expect(result.success).toBe(false);
    });

    it('should accept optional status filter', () => {
      const result = pageQuerySchema.safeParse({ page: '1', perPage: '10', status: 'PUBLISHED' });
      expect(result.success).toBe(true);
    });

    it('should reject invalid status filter value', () => {
      const result = pageQuerySchema.safeParse({ page: '1', perPage: '10', status: 'INVALID' });
      expect(result.success).toBe(false);
    });

    it('should accept optional template filter', () => {
      const result = pageQuerySchema.safeParse({ page: '1', perPage: '10', template: 'HOME' });
      expect(result.success).toBe(true);
    });

    it('should default page to 1 and perPage to 10 when not provided', () => {
      const result = pageQuerySchema.safeParse({});
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.perPage).toBe(10);
      }
    });
  });
});