import { MediaRepository } from '../../src/app/media-wall/media.repository';
import { PrismaClient } from '@prisma/client';
import {
  mockMediaHeroImage1,
  mockMediaWallVideo1,
  allMockMedia,
  buildMockMedia,
} from '../fixtures/media.fixture';
import { mockAdminUser, mockPaginationQuery } from '../fixtures/common.fixture';

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

const mockPrisma = {
  media: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
};

jest.mock('../../src/infrastructure/db/prisma.client', () => ({
  getPrismaClient: () => mockPrisma,
}));

describe('MediaRepository', () => {
  let repository: MediaRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new MediaRepository(mockPrisma as unknown as PrismaClient);
  });

  describe('findAll', () => {
    it('should return all non-deleted media items', async () => {
      mockPrisma.media.findMany.mockResolvedValue(allMockMedia);

      const result = await repository.findAll(mockPaginationQuery);

      expect(mockPrisma.media.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ deletedAt: null }),
          skip: 0,
          take: mockPaginationQuery.perPage,
        }),
      );
      expect(result).toHaveLength(allMockMedia.length);
    });

    it('should filter by type', async () => {
      const images = allMockMedia.filter((m) => m.type === 'IMAGE');
      mockPrisma.media.findMany.mockResolvedValue(images);

      await repository.findAll({ ...mockPaginationQuery, type: 'IMAGE' });

      expect(mockPrisma.media.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'IMAGE', deletedAt: null }),
        }),
      );
    });

    it('should filter by folder', async () => {
      const heroMedia = allMockMedia.filter((m) => m.folder === 'hero');
      mockPrisma.media.findMany.mockResolvedValue(heroMedia);

      await repository.findAll({ ...mockPaginationQuery, folder: 'hero' });

      expect(mockPrisma.media.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ folder: 'hero' }),
        }),
      );
    });

    it('should filter by status', async () => {
      const active = allMockMedia.filter((m) => m.status === 'ACTIVE');
      mockPrisma.media.findMany.mockResolvedValue(active);

      await repository.findAll({ ...mockPaginationQuery, status: 'ACTIVE' });

      expect(mockPrisma.media.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'ACTIVE' }),
        }),
      );
    });

    it('should search by originalName', async () => {
      mockPrisma.media.findMany.mockResolvedValue([mockMediaHeroImage1]);

      await repository.findAll({ ...mockPaginationQuery, search: 'hero-kitchen' });

      expect(mockPrisma.media.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            originalName: expect.objectContaining({ contains: 'hero-kitchen' }),
          }),
        }),
      );
    });

    it('should order by createdAt descending by default', async () => {
      mockPrisma.media.findMany.mockResolvedValue(allMockMedia);

      await repository.findAll(mockPaginationQuery);

      expect(mockPrisma.media.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: expect.objectContaining({ createdAt: 'desc' }),
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return media by id', async () => {
      mockPrisma.media.findUnique.mockResolvedValue(mockMediaHeroImage1);

      const result = await repository.findById(mockMediaHeroImage1.id);

      expect(mockPrisma.media.findUnique).toHaveBeenCalledWith({
        where: { id: mockMediaHeroImage1.id, deletedAt: null },
      });
      expect(result).toEqual(mockMediaHeroImage1);
    });

    it('should return null when not found', async () => {
      mockPrisma.media.findUnique.mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create and return a media record', async () => {
      const newMedia = buildMockMedia();
      mockPrisma.media.create.mockResolvedValue(newMedia);

      const payload = {
        type: 'IMAGE' as const,
        status: 'ACTIVE' as const,
        originalName: 'test.jpg',
        filename: 'test-123.jpg',
        mimeType: 'image/jpeg',
        size: 500000,
        width: 800,
        height: 600,
        duration: null,
        url: 'https://cdn.lomashwood.com/images/test-123.jpg',
        thumbnailUrl: null,
        altText: null,
        caption: null,
        folder: 'test',
        tags: [],
        metadata: {},
        createdById: mockAdminUser.id,
        updatedById: mockAdminUser.id,
      };

      const result = await repository.create(payload);

      expect(mockPrisma.media.create).toHaveBeenCalledWith({ data: payload });
      expect(result).toEqual(newMedia);
    });
  });

  describe('update', () => {
    it('should update and return the media item', async () => {
      const updated = { ...mockMediaHeroImage1, altText: 'Updated alt text' };
      mockPrisma.media.update.mockResolvedValue(updated);

      const result = await repository.update(mockMediaHeroImage1.id, { altText: 'Updated alt text' });

      expect(mockPrisma.media.update).toHaveBeenCalledWith({
        where: { id: mockMediaHeroImage1.id },
        data: { altText: 'Updated alt text' },
      });
      expect(result.altText).toBe('Updated alt text');
    });
  });

  describe('softDelete', () => {
    it('should soft delete a media item', async () => {
      const deleted = { ...mockMediaHeroImage1, deletedAt: new Date() };
      mockPrisma.media.update.mockResolvedValue(deleted);

      await repository.softDelete(mockMediaHeroImage1.id, mockAdminUser.id);

      expect(mockPrisma.media.update).toHaveBeenCalledWith({
        where: { id: mockMediaHeroImage1.id },
        data: expect.objectContaining({
          deletedAt: expect.any(Date),
          updatedById: mockAdminUser.id,
        }),
      });
    });
  });

  describe('countAll', () => {
    it('should return count of non-deleted media items', async () => {
      mockPrisma.media.count.mockResolvedValue(allMockMedia.length);

      const result = await repository.countAll({});

      expect(mockPrisma.media.count).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ deletedAt: null }) }),
      );
      expect(result).toBe(allMockMedia.length);
    });
  });

  describe('findByFolder', () => {
    it('should return all active media in a folder', async () => {
      const heroMedia = allMockMedia.filter((m) => m.folder === 'hero');
      mockPrisma.media.findMany.mockResolvedValue(heroMedia);

      const result = await repository.findByFolder('hero');

      expect(mockPrisma.media.findMany).toHaveBeenCalledWith({
        where: { folder: 'hero', deletedAt: null, status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result.every((m) => m.folder === 'hero')).toBe(true);
    });
  });
});