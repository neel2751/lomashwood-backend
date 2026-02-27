import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { setupUnitTest, mockPrismaClient } from '../../src/tests-helpers/setup';
import { PaymentRepository } from '../../src/app/payments/payment.repository';
import { PaymentStatus, PaymentGateway } from '../../src/shared/types';
import {
  PAYMENT_PENDING,
  PAYMENT_SUCCEEDED,
  PAYMENT_FAILED,
  ALL_PAYMENTS,
  ORDER_CONFIRMED,
} from '../../tests/fixtures';

setupUnitTest();

describe('PaymentRepository', () => {
  let repository: PaymentRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new PaymentRepository(mockPrismaClient as any);
  });

  describe('findById', () => {
    it('returns payment when found', async () => {
      mockPrismaClient.payment.findUnique.mockResolvedValueOnce(PAYMENT_SUCCEEDED);

      const result = await repository.findById(PAYMENT_SUCCEEDED.id);

      expect(result).toMatchObject({ id: PAYMENT_SUCCEEDED.id });
      expect(mockPrismaClient.payment.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: PAYMENT_SUCCEEDED.id } }),
      );
    });

    it('returns null when not found', async () => {
      mockPrismaClient.payment.findUnique.mockResolvedValueOnce(null);

      const result = await repository.findById('unknown-id');

      expect(result).toBeNull();
    });
  });

  describe('findByOrderId', () => {
    it('returns payment linked to order', async () => {
      mockPrismaClient.payment.findFirst.mockResolvedValueOnce(PAYMENT_SUCCEEDED);

      const result = await repository.findByOrderId(ORDER_CONFIRMED.id);

      expect(result).toMatchObject({ orderId: PAYMENT_SUCCEEDED.orderId });
    });

    it('returns null when order has no payment', async () => {
      mockPrismaClient.payment.findFirst.mockResolvedValueOnce(null);

      const result = await repository.findByOrderId('order-no-payment');

      expect(result).toBeNull();
    });
  });

  describe('findMany', () => {
    it('filters by status', async () => {
      const succeeded = ALL_PAYMENTS.filter((p) => p.status === PaymentStatus.SUCCEEDED);
      mockPrismaClient.payment.findMany.mockResolvedValueOnce(succeeded);

      await repository.findMany({ skip: 0, take: 20 }, { status: PaymentStatus.SUCCEEDED });

      expect(mockPrismaClient.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: PaymentStatus.SUCCEEDED }) }),
      );
    });

    it('filters by gateway', async () => {
      mockPrismaClient.payment.findMany.mockResolvedValueOnce(ALL_PAYMENTS);

      await repository.findMany({ skip: 0, take: 20 }, { gateway: PaymentGateway.STRIPE });

      expect(mockPrismaClient.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ gateway: PaymentGateway.STRIPE }) }),
      );
    });
  });

  describe('create', () => {
    it('creates payment record with Stripe intent id', async () => {
      mockPrismaClient.payment.create.mockResolvedValueOnce(PAYMENT_PENDING);

      const result = await repository.create({
        orderId: PAYMENT_PENDING.orderId,
        customerId: PAYMENT_PENDING.customerId,
        gateway: PAYMENT_PENDING.gateway,
        method: PAYMENT_PENDING.method,
        status: PAYMENT_PENDING.status,
        stripePaymentIntentId: PAYMENT_PENDING.stripePaymentIntentId,
        stripeClientSecret: PAYMENT_PENDING.stripeClientSecret,
        amount: PAYMENT_PENDING.amount,
        amountCaptured: 0,
        currency: PAYMENT_PENDING.currency,
        idempotencyKey: PAYMENT_PENDING.idempotencyKey,
      });

      expect(result).toMatchObject({ id: PAYMENT_PENDING.id });
      expect(mockPrismaClient.payment.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    it('updates payment status to SUCCEEDED with paidAt', async () => {
      const paidAt = new Date();
      const updated = { ...PAYMENT_PENDING, status: PaymentStatus.SUCCEEDED, paidAt };
      mockPrismaClient.payment.update.mockResolvedValueOnce(updated);

      const result = await repository.update(PAYMENT_PENDING.id, { status: PaymentStatus.SUCCEEDED, paidAt });

      expect(result.status).toBe(PaymentStatus.SUCCEEDED);
      expect(result.paidAt).toEqual(paidAt);
    });
  });
});