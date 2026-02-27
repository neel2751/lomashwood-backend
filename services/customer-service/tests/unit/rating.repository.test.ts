import { RatingRepository } from '../../src/app/reviews/review.repository';
import { PrismaClient } from '@prisma/client';

jest.mock('@prisma/client', () => {
  const mockPrisma = {
    rating: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mockPrisma) };
});

describe('RatingRepository', () => {
  let repository: RatingRepository;
  let prisma: PrismaClient;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = new PrismaClient();
    repository = new RatingRepository(prisma);
  });

  describe('findByCustomerAndProduct', () => {
    it('should find rating by customerId and productId', async () => {
      const rating = { id: 'rat-1', customerId: 'cust-1', productId: 'prod-1', value: 5 };
      (prisma.rating.findUnique as jest.Mock).mockResolvedValue(rating);

      const result = await repository.findByCustomerAndProduct('cust-1', 'prod-1');

      expect(result).toEqual(rating);
      expect(prisma.rating.findUnique).toHaveBeenCalledWith({
        where: { customerId_productId: { customerId: 'cust-1', productId: 'prod-1' } },
      });
    });

    it('should return null when rating not found', async () => {
      (prisma.rating.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repository.findByCustomerAndProduct('cust-1', 'prod-unrated');

      expect(result).toBeNull();
    });
  });

  describe('upsert', () => {
    it('should create rating if not exists', async () => {
      const upserted = { id: 'rat-new', customerId: 'cust-1', productId: 'prod-1', value: 4 };
      (prisma.rating.upsert as jest.Mock).mockResolvedValue(upserted);

      const result = await repository.upsert('cust-1', 'prod-1', 4);

      expect(result).toEqual(upserted);
      expect(prisma.rating.upsert).toHaveBeenCalledWith({
        where: { customerId_productId: { customerId: 'cust-1', productId: 'prod-1' } },
        update: { value: 4 },
        create: { customerId: 'cust-1', productId: 'prod-1', value: 4 },
      });
    });

    it('should update rating if already exists', async () => {
      const upserted = { id: 'rat-1', customerId: 'cust-1', productId: 'prod-1', value: 5 };
      (prisma.rating.upsert as jest.Mock).mockResolvedValue(upserted);

      const result = await repository.upsert('cust-1', 'prod-1', 5);

      expect(result.value).toBe(5);
    });
  });

  describe('delete', () => {
    it('should delete a rating by id', async () => {
      (prisma.rating.delete as jest.Mock).mockResolvedValue({ id: 'rat-1' });

      const result = await repository.delete('rat-1');

      expect(result).toEqual({ id: 'rat-1' });
      expect(prisma.rating.delete).toHaveBeenCalledWith({ where: { id: 'rat-1' } });
    });
  });

  describe('getAverageRating', () => {
    it('should return average rating for a product', async () => {
      (prisma.rating.aggregate as jest.Mock).mockResolvedValue({ _avg: { value: 4.3 } });

      const result = await repository.getAverageRating('prod-1');

      expect(result).toBe(4.3);
      expect(prisma.rating.aggregate).toHaveBeenCalledWith({
        where: { productId: 'prod-1' },
        _avg: { value: true },
      });
    });

    it('should return 0 when no ratings exist', async () => {
      (prisma.rating.aggregate as jest.Mock).mockResolvedValue({ _avg: { value: null } });

      const result = await repository.getAverageRating('prod-new');

      expect(result).toBe(0);
    });
  });

  describe('getRatingDistribution', () => {
    it('should return grouped rating counts', async () => {
      (prisma.rating.groupBy as jest.Mock).mockResolvedValue([
        { value: 5, _count: { value: 60 } },
        { value: 4, _count: { value: 25 } },
        { value: 3, _count: { value: 10 } },
      ]);

      const result = await repository.getRatingDistribution('prod-1');

      expect(result[5]).toBe(60);
      expect(result[4]).toBe(25);
      expect(result[3]).toBe(10);
      expect(result[1]).toBe(0);
      expect(result[2]).toBe(0);
    });
  });

  describe('findByProductId', () => {
    it('should return all ratings for a product', async () => {
      const ratings = [
        { id: 'rat-1', productId: 'prod-1', value: 5 },
        { id: 'rat-2', productId: 'prod-1', value: 4 },
      ];
      (prisma.rating.findMany as jest.Mock).mockResolvedValue(ratings);

      const result = await repository.findByProductId('prod-1');

      expect(result).toHaveLength(2);
      expect(prisma.rating.findMany).toHaveBeenCalledWith({
        where: { productId: 'prod-1' },
      });
    });
  });
});