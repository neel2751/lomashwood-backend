import { Request, Response, NextFunction } from 'express';
import { PageController } from '../../src/app/pages/page.controller';
import { PageService } from '../../src/app/pages/page.service';
import { mockPageHome, mockPageAboutUs, allMockPages, mockCreatePageDto, mockUpdatePageDto, buildMockPage } from '../fixtures/pages.fixture';
import { mockAdminUser, mockPaginationQuery } from '../fixtures/common.fixture';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

jest.mock('../../src/app/cms/page.service');

const mockPageService = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findBySlug: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  publish: jest.fn(),
  softDelete: jest.fn(),
  findByTemplate: jest.fn(),
};

const mockRes = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext: NextFunction = jest.fn();

describe('PageController', () => {
  let controller: PageController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new PageController(mockPageService as unknown as PageService);
  });

  describe('findAll', () => {
    it('should return 200 with paginated pages', async () => {
      const req = { query: mockPaginationQuery } as unknown as Request;
      const res = mockRes();
      const paginatedResult = { data: allMockPages, meta: { total: allMockPages.length, page: 1, perPage: 10 } };
      mockPageService.findAll.mockResolvedValue(paginatedResult);

      await controller.findAll(req, res, mockNext);

      expect(mockPageService.findAll).toHaveBeenCalledWith(mockPaginationQuery);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ data: allMockPages }),
      );
    });

    it('should forward errors to next middleware', async () => {
      const req = { query: {} } as unknown as Request;
      const res = mockRes();
      const error = new Error('Database error');
      mockPageService.findAll.mockRejectedValue(error);

      await controller.findAll(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('findById', () => {
    it('should return 200 with the requested page', async () => {
      const req = { params: { id: mockPageHome.id } } as unknown as Request;
      const res = mockRes();
      mockPageService.findById.mockResolvedValue(mockPageHome);

      await controller.findById(req, res, mockNext);

      expect(mockPageService.findById).toHaveBeenCalledWith(mockPageHome.id);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ data: mockPageHome }),
      );
    });

    it('should forward not found error to next', async () => {
      const req = { params: { id: 'non-existent' } } as unknown as Request;
      const res = mockRes();
      const error = new Error('Not Found');
      mockPageService.findById.mockRejectedValue(error);

      await controller.findById(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('findBySlug', () => {
    it('should return 200 with the page matching slug', async () => {
      const req = { params: { slug: 'about-us' } } as unknown as Request;
      const res = mockRes();
      mockPageService.findBySlug.mockResolvedValue(mockPageAboutUs);

      await controller.findBySlug(req, res, mockNext);

      expect(mockPageService.findBySlug).toHaveBeenCalledWith('about-us');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: mockPageAboutUs }));
    });
  });

  describe('create', () => {
    it('should return 201 with the created page', async () => {
      const req = {
        body: mockCreatePageDto,
        user: mockAdminUser,
      } as unknown as Request;
      const res = mockRes();
      const newPage = buildMockPage(mockCreatePageDto);
      mockPageService.create.mockResolvedValue(newPage);

      await controller.create(req, res, mockNext);

      expect(mockPageService.create).toHaveBeenCalledWith(mockCreatePageDto, mockAdminUser.id);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: newPage }));
    });

    it('should forward conflict error to next when slug exists', async () => {
      const req = { body: mockCreatePageDto, user: mockAdminUser } as unknown as Request;
      const res = mockRes();
      const error = new Error('Conflict');
      mockPageService.create.mockRejectedValue(error);

      await controller.create(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('update', () => {
    it('should return 200 with the updated page', async () => {
      const req = {
        params: { id: mockPageAboutUs.id },
        body: mockUpdatePageDto,
        user: mockAdminUser,
      } as unknown as Request;
      const res = mockRes();
      const updatedPage = { ...mockPageAboutUs, ...mockUpdatePageDto };
      mockPageService.update.mockResolvedValue(updatedPage);

      await controller.update(req, res, mockNext);

      expect(mockPageService.update).toHaveBeenCalledWith(
        mockPageAboutUs.id,
        mockUpdatePageDto,
        mockAdminUser.id,
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: updatedPage }));
    });
  });

  describe('publish', () => {
    it('should return 200 with the published page', async () => {
      const draftPage = buildMockPage({ status: 'DRAFT' });
      const req = { params: { id: draftPage.id }, user: mockAdminUser } as unknown as Request;
      const res = mockRes();
      const publishedPage = { ...draftPage, status: 'PUBLISHED', publishedAt: new Date() };
      mockPageService.publish.mockResolvedValue(publishedPage);

      await controller.publish(req, res, mockNext);

      expect(mockPageService.publish).toHaveBeenCalledWith(draftPage.id, mockAdminUser.id);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('softDelete', () => {
    it('should return 204 on successful deletion', async () => {
      const page = buildMockPage({ isSystem: false });
      const req = { params: { id: page.id }, user: mockAdminUser } as unknown as Request;
      const res = mockRes();
      mockPageService.softDelete.mockResolvedValue(undefined);

      await controller.softDelete(req, res, mockNext);

      expect(mockPageService.softDelete).toHaveBeenCalledWith(page.id, mockAdminUser.id);
      expect(res.status).toHaveBeenCalledWith(204);
    });

    it('should forward error when attempting to delete a system page', async () => {
      const req = { params: { id: mockPageHome.id }, user: mockAdminUser } as unknown as Request;
      const res = mockRes();
      const error = new Error('Forbidden');
      mockPageService.softDelete.mockRejectedValue(error);

      await controller.softDelete(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});