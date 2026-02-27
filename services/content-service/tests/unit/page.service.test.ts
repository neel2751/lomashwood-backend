import { PageService } from '../../src/app/cms/page.service';
import { PageRepository } from '../../src/app/cms/page.repository';
import { mockPageHome, mockPageAboutUs, allMockPages, mockCreatePageDto, mockUpdatePageDto, buildMockPage } from '../fixtures/pages.fixture';
import { mockAdminUser, mockPaginationQuery } from '../fixtures/common.fixture';

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

jest.mock('../../src/app/cms/page.repository');

const mockPageRepository = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findBySlug: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
  publish: jest.fn(),
  findByTemplate: jest.fn(),
  countAll: jest.fn(),
};

describe('PageService', () => {
  let service: PageService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PageService(mockPageRepository as unknown as PageRepository);
  });

  describe('findAll', () => {
    it('should return paginated pages', async () => {
      const pages = allMockPages.slice(0, 5);
      mockPageRepository.findAll.mockResolvedValue(pages);
      mockPageRepository.countAll.mockResolvedValue(allMockPages.length);

      const result = await service.findAll(mockPaginationQuery);

      expect(mockPageRepository.findAll).toHaveBeenCalledWith(mockPaginationQuery);
      expect(result.data).toHaveLength(5);
      expect(result.meta.total).toBe(allMockPages.length);
    });

    it('should filter pages by status', async () => {
      const publishedPages = allMockPages.filter((p) => p.status === 'PUBLISHED');
      mockPageRepository.findAll.mockResolvedValue(publishedPages);
      mockPageRepository.countAll.mockResolvedValue(publishedPages.length);

      const result = await service.findAll({ ...mockPaginationQuery, status: 'PUBLISHED' });

      expect(result.data.every((p) => p.status === 'PUBLISHED')).toBe(true);
    });

    it('should filter pages by template', async () => {
      const homePages = allMockPages.filter((p) => p.template === 'HOME');
      mockPageRepository.findAll.mockResolvedValue(homePages);
      mockPageRepository.countAll.mockResolvedValue(homePages.length);

      await service.findAll({ ...mockPaginationQuery, template: 'HOME' });

      expect(mockPageRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ template: 'HOME' }),
      );
    });
  });

  describe('findById', () => {
    it('should return a page by id', async () => {
      mockPageRepository.findById.mockResolvedValue(mockPageHome);

      const result = await service.findById(mockPageHome.id);

      expect(mockPageRepository.findById).toHaveBeenCalledWith(mockPageHome.id);
      expect(result).toEqual(mockPageHome);
    });

    it('should throw NotFoundException when page not found', async () => {
      mockPageRepository.findById.mockResolvedValue(null);

      await expect(service.findById('non-existent-id')).rejects.toThrow();
    });
  });

  describe('findBySlug', () => {
    it('should return a page by slug', async () => {
      mockPageRepository.findBySlug.mockResolvedValue(mockPageHome);

      const result = await service.findBySlug('/');

      expect(mockPageRepository.findBySlug).toHaveBeenCalledWith('/');
      expect(result).toEqual(mockPageHome);
    });

    it('should throw NotFoundException when slug not found', async () => {
      mockPageRepository.findBySlug.mockResolvedValue(null);

      await expect(service.findBySlug('non-existent-slug')).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('should create and return a new page', async () => {
      const newPage = buildMockPage({ ...mockCreatePageDto });
      mockPageRepository.findBySlug.mockResolvedValue(null);
      mockPageRepository.create.mockResolvedValue(newPage);

      const result = await service.create(mockCreatePageDto, mockAdminUser.id);

      expect(mockPageRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ createdById: mockAdminUser.id }),
      );
      expect(result).toEqual(newPage);
    });

    it('should throw ConflictException if slug already exists', async () => {
      mockPageRepository.findBySlug.mockResolvedValue(mockPageHome);

      await expect(service.create(mockCreatePageDto, mockAdminUser.id)).rejects.toThrow();
    });

    it('should not allow creating duplicate system pages', async () => {
      const systemPageDto = { ...mockCreatePageDto, isSystem: true, slug: '/' };
      mockPageRepository.findBySlug.mockResolvedValue(mockPageHome);

      await expect(service.create(systemPageDto, mockAdminUser.id)).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should update and return the page', async () => {
      const updatedPage = { ...mockPageAboutUs, ...mockUpdatePageDto };
      mockPageRepository.findById.mockResolvedValue(mockPageAboutUs);
      mockPageRepository.update.mockResolvedValue(updatedPage);

      const result = await service.update(mockPageAboutUs.id, mockUpdatePageDto, mockAdminUser.id);

      expect(mockPageRepository.update).toHaveBeenCalledWith(
        mockPageAboutUs.id,
        expect.objectContaining({ updatedById: mockAdminUser.id }),
      );
      expect(result.title).toBe(mockUpdatePageDto.title);
    });

    it('should throw NotFoundException if page not found', async () => {
      mockPageRepository.findById.mockResolvedValue(null);

      await expect(
        service.update('non-existent', mockUpdatePageDto, mockAdminUser.id),
      ).rejects.toThrow();
    });

    it('should throw ConflictException if new slug already taken by another page', async () => {
      mockPageRepository.findById.mockResolvedValue(mockPageAboutUs);
      mockPageRepository.findBySlug.mockResolvedValue(mockPageHome);

      await expect(
        service.update(mockPageAboutUs.id, { slug: '/' }, mockAdminUser.id),
      ).rejects.toThrow();
    });
  });

  describe('publish', () => {
    it('should publish a draft page', async () => {
      const draftPage = buildMockPage({ status: 'DRAFT' });
      const publishedPage = { ...draftPage, status: 'PUBLISHED', publishedAt: new Date() };
      mockPageRepository.findById.mockResolvedValue(draftPage);
      mockPageRepository.publish.mockResolvedValue(publishedPage);

      const result = await service.publish(draftPage.id, mockAdminUser.id);

      expect(result.status).toBe('PUBLISHED');
      expect(result.publishedAt).toBeDefined();
    });

    it('should not publish an already published page', async () => {
      mockPageRepository.findById.mockResolvedValue(mockPageHome);

      await expect(service.publish(mockPageHome.id, mockAdminUser.id)).rejects.toThrow();
    });
  });

  describe('softDelete', () => {
    it('should soft delete a non-system page', async () => {
      const nonSystemPage = buildMockPage({ isSystem: false });
      mockPageRepository.findById.mockResolvedValue(nonSystemPage);
      mockPageRepository.softDelete.mockResolvedValue({ ...nonSystemPage, deletedAt: new Date() });

      await service.softDelete(nonSystemPage.id, mockAdminUser.id);

      expect(mockPageRepository.softDelete).toHaveBeenCalledWith(nonSystemPage.id, mockAdminUser.id);
    });

    it('should throw ForbiddenException when trying to delete a system page', async () => {
      mockPageRepository.findById.mockResolvedValue(mockPageHome);

      await expect(service.softDelete(mockPageHome.id, mockAdminUser.id)).rejects.toThrow();
    });

    it('should throw NotFoundException if page not found', async () => {
      mockPageRepository.findById.mockResolvedValue(null);

      await expect(service.softDelete('non-existent', mockAdminUser.id)).rejects.toThrow();
    });
  });

  describe('findByTemplate', () => {
    it('should return pages by template type', async () => {
      const financePages = allMockPages.filter((p) => p.template === 'FINANCE');
      mockPageRepository.findByTemplate.mockResolvedValue(financePages);

      const result = await service.findByTemplate('FINANCE');

      expect(mockPageRepository.findByTemplate).toHaveBeenCalledWith('FINANCE');
      expect(result).toEqual(financePages);
    });
  });

  describe('updateSections', () => {
    it('should update page sections', async () => {
      const newSections = [
        { id: 'section-1', type: 'TEXT_CONTENT', order: 1, data: { heading: 'Updated', content: '<p>New</p>' } },
      ];
      const updatedPage = { ...mockPageAboutUs, sections: newSections };
      mockPageRepository.findById.mockResolvedValue(mockPageAboutUs);
      mockPageRepository.update.mockResolvedValue(updatedPage);

      const result = await service.update(
        mockPageAboutUs.id,
        { sections: newSections as never },
        mockAdminUser.id,
      );

      expect(result.sections).toEqual(newSections);
    });
  });
});