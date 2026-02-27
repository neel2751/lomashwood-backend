import { TestimonialService } from '../../src/app/cms/testimonial.service';
import { TestimonialRepository } from '../../src/app/cms/testimonial.repository';
import { AppError } from '../../src/shared/errors';
import { CreateTestimonialDto, UpdateTestimonialDto } from '../../src/app/cms/testimonial.types';

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

jest.mock('../../src/app/cms/testimonial.repository');

const mockTestimonialRepository = TestimonialRepository as jest.MockedClass<typeof TestimonialRepository>;

describe('TestimonialService', () => {
  let testimonialService: TestimonialService;
  let repositoryInstance: jest.Mocked<TestimonialRepository>;

  const mockTestimonial = {
    id: 'testimonial-1',
    customerName: 'Sarah Johnson',
    location: 'London',
    rating: 5,
    review:
      'Absolutely love our new kitchen from Lomash Wood. The quality is outstanding and the installation team were professional throughout.',
    mediaUrl: 'https://cdn.lomashwood.com/reviews/sarah-kitchen.jpg',
    mediaType: 'image' as const,
    productCategory: 'kitchen',
    isActive: true,
    isFeatured: false,
    sortOrder: 1,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    repositoryInstance = new mockTestimonialRepository() as jest.Mocked<TestimonialRepository>;
    (mockTestimonialRepository as unknown as jest.Mock).mockReturnValue(repositoryInstance);
    testimonialService = new TestimonialService(repositoryInstance);
  });

  describe('findAll', () => {
    it('should return all testimonials', async () => {
      repositoryInstance.findAll.mockResolvedValue([mockTestimonial]);

      const result = await testimonialService.findAll();

      expect(repositoryInstance.findAll).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('testimonial-1');
    });

    it('should return empty array when no testimonials exist', async () => {
      repositoryInstance.findAll.mockResolvedValue([]);

      const result = await testimonialService.findAll();

      expect(result).toEqual([]);
    });

    it('should propagate repository errors', async () => {
      repositoryInstance.findAll.mockRejectedValue(new Error('Database error'));

      await expect(testimonialService.findAll()).rejects.toThrow('Database error');
    });
  });

  describe('findActive', () => {
    it('should return only active testimonials', async () => {
      repositoryInstance.findActive.mockResolvedValue([mockTestimonial]);

      const result = await testimonialService.findActive();

      expect(repositoryInstance.findActive).toHaveBeenCalled();
      expect(result[0].isActive).toBe(true);
    });

    it('should return empty array when no active testimonials', async () => {
      repositoryInstance.findActive.mockResolvedValue([]);

      const result = await testimonialService.findActive();

      expect(result).toEqual([]);
    });
  });

  // ─── findFeatured ────────────────────────────────────────────────────────────

  describe('findFeatured', () => {
    it('should return featured testimonials', async () => {
      const featuredTestimonial = { ...mockTestimonial, isFeatured: true };
      repositoryInstance.findFeatured.mockResolvedValue([featuredTestimonial]);

      const result = await testimonialService.findFeatured();

      expect(repositoryInstance.findFeatured).toHaveBeenCalled();
      expect(result[0].isFeatured).toBe(true);
    });

    it('should return empty array when no featured testimonials', async () => {
      repositoryInstance.findFeatured.mockResolvedValue([]);

      const result = await testimonialService.findFeatured();

      expect(result).toEqual([]);
    });
  });

  // ─── findByCategory ─────────────────────────────────────────────────────────

  describe('findByCategory', () => {
    it('should return testimonials filtered by product category', async () => {
      repositoryInstance.findByCategory.mockResolvedValue([mockTestimonial]);

      const result = await testimonialService.findByCategory('kitchen');

      expect(repositoryInstance.findByCategory).toHaveBeenCalledWith('kitchen');
      expect(result[0].productCategory).toBe('kitchen');
    });

    it('should return testimonials for bedroom category', async () => {
      const bedroomTestimonial = { ...mockTestimonial, id: 'testimonial-2', productCategory: 'bedroom' };
      repositoryInstance.findByCategory.mockResolvedValue([bedroomTestimonial]);

      const result = await testimonialService.findByCategory('bedroom');

      expect(result[0].productCategory).toBe('bedroom');
    });
  });

  // ─── findById ────────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('should return a testimonial by id', async () => {
      repositoryInstance.findById.mockResolvedValue(mockTestimonial);

      const result = await testimonialService.findById('testimonial-1');

      expect(repositoryInstance.findById).toHaveBeenCalledWith('testimonial-1');
      expect(result.id).toBe('testimonial-1');
    });

    it('should throw AppError when testimonial not found', async () => {
      repositoryInstance.findById.mockResolvedValue(null);

      await expect(testimonialService.findById('nonexistent')).rejects.toThrow(AppError);
      await expect(testimonialService.findById('nonexistent')).rejects.toMatchObject({
        statusCode: 404,
        message: 'Testimonial not found',
      });
    });
  });

  // ─── create ─────────────────────────────────────────────────────────────────

  describe('create', () => {
    const createDto: CreateTestimonialDto = {
      customerName: 'James Smith',
      location: 'Manchester',
      rating: 4,
      review: 'Great experience with our bedroom installation.',
      mediaUrl: 'https://cdn.lomashwood.com/reviews/james-bedroom.jpg',
      mediaType: 'image',
      productCategory: 'bedroom',
      isActive: true,
      isFeatured: false,
      sortOrder: 2,
    };

    it('should create and return a new testimonial', async () => {
      const createdTestimonial = { ...mockTestimonial, ...createDto, id: 'testimonial-2' };
      repositoryInstance.create.mockResolvedValue(createdTestimonial);

      const result = await testimonialService.create(createDto);

      expect(repositoryInstance.create).toHaveBeenCalledWith(createDto);
      expect(result.customerName).toBe('James Smith');
    });

    it('should throw AppError when rating is out of range (below 1)', async () => {
      const invalidDto: CreateTestimonialDto = { ...createDto, rating: 0 };

      await expect(testimonialService.create(invalidDto)).rejects.toThrow(AppError);
      await expect(testimonialService.create(invalidDto)).rejects.toMatchObject({
        statusCode: 400,
        message: 'Rating must be between 1 and 5',
      });
    });

    it('should throw AppError when rating is out of range (above 5)', async () => {
      const invalidDto: CreateTestimonialDto = { ...createDto, rating: 6 };

      await expect(testimonialService.create(invalidDto)).rejects.toThrow(AppError);
    });

    it('should throw AppError when review is empty', async () => {
      const invalidDto: CreateTestimonialDto = { ...createDto, review: '' };

      await expect(testimonialService.create(invalidDto)).rejects.toThrow(AppError);
      await expect(testimonialService.create(invalidDto)).rejects.toMatchObject({
        statusCode: 400,
        message: 'Review text cannot be empty',
      });
    });

    it('should throw AppError when customer name is empty', async () => {
      const invalidDto: CreateTestimonialDto = { ...createDto, customerName: '' };

      await expect(testimonialService.create(invalidDto)).rejects.toThrow(AppError);
    });

    it('should allow creating testimonial without media', async () => {
      const dtoNoMedia: CreateTestimonialDto = { ...createDto, mediaUrl: undefined, mediaType: undefined };
      const createdTestimonial = { ...mockTestimonial, ...dtoNoMedia, id: 'testimonial-3', mediaUrl: null, mediaType: null };
      repositoryInstance.create.mockResolvedValue(createdTestimonial);

      const result = await testimonialService.create(dtoNoMedia);

      expect(result.mediaUrl).toBeNull();
    });
  });

  // ─── update ─────────────────────────────────────────────────────────────────

  describe('update', () => {
    const updateDto: UpdateTestimonialDto = {
      rating: 5,
      review: 'Updated review: Even better than I remembered!',
      isFeatured: true,
    };

    it('should update and return the testimonial', async () => {
      const updatedTestimonial = { ...mockTestimonial, ...updateDto };
      repositoryInstance.findById.mockResolvedValue(mockTestimonial);
      repositoryInstance.update.mockResolvedValue(updatedTestimonial);

      const result = await testimonialService.update('testimonial-1', updateDto);

      expect(repositoryInstance.findById).toHaveBeenCalledWith('testimonial-1');
      expect(repositoryInstance.update).toHaveBeenCalledWith('testimonial-1', updateDto);
      expect(result.isFeatured).toBe(true);
    });

    it('should throw AppError when testimonial not found', async () => {
      repositoryInstance.findById.mockResolvedValue(null);

      await expect(testimonialService.update('nonexistent', updateDto)).rejects.toThrow(AppError);
      expect(repositoryInstance.update).not.toHaveBeenCalled();
    });

    it('should throw AppError on invalid rating update', async () => {
      repositoryInstance.findById.mockResolvedValue(mockTestimonial);
      const invalidUpdate: UpdateTestimonialDto = { rating: 10 };

      await expect(testimonialService.update('testimonial-1', invalidUpdate)).rejects.toThrow(AppError);
    });
  });

  // ─── delete ─────────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('should delete the testimonial', async () => {
      repositoryInstance.findById.mockResolvedValue(mockTestimonial);
      repositoryInstance.delete.mockResolvedValue(undefined);

      await testimonialService.delete('testimonial-1');

      expect(repositoryInstance.delete).toHaveBeenCalledWith('testimonial-1');
    });

    it('should throw AppError when testimonial not found', async () => {
      repositoryInstance.findById.mockResolvedValue(null);

      await expect(testimonialService.delete('nonexistent')).rejects.toThrow(AppError);
      expect(repositoryInstance.delete).not.toHaveBeenCalled();
    });
  });

  // ─── toggleFeatured ──────────────────────────────────────────────────────────

  describe('toggleFeatured', () => {
    it('should toggle testimonial featured state', async () => {
      const featuredTestimonial = { ...mockTestimonial, isFeatured: true };
      repositoryInstance.findById.mockResolvedValue(mockTestimonial);
      repositoryInstance.update.mockResolvedValue(featuredTestimonial);

      const result = await testimonialService.toggleFeatured('testimonial-1');

      expect(repositoryInstance.update).toHaveBeenCalledWith('testimonial-1', { isFeatured: true });
      expect(result.isFeatured).toBe(true);
    });

    it('should throw AppError when testimonial not found', async () => {
      repositoryInstance.findById.mockResolvedValue(null);

      await expect(testimonialService.toggleFeatured('nonexistent')).rejects.toThrow(AppError);
    });
  });

  // ─── toggleActive ────────────────────────────────────────────────────────────

  describe('toggleActive', () => {
    it('should toggle testimonial active state', async () => {
      const inactiveTestimonial = { ...mockTestimonial, isActive: false };
      repositoryInstance.findById.mockResolvedValue(mockTestimonial);
      repositoryInstance.update.mockResolvedValue(inactiveTestimonial);

      const result = await testimonialService.toggleActive('testimonial-1');

      expect(repositoryInstance.update).toHaveBeenCalledWith('testimonial-1', { isActive: false });
      expect(result.isActive).toBe(false);
    });
  });

  // ─── getAverageRating ────────────────────────────────────────────────────────

  describe('getAverageRating', () => {
    it('should return average rating across all testimonials', async () => {
      repositoryInstance.getAverageRating.mockResolvedValue(4.7);

      const result = await testimonialService.getAverageRating();

      expect(repositoryInstance.getAverageRating).toHaveBeenCalled();
      expect(result).toBe(4.7);
    });

    it('should return 0 when no testimonials exist', async () => {
      repositoryInstance.getAverageRating.mockResolvedValue(0);

      const result = await testimonialService.getAverageRating();

      expect(result).toBe(0);
    });
  });

  // ─── reorder ─────────────────────────────────────────────────────────────────

  describe('reorder', () => {
    it('should reorder testimonials', async () => {
      const reorderPayload = [
        { id: 'testimonial-1', sortOrder: 2 },
        { id: 'testimonial-2', sortOrder: 1 },
      ];
      repositoryInstance.reorder.mockResolvedValue(undefined);

      await testimonialService.reorder(reorderPayload);

      expect(repositoryInstance.reorder).toHaveBeenCalledWith(reorderPayload);
    });

    it('should throw AppError on empty payload', async () => {
      await expect(testimonialService.reorder([])).rejects.toThrow(AppError);
    });
  });
});