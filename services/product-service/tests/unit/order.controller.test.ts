

import { Request, Response, NextFunction } from 'express';
import { OrderController } from '../../src/app/orders/order.controller';
import { OrderService } from '../../src/app/orders/order.service';
import { AppError } from '../../src/shared/errors';
import { OrderStatus, PaymentStatus } from '@prisma/client';

describe('OrderController', () => {
  let orderController: OrderController;
  let mockOrderService: jest.Mocked<OrderService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockOrderService = {
      createOrder: jest.fn(),
      getOrderById: jest.fn(),
      getOrdersByCustomer: jest.fn(),
      updateOrderStatus: jest.fn(),
      cancelOrder: jest.fn(),
      getOrders: jest.fn(),
      calculateOrderTotal: jest.fn(),
      validateOrderItems: jest.fn(),
    } as any;

    orderController = new OrderController(mockOrderService);

    mockRequest = {
      body: {},
      params: {},
      query: {},
      user: {
        id: 'user-123',
        email: 'test@example.com',
        role: 'CUSTOMER',
      },
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrder', () => {
    it('should create a new order successfully', async () => {
      const orderData = {
        customerId: 'user-123',
        items: [
          {
            productId: 'prod-1',
            quantity: 2,
            unitPrice: 500.0,
          },
          {
            productId: 'prod-2',
            quantity: 1,
            unitPrice: 750.0,
          },
        ],
        shippingAddress: {
          street: '123 Main St',
          city: 'London',
          postcode: 'SW1A 1AA',
          country: 'UK',
        },
        billingAddress: {
          street: '123 Main St',
          city: 'London',
          postcode: 'SW1A 1AA',
          country: 'UK',
        },
      };

      const mockOrder = {
        id: 'order-123',
        orderNumber: 'ORD-2026-001',
        customerId: 'user-123',
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        subtotal: 1750.0,
        tax: 350.0,
        shippingCost: 50.0,
        total: 2150.0,
        items: [
          {
            id: 'item-1',
            productId: 'prod-1',
            quantity: 2,
            unitPrice: 500.0,
            total: 1000.0,
          },
          {
            id: 'item-2',
            productId: 'prod-2',
            quantity: 1,
            unitPrice: 750.0,
            total: 750.0,
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.body = orderData;
      mockOrderService.createOrder.mockResolvedValue(mockOrder as any);

      await orderController.createOrder(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockOrderService.createOrder).toHaveBeenCalledWith(orderData);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockOrder,
        message: 'Order created successfully',
      });
    });

    it('should handle validation errors', async () => {
      const invalidOrderData = {
        customerId: 'user-123',
        items: [],
      };

      mockRequest.body = invalidOrderData;
      const validationError = new AppError(
        'Order must contain at least one item',
        400
      );
      mockOrderService.createOrder.mockRejectedValue(validationError);

      await orderController.createOrder(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });

    it('should handle insufficient inventory errors', async () => {
      const orderData = {
        customerId: 'user-123',
        items: [
          {
            productId: 'prod-1',
            quantity: 100,
            unitPrice: 500.0,
          },
        ],
      };

      mockRequest.body = orderData;
      const inventoryError = new AppError('Insufficient inventory', 400);
      mockOrderService.createOrder.mockRejectedValue(inventoryError);

      await orderController.createOrder(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(inventoryError);
    });
  });

  describe('getOrderById', () => {
    it('should retrieve an order by ID', async () => {
      const mockOrder = {
        id: 'order-123',
        orderNumber: 'ORD-2026-001',
        customerId: 'user-123',
        status: OrderStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PAID,
        total: 2150.0,
        items: [],
        createdAt: new Date(),
      };

      mockRequest.params = { id: 'order-123' };
      mockOrderService.getOrderById.mockResolvedValue(mockOrder as any);

      await orderController.getOrderById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockOrderService.getOrderById).toHaveBeenCalledWith('order-123');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockOrder,
      });
    });

    it('should return 404 when order is not found', async () => {
      mockRequest.params = { id: 'non-existent' };
      const notFoundError = new AppError('Order not found', 404);
      mockOrderService.getOrderById.mockRejectedValue(notFoundError);

      await orderController.getOrderById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(notFoundError);
    });

    it('should prevent unauthorized access to other users orders', async () => {
      const mockOrder = {
        id: 'order-123',
        customerId: 'other-user',
        status: OrderStatus.CONFIRMED,
      };

      mockRequest.params = { id: 'order-123' };
      const unauthorizedError = new AppError(
        'Unauthorized to access this order',
        403
      );
      mockOrderService.getOrderById.mockRejectedValue(unauthorizedError);

      await orderController.getOrderById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(unauthorizedError);
    });
  });

  describe('getOrdersByCustomer', () => {
    it('should retrieve all orders for a customer', async () => {
      const mockOrders = {
        data: [
          {
            id: 'order-1',
            orderNumber: 'ORD-2026-001',
            status: OrderStatus.DELIVERED,
            total: 1500.0,
            createdAt: new Date(),
          },
          {
            id: 'order-2',
            orderNumber: 'ORD-2026-002',
            status: OrderStatus.CONFIRMED,
            total: 2500.0,
            createdAt: new Date(),
          },
        ],
        pagination: {
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      };

      mockRequest.params = { customerId: 'user-123' };
      mockRequest.query = { page: '1', limit: '10' };
      mockOrderService.getOrdersByCustomer.mockResolvedValue(mockOrders as any);

      await orderController.getOrdersByCustomer(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockOrderService.getOrdersByCustomer).toHaveBeenCalledWith(
        'user-123',
        { page: 1, limit: 10 }
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockOrders.data,
        pagination: mockOrders.pagination,
      });
    });

    it('should apply filters for order status', async () => {
      const mockOrders = {
        data: [
          {
            id: 'order-1',
            status: OrderStatus.PENDING,
            total: 1500.0,
          },
        ],
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      };

      mockRequest.params = { customerId: 'user-123' };
      mockRequest.query = { status: 'PENDING', page: '1', limit: '10' };
      mockOrderService.getOrdersByCustomer.mockResolvedValue(mockOrders as any);

      await orderController.getOrdersByCustomer(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockOrderService.getOrdersByCustomer).toHaveBeenCalledWith(
        'user-123',
        {
          page: 1,
          limit: 10,
          status: 'PENDING',
        }
      );
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status successfully', async () => {
      const updatedOrder = {
        id: 'order-123',
        status: OrderStatus.PROCESSING,
        updatedAt: new Date(),
      };

      mockRequest.params = { id: 'order-123' };
      mockRequest.body = { status: 'PROCESSING' };
      mockOrderService.updateOrderStatus.mockResolvedValue(updatedOrder as any);

      await orderController.updateOrderStatus(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockOrderService.updateOrderStatus).toHaveBeenCalledWith(
        'order-123',
        'PROCESSING'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: updatedOrder,
        message: 'Order status updated successfully',
      });
    });

    it('should reject invalid status transitions', async () => {
      mockRequest.params = { id: 'order-123' };
      mockRequest.body = { status: 'DELIVERED' };
      const transitionError = new AppError(
        'Invalid status transition from PENDING to DELIVERED',
        400
      );
      mockOrderService.updateOrderStatus.mockRejectedValue(transitionError);

      await orderController.updateOrderStatus(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(transitionError);
    });

    it('should require admin role for status updates', async () => {
      mockRequest.user = { id: 'user-123', role: 'CUSTOMER' };
      mockRequest.params = { id: 'order-123' };
      mockRequest.body = { status: 'PROCESSING' };

      const unauthorizedError = new AppError(
        'Insufficient permissions to update order status',
        403
      );
      mockOrderService.updateOrderStatus.mockRejectedValue(unauthorizedError);

      await orderController.updateOrderStatus(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(unauthorizedError);
    });
  });

  describe('cancelOrder', () => {
    it('should cancel an order successfully', async () => {
      const cancelledOrder = {
        id: 'order-123',
        status: OrderStatus.CANCELLED,
        cancellationReason: 'Customer request',
        cancelledAt: new Date(),
      };

      mockRequest.params = { id: 'order-123' };
      mockRequest.body = { reason: 'Customer request' };
      mockOrderService.cancelOrder.mockResolvedValue(cancelledOrder as any);

      await orderController.cancelOrder(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockOrderService.cancelOrder).toHaveBeenCalledWith('order-123', {
        reason: 'Customer request',
        userId: 'user-123',
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: cancelledOrder,
        message: 'Order cancelled successfully',
      });
    });

    it('should prevent cancellation of shipped orders', async () => {
      mockRequest.params = { id: 'order-123' };
      mockRequest.body = { reason: 'Customer request' };
      const cancelError = new AppError(
        'Cannot cancel order that has been shipped',
        400
      );
      mockOrderService.cancelOrder.mockRejectedValue(cancelError);

      await orderController.cancelOrder(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(cancelError);
    });

    it('should require cancellation reason', async () => {
      mockRequest.params = { id: 'order-123' };
      mockRequest.body = {};
      const validationError = new AppError(
        'Cancellation reason is required',
        400
      );
      mockOrderService.cancelOrder.mockRejectedValue(validationError);

      await orderController.cancelOrder(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });
  });

  describe('getOrders', () => {
    it('should retrieve all orders with pagination (admin)', async () => {
      mockRequest.user = { id: 'admin-123', role: 'ADMIN' };
      mockRequest.query = { page: '1', limit: '20' };

      const mockOrders = {
        data: [
          { id: 'order-1', total: 1500.0, status: OrderStatus.PENDING },
          { id: 'order-2', total: 2500.0, status: OrderStatus.CONFIRMED },
        ],
        pagination: {
          total: 50,
          page: 1,
          limit: 20,
          totalPages: 3,
        },
      };

      mockOrderService.getOrders.mockResolvedValue(mockOrders as any);

      await orderController.getOrders(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockOrderService.getOrders).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should filter orders by status', async () => {
      mockRequest.user = { id: 'admin-123', role: 'ADMIN' };
      mockRequest.query = {
        page: '1',
        limit: '20',
        status: 'PENDING',
      };

      const mockOrders = {
        data: [{ id: 'order-1', status: OrderStatus.PENDING }],
        pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
      };

      mockOrderService.getOrders.mockResolvedValue(mockOrders as any);

      await orderController.getOrders(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockOrderService.getOrders).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        status: 'PENDING',
      });
    });

    it('should filter orders by date range', async () => {
      mockRequest.user = { id: 'admin-123', role: 'ADMIN' };
      mockRequest.query = {
        page: '1',
        limit: '20',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
      };

      const mockOrders = {
        data: [],
        pagination: { total: 0, page: 1, limit: 20, totalPages: 0 },
      };

      mockOrderService.getOrders.mockResolvedValue(mockOrders as any);

      await orderController.getOrders(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockOrderService.getOrders).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        startDate: '2026-01-01',
        endDate: '2026-12-31',
      });
    });
  });

  describe('calculateOrderTotal', () => {
    it('should calculate order total correctly', async () => {
      const orderData = {
        items: [
          { productId: 'prod-1', quantity: 2, unitPrice: 500.0 },
          { productId: 'prod-2', quantity: 1, unitPrice: 750.0 },
        ],
        shippingCost: 50.0,
        couponCode: 'SAVE10',
      };

      const mockCalculation = {
        subtotal: 1750.0,
        tax: 350.0,
        shippingCost: 50.0,
        discount: 175.0,
        total: 1975.0,
      };

      mockRequest.body = orderData;
      mockOrderService.calculateOrderTotal.mockResolvedValue(
        mockCalculation as any
      );

      await orderController.calculateOrderTotal(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockOrderService.calculateOrderTotal).toHaveBeenCalledWith(
        orderData
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockCalculation,
      });
    });

    it('should handle invalid coupon codes', async () => {
      const orderData = {
        items: [{ productId: 'prod-1', quantity: 1, unitPrice: 500.0 }],
        couponCode: 'INVALID',
      };

      mockRequest.body = orderData;
      const couponError = new AppError('Invalid or expired coupon code', 400);
      mockOrderService.calculateOrderTotal.mockRejectedValue(couponError);

      await orderController.calculateOrderTotal(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(couponError);
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockRequest.params = { id: 'order-123' };
      const dbError = new Error('Database connection failed');
      mockOrderService.getOrderById.mockRejectedValue(dbError);

      await orderController.getOrderById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(dbError);
    });

    it('should handle service unavailable errors', async () => {
      mockRequest.body = {
        customerId: 'user-123',
        items: [{ productId: 'prod-1', quantity: 1 }],
      };

      const serviceError = new AppError(
        'Payment service temporarily unavailable',
        503
      );
      mockOrderService.createOrder.mockRejectedValue(serviceError);

      await orderController.createOrder(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });
});