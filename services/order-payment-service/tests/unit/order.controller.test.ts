import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { setupUnitTest } from '../../src/tests-helpers/setup';
import { createMockRequest, createMockResponse, createMockNext, mockOrderService } from '../../src/tests-helpers/mocks';
import { OrderController } from '../../src/app/orders/order.controller';
import { OrderNotFoundError, ValidationError } from '../../src/shared/errors';
import { OrderStatus } from '../../src/shared/types';
import { HTTP_STATUS } from '../../src/shared/constants';
import {
  ORDER_PENDING_KITCHEN,
  ORDER_CONFIRMED,
  ALL_ORDERS,
  CUSTOMER_SNAPSHOT_1,
  UK_ADDRESS_LONDON,
  ORDER_ITEMS_KITCHEN_ONLY,
} from '../../tests/fixtures';

setupUnitTest();

jest.mock('../../src/app/orders/order.service', () => ({
  OrderService: jest.fn().mockImplementation(() => mockOrderService),
}));

describe('OrderController', () => {
  let controller: OrderController;
  let req: ReturnType<typeof createMockRequest>;
  let res: ReturnType<typeof createMockResponse>;
  let next: ReturnType<typeof createMockNext>;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new OrderController(mockOrderService as any);
    req = createMockRequest();
    res = createMockResponse();
    next = createMockNext();
  });

  describe('createOrder', () => {
    it('responds 201 with created order', async () => {
      req.body = {
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
      };
      req.user = { id: CUSTOMER_SNAPSHOT_1.id };
      mockOrderService.createOrder.mockResolvedValueOnce(ORDER_PENDING_KITCHEN);

      await controller.createOrder(req as any, res as any, next);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.CREATED);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ id: ORDER_PENDING_KITCHEN.id }) }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('calls next with error on service failure', async () => {
      req.body = {
        items: [],
        shippingAddress: UK_ADDRESS_LONDON,
        billingAddress: UK_ADDRESS_LONDON,
      };
      req.user = { id: CUSTOMER_SNAPSHOT_1.id };
      const error = new ValidationError('Items are required', { items: ['At least one item is required'] });
      mockOrderService.createOrder.mockRejectedValueOnce(error);

      await controller.createOrder(req as any, res as any, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('getOrder', () => {
    it('responds 200 with order data', async () => {
      req.params = { id: ORDER_CONFIRMED.id };
      mockOrderService.getOrder.mockResolvedValueOnce(ORDER_CONFIRMED);

      await controller.getOrder(req as any, res as any, next);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ id: ORDER_CONFIRMED.id }) }),
      );
    });

    it('calls next with OrderNotFoundError when order missing', async () => {
      req.params = { id: 'non-existent-id' };
      const error = new OrderNotFoundError('non-existent-id');
      mockOrderService.getOrder.mockRejectedValueOnce(error);

      await controller.getOrder(req as any, res as any, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getOrders', () => {
    it('responds 200 with paginated orders', async () => {
      req.query = { page: '1', limit: '20' };
      mockOrderService.getOrders.mockResolvedValueOnce({
        data: [ORDER_PENDING_KITCHEN, ORDER_CONFIRMED],
        meta: { page: 1, limit: 20, total: 2, totalPages: 1, hasNextPage: false, hasPrevPage: false },
      });

      await controller.getOrders(req as any, res as any, next);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([expect.objectContaining({ id: ORDER_PENDING_KITCHEN.id })]),
          meta: expect.objectContaining({ total: 2 }),
        }),
      );
    });

    it('passes status filter from query params', async () => {
      req.query = { status: OrderStatus.PENDING, page: '1', limit: '20' };
      mockOrderService.getOrders.mockResolvedValueOnce({
        data: [ORDER_PENDING_KITCHEN],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1, hasNextPage: false, hasPrevPage: false },
      });

      await controller.getOrders(req as any, res as any, next);

      expect(mockOrderService.getOrders).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ status: OrderStatus.PENDING }),
      );
    });
  });

  describe('cancelOrder', () => {
    it('responds 200 with cancelled order', async () => {
      req.params = { id: ORDER_PENDING_KITCHEN.id };
      req.body = { reason: 'CUSTOMER_REQUEST', note: 'Changed my mind' };
      req.user = { id: CUSTOMER_SNAPSHOT_1.id };
      const cancelled = { ...ORDER_PENDING_KITCHEN, status: OrderStatus.CANCELLED };
      mockOrderService.cancelOrder.mockResolvedValueOnce(cancelled);

      await controller.cancelOrder(req as any, res as any, next);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: OrderStatus.CANCELLED }) }),
      );
    });

    it('calls next with error when cancellation fails', async () => {
      req.params = { id: ORDER_CONFIRMED.id };
      req.body = { reason: 'CUSTOMER_REQUEST', note: null };
      req.user = { id: CUSTOMER_SNAPSHOT_1.id };
      const error = new OrderNotFoundError(ORDER_CONFIRMED.id);
      mockOrderService.cancelOrder.mockRejectedValueOnce(error);

      await controller.cancelOrder(req as any, res as any, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});