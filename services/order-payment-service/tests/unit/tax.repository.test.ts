import { TaxRepository } from '../../src/app/orders/order.repository';
import { PrismaClient, TaxType } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

jest.mock('../../src/infrastructure/db/prisma.client', () => ({
  prisma: mockDeep<PrismaClient>(),
}));

import { prisma } from '../../src/infrastructure/db/prisma.client';

const prismaMock = prisma as DeepMockProxy<PrismaClient>;

describe('TaxRepository', () => {
  let repository: TaxRepository;

  const mockTaxRule = {
    id: 'tax-uuid-001',
    name: 'UK Standard VAT',
    type: TaxType.PERCENTAGE,
    rate: 20,
    country: 'GB',
    region: null,
    category: 'GENERAL',
    isDefault: true,
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new TaxRepository();
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should create a new tax rule and return it', async () => {
      prismaMock.taxRule.create.mockResolvedValue(mockTaxRule as any);

      const result = await repository.create({
        name: 'UK Standard VAT',
        type: TaxType.PERCENTAGE,
        rate: 20,
        country: 'GB',
        category: 'GENERAL',
        isDefault: true,
      });

      expect(prismaMock.taxRule.create).toHaveBeenCalledTimes(1);
      expect(result.name).toBe('UK Standard VAT');
      expect(result.rate).toBe(20);
    });

    it('should throw on database error during create', async () => {
      prismaMock.taxRule.create.mockRejectedValue(new Error('DB error'));

      await expect(
        repository.create({
          name: 'Fail Rule',
          type: TaxType.PERCENTAGE,
          rate: 20,
          country: 'GB',
          category: 'GENERAL',
        }),
      ).rejects.toThrow('DB error');
    });
  });

  // ─── findById ─────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('should return the tax rule when found', async () => {
      prismaMock.taxRule.findUnique.mockResolvedValue(mockTaxRule as any);

      const result = await repository.findById('tax-uuid-001');

      expect(prismaMock.taxRule.findUnique).toHaveBeenCalledWith({
        where: { id: 'tax-uuid-001' },
      });
      expect(result?.id).toBe('tax-uuid-001');
    });

    it('should return null when not found', async () => {
      prismaMock.taxRule.findUnique.mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  // ─── findApplicableRule ───────────────────────────────────────────────────

  describe('findApplicableRule', () => {
    it('should return the most specific matching rule for country + region + category', async () => {
      const regionRule = { ...mockTaxRule, id: 'tax-uuid-region', region: 'ENGLAND' };
      prismaMock.taxRule.findFirst.mockResolvedValue(regionRule as any);

      const result = await repository.findApplicableRule({
        country: 'GB',
        region: 'ENGLAND',
        category: 'GENERAL',
      });

      expect(result?.region).toBe('ENGLAND');
    });

    it('should fall back to country-only rule when no region-specific rule exists', async () => {
      prismaMock.taxRule.findFirst
        .mockResolvedValueOnce(null) // no region-specific
        .mockResolvedValueOnce(mockTaxRule as any); // country-level fallback

      const result = await repository.findApplicableRule({
        country: 'GB',
        region: 'SCOTLAND',
        category: 'GENERAL',
      });

      expect(result?.id).toBe('tax-uuid-001');
    });

    it('should return null when no matching rule exists', async () => {
      prismaMock.taxRule.findFirst.mockResolvedValue(null);

      const result = await repository.findApplicableRule({
        country: 'XX',
        category: 'UNKNOWN',
      });

      expect(result).toBeNull();
    });
  });

  // ─── update ───────────────────────────────────────────────────────────────

  describe('update', () => {
    it('should update and return the tax rule', async () => {
      const updated = { ...mockTaxRule, rate: 15 };
      prismaMock.taxRule.update.mockResolvedValue(updated as any);

      const result = await repository.update('tax-uuid-001', { rate: 15 });

      expect(prismaMock.taxRule.update).toHaveBeenCalledWith({
        where: { id: 'tax-uuid-001' },
        data: expect.objectContaining({ rate: 15 }),
      });
      expect(result.rate).toBe(15);
    });

    it('should throw when record not found on update', async () => {
      prismaMock.taxRule.update.mockRejectedValue(new Error('Record not found'));

      await expect(
        repository.update('ghost-id', { rate: 5 }),
      ).rejects.toThrow('Record not found');
    });
  });

  // ─── delete ───────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('should delete the tax rule', async () => {
      prismaMock.taxRule.delete.mockResolvedValue(mockTaxRule as any);

      await repository.delete('tax-uuid-001');

      expect(prismaMock.taxRule.delete).toHaveBeenCalledWith({
        where: { id: 'tax-uuid-001' },
      });
    });

    it('should throw when trying to delete a non-existent rule', async () => {
      prismaMock.taxRule.delete.mockRejectedValue(new Error('Record to delete not found'));

      await expect(repository.delete('ghost-id')).rejects.toThrow('Record to delete not found');
    });
  });

  // ─── findPaginated ────────────────────────────────────────────────────────

  describe('findPaginated', () => {
    it('should return paginated tax rules with count', async () => {
      prismaMock.taxRule.findMany.mockResolvedValue([mockTaxRule] as any);
      prismaMock.taxRule.count.mockResolvedValue(1);

      const result = await repository.findPaginated({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by country', async () => {
      prismaMock.taxRule.findMany.mockResolvedValue([mockTaxRule] as any);
      prismaMock.taxRule.count.mockResolvedValue(1);

      await repository.findPaginated({ page: 1, limit: 10, country: 'GB' });

      expect(prismaMock.taxRule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ country: 'GB' }),
        }),
      );
    });

    it('should filter by isActive when provided', async () => {
      prismaMock.taxRule.findMany.mockResolvedValue([mockTaxRule] as any);
      prismaMock.taxRule.count.mockResolvedValue(1);

      await repository.findPaginated({ page: 1, limit: 10, isActive: true });

      expect(prismaMock.taxRule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: true }),
        }),
      );
    });
  });

  // ─── findDefault ──────────────────────────────────────────────────────────

  describe('findDefault', () => {
    it('should return the default tax rule for a country', async () => {
      prismaMock.taxRule.findFirst.mockResolvedValue(mockTaxRule as any);

      const result = await repository.findDefault('GB');

      expect(prismaMock.taxRule.findFirst).toHaveBeenCalledWith({
        where: { country: 'GB', isDefault: true, isActive: true },
      });
      expect(result?.isDefault).toBe(true);
    });

    it('should return null when no default exists for the country', async () => {
      prismaMock.taxRule.findFirst.mockResolvedValue(null);

      const result = await repository.findDefault('XX');

      expect(result).toBeNull();
    });
  });
});