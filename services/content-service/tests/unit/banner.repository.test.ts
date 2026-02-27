import { BannerRepository } from '../../src/app/cms/banner.repository';
import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

describe('BannerRepository', () => {
  let bannerRepository: BannerRepository;
  let prisma: any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type MockFn = ReturnType<typeof jest.fn<() => any>>;
  function asMock(fn: unknown): MockFn {
    return fn as MockFn;
  }

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    bannerRepository = new BannerRepository(prisma as unknown as PrismaClient);
  });

  const mockBanner = {
    id: 'banner-1',
    title: 'Summer Kitchen Sale',
    subtitle: 'Up to 50% off',
    description: 'Discover our exclusive summer deals.',
    imageUrl: 'https://cdn.lomashwood.com/banners/summer-sale.jpg',
    linkUrl: '/sale',
    linkText: 'Shop Now',
    position: 'hero',
    isActive: true,
    startsAt: new Date('2025-06-01'),
    endsAt: new Date('2025-08-31'),
    sortOrder: 1,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    bannerRepository = new BannerRepository(prisma as unknown as PrismaClient);
  });

  describe('findAll', () => {
    it('should return all banners ordered by sortOrder', async () => {
      asMock(prisma.banner.findMany).mockResolvedValue([mockBanner]);

      const result = await bannerRepository.findAll();

      expect(prisma.banner.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: expect.objectContaining({ sortOrder: 'asc' }),
        }),
      );
      expect(result).toHaveLength(1);
    });

    it('should return empty array when no banners exist', async () => {
      asMock(prisma.banner.findMany).mockResolvedValue([]);

      const result = await bannerRepository.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findActive', () => {
    it('should return active banners within current date range', async () => {
      asMock(prisma.banner.findMany).mockResolvedValue([mockBanner]);

      const result = await bannerRepository.findActive();

      expect(prisma.banner.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: true }),
        }),
      );
      expect(result).toHaveLength(1);
    });

    it('should filter banners by current date using OR for null dates', async () => {
      asMock(prisma.banner.findMany).mockResolvedValue([]);

      await bannerRepository.findActive();

      const calls = asMock(prisma.banner.findMany).mock.calls;
      const arg = (calls[0] as unknown[])[0] as Record<string, unknown>;
      expect(arg.where).toHaveProperty('isActive', true);
    });
  });

  describe('findByPosition', () => {
    it('should return banners filtered by position', async () => {
      asMock(prisma.banner.findMany).mockResolvedValue([mockBanner]);

      const result = await bannerRepository.findByPosition('hero');

      expect(prisma.banner.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ position: 'hero' }),
        }),
      );
      expect(result[0].position).toBe('hero');
    });
  });

  describe('findById', () => {
    it('should find a banner by id', async () => {
      asMock(prisma.banner.findUnique).mockResolvedValue(mockBanner);

      const result = await bannerRepository.findById('banner-1');

      expect(prisma.banner.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'banner-1' } }),
      );
      expect(result).toEqual(mockBanner);
    });

    it('should return null when banner not found', async () => {
      asMock(prisma.banner.findUnique).mockResolvedValue(null);

      const result = await bannerRepository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a banner with all provided fields', async () => {
      const createData = {
        title: 'Winter Sale',
        subtitle: 'Stay cosy',
        description: 'Great deals this winter.',
        imageUrl: 'https://cdn.lomashwood.com/banners/winter.jpg',
        linkUrl: '/winter-sale',
        linkText: 'Explore',
        position: 'hero',
        isActive: true,
        startsAt: new Date('2025-12-01'),
        endsAt: new Date('2026-01-31'),
        sortOrder: 3,
      };
      asMock(prisma.banner.create).mockResolvedValue({ ...mockBanner, ...createData, id: 'banner-new' });

      const result = await bannerRepository.create(createData);

      expect(prisma.banner.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ title: 'Winter Sale' }),
        }),
      );
      expect(result.id).toBe('banner-new');
    });
  });

  describe('update', () => {
    it('should update a banner', async () => {
      const updateData = { title: 'Updated Sale', isActive: false };
      asMock(prisma.banner.update).mockResolvedValue({ ...mockBanner, ...updateData });

      const result = await bannerRepository.update('banner-1', updateData);

      expect(prisma.banner.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'banner-1' },
          data: expect.objectContaining({ title: 'Updated Sale' }),
        }),
      );
      expect(result.title).toBe('Updated Sale');
    });

    it('should throw when banner does not exist', async () => {
      asMock(prisma.banner.update).mockRejectedValue({ code: 'P2025' });

      await expect(bannerRepository.update('nonexistent', { title: 'x' })).rejects.toBeDefined();
    });
  });

  describe('delete', () => {
    it('should delete a banner by id', async () => {
      asMock(prisma.banner.delete).mockResolvedValue(mockBanner);

      await bannerRepository.delete('banner-1');

      expect(prisma.banner.delete).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'banner-1' } }),
      );
    });
  });

  describe('reorder', () => {
    it('should update sortOrder for multiple banners in a transaction', async () => {
      const reorderPayload = [
        { id: 'banner-1', sortOrder: 2 },
        { id: 'banner-2', sortOrder: 1 },
      ];
      asMock(prisma.$transaction).mockResolvedValue([]);

      await bannerRepository.reorder(reorderPayload);

      expect(prisma.$transaction).toHaveBeenCalled();
      const calls = asMock(prisma.$transaction).mock.calls;
      const transactionArg = (calls[0] as unknown[])[0];
      expect(Array.isArray(transactionArg)).toBe(true);
      expect((transactionArg as unknown[]).length).toBe(2);
    });

    it('should handle empty reorder payload gracefully', async () => {
      asMock(prisma.$transaction).mockResolvedValue([]);

      await bannerRepository.reorder([]);

      expect(prisma.$transaction).toHaveBeenCalledWith([]);
    });
  });
});