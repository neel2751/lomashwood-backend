import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { setupUnitTest, mockPrismaClient, mockStripeClient, mockEventProducer, mockLogger, setupPrismaTransactionMock } from '../../src/tests-helpers/setup';
import { PaymentService } from '../../src/app/payments/payment.service';
import { PaymentRepository } from '../../src/app/payments/payment.repository';
import { PaymentError, OrderNotFoundError, NotFoundError } from '../../src/shared/errors';
import { PaymentStatus, OrderStatus } from '../../src/shared/types';
import {
  PAYMENT_PENDING,
  PAYMENT_SUCCEEDED,
  PAYMENT_FAILED,
  ORDER_PENDING_KITCHEN,
  ORDER_CONFIRMED,
  STRIPE_PAYMENT_INTENT_MOCK,
  CUSTOMER_SNAPSHOT_1,
} from '../../tests/fixtures';

setupUnitTest();

const mockPaymentRepository = {
  findById: jest.fn(),
  findByOrderId: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  count: jest.fn(),
};

const mockOrderRepository = {
  findById: jest.fn(),
  update: jest.fn(),
};

jest.mock('../../src/app/payments/payment.repository', () => ({
  PaymentRepository: jest.fn().mockImplementation(() => mockPaymentRepository),
}));

describe('PaymentService', () => {
  let paymentService: PaymentService;

  beforeEach(() => {
    jest.clearAllMocks();
    setupPrismaTransactionMock();
    paymentService = new PaymentService(
      mockPaymentRepository as unknown as PaymentRepository,
      mockOrderRepository as any,
      mockStripeClient as any,
      mockPrismaClient as any,
      mockEventProducer as any,
      mockLogger as any,
    );
  });

  describe('createPaymentIntent', () => {
    const createInput = {
      orderId: ORDER_PENDING_KITCHEN.id,
      customerId: CUSTOMER_SNAPSHOT_1.id,
      amount: ORDER_PENDING_KITCHEN.totalAmount,
      currency: 'GBP',
      idempotencyKey: 'idem-pi-001',
    };

    it('creates payment intent and payment record', async () => {
      mockOrderRepository.findById.mockResolvedValueOnce(ORDER_PENDING_KITCHEN);
      mockStripeClient.paymentIntents.create.mockResolvedValueOnce(STRIPE_PAYMENT_INTENT_MOCK);
      mockPaymentRepository.create.mockResolvedValueOnce(PAYMENT_PENDING);
      mockOrderRepository.update.mockResolvedValueOnce({ ...ORDER_PENDING_KITCHEN, status: OrderStatus.AWAITING_PAYMENT });

      const result = await paymentService.createPaymentIntent(createInput);

      expect(result).toMatchObject({
        paymentId: PAYMENT_PENDING.id,
        clientSecret: expect.any(String),
      });
      expect(mockStripeClient.paymentIntents.create).toHaveBeenCalledTimes(1);
    });

    it('throws OrderNotFoundError when order does not exist', async () => {
      mockOrderRepository.findById.mockResolvedValueOnce(null);

      await expect(paymentService.createPaymentIntent(createInput)).rejects.toThrow(OrderNotFoundError);
      expect(mockStripeClient.paymentIntents.create).not.toHaveBeenCalled();
    });

    it('throws PaymentError when Stripe returns error', async () => {
      mockOrderRepository.findById.mockResolvedValueOnce(ORDER_PENDING_KITCHEN);
      mockStripeClient.paymentIntents.create.mockRejectedValueOnce(
        new Error('Your card has insufficient funds.'),
      );

      await expect(paymentService.createPaymentIntent(createInput)).rejects.toThrow(PaymentError);
    });

    it('passes idempotency key to Stripe', async () => {
      mockOrderRepository.findById.mockResolvedValueOnce(ORDER_PENDING_KITCHEN);
      mockStripeClient.paymentIntents.create.mockResolvedValueOnce(STRIPE_PAYMENT_INTENT_MOCK);
      mockPaymentRepository.create.mockResolvedValueOnce(PAYMENT_PENDING);
      mockOrderRepository.update.mockResolvedValueOnce(ORDER_PENDING_KITCHEN);

      await paymentService.createPaymentIntent(createInput);

      expect(mockStripeClient.paymentIntents.create).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ idempotencyKey: createInput.idempotencyKey }),
      );
    });
  });

  describe('confirmPayment', () => {
    const confirmInput = {
      paymentId: PAYMENT_PENDING.id,
      gatewayPaymentId: STRIPE_PAYMENT_INTENT_MOCK.id,
      gatewayChargeId: 'ch_mock_001',
      gatewayReceiptUrl: 'https://pay.stripe.com/receipts/mock',
      gatewayBalanceTransactionId: 'txn_mock_001',
      amountCaptured: ORDER_PENDING_KITCHEN.totalAmount,
      rawStatus: 'succeeded',
      paidAt: new Date(),
    };

    it('confirms payment and updates order to CONFIRMED', async () => {
      mockPaymentRepository.findById.mockResolvedValueOnce(PAYMENT_PENDING);
      mockOrderRepository.findById.mockResolvedValueOnce(ORDER_PENDING_KITCHEN);
      const succeededPayment = { ...PAYMENT_PENDING, status: PaymentStatus.SUCCEEDED };
      mockPaymentRepository.update.mockResolvedValueOnce(succeededPayment);
      mockOrderRepository.update.mockResolvedValueOnce({ ...ORDER_PENDING_KITCHEN, status: OrderStatus.CONFIRMED });

      const result = await paymentService.confirmPayment(confirmInput);

      expect(result.status).toBe(PaymentStatus.SUCCEEDED);
      expect(mockEventProducer.publish).toHaveBeenCalledTimes(1);
    });

    it('throws NotFoundError when payment record does not exist', async () => {
      mockPaymentRepository.findById.mockResolvedValueOnce(null);

      await expect(paymentService.confirmPayment(confirmInput)).rejects.toThrow(NotFoundError);
    });
  });

  describe('getPayment', () => {
    it('returns payment when found', async () => {
      mockPaymentRepository.findById.mockResolvedValueOnce(PAYMENT_SUCCEEDED);

      const result = await paymentService.getPayment(PAYMENT_SUCCEEDED.id);

      expect(result).toMatchObject({ id: PAYMENT_SUCCEEDED.id });
    });

    it('throws NotFoundError when payment does not exist', async () => {
      mockPaymentRepository.findById.mockResolvedValueOnce(null);

      await expect(paymentService.getPayment('non-existent')).rejects.toThrow(NotFoundError);
    });
  });

  describe('getPayments', () => {
    it('returns paginated list of payments', async () => {
      mockPaymentRepository.findMany.mockResolvedValueOnce([PAYMENT_PENDING, PAYMENT_SUCCEEDED]);
      mockPaymentRepository.count.mockResolvedValueOnce(2);

      const result = await paymentService.getPayments({ page: 1, limit: 20 }, {});

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
    });
  });
});