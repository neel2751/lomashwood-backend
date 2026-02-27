import { SeoService } from '../../src/app/seo/seo.service';
import { SeoRepository } from '../../src/app/seo/seo.repository';
import {
  mockSeoHomePage,
  mockSeoAboutPage,
  mockSeoFinancePage,
  allMockSeoRecords,
  mockGlobalSeoSettings,
  mockCreateSeoDto,
  mockUpdateSeoDto,
  buildMockSeoRecord,
} from '../fixtures/seo.fixture';
import { mockAdminUser, mockPaginationQuery, generateId } from '../fixtures/common.fixture';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

const mockSeoRepository = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findByEntity: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  upsertByEntity: jest.fn(),
  delete: jest.fn(),
  findGlobalSettings: jest.fn(),
  updateGlobalSettings: jest.fn(),
  countAll: jest.fn(),
};

describe('SeoService', () => {
  let service: SeoService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SeoService(mockSeoRepository as unknown as SeoRepository);
  });

  describe('findAll', () => {
    it('should return paginated SEO records', async () => {
      mockSeoRepository.findAll.mockResolvedValue(allMockSeoRecords);
      mockSeoRepository.countAll.mockResolvedValue(allMockSeoRecords.length);

      const result = await service.findAll(mockPaginationQuery);

      expect(result.data).toHaveLength(allMockSeoRecords.length);
      expect(result.meta.total).toBe(allMockSeoRecords.length);
    });

    it('should filter by entityType PAGE', async () => {
      const pageRecords = allMockSeoRecords.filter((s) => s.entityType === 'PAGE');
      mockSeoRepository.findAll.mockResolvedValue(pageRecords);
      mockSeoRepository.countAll.mockResolvedValue(pageRecords.length);

      const result = await service.findAll({ ...mockPaginationQuery, entityType: 'PAGE' });

      expect(result.data.every((s) => s.entityType === 'PAGE')).toBe(true);
    });
  });

  describe('findByEntity', () => {
    it('should return SEO record for a given entity', async () => {
      mockSeoRepository.findByEntity.mockResolvedValue(mockSeoHomePage);

      const result = await service.findByEntity('PAGE', mockSeoHomePage.entityId);

      expect(mockSeoRepository.findByEntity).toHaveBeenCalledWith('PAGE', mockSeoHomePage.entityId);
      expect(result).toEqual(mockSeoHomePage);
    });

    it('should return null when no SEO record exists for entity', async () => {
      mockSeoRepository.findByEntity.mockResolvedValue(null);

      const result = await service.findByEntity('PAGE', 'no-seo-page-id');

      expect(result).toBeNull();
    });
  });

  describe('upsertByEntity', () => {
    it('should create SEO record when none exists', async () => {
      const newRecord = buildMockSeoRecord(mockCreateSeoDto);
      mockSeoRepository.findByEntity.mockResolvedValue(null);
      mockSeoRepository.upsertByEntity.mockResolvedValue(newRecord);

      const result = await service.upsertByEntity(mockCreateSeoDto, mockAdminUser.id);

      expect(mockSeoRepository.upsertByEntity).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: mockCreateSeoDto.entityType,
          entityId: mockCreateSeoDto.entityId,
          createdById: mockAdminUser.id,
        }),
      );
      expect(result).toEqual(newRecord);
    });

    it('should update existing SEO record when one exists', async () => {
      const updated = { ...mockSeoAboutPage, ...mockUpdateSeoDto };
      mockSeoRepository.findByEntity.mockResolvedValue(mockSeoAboutPage);
      mockSeoRepository.upsertByEntity.mockResolvedValue(updated);

      const result = await service.upsertByEntity(
        { ...mockUpdateSeoDto, entityType: 'PAGE', entityId: mockSeoAboutPage.entityId },
        mockAdminUser.id,
      );

      expect(result.metaTitle).toBe(mockUpdateSeoDto.metaTitle);
    });
  });

  describe('update', () => {
    it('should update SEO fields of an existing record', async () => {
      const updated = { ...mockSeoAboutPage, ...mockUpdateSeoDto };
      mockSeoRepository.findById.mockResolvedValue(mockSeoAboutPage);
      mockSeoRepository.update.mockResolvedValue(updated);

      const result = await service.update(mockSeoAboutPage.id, mockUpdateSeoDto, mockAdminUser.id);

      expect(mockSeoRepository.update).toHaveBeenCalledWith(
        mockSeoAboutPage.id,
        expect.objectContaining({ updatedById: mockAdminUser.id }),
      );
      expect(result.metaTitle).toBe(mockUpdateSeoDto.metaTitle);
    });

    it('should throw NotFoundException when SEO record not found', async () => {
      mockSeoRepository.findById.mockResolvedValue(null);

      await expect(
        service.update('non-existent', mockUpdateSeoDto, mockAdminUser.id),
      ).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete a SEO record', async () => {
      mockSeoRepository.findById.mockResolvedValue(mockSeoFinancePage);
      mockSeoRepository.delete.mockResolvedValue(undefined);

      await service.delete(mockSeoFinancePage.id, mockAdminUser.id);

      expect(mockSeoRepository.delete).toHaveBeenCalledWith(mockSeoFinancePage.id);
    });

    it('should throw NotFoundException when SEO record not found', async () => {
      mockSeoRepository.findById.mockResolvedValue(null);

      await expect(service.delete('non-existent', mockAdminUser.id)).rejects.toThrow();
    });
  });

  describe('generateStructuredData', () => {
    it('should generate schema.org structured data for a PAGE entity', async () => {
      mockSeoRepository.findByEntity.mockResolvedValue(mockSeoHomePage);

      const result = await service.generateStructuredData('PAGE', mockSeoHomePage.entityId);

      expect(result).toHaveProperty('@context', 'https://schema.org');
      expect(result).toHaveProperty('@type');
    });

    it('should return null if no SEO record found', async () => {
      mockSeoRepository.findByEntity.mockResolvedValue(null);

      const result = await service.generateStructuredData('PAGE', 'no-page-id');

      expect(result).toBeNull();
    });
  });

  describe('getGlobalSettings', () => {
    it('should return global SEO settings', async () => {
      mockSeoRepository.findGlobalSettings.mockResolvedValue(mockGlobalSeoSettings);

      const result = await service.getGlobalSettings();

      expect(mockSeoRepository.findGlobalSettings).toHaveBeenCalled();
      expect(result).toEqual(mockGlobalSeoSettings);
    });
  });

  describe('updateGlobalSettings', () => {
    it('should update global SEO settings', async () => {
      const updates = { googleTagManagerId: 'GTM-NEWVALUE' };
      const updated = { ...mockGlobalSeoSettings, ...updates };
      mockSeoRepository.updateGlobalSettings.mockResolvedValue(updated);

      const result = await service.updateGlobalSettings(updates, mockAdminUser.id);

      expect(mockSeoRepository.updateGlobalSettings).toHaveBeenCalledWith(
        expect.objectContaining({ ...updates, updatedById: mockAdminUser.id }),
      );
      expect(result.googleTagManagerId).toBe('GTM-NEWVALUE');
    });
  });

  describe('generateSitemap', () => {
    it('should return a list of sitemap entries for published content', async () => {
      mockSeoRepository.findAll.mockResolvedValue(allMockSeoRecords);

      const result = await service.generateSitemap();

      expect(Array.isArray(result)).toBe(true);
      result.forEach((entry) => {
        expect(entry).toHaveProperty('url');
        expect(entry).toHaveProperty('lastmod');
        expect(entry).toHaveProperty('changefreq');
        expect(entry).toHaveProperty('priority');
      });
    });
  });

  describe('generateRobotsTxt', () => {
    it('should return a robots.txt string', async () => {
      mockSeoRepository.findGlobalSettings.mockResolvedValue(mockGlobalSeoSettings);

      const result = await service.generateRobotsTxt();

      expect(typeof result).toBe('string');
      expect(result).toContain('User-agent:');
      expect(result).toContain('Sitemap:');
    });
  });

  describe('validateSeoHealth', () => {
    it('should return health report for SEO record', async () => {
      mockSeoRepository.findById.mockResolvedValue(mockSeoHomePage);

      const result = await service.validateSeoHealth(mockSeoHomePage.id);

      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('issues');
      expect(result).toHaveProperty('recommendations');
      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should flag missing metaDescription as an issue', async () => {
      const recordWithoutMeta = buildMockSeoRecord({ metaDescription: null });
      mockSeoRepository.findById.mockResolvedValue(recordWithoutMeta);

      const result = await service.validateSeoHealth(recordWithoutMeta.id);

      expect(result.issues.some((i: string) => i.toLowerCase().includes('meta'))).toBe(true);
    });

    it('should flag noIndex pages with a warning', async () => {
      const noIndexRecord = buildMockSeoRecord({ noIndex: true, metaTitle: 'Test', metaDescription: 'Test description for no index page that is long enough.' });
      mockSeoRepository.findById.mockResolvedValue(noIndexRecord);

      const result = await service.validateSeoHealth(noIndexRecord.id);

      expect(
        result.issues.some((i: string) => i.toLowerCase().includes('noindex')) ||
        result.recommendations.some((r: string) => r.toLowerCase().includes('index')),
      ).toBe(true);
    });

    it('should throw NotFoundException if record not found', async () => {
      mockSeoRepository.findById.mockResolvedValue(null);

      await expect(service.validateSeoHealth('non-existent')).rejects.toThrow();
    });
  });
});