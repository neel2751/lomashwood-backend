import { RatingService } from '../../src/app/reviews/review.service';
import { RatingRepository } from '../../src/app/reviews/review.repository';
import { AppError } from '../../src/shared/errors';

jest.mock('../../src/app/reviews/review.repository');

const mockRepository = {
  findByProductId: jest.fn(),
  findByCustomerAndProduct: jest.fn(),
  upsert: jest.fn(),
  delete: jest.fn(),
  getAverageRating: jest.fn(),
  getRatingDistribution: jest.fn(),
};

describe('RatingService', () => {
  let service: RatingService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RatingService(mockRepository as unknown as RatingRepository);
  });

  describe('getProductRating', () => {
    it('should return average rating and distribution', async () => {
      mockRepository.getAverageRating.mockResolvedValue(4.3);
      mockRepository.getRatingDistribution.mockResolvedValue({ 1: 2, 2: 3, 3: 10, 4: 25, 5: 60 });

      const result = await service.getProductRating('prod-1');

      expect(result.average).toBe(4.3);
      expect(result.distribution[5]).toBe(60);
      expect(mockRepository.getAverageRating).toHaveBeenCalledWith('prod-1');
    });

    it('should return zero average when no ratings exist', async () => {
      mockRepository.getAverageRating.mockResolvedValue(0);
      mockRepository.getRatingDistribution.mockResolvedValue({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });

      const result = await service.getProductRating('prod-new');

      expect(result.average).toBe(0);
    });
  });

  describe('rateProduct', () => {
    it('should create or update a rating', async () => {
      const upserted = { id: 'rat-1', customerId: 'cust-1', productId: 'prod-1', value: 5 };
      mockRepository.upsert.mockResolvedValue(upserted);

      const result = await service.rateProduct('cust-1', 'prod-1', 5);

      expect(result).toEqual(upserted);
      expect(mockRepository.upsert).toHaveBeenCalledWith('cust-1', 'prod-1', 5);
    });

    it('should throw AppError when rating value is below 1', async () => {
      await expect(service.rateProduct('cust-1', 'prod-1', 0)).rejects.toThrow(AppError);
      await expect(service.rateProduct('cust-1', 'prod-1', 0)).rejects.toMatchObject({ statusCode: 400 });
    });

    it('should throw AppError when rating value exceeds 5', async () => {
      await expect(service.rateProduct('cust-1', 'prod-1', 6)).rejects.toThrow(AppError);
    });
  });

  describe('deleteRating', () => {
    it('should delete rating when owner requests', async () => {
      const existing = { id: 'rat-1', customerId: 'cust-1', productId: 'prod-1', value: 4 };
      mockRepository.findByCustomerAndProduct.mockResolvedValue(existing);
      mockRepository.delete.mockResolvedValue({ id: 'rat-1' });

      await service.deleteRating('cust-1', 'prod-1');

      expect(mockRepository.delete).toHaveBeenCalledWith('rat-1');
    });

    it('should throw AppError 404 when rating not found', async () => {
      mockRepository.findByCustomerAndProduct.mockResolvedValue(null);

      await expect(service.deleteRating('cust-1', 'prod-1')).rejects.toThrow(AppError);
      await expect(service.deleteRating('cust-1', 'prod-1')).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('getCustomerRating', () => {
    it('should return customers rating for a product', async () => {
      const rating = { id: 'rat-1', customerId: 'cust-1', productId: 'prod-1', value: 4 };
      mockRepository.findByCustomerAndProduct.mockResolvedValue(rating);

      const result = await service.getCustomerRating('cust-1', 'prod-1');

      expect(result).toEqual(rating);
    });

    it('should return null when customer has not rated product', async () => {
      mockRepository.findByCustomerAndProduct.mockResolvedValue(null);

      const result = await service.getCustomerRating('cust-1', 'prod-unrated');

      expect(result).toBeNull();
    });
  });
});