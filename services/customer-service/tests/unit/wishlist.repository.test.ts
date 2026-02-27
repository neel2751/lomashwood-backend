import { WishlistRepository } from '../../src/app/wishlist/wishlist.repository';
import { PrismaClient } from '@prisma/client';

jest.mock('@prisma/client', () => {
  const mockPrisma = {
    wishlistItem: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mockPrisma) };
});

describe('WishlistRepository', () => {
  let repository: WishlistRepository;
  let prisma: PrismaClient;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = new PrismaClient();
    repository = new WishlistRepository(prisma);
  });

  describe('findByCustomerId', () => {
    it('should return wishlist items with product details', async () => {
      const items = [
        { id: 'wi-1', customerId: 'cust-1', productId: 'prod-1', addedAt: new Date(), product: { id: 'prod-1', title: 'Luna White' } },
      ];
      (prisma.wishlistItem.findMany as jest.Mock).mockResolvedValue(items);

      const result = await repository.findByCustomerId('cust-1');

      expect(result).toEqual(items);
      expect(prisma.wishlistItem.findMany).toHaveBeenCalledWith({
        where: { customerId: 'cust-1' },
        include: { product: true },
        orderBy: { addedAt: 'desc' },
      });
    });
  });

  describe('itemExists', () => {
    it('should return true when item exists', async () => {
      (prisma.wishlistItem.count as jest.Mock).mockResolvedValue(1);

      const result = await repository.itemExists('cust-1', 'prod-1');

      expect(result).toBe(true);
      expect(prisma.wishlistItem.count).toHaveBeenCalledWith({
        where: { customerId: 'cust-1', productId: 'prod-1' },
      });
    });

    it('should return false when item does not exist', async () => {
      (prisma.wishlistItem.count as jest.Mock).mockResolvedValue(0);

      const result = await repository.itemExists('cust-1', 'prod-999');

      expect(result).toBe(false);
    });
  });

  describe('addItem', () => {
    it('should create a wishlist item', async () => {
      const created = { id: 'wi-2', customerId: 'cust-1', productId: 'prod-2', addedAt: new Date() };
      (prisma.wishlistItem.create as jest.Mock).mockResolvedValue(created);

      const result = await repository.addItem('cust-1', 'prod-2');

      expect(result).toEqual(created);
      expect(prisma.wishlistItem.create).toHaveBeenCalledWith({
        data: { customerId: 'cust-1', productId: 'prod-2' },
      });
    });
  });

  describe('removeItem', () => {
    it('should delete a wishlist item by compound key', async () => {
      const deleted = { id: 'wi-1' };
      (prisma.wishlistItem.delete as jest.Mock).mockResolvedValue(deleted);

      const result = await repository.removeItem('cust-1', 'prod-1');

      expect(result).toEqual(deleted);
      expect(prisma.wishlistItem.delete).toHaveBeenCalledWith({
        where: { customerId_productId: { customerId: 'cust-1', productId: 'prod-1' } },
      });
    });
  });

  describe('clearWishlist', () => {
    it('should delete all items for a customer', async () => {
      (prisma.wishlistItem.deleteMany as jest.Mock).mockResolvedValue({ count: 3 });

      const result = await repository.clearWishlist('cust-1');

      expect(result).toEqual({ count: 3 });
      expect(prisma.wishlistItem.deleteMany).toHaveBeenCalledWith({
        where: { customerId: 'cust-1' },
      });
    });
  });
});