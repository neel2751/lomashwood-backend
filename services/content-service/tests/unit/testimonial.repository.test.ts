import { TestimonialRepository } from '../../src/app/testimonials/testimonial.repository';
import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

jest.mock('@prisma/client');

describe('TestimonialRepository', () => {
  let testimonialRepository: TestimonialRepository;
  let prisma: DeepMockProxy<PrismaClient>;

  const mockTestimonial = {
    id: 'testimonial-1',
    customerName: 'Sarah Johnson',
    location: 'London',
    rating: 5,
    review: 'Absolutely love our new kitchen from Lomash Wood.',
    mediaUrl: 'https://cdn.lomashwood.com/reviews/sarah-kitchen.jpg',
    mediaType: 'image',
    productCategory: 'kitchen',
    isActive: true,
    isFeatured: false,
    sortOrder: 1,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    testimonialRepository = new TestimonialRepository(prisma);
  });

  // ─── findAll ────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return all testimonials ordered by sortOrder', async () => {
      (prisma.testimonial.findMany as jest.Mock).mockResolvedValue([mockTestimonial]);

      const result = await testimonialRepository.findAll();

      expect(prisma.testimonial.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: expect.objectContaining({ sortOrder: 'asc' }),
        }),
      );
      expect(result).toHaveLength(1);
    });

    it('should return empty array when no testimonials exist', async () => {
      (prisma.testimonial.findMany as jest.Mock).mockResolvedValue([]);

      const result = await testimonialRepository.findAll();

      expect(result).toEqual([]);
    });
  });

  // ─── findActive ─────────────────────────────────────────────────────────────

  describe('findActive', () => {
    it('should return only active testimonials', async () => {
      (prisma.testimonial.findMany as jest.Mock).mockResolvedValue([mockTestimonial]);

      const result = await testimonialRepository.findActive();

      expect(prisma.testimonial.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: true }),
        }),
      );
      expect(result[0].isActive).toBe(true);
    });
  });

  // ─── findFeatured ────────────────────────────────────────────────────────────

  describe('findFeatured', () => {
    it('should return only featured testimonials', async () => {
      const featured = { ...mockTestimonial, isFeatured: true };
      (prisma.testimonial.findMany as jest.Mock).mockResolvedValue([featured]);

      const result = await testimonialRepository.findFeatured();

      expect(prisma.testimonial.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isFeatured: true, isActive: true }),
        }),
      );
      expect(result[0].isFeatured).toBe(true);
    });

    it('should return empty array when no featured testimonials', async () => {
      (prisma.testimonial.findMany as jest.Mock).mockResolvedValue([]);

      const result = await testimonialRepository.findFeatured();

      expect(result).toEqual([]);
    });
  });

  // ─── findByCategory ─────────────────────────────────────────────────────────

  describe('findByCategory', () => {
    it('should return testimonials by product category', async () => {
      (prisma.testimonial.findMany as jest.Mock).mockResolvedValue([mockTestimonial]);

      const result = await testimonialRepository.findByCategory('kitchen');

      expect(prisma.testimonial.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ productCategory: 'kitchen' }),
        }),
      );
      expect(result[0].productCategory).toBe('kitchen');
    });

    it('should return empty array for category with no testimonials', async () => {
      (prisma.testimonial.findMany as jest.Mock).mockResolvedValue([]);

      const result = await testimonialRepository.findByCategory('bathroom');

      expect(result).toEqual([]);
    });
  });

  // ─── findById ────────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('should find a testimonial by id', async () => {
      (prisma.testimonial.findUnique as jest.Mock).mockResolvedValue(mockTestimonial);

      const result = await testimonialRepository.findById('testimonial-1');

      expect(prisma.testimonial.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'testimonial-1' } }),
      );
      expect(result).toEqual(mockTestimonial);
    });

    it('should return null when testimonial not found', async () => {
      (prisma.testimonial.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await testimonialRepository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  // ─── create ─────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should create a testimonial', async () => {
      const createData = {
        customerName: 'James Smith',
        location: 'Manchester',
        rating: 4,
        review: 'Great bedroom installation.',
        mediaUrl: null,
        mediaType: null,
        productCategory: 'bedroom',
        isActive: true,
        isFeatured: false,
        sortOrder: 2,
      };
      (prisma.testimonial.create as jest.Mock).mockResolvedValue({ ...mockTestimonial, ...createData, id: 'testimonial-new' });

      const result = await testimonialRepository.create(createData);

      expect(prisma.testimonial.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ customerName: 'James Smith', rating: 4 }),
        }),
      );
      expect(result.id).toBe('testimonial-new');
    });
  });

  // ─── update ─────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('should update a testimonial', async () => {
      const updateData = { rating: 5, isFeatured: true };
      (prisma.testimonial.update as jest.Mock).mockResolvedValue({ ...mockTestimonial, ...updateData });

      const result = await testimonialRepository.update('testimonial-1', updateData);

      expect(prisma.testimonial.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'testimonial-1' },
          data: expect.objectContaining({ isFeatured: true }),
        }),
      );
      expect(result.isFeatured).toBe(true);
    });
  });

  // ─── delete ─────────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('should delete a testimonial by id', async () => {
      (prisma.testimonial.delete as jest.Mock).mockResolvedValue(mockTestimonial);

      await testimonialRepository.delete('testimonial-1');

      expect(prisma.testimonial.delete).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'testimonial-1' } }),
      );
    });
  });

  // ─── reorder ─────────────────────────────────────────────────────────────────

  describe('reorder', () => {
    it('should reorder testimonials in a transaction', async () => {
      const reorderPayload = [
        { id: 'testimonial-1', sortOrder: 2 },
        { id: 'testimonial-2', sortOrder: 1 },
      ];
      (prisma.$transaction as jest.Mock).mockResolvedValue([]);

      await testimonialRepository.reorder(reorderPayload);

      expect(prisma.$transaction).toHaveBeenCalled();
      const calls = (prisma.$transaction as jest.Mock).mock.calls[0][0];
      expect(calls).toHaveLength(2);
    });
  });

  // ─── getAverageRating ────────────────────────────────────────────────────────

  describe('getAverageRating', () => {
    it('should return average rating using aggregate', async () => {
      (prisma.testimonial.aggregate as jest.Mock).mockResolvedValue({
        _avg: { rating: 4.7 },
      });

      const result = await testimonialRepository.getAverageRating();

      expect(prisma.testimonial.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          _avg: { rating: true },
          where: { isActive: true },
        }),
      );
      expect(result).toBe(4.7);
    });

    it('should return 0 when no testimonials exist', async () => {
      (prisma.testimonial.aggregate as jest.Mock).mockResolvedValue({
        _avg: { rating: null },
      });

      const result = await testimonialRepository.getAverageRating();

      expect(result).toBe(0);
    });
  });
});