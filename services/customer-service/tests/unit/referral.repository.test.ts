import { LoyaltyRepository } from '../../src/app/loyalty/loyalty.repository';
import { PrismaClient } from '@prisma/client';

jest.mock('@prisma/client', () => {
  const mockPrisma = {
    loyaltyAccount: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    loyaltyTransaction: {
      findMany: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  return { PrismaClient: jest.fn(() => mockPrisma) };
});

describe('LoyaltyRepository', () => {
  let repository: LoyaltyRepository;
  let prisma: PrismaClient;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = new PrismaClient();
    repository = new LoyaltyRepository(prisma);
  });

  describe('findByCustomerId', () => {
    it('should find loyalty account by customerId', async () => {
      const account = { id: 'loy-1', customerId: 'cust-1', points: 500, tier: 'BRONZE' };
      (prisma.loyaltyAccount.findUnique as jest.Mock).mockResolvedValue(account);

      const result = await repository.findByCustomerId('cust-1');

      expect(result).toEqual(account);
      expect(prisma.loyaltyAccount.findUnique).toHaveBeenCalledWith({
        where: { customerId: 'cust-1' },
      });
    });

    it('should return null when account not found', async () => {
      (prisma.loyaltyAccount.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repository.findByCustomerId('cust-no-account');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a loyalty account', async () => {
      const input = { customerId: 'cust-1', points: 0, tier: 'BRONZE' };
      const created = { id: 'loy-new', ...input, createdAt: new Date() };
      (prisma.loyaltyAccount.create as jest.Mock).mockResolvedValue(created);

      const result = await repository.create(input);

      expect(result).toEqual(created);
      expect(prisma.loyaltyAccount.create).toHaveBeenCalledWith({ data: input });
    });
  });

  describe('addPoints', () => {
    it('should increment points and create a transaction record atomically', async () => {
      const updatedAccount = { id: 'loy-1', customerId: 'cust-1', points: 700 };
      const transaction = { id: 'tx-1', customerId: 'cust-1', points: 200, type: 'CREDIT', reason: 'PURCHASE' };

      (prisma.$transaction as jest.Mock).mockImplementation(async (fn: (tx: PrismaClient) => Promise<unknown>) => {
        return fn(prisma);
      });
      (prisma.loyaltyAccount.update as jest.Mock).mockResolvedValue(updatedAccount);
      (prisma.loyaltyTransaction.create as jest.Mock).mockResolvedValue(transaction);

      const result = await repository.addPoints('cust-1', 200, 'PURCHASE');

      expect(result).toEqual(updatedAccount);
      expect(prisma.loyaltyAccount.update).toHaveBeenCalledWith({
        where: { customerId: 'cust-1' },
        data: { points: { increment: 200 } },
      });
      expect(prisma.loyaltyTransaction.create).toHaveBeenCalledWith({
        data: { customerId: 'cust-1', points: 200, type: 'CREDIT', reason: 'PURCHASE' },
      });
    });
  });

  describe('deductPoints', () => {
    it('should decrement points and create a debit transaction atomically', async () => {
      const updatedAccount = { id: 'loy-1', customerId: 'cust-1', points: 300 };
      const transaction = { id: 'tx-2', customerId: 'cust-1', points: -200, type: 'DEBIT', reason: 'REDEMPTION' };

      (prisma.$transaction as jest.Mock).mockImplementation(async (fn: (tx: PrismaClient) => Promise<unknown>) => {
        return fn(prisma);
      });
      (prisma.loyaltyAccount.update as jest.Mock).mockResolvedValue(updatedAccount);
      (prisma.loyaltyTransaction.create as jest.Mock).mockResolvedValue(transaction);

      const result = await repository.deductPoints('cust-1', 200, 'REDEMPTION');

      expect(result).toEqual(updatedAccount);
      expect(prisma.loyaltyAccount.update).toHaveBeenCalledWith({
        where: { customerId: 'cust-1' },
        data: { points: { decrement: 200 } },
      });
      expect(prisma.loyaltyTransaction.create).toHaveBeenCalledWith({
        data: { customerId: 'cust-1', points: -200, type: 'DEBIT', reason: 'REDEMPTION' },
      });
    });
  });

  describe('updateTier', () => {
    it('should update the tier field on the loyalty account', async () => {
      const updated = { id: 'loy-1', customerId: 'cust-1', points: 1200, tier: 'SILVER' };
      (prisma.loyaltyAccount.update as jest.Mock).mockResolvedValue(updated);

      const result = await repository.updateTier('cust-1', 'SILVER');

      expect(result.tier).toBe('SILVER');
      expect(prisma.loyaltyAccount.update).toHaveBeenCalledWith({
        where: { customerId: 'cust-1' },
        data: { tier: 'SILVER' },
      });
    });
  });

  describe('getTransactions', () => {
    it('should return paginated transactions ordered by createdAt desc', async () => {
      const transactions = [
        { id: 'tx-3', customerId: 'cust-1', points: 100, type: 'CREDIT', createdAt: new Date('2025-03-01') },
        { id: 'tx-2', customerId: 'cust-1', points: -50, type: 'DEBIT', createdAt: new Date('2025-02-01') },
      ];
      (prisma.loyaltyTransaction.findMany as jest.Mock).mockResolvedValue(transactions);
      (prisma.loyaltyTransaction.count as jest.Mock).mockResolvedValue(2);

      const result = await repository.getTransactions('cust-1', { page: 1, limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(prisma.loyaltyTransaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { customerId: 'cust-1' },
          skip: 0,
          take: 10,
          orderBy: { createdAt: 'desc' },
        })
      );
    });
  });
});