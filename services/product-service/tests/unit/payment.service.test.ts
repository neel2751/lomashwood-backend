

import { PaymentService } from '../../src/app/payments/payment.service';
import { PaymentRepository } from '../../src/app/payments/payment.repository';
import { OrderRepository } from '../../src/app/orders/order.repository';
import { StripeClient } from '../../src/infrastructure/payments/stripe.client';
import { EventProducer } from '../../src/infrastructure/messaging/event-producer';
import { AppError } from '../../src/shared/errors';
import { PaymentStatus, PaymentMethod, OrderStatus } from '@prisma/client';

describe('PaymentService', () => {
  let paymentService: PaymentService;
  let mockPaymentRepository: jest.Mocked<PaymentRepository>;
  let mockOrderRepository: jest.Mocked<OrderRepository>;
  let mockStripeClient: jest.Mocked<StripeClient>;
  let mockEventProducer: jest.Mocked<EventProducer>;

  beforeEach(() => {
    mockPaymentRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByOrderId: jest.fn(),
      findByCustomerId: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByTransactionId: jest.fn(),
      countByStatus: jest.fn(),
      getTotalRevenue: jest.fn(),
      findFailedPayments: jest.fn(),
    } as any;

    mockOrderRepository = {
      findById: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    } as any;

    mockStripeClient = {
      createPaymentIntent: jest.fn(),
      confirmPaymentIntent: jest.fn(),
      cancelPaymentIntent: jest.fn(),
      capturePaymentIntent: jest.fn(),
      createRefund: jest.fn(),
      retrievePaymentIntent: jest.fn(),
      constructWebhookEvent: jest.fn(),
      createCustomer: jest.fn(),
      attachPaymentMethod: jest.fn(),
    } as any;

    mockEventProducer = {
      publish: jest.fn(),
      publishBatch: jest.fn(),
    } as any;

    paymentService = new PaymentService(
      mockPaymentRepository,
      mockOrderRepository,
      mockStripeClient,
      mockEventProducer
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPaymentIntent', () => {
    it('should create a payment intent for an order successfully', async () => {
      const paymentData = {
        orderId: 'order-123',
        customerId: 'customer-123',
        amount: 2150.0,
        currency: 'GBP',
        paymentMethod: PaymentMethod.CARD,
      };

      const mockOrder = {
        id: 'order-123',
        customerId: 'customer-123',
        total: 2150.0,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
      };

      const mockStripeIntent = {
        id: 'pi_stripe123',
        client_secret: 'secret_abc123',
        amount: 215000, // Stripe uses smallest currency unit (pence)
        currency: 'gbp',
        status: 'requires_payment_method',
      };

      const mockCreatedPayment = {
        id: 'payment-123',
        paymentNumber: 'PAY-2026-001',
        orderId: 'order-123',
        customerId: 'customer-123',
        amount: 2150.0,
        currency: 'GBP',
        status: PaymentStatus.PENDING,
        paymentMethod: PaymentMethod.CARD,
        stripePaymentIntentId: 'pi_stripe123',
        clientSecret: 'secret_abc123',
        createdAt: new Date(),
      };

      mockOrderRepository.findById.mockResolvedValue(mockOrder as any);
      mockStripeClient.createPaymentIntent.mockResolvedValue(
        mockStripeIntent as any
      );
      mockPaymentRepository.create.mockResolvedValue(mockCreatedPayment as any);
      mockEventProducer.publish.mockResolvedValue(undefined);

      const result = await paymentService.createPaymentIntent(paymentData);

      expect(mockOrderRepository.findById).toHaveBeenCalledWith('order-123');
      expect(mockStripeClient.createPaymentIntent).toHaveBeenCalledWith({
        amount: 215000,
        currency: 'gbp',
        metadata: {
          orderId: 'order-123',
          customerId: 'customer-123',
        },
      });
      expect(mockPaymentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: 'order-123',
          customerId: 'customer-123',
          amount: 2150.0,
          status: PaymentStatus.PENDING,
          stripePaymentIntentId: 'pi_stripe123',
        })
      );
      expect(mockEventProducer.publish).toHaveBeenCalledWith(
        'payment.intent.created',
        expect.objectContaining({
          paymentId: 'payment-123',
          orderId: 'order-123',
        })
      );
      expect(result).toEqual(mockCreatedPayment);
      expect(result.clientSecret).toBe('secret_abc123');
    });

    it('should throw error if order not found', async () => {
      const paymentData = {
        orderId: 'non-existent',
        customerId: 'customer-123',
        amount: 2150.0,
        currency: 'GBP',
        paymentMethod: PaymentMethod.CARD,
      };

      mockOrderRepository.findById.mockResolvedValue(null);

      await expect(
        paymentService.createPaymentIntent(paymentData)
      ).rejects.toThrow(AppError);
      await expect(
        paymentService.createPaymentIntent(paymentData)
      ).rejects.toThrow('Order not found');

      expect(mockStripeClient.createPaymentIntent).not.toHaveBeenCalled();
    });

    it('should throw error if order amount mismatch', async () => {
      const paymentData = {
        orderId: 'order-123',
        customerId: 'customer-123',
        amount: 1000.0,
        currency: 'GBP',
        paymentMethod: PaymentMethod.CARD,
      };

      const mockOrder = {
        id: 'order-123',
        total: 2150.0,
        status: OrderStatus.PENDING,
      };

      mockOrderRepository.findById.mockResolvedValue(mockOrder as any);

      await expect(
        paymentService.createPaymentIntent(paymentData)
      ).rejects.toThrow(AppError);
      await expect(
        paymentService.createPaymentIntent(paymentData)
      ).rejects.toThrow('Payment amount does not match order total');
    });

    it('should throw error if order already paid', async () => {
      const paymentData = {
        orderId: 'order-123',
        customerId: 'customer-123',
        amount: 2150.0,
        currency: 'GBP',
        paymentMethod: PaymentMethod.CARD,
      };

      const mockOrder = {
        id: 'order-123',
        total: 2150.0,
        status: OrderStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PAID,
      };

      mockOrderRepository.findById.mockResolvedValue(mockOrder as any);

      await expect(
        paymentService.createPaymentIntent(paymentData)
      ).rejects.toThrow(AppError);
      await expect(
        paymentService.createPaymentIntent(paymentData)
      ).rejects.toThrow('Order has already been paid');
    });

    it('should handle Stripe API errors', async () => {
      const paymentData = {
        orderId: 'order-123',
        customerId: 'customer-123',
        amount: 2150.0,
        currency: 'GBP',
        paymentMethod: PaymentMethod.CARD,
      };

      const mockOrder = {
        id: 'order-123',
        total: 2150.0,
        status: OrderStatus.PENDING,
      };

      mockOrderRepository.findById.mockResolvedValue(mockOrder as any);
      mockStripeClient.createPaymentIntent.mockRejectedValue(
        new Error('Stripe API error: Invalid API key')
      );

      await expect(
        paymentService.createPaymentIntent(paymentData)
      ).rejects.toThrow('Stripe API error: Invalid API key');
    });

    it('should support different currencies', async () => {
      const paymentData = {
        orderId: 'order-123',
        customerId: 'customer-123',
        amount: 2500.0,
        currency: 'USD',
        paymentMethod: PaymentMethod.CARD,
      };

      const mockOrder = {
        id: 'order-123',
        total: 2500.0,
        status: OrderStatus.PENDING,
      };

      const mockStripeIntent = {
        id: 'pi_stripe456',
        client_secret: 'secret_def456',
        amount: 250000,
        currency: 'usd',
      };

      mockOrderRepository.findById.mockResolvedValue(mockOrder as any);
      mockStripeClient.createPaymentIntent.mockResolvedValue(
        mockStripeIntent as any
      );
      mockPaymentRepository.create.mockResolvedValue({
        id: 'payment-456',
        currency: 'USD',
      } as any);

      await paymentService.createPaymentIntent(paymentData);

      expect(mockStripeClient.createPaymentIntent).toHaveBeenCalledWith({
        amount: 250000,
        currency: 'usd',
        metadata: expect.any(Object),
      });
    });
  });

  describe('confirmPayment', () => {
    it('should confirm a payment successfully', async () => {
      const mockPayment = {
        id: 'payment-123',
        orderId: 'order-123',
        customerId: 'customer-123',
        amount: 2150.0,
        status: PaymentStatus.PENDING,
        stripePaymentIntentId: 'pi_stripe123',
      };

      const mockStripeIntent = {
        id: 'pi_stripe123',
        status: 'succeeded',
        charges: {
          data: [
            {
              id: 'ch_123',
              receipt_url: 'https://stripe.com/receipt/123',
            },
          ],
        },
      };

      const mockUpdatedPayment = {
        id: 'payment-123',
        status: PaymentStatus.PAID,
        paidAt: new Date(),
        receiptUrl: 'https://stripe.com/receipt/123',
      };

      mockPaymentRepository.findById.mockResolvedValue(mockPayment as any);
      mockStripeClient.retrievePaymentIntent.mockResolvedValue(
        mockStripeIntent as any
      );
      mockPaymentRepository.update.mockResolvedValue(mockUpdatedPayment as any);
      mockOrderRepository.update.mockResolvedValue({
        id: 'order-123',
        paymentStatus: PaymentStatus.PAID,
      } as any);

      const result = await paymentService.confirmPayment('payment-123');

      expect(mockPaymentRepository.update).toHaveBeenCalledWith('payment-123', {
        status: PaymentStatus.PAID,
        paidAt: expect.any(Date),
        receiptUrl: 'https://stripe.com/receipt/123',
      });
      expect(mockOrderRepository.update).toHaveBeenCalledWith('order-123', {
        paymentStatus: PaymentStatus.PAID,
        status: OrderStatus.CONFIRMED,
      });
      expect(mockEventProducer.publish).toHaveBeenCalledWith(
        'payment.succeeded',
        expect.objectContaining({
          paymentId: 'payment-123',
          orderId: 'order-123',
          amount: 2150.0,
        })
      );
      expect(result.status).toBe(PaymentStatus.PAID);
    });

    it('should handle payment processing state', async () => {
      const mockPayment = {
        id: 'payment-123',
        status: PaymentStatus.PENDING,
        stripePaymentIntentId: 'pi_stripe123',
      };

      const mockStripeIntent = {
        id: 'pi_stripe123',
        status: 'processing',
      };

      mockPaymentRepository.findById.mockResolvedValue(mockPayment as any);
      mockStripeClient.retrievePaymentIntent.mockResolvedValue(
        mockStripeIntent as any
      );
      mockPaymentRepository.update.mockResolvedValue({
        id: 'payment-123',
        status: PaymentStatus.PROCESSING,
      } as any);

      const result = await paymentService.confirmPayment('payment-123');

      expect(mockPaymentRepository.update).toHaveBeenCalledWith('payment-123', {
        status: PaymentStatus.PROCESSING,
      });
      expect(result.status).toBe(PaymentStatus.PROCESSING);
    });

    it('should handle payment failure', async () => {
      const mockPayment = {
        id: 'payment-123',
        orderId: 'order-123',
        status: PaymentStatus.PENDING,
        stripePaymentIntentId: 'pi_stripe123',
      };

      const mockStripeIntent = {
        id: 'pi_stripe123',
        status: 'failed',
        last_payment_error: {
          message: 'Insufficient funds',
        },
      };

      mockPaymentRepository.findById.mockResolvedValue(mockPayment as any);
      mockStripeClient.retrievePaymentIntent.mockResolvedValue(
        mockStripeIntent as any
      );
      mockPaymentRepository.update.mockResolvedValue({
        id: 'payment-123',
        status: PaymentStatus.FAILED,
      } as any);

      const result = await paymentService.confirmPayment('payment-123');

      expect(mockPaymentRepository.update).toHaveBeenCalledWith('payment-123', {
        status: PaymentStatus.FAILED,
        failureReason: 'Insufficient funds',
        failedAt: expect.any(Date),
      });
      expect(mockEventProducer.publish).toHaveBeenCalledWith(
        'payment.failed',
        expect.objectContaining({
          paymentId: 'payment-123',
          reason: 'Insufficient funds',
        })
      );
      expect(result.status).toBe(PaymentStatus.FAILED);
    });

    it('should throw error if payment not found', async () => {
      mockPaymentRepository.findById.mockResolvedValue(null);

      await expect(
        paymentService.confirmPayment('non-existent')
      ).rejects.toThrow(AppError);
      await expect(
        paymentService.confirmPayment('non-existent')
      ).rejects.toThrow('Payment not found');
    });

    it('should throw error if payment already completed', async () => {
      const mockPayment = {
        id: 'payment-123',
        status: PaymentStatus.PAID,
      };

      mockPaymentRepository.findById.mockResolvedValue(mockPayment as any);

      await expect(
        paymentService.confirmPayment('payment-123')
      ).rejects.toThrow(AppError);
      await expect(
        paymentService.confirmPayment('payment-123')
      ).rejects.toThrow('Payment has already been completed');
    });
  });

  describe('cancelPayment', () => {
    it('should cancel a pending payment successfully', async () => {
      const mockPayment = {
        id: 'payment-123',
        orderId: 'order-123',
        status: PaymentStatus.PENDING,
        stripePaymentIntentId: 'pi_stripe123',
      };

      const mockCancelledIntent = {
        id: 'pi_stripe123',
        status: 'canceled',
      };

      mockPaymentRepository.findById.mockResolvedValue(mockPayment as any);
      mockStripeClient.cancelPaymentIntent.mockResolvedValue(
        mockCancelledIntent as any
      );
      mockPaymentRepository.update.mockResolvedValue({
        id: 'payment-123',
        status: PaymentStatus.CANCELLED,
      } as any);

      const result = await paymentService.cancelPayment('payment-123', {
        reason: 'Customer request',
        cancelledBy: 'customer-123',
      });

      expect(mockStripeClient.cancelPaymentIntent).toHaveBeenCalledWith(
        'pi_stripe123'
      );
      expect(mockPaymentRepository.update).toHaveBeenCalledWith('payment-123', {
        status: PaymentStatus.CANCELLED,
        cancellationReason: 'Customer request',
        cancelledAt: expect.any(Date),
        cancelledBy: 'customer-123',
      });
      expect(mockEventProducer.publish).toHaveBeenCalledWith(
        'payment.cancelled',
        expect.objectContaining({
          paymentId: 'payment-123',
          reason: 'Customer request',
        })
      );
    });

    it('should throw error if payment cannot be cancelled', async () => {
      const mockPayment = {
        id: 'payment-123',
        status: PaymentStatus.PAID,
      };

      mockPaymentRepository.findById.mockResolvedValue(mockPayment as any);

      await expect(
        paymentService.cancelPayment('payment-123', {
          reason: 'Customer request',
          cancelledBy: 'customer-123',
        })
      ).rejects.toThrow(AppError);
      await expect(
        paymentService.cancelPayment('payment-123', {
          reason: 'Customer request',
          cancelledBy: 'customer-123',
        })
      ).rejects.toThrow('Cannot cancel a completed payment');
    });
  });

  describe('createRefund', () => {
    it('should create a full refund successfully', async () => {
      const mockPayment = {
        id: 'payment-123',
        orderId: 'order-123',
        customerId: 'customer-123',
        amount: 2150.0,
        status: PaymentStatus.PAID,
        stripePaymentIntentId: 'pi_stripe123',
      };

      const mockStripeRefund = {
        id: 're_stripe123',
        amount: 215000,
        status: 'succeeded',
        created: Math.floor(Date.now() / 1000),
      };

      mockPaymentRepository.findById.mockResolvedValue(mockPayment as any);
      mockStripeClient.createRefund.mockResolvedValue(mockStripeRefund as any);
      mockPaymentRepository.update.mockResolvedValue({
        id: 'payment-123',
        status: PaymentStatus.REFUNDED,
      } as any);

      const result = await paymentService.createRefund('payment-123', {
        amount: 2150.0,
        reason: 'Customer request',
        requestedBy: 'customer-123',
      });

      expect(mockStripeClient.createRefund).toHaveBeenCalledWith({
        payment_intent: 'pi_stripe123',
        amount: 215000,
        reason: 'requested_by_customer',
      });
      expect(mockPaymentRepository.update).toHaveBeenCalledWith('payment-123', {
        status: PaymentStatus.REFUNDED,
        refundedAmount: 2150.0,
        refundedAt: expect.any(Date),
        refundReason: 'Customer request',
      });
      expect(mockEventProducer.publish).toHaveBeenCalledWith(
        'payment.refunded',
        expect.objectContaining({
          paymentId: 'payment-123',
          orderId: 'order-123',
          amount: 2150.0,
        })
      );
    });

    it('should create a partial refund successfully', async () => {
      const mockPayment = {
        id: 'payment-123',
        amount: 2150.0,
        status: PaymentStatus.PAID,
        stripePaymentIntentId: 'pi_stripe123',
      };

      const mockStripeRefund = {
        id: 're_stripe123',
        amount: 100000, // £1000
        status: 'succeeded',
      };

      mockPaymentRepository.findById.mockResolvedValue(mockPayment as any);
      mockStripeClient.createRefund.mockResolvedValue(mockStripeRefund as any);
      mockPaymentRepository.update.mockResolvedValue({
        id: 'payment-123',
        status: PaymentStatus.PARTIALLY_REFUNDED,
        refundedAmount: 1000.0,
      } as any);

      const result = await paymentService.createRefund('payment-123', {
        amount: 1000.0,
        reason: 'Partial product return',
        requestedBy: 'admin-123',
      });

      expect(mockStripeClient.createRefund).toHaveBeenCalledWith({
        payment_intent: 'pi_stripe123',
        amount: 100000,
        reason: 'requested_by_customer',
      });
      expect(result.status).toBe(PaymentStatus.PARTIALLY_REFUNDED);
      expect(result.refundedAmount).toBe(1000.0);
    });

    it('should throw error if payment not found', async () => {
      mockPaymentRepository.findById.mockResolvedValue(null);

      await expect(
        paymentService.createRefund('non-existent', {
          amount: 1000.0,
          reason: 'Customer request',
          requestedBy: 'customer-123',
        })
      ).rejects.toThrow(AppError);
      await expect(
        paymentService.createRefund('non-existent', {
          amount: 1000.0,
          reason: 'Customer request',
          requestedBy: 'customer-123',
        })
      ).rejects.toThrow('Payment not found');
    });

    it('should throw error if payment not paid', async () => {
      const mockPayment = {
        id: 'payment-123',
        status: PaymentStatus.PENDING,
      };

      mockPaymentRepository.findById.mockResolvedValue(mockPayment as any);

      await expect(
        paymentService.createRefund('payment-123', {
          amount: 1000.0,
          reason: 'Customer request',
          requestedBy: 'customer-123',
        })
      ).rejects.toThrow(AppError);
      await expect(
        paymentService.createRefund('payment-123', {
          amount: 1000.0,
          reason: 'Customer request',
          requestedBy: 'customer-123',
        })
      ).rejects.toThrow('Can only refund paid payments');
    });

    it('should throw error if refund amount exceeds payment amount', async () => {
      const mockPayment = {
        id: 'payment-123',
        amount: 2150.0,
        status: PaymentStatus.PAID,
        refundedAmount: 0,
      };

      mockPaymentRepository.findById.mockResolvedValue(mockPayment as any);

      await expect(
        paymentService.createRefund('payment-123', {
          amount: 3000.0,
          reason: 'Customer request',
          requestedBy: 'customer-123',
        })
      ).rejects.toThrow(AppError);
      await expect(
        paymentService.createRefund('payment-123', {
          amount: 3000.0,
          reason: 'Customer request',
          requestedBy: 'customer-123',
        })
      ).rejects.toThrow('Refund amount exceeds available amount');
    });

    it('should handle multiple partial refunds', async () => {
      const mockPayment = {
        id: 'payment-123',
        amount: 2150.0,
        status: PaymentStatus.PARTIALLY_REFUNDED,
        refundedAmount: 500.0,
        stripePaymentIntentId: 'pi_stripe123',
      };

      const mockStripeRefund = {
        id: 're_stripe456',
        amount: 50000,
        status: 'succeeded',
      };

      mockPaymentRepository.findById.mockResolvedValue(mockPayment as any);
      mockStripeClient.createRefund.mockResolvedValue(mockStripeRefund as any);
      mockPaymentRepository.update.mockResolvedValue({
        id: 'payment-123',
        refundedAmount: 1000.0,
      } as any);

      await paymentService.createRefund('payment-123', {
        amount: 500.0,
        reason: 'Additional refund',
        requestedBy: 'admin-123',
      });

      expect(mockStripeClient.createRefund).toHaveBeenCalledWith({
        payment_intent: 'pi_stripe123',
        amount: 50000,
        reason: 'requested_by_customer',
      });
    });
  });

  describe('handleWebhook', () => {
    it('should handle payment_intent.succeeded webhook', async () => {
      const webhookEvent = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_stripe123',
            amount: 215000,
            status: 'succeeded',
            metadata: {
              paymentId: 'payment-123',
            },
            charges: {
              data: [
                {
                  receipt_url: 'https://stripe.com/receipt/123',
                },
              ],
            },
          },
        },
      };

      const mockPayment = {
        id: 'payment-123',
        orderId: 'order-123',
        status: PaymentStatus.PENDING,
      };

      mockPaymentRepository.findByTransactionId.mockResolvedValue(
        mockPayment as any
      );
      mockPaymentRepository.update.mockResolvedValue({
        id: 'payment-123',
        status: PaymentStatus.PAID,
      } as any);
      mockOrderRepository.update.mockResolvedValue({} as any);

      await paymentService.handleWebhook(webhookEvent as any);

      expect(mockPaymentRepository.update).toHaveBeenCalledWith('payment-123', {
        status: PaymentStatus.PAID,
        paidAt: expect.any(Date),
        receiptUrl: 'https://stripe.com/receipt/123',
      });
      expect(mockEventProducer.publish).toHaveBeenCalledWith(
        'payment.succeeded',
        expect.any(Object)
      );
    });

    it('should handle payment_intent.payment_failed webhook', async () => {
      const webhookEvent = {
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_stripe123',
            status: 'failed',
            metadata: {
              paymentId: 'payment-123',
            },
            last_payment_error: {
              message: 'Card declined',
            },
          },
        },
      };

      const mockPayment = {
        id: 'payment-123',
        status: PaymentStatus.PENDING,
      };

      mockPaymentRepository.findByTransactionId.mockResolvedValue(
        mockPayment as any
      );
      mockPaymentRepository.update.mockResolvedValue({
        id: 'payment-123',
        status: PaymentStatus.FAILED,
      } as any);

      await paymentService.handleWebhook(webhookEvent as any);

      expect(mockPaymentRepository.update).toHaveBeenCalledWith('payment-123', {
        status: PaymentStatus.FAILED,
        failureReason: 'Card declined',
        failedAt: expect.any(Date),
      });
      expect(mockEventProducer.publish).toHaveBeenCalledWith(
        'payment.failed',
        expect.any(Object)
      );
    });

    it('should handle charge.refunded webhook', async () => {
      const webhookEvent = {
        type: 'charge.refunded',
        data: {
          object: {
            id: 'ch_123',
            payment_intent: 'pi_stripe123',
            amount_refunded: 215000,
            refunded: true,
          },
        },
      };

      const mockPayment = {
        id: 'payment-123',
        orderId: 'order-123',
        amount: 2150.0,
        status: PaymentStatus.PAID,
        stripePaymentIntentId: 'pi_stripe123',
      };

      mockPaymentRepository.findByTransactionId.mockResolvedValue(
        mockPayment as any
      );
      mockPaymentRepository.update.mockResolvedValue({
        id: 'payment-123',
        status: PaymentStatus.REFUNDED,
      } as any);

      await paymentService.handleWebhook(webhookEvent as any);

      expect(mockPaymentRepository.update).toHaveBeenCalledWith('payment-123', {
        status: PaymentStatus.REFUNDED,
        refundedAmount: 2150.0,
        refundedAt: expect.any(Date),
      });
    });

    it('should ignore unhandled webhook events', async () => {
      const webhookEvent = {
        type: 'customer.created',
        data: {
          object: {
            id: 'cus_123',
          },
        },
      };

      await paymentService.handleWebhook(webhookEvent as any);

      expect(mockPaymentRepository.update).not.toHaveBeenCalled();
      expect(mockEventProducer.publish).not.toHaveBeenCalled();
    });

    it('should handle webhook with missing payment gracefully', async () => {
      const webhookEvent = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_stripe123',
            metadata: {
              paymentId: 'payment-123',
            },
          },
        },
      };

      mockPaymentRepository.findByTransactionId.mockResolvedValue(null);

      await paymentService.handleWebhook(webhookEvent as any);

      expect(mockPaymentRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('getPaymentById', () => {
    it('should retrieve a payment by ID', async () => {
      const mockPayment = {
        id: 'payment-123',
        paymentNumber: 'PAY-2026-001',
        orderId: 'order-123',
        customerId: 'customer-123',
        amount: 2150.0,
        status: PaymentStatus.PAID,
        createdAt: new Date(),
      };

      mockPaymentRepository.findById.mockResolvedValue(mockPayment as any);

      const result = await paymentService.getPaymentById('payment-123');

      expect(mockPaymentRepository.findById).toHaveBeenCalledWith('payment-123');
      expect(result).toEqual(mockPayment);
    });

    it('should throw error if payment not found', async () => {
      mockPaymentRepository.findById.mockResolvedValue(null);

      await expect(
        paymentService.getPaymentById('non-existent')
      ).rejects.toThrow(AppError);
      await expect(
        paymentService.getPaymentById('non-existent')
      ).rejects.toThrow('Payment not found');
    });
  });

  describe('getPaymentsByCustomer', () => {
    it('should retrieve all payments for a customer', async () => {
      const mockPayments = {
        data: [
          {
            id: 'payment-1',
            customerId: 'customer-123',
            amount: 2150.0,
            status: PaymentStatus.PAID,
          },
          {
            id: 'payment-2',
            customerId: 'customer-123',
            amount: 1500.0,
            status: PaymentStatus.PAID,
          },
        ],
        pagination: {
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      };

      mockPaymentRepository.findByCustomerId.mockResolvedValue(
        mockPayments as any
      );

      const result = await paymentService.getPaymentsByCustomer('customer-123', {
        page: 1,
        limit: 10,
      });

      expect(mockPaymentRepository.findByCustomerId).toHaveBeenCalledWith(
        'customer-123',
        { page: 1, limit: 10 }
      );
      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });

    it('should filter payments by status', async () => {
      const mockPayments = {
        data: [
          {
            id: 'payment-1',
            status: PaymentStatus.PAID,
          },
        ],
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      };

      mockPaymentRepository.findByCustomerId.mockResolvedValue(
        mockPayments as any
      );

      const result = await paymentService.getPaymentsByCustomer('customer-123', {
        page: 1,
        limit: 10,
        status: PaymentStatus.PAID,
      });

      expect(mockPaymentRepository.findByCustomerId).toHaveBeenCalledWith(
        'customer-123',
        {
          page: 1,
          limit: 10,
          status: PaymentStatus.PAID,
        }
      );
    });
  });

  describe('getPaymentStatistics', () => {
    it('should retrieve payment statistics', async () => {
      mockPaymentRepository.countByStatus.mockImplementation(
        async (status?: PaymentStatus) => {
          const counts = {
            total: 100,
            paid: 80,
            pending: 10,
            failed: 5,
            refunded: 3,
            cancelled: 2,
          };

          if (!status) return counts.total;
          return counts[status.toLowerCase() as keyof typeof counts] || 0;
        }
      );

      mockPaymentRepository.getTotalRevenue.mockResolvedValue(172000.0);

      const result = await paymentService.getPaymentStatistics();

      expect(result.total).toBe(100);
      expect(result.paid).toBe(80);
      expect(result.pending).toBe(10);
      expect(result.failed).toBe(5);
      expect(result.refunded).toBe(3);
      expect(result.cancelled).toBe(2);
      expect(result.totalRevenue).toBe(172000.0);
    });
  });

  describe('retryFailedPayment', () => {
    it('should retry a failed payment', async () => {
      const mockPayment = {
        id: 'payment-123',
        orderId: 'order-123',
        customerId: 'customer-123',
        amount: 2150.0,
        status: PaymentStatus.FAILED,
        stripePaymentIntentId: 'pi_stripe123',
      };

      const mockNewIntent = {
        id: 'pi_stripe456',
        client_secret: 'secret_new123',
        status: 'requires_payment_method',
      };

      mockPaymentRepository.findById.mockResolvedValue(mockPayment as any);
      mockStripeClient.createPaymentIntent.mockResolvedValue(
        mockNewIntent as any
      );
      mockPaymentRepository.update.mockResolvedValue({
        id: 'payment-123',
        status: PaymentStatus.PENDING,
        stripePaymentIntentId: 'pi_stripe456',
      } as any);

      const result = await paymentService.retryFailedPayment('payment-123');

      expect(mockStripeClient.createPaymentIntent).toHaveBeenCalled();
      expect(mockPaymentRepository.update).toHaveBeenCalledWith('payment-123', {
        status: PaymentStatus.PENDING,
        stripePaymentIntentId: 'pi_stripe456',
        clientSecret: 'secret_new123',
        retryCount: expect.any(Number),
      });
    });

    it('should throw error if payment is not failed', async () => {
      const mockPayment = {
        id: 'payment-123',
        status: PaymentStatus.PAID,
      };

      mockPaymentRepository.findById.mockResolvedValue(mockPayment as any);

      await expect(
        paymentService.retryFailedPayment('payment-123')
      ).rejects.toThrow(AppError);
      await expect(
        paymentService.retryFailedPayment('payment-123')
      ).rejects.toThrow('Can only retry failed payments');
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      const dbError = new Error('Database connection failed');
      mockPaymentRepository.findById.mockRejectedValue(dbError);

      await expect(
        paymentService.getPaymentById('payment-123')
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle Stripe service unavailable errors', async () => {
      const paymentData = {
        orderId: 'order-123',
        customerId: 'customer-123',
        amount: 2150.0,
        currency: 'GBP',
        paymentMethod: PaymentMethod.CARD,
      };

      const mockOrder = {
        id: 'order-123',
        total: 2150.0,
        status: OrderStatus.PENDING,
      };

      mockOrderRepository.findById.mockResolvedValue(mockOrder as any);
      mockStripeClient.createPaymentIntent.mockRejectedValue(
        new Error('Stripe service temporarily unavailable')
      );

      await expect(
        paymentService.createPaymentIntent(paymentData)
      ).rejects.toThrow('Stripe service temporarily unavailable');
    });

    it('should handle event publishing errors gracefully', async () => {
      const mockPayment = {
        id: 'payment-123',
        orderId: 'order-123',
        status: PaymentStatus.PENDING,
        stripePaymentIntentId: 'pi_stripe123',
      };

      const mockStripeIntent = {
        id: 'pi_stripe123',
        status: 'succeeded',
        charges: { data: [{ receipt_url: 'https://stripe.com/receipt' }] },
      };

      mockPaymentRepository.findById.mockResolvedValue(mockPayment as any);
      mockStripeClient.retrievePaymentIntent.mockResolvedValue(
        mockStripeIntent as any
      );
      mockPaymentRepository.update.mockResolvedValue({
        id: 'payment-123',
        status: PaymentStatus.PAID,
      } as any);
      mockOrderRepository.update.mockResolvedValue({} as any);
      mockEventProducer.publish.mockRejectedValue(
        new Error('Event bus unavailable')
      );

      const result = await paymentService.confirmPayment('payment-123');

      expect(result).toBeDefined();
      expect(result.status).toBe(PaymentStatus.PAID);
    });
  });
});