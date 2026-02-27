import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { setupUnitTest, mockPrismaClient, mockEventProducer, mockLogger, setupPrismaTransactionMock, setupPrismaTransactionError } from '../../src/tests-helpers/setup';
import { OrderService } from '../../src/app/orders/order.service';
import { OrderRepository } from '../../src/app/orders/order.repository';
import { AppError, OrderNotFoundError, OrderNotCancellableError, OrderAlreadyCancelledError, DuplicateOrderError, InventoryUnavailableError } from '../../src/shared/errors';
import { OrderStatus } from '../../src/shared/types';
import {
  ORDER_PENDING_KITCHEN,
  ORDER_PENDING_MIXED,
  ORDER_CONFIRMED,
  ORDER_CANCELLED,
  ORDER_ABANDONED,
  ORDER_ITEMS_KITCHEN_ONLY,
  ORDER_ITEMS_MIXED,
  CUSTOMER_SNAPSHOT_1,
  UK_ADDRESS_LONDON,
} from '../../tests/fixtures';

setupUnitTest();

const mockOrderRepository = {
  findById: jest.fn(),
  findByOrderNumber: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
  count: jest.fn(),
  existsByIdempotencyKey: jest.fn(),
};

jest.mock('../../src/app/orders/order.repository', () => ({
  OrderRepository: jest.fn().mockImplementation(() => mockOrderRepository),
}));

