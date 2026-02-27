import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { setupUnitTest, mockPrismaClient } from '../../src/tests-helpers/setup';
import { RefundRepository } from '../../src/app/refunds/refund.repository';
import { RefundStatus, RefundType } from '../../src/shared/types';
import { REFUND_FULL_SUCCEEDED, REFUND_PARTIAL_SUCCEEDED, ALL_REFUNDS, PAYMENT_REFUNDED } from '../../tests/fixtures';

setupUnitTest();

describe('RefundRepository', () => {
  let repository: RefundRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new RefundRepository(mockPrismaClient as any);
  });

  describe('findById', () => {
    it('returns refund when found', async () => {
      mockPrismaClient.refund.findUnique.mockResolvedValueOnce(REFUND_FULL_SUCCEEDED);
      const result = await repository.findById(REFUND_FULL_SUCCEEDED.id);
      expect(result).toMatchObject({ id: REFUND_FULL_SUCCEEDED.id });
    });

    it('returns null when not found', async () => {
      mockPrismaClient.refund.findUnique.mockResolvedValueOnce(null);
      const result = await repository.findById('unknown');
      expect(result).toBeNull();
    });
  });

  describe('findByPaymentId', () => {
    it('returns all refunds for a payment', async () => {
      mockPrismaClient.refund.findMany.mockResolvedValueOnce([REFUND_FULL_SUCCEEDED]);
      const result = await repository.findByPaymentId(PAYMENT_REFUNDED.id);
      expect(result).toHaveLength(1);
    });
  });

  describe('getTotalRefundedByPaymentId', () => {
    it('returns sum of succeeded refund amounts', async () => {
      mockPrismaClient.refund.aggregate.mockResolvedValueOnce({ _sum: { amount: 3838.80 } });
      const total = await repository.getTotalRefundedByPaymentId(PAYMENT_REFUNDED.id);
      expect(total).toBe(3838.80);
    });

    it('returns 0 when no refunds exist', async () => {
      mockPrismaClient.refund.aggregate.mockResolvedValueOnce({ _sum: { amount: null } });
      const total = await repository.getTotalRefundedByPaymentId('no-refunds-payment');
      expect(total).toBe(0);
    });
  });

  describe('create', () => {
    it('creates refund record', async () => {
      mockPrismaClient.refund.create.mockResolvedValueOnce(REFUND_PENDING);
      const result = await repository.create({
        paymentId: REFUND_PENDING.paymentId,
        orderId: REFUND_PENDING.orderId,
        type: RefundType.FULL,
        status: RefundStatus.PENDING,
        reason: 'CUSTOMER_REQUEST',
        note: null,
        amount: REFUND_PENDING.amount,
        currency: REFUND_PENDING.currency,
        initiatedByUserId: null,
        initiatedBy: 'CUSTOMER',
        initiatedAt: new Date(),
      });
      expect(result.id).toBe(REFUND_PENDING.id);
    });
  });

  describe('update', () => {
    it('updates refund status', async () => {
      const updated = { ...REFUND_PENDING, status: RefundStatus.SUCCEEDED, stripeRefundId: 're_mock' };
      mockPrismaClient.refund.update.mockResolvedValueOnce(updated);
      const result = await repository.update(REFUND_PENDING.id, { status: RefundStatus.SUCCEEDED, stripeRefundId: 're_mock' });
      expect(result.status).toBe(RefundStatus.SUCCEEDED);
    });
  });
});
