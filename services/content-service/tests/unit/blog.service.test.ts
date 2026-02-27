import { BlogService } from '../../src/app/blogs/blog.service';
import { BlogRepository } from '../../src/app/blogs/blog.repository';
import { AppError } from '../../src/shared/errors';
import {
  mockBlogBedroomMakeover,
  mockBlogDraftPost,
  allMockBlogs,
  publishedMockBlogs,
  mockCreateBlogDto,
  mockUpdateBlogDto,
  buildMockBlog,
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
} from '../fixtures/blogs.fixture';
import { mockAdminUser, mockPaginationQuery } from '../fixtures/common.fixture';

const mockBlogRepository = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findBySlug: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
  publish: jest.fn(),
  schedule: jest.fn(),
  incrementViewCount: jest.fn(),
  countAll: jest.fn(),
  findRelated: jest.fn(),
};

describe('BlogService', () => {
  let service: BlogService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new BlogService(mockBlogRepository as unknown as BlogRepository);
  });

  describe('findAll', () => {
    it('should return paginated blogs', async () => {
      mockBlogRepository.findAll.mockResolvedValue(allMockBlogs);
      mockBlogRepository.countAll.mockResolvedValue(allMockBlogs.length);

      const result = await service.findAll(mockPaginationQuery);

      expect(mockBlogRepository.findAll).toHaveBeenCalledWith(mockPaginationQuery);
      expect(result.data).toHaveLength(allMockBlogs.length);
      expect(result.meta.total).toBe(allMockBlogs.length);
    });

    it('should filter by status PUBLISHED', async () => {
      mockBlogRepository.findAll.mockResolvedValue(publishedMockBlogs);
      mockBlogRepository.countAll.mockResolvedValue(publishedMockBlogs.length);

      const result = await service.findAll({ ...mockPaginationQuery, status: 'PUBLISHED' });

      expect(result.data.every((b) => b.status === 'PUBLISHED')).toBe(true);
    });

    it('should filter by categoryId', async () => {
      const categoryId = 'some-category-id';
      const filtered = publishedMockBlogs.slice(0, 2);
      mockBlogRepository.findAll.mockResolvedValue(filtered);
      mockBlogRepository.countAll.mockResolvedValue(filtered.length);

      await service.findAll({ ...mockPaginationQuery, categoryId });

      expect(mockBlogRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ categoryId }),
      );
    });

    it('should filter by isFeatured', async () => {
      const featured = allMockBlogs.filter((b) => b.isFeatured);
      mockBlogRepository.findAll.mockResolvedValue(featured);
      mockBlogRepository.countAll.mockResolvedValue(featured.length);

      const result = await service.findAll({ ...mockPaginationQuery, isFeatured: true });

      expect(result.data.every((b) => b.isFeatured)).toBe(true);
    });

    it('should support search by title or content', async () => {
      const searched = [mockBlogKitchenTrends];
      mockBlogRepository.findAll.mockResolvedValue(searched);
      mockBlogRepository.countAll.mockResolvedValue(1);

      await service.findAll({ ...mockPaginationQuery, search: 'Kitchen Design' });

      expect(mockBlogRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'Kitchen Design' }),
      );
    });
  });

  describe('findById', () => {
    it('should return a blog by id', async () => {
      mockBlogRepository.findById.mockResolvedValue(mockBlogKitchenTrends);

      const result = await service.findById(mockBlogKitchenTrends.id);

      expect(result).toEqual(mockBlogKitchenTrends);
    });

    it('should throw NotFoundException when blog not found', async () => {
      mockBlogRepository.findById.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow();
    });
  });

  describe('findBySlug', () => {
    it('should return a blog by slug and increment view count', async () => {
      mockBlogRepository.findBySlug.mockResolvedValue(mockBlogKitchenTrends);
      mockBlogRepository.incrementViewCount.mockResolvedValue(undefined);

      const result = await service.findBySlug(mockBlogKitchenTrends.slug);

      expect(mockBlogRepository.findBySlug).toHaveBeenCalledWith(mockBlogKitchenTrends.slug);
      expect(mockBlogRepository.incrementViewCount).toHaveBeenCalledWith(mockBlogKitchenTrends.id);
      expect(result).toEqual(mockBlogKitchenTrends);
    });

    it('should throw NotFoundException for unpublished blogs accessed publicly', async () => {
      mockBlogRepository.findBySlug.mockResolvedValue(mockBlogDraftPost);

      await expect(service.findBySlug(mockBlogDraftPost.slug)).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('should create a new blog post', async () => {
      const newBlog = buildMockBlog(mockCreateBlogDto);
      mockBlogRepository.findBySlug.mockResolvedValue(null);
      mockBlogRepository.create.mockResolvedValue(newBlog);

      const result = await service.create(mockCreateBlogDto, mockAdminUser.id);

      expect(mockBlogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createdById: mockAdminUser.id,
          authorId: mockAdminUser.id,
        }),
      );
      expect(result).toEqual(newBlog);
    });

    it('should auto-calculate readingTimeMinutes from content', async () => {
      const longContent = '<p>' + 'word '.repeat(500) + '</p>';
      const dto = { ...mockCreateBlogDto, content: longContent };
      const newBlog = buildMockBlog({ ...dto, readingTimeMinutes: 2 });
      mockBlogRepository.findBySlug.mockResolvedValue(null);
      mockBlogRepository.create.mockResolvedValue(newBlog);

      const result = await service.create(dto, mockAdminUser.id);

      expect(result.readingTimeMinutes).toBeGreaterThan(1);
    });

    it('should throw ConflictException if slug already exists', async () => {
      mockBlogRepository.findBySlug.mockResolvedValue(mockBlogKitchenTrends);

      await expect(service.create(mockCreateBlogDto, mockAdminUser.id)).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should update and return a blog post', async () => {
      const updated = { ...mockBlogKitchenTrends, ...mockUpdateBlogDto };
      mockBlogRepository.findById.mockResolvedValue(mockBlogKitchenTrends);
      mockBlogRepository.update.mockResolvedValue(updated);

      const result = await service.update(
        mockBlogKitchenTrends.id,
        mockUpdateBlogDto,
        mockAdminUser.id,
      );

      expect(mockBlogRepository.update).toHaveBeenCalledWith(
        mockBlogKitchenTrends.id,
        expect.objectContaining({ updatedById: mockAdminUser.id }),
      );
      expect(result.title).toBe(mockUpdateBlogDto.title);
    });

    it('should throw NotFoundException when blog does not exist', async () => {
      mockBlogRepository.findById.mockResolvedValue(null);

      await expect(
        service.update('non-existent', mockUpdateBlogDto, mockAdminUser.id),
      ).rejects.toThrow();
    });

    it('should recalculate readingTimeMinutes when content is updated', async () => {
      const newContent = '<p>' + 'word '.repeat(300) + '</p>';
      mockBlogRepository.findById.mockResolvedValue(mockBlogDraftPost);
      const updated = { ...mockBlogDraftPost, content: newContent, readingTimeMinutes: 1 };
      mockBlogRepository.update.mockResolvedValue(updated);

      const result = await service.update(
        mockBlogDraftPost.id,
        { content: newContent },
        mockAdminUser.id,
      );

      expect(result.readingTimeMinutes).toBeGreaterThanOrEqual(1);
    });
  });

  describe('publish', () => {
    it('should publish a draft blog post', async () => {
      const published = { ...mockBlogDraftPost, status: 'PUBLISHED', publishedAt: new Date() };
      mockBlogRepository.findById.mockResolvedValue(mockBlogDraftPost);
      mockBlogRepository.publish.mockResolvedValue(published);

      const result = await service.publish(mockBlogDraftPost.id, mockAdminUser.id);

      expect(result.status).toBe('PUBLISHED');
      expect(result.publishedAt).toBeDefined();
    });

    it('should throw if blog is already published', async () => {
      mockBlogRepository.findById.mockResolvedValue(mockBlogKitchenTrends);

      await expect(service.publish(mockBlogKitchenTrends.id, mockAdminUser.id)).rejects.toThrow();
    });
  });

  describe('schedule', () => {
    it('should schedule a blog post for future publication', async () => {
      const futureDate = new Date('2025-06-01T09:00:00Z');
      const scheduled = { ...mockBlogDraftPost, status: 'SCHEDULED', scheduledAt: futureDate };
      mockBlogRepository.findById.mockResolvedValue(mockBlogDraftPost);
      mockBlogRepository.schedule.mockResolvedValue(scheduled);

      const result = await service.schedule(mockBlogDraftPost.id, futureDate, mockAdminUser.id);

      expect(result.status).toBe('SCHEDULED');
      expect(result.scheduledAt).toEqual(futureDate);
    });

    it('should throw if scheduledAt is in the past', async () => {
      const pastDate = new Date('2020-01-01T00:00:00Z');
      mockBlogRepository.findById.mockResolvedValue(mockBlogDraftPost);

      await expect(
        service.schedule(mockBlogDraftPost.id, pastDate, mockAdminUser.id),
      ).rejects.toThrow();
    });
  });

  describe('softDelete', () => {
    it('should soft delete a blog post', async () => {
      mockBlogRepository.findById.mockResolvedValue(mockBlogKitchenTrends);
      mockBlogRepository.softDelete.mockResolvedValue(undefined);

      await service.softDelete(mockBlogKitchenTrends.id, mockAdminUser.id);

      expect(mockBlogRepository.softDelete).toHaveBeenCalledWith(
        mockBlogKitchenTrends.id,
        mockAdminUser.id,
      );
    });
  });

  describe('findRelated', () => {
    it('should return related blogs by category and tags', async () => {
      const related = [mockBlogBedroomMakeover];
      mockBlogRepository.findById.mockResolvedValue(mockBlogKitchenTrends);
      mockBlogRepository.findRelated.mockResolvedValue(related);

      const result = await service.findRelated(mockBlogKitchenTrends.id, 3);

      expect(mockBlogRepository.findRelated).toHaveBeenCalledWith(
        mockBlogKitchenTrends.id,
        expect.any(Array),
        expect.any(Array),
        3,
      );
      expect(result).toHaveLength(1);
    });
  });
});