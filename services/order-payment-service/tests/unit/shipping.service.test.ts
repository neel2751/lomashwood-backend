import { ShippingService } from '../../src/app/orders/order.service';
import { ShippingRepository } from '../../src/app/orders/order.repository';
import { AppError } from '../../src/shared/errors';
import { ShippingMethod, ShippingStatus } from '@prisma/client';

jest.mock('../../src/app/orders/order.repository');

const MockShippingRepository = ShippingRepository as jest.MockedClass<typeof ShippingRepository>;

describe('ShippingService', () => {
  let service: ShippingService;
  let repositoryMock: jest.Mocked<ShippingRepository>;

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
    repositoryMock = new MockShippingRepository() as jest.Mocked<ShippingRepository>;
    service = new ShippingService(repositoryMock);
  });

  // ─── calculateShipping ────────────────────────────────────────────────────

  describe('calculateShipping', () => {
    it('should return 0 cost when order qualifies for free shipping', async () => {
      repositoryMock.findAvailableRates.mockResolvedValue([mockShippingRate] as any);

      const result = await service.calculateShipping({
        orderAmount: 60000,
        country: 'GB',
        method: ShippingMethod.STANDARD,
      });

      expect(result.cost).toBe(0);
      expect(result.isFree).toBe(true);
      expect(result.rateId).toBe('ship-rate-uuid-001');
    });

    it('should return the standard rate when order does not meet free threshold', async () => {
      repositoryMock.findAvailableRates.mockResolvedValue([mockShippingRate] as any);

      const result = await service.calculateShipping({
        orderAmount: 30000,
        country: 'GB',
        method: ShippingMethod.STANDARD,
      });

      expect(result.cost).toBe(995);
      expect(result.isFree).toBe(false);
    });

    it('should throw AppError when no shipping rate is available for the country', async () => {
      repositoryMock.findAvailableRates.mockResolvedValue([]);

      await expect(
        service.calculateShipping({
          orderAmount: 10000,
          country: 'XX',
          method: ShippingMethod.STANDARD,
        }),
      ).rejects.toThrow(AppError);
    });

    it('should calculate correctly for EXPRESS method', async () => {
      const expressRate = { ...mockShippingRate, id: 'ship-rate-uuid-002', method: ShippingMethod.EXPRESS, price: 2995, estimatedDays: 1 };
      repositoryMock.findAvailableRates.mockResolvedValue([expressRate] as any);

      const result = await service.calculateShipping({
        orderAmount: 10000,
        country: 'GB',
        method: ShippingMethod.EXPRESS,
      });

      expect(result.cost).toBe(2995);
      expect(result.estimatedDays).toBe(1);
    });
  });

  // ─── createShipment ───────────────────────────────────────────────────────

  describe('createShipment', () => {
    it('should create a shipment record for an order', async () => {
      repositoryMock.create.mockResolvedValue(mockShipping as any);

      const result = await service.createShipment({
        orderId: 'order-uuid-001',
        rateId: 'ship-rate-uuid-001',
        address: {
          line1: '123 High Street',
          city: 'London',
          postcode: 'SW1A 1AA',
          country: 'GB',
        },
      });

      expect(repositoryMock.create).toHaveBeenCalledTimes(1);
      expect(result.orderId).toBe('order-uuid-001');
      expect(result.status).toBe(ShippingStatus.PENDING);
    });

    it('should throw AppError when rateId is invalid', async () => {
      repositoryMock.findRateById.mockResolvedValue(null);

      await expect(
        service.createShipment({
          orderId: 'order-uuid-001',
          rateId: 'invalid-rate',
          address: { line1: '123 High Street', city: 'London', postcode: 'SW1A 1AA', country: 'GB' },
        }),
      ).rejects.toThrow(AppError);
    });
  });

  // ─── updateTrackingInfo ───────────────────────────────────────────────────

  describe('updateTrackingInfo', () => {
    it('should update tracking number and carrier', async () => {
      const updated = { ...mockShipping, trackingNumber: 'TRACK123', carrier: 'DPD', status: ShippingStatus.SHIPPED };
      repositoryMock.findById.mockResolvedValue(mockShipping as any);
      repositoryMock.update.mockResolvedValue(updated as any);

      const result = await service.updateTrackingInfo('ship-uuid-001', {
        trackingNumber: 'TRACK123',
        carrier: 'DPD',
      });

      expect(result.trackingNumber).toBe('TRACK123');
      expect(result.status).toBe(ShippingStatus.SHIPPED);
    });

    it('should throw AppError when shipment not found', async () => {
      repositoryMock.findById.mockResolvedValue(null);

      await expect(
        service.updateTrackingInfo('ghost-id', { trackingNumber: 'X', carrier: 'Y' }),
      ).rejects.toThrow(AppError);
    });
  });

  // ─── markDelivered ────────────────────────────────────────────────────────

  describe('markDelivered', () => {
    it('should mark the shipment as DELIVERED and set deliveredAt', async () => {
      const shipped = { ...mockShipping, status: ShippingStatus.SHIPPED, trackingNumber: 'TRACK123' };
      const delivered = { ...shipped, status: ShippingStatus.DELIVERED, deliveredAt: new Date() };
      repositoryMock.findById.mockResolvedValue(shipped as any);
      repositoryMock.update.mockResolvedValue(delivered as any);

      const result = await service.markDelivered('ship-uuid-001');

      expect(result.status).toBe(ShippingStatus.DELIVERED);
      expect(result.deliveredAt).not.toBeNull();
    });

    it('should throw AppError if shipment is not in SHIPPED status', async () => {
      repositoryMock.findById.mockResolvedValue(mockShipping as any); // PENDING

      await expect(service.markDelivered('ship-uuid-001')).rejects.toThrow(AppError);
    });
  });

  // ─── getAvailableMethods ──────────────────────────────────────────────────

  describe('getAvailableMethods', () => {
    it('should return all active shipping rates for a given country', async () => {
      const expressRate = { ...mockShippingRate, id: 'ship-rate-uuid-002', method: ShippingMethod.EXPRESS };
      repositoryMock.findAvailableRates.mockResolvedValue([mockShippingRate, expressRate] as any);

      const result = await service.getAvailableMethods({ country: 'GB', orderAmount: 10000 });

      expect(result).toHaveLength(2);
    });

    it('should mark free shipping methods correctly based on orderAmount', async () => {
      repositoryMock.findAvailableRates.mockResolvedValue([mockShippingRate] as any);

      const result = await service.getAvailableMethods({ country: 'GB', orderAmount: 60000 });

      expect(result[0].effectiveCost).toBe(0);
      expect(result[0].isFree).toBe(true);
    });

    it('should return empty array when no rates are configured for the country', async () => {
      repositoryMock.findAvailableRates.mockResolvedValue([]);

      const result = await service.getAvailableMethods({ country: 'XX', orderAmount: 10000 });

      expect(result).toEqual([]);
    });
  });

  // ─── listShipments ────────────────────────────────────────────────────────

  describe('listShipments', () => {
    it('should return paginated shipments', async () => {
      repositoryMock.findPaginated.mockResolvedValue({
        data: [mockShipping] as any,
        total: 1,
        page: 1,
        limit: 10,
      });

      const result = await service.listShipments({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });
});