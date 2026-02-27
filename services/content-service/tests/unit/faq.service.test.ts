import { FaqService } from '../../src/app/cms/faq.service';
import { FaqRepository } from '../../src/app/cms/faq.repository';
import { AppError } from '../../src/shared/errors';
import { CreateFaqDto, UpdateFaqDto } from '../../src/app/cms/faq.types';

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

jest.mock('../../src/app/cms/faq.repository');

const mockFaqRepository = FaqRepository as jest.MockedClass<typeof FaqRepository>;

describe('FaqService', () => {
  let faqService: FaqService;
  let repositoryInstance: jest.Mocked<FaqRepository>;

  const mockFaq = {
    id: 'faq-1',
    question: 'How long does installation take?',
    answer: 'Typically between 3-5 working days depending on the complexity of the project.',
    category: 'installation',
    sortOrder: 1,
    isActive: true,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    repositoryInstance = new mockFaqRepository() as jest.Mocked<FaqRepository>;
    (mockFaqRepository as unknown as jest.Mock).mockReturnValue(repositoryInstance);
    faqService = new FaqService(repositoryInstance);
  });

  describe('findAll', () => {
    it('should return all FAQs', async () => {
      repositoryInstance.findAll.mockResolvedValue([mockFaq]);

      const result = await faqService.findAll();

      expect(repositoryInstance.findAll).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('faq-1');
    });

    it('should return empty array when no FAQs exist', async () => {
      repositoryInstance.findAll.mockResolvedValue([]);

      const result = await faqService.findAll();

      expect(result).toEqual([]);
    });

    it('should propagate repository errors', async () => {
      repositoryInstance.findAll.mockRejectedValue(new Error('Database error'));

      await expect(faqService.findAll()).rejects.toThrow('Database error');
    });
  });

  describe('findActive', () => {
    it('should return only active FAQs', async () => {
      repositoryInstance.findActive.mockResolvedValue([mockFaq]);

      const result = await faqService.findActive();

      expect(repositoryInstance.findActive).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].isActive).toBe(true);
    });

    it('should return empty array when no active FAQs exist', async () => {
      repositoryInstance.findActive.mockResolvedValue([]);

      const result = await faqService.findActive();

      expect(result).toEqual([]);
    });
  });

  // ─── findByCategory ─────────────────────────────────────────────────────────

  describe('findByCategory', () => {
    it('should return FAQs filtered by category', async () => {
      repositoryInstance.findByCategory.mockResolvedValue([mockFaq]);

      const result = await faqService.findByCategory('installation');

      expect(repositoryInstance.findByCategory).toHaveBeenCalledWith('installation');
      expect(result).toHaveLength(1);
      expect(result[0].category).toBe('installation');
    });

    it('should return empty array when no FAQs in category', async () => {
      repositoryInstance.findByCategory.mockResolvedValue([]);

      const result = await faqService.findByCategory('nonexistent');

      expect(result).toEqual([]);
    });
  });

  // ─── findById ────────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('should return a FAQ by id', async () => {
      repositoryInstance.findById.mockResolvedValue(mockFaq);

      const result = await faqService.findById('faq-1');

      expect(repositoryInstance.findById).toHaveBeenCalledWith('faq-1');
      expect(result.id).toBe('faq-1');
    });

    it('should throw AppError when FAQ not found', async () => {
      repositoryInstance.findById.mockResolvedValue(null);

      await expect(faqService.findById('nonexistent')).rejects.toThrow(AppError);
      await expect(faqService.findById('nonexistent')).rejects.toMatchObject({
        statusCode: 404,
        message: 'FAQ not found',
      });
    });
  });

  // ─── search ─────────────────────────────────────────────────────────────────

  describe('search', () => {
    it('should return FAQs matching search term', async () => {
      repositoryInstance.search.mockResolvedValue([mockFaq]);

      const result = await faqService.search('installation');

      expect(repositoryInstance.search).toHaveBeenCalledWith('installation');
      expect(result).toHaveLength(1);
    });

    it('should throw AppError on empty search term', async () => {
      await expect(faqService.search('')).rejects.toThrow(AppError);
      await expect(faqService.search('')).rejects.toMatchObject({
        statusCode: 400,
        message: 'Search term cannot be empty',
      });
      expect(repositoryInstance.search).not.toHaveBeenCalled();
    });

    it('should return empty array when no FAQs match', async () => {
      repositoryInstance.search.mockResolvedValue([]);

      const result = await faqService.search('xyznotfound');

      expect(result).toEqual([]);
    });
  });

  // ─── create ─────────────────────────────────────────────────────────────────

  describe('create', () => {
    const createDto: CreateFaqDto = {
      question: 'Do you offer finance options?',
      answer: 'Yes, we offer flexible finance plans starting from 0% APR.',
      category: 'finance',
      sortOrder: 2,
      isActive: true,
    };

    it('should create and return a new FAQ', async () => {
      const createdFaq = { ...mockFaq, ...createDto, id: 'faq-2' };
      repositoryInstance.create.mockResolvedValue(createdFaq);

      const result = await faqService.create(createDto);

      expect(repositoryInstance.create).toHaveBeenCalledWith(createDto);
      expect(result.question).toBe('Do you offer finance options?');
    });

    it('should throw AppError when question is empty', async () => {
      const invalidDto: CreateFaqDto = { ...createDto, question: '' };

      await expect(faqService.create(invalidDto)).rejects.toThrow(AppError);
      await expect(faqService.create(invalidDto)).rejects.toMatchObject({
        statusCode: 400,
        message: 'Question cannot be empty',
      });
      expect(repositoryInstance.create).not.toHaveBeenCalled();
    });

    it('should throw AppError when answer is empty', async () => {
      const invalidDto: CreateFaqDto = { ...createDto, answer: '' };

      await expect(faqService.create(invalidDto)).rejects.toThrow(AppError);
      await expect(faqService.create(invalidDto)).rejects.toMatchObject({
        statusCode: 400,
        message: 'Answer cannot be empty',
      });
    });
  });

  // ─── update ─────────────────────────────────────────────────────────────────

  describe('update', () => {
    const updateDto: UpdateFaqDto = {
      question: 'How long does a typical installation take?',
      sortOrder: 1,
    };

    it('should update and return the FAQ', async () => {
      const updatedFaq = { ...mockFaq, ...updateDto };
      repositoryInstance.findById.mockResolvedValue(mockFaq);
      repositoryInstance.update.mockResolvedValue(updatedFaq);

      const result = await faqService.update('faq-1', updateDto);

      expect(repositoryInstance.findById).toHaveBeenCalledWith('faq-1');
      expect(repositoryInstance.update).toHaveBeenCalledWith('faq-1', updateDto);
      expect(result.question).toBe('How long does a typical installation take?');
    });

    it('should throw AppError when FAQ not found', async () => {
      repositoryInstance.findById.mockResolvedValue(null);

      await expect(faqService.update('nonexistent', updateDto)).rejects.toThrow(AppError);
      await expect(faqService.update('nonexistent', updateDto)).rejects.toMatchObject({
        statusCode: 404,
      });
      expect(repositoryInstance.update).not.toHaveBeenCalled();
    });
  });

  // ─── delete ─────────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('should delete the FAQ', async () => {
      repositoryInstance.findById.mockResolvedValue(mockFaq);
      repositoryInstance.delete.mockResolvedValue(undefined);

      await faqService.delete('faq-1');

      expect(repositoryInstance.delete).toHaveBeenCalledWith('faq-1');
    });

    it('should throw AppError when FAQ not found', async () => {
      repositoryInstance.findById.mockResolvedValue(null);

      await expect(faqService.delete('nonexistent')).rejects.toThrow(AppError);
      expect(repositoryInstance.delete).not.toHaveBeenCalled();
    });
  });

  // ─── reorder ─────────────────────────────────────────────────────────────────

  describe('reorder', () => {
    it('should reorder FAQs', async () => {
      const reorderPayload = [
        { id: 'faq-1', sortOrder: 2 },
        { id: 'faq-2', sortOrder: 1 },
      ];
      repositoryInstance.reorder.mockResolvedValue(undefined);

      await faqService.reorder(reorderPayload);

      expect(repositoryInstance.reorder).toHaveBeenCalledWith(reorderPayload);
    });

    it('should throw AppError on empty payload', async () => {
      await expect(faqService.reorder([])).rejects.toThrow(AppError);
    });
  });

  // ─── toggleActive ────────────────────────────────────────────────────────────

  describe('toggleActive', () => {
    it('should toggle FAQ active state', async () => {
      const inactiveFaq = { ...mockFaq, isActive: false };
      repositoryInstance.findById.mockResolvedValue(mockFaq);
      repositoryInstance.update.mockResolvedValue(inactiveFaq);

      const result = await faqService.toggleActive('faq-1');

      expect(repositoryInstance.update).toHaveBeenCalledWith('faq-1', { isActive: false });
      expect(result.isActive).toBe(false);
    });

    it('should throw AppError when FAQ not found', async () => {
      repositoryInstance.findById.mockResolvedValue(null);

      await expect(faqService.toggleActive('nonexistent')).rejects.toThrow(AppError);
    });
  });

  // ─── getCategories ───────────────────────────────────────────────────────────

  describe('getCategories', () => {
    it('should return distinct FAQ categories', async () => {
      repositoryInstance.getCategories.mockResolvedValue(['installation', 'finance', 'delivery']);

      const result = await faqService.getCategories();

      expect(repositoryInstance.getCategories).toHaveBeenCalled();
      expect(result).toEqual(['installation', 'finance', 'delivery']);
    });

    it('should return empty array when no FAQs exist', async () => {
      repositoryInstance.getCategories.mockResolvedValue([]);

      const result = await faqService.getCategories();

      expect(result).toEqual([]);
    });
  });
});