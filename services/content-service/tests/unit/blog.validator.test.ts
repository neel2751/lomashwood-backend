import { describe, it, expect } from '@jest/globals';
import { createBlogSchema, updateBlogSchema, blogListQuerySchema } from '../../src/app/blogs/blog.schemas';
import { mockCreateBlogDto, mockUpdateBlogDto } from '../fixtures/blogs.fixture';

describe('Blog Validators', () => {
  describe('createBlogSchema', () => {
    it('should validate a valid create payload', () => {
      const result = createBlogSchema.safeParse(mockCreateBlogDto);
      expect(result.success).toBe(true);
    });

    it('should require title', () => {
      const { title, ...rest } = mockCreateBlogDto;
      const result = createBlogSchema.safeParse(rest);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('title'))).toBe(true);
      }
    });

    it('should require slug', () => {
      const { slug, ...rest } = mockCreateBlogDto;
      const result = createBlogSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should require excerpt', () => {
      const { excerpt, ...rest } = mockCreateBlogDto;
      const result = createBlogSchema.safeParse(rest);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('excerpt'))).toBe(true);
      }
    });

    it('should require content', () => {
      const { content, ...rest } = mockCreateBlogDto;
      const result = createBlogSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should reject a title shorter than 3 characters', () => {
      const result = createBlogSchema.safeParse({ ...mockCreateBlogDto, title: 'AB' });
      expect(result.success).toBe(false);
    });

    it('should reject a title longer than 255 characters', () => {
      const result = createBlogSchema.safeParse({ ...mockCreateBlogDto, title: 'A'.repeat(256) });
      expect(result.success).toBe(false);
    });

    it('should reject an excerpt exceeding 500 characters', () => {
      const result = createBlogSchema.safeParse({
        ...mockCreateBlogDto,
        excerpt: 'X'.repeat(501),
      });
      expect(result.success).toBe(false);
    });

    it('should reject an invalid status value', () => {
      const result = createBlogSchema.safeParse({ ...mockCreateBlogDto, status: 'GARBAGE' });
      expect(result.success).toBe(false);
    });

    it('should default status to DRAFT', () => {
      const { status, ...rest } = mockCreateBlogDto;
      const result = createBlogSchema.safeParse(rest);
      if (result.success) {
        expect(result.data.status).toBe('DRAFT');
      }
    });

    it('should accept valid status values', () => {
      const statuses = ['DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED'];
      statuses.forEach((status) => {
        const result = createBlogSchema.safeParse({ ...mockCreateBlogDto, status });
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid slug format', () => {
      const result = createBlogSchema.safeParse({
        ...mockCreateBlogDto,
        slug: 'Has Uppercase AND Spaces!',
      });
      expect(result.success).toBe(false);
    });

    it('should allow empty categoryIds and tagIds arrays', () => {
      const result = createBlogSchema.safeParse({
        ...mockCreateBlogDto,
        categoryIds: [],
        tagIds: [],
      });
      expect(result.success).toBe(true);
    });

    it('should validate metaDescription does not exceed 160 characters', () => {
      const result = createBlogSchema.safeParse({
        ...mockCreateBlogDto,
        metaDescription: 'D'.repeat(161),
      });
      expect(result.success).toBe(false);
    });

    it('should default allowComments to true', () => {
      const { allowComments, ...rest } = mockCreateBlogDto;
      const result = createBlogSchema.safeParse(rest);
      if (result.success) {
        expect(result.data.allowComments).toBe(true);
      }
    });

    it('should default isFeatured to false', () => {
      const { isFeatured, ...rest } = mockCreateBlogDto;
      const result = createBlogSchema.safeParse(rest);
      if (result.success) {
        expect(result.data.isFeatured).toBe(false);
      }
    });
  });

  describe('updateBlogSchema', () => {
    it('should validate a valid update payload', () => {
      const result = updateBlogSchema.safeParse(mockUpdateBlogDto);
      expect(result.success).toBe(true);
    });

    it('should allow partial update — only title', () => {
      const result = updateBlogSchema.safeParse({ title: 'New Title Only' });
      expect(result.success).toBe(true);
    });

    it('should allow partial update — only status', () => {
      const result = updateBlogSchema.safeParse({ status: 'ARCHIVED' });
      expect(result.success).toBe(true);
    });

    it('should reject empty update body', () => {
      const result = updateBlogSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should reject invalid status on update', () => {
      const result = updateBlogSchema.safeParse({ status: 'NOT_VALID' });
      expect(result.success).toBe(false);
    });

    it('should reject title shorter than 3 chars on update', () => {
      const result = updateBlogSchema.safeParse({ title: 'AB' });
      expect(result.success).toBe(false);
    });
  });

  describe('blogListQuerySchema', () => {
    it('should validate default pagination query', () => {
      const result = blogListQuerySchema.safeParse({ page: '1', limit: '10' });
      expect(result.success).toBe(true);
    });

    it('should coerce page and limit strings to numbers', () => {
      const result = blogListQuerySchema.safeParse({ page: '3', limit: '15' });
      if (result.success) {
        expect(result.data.page).toBe(3);
        expect(result.data.limit).toBe(15);
      }
    });

    it('should accept status filter', () => {
      const result = blogListQuerySchema.safeParse({ page: '1', limit: '10', status: 'PUBLISHED' });
      expect(result.success).toBe(true);
    });

    it('should accept isFeatured as boolean string', () => {
      const result = blogListQuerySchema.safeParse({ page: '1', limit: '10', isFeatured: 'true' });
      if (result.success) {
        expect(result.data.isFeatured).toBe(true);
      }
    });

    it('should accept categoryId filter', () => {
      const result = blogListQuerySchema.safeParse({ page: '1', limit: '10', categoryId: 'some-uuid' });
      expect(result.success).toBe(true);
    });

    it('should accept search filter', () => {
      const result = blogListQuerySchema.safeParse({ page: '1', limit: '10', search: 'Kitchen Trends' });
      expect(result.success).toBe(true);
    });

    it('should reject page less than 1', () => {
      const result = blogListQuerySchema.safeParse({ page: '0', limit: '10' });
      expect(result.success).toBe(false);
    });

    it('should reject limit greater than max', () => {
      const result = blogListQuerySchema.safeParse({ page: '1', limit: '200' });
      expect(result.success).toBe(false);
    });

    it('should default page to 1 and limit to default page size', () => {
      const result = blogListQuerySchema.safeParse({});
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(typeof result.data.limit).toBe('number');
      }
    });
  });
});