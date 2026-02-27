import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { setupUnitTest, mockPrismaClient } from '../../src/tests-helpers/setup';
import { OrderRepository } from '../../src/app/orders/order.repository';
import { OrderStatus } from '../../src/shared/types';
import {
  ORDER_PENDING_KITCHEN,
  ORDER_CONFIRMED,
  ORDER_CANCELLED,
  ALL_ORDERS,
  CUSTOMER_ID_1,
} from '../../tests/fixtures';

setupUnitTest();

describe('OrderRepository', () => {
  let repository: OrderRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new OrderRepository(mockPrismaClient as any);
  });

  describe('findById', () => {
    it('returns order with items and payment when found', async () => {
      mockPrismaClient.order.findUnique.mockResolvedValueOnce(ORDER_PENDING_KITCHEN);

      const result = await repository.findById(ORDER_PENDING_KITCHEN.id);

      expect(result).toMatchObject({ id: ORDER_PENDING_KITCHEN.id });
      expect(mockPrismaClient.order.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: ORDER_PENDING_KITCHEN.id, deletedAt: null } }),
      );
    });

    it('returns null when order does not exist', async () => {
      mockPrismaClient.order.findUnique.mockResolvedValueOnce(null);

      const result = await repository.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findByOrderNumber', () => {
    it('returns order matching order number', async () => {
      mockPrismaClient.order.findFirst.mockResolvedValueOnce(ORDER_CONFIRMED);

      const result = await repository.findByOrderNumber(ORDER_CONFIRMED.orderNumber);

      expect(result).toMatchObject({ orderNumber: ORDER_CONFIRMED.orderNumber });
    });

    it('returns null for unknown order number', async () => {
      mockPrismaClient.order.findFirst.mockResolvedValueOnce(null);

      const result = await repository.findByOrderNumber('LW000UNKNOWN');

      expect(result).toBeNull();
    });
  });

  describe('findMany', () => {
    it('returns all orders without filters', async () => {
      mockPrismaClient.order.findMany.mockResolvedValueOnce(ALL_ORDERS);

      const result = await repository.findMany({ skip: 0, take: 20 }, {});

      expect(result).toHaveLength(ALL_ORDERS.length);
    });

    it('filters orders by customerId', async () => {
      const customerOrders = ALL_ORDERS.filter((o) => o.customerId === CUSTOMER_ID_1);
      mockPrismaClient.order.findMany.mockResolvedValueOnce(customerOrders);

      const result = await repository.findMany({ skip: 0, take: 20 }, { customerId: CUSTOMER_ID_1 });

      expect(mockPrismaClient.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ customerId: CUSTOMER_ID_1 }),
        }),
      );
      expect(result).toHaveLength(customerOrders.length);
    });

    it('filters orders by status array', async () => {
      const pending = ALL_ORDERS.filter((o) => o.status === OrderStatus.PENDING);
      mockPrismaClient.order.findMany.mockResolvedValueOnce(pending);

      await repository.findMany(
        { skip: 0, take: 20 },
        { status: [OrderStatus.PENDING] },
      );

      expect(mockPrismaClient.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: { in: [OrderStatus.PENDING] } }),
        }),
      );
    });

    it('excludes soft-deleted orders', async () => {
      mockPrismaClient.order.findMany.mockResolvedValueOnce([]);

      await repository.findMany({ skip: 0, take: 20 }, {});

      expect(mockPrismaClient.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ deletedAt: null }) }),
      );
    });
  });

  describe('create', () => {
    it('creates order with correct shape', async () => {
      mockPrismaClient.order.create.mockResolvedValueOnce(ORDER_PENDING_KITCHEN);

      const result = await repository.create({
        customerId: ORDER_PENDING_KITCHEN.customerId,
        orderNumber: ORDER_PENDING_KITCHEN.orderNumber,
        status: OrderStatus.PENDING,
        subtotal: ORDER_PENDING_KITCHEN.subtotal,
        shippingCost: ORDER_PENDING_KITCHEN.shippingCost,
        taxAmount: ORDER_PENDING_KITCHEN.taxAmount,
        discountAmount: ORDER_PENDING_KITCHEN.discountAmount,
        totalAmount: ORDER_PENDING_KITCHEN.totalAmount,
        currency: ORDER_PENDING_KITCHEN.currency,
        shippingAddress: ORDER_PENDING_KITCHEN.shippingAddress,
        billingAddress: ORDER_PENDING_KITCHEN.billingAddress,
        couponCode: null,
        appointmentId: null,
        source: 'WEB',
        idempotencyKey: ORDER_PENDING_KITCHEN.idempotencyKey,
      });

      expect(result).toMatchObject({ id: ORDER_PENDING_KITCHEN.id });
      expect(mockPrismaClient.order.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    it('updates order status', async () => {
      const updated = { ...ORDER_PENDING_KITCHEN, status: OrderStatus.CONFIRMED };
      mockPrismaClient.order.update.mockResolvedValueOnce(updated);

      const result = await repository.update(ORDER_PENDING_KITCHEN.id, { status: OrderStatus.CONFIRMED });

      expect(result.status).toBe(OrderStatus.CONFIRMED);
      expect(mockPrismaClient.order.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: ORDER_PENDING_KITCHEN.id } }),
      );
    });
  });

  describe('softDelete', () => {
    it('sets deletedAt timestamp', async () => {
      const deletedOrder = { ...ORDER_CANCELLED, deletedAt: new Date() };
      mockPrismaClient.order.update.mockResolvedValueOnce(deletedOrder);

      await repository.softDelete(ORDER_CANCELLED.id);

      expect(mockPrismaClient.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: ORDER_CANCELLED.id },
          data: expect.objectContaining({ deletedAt: expect.any(Date) }),
        }),
      );
    });
  });

  describe('count', () => {
    it('counts orders matching filters', async () => {
      mockPrismaClient.order.count.mockResolvedValueOnce(5);

      const result = await repository.count({ customerId: CUSTOMER_ID_1 });

      expect(result).toBe(5);
    });
  });

  describe('existsByIdempotencyKey', () => {
    it('returns true when idempotency key exists', async () => {
      mockPrismaClient.order.findFirst.mockResolvedValueOnce(ORDER_PENDING_KITCHEN);

      const result = await repository.existsByIdempotencyKey('idem-kitchen-pending-001');

      expect(result).toBe(true);
    });

    it('returns false when idempotency key does not exist', async () => {
      mockPrismaClient.order.findFirst.mockResolvedValueOnce(null);

      const result = await repository.existsByIdempotencyKey('idem-unknown-key');

      expect(result).toBe(false);
    });
  });
});