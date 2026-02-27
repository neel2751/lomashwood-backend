import { TransactionRepository } from '../../src/app/payments/payment.repository';
import { PrismaClient, TransactionStatus, PaymentMethod } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

jest.mock('../../src/infrastructure/db/prisma.client', () => ({
  prisma: mockDeep<PrismaClient>(),
}));

import { prisma } from '../../src/infrastructure/db/prisma.client';

const prismaMock = prisma as DeepMockProxy<PrismaClient>;

describe('TransactionRepository', () => {
  let repository: TransactionRepository;

  const mockTransaction = {
    id: 'txn-uuid-001',
    orderId: 'order-uuid-001',
    paymentId: 'pay-uuid-001',
    stripeChargeId: 'ch_test_abc123',
    amount: 150000,
    currency: 'GBP',
    status: TransactionStatus.SUCCEEDED,
    method: PaymentMethod.CARD,
    metadata: {},
    createdAt: new Date('2026-01-01T10:00:00Z'),
    updatedAt: new Date('2026-01-01T10:00:00Z'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new TransactionRepository();
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should create a transaction record and return it', async () => {
      prismaMock.transaction.create.mockResolvedValue(mockTransaction as any);

      const result = await repository.create({
        orderId: 'order-uuid-001',
        paymentId: 'pay-uuid-001',
        stripeChargeId: 'ch_test_abc123',
        amount: 150000,
        currency: 'GBP',
        status: TransactionStatus.SUCCEEDED,
        method: PaymentMethod.CARD,
      });

      expect(prismaMock.transaction.create).toHaveBeenCalledTimes(1);
      expect(result).toMatchObject({
        id: 'txn-uuid-001',
        stripeChargeId: 'ch_test_abc123',
        status: TransactionStatus.SUCCEEDED,
      });
    });

    it('should propagate a database error on create failure', async () => {
      prismaMock.transaction.create.mockRejectedValue(new Error('DB constraint violation'));

      await expect(
        repository.create({
          orderId: 'order-uuid-001',
          paymentId: 'pay-uuid-001',
          stripeChargeId: 'ch_test_fail',
          amount: 150000,
          currency: 'GBP',
          status: TransactionStatus.PENDING,
          method: PaymentMethod.CARD,
        }),
      ).rejects.toThrow('DB constraint violation');
    });
  });

  // ─── findById ─────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('should return a transaction when found by id', async () => {
      prismaMock.transaction.findUnique.mockResolvedValue(mockTransaction as any);

      const result = await repository.findById('txn-uuid-001');

      expect(prismaMock.transaction.findUnique).toHaveBeenCalledWith({
        where: { id: 'txn-uuid-001' },
      });
      expect(result).not.toBeNull();
      expect(result?.id).toBe('txn-uuid-001');
    });

    it('should return null when transaction is not found', async () => {
      prismaMock.transaction.findUnique.mockResolvedValue(null);

      const result = await repository.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  // ─── findByOrderId ────────────────────────────────────────────────────────

  describe('findByOrderId', () => {
    it('should return all transactions for a given orderId', async () => {
      const secondTxn = { ...mockTransaction, id: 'txn-uuid-002' };
      prismaMock.transaction.findMany.mockResolvedValue([mockTransaction, secondTxn] as any);

      const result = await repository.findByOrderId('order-uuid-001');

      expect(prismaMock.transaction.findMany).toHaveBeenCalledWith({
        where: { orderId: 'order-uuid-001' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(2);
    });

    it('should return an empty array when no transactions exist for orderId', async () => {
      prismaMock.transaction.findMany.mockResolvedValue([]);

      const result = await repository.findByOrderId('order-uuid-no-txns');

      expect(result).toEqual([]);
    });
  });

  // ─── findByPaymentId ──────────────────────────────────────────────────────

  describe('findByPaymentId', () => {
    it('should return all transactions for a given paymentId', async () => {
      prismaMock.transaction.findMany.mockResolvedValue([mockTransaction] as any);

      const result = await repository.findByPaymentId('pay-uuid-001');

      expect(prismaMock.transaction.findMany).toHaveBeenCalledWith({
        where: { paymentId: 'pay-uuid-001' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(1);
    });
  });

  // ─── findByStripeChargeId ─────────────────────────────────────────────────

  describe('findByStripeChargeId', () => {
    it('should return a transaction matching the stripeChargeId', async () => {
      prismaMock.transaction.findFirst.mockResolvedValue(mockTransaction as any);

      const result = await repository.findByStripeChargeId('ch_test_abc123');

      expect(prismaMock.transaction.findFirst).toHaveBeenCalledWith({
        where: { stripeChargeId: 'ch_test_abc123' },
      });
      expect(result?.stripeChargeId).toBe('ch_test_abc123');
    });

    it('should return null if stripeChargeId does not match any transaction', async () => {
      prismaMock.transaction.findFirst.mockResolvedValue(null);

      const result = await repository.findByStripeChargeId('ch_not_exist');

      expect(result).toBeNull();
    });
  });

  // ─── updateStatus ─────────────────────────────────────────────────────────

  describe('updateStatus', () => {
    it('should update the transaction status and return the updated record', async () => {
      const updated = { ...mockTransaction, status: TransactionStatus.FAILED };
      prismaMock.transaction.update.mockResolvedValue(updated as any);

      const result = await repository.updateStatus('txn-uuid-001', TransactionStatus.FAILED);

      expect(prismaMock.transaction.update).toHaveBeenCalledWith({
        where: { id: 'txn-uuid-001' },
        data: {
          status: TransactionStatus.FAILED,
          updatedAt: expect.any(Date),
        },
      });
      expect(result.status).toBe(TransactionStatus.FAILED);
    });

    it('should throw if the transaction does not exist during status update', async () => {
      prismaMock.transaction.update.mockRejectedValue(
        new Error('Record to update not found'),
      );

      await expect(
        repository.updateStatus('non-existent', TransactionStatus.FAILED),
      ).rejects.toThrow('Record to update not found');
    });
  });

  // ─── getTransactionSummaryByOrder ─────────────────────────────────────────

  describe('getTransactionSummaryByOrder', () => {
    it('should return aggregated totals grouped by status for an order', async () => {
      const groupResult = [
        { status: TransactionStatus.SUCCEEDED, _sum: { amount: 150000 }, _count: { id: 1 } },
        { status: TransactionStatus.FAILED, _sum: { amount: 50000 }, _count: { id: 1 } },
      ];
      prismaMock.transaction.groupBy.mockResolvedValue(groupResult as any);

      const result = await repository.getTransactionSummaryByOrder('order-uuid-001');

      expect(prismaMock.transaction.groupBy).toHaveBeenCalledWith({
        by: ['status'],
        where: { orderId: 'order-uuid-001' },
        _sum: { amount: true },
        _count: { id: true },
      });
      expect(result).toHaveLength(2);
    });
  });

  // ─── findPaginated ────────────────────────────────────────────────────────

  describe('findPaginated', () => {
    it('should return paginated transactions with total count', async () => {
      prismaMock.transaction.findMany.mockResolvedValue([mockTransaction] as any);
      prismaMock.transaction.count.mockResolvedValue(1);

      const result = await repository.findPaginated({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should filter by status when provided', async () => {
      prismaMock.transaction.findMany.mockResolvedValue([mockTransaction] as any);
      prismaMock.transaction.count.mockResolvedValue(1);

      await repository.findPaginated({ page: 1, limit: 10, status: TransactionStatus.SUCCEEDED });

      expect(prismaMock.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: TransactionStatus.SUCCEEDED }),
        }),
      );
    });

    it('should filter by dateRange when provided', async () => {
      prismaMock.transaction.findMany.mockResolvedValue([mockTransaction] as any);
      prismaMock.transaction.count.mockResolvedValue(1);

      const from = new Date('2026-01-01');
      const to = new Date('2026-01-31');

      await repository.findPaginated({ page: 1, limit: 10, from, to });

      expect(prismaMock.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: { gte: from, lte: to },
          }),
        }),
      );
    });
  });

  // ─── deleteById ───────────────────────────────────────────────────────────

  describe('deleteById', () => {
    it('should delete a transaction by id', async () => {
      prismaMock.transaction.delete.mockResolvedValue(mockTransaction as any);

      await repository.deleteById('txn-uuid-001');

      expect(prismaMock.transaction.delete).toHaveBeenCalledWith({
        where: { id: 'txn-uuid-001' },
      });
    });

    it('should throw if the transaction to delete is not found', async () => {
      prismaMock.transaction.delete.mockRejectedValue(
        new Error('Record to delete not found'),
      );

      await expect(repository.deleteById('ghost-id')).rejects.toThrow(
        'Record to delete not found',
      );
    });
  });
});