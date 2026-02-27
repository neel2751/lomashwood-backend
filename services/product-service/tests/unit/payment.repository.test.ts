import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { PaymentRepository } from '../../src/app/payments/payment.repository';
import { CreatePaymentDto, UpdatePaymentDto } from '../../src/app/payments/payment.types';
import { PaymentStatus, PaymentMethod } from '@prisma/client';

jest.mock('../../src/infrastructure/db/prisma.client', () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>(),
}));

describe('PaymentRepository', () => {
  let repository: PaymentRepository;
  let prismaMock: DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    prismaMock = mockDeep<PrismaClient>();
    repository = new PaymentRepository(prismaMock as any);
  });

  afterEach(() => {
    mockReset(prismaMock);
  });

  describe('create', () => {
    it('should create a new payment record', async () => {
      const createDto: CreatePaymentDto = {
        orderId: 'order-123',
        amount: 25000,
        currency: 'GBP',
        method: PaymentMethod.STRIPE,
        status: PaymentStatus.PENDING,
        stripePaymentIntentId: 'pi_123456789',
        metadata: {
          customerId: 'cust-123',
          productIds: ['prod-1', 'prod-2'],
        },
      };

      const mockPayment = {
        id: 'payment-123',
        ...createDto,
        createdAt: new Date('2026-02-12T10:00:00Z'),
        updatedAt: new Date('2026-02-12T10:00:00Z'),
        deletedAt: null,
      };

      prismaMock.payment.create.mockResolvedValue(mockPayment as any);

      const result = await repository.create(createDto);

      expect(result).toEqual(mockPayment);
      expect(prismaMock.payment.create).toHaveBeenCalledWith({
        data: createDto,
      });
      expect(prismaMock.payment.create).toHaveBeenCalledTimes(1);
    });

    it('should throw error when payment creation fails', async () => {
      const createDto: CreatePaymentDto = {
        orderId: 'order-123',
        amount: 25000,
        currency: 'GBP',
        method: PaymentMethod.STRIPE,
        status: PaymentStatus.PENDING,
        stripePaymentIntentId: 'pi_123456789',
      };

      prismaMock.payment.create.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(repository.create(createDto)).rejects.toThrow(
        'Database connection failed'
      );
    });
  });

  describe('findById', () => {
    it('should return payment when found', async () => {
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
        deletedAt: null,
      };

      prismaMock.payment.findUnique.mockResolvedValue(mockPayment as any);

      const result = await repository.findById(paymentId);

      expect(result).toEqual(mockPayment);
      expect(prismaMock.payment.findUnique).toHaveBeenCalledWith({
        where: { id: paymentId },
      });
    });

    it('should return null when payment not found', async () => {
      const paymentId = 'non-existent-payment';

      prismaMock.payment.findUnique.mockResolvedValue(null);

      const result = await repository.findById(paymentId);

      expect(result).toBeNull();
      expect(prismaMock.payment.findUnique).toHaveBeenCalledWith({
        where: { id: paymentId },
      });
    });
  });

  describe('findByOrderId', () => {
    it('should return payments for a specific order', async () => {
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
          deletedAt: null,
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
          deletedAt: null,
        },
      ];

      prismaMock.payment.findMany.mockResolvedValue(mockPayments as any);

      const result = await repository.findByOrderId(orderId);

      expect(result).toEqual(mockPayments);
      expect(prismaMock.payment.findMany).toHaveBeenCalledWith({
        where: { orderId },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array when no payments found', async () => {
      const orderId = 'order-with-no-payments';

      prismaMock.payment.findMany.mockResolvedValue([]);

      const result = await repository.findByOrderId(orderId);

      expect(result).toEqual([]);
    });
  });

  describe('findByStripePaymentIntentId', () => {
    it('should return payment when found by Stripe payment intent ID', async () => {
      const stripePaymentIntentId = 'pi_123456789';
      const mockPayment = {
        id: 'payment-123',
        orderId: 'order-123',
        amount: 25000,
        currency: 'GBP',
        method: PaymentMethod.STRIPE,
        status: PaymentStatus.SUCCEEDED,
        stripePaymentIntentId,
        metadata: {},
        createdAt: new Date('2026-02-12T10:00:00Z'),
        updatedAt: new Date('2026-02-12T10:00:00Z'),
        deletedAt: null,
      };

      prismaMock.payment.findUnique.mockResolvedValue(mockPayment as any);

      const result = await repository.findByStripePaymentIntentId(
        stripePaymentIntentId
      );

      expect(result).toEqual(mockPayment);
      expect(prismaMock.payment.findUnique).toHaveBeenCalledWith({
        where: { stripePaymentIntentId },
      });
    });

    it('should return null when payment not found', async () => {
      const stripePaymentIntentId = 'pi_nonexistent';

      prismaMock.payment.findUnique.mockResolvedValue(null);

      const result = await repository.findByStripePaymentIntentId(
        stripePaymentIntentId
      );

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update payment status', async () => {
      const paymentId = 'payment-123';
      const updateDto: UpdatePaymentDto = {
        status: PaymentStatus.SUCCEEDED,
        metadata: {
          transactionId: 'txn_123',
          completedAt: new Date('2026-02-12T10:30:00Z').toISOString(),
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
        deletedAt: null,
      };

      prismaMock.payment.update.mockResolvedValue(mockUpdatedPayment as any);

      const result = await repository.update(paymentId, updateDto);

      expect(result).toEqual(mockUpdatedPayment);
      expect(prismaMock.payment.update).toHaveBeenCalledWith({
        where: { id: paymentId },
        data: updateDto,
      });
    });

    it('should throw error when updating non-existent payment', async () => {
      const paymentId = 'non-existent-payment';
      const updateDto: UpdatePaymentDto = {
        status: PaymentStatus.FAILED,
      };

      prismaMock.payment.update.mockRejectedValue(
        new Error('Record not found')
      );

      await expect(repository.update(paymentId, updateDto)).rejects.toThrow(
        'Record not found'
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated payments with default pagination', async () => {
      const mockPayments = [
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
          deletedAt: null,
        },
        {
          id: 'payment-2',
          orderId: 'order-2',
          amount: 20000,
          currency: 'GBP',
          method: PaymentMethod.STRIPE,
          status: PaymentStatus.SUCCEEDED,
          stripePaymentIntentId: 'pi_222',
          metadata: {},
          createdAt: new Date('2026-02-12T11:00:00Z'),
          updatedAt: new Date('2026-02-12T11:00:00Z'),
          deletedAt: null,
        },
      ];

      prismaMock.payment.findMany.mockResolvedValue(mockPayments as any);
      prismaMock.payment.count.mockResolvedValue(2);

      const result = await repository.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual(mockPayments);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(prismaMock.payment.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        where: {},
      });
    });

    it('should filter payments by status', async () => {
      const mockPayments = [
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
          deletedAt: null,
        },
      ];

      prismaMock.payment.findMany.mockResolvedValue(mockPayments as any);
      prismaMock.payment.count.mockResolvedValue(1);

      const result = await repository.findAll({
        page: 1,
        limit: 10,
        status: PaymentStatus.PENDING,
      });

      expect(result.data).toEqual(mockPayments);
      expect(prismaMock.payment.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        where: { status: PaymentStatus.PENDING },
      });
    });

    it('should handle pagination correctly', async () => {
      const mockPayments = [
        {
          id: 'payment-11',
          orderId: 'order-11',
          amount: 15000,
          currency: 'GBP',
          method: PaymentMethod.STRIPE,
          status: PaymentStatus.SUCCEEDED,
          stripePaymentIntentId: 'pi_111',
          metadata: {},
          createdAt: new Date('2026-02-12T10:00:00Z'),
          updatedAt: new Date('2026-02-12T10:00:00Z'),
          deletedAt: null,
        },
      ];

      prismaMock.payment.findMany.mockResolvedValue(mockPayments as any);
      prismaMock.payment.count.mockResolvedValue(25);

      const result = await repository.findAll({ page: 2, limit: 10 });

      expect(result.data).toEqual(mockPayments);
      expect(result.total).toBe(25);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(prismaMock.payment.findMany).toHaveBeenCalledWith({
        skip: 10,
        take: 10,
        orderBy: { createdAt: 'desc' },
        where: {},
      });
    });
  });

  describe('delete', () => {
    it('should soft delete payment', async () => {
      const paymentId = 'payment-123';
      const mockDeletedPayment = {
        id: paymentId,
        orderId: 'order-123',
        amount: 25000,
        currency: 'GBP',
        method: PaymentMethod.STRIPE,
        status: PaymentStatus.SUCCEEDED,
        stripePaymentIntentId: 'pi_123456789',
        metadata: {},
        createdAt: new Date('2026-02-12T10:00:00Z'),
        updatedAt: new Date('2026-02-12T10:30:00Z'),
        deletedAt: new Date('2026-02-12T10:30:00Z'),
      };

      prismaMock.payment.update.mockResolvedValue(mockDeletedPayment as any);

      const result = await repository.delete(paymentId);

      expect(result).toEqual(mockDeletedPayment);
      expect(prismaMock.payment.update).toHaveBeenCalledWith({
        where: { id: paymentId },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('should throw error when deleting non-existent payment', async () => {
      const paymentId = 'non-existent-payment';

      prismaMock.payment.update.mockRejectedValue(
        new Error('Record not found')
      );

      await expect(repository.delete(paymentId)).rejects.toThrow(
        'Record not found'
      );
    });
  });

  describe('getTotalAmountByStatus', () => {
    it('should return total amount for succeeded payments', async () => {
      const mockAggregation = {
        _sum: {
          amount: 150000,
        },
      };

      prismaMock.payment.aggregate.mockResolvedValue(mockAggregation as any);

      const result = await repository.getTotalAmountByStatus(
        PaymentStatus.SUCCEEDED
      );

      expect(result).toBe(150000);
      expect(prismaMock.payment.aggregate).toHaveBeenCalledWith({
        where: { status: PaymentStatus.SUCCEEDED },
        _sum: { amount: true },
      });
    });

    it('should return 0 when no payments found', async () => {
      const mockAggregation = {
        _sum: {
          amount: null,
        },
      };

      prismaMock.payment.aggregate.mockResolvedValue(mockAggregation as any);

      const result = await repository.getTotalAmountByStatus(
        PaymentStatus.PENDING
      );

      expect(result).toBe(0);
    });
  });

  describe('getPaymentsByDateRange', () => {
    it('should return payments within date range', async () => {
      const startDate = new Date('2026-02-01T00:00:00Z');
      const endDate = new Date('2026-02-28T23:59:59Z');

      const mockPayments = [
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
          deletedAt: null,
        },
      ];

      prismaMock.payment.findMany.mockResolvedValue(mockPayments as any);

      const result = await repository.getPaymentsByDateRange(
        startDate,
        endDate
      );

      expect(result).toEqual(mockPayments);
      expect(prismaMock.payment.findMany).toHaveBeenCalledWith({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array when no payments in date range', async () => {
      const startDate = new Date('2025-01-01T00:00:00Z');
      const endDate = new Date('2025-01-31T23:59:59Z');

      prismaMock.payment.findMany.mockResolvedValue([]);

      const result = await repository.getPaymentsByDateRange(
        startDate,
        endDate
      );

      expect(result).toEqual([]);
    });
  });

  describe('countByStatus', () => {
    it('should return count of payments by status', async () => {
      prismaMock.payment.count.mockResolvedValue(15);

      const result = await repository.countByStatus(PaymentStatus.SUCCEEDED);

      expect(result).toBe(15);
      expect(prismaMock.payment.count).toHaveBeenCalledWith({
        where: { status: PaymentStatus.SUCCEEDED },
      });
    });

    it('should return 0 when no payments with given status', async () => {
      prismaMock.payment.count.mockResolvedValue(0);

      const result = await repository.countByStatus(PaymentStatus.FAILED);

      expect(result).toBe(0);
    });
  });
});