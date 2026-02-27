import { TagService } from '../../src/app/categories/tag.service';
import { TagRepository } from '../../src/app/categories/tag.repository';
import {
  mockTagModernKitchen,
  mockTagHandleless,
  allMockTags,
  mockCreateTagDto,
  mockUpdateTagDto,
  buildMockTag,
} from '../fixtures/tags.fixture';
import { mockAdminUser, mockPaginationQuery } from '../fixtures/common.fixture';

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

const mockTagRepository = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findBySlug: jest.fn(),
  findByIds: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
  countAll: jest.fn(),
  findPopular: jest.fn(),
  decrementUsageCount: jest.fn(),
};

describe('TagService', () => {
  let service: TagService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TagService(mockTagRepository as unknown as TagRepository);
  });

  describe('findAll', () => {
    it('should return paginated tags', async () => {
      mockTagRepository.findAll.mockResolvedValue(allMockTags);
      mockTagRepository.countAll.mockResolvedValue(allMockTags.length);

      const result = await service.findAll(mockPaginationQuery);

      expect(result.data).toHaveLength(allMockTags.length);
      expect(result.meta.total).toBe(allMockTags.length);
    });

    it('should support search by name', async () => {
      const filtered = [mockTagModernKitchen];
      mockTagRepository.findAll.mockResolvedValue(filtered);
      mockTagRepository.countAll.mockResolvedValue(1);

      await service.findAll({ ...mockPaginationQuery, search: 'Modern' });

      expect(mockTagRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'Modern' }),
      );
    });
  });

  describe('findById', () => {
    it('should return a tag by id', async () => {
      mockTagRepository.findById.mockResolvedValue(mockTagModernKitchen);

      const result = await service.findById(mockTagModernKitchen.id);

      expect(result).toEqual(mockTagModernKitchen);
    });

    it('should throw NotFoundException when tag not found', async () => {
      mockTagRepository.findById.mockResolvedValue(null);

      await expect(service.findById('no-such-id')).rejects.toThrow();
    });
  });

  describe('findBySlug', () => {
    it('should return a tag by slug', async () => {
      mockTagRepository.findBySlug.mockResolvedValue(mockTagHandleless);

      const result = await service.findBySlug('handleless');

      expect(result).toEqual(mockTagHandleless);
    });

    it('should throw NotFoundException when slug not found', async () => {
      mockTagRepository.findBySlug.mockResolvedValue(null);

      await expect(service.findBySlug('no-such-slug')).rejects.toThrow();
    });
  });

  describe('findPopular', () => {
    it('should return top N tags by usage count', async () => {
      const popular = allMockTags.sort((a, b) => b.usageCount - a.usageCount).slice(0, 5);
      mockTagRepository.findPopular.mockResolvedValue(popular);

      const result = await service.findPopular(5);

      expect(mockTagRepository.findPopular).toHaveBeenCalledWith(5);
      expect(result).toHaveLength(5);
    });

    it('should default limit to 10 if not specified', async () => {
      mockTagRepository.findPopular.mockResolvedValue(allMockTags.slice(0, 10));

      await service.findPopular();

      expect(mockTagRepository.findPopular).toHaveBeenCalledWith(10);
    });
  });

  describe('create', () => {
    it('should create a new tag', async () => {
      const newTag = buildMockTag(mockCreateTagDto);
      mockTagRepository.findBySlug.mockResolvedValue(null);
      mockTagRepository.create.mockResolvedValue(newTag);

      const result = await service.create(mockCreateTagDto, mockAdminUser.id);

      expect(mockTagRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ createdById: mockAdminUser.id }),
      );
      expect(result).toEqual(newTag);
    });

    it('should auto-generate slug from name if not provided', async () => {
      const dto = { name: 'Shaker Style Kitchen', description: null };
      const newTag = buildMockTag({ ...dto, slug: 'shaker-style-kitchen' });
      mockTagRepository.findBySlug.mockResolvedValue(null);
      mockTagRepository.create.mockResolvedValue(newTag);

      const result = await service.create(dto, mockAdminUser.id);

      expect(result.slug).toBe('shaker-style-kitchen');
    });

    it('should throw ConflictException if slug already exists', async () => {
      mockTagRepository.findBySlug.mockResolvedValue(mockTagModernKitchen);

      await expect(service.create(mockCreateTagDto, mockAdminUser.id)).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should update and return the tag', async () => {
      const updated = { ...mockTagHandleless, ...mockUpdateTagDto };
      mockTagRepository.findById.mockResolvedValue(mockTagHandleless);
      mockTagRepository.update.mockResolvedValue(updated);

      const result = await service.update(mockTagHandleless.id, mockUpdateTagDto, mockAdminUser.id);

      expect(result.name).toBe(mockUpdateTagDto.name);
    });

    it('should throw NotFoundException if tag not found', async () => {
      mockTagRepository.findById.mockResolvedValue(null);

      await expect(
        service.update('non-existent', mockUpdateTagDto, mockAdminUser.id),
      ).rejects.toThrow();
    });
  });

  describe('softDelete', () => {
    it('should soft delete a tag', async () => {
      mockTagRepository.findById.mockResolvedValue(mockTagHandleless);
      mockTagRepository.softDelete.mockResolvedValue(undefined);

      await service.softDelete(mockTagHandleless.id, mockAdminUser.id);

      expect(mockTagRepository.softDelete).toHaveBeenCalledWith(mockTagHandleless.id, mockAdminUser.id);
    });

    it('should throw NotFoundException if tag not found', async () => {
      mockTagRepository.findById.mockResolvedValue(null);

      await expect(service.softDelete('non-existent', mockAdminUser.id)).rejects.toThrow();
    });
  });

  describe('findByIds', () => {
    it('should return tags matching the provided ids', async () => {
      const ids = [mockTagModernKitchen.id, mockTagHandleless.id];
      mockTagRepository.findByIds.mockResolvedValue([mockTagModernKitchen, mockTagHandleless]);

      const result = await service.findByIds(ids);

      expect(mockTagRepository.findByIds).toHaveBeenCalledWith(ids);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no ids match', async () => {
      mockTagRepository.findByIds.mockResolvedValue([]);

      const result = await service.findByIds(['non-existent-1', 'non-existent-2']);

      expect(result).toHaveLength(0);
    });
  });
});