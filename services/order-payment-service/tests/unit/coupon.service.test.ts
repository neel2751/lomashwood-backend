import { CouponService } from '../../src/app/orders/order.service';
import { CouponRepository } from '../../src/app/orders/order.repository';
import { AppError } from '../../src/shared/errors';
import { CouponType, CouponStatus } from '@prisma/client';

jest.mock('../../src/app/orders/order.repository');

const MockCouponRepository = CouponRepository as jest.MockedClass<typeof CouponRepository>;

describe('CouponService', () => {
  let service: CouponService;
  let repositoryMock: jest.Mocked<CouponRepository>;

  const mockCoupon = {
    id: 'coupon-uuid-001',
    code: 'LOMASH20',
    description: '20% off your first order',
    type: CouponType.PERCENTAGE,
    value: 20,
    minOrderAmount: 50000,
    maxDiscountAmount: 30000,
    usageLimit: 100,
    usageCount: 5,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    status: CouponStatus.ACTIVE,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    repositoryMock = new MockCouponRepository() as jest.Mocked<CouponRepository>;
    service = new CouponService(repositoryMock);
  });

  // ─── applyCoupon ──────────────────────────────────────────────────────────

  describe('applyCoupon', () => {
    it('should return discounted amount for a valid PERCENTAGE coupon', async () => {
      repositoryMock.findByCode.mockResolvedValue(mockCoupon as any);

      const result = await service.applyCoupon({ code: 'LOMASH20', orderAmount: 100000 });

      expect(result.discountAmount).toBe(20000); // 20% of 100000
      expect(result.finalAmount).toBe(80000);
      expect(result.couponId).toBe('coupon-uuid-001');
    });

    it('should cap the discount at maxDiscountAmount for PERCENTAGE coupons', async () => {
      repositoryMock.findByCode.mockResolvedValue(mockCoupon as any);

      // 20% of 300000 = 60000, but max is 30000
      const result = await service.applyCoupon({ code: 'LOMASH20', orderAmount: 300000 });

      expect(result.discountAmount).toBe(30000);
      expect(result.finalAmount).toBe(270000);
    });

    it('should apply a flat FIXED coupon correctly', async () => {
      const fixedCoupon = { ...mockCoupon, type: CouponType.FIXED, value: 10000, maxDiscountAmount: null };
      repositoryMock.findByCode.mockResolvedValue(fixedCoupon as any);

      const result = await service.applyCoupon({ code: 'LOMASH20', orderAmount: 80000 });

      expect(result.discountAmount).toBe(10000);
      expect(result.finalAmount).toBe(70000);
    });

    it('should throw AppError when coupon code does not exist', async () => {
      repositoryMock.findByCode.mockResolvedValue(null);

      await expect(
        service.applyCoupon({ code: 'INVALID_CODE', orderAmount: 100000 }),
      ).rejects.toThrow(AppError);
    });

    it('should throw AppError when coupon is INACTIVE', async () => {
      repositoryMock.findByCode.mockResolvedValue({
        ...mockCoupon,
        status: CouponStatus.INACTIVE,
      } as any);

      await expect(
        service.applyCoupon({ code: 'LOMASH20', orderAmount: 100000 }),
      ).rejects.toThrow(AppError);
    });

    it('should throw AppError when coupon has expired', async () => {
      repositoryMock.findByCode.mockResolvedValue({
        ...mockCoupon,
        expiresAt: new Date(Date.now() - 1000),
      } as any);

      await expect(
        service.applyCoupon({ code: 'LOMASH20', orderAmount: 100000 }),
      ).rejects.toThrow(AppError);
    });

    it('should throw AppError when orderAmount is below minOrderAmount', async () => {
      repositoryMock.findByCode.mockResolvedValue(mockCoupon as any);

      await expect(
        service.applyCoupon({ code: 'LOMASH20', orderAmount: 20000 }),
      ).rejects.toThrow(AppError);
    });

    it('should throw AppError when usageLimit has been reached', async () => {
      repositoryMock.findByCode.mockResolvedValue({
        ...mockCoupon,
        usageLimit: 5,
        usageCount: 5,
      } as any);

      await expect(
        service.applyCoupon({ code: 'LOMASH20', orderAmount: 100000 }),
      ).rejects.toThrow(AppError);
    });
  });

  // ─── createCoupon ─────────────────────────────────────────────────────────

  describe('createCoupon', () => {
    it('should create and return a new coupon', async () => {
      repositoryMock.findByCode.mockResolvedValue(null);
      repositoryMock.create.mockResolvedValue(mockCoupon as any);

      const result = await service.createCoupon({
        code: 'LOMASH20',
        description: '20% off your first order',
        type: CouponType.PERCENTAGE,
        value: 20,
        minOrderAmount: 50000,
        maxDiscountAmount: 30000,
        usageLimit: 100,
        expiresAt: mockCoupon.expiresAt,
      });

      expect(repositoryMock.create).toHaveBeenCalledTimes(1);
      expect(result.code).toBe('LOMASH20');
    });

    it('should throw AppError if coupon code already exists', async () => {
      repositoryMock.findByCode.mockResolvedValue(mockCoupon as any);

      await expect(
        service.createCoupon({
          code: 'LOMASH20',
          type: CouponType.PERCENTAGE,
          value: 20,
        }),
      ).rejects.toThrow(AppError);
    });

    it('should throw AppError if PERCENTAGE value exceeds 100', async () => {
      repositoryMock.findByCode.mockResolvedValue(null);

      await expect(
        service.createCoupon({
          code: 'BAD_COUPON',
          type: CouponType.PERCENTAGE,
          value: 150,
        }),
      ).rejects.toThrow(AppError);
    });
  });

  // ─── deactivateCoupon ─────────────────────────────────────────────────────

  describe('deactivateCoupon', () => {
    it('should deactivate an active coupon', async () => {
      const deactivated = { ...mockCoupon, status: CouponStatus.INACTIVE };
      repositoryMock.findById.mockResolvedValue(mockCoupon as any);
      repositoryMock.update.mockResolvedValue(deactivated as any);

      const result = await service.deactivateCoupon('coupon-uuid-001');

      expect(repositoryMock.update).toHaveBeenCalledWith('coupon-uuid-001', {
        status: CouponStatus.INACTIVE,
      });
      expect(result.status).toBe(CouponStatus.INACTIVE);
    });

    it('should throw AppError when coupon not found', async () => {
      repositoryMock.findById.mockResolvedValue(null);

      await expect(service.deactivateCoupon('ghost-id')).rejects.toThrow(AppError);
    });
  });

  // ─── incrementUsage ───────────────────────────────────────────────────────

  describe('incrementUsage', () => {
    it('should increment the usageCount by 1', async () => {
      const incremented = { ...mockCoupon, usageCount: 6 };
      repositoryMock.incrementUsage.mockResolvedValue(incremented as any);

      const result = await service.incrementUsage('coupon-uuid-001');

      expect(repositoryMock.incrementUsage).toHaveBeenCalledWith('coupon-uuid-001');
      expect(result.usageCount).toBe(6);
    });
  });

  // ─── listCoupons ──────────────────────────────────────────────────────────

  describe('listCoupons', () => {
    it('should return a paginated list of coupons', async () => {
      repositoryMock.findPaginated.mockResolvedValue({
        data: [mockCoupon] as any,
        total: 1,
        page: 1,
        limit: 10,
      });

      const result = await service.listCoupons({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by status when provided', async () => {
      repositoryMock.findPaginated.mockResolvedValue({
        data: [mockCoupon] as any,
        total: 1,
        page: 1,
        limit: 10,
      });

      await service.listCoupons({ page: 1, limit: 10, status: CouponStatus.ACTIVE });

      expect(repositoryMock.findPaginated).toHaveBeenCalledWith(
        expect.objectContaining({ status: CouponStatus.ACTIVE }),
      );
    });
  });
});