describe('OrderService', () => {
  let orderService: OrderService;

  beforeEach(() => {
    jest.clearAllMocks();
    setupPrismaTransactionMock();
    orderService = new OrderService(
      mockOrderRepository as unknown as OrderRepository,
      mockPrismaClient as any,
      mockEventProducer as any,
      mockLogger as any,
    );
  });

  describe('createOrder', () => {
    const createInput = {
      customerId: CUSTOMER_SNAPSHOT_1.id,
      items: ORDER_ITEMS_KITCHEN_ONLY.map((i) => ({
        productId: i.productId,
        colourId: i.colourId,
        sizeId: i.sizeId,
        quantity: i.quantity,
      })),
      shippingAddress: UK_ADDRESS_LONDON,
      billingAddress: UK_ADDRESS_LONDON,
      couponCode: null,
      appointmentId: null,
      source: 'WEB' as const,
      idempotencyKey: 'test-idem-key-001',
    };

    it('creates an order successfully', async () => {
      mockOrderRepository.existsByIdempotencyKey.mockResolvedValueOnce(false);
      mockOrderRepository.create.mockResolvedValueOnce(ORDER_PENDING_KITCHEN);

      const result = await orderService.createOrder(createInput);

      expect(result).toMatchObject({
        status: OrderStatus.PENDING,
        customerId: CUSTOMER_SNAPSHOT_1.id,
      });
      expect(mockOrderRepository.create).toHaveBeenCalledTimes(1);
      expect(mockEventProducer.publish).toHaveBeenCalledTimes(1);
    });

    it('throws DuplicateOrderError when idempotency key already exists', async () => {
      mockOrderRepository.existsByIdempotencyKey.mockResolvedValueOnce(true);

      await expect(orderService.createOrder(createInput)).rejects.toThrow(DuplicateOrderError);
      expect(mockOrderRepository.create).not.toHaveBeenCalled();
    });

    it('creates mixed kitchen and bedroom order', async () => {
      const mixedInput = {
        ...createInput,
        items: ORDER_ITEMS_MIXED.map((i) => ({
          productId: i.productId,
          colourId: i.colourId,
          sizeId: i.sizeId,
          quantity: i.quantity,
        })),
        idempotencyKey: 'test-idem-key-mixed',
      };
      mockOrderRepository.existsByIdempotencyKey.mockResolvedValueOnce(false);
      mockOrderRepository.create.mockResolvedValueOnce(ORDER_PENDING_MIXED);

      const result = await orderService.createOrder(mixedInput);

      expect(result.id).toBe(ORDER_PENDING_MIXED.id);
      expect(mockEventProducer.publish).toHaveBeenCalledTimes(1);
    });

    it('rolls back transaction and throws on repository failure', async () => {
      const dbError = new Error('DB connection lost');
      mockOrderRepository.existsByIdempotencyKey.mockResolvedValueOnce(false);
      setupPrismaTransactionError(dbError);

      await expect(orderService.createOrder(createInput)).rejects.toThrow();
      expect(mockEventProducer.publish).not.toHaveBeenCalled();
    });
  });

  describe('getOrder', () => {
    it('returns order when found', async () => {
      mockOrderRepository.findById.mockResolvedValueOnce(ORDER_CONFIRMED);

      const result = await orderService.getOrder(ORDER_CONFIRMED.id);

      expect(result).toMatchObject({ id: ORDER_CONFIRMED.id });
      expect(mockOrderRepository.findById).toHaveBeenCalledWith(ORDER_CONFIRMED.id);
    });

    it('throws OrderNotFoundError when order does not exist', async () => {
      mockOrderRepository.findById.mockResolvedValueOnce(null);

      await expect(orderService.getOrder('non-existent-id')).rejects.toThrow(OrderNotFoundError);
    });
  });

  describe('getOrders', () => {
    it('returns paginated orders', async () => {
      mockOrderRepository.findMany.mockResolvedValueOnce([ORDER_PENDING_KITCHEN, ORDER_CONFIRMED]);
      mockOrderRepository.count.mockResolvedValueOnce(2);

      const result = await orderService.getOrders({ page: 1, limit: 20 }, {});

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
    });

    it('returns empty result when no orders match filters', async () => {
      mockOrderRepository.findMany.mockResolvedValueOnce([]);
      mockOrderRepository.count.mockResolvedValueOnce(0);

      const result = await orderService.getOrders({ page: 1, limit: 20 }, { status: OrderStatus.ABANDONED });

      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
      expect(result.meta.hasNextPage).toBe(false);
    });
  });

  describe('cancelOrder', () => {
    const cancelInput = {
      orderId: ORDER_PENDING_KITCHEN.id,
      cancellationReason: 'CUSTOMER_REQUEST',
      cancellationNote: 'Changed mind',
      cancelledByUserId: null,
      initiator: 'CUSTOMER' as const,
    };

    it('cancels a pending order successfully', async () => {
      mockOrderRepository.findById.mockResolvedValueOnce(ORDER_PENDING_KITCHEN);
      const cancelledOrder = { ...ORDER_PENDING_KITCHEN, status: OrderStatus.CANCELLED };
      mockOrderRepository.update.mockResolvedValueOnce(cancelledOrder);

      const result = await orderService.cancelOrder(cancelInput);

      expect(result.status).toBe(OrderStatus.CANCELLED);
      expect(mockEventProducer.publish).toHaveBeenCalledTimes(1);
    });

    it('throws OrderNotFoundError when order does not exist', async () => {
      mockOrderRepository.findById.mockResolvedValueOnce(null);

      await expect(orderService.cancelOrder(cancelInput)).rejects.toThrow(OrderNotFoundError);
    });

    it('throws OrderAlreadyCancelledError when order is already cancelled', async () => {
      mockOrderRepository.findById.mockResolvedValueOnce(ORDER_CANCELLED);

      await expect(orderService.cancelOrder({ ...cancelInput, orderId: ORDER_CANCELLED.id }))
        .rejects.toThrow(OrderAlreadyCancelledError);
    });

    it('throws OrderNotCancellableError when order is in non-cancellable status', async () => {
      const dispatchedOrder = { ...ORDER_CONFIRMED, status: OrderStatus.DISPATCHED };
      mockOrderRepository.findById.mockResolvedValueOnce(dispatchedOrder);

      await expect(orderService.cancelOrder({ ...cancelInput, orderId: dispatchedOrder.id }))
        .rejects.toThrow(OrderNotCancellableError);
    });

    it('throws OrderNotCancellableError when order is abandoned', async () => {
      mockOrderRepository.findById.mockResolvedValueOnce(ORDER_ABANDONED);

      await expect(orderService.cancelOrder({ ...cancelInput, orderId: ORDER_ABANDONED.id }))
        .rejects.toThrow();
    });
  });

  describe('updateOrderStatus', () => {
    it('transitions order from AWAITING_PAYMENT to CONFIRMED', async () => {
      const awaitingOrder = { ...ORDER_PENDING_KITCHEN, status: OrderStatus.AWAITING_PAYMENT };
      mockOrderRepository.findById.mockResolvedValueOnce(awaitingOrder);
      const confirmedOrder = { ...awaitingOrder, status: OrderStatus.CONFIRMED };
      mockOrderRepository.update.mockResolvedValueOnce(confirmedOrder);

      const result = await orderService.updateOrderStatus(awaitingOrder.id, OrderStatus.CONFIRMED);

      expect(result.status).toBe(OrderStatus.CONFIRMED);
    });

    it('throws OrderNotFoundError for non-existent order', async () => {
      mockOrderRepository.findById.mockResolvedValueOnce(null);

      await expect(orderService.updateOrderStatus('bad-id', OrderStatus.CONFIRMED))
        .rejects.toThrow(OrderNotFoundError);
    });
  });
});