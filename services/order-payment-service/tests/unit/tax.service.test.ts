import { TaxService } from '../../src/app/orders/order.service';
import { TaxRepository } from '../../src/app/orders/order.repository';
import { AppError } from '../../src/shared/errors';
import { TaxType } from '@prisma/client';

jest.mock('../../src/app/orders/order.repository');

const MockTaxRepository = TaxRepository as jest.MockedClass<typeof TaxRepository>;

describe('TaxService', () => {
  let service: TaxService;
  let repositoryMock: jest.Mocked<TaxRepository>;

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
    repositoryMock = new MockTaxRepository() as jest.Mocked<TaxRepository>;
    service = new TaxService(repositoryMock);
  });

  // ─── calculateTax ─────────────────────────────────────────────────────────

  describe('calculateTax', () => {
    it('should correctly calculate 20% VAT on a given amount', async () => {
      repositoryMock.findApplicableRule.mockResolvedValue(mockTaxRule as any);

      const result = await service.calculateTax({
        amount: 100000,
        country: 'GB',
        category: 'GENERAL',
      });

      expect(result.taxAmount).toBe(20000);
      expect(result.taxRate).toBe(20);
      expect(result.taxRuleId).toBe('tax-uuid-001');
      expect(result.totalWithTax).toBe(120000);
    });

    it('should return zero tax when no applicable rule is found', async () => {
      repositoryMock.findApplicableRule.mockResolvedValue(null);

      const result = await service.calculateTax({
        amount: 100000,
        country: 'US',
        category: 'EXEMPT',
      });

      expect(result.taxAmount).toBe(0);
      expect(result.taxRate).toBe(0);
      expect(result.taxRuleId).toBeNull();
    });

    it('should handle FIXED tax type correctly', async () => {
      const fixedRule = { ...mockTaxRule, type: TaxType.FIXED, rate: 5000 };
      repositoryMock.findApplicableRule.mockResolvedValue(fixedRule as any);

      const result = await service.calculateTax({
        amount: 200000,
        country: 'GB',
        category: 'GENERAL',
      });

      expect(result.taxAmount).toBe(5000);
      expect(result.totalWithTax).toBe(205000);
    });

    it('should use region-specific rule when region is provided', async () => {
      const regionRule = { ...mockTaxRule, id: 'tax-uuid-region', region: 'ENGLAND', rate: 20 };
      repositoryMock.findApplicableRule.mockResolvedValue(regionRule as any);

      const result = await service.calculateTax({
        amount: 100000,
        country: 'GB',
        region: 'ENGLAND',
        category: 'GENERAL',
      });

      expect(result.taxRuleId).toBe('tax-uuid-region');
    });

    it('should throw AppError when amount is negative', async () => {
      await expect(
        service.calculateTax({ amount: -1000, country: 'GB', category: 'GENERAL' }),
      ).rejects.toThrow(AppError);
    });
  });

  // ─── createTaxRule ────────────────────────────────────────────────────────

  describe('createTaxRule', () => {
    it('should create and return a new tax rule', async () => {
      repositoryMock.create.mockResolvedValue(mockTaxRule as any);

      const result = await service.createTaxRule({
        name: 'UK Standard VAT',
        type: TaxType.PERCENTAGE,
        rate: 20,
        country: 'GB',
        category: 'GENERAL',
        isDefault: true,
      });

      expect(repositoryMock.create).toHaveBeenCalledTimes(1);
      expect(result.rate).toBe(20);
    });

    it('should throw AppError if PERCENTAGE rate exceeds 100', async () => {
      await expect(
        service.createTaxRule({
          name: 'Invalid',
          type: TaxType.PERCENTAGE,
          rate: 110,
          country: 'GB',
          category: 'GENERAL',
        }),
      ).rejects.toThrow(AppError);
    });

    it('should throw AppError if FIXED rate is negative', async () => {
      await expect(
        service.createTaxRule({
          name: 'Negative Tax',
          type: TaxType.FIXED,
          rate: -500,
          country: 'GB',
          category: 'GENERAL',
        }),
      ).rejects.toThrow(AppError);
    });
  });

  // ─── updateTaxRule ────────────────────────────────────────────────────────

  describe('updateTaxRule', () => {
    it('should update and return the modified tax rule', async () => {
      const updated = { ...mockTaxRule, rate: 15 };
      repositoryMock.findById.mockResolvedValue(mockTaxRule as any);
      repositoryMock.update.mockResolvedValue(updated as any);

      const result = await service.updateTaxRule('tax-uuid-001', { rate: 15 });

      expect(result.rate).toBe(15);
    });

    it('should throw AppError when rule not found', async () => {
      repositoryMock.findById.mockResolvedValue(null);

      await expect(
        service.updateTaxRule('ghost-id', { rate: 5 }),
      ).rejects.toThrow(AppError);
    });
  });

  // ─── deactivateTaxRule ────────────────────────────────────────────────────

  describe('deactivateTaxRule', () => {
    it('should deactivate an active rule', async () => {
      const deactivated = { ...mockTaxRule, isActive: false };
      repositoryMock.findById.mockResolvedValue(mockTaxRule as any);
      repositoryMock.update.mockResolvedValue(deactivated as any);

      const result = await service.deactivateTaxRule('tax-uuid-001');

      expect(repositoryMock.update).toHaveBeenCalledWith('tax-uuid-001', { isActive: false });
      expect(result.isActive).toBe(false);
    });

    it('should throw AppError if rule not found', async () => {
      repositoryMock.findById.mockResolvedValue(null);

      await expect(service.deactivateTaxRule('ghost-id')).rejects.toThrow(AppError);
    });
  });

  // ─── listTaxRules ─────────────────────────────────────────────────────────

  describe('listTaxRules', () => {
    it('should return paginated list of tax rules', async () => {
      repositoryMock.findPaginated.mockResolvedValue({
        data: [mockTaxRule] as any,
        total: 1,
        page: 1,
        limit: 10,
      });

      const result = await service.listTaxRules({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by country when provided', async () => {
      repositoryMock.findPaginated.mockResolvedValue({
        data: [mockTaxRule] as any,
        total: 1,
        page: 1,
        limit: 10,
      });

      await service.listTaxRules({ page: 1, limit: 10, country: 'GB' });

      expect(repositoryMock.findPaginated).toHaveBeenCalledWith(
        expect.objectContaining({ country: 'GB' }),
      );
    });
  });

  // ─── getApplicableRateForOrder ────────────────────────────────────────────

  describe('getApplicableRateForOrder', () => {
    it('should return the applicable tax rate as a decimal', async () => {
      repositoryMock.findApplicableRule.mockResolvedValue(mockTaxRule as any);

      const rate = await service.getApplicableRateForOrder({ country: 'GB', category: 'GENERAL' });

      expect(rate).toBe(20);
    });

    it('should return 0 when no applicable rule is found', async () => {
      repositoryMock.findApplicableRule.mockResolvedValue(null);

      const rate = await service.getApplicableRateForOrder({ country: 'US', category: 'NONE' });

      expect(rate).toBe(0);
    });
  });
});