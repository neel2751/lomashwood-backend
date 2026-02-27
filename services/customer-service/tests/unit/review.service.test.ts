import { ReviewService } from '../../src/app/reviews/review.service';
import { ReviewRepository } from '../../src/app/reviews/review.repository';
import { AppError } from '../../src/shared/errors';

jest.mock('../../src/app/reviews/review.repository');

const mockRepository = {
  findById: jest.fn(),
  findByProductId: jest.fn(),
  findByCustomerId: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findAll: jest.fn(),
  hasCustomerReviewed: jest.fn(),
};

describe('ReviewService', () => {
  let service: ReviewService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ReviewService(mockRepository as unknown as ReviewRepository);
  });

  describe('getById', () => {
    it('should return review when found', async () => {
      const review = { id: 'rev-1', customerId: 'cust-1', productId: 'prod-1', rating: 5, title: 'Excellent kitchen', body: 'Very happy', status: 'APPROVED', createdAt: new Date() };
      mockRepository.findById.mockResolvedValue(review);

      const result = await service.getById('rev-1');

      expect(result).toEqual(review);
      expect(mockRepository.findById).toHaveBeenCalledWith('rev-1');
    });

    it('should throw AppError 404 when review not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.getById('nonexistent')).rejects.toThrow(AppError);
      await expect(service.getById('nonexistent')).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('getByProductId', () => {
    it('should return approved reviews for a product', async () => {
      const reviews = [
        { id: 'rev-1', productId: 'prod-1', rating: 5, status: 'APPROVED' },
        { id: 'rev-2', productId: 'prod-1', rating: 4, status: 'APPROVED' },
      ];
      mockRepository.findByProductId.mockResolvedValue({ data: reviews, total: 2, page: 1, limit: 10 });

      const result = await service.getByProductId('prod-1', { page: 1, limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });
  });

  describe('getByCustomerId', () => {
    it('should return all reviews by a customer', async () => {
      const reviews = [
        { id: 'rev-1', customerId: 'cust-1', productId: 'prod-1', rating: 5 },
        { id: 'rev-3', customerId: 'cust-1', productId: 'prod-3', rating: 3 },
      ];
      mockRepository.findByCustomerId.mockResolvedValue(reviews);

      const result = await service.getByCustomerId('cust-1');

      expect(result).toHaveLength(2);
    });
  });

  describe('create', () => {
    it('should create a review successfully', async () => {
      const input = { customerId: 'cust-1', productId: 'prod-1', rating: 5, title: 'Amazing', body: 'Love the kitchen design' };
      const created = { id: 'rev-new', ...input, status: 'PENDING', createdAt: new Date() };

      mockRepository.hasCustomerReviewed.mockResolvedValue(false);
      mockRepository.create.mockResolvedValue(created);

      const result = await service.create(input);

      expect(result).toEqual(created);
      expect(result.status).toBe('PENDING');
      expect(mockRepository.create).toHaveBeenCalledWith({ ...input, status: 'PENDING' });
    });

    it('should throw AppError 409 when customer already reviewed product', async () => {
      mockRepository.hasCustomerReviewed.mockResolvedValue(true);

      await expect(service.create({ customerId: 'cust-1', productId: 'prod-1', rating: 4, title: 'Good', body: 'Nice' })).rejects.toThrow(AppError);
      await expect(service.create({ customerId: 'cust-1', productId: 'prod-1', rating: 4, title: 'Good', body: 'Nice' })).rejects.toMatchObject({ statusCode: 409 });
    });

    it('should throw AppError when rating is out of range', async () => {
      mockRepository.hasCustomerReviewed.mockResolvedValue(false);

      await expect(service.create({ customerId: 'cust-1', productId: 'prod-1', rating: 6, title: 'Test', body: 'Test' })).rejects.toThrow(AppError);
    });
  });

  describe('update', () => {
    it('should update review body and rating', async () => {
      const existing = { id: 'rev-1', customerId: 'cust-1', productId: 'prod-1', rating: 4, title: 'Good', body: 'Nice', status: 'APPROVED' };
      const updated = { ...existing, rating: 5, body: 'Actually amazing' };

      mockRepository.findById.mockResolvedValue(existing);
      mockRepository.update.mockResolvedValue(updated);

      const result = await service.update('rev-1', 'cust-1', { rating: 5, body: 'Actually amazing' });

      expect(result.rating).toBe(5);
      expect(mockRepository.update).toHaveBeenCalledWith('rev-1', { rating: 5, body: 'Actually amazing' });
    });

    it('should throw AppError 403 when customer does not own review', async () => {
      mockRepository.findById.mockResolvedValue({ id: 'rev-1', customerId: 'cust-other' });

      await expect(service.update('rev-1', 'cust-1', { body: 'Updated' })).rejects.toThrow(AppError);
      await expect(service.update('rev-1', 'cust-1', { body: 'Updated' })).rejects.toMatchObject({ statusCode: 403 });
    });

    it('should throw AppError 404 when review not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.update('nonexistent', 'cust-1', { body: 'Test' })).rejects.toThrow(AppError);
    });
  });

  describe('delete', () => {
    it('should delete review when owner requests', async () => {
      mockRepository.findById.mockResolvedValue({ id: 'rev-1', customerId: 'cust-1' });
      mockRepository.delete.mockResolvedValue({ id: 'rev-1' });

      await service.delete('rev-1', 'cust-1', false);

      expect(mockRepository.delete).toHaveBeenCalledWith('rev-1');
    });

    it('should allow admin to delete any review', async () => {
      mockRepository.findById.mockResolvedValue({ id: 'rev-1', customerId: 'cust-other' });
      mockRepository.delete.mockResolvedValue({ id: 'rev-1' });

      await service.delete('rev-1', 'admin-1', true);

      expect(mockRepository.delete).toHaveBeenCalledWith('rev-1');
    });

    it('should throw AppError 403 when non-owner non-admin tries to delete', async () => {
      mockRepository.findById.mockResolvedValue({ id: 'rev-1', customerId: 'cust-other' });

      await expect(service.delete('rev-1', 'cust-1', false)).rejects.toThrow(AppError);
      await expect(service.delete('rev-1', 'cust-1', false)).rejects.toMatchObject({ statusCode: 403 });
    });
  });

  describe('approve', () => {
    it('should approve a pending review', async () => {
      const existing = { id: 'rev-1', status: 'PENDING' };
      const approved = { ...existing, status: 'APPROVED' };

      mockRepository.findById.mockResolvedValue(existing);
      mockRepository.update.mockResolvedValue(approved);

      const result = await service.approve('rev-1');

      expect(result.status).toBe('APPROVED');
      expect(mockRepository.update).toHaveBeenCalledWith('rev-1', { status: 'APPROVED' });
    });
  });

  describe('reject', () => {
    it('should reject a pending review', async () => {
      const existing = { id: 'rev-1', status: 'PENDING' };
      const rejected = { ...existing, status: 'REJECTED' };

      mockRepository.findById.mockResolvedValue(existing);
      mockRepository.update.mockResolvedValue(rejected);

      const result = await service.reject('rev-1');

      expect(result.status).toBe('REJECTED');
    });
  });

  describe('getAll', () => {
    it('should return paginated reviews for admin', async () => {
      mockRepository.findAll.mockResolvedValue({ data: [], total: 0, page: 1, limit: 10 });

      const result = await service.getAll({ page: 1, limit: 10 });

      expect(result.data).toEqual([]);
      expect(mockRepository.findAll).toHaveBeenCalledWith({ page: 1, limit: 10 });
    });
  });
});