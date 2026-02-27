import { ReviewRepository } from '../../src/app/reviews/review.repository';
import { PrismaClient } from '@prisma/client';

jest.mock('@prisma/client', () => {
  const mockPrisma = {
    review: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mockPrisma) };
});

describe('ReviewRepository', () => {
  let repository: ReviewRepository;
  let prisma: PrismaClient;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = new PrismaClient();
    repository = new ReviewRepository(prisma);
  });

  describe('findById', () => {
    it('should find review by id including customer and product', async () => {
      const review = {
        id: 'rev-1',
        customerId: 'cust-1',
        productId: 'prod-1',
        rating: 5,
        title: 'Excellent',
        body: 'Great kitchen',
        status: 'APPROVED',
        customer: { id: 'cust-1', firstName: 'John' },
        product: { id: 'prod-1', title: 'Luna White' },
        createdAt: new Date(),
      };
      (prisma.review.findUnique as jest.Mock).mockResolvedValue(review);

      const result = await repository.findById('rev-1');

      expect(result).toEqual(review);
      expect(prisma.review.findUnique).toHaveBeenCalledWith({
        where: { id: 'rev-1' },
        include: { customer: true, product: true },
      });
    });

    it('should return null when review not found', async () => {
      (prisma.review.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByProductId', () => {
    it('should return approved reviews for a product with pagination', async () => {
      const reviews = [
        { id: 'rev-1', productId: 'prod-1', rating: 5, status: 'APPROVED' },
        { id: 'rev-2', productId: 'prod-1', rating: 4, status: 'APPROVED' },
      ];
      (prisma.review.findMany as jest.Mock).mockResolvedValue(reviews);
      (prisma.review.count as jest.Mock).mockResolvedValue(2);

      const result = await repository.findByProductId('prod-1', { page: 1, limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(prisma.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { productId: 'prod-1', status: 'APPROVED' } })
      );
    });
  });

  describe('findByCustomerId', () => {
    it('should return all reviews by a customer', async () => {
      const reviews = [{ id: 'rev-1', customerId: 'cust-1' }];
      (prisma.review.findMany as jest.Mock).mockResolvedValue(reviews);

      const result = await repository.findByCustomerId('cust-1');

      expect(result).toEqual(reviews);
      expect(prisma.review.findMany).toHaveBeenCalledWith({
        where: { customerId: 'cust-1' },
        include: { product: true },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('hasCustomerReviewed', () => {
    it('should return true when review exists', async () => {
      (prisma.review.count as jest.Mock).mockResolvedValue(1);

      const result = await repository.hasCustomerReviewed('cust-1', 'prod-1');

      expect(result).toBe(true);
      expect(prisma.review.count).toHaveBeenCalledWith({
        where: { customerId: 'cust-1', productId: 'prod-1' },
      });
    });

    it('should return false when no review exists', async () => {
      (prisma.review.count as jest.Mock).mockResolvedValue(0);

      const result = await repository.hasCustomerReviewed('cust-1', 'prod-new');

      expect(result).toBe(false);
    });
  });

  describe('create', () => {
    it('should create a review record', async () => {
      const input = { customerId: 'cust-1', productId: 'prod-1', rating: 5, title: 'Amazing', body: 'Love it', status: 'PENDING' };
      const created = { id: 'rev-new', ...input, createdAt: new Date() };
      (prisma.review.create as jest.Mock).mockResolvedValue(created);

      const result = await repository.create(input);

      expect(result).toEqual(created);
      expect(prisma.review.create).toHaveBeenCalledWith({ data: input });
    });
  });

  describe('update', () => {
    it('should update a review record', async () => {
      const updateData = { status: 'APPROVED' };
      const updated = { id: 'rev-1', status: 'APPROVED' };
      (prisma.review.update as jest.Mock).mockResolvedValue(updated);

      const result = await repository.update('rev-1', updateData);

      expect(result).toEqual(updated);
      expect(prisma.review.update).toHaveBeenCalledWith({
        where: { id: 'rev-1' },
        data: updateData,
      });
    });
  });

  describe('delete', () => {
    it('should delete a review record', async () => {
      (prisma.review.delete as jest.Mock).mockResolvedValue({ id: 'rev-1' });

      const result = await repository.delete('rev-1');

      expect(result).toEqual({ id: 'rev-1' });
      expect(prisma.review.delete).toHaveBeenCalledWith({ where: { id: 'rev-1' } });
    });
  });

  describe('findAll', () => {
    it('should return paginated reviews with all statuses for admin', async () => {
      const reviews = [{ id: 'rev-1', status: 'PENDING' }, { id: 'rev-2', status: 'APPROVED' }];
      (prisma.review.findMany as jest.Mock).mockResolvedValue(reviews);
      (prisma.review.count as jest.Mock).mockResolvedValue(2);

      const result = await repository.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });
  });
});