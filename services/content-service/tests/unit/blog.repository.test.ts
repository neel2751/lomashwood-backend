import { BlogRepository } from '../../src/app/blogs/blog.repository';
import { PrismaClient } from '@prisma/client';
import {
  mockBlogKitchenTrends,
  mockBlogDraftPost,
  allMockBlogs,
  publishedMockBlogs,
  mockCreateBlogDto,
  buildMockBlog,
} from '../fixtures/blogs.fixture';
import { mockAdminUser, mockPaginationQuery } from '../fixtures/common.fixture';

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

const mockPrisma = {
  blog: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
};

jest.mock('../../src/infrastructure/db/prisma.client', () => ({
  getPrismaClient: () => mockPrisma,
}));

describe('BlogRepository', () => {
  let repository: BlogRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new BlogRepository(mockPrisma as unknown as PrismaClient);
  });

  describe('findAll', () => {
    it('should return all non-deleted blogs', async () => {
      mockPrisma.blog.findMany.mockResolvedValue(allMockBlogs);

      const result = await repository.findAll(mockPaginationQuery);

      expect(mockPrisma.blog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ deletedAt: null }),
          skip: 0,
          take: mockPaginationQuery.perPage,
        }),
      );
      expect(result).toHaveLength(allMockBlogs.length);
    });

    it('should filter by status', async () => {
      mockPrisma.blog.findMany.mockResolvedValue(publishedMockBlogs);

      await repository.findAll({ ...mockPaginationQuery, status: 'PUBLISHED' });

      expect(mockPrisma.blog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'PUBLISHED', deletedAt: null }),
        }),
      );
    });

    it('should filter by categoryId using array contains', async () => {
      const categoryId = 'some-category-id';
      mockPrisma.blog.findMany.mockResolvedValue([mockBlogKitchenTrends]);

      await repository.findAll({ ...mockPaginationQuery, categoryId });

      expect(mockPrisma.blog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            categoryIds: expect.objectContaining({ has: categoryId }),
          }),
        }),
      );
    });

    it('should filter by isFeatured', async () => {
      const featured = allMockBlogs.filter((b) => b.isFeatured);
      mockPrisma.blog.findMany.mockResolvedValue(featured);

      await repository.findAll({ ...mockPaginationQuery, isFeatured: true });

      expect(mockPrisma.blog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isFeatured: true }),
        }),
      );
    });

    it('should support full-text search on title and excerpt', async () => {
      mockPrisma.blog.findMany.mockResolvedValue([mockBlogKitchenTrends]);

      await repository.findAll({ ...mockPaginationQuery, search: 'Kitchen' });

      expect(mockPrisma.blog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ title: expect.any(Object) }),
              expect.objectContaining({ excerpt: expect.any(Object) }),
            ]),
          }),
        }),
      );
    });

    it('should paginate correctly for page 3 with perPage 5', async () => {
      mockPrisma.blog.findMany.mockResolvedValue([]);

      await repository.findAll({ page: 3, perPage: 5 });

      expect(mockPrisma.blog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 5 }),
      );
    });

    it('should order by publishedAt descending by default', async () => {
      mockPrisma.blog.findMany.mockResolvedValue(publishedMockBlogs);

      await repository.findAll(mockPaginationQuery);

      expect(mockPrisma.blog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: expect.objectContaining({ publishedAt: 'desc' }),
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return blog by id', async () => {
      mockPrisma.blog.findUnique.mockResolvedValue(mockBlogKitchenTrends);

      const result = await repository.findById(mockBlogKitchenTrends.id);

      expect(mockPrisma.blog.findUnique).toHaveBeenCalledWith({
        where: { id: mockBlogKitchenTrends.id, deletedAt: null },
      });
      expect(result).toEqual(mockBlogKitchenTrends);
    });

    it('should return null when not found', async () => {
      mockPrisma.blog.findUnique.mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findBySlug', () => {
    it('should return blog by slug', async () => {
      mockPrisma.blog.findFirst.mockResolvedValue(mockBlogKitchenTrends);

      const result = await repository.findBySlug(mockBlogKitchenTrends.slug);

      expect(mockPrisma.blog.findFirst).toHaveBeenCalledWith({
        where: { slug: mockBlogKitchenTrends.slug, deletedAt: null },
      });
      expect(result).toEqual(mockBlogKitchenTrends);
    });

    it('should return null when slug not found', async () => {
      mockPrisma.blog.findFirst.mockResolvedValue(null);

      const result = await repository.findBySlug('no-such-slug');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new blog post', async () => {
      const newBlog = buildMockBlog(mockCreateBlogDto);
      mockPrisma.blog.create.mockResolvedValue(newBlog);

      const payload = { ...mockCreateBlogDto, authorId: mockAdminUser.id, createdById: mockAdminUser.id, updatedById: mockAdminUser.id };
      const result = await repository.create(payload);

      expect(mockPrisma.blog.create).toHaveBeenCalledWith({ data: payload });
      expect(result).toEqual(newBlog);
    });
  });

  describe('update', () => {
    it('should update a blog post', async () => {
      const updated = { ...mockBlogKitchenTrends, title: 'Updated Title' };
      mockPrisma.blog.update.mockResolvedValue(updated);

      const result = await repository.update(mockBlogKitchenTrends.id, { title: 'Updated Title' });

      expect(mockPrisma.blog.update).toHaveBeenCalledWith({
        where: { id: mockBlogKitchenTrends.id },
        data: { title: 'Updated Title' },
      });
      expect(result.title).toBe('Updated Title');
    });
  });

  describe('softDelete', () => {
    it('should soft-delete a blog post', async () => {
      const deleted = { ...mockBlogKitchenTrends, deletedAt: new Date() };
      mockPrisma.blog.update.mockResolvedValue(deleted);

      await repository.softDelete(mockBlogKitchenTrends.id, mockAdminUser.id);

      expect(mockPrisma.blog.update).toHaveBeenCalledWith({
        where: { id: mockBlogKitchenTrends.id },
        data: expect.objectContaining({
          deletedAt: expect.any(Date),
          updatedById: mockAdminUser.id,
        }),
      });
    });
  });

  describe('publish', () => {
    it('should set status to PUBLISHED and set publishedAt', async () => {
      const published = { ...mockBlogDraftPost, status: 'PUBLISHED', publishedAt: new Date() };
      mockPrisma.blog.update.mockResolvedValue(published);

      const result = await repository.publish(mockBlogDraftPost.id, mockAdminUser.id);

      expect(mockPrisma.blog.update).toHaveBeenCalledWith({
        where: { id: mockBlogDraftPost.id },
        data: expect.objectContaining({
          status: 'PUBLISHED',
          publishedAt: expect.any(Date),
        }),
      });
      expect(result.status).toBe('PUBLISHED');
    });
  });

  describe('incrementViewCount', () => {
    it('should increment viewCount by 1', async () => {
      mockPrisma.blog.update.mockResolvedValue({
        ...mockBlogKitchenTrends,
        viewCount: mockBlogKitchenTrends.viewCount + 1,
      });

      await repository.incrementViewCount(mockBlogKitchenTrends.id);

      expect(mockPrisma.blog.update).toHaveBeenCalledWith({
        where: { id: mockBlogKitchenTrends.id },
        data: { viewCount: { increment: 1 } },
      });
    });
  });

  describe('countAll', () => {
    it('should return count of non-deleted blogs', async () => {
      mockPrisma.blog.count.mockResolvedValue(allMockBlogs.length);

      const result = await repository.countAll({});

      expect(mockPrisma.blog.count).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ deletedAt: null }) }),
      );
      expect(result).toBe(allMockBlogs.length);
    });
  });

  describe('findRelated', () => {
    it('should find related blogs by shared categoryIds or tagIds', async () => {
      const related = [mockBlogKitchenTrends];
      mockPrisma.blog.findMany.mockResolvedValue(related);

      const result = await repository.findRelated(
        mockBlogKitchenTrends.id,
        mockBlogKitchenTrends.categoryIds,
        mockBlogKitchenTrends.tagIds,
        3,
      );

      expect(mockPrisma.blog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: { not: mockBlogKitchenTrends.id },
            status: 'PUBLISHED',
            deletedAt: null,
          }),
          take: 3,
        }),
      );
      expect(result).toHaveLength(1);
    });
  });
});