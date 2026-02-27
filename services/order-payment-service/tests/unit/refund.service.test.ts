import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { setupUnitTest, mockPrismaClient, mockStripeClient, mockEventProducer, mockLogger, setupPrismaTransactionMock } from '../../src/tests-helpers/setup';
import { RefundService } from '../../src/app/refunds/refund.service';
import { RefundRepository } from '../../src/app/refunds/refund.repository';
import { RefundNotEligibleError, RefundExceedsAmountError, RefundNotFoundError } from '../../src/shared/errors';
import { RefundStatus, RefundType, PaymentStatus } from '../../src/shared/types';
import {
  REFUND_FULL_SUCCEEDED,
  REFUND_PARTIAL_SUCCEEDED,
  REFUND_PENDING,
  PAYMENT_SUCCEEDED,
  PAYMENT_FAILED,
  ORDER_CONFIRMED,
  ORDER_REFUNDED,
  STRIPE_REFUND_MOCK,
  CUSTOMER_SNAPSHOT_3,
} from '../../tests/fixtures';

setupUnitTest();

const mockRefundRepository = {
  findById: jest.fn(),
  findByPaymentId: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  getTotalRefundedByPaymentId: jest.fn(),
};
const mockPaymentRepository = { findById: jest.fn(), update: jest.fn() };
const mockOrderRepository = { findById: jest.fn(), update: jest.fn() };

jest.mock('../../src/app/refunds/refund.repository', () => ({
  RefundRepository: jest.fn().mockImplementation(() => mockRefundRepository),
}));

describe('RefundService', () => {
  let refundService: RefundService;

  beforeEach(() => {
    jest.clearAllMocks();
    setupPrismaTransactionMock();
    refundService = new RefundService(
      mockRefundRepository as unknown as RefundRepository,
      mockPaymentRepository as any,
      mockOrderRepository as any,
      mockStripeClient as any,
      mockPrismaClient as any,
      mockEventProducer as any,
      mockLogger as any,
    );
  });

  describe('issueRefund', () => {
    const refundInput = {
      paymentId: PAYMENT_SUCCEEDED.id,
      orderId: ORDER_CONFIRMED.id,
      refundAmount: ORDER_CONFIRMED.totalAmount,
      refundType: RefundType.FULL,
      refundReason: 'CUSTOMER_REQUEST',
      refundNote: null,
      initiatedByUserId: null,
      initiator: 'CUSTOMER' as const,
      idempotencyKey: 'idem-refund-001',
    };

    it('issues a full refund successfully', async () => {
      mockPaymentRepository.findById.mockResolvedValueOnce(PAYMENT_SUCCEEDED);
      mockRefundRepository.getTotalRefundedByPaymentId.mockResolvedValueOnce(0);
      mockStripeClient.refunds.create.mockResolvedValueOnce(STRIPE_REFUND_MOCK);
      mockRefundRepository.create.mockResolvedValueOnce(REFUND_FULL_SUCCEEDED);
      mockPaymentRepository.update.mockResolvedValueOnce({ ...PAYMENT_SUCCEEDED, status: PaymentStatus.REFUNDED });
      mockOrderRepository.update.mockResolvedValueOnce(ORDER_REFUNDED);

      const result = await refundService.issueRefund(refundInput);

      expect(result).toMatchObject({ id: REFUND_FULL_SUCCEEDED.id });
      expect(mockEventProducer.publish).toHaveBeenCalledTimes(1);
    });

    it('throws RefundNotEligibleError when payment not SUCCEEDED', async () => {
      mockPaymentRepository.findById.mockResolvedValueOnce(PAYMENT_FAILED);

      await expect(refundService.issueRefund(refundInput)).rejects.toThrow(RefundNotEligibleError);
      expect(mockStripeClient.refunds.create).not.toHaveBeenCalled();
    });

    it('throws RefundExceedsAmountError when refund amount exceeds original', async () => {
      mockPaymentRepository.findById.mockResolvedValueOnce(PAYMENT_SUCCEEDED);
      mockRefundRepository.getTotalRefundedByPaymentId.mockResolvedValueOnce(0);

      await expect(
        refundService.issueRefund({ ...refundInput, refundAmount: PAYMENT_SUCCEEDED.amount + 1 }),
      ).rejects.toThrow(RefundExceedsAmountError);
    });

    it('throws RefundExceedsAmountError when cumulative refunds exceed payment amount', async () => {
      mockPaymentRepository.findById.mockResolvedValueOnce(PAYMENT_SUCCEEDED);
      mockRefundRepository.getTotalRefundedByPaymentId.mockResolvedValueOnce(PAYMENT_SUCCEEDED.amount);

      await expect(refundService.issueRefund({ ...refundInput, refundAmount: 1 })).rejects.toThrow(
        RefundExceedsAmountError,
      );
    });
  });

  describe('getRefund', () => {
    it('returns refund when found', async () => {
      mockRefundRepository.findById.mockResolvedValueOnce(REFUND_FULL_SUCCEEDED);

      const result = await refundService.getRefund(REFUND_FULL_SUCCEEDED.id);

      expect(result).toMatchObject({ id: REFUND_FULL_SUCCEEDED.id });
    });

    it('throws RefundNotFoundError when refund missing', async () => {
      mockRefundRepository.findById.mockResolvedValueOnce(null);

      await expect(refundService.getRefund('unknown')).rejects.toThrow(RefundNotFoundError);
    });
  });

  describe('getRefunds', () => {
    it('returns paginated refunds', async () => {
      mockRefundRepository.findMany.mockResolvedValueOnce([REFUND_FULL_SUCCEEDED, REFUND_PARTIAL_SUCCEEDED]);

      const result = await refundService.getRefunds({ page: 1, limit: 20 }, {});

      expect(result.data).toHaveLength(2);
    });
  });
});