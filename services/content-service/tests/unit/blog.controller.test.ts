import { Request, Response, NextFunction } from 'express';
import { BlogController } from '../../src/app/blogs/blog.controller';
import { BlogService } from '../../src/app/blogs/blog.types';
import { BlogServiceImpl } from '../../src/app/blogs/blog.service';
import {
  mockBlogKitchenTrends,
  mockBlogDraftPost,
  allMockBlogs,
  publishedMockBlogs,
  mockCreateBlogDto,
  mockUpdateBlogDto,
  buildMockBlog,
} from '../fixtures/blogs.fixture';
import { mockAdminUser, mockPaginationQuery } from '../fixtures/common.fixture';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

jest.mock('../../src/app/blogs/blog.service', () => ({
  BlogServiceImpl: jest.fn().mockImplementation(() => ({
    listBlogs: jest.fn(),
    getBlogById: jest.fn(),
    getBlogBySlug: jest.fn(),
    createBlog: jest.fn(),
    updateBlog: jest.fn(),
    deleteBlog: jest.fn(),
    getFeaturedBlogs: jest.fn(),
  })),
}));

const mockRes = () => {
  const res = {} as Response;
  (res.status as any) = jest.fn().mockReturnValue(res);
  (res.json as any) = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext: NextFunction = jest.fn();

describe('BlogController', () => {
  let controller: BlogController;
  let mockService: jest.Mocked<BlogService>;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new BlogController();
    mockService = jest.mocked((controller as any).service);
  });

  describe('listBlogs', () => {
    it('should return 200 with paginated list', async () => {
      const req = { query: mockPaginationQuery } as unknown as Request;
      const res = mockRes();
      const paginated = { data: publishedMockBlogs, meta: { total: publishedMockBlogs.length, page: 1, perPage: 10 } };
      mockService.listBlogs.mockResolvedValue(paginated as any);

      await controller.listBlogs(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: publishedMockBlogs }));
    });

    it('should pass query params to service', async () => {
      const req = { query: { ...mockPaginationQuery, status: 'PUBLISHED', isFeatured: 'true' } } as unknown as Request;
      const res = mockRes();
      mockService.listBlogs.mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0, hasNextPage: false, hasPrevPage: false } } as any);

      await controller.listBlogs(req, res, mockNext);

      expect(mockService.listBlogs).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'PUBLISHED' }),
      );
    });

    it('should forward errors to next', async () => {
      const req = { query: {} } as unknown as Request;
      const res = mockRes();
      mockService.listBlogs.mockRejectedValue(new Error('DB failure'));

      await controller.listBlogs(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getBlogById', () => {
    it('should return 200 with the blog', async () => {
      const req = { params: { id: mockBlogKitchenTrends.id } } as unknown as Request;
      const res = mockRes();
      mockService.getBlogById.mockResolvedValue(mockBlogKitchenTrends as any);

      await controller.getBlogById(req, res, mockNext);

      expect(mockService.getBlogById).toHaveBeenCalledWith(mockBlogKitchenTrends.id);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: mockBlogKitchenTrends }));
    });

    it('should forward NotFoundException to next', async () => {
      const req = { params: { id: 'not-found' } } as unknown as Request;
      const res = mockRes();
      mockService.getBlogById.mockRejectedValue(new Error('Not Found'));

      await controller.getBlogById(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getBlogBySlug', () => {
    it('should return 200 with blog and increment view count', async () => {
      const req = { params: { slug: mockBlogKitchenTrends.slug } } as unknown as Request;
      const res = mockRes();
      mockService.getBlogBySlug.mockResolvedValue(mockBlogKitchenTrends as any);

      await controller.getBlogBySlug(req, res, mockNext);

      expect(mockService.getBlogBySlug).toHaveBeenCalledWith(mockBlogKitchenTrends.slug);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getFeaturedBlogs', () => {
    it('should return 200 with related blogs', async () => {
      const req = { params: { id: mockBlogKitchenTrends.id }, query: { limit: '3' } } as unknown as Request;
      const res = mockRes();
      const related = [mockBlogDraftPost];
      mockService.getFeaturedBlogs.mockResolvedValue(related as any);

      await controller.getFeaturedBlogs(req, res, mockNext);

      expect(mockService.getFeaturedBlogs).toHaveBeenCalledWith(3);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('createBlog', () => {
    it('should return 201 with newly created blog', async () => {
      const req = { body: mockCreateBlogDto, user: mockAdminUser } as unknown as Request;
      const res = mockRes();
      const newBlog = buildMockBlog(mockCreateBlogDto);
      mockService.createBlog.mockResolvedValue(newBlog as any);

      await controller.createBlog(req, res, mockNext);

      expect(mockService.createBlog).toHaveBeenCalledWith({ ...mockCreateBlogDto, authorId: mockAdminUser.id });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: newBlog }));
    });

    it('should forward conflict error for duplicate slug', async () => {
      const req = { body: mockCreateBlogDto, user: mockAdminUser } as unknown as Request;
      const res = mockRes();
      mockService.createBlog.mockRejectedValue(new Error('Conflict'));

      await controller.createBlog(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('updateBlog', () => {
    it('should return 200 with updated blog', async () => {
      const req = {
        params: { id: mockBlogKitchenTrends.id },
        body: mockUpdateBlogDto,
        user: mockAdminUser,
      } as unknown as Request;
      const res = mockRes();
      const updated = { ...mockBlogKitchenTrends, ...mockUpdateBlogDto };
      mockService.updateBlog.mockResolvedValue(updated as any);

      await controller.updateBlog(req, res, mockNext);

      expect(mockService.updateBlog).toHaveBeenCalledWith(
        mockBlogKitchenTrends.id,
        mockUpdateBlogDto,
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('deleteBlog', () => {
    it('should return 204 on success', async () => {
      const req = { params: { id: mockBlogKitchenTrends.id }, user: mockAdminUser } as unknown as Request;
      const res = mockRes();
      mockService.deleteBlog.mockResolvedValue(undefined);

      await controller.deleteBlog(req, res, mockNext);

      expect(mockService.deleteBlog).toHaveBeenCalledWith(
        mockBlogKitchenTrends.id,
      );
      expect(res.status).toHaveBeenCalledWith(204);
    });
  });
});