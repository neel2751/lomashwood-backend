import { BannerService } from '../../src/app/cms/banner.service';
import { BannerRepository } from '../../src/app/cms/banner.repository';
import { AppError } from '../../src/shared/errors';
import { CreateBannerDto, UpdateBannerDto } from '../../src/app/cms/banner.types';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/app/cms/banner.repository');

describe('BannerService', () => {
  let bannerService: BannerService;
  let repositoryInstance: jest.Mocked<BannerRepository>;

  const mockBanner = {
    id: 'banner-1',
    title: 'Summer Kitchen Sale',
    subtitle: 'Up to 50% off',
    description: 'Discover our exclusive summer deals on kitchens and bedrooms.',
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
    jest.clearAllMocks();
    const MockedRepo = BannerRepository as jest.MockedClass<typeof BannerRepository>;
    MockedRepo.mockClear();
    repositoryInstance = new MockedRepo({} as never) as jest.Mocked<BannerRepository>;
    bannerService = new BannerService(repositoryInstance);
  });

  describe('findAll', () => {
    it('should return all banners', async () => {
      repositoryInstance.findAll.mockResolvedValue([mockBanner]);

      const result = await bannerService.findAll();

      expect(repositoryInstance.findAll).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('banner-1');
    });

    it('should return empty array when no banners exist', async () => {
      repositoryInstance.findAll.mockResolvedValue([]);

      const result = await bannerService.findAll();

      expect(result).toEqual([]);
    });

    it('should propagate repository errors', async () => {
      repositoryInstance.findAll.mockRejectedValue(new Error('Database error'));

      await expect(bannerService.findAll()).rejects.toThrow('Database error');
    });
  });

  describe('findActive', () => {
    it('should return only active banners within date range', async () => {
      repositoryInstance.findActive.mockResolvedValue([mockBanner]);

      const result = await bannerService.findActive();

      expect(repositoryInstance.findActive).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].isActive).toBe(true);
    });

    it('should return empty array when no active banners exist', async () => {
      repositoryInstance.findActive.mockResolvedValue([]);

      const result = await bannerService.findActive();

      expect(result).toEqual([]);
    });
  });

  describe('findByPosition', () => {
    it('should return banners by position', async () => {
      repositoryInstance.findByPosition.mockResolvedValue([mockBanner]);

      const result = await bannerService.findByPosition('hero');

      expect(repositoryInstance.findByPosition).toHaveBeenCalledWith('hero');
      expect(result).toHaveLength(1);
      expect(result[0].position).toBe('hero');
    });

    it('should return empty array for position with no banners', async () => {
      repositoryInstance.findByPosition.mockResolvedValue([]);

      const result = await bannerService.findByPosition('sidebar');

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should return a banner by id', async () => {
      repositoryInstance.findById.mockResolvedValue(mockBanner);

      const result = await bannerService.findById('banner-1');

      expect(repositoryInstance.findById).toHaveBeenCalledWith('banner-1');
      expect(result.id).toBe('banner-1');
    });

    it('should throw AppError when banner not found', async () => {
      repositoryInstance.findById.mockResolvedValue(null);

      await expect(bannerService.findById('nonexistent')).rejects.toThrow(AppError);
      await expect(bannerService.findById('nonexistent')).rejects.toMatchObject({
        statusCode: 404,
        message: 'Banner not found',
      });
    });
  });

  describe('create', () => {
    const createDto: CreateBannerDto = {
      title: 'New Year Sale',
      subtitle: 'Start fresh',
      description: 'New year, new kitchen.',
      imageUrl: 'https://cdn.lomashwood.com/banners/new-year.jpg',
      linkUrl: '/sale',
      linkText: 'Explore Deals',
      position: 'hero',
      isActive: true,
      startsAt: new Date('2026-01-01'),
      endsAt: new Date('2026-01-31'),
      sortOrder: 2,
    };

    it('should create and return a new banner', async () => {
      const createdBanner = { ...mockBanner, ...createDto, id: 'banner-2' };
      repositoryInstance.create.mockResolvedValue(createdBanner);

      const result = await bannerService.create(createDto);

      expect(repositoryInstance.create).toHaveBeenCalledWith(createDto);
      expect(result.title).toBe('New Year Sale');
    });

    it('should throw AppError when endsAt is before startsAt', async () => {
      const invalidDto: CreateBannerDto = {
        ...createDto,
        startsAt: new Date('2026-01-31'),
        endsAt: new Date('2026-01-01'),
      };

      await expect(bannerService.create(invalidDto)).rejects.toThrow(AppError);
      await expect(bannerService.create(invalidDto)).rejects.toMatchObject({
        statusCode: 400,
        message: 'End date must be after start date',
      });
      expect(repositoryInstance.create).not.toHaveBeenCalled();
    });

    it('should allow creating banner without date range', async () => {
      const dtoNoDates: CreateBannerDto = {
        ...createDto,
        startsAt: undefined,
        endsAt: undefined,
      };
      const createdBanner = {
        ...mockBanner,
        ...dtoNoDates,
        id: 'banner-3',
        startsAt: null,
        endsAt: null,
      };
      repositoryInstance.create.mockResolvedValue(createdBanner);

      const result = await bannerService.create(dtoNoDates);

      expect(result.startsAt).toBeNull();
    });
  });

  describe('update', () => {
    const updateDto: UpdateBannerDto = {
      title: 'Updated Banner Title',
      isActive: false,
    };

    it('should update and return the banner', async () => {
      const updatedBanner = { ...mockBanner, ...updateDto };
      repositoryInstance.findById.mockResolvedValue(mockBanner);
      repositoryInstance.update.mockResolvedValue(updatedBanner);

      const result = await bannerService.update('banner-1', updateDto);

      expect(repositoryInstance.findById).toHaveBeenCalledWith('banner-1');
      expect(repositoryInstance.update).toHaveBeenCalledWith('banner-1', updateDto);
      expect(result.title).toBe('Updated Banner Title');
      expect(result.isActive).toBe(false);
    });

    it('should throw AppError when banner not found', async () => {
      repositoryInstance.findById.mockResolvedValue(null);

      await expect(bannerService.update('nonexistent', updateDto)).rejects.toThrow(AppError);
      expect(repositoryInstance.update).not.toHaveBeenCalled();
    });

    it('should throw AppError on invalid date range update', async () => {
      const invalidUpdate: UpdateBannerDto = {
        endsAt: new Date('2024-01-01'),
        startsAt: new Date('2025-01-01'),
      };
      repositoryInstance.findById.mockResolvedValue(mockBanner);

      await expect(bannerService.update('banner-1', invalidUpdate)).rejects.toThrow(AppError);
      await expect(bannerService.update('banner-1', invalidUpdate)).rejects.toMatchObject({
        statusCode: 400,
      });
    });
  });

  describe('delete', () => {
    it('should delete the banner', async () => {
      repositoryInstance.findById.mockResolvedValue(mockBanner);
      repositoryInstance.delete.mockResolvedValue(undefined);

      await bannerService.delete('banner-1');

      expect(repositoryInstance.delete).toHaveBeenCalledWith('banner-1');
    });

    it('should throw AppError when banner not found', async () => {
      repositoryInstance.findById.mockResolvedValue(null);

      await expect(bannerService.delete('nonexistent')).rejects.toThrow(AppError);
      expect(repositoryInstance.delete).not.toHaveBeenCalled();
    });
  });

  describe('reorder', () => {
    it('should reorder banners within a position', async () => {
      const reorderPayload = [
        { id: 'banner-1', sortOrder: 2 },
        { id: 'banner-2', sortOrder: 1 },
      ];
      repositoryInstance.reorder.mockResolvedValue(undefined);

      await bannerService.reorder(reorderPayload);

      expect(repositoryInstance.reorder).toHaveBeenCalledWith(reorderPayload);
    });

    it('should throw AppError on empty payload', async () => {
      await expect(bannerService.reorder([])).rejects.toThrow(AppError);
      await expect(bannerService.reorder([])).rejects.toMatchObject({
        statusCode: 400,
        message: 'Reorder payload cannot be empty',
      });
    });
  });

  describe('toggleActive', () => {
    it('should toggle banner active state', async () => {
      const inactiveBanner = { ...mockBanner, isActive: false };
      repositoryInstance.findById.mockResolvedValue(mockBanner);
      repositoryInstance.update.mockResolvedValue(inactiveBanner);

      const result = await bannerService.toggleActive('banner-1');

      expect(repositoryInstance.update).toHaveBeenCalledWith('banner-1', { isActive: false });
      expect(result.isActive).toBe(false);
    });

    it('should throw AppError when banner not found', async () => {
      repositoryInstance.findById.mockResolvedValue(null);

      await expect(bannerService.toggleActive('nonexistent')).rejects.toThrow(AppError);
    });
  });
});