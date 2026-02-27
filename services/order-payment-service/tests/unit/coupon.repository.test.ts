import { CouponRepository } from '../../src/app/orders/order.repository';
import { PrismaClient, CouponType, CouponStatus } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

jest.mock('../../src/infrastructure/db/prisma.client', () => ({
  prisma: mockDeep<PrismaClient>(),
}));

import { prisma } from '../../src/infrastructure/db/prisma.client';

const prismaMock = prisma as DeepMockProxy<PrismaClient>;

describe('CouponRepository', () => {
  let repository: CouponRepository;

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
    repository = new CouponRepository();
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should create a new coupon and return it', async () => {
      prismaMock.coupon.create.mockResolvedValue(mockCoupon as any);

      const result = await repository.create({
        code: 'LOMASH20',
        type: CouponType.PERCENTAGE,
        value: 20,
        minOrderAmount: 50000,
        maxDiscountAmount: 30000,
        usageLimit: 100,
        expiresAt: mockCoupon.expiresAt,
      });

      expect(prismaMock.coupon.create).toHaveBeenCalledTimes(1);
      expect(result.code).toBe('LOMASH20');
      expect(result.type).toBe(CouponType.PERCENTAGE);
    });

    it('should throw on duplicate code (unique constraint)', async () => {
      prismaMock.coupon.create.mockRejectedValue(
        new Error('Unique constraint failed on field: code'),
      );

      await expect(
        repository.create({ code: 'LOMASH20', type: CouponType.PERCENTAGE, value: 20 }),
      ).rejects.toThrow('Unique constraint failed');
    });
  });

  // ─── findById ─────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('should return the coupon when found', async () => {
      prismaMock.coupon.findUnique.mockResolvedValue(mockCoupon as any);

      const result = await repository.findById('coupon-uuid-001');

      expect(prismaMock.coupon.findUnique).toHaveBeenCalledWith({
        where: { id: 'coupon-uuid-001' },
      });
      expect(result?.id).toBe('coupon-uuid-001');
    });

    it('should return null when coupon is not found', async () => {
      prismaMock.coupon.findUnique.mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  // ─── findByCode ───────────────────────────────────────────────────────────

  describe('findByCode', () => {
    it('should return the coupon matching the given code', async () => {
      prismaMock.coupon.findFirst.mockResolvedValue(mockCoupon as any);

      const result = await repository.findByCode('LOMASH20');

      expect(prismaMock.coupon.findFirst).toHaveBeenCalledWith({
        where: { code: 'LOMASH20' },
      });
      expect(result?.code).toBe('LOMASH20');
    });

    it('should return null when code is not found', async () => {
      prismaMock.coupon.findFirst.mockResolvedValue(null);

      const result = await repository.findByCode('DOES_NOT_EXIST');

      expect(result).toBeNull();
    });
  });

  // ─── update ───────────────────────────────────────────────────────────────

  describe('update', () => {
    it('should update a coupon and return the updated record', async () => {
      const updated = { ...mockCoupon, status: CouponStatus.INACTIVE };
      prismaMock.coupon.update.mockResolvedValue(updated as any);

      const result = await repository.update('coupon-uuid-001', { status: CouponStatus.INACTIVE });

      expect(prismaMock.coupon.update).toHaveBeenCalledWith({
        where: { id: 'coupon-uuid-001' },
        data: expect.objectContaining({ status: CouponStatus.INACTIVE }),
      });
      expect(result.status).toBe(CouponStatus.INACTIVE);
    });

    it('should throw if the coupon does not exist', async () => {
      prismaMock.coupon.update.mockRejectedValue(new Error('Record not found'));

      await expect(
        repository.update('ghost-id', { status: CouponStatus.INACTIVE }),
      ).rejects.toThrow('Record not found');
    });
  });

  // ─── incrementUsage ───────────────────────────────────────────────────────

  describe('incrementUsage', () => {
    it('should atomically increment usageCount by 1', async () => {
      const incremented = { ...mockCoupon, usageCount: 6 };
      prismaMock.coupon.update.mockResolvedValue(incremented as any);

      const result = await repository.incrementUsage('coupon-uuid-001');

      expect(prismaMock.coupon.update).toHaveBeenCalledWith({
        where: { id: 'coupon-uuid-001' },
        data: { usageCount: { increment: 1 } },
      });
      expect(result.usageCount).toBe(6);
    });
  });

  // ─── delete ───────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('should delete the coupon by id', async () => {
      prismaMock.coupon.delete.mockResolvedValue(mockCoupon as any);

      await repository.delete('coupon-uuid-001');

      expect(prismaMock.coupon.delete).toHaveBeenCalledWith({
        where: { id: 'coupon-uuid-001' },
      });
    });

    it('should throw if coupon not found on delete', async () => {
      prismaMock.coupon.delete.mockRejectedValue(new Error('Record to delete not found'));

      await expect(repository.delete('ghost-id')).rejects.toThrow('Record to delete not found');
    });
  });

  // ─── findPaginated ────────────────────────────────────────────────────────

  describe('findPaginated', () => {
    it('should return paginated results with total count', async () => {
      prismaMock.coupon.findMany.mockResolvedValue([mockCoupon] as any);
      prismaMock.coupon.count.mockResolvedValue(1);

      const result = await repository.findPaginated({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should filter by status when provided', async () => {
      prismaMock.coupon.findMany.mockResolvedValue([mockCoupon] as any);
      prismaMock.coupon.count.mockResolvedValue(1);

      await repository.findPaginated({ page: 1, limit: 10, status: CouponStatus.ACTIVE });

      expect(prismaMock.coupon.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: CouponStatus.ACTIVE }),
        }),
      );
    });

    it('should apply skip based on page and limit', async () => {
      prismaMock.coupon.findMany.mockResolvedValue([] as any);
      prismaMock.coupon.count.mockResolvedValue(20);

      await repository.findPaginated({ page: 3, limit: 5 });

      expect(prismaMock.coupon.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 5 }),
      );
    });
  });

  // ─── findActive ───────────────────────────────────────────────────────────

  describe('findActive', () => {
    it('should return only active, non-expired coupons within usage limits', async () => {
      prismaMock.coupon.findMany.mockResolvedValue([mockCoupon] as any);

      const result = await repository.findActive();

      expect(prismaMock.coupon.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: CouponStatus.ACTIVE,
            expiresAt: expect.objectContaining({ gt: expect.any(Date) }),
          }),
        }),
      );
      expect(result).toHaveLength(1);
    });
  });
});