import { TagRepository } from '../../src/app/categories/tag.repository';
import { PrismaClient } from '@prisma/client';
import {
  mockTagModernKitchen,
  mockTagHandleless,
  allMockTags,
  mockCreateTagDto,
  buildMockTag,
} from '../fixtures/tags.fixture';
import { mockAdminUser, mockPaginationQuery } from '../fixtures/common.fixture';

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

const mockPrisma = {
  tag: {
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

describe('TagRepository', () => {
  let repository: TagRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new TagRepository(mockPrisma as unknown as PrismaClient);
  });

  describe('findAll', () => {
    it('should return non-deleted tags with default pagination', async () => {
      mockPrisma.tag.findMany.mockResolvedValue(allMockTags);

      const result = await repository.findAll(mockPaginationQuery);

      expect(mockPrisma.tag.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ deletedAt: null }),
          skip: 0,
          take: mockPaginationQuery.perPage,
        }),
      );
      expect(result).toHaveLength(allMockTags.length);
    });

    it('should apply search filter on name', async () => {
      mockPrisma.tag.findMany.mockResolvedValue([mockTagModernKitchen]);

      await repository.findAll({ ...mockPaginationQuery, search: 'Modern' });

      expect(mockPrisma.tag.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: expect.objectContaining({ contains: 'Modern' }),
          }),
        }),
      );
    });

    it('should order by usageCount descending', async () => {
      mockPrisma.tag.findMany.mockResolvedValue(allMockTags);

      await repository.findAll(mockPaginationQuery);

      expect(mockPrisma.tag.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: expect.objectContaining({ usageCount: 'desc' }),
        }),
      );
    });

    it('should apply correct skip for page 2', async () => {
      mockPrisma.tag.findMany.mockResolvedValue([]);

      await repository.findAll({ page: 2, perPage: 5 });

      expect(mockPrisma.tag.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 5, take: 5 }),
      );
    });
  });

  describe('findById', () => {
    it('should return tag by id', async () => {
      mockPrisma.tag.findUnique.mockResolvedValue(mockTagModernKitchen);

      const result = await repository.findById(mockTagModernKitchen.id);

      expect(result).toEqual(mockTagModernKitchen);
    });

    it('should return null when not found', async () => {
      mockPrisma.tag.findUnique.mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findBySlug', () => {
    it('should return tag by slug', async () => {
      mockPrisma.tag.findFirst.mockResolvedValue(mockTagHandleless);

      const result = await repository.findBySlug('handleless');

      expect(mockPrisma.tag.findFirst).toHaveBeenCalledWith({
        where: { slug: 'handleless', deletedAt: null },
      });
      expect(result).toEqual(mockTagHandleless);
    });
  });

  describe('findByIds', () => {
    it('should return tags matching array of ids', async () => {
      const ids = [mockTagModernKitchen.id, mockTagHandleless.id];
      mockPrisma.tag.findMany.mockResolvedValue([mockTagModernKitchen, mockTagHandleless]);

      const result = await repository.findByIds(ids);

      expect(mockPrisma.tag.findMany).toHaveBeenCalledWith({
        where: { id: { in: ids }, deletedAt: null },
      });
      expect(result).toHaveLength(2);
    });

    it('should return empty array for empty ids input', async () => {
      const result = await repository.findByIds([]);

      expect(result).toHaveLength(0);
      expect(mockPrisma.tag.findMany).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a tag', async () => {
      const newTag = buildMockTag(mockCreateTagDto);
      mockPrisma.tag.create.mockResolvedValue(newTag);

      const payload = { ...mockCreateTagDto, createdById: mockAdminUser.id, updatedById: mockAdminUser.id };
      const result = await repository.create(payload);

      expect(mockPrisma.tag.create).toHaveBeenCalledWith({ data: payload });
      expect(result).toEqual(newTag);
    });
  });

  describe('update', () => {
    it('should update a tag', async () => {
      const updated = { ...mockTagHandleless, name: 'Updated Tag Name' };
      mockPrisma.tag.update.mockResolvedValue(updated);

      const result = await repository.update(mockTagHandleless.id, { name: 'Updated Tag Name' });

      expect(mockPrisma.tag.update).toHaveBeenCalledWith({
        where: { id: mockTagHandleless.id },
        data: { name: 'Updated Tag Name' },
      });
      expect(result.name).toBe('Updated Tag Name');
    });
  });

  describe('softDelete', () => {
    it('should set deletedAt on soft delete', async () => {
      const deleted = { ...mockTagHandleless, deletedAt: new Date() };
      mockPrisma.tag.update.mockResolvedValue(deleted);

      await repository.softDelete(mockTagHandleless.id, mockAdminUser.id);

      expect(mockPrisma.tag.update).toHaveBeenCalledWith({
        where: { id: mockTagHandleless.id },
        data: expect.objectContaining({
          deletedAt: expect.any(Date),
          updatedById: mockAdminUser.id,
        }),
      });
    });
  });

  describe('countAll', () => {
    it('should return total count excluding deleted tags', async () => {
      mockPrisma.tag.count.mockResolvedValue(allMockTags.length);

      const result = await repository.countAll({});

      expect(result).toBe(allMockTags.length);
    });
  });

  describe('findPopular', () => {
    it('should return top N tags sorted by usage count descending', async () => {
      const sorted = [...allMockTags].sort((a, b) => b.usageCount - a.usageCount).slice(0, 5);
      mockPrisma.tag.findMany.mockResolvedValue(sorted);

      const result = await repository.findPopular(5);

      expect(mockPrisma.tag.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        orderBy: { usageCount: 'desc' },
        take: 5,
      });
      expect(result).toHaveLength(5);
    });
  });

  describe('decrementUsageCount', () => {
    it('should decrement tag usage count by 1', async () => {
      mockPrisma.tag.update.mockResolvedValue({ ...mockTagModernKitchen, usageCount: 41 });

      await repository.decrementUsageCount(mockTagModernKitchen.id);

      expect(mockPrisma.tag.update).toHaveBeenCalledWith({
        where: { id: mockTagModernKitchen.id },
        data: { usageCount: { decrement: 1 } },
      });
    });
  });
});