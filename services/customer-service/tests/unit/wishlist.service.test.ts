import { WishlistService } from '../../src/app/wishlist/wishlist.service';
import { WishlistRepository } from '../../src/app/wishlist/wishlist.repository';
import { AppError } from '../../src/shared/errors';

jest.mock('../../src/app/wishlist/wishlist.repository');

const mockRepository = {
  findByCustomerId: jest.fn(),
  findItemByProductId: jest.fn(),
  addItem: jest.fn(),
  removeItem: jest.fn(),
  clearWishlist: jest.fn(),
  itemExists: jest.fn(),
};

describe('WishlistService', () => {
  let service: WishlistService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new WishlistService(mockRepository as unknown as WishlistRepository);
  });

  describe('getWishlist', () => {
    it('should return wishlist items for customer', async () => {
      const items = [
        { id: 'wi-1', customerId: 'cust-1', productId: 'prod-1', addedAt: new Date(), product: { id: 'prod-1', title: 'Luna White Kitchen' } },
        { id: 'wi-2', customerId: 'cust-1', productId: 'prod-2', addedAt: new Date(), product: { id: 'prod-2', title: 'Oslo Bedroom' } },
      ];
      mockRepository.findByCustomerId.mockResolvedValue(items);

      const result = await service.getWishlist('cust-1');

      expect(result).toHaveLength(2);
      expect(mockRepository.findByCustomerId).toHaveBeenCalledWith('cust-1');
    });

    it('should return empty array when wishlist is empty', async () => {
      mockRepository.findByCustomerId.mockResolvedValue([]);

      const result = await service.getWishlist('cust-empty');

      expect(result).toEqual([]);
    });
  });

  describe('addItem', () => {
    it('should add product to wishlist', async () => {
      const item = { id: 'wi-3', customerId: 'cust-1', productId: 'prod-3', addedAt: new Date() };
      mockRepository.itemExists.mockResolvedValue(false);
      mockRepository.addItem.mockResolvedValue(item);

      const result = await service.addItem('cust-1', 'prod-3');

      expect(result).toEqual(item);
      expect(mockRepository.addItem).toHaveBeenCalledWith('cust-1', 'prod-3');
    });

    it('should throw AppError 409 when product already in wishlist', async () => {
      mockRepository.itemExists.mockResolvedValue(true);

      await expect(service.addItem('cust-1', 'prod-already')).rejects.toThrow(AppError);
      await expect(service.addItem('cust-1', 'prod-already')).rejects.toMatchObject({ statusCode: 409 });
    });
  });

  describe('removeItem', () => {
    it('should remove product from wishlist', async () => {
      mockRepository.itemExists.mockResolvedValue(true);
      mockRepository.removeItem.mockResolvedValue({ id: 'wi-1' });

      await service.removeItem('cust-1', 'prod-1');

      expect(mockRepository.removeItem).toHaveBeenCalledWith('cust-1', 'prod-1');
    });

    it('should throw AppError 404 when item not in wishlist', async () => {
      mockRepository.itemExists.mockResolvedValue(false);

      await expect(service.removeItem('cust-1', 'prod-not-in-list')).rejects.toThrow(AppError);
      await expect(service.removeItem('cust-1', 'prod-not-in-list')).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('clearWishlist', () => {
    it('should clear all items from wishlist', async () => {
      mockRepository.clearWishlist.mockResolvedValue({ count: 3 });

      await service.clearWishlist('cust-1');

      expect(mockRepository.clearWishlist).toHaveBeenCalledWith('cust-1');
    });
  });

  describe('isInWishlist', () => {
    it('should return true when product is in wishlist', async () => {
      mockRepository.itemExists.mockResolvedValue(true);

      const result = await service.isInWishlist('cust-1', 'prod-1');

      expect(result).toBe(true);
    });

    it('should return false when product is not in wishlist', async () => {
      mockRepository.itemExists.mockResolvedValue(false);

      const result = await service.isInWishlist('cust-1', 'prod-999');

      expect(result).toBe(false);
    });
  });
});