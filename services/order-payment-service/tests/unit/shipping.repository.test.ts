import { ShippingRepository } from '../../src/app/orders/order.repository';
import { PrismaClient, ShippingMethod, ShippingStatus } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

jest.mock('../../src/infrastructure/db/prisma.client', () => ({
  prisma: mockDeep<PrismaClient>(),
}));

import { prisma } from '../../src/infrastructure/db/prisma.client';

const prismaMock = prisma as DeepMockProxy<PrismaClient>;

describe('ShippingRepository', () => {
  let repository: ShippingRepository;

  const mockShippingRate = {
    id: 'ship-rate-uuid-001',
    name: 'Standard Delivery',
    description: '3-5 business days',
    method: ShippingMethod.STANDARD,
    price: 995,
    freeThreshold: 50000,
    estimatedDays: 5,
    isActive: true,
    countries: ['GB'],
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  const mockShipping = {
    id: 'ship-uuid-001',
    orderId: 'order-uuid-001',
    rateId: 'ship-rate-uuid-001',
    trackingNumber: null,
    carrier: null,
    status: ShippingStatus.PENDING,
    address: {
      line1: '123 High Street',
      city: 'London',
      postcode: 'SW1A 1AA',
      country: 'GB',
    },
    estimatedDelivery: new Date('2026-02-01'),
    shippedAt: null,
    deliveredAt: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new ShippingRepository();
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should create a shipping record and return it', async () => {
      prismaMock.shipping.create.mockResolvedValue(mockShipping as any);

      const result = await repository.create({
        orderId: 'order-uuid-001',
        rateId: 'ship-rate-uuid-001',
        address: {
          line1: '123 High Street',
          city: 'London',
          postcode: 'SW1A 1AA',
          country: 'GB',
        },
        estimatedDelivery: new Date('2026-02-01'),
      });

      expect(prismaMock.shipping.create).toHaveBeenCalledTimes(1);
      expect(result.orderId).toBe('order-uuid-001');
      expect(result.status).toBe(ShippingStatus.PENDING);
    });

    it('should throw on DB error during create', async () => {
      prismaMock.shipping.create.mockRejectedValue(new Error('DB error'));

      await expect(
        repository.create({
          orderId: 'x',
          rateId: 'y',
          address: { line1: '', city: '', postcode: '', country: '' },
          estimatedDelivery: new Date(),
        }),
      ).rejects.toThrow('DB error');
    });
  });

  // ─── findById ─────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('should return the shipping record including rate details', async () => {
      prismaMock.shipping.findUnique.mockResolvedValue({
        ...mockShipping,
        rate: mockShippingRate,
      } as any);

      const result = await repository.findById('ship-uuid-001');

      expect(prismaMock.shipping.findUnique).toHaveBeenCalledWith({
        where: { id: 'ship-uuid-001' },
        include: { rate: true },
      });
      expect(result?.id).toBe('ship-uuid-001');
    });

    it('should return null when not found', async () => {
      prismaMock.shipping.findUnique.mockResolvedValue(null);

      const result = await repository.findById('ghost-id');

      expect(result).toBeNull();
    });
  });

  // ─── findByOrderId ────────────────────────────────────────────────────────

  describe('findByOrderId', () => {
    it('should return the shipping record for the given orderId', async () => {
      prismaMock.shipping.findFirst.mockResolvedValue(mockShipping as any);

      const result = await repository.findByOrderId('order-uuid-001');

      expect(prismaMock.shipping.findFirst).toHaveBeenCalledWith({
        where: { orderId: 'order-uuid-001' },
        include: expect.any(Object),
      });
      expect(result?.orderId).toBe('order-uuid-001');
    });

    it('should return null when no shipping record exists for orderId', async () => {
      prismaMock.shipping.findFirst.mockResolvedValue(null);

      const result = await repository.findByOrderId('no-order');

      expect(result).toBeNull();
    });
  });

  // ─── update ───────────────────────────────────────────────────────────────

  describe('update', () => {
    it('should update the shipping record', async () => {
      const updated = { ...mockShipping, trackingNumber: 'TRACK123', status: ShippingStatus.SHIPPED };
      prismaMock.shipping.update.mockResolvedValue(updated as any);

      const result = await repository.update('ship-uuid-001', {
        trackingNumber: 'TRACK123',
        status: ShippingStatus.SHIPPED,
      });

      expect(prismaMock.shipping.update).toHaveBeenCalledWith({
        where: { id: 'ship-uuid-001' },
        data: expect.objectContaining({
          trackingNumber: 'TRACK123',
          status: ShippingStatus.SHIPPED,
        }),
      });
      expect(result.trackingNumber).toBe('TRACK123');
    });

    it('should throw when record not found on update', async () => {
      prismaMock.shipping.update.mockRejectedValue(new Error('Record not found'));

      await expect(
        repository.update('ghost-id', { status: ShippingStatus.DELIVERED }),
      ).rejects.toThrow('Record not found');
    });
  });

  // ─── findAvailableRates ───────────────────────────────────────────────────

  describe('findAvailableRates', () => {
    it('should return active shipping rates available for a country', async () => {
      prismaMock.shippingRate.findMany.mockResolvedValue([mockShippingRate] as any);

      const result = await repository.findAvailableRates({ country: 'GB' });

      expect(prismaMock.shippingRate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
            countries: { has: 'GB' },
          }),
        }),
      );
      expect(result).toHaveLength(1);
    });

    it('should return empty array when no active rates exist for country', async () => {
      prismaMock.shippingRate.findMany.mockResolvedValue([]);

      const result = await repository.findAvailableRates({ country: 'XX' });

      expect(result).toEqual([]);
    });

    it('should filter by method when provided', async () => {
      prismaMock.shippingRate.findMany.mockResolvedValue([mockShippingRate] as any);

      await repository.findAvailableRates({ country: 'GB', method: ShippingMethod.STANDARD });

      expect(prismaMock.shippingRate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ method: ShippingMethod.STANDARD }),
        }),
      );
    });
  });

  // ─── findRateById ─────────────────────────────────────────────────────────

  describe('findRateById', () => {
    it('should return the shipping rate by id', async () => {
      prismaMock.shippingRate.findUnique.mockResolvedValue(mockShippingRate as any);

      const result = await repository.findRateById('ship-rate-uuid-001');

      expect(result?.id).toBe('ship-rate-uuid-001');
    });

    it('should return null when rate not found', async () => {
      prismaMock.shippingRate.findUnique.mockResolvedValue(null);

      const result = await repository.findRateById('ghost-rate-id');

      expect(result).toBeNull();
    });
  });

  // ─── findPaginated ────────────────────────────────────────────────────────

  describe('findPaginated', () => {
    it('should return paginated shipments with total count', async () => {
      prismaMock.shipping.findMany.mockResolvedValue([mockShipping] as any);
      prismaMock.shipping.count.mockResolvedValue(1);

      const result = await repository.findPaginated({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should filter by status when provided', async () => {
      prismaMock.shipping.findMany.mockResolvedValue([mockShipping] as any);
      prismaMock.shipping.count.mockResolvedValue(1);

      await repository.findPaginated({ page: 1, limit: 10, status: ShippingStatus.PENDING });

      expect(prismaMock.shipping.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: ShippingStatus.PENDING }),
        }),
      );
    });

    it('should compute correct skip for page 2', async () => {
      prismaMock.shipping.findMany.mockResolvedValue([] as any);
      prismaMock.shipping.count.mockResolvedValue(15);

      await repository.findPaginated({ page: 2, limit: 5 });

      expect(prismaMock.shipping.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 5, take: 5 }),
      );
    });
  });
});