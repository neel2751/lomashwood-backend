import { PageRepository } from '../../src/app/cms/page.repository';
import { PrismaClient } from '@prisma/client';
import { mockPageHome, mockPageAboutUs, allMockPages, buildMockPage, mockCreatePageDto } from '../fixtures/pages.fixture';
import { mockAdminUser, mockPaginationQuery } from '../fixtures/common.fixture';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

const mockPrisma = {
  page: {
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

describe('PageRepository', () => {
  let repository: PageRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new PageRepository(mockPrisma as unknown as PrismaClient);
  });

  describe('findAll', () => {
    it('should return array of pages with default pagination', async () => {
      mockPrisma.page.findMany.mockResolvedValue(allMockPages);

      const result = await repository.findAll(mockPaginationQuery);

      expect(mockPrisma.page.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: mockPaginationQuery.perPage,
          where: expect.objectContaining({ deletedAt: null }),
          orderBy: expect.any(Object),
        }),
      );
      expect(result).toHaveLength(allMockPages.length);
    });

    it('should apply status filter when provided', async () => {
      const published = allMockPages.filter((p) => p.status === 'PUBLISHED');
      mockPrisma.page.findMany.mockResolvedValue(published);

      await repository.findAll({ ...mockPaginationQuery, status: 'PUBLISHED' });

      expect(mockPrisma.page.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'PUBLISHED', deletedAt: null }),
        }),
      );
    });

    it('should apply template filter when provided', async () => {
      const homePages = allMockPages.filter((p) => p.template === 'HOME');
      mockPrisma.page.findMany.mockResolvedValue(homePages);

      await repository.findAll({ ...mockPaginationQuery, template: 'HOME' });

      expect(mockPrisma.page.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ template: 'HOME' }),
        }),
      );
    });

    it('should exclude soft-deleted pages', async () => {
      mockPrisma.page.findMany.mockResolvedValue(allMockPages);

      await repository.findAll(mockPaginationQuery);

      expect(mockPrisma.page.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ deletedAt: null }),
        }),
      );
    });

    it('should calculate correct skip value for page 2', async () => {
      mockPrisma.page.findMany.mockResolvedValue([]);

      await repository.findAll({ page: 2, perPage: 10 });

      expect(mockPrisma.page.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 }),
      );
    });
  });

  describe('findById', () => {
    it('should return a page when found', async () => {
      mockPrisma.page.findUnique.mockResolvedValue(mockPageHome);

      const result = await repository.findById(mockPageHome.id);

      expect(mockPrisma.page.findUnique).toHaveBeenCalledWith({
        where: { id: mockPageHome.id, deletedAt: null },
      });
      expect(result).toEqual(mockPageHome);
    });

    it('should return null when page not found', async () => {
      mockPrisma.page.findUnique.mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findBySlug', () => {
    it('should return a page by slug', async () => {
      mockPrisma.page.findFirst.mockResolvedValue(mockPageHome);

      const result = await repository.findBySlug('/');

      expect(mockPrisma.page.findFirst).toHaveBeenCalledWith({
        where: { slug: '/', deletedAt: null },
      });
      expect(result).toEqual(mockPageHome);
    });

    it('should return null when slug not found', async () => {
      mockPrisma.page.findFirst.mockResolvedValue(null);

      const result = await repository.findBySlug('unknown-slug');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create and return a page', async () => {
      const newPage = buildMockPage(mockCreatePageDto);
      mockPrisma.page.create.mockResolvedValue(newPage);

      const payload = { ...mockCreatePageDto, createdById: mockAdminUser.id, updatedById: mockAdminUser.id };
      const result = await repository.create(payload);

      expect(mockPrisma.page.create).toHaveBeenCalledWith({ data: payload });
      expect(result).toEqual(newPage);
    });
  });

  describe('update', () => {
    it('should update and return the page', async () => {
      const updated = { ...mockPageAboutUs, title: 'Updated Title' };
      mockPrisma.page.update.mockResolvedValue(updated);

      const result = await repository.update(mockPageAboutUs.id, { title: 'Updated Title' });

      expect(mockPrisma.page.update).toHaveBeenCalledWith({
        where: { id: mockPageAboutUs.id },
        data: { title: 'Updated Title' },
      });
      expect(result.title).toBe('Updated Title');
    });
  });

  describe('softDelete', () => {
    it('should set deletedAt timestamp on soft delete', async () => {
      const deletedPage = { ...mockPageAboutUs, deletedAt: new Date() };
      mockPrisma.page.update.mockResolvedValue(deletedPage);

      const result = await repository.softDelete(mockPageAboutUs.id, mockAdminUser.id);

      expect(mockPrisma.page.update).toHaveBeenCalledWith({
        where: { id: mockPageAboutUs.id },
        data: expect.objectContaining({
          deletedAt: expect.any(Date),
          updatedById: mockAdminUser.id,
        }),
      });
      expect(result.deletedAt).not.toBeNull();
    });
  });

  describe('countAll', () => {
    it('should return total count of pages', async () => {
      mockPrisma.page.count.mockResolvedValue(allMockPages.length);

      const result = await repository.countAll({});

      expect(mockPrisma.page.count).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ deletedAt: null }) }),
      );
      expect(result).toBe(allMockPages.length);
    });
  });

  describe('findByTemplate', () => {
    it('should return pages matching template', async () => {
      const financePages = allMockPages.filter((p) => p.template === 'FINANCE');
      mockPrisma.page.findMany.mockResolvedValue(financePages);

      const result = await repository.findByTemplate('FINANCE');

      expect(mockPrisma.page.findMany).toHaveBeenCalledWith({
        where: { template: 'FINANCE', deletedAt: null },
        orderBy: expect.any(Object),
      });
      expect(result).toEqual(financePages);
    });
  });

  describe('publish', () => {
    it('should set status to PUBLISHED and set publishedAt', async () => {
      const published = { ...mockPageAboutUs, status: 'PUBLISHED', publishedAt: new Date() };
      mockPrisma.page.update.mockResolvedValue(published);

      const result = await repository.publish(mockPageAboutUs.id, mockAdminUser.id);

      expect(mockPrisma.page.update).toHaveBeenCalledWith({
        where: { id: mockPageAboutUs.id },
        data: expect.objectContaining({
          status: 'PUBLISHED',
          publishedAt: expect.any(Date),
          updatedById: mockAdminUser.id,
        }),
      });
      expect(result.status).toBe('PUBLISHED');
    });
  });
});