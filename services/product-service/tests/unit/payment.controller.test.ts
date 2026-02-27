import { Request, Response, NextFunction } from 'express';
import { PaymentController } from '../../src/app/payments/payment.controller';
import { PaymentService } from '../../src/app/payments/payment.service';
import { CreatePaymentDto, UpdatePaymentDto } from '../../src/app/payments/payment.types';
import { PaymentStatus, PaymentMethod } from '@prisma/client';
import { AppError } from '../../src/shared/errors';

jest.mock('../../src/app/payments/payment.service');

describe('PaymentController', () => {
  let controller: PaymentController;
  let mockPaymentService: jest.Mocked<PaymentService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockPaymentService = new PaymentService(null as any) as jest.Mocked<PaymentService>;
    controller = new PaymentController(mockPaymentService);

    mockRequest = {
      body: {},
      params: {},
      query: {},
      headers: {},
      user: {
        id: 'user-123',
        email: 'test@example.com',
        role: 'CUSTOMER',
      },
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPaymentIntent', () => {
    it('should create a payment intent successfully', async () => {
      const createDto: CreatePaymentDto = {
        orderId: 'order-123',
        amount: 25000,
        currency: 'GBP',
        method: PaymentMethod.STRIPE,
        status: PaymentStatus.PENDING,
        metadata: {
          customerId: 'user-123',
          products: ['prod-1', 'prod-2'],
        },
      };

      const mockPaymentIntent = {
        id: 'payment-123',
        clientSecret: 'pi_123_secret_456',
        amount: 25000,
        currency: 'GBP',
        status: 'requires_payment_method',
      };

      mockRequest.body = createDto;
      mockPaymentService.createPaymentIntent = jest.fn().mockResolvedValue(mockPaymentIntent);

      await controller.createPaymentIntent(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockPaymentService.createPaymentIntent).toHaveBeenCalledWith(createDto);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockPaymentIntent,
        message: 'Payment intent created successfully',
      });
    });

    it('should handle validation errors', async () => {
      const invalidDto = {
        orderId: '',
        amount: -100,
      };

      mockRequest.body = invalidDto;
      const validationError = new AppError('Validation failed', 400);

      mockPaymentService.createPaymentIntent = jest.fn().mockRejectedValue(validationError);

      await controller.createPaymentIntent(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });

    it('should handle service errors', async () => {
      const createDto: CreatePaymentDto = {
        orderId: 'order-123',
        amount: 25000,
        currency: 'GBP',
        method: PaymentMethod.STRIPE,
        status: PaymentStatus.PENDING,
      };

      mockRequest.body = createDto;
      const serviceError = new Error('Stripe API error');

      mockPaymentService.createPaymentIntent = jest.fn().mockRejectedValue(serviceError);

      await controller.createPaymentIntent(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });

  describe('getPaymentById', () => {
    it('should return payment by ID', async () => {
      const paymentId = 'payment-123';
      const mockPayment = {
        id: paymentId,
        orderId: 'order-123',
        amount: 25000,
        currency: 'GBP',
        method: PaymentMethod.STRIPE,
        status: PaymentStatus.SUCCEEDED,
        stripePaymentIntentId: 'pi_123456789',
        metadata: {},
        createdAt: new Date('2026-02-12T10:00:00Z'),
        updatedAt: new Date('2026-02-12T10:00:00Z'),
      };

      mockRequest.params = { id: paymentId };
      mockPaymentService.getPaymentById = jest.fn().mockResolvedValue(mockPayment);

      await controller.getPaymentById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockPaymentService.getPaymentById).toHaveBeenCalledWith(paymentId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockPayment,
      });
    });

    it('should return 404 when payment not found', async () => {
      const paymentId = 'non-existent-payment';
      mockRequest.params = { id: paymentId };

      const notFoundError = new AppError('Payment not found', 404);
      mockPaymentService.getPaymentById = jest.fn().mockRejectedValue(notFoundError);

      await controller.getPaymentById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(notFoundError);
    });
  });

  describe('getPaymentsByOrderId', () => {
    it('should return all payments for an order', async () => {
      const orderId = 'order-123';
      const mockPayments = [
        {
          id: 'payment-1',
          orderId,
          amount: 15000,
          currency: 'GBP',
          method: PaymentMethod.STRIPE,
          status: PaymentStatus.SUCCEEDED,
          stripePaymentIntentId: 'pi_111',
          metadata: {},
          createdAt: new Date('2026-02-12T10:00:00Z'),
          updatedAt: new Date('2026-02-12T10:00:00Z'),
        },
        {
          id: 'payment-2',
          orderId,
          amount: 10000,
          currency: 'GBP',
          method: PaymentMethod.STRIPE,
          status: PaymentStatus.SUCCEEDED,
          stripePaymentIntentId: 'pi_222',
          metadata: {},
          createdAt: new Date('2026-02-12T11:00:00Z'),
          updatedAt: new Date('2026-02-12T11:00:00Z'),
        },
      ];

      mockRequest.params = { orderId };
      mockPaymentService.getPaymentsByOrderId = jest.fn().mockResolvedValue(mockPayments);

      await controller.getPaymentsByOrderId(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockPaymentService.getPaymentsByOrderId).toHaveBeenCalledWith(orderId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockPayments,
        count: 2,
      });
    });

    it('should return empty array when no payments found', async () => {
      const orderId = 'order-with-no-payments';
      mockRequest.params = { orderId };

      mockPaymentService.getPaymentsByOrderId = jest.fn().mockResolvedValue([]);

      await controller.getPaymentsByOrderId(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: [],
        count: 0,
      });
    });
  });

  describe('getAllPayments', () => {
    it('should return paginated payments with default parameters', async () => {
      const mockPaginatedResult = {
        data: [
          {
            id: 'payment-1',
            orderId: 'order-1',
            amount: 15000,
            currency: 'GBP',
            method: PaymentMethod.STRIPE,
            status: PaymentStatus.SUCCEEDED,
            stripePaymentIntentId: 'pi_111',
            metadata: {},
            createdAt: new Date('2026-02-12T10:00:00Z'),
            updatedAt: new Date('2026-02-12T10:00:00Z'),
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      mockRequest.query = {};
      mockPaymentService.getAllPayments = jest.fn().mockResolvedValue(mockPaginatedResult);

      await controller.getAllPayments(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockPaymentService.getAllPayments).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        ...mockPaginatedResult,
      });
    });

    it('should filter payments by status', async () => {
      const mockPaginatedResult = {
        data: [
          {
            id: 'payment-1',
            orderId: 'order-1',
            amount: 15000,
            currency: 'GBP',
            method: PaymentMethod.STRIPE,
            status: PaymentStatus.PENDING,
            stripePaymentIntentId: 'pi_111',
            metadata: {},
            createdAt: new Date('2026-02-12T10:00:00Z'),
            updatedAt: new Date('2026-02-12T10:00:00Z'),
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      mockRequest.query = { status: 'PENDING', page: '1', limit: '10' };
      mockPaymentService.getAllPayments = jest.fn().mockResolvedValue(mockPaginatedResult);

      await controller.getAllPayments(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockPaymentService.getAllPayments).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        status: 'PENDING',
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should handle custom pagination parameters', async () => {
      const mockPaginatedResult = {
        data: [],
        total: 50,
        page: 2,
        limit: 20,
        totalPages: 3,
      };

      mockRequest.query = { page: '2', limit: '20' };
      mockPaymentService.getAllPayments = jest.fn().mockResolvedValue(mockPaginatedResult);

      await controller.getAllPayments(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockPaymentService.getAllPayments).toHaveBeenCalledWith({
        page: 2,
        limit: 20,
      });
    });
  });

  describe('updatePaymentStatus', () => {
    it('should update payment status successfully', async () => {
      const paymentId = 'payment-123';
      const updateDto: UpdatePaymentDto = {
        status: PaymentStatus.SUCCEEDED,
        metadata: {
          transactionId: 'txn_123',
          completedAt: new Date().toISOString(),
        },
      };

      const mockUpdatedPayment = {
        id: paymentId,
        orderId: 'order-123',
        amount: 25000,
        currency: 'GBP',
        method: PaymentMethod.STRIPE,
        status: PaymentStatus.SUCCEEDED,
        stripePaymentIntentId: 'pi_123456789',
        metadata: updateDto.metadata,
        createdAt: new Date('2026-02-12T10:00:00Z'),
        updatedAt: new Date('2026-02-12T10:30:00Z'),
      };

      mockRequest.params = { id: paymentId };
      mockRequest.body = updateDto;
      mockPaymentService.updatePaymentStatus = jest.fn().mockResolvedValue(mockUpdatedPayment);

      await controller.updatePaymentStatus(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockPaymentService.updatePaymentStatus).toHaveBeenCalledWith(paymentId, updateDto);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedPayment,
        message: 'Payment status updated successfully',
      });
    });

    it('should handle invalid payment ID', async () => {
      const paymentId = 'invalid-payment';
      const updateDto: UpdatePaymentDto = {
        status: PaymentStatus.FAILED,
      };

      mockRequest.params = { id: paymentId };
      mockRequest.body = updateDto;

      const notFoundError = new AppError('Payment not found', 404);
      mockPaymentService.updatePaymentStatus = jest.fn().mockRejectedValue(notFoundError);

      await controller.updatePaymentStatus(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(notFoundError);
    });
  });

  describe('handleStripeWebhook', () => {
    it('should process stripe webhook successfully', async () => {
      const webhookPayload = {
        id: 'evt_123',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_123456789',
            amount: 25000,
            currency: 'gbp',
            status: 'succeeded',
          },
        },
      };

      const mockProcessedPayment = {
        id: 'payment-123',
        orderId: 'order-123',
        amount: 25000,
        currency: 'GBP',
        method: PaymentMethod.STRIPE,
        status: PaymentStatus.SUCCEEDED,
        stripePaymentIntentId: 'pi_123456789',
        metadata: {},
        createdAt: new Date('2026-02-12T10:00:00Z'),
        updatedAt: new Date('2026-02-12T10:30:00Z'),
      };

      mockRequest.body = webhookPayload;
      mockRequest.headers = {
        'stripe-signature': 'test_signature',
      };

      mockPaymentService.handleStripeWebhook = jest.fn().mockResolvedValue(mockProcessedPayment);

      await controller.handleStripeWebhook(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockPaymentService.handleStripeWebhook).toHaveBeenCalledWith(
        webhookPayload,
        'test_signature'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        received: true,
      });
    });

    it('should handle missing stripe signature', async () => {
      const webhookPayload = {
        id: 'evt_123',
        type: 'payment_intent.succeeded',
      };

      mockRequest.body = webhookPayload;
      mockRequest.headers = {};

      const signatureError = new AppError('Missing stripe signature', 400);
      mockPaymentService.handleStripeWebhook = jest.fn().mockRejectedValue(signatureError);

      await controller.handleStripeWebhook(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(signatureError);
    });

    it('should handle invalid webhook signature', async () => {
      const webhookPayload = {
        id: 'evt_123',
        type: 'payment_intent.succeeded',
      };

      mockRequest.body = webhookPayload;
      mockRequest.headers = {
        'stripe-signature': 'invalid_signature',
      };

      const invalidSignatureError = new AppError('Invalid webhook signature', 400);
      mockPaymentService.handleStripeWebhook = jest.fn().mockRejectedValue(invalidSignatureError);

      await controller.handleStripeWebhook(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(invalidSignatureError);
    });

    it('should handle unsupported webhook events gracefully', async () => {
      const webhookPayload = {
        id: 'evt_123',
        type: 'customer.created',
        data: {
          object: {
            id: 'cus_123',
          },
        },
      };

      mockRequest.body = webhookPayload;
      mockRequest.headers = {
        'stripe-signature': 'test_signature',
      };

      mockPaymentService.handleStripeWebhook = jest.fn().mockResolvedValue(null);

      await controller.handleStripeWebhook(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        received: true,
      });
    });
  });

  describe('getTotalRevenue', () => {
    it('should return total revenue for succeeded payments', async () => {
      const mockRevenue = {
        total: 500000,
        currency: 'GBP',
        count: 20,
      };

      mockPaymentService.getTotalRevenue = jest.fn().mockResolvedValue(mockRevenue);

      await controller.getTotalRevenue(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockPaymentService.getTotalRevenue).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockRevenue,
      });
    });

    it('should handle errors when calculating revenue', async () => {
      const error = new Error('Database error');
      mockPaymentService.getTotalRevenue = jest.fn().mockRejectedValue(error);

      await controller.getTotalRevenue(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getPaymentStatistics', () => {
    it('should return payment statistics', async () => {
      const startDate = '2026-02-01';
      const endDate = '2026-02-28';

      const mockStatistics = {
        totalPayments: 50,
        succeededPayments: 45,
        failedPayments: 3,
        pendingPayments: 2,
        totalAmount: 1250000,
        averageAmount: 25000,
        dateRange: {
          start: startDate,
          end: endDate,
        },
      };

      mockRequest.query = { startDate, endDate };
      mockPaymentService.getPaymentStatistics = jest.fn().mockResolvedValue(mockStatistics);

      await controller.getPaymentStatistics(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockPaymentService.getPaymentStatistics).toHaveBeenCalledWith(
        new Date(startDate),
        new Date(endDate)
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockStatistics,
      });
    });

    it('should use default date range if not provided', async () => {
      const mockStatistics = {
        totalPayments: 100,
        succeededPayments: 90,
        failedPayments: 5,
        pendingPayments: 5,
        totalAmount: 2500000,
        averageAmount: 25000,
      };

      mockRequest.query = {};
      mockPaymentService.getPaymentStatistics = jest.fn().mockResolvedValue(mockStatistics);

      await controller.getPaymentStatistics(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockPaymentService.getPaymentStatistics).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });

  describe('refundPayment', () => {
    it('should process refund successfully', async () => {
      const paymentId = 'payment-123';
      const refundDto = {
        amount: 10000,
        reason: 'customer_request',
      };

      const mockRefund = {
        id: 'refund-123',
        paymentId,
        amount: 10000,
        status: 'succeeded',
        reason: 'customer_request',
        createdAt: new Date('2026-02-12T12:00:00Z'),
      };

      mockRequest.params = { id: paymentId };
      mockRequest.body = refundDto;
      mockPaymentService.refundPayment = jest.fn().mockResolvedValue(mockRefund);

      await controller.refundPayment(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockPaymentService.refundPayment).toHaveBeenCalledWith(paymentId, refundDto);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockRefund,
        message: 'Refund processed successfully',
      });
    });

    it('should handle refund errors', async () => {
      const paymentId = 'payment-123';
      const refundDto = {
        amount: 10000,
        reason: 'customer_request',
      };

      mockRequest.params = { id: paymentId };
      mockRequest.body = refundDto;

      const refundError = new AppError('Payment already refunded', 400);
      mockPaymentService.refundPayment = jest.fn().mockRejectedValue(refundError);

      await controller.refundPayment(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(refundError);
    });
  });

  describe('deletePayment', () => {
    it('should soft delete payment successfully', async () => {
      const paymentId = 'payment-123';
      const mockDeletedPayment = {
        id: paymentId,
        orderId: 'order-123',
        amount: 25000,
        currency: 'GBP',
        method: PaymentMethod.STRIPE,
        status: PaymentStatus.CANCELLED,
        deletedAt: new Date('2026-02-12T12:00:00Z'),
      };

      mockRequest.params = { id: paymentId };
      mockPaymentService.deletePayment = jest.fn().mockResolvedValue(mockDeletedPayment);

      await controller.deletePayment(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockPaymentService.deletePayment).toHaveBeenCalledWith(paymentId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Payment deleted successfully',
      });
    });

    it('should handle deletion of non-existent payment', async () => {
      const paymentId = 'non-existent-payment';
      mockRequest.params = { id: paymentId };

      const notFoundError = new AppError('Payment not found', 404);
      mockPaymentService.deletePayment = jest.fn().mockRejectedValue(notFoundError);

      await controller.deletePayment(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(notFoundError);
    });
  });
});