import { LoyaltyService } from '../../src/app/loyalty/loyalty.service';
import { LoyaltyRepository } from '../../src/app/loyalty/loyalty.repository';
import { AppError } from '../../src/shared/errors';

jest.mock('../../src/app/loyalty/loyalty.repository');

const mockRepository = {
  findByCustomerId: jest.fn(),
  create: jest.fn(),
  addPoints: jest.fn(),
  deductPoints: jest.fn(),
  getTransactions: jest.fn(),
  getTier: jest.fn(),
  updateTier: jest.fn(),
};

describe('LoyaltyService', () => {
  let service: LoyaltyService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new LoyaltyService(mockRepository as unknown as LoyaltyRepository);
  });

  describe('getAccount', () => {
    it('should return loyalty account for customer', async () => {
      const account = { id: 'loy-1', customerId: 'cust-1', points: 1500, tier: 'SILVER', createdAt: new Date() };
      mockRepository.findByCustomerId.mockResolvedValue(account);

      const result = await service.getAccount('cust-1');

      expect(result).toEqual(account);
      expect(mockRepository.findByCustomerId).toHaveBeenCalledWith('cust-1');
    });

    it('should throw AppError 404 when account not found', async () => {
      mockRepository.findByCustomerId.mockResolvedValue(null);

      await expect(service.getAccount('cust-no-account')).rejects.toThrow(AppError);
      await expect(service.getAccount('cust-no-account')).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('createAccount', () => {
    it('should create loyalty account with zero points and BRONZE tier', async () => {
      const created = { id: 'loy-new', customerId: 'cust-1', points: 0, tier: 'BRONZE', createdAt: new Date() };
      mockRepository.findByCustomerId.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(created);

      const result = await service.createAccount('cust-1');

      expect(result.points).toBe(0);
      expect(result.tier).toBe('BRONZE');
      expect(mockRepository.create).toHaveBeenCalledWith({ customerId: 'cust-1', points: 0, tier: 'BRONZE' });
    });

    it('should throw AppError 409 when account already exists', async () => {
      mockRepository.findByCustomerId.mockResolvedValue({ id: 'loy-1', customerId: 'cust-1' });

      await expect(service.createAccount('cust-1')).rejects.toThrow(AppError);
      await expect(service.createAccount('cust-1')).rejects.toMatchObject({ statusCode: 409 });
    });
  });

  describe('addPoints', () => {
    it('should add points and upgrade tier when threshold crossed', async () => {
      const account = { id: 'loy-1', customerId: 'cust-1', points: 900, tier: 'BRONZE' };
      const updated = { ...account, points: 1100, tier: 'SILVER' };

      mockRepository.findByCustomerId.mockResolvedValue(account);
      mockRepository.addPoints.mockResolvedValue(updated);
      mockRepository.updateTier.mockResolvedValue(updated);

      const result = await service.addPoints('cust-1', 200, 'PURCHASE');

      expect(result.points).toBe(1100);
      expect(mockRepository.addPoints).toHaveBeenCalledWith('cust-1', 200, 'PURCHASE');
    });

    it('should throw AppError when points amount is not positive', async () => {
      mockRepository.findByCustomerId.mockResolvedValue({ id: 'loy-1', customerId: 'cust-1' });

      await expect(service.addPoints('cust-1', 0, 'PURCHASE')).rejects.toThrow(AppError);
      await expect(service.addPoints('cust-1', -100, 'PURCHASE')).rejects.toThrow(AppError);
    });
  });

  describe('deductPoints', () => {
    it('should deduct points when sufficient balance', async () => {
      const account = { id: 'loy-1', customerId: 'cust-1', points: 500, tier: 'BRONZE' };
      const updated = { ...account, points: 300 };

      mockRepository.findByCustomerId.mockResolvedValue(account);
      mockRepository.deductPoints.mockResolvedValue(updated);

      const result = await service.deductPoints('cust-1', 200, 'REDEMPTION');

      expect(result.points).toBe(300);
      expect(mockRepository.deductPoints).toHaveBeenCalledWith('cust-1', 200, 'REDEMPTION');
    });

    it('should throw AppError 400 when insufficient points', async () => {
      const account = { id: 'loy-1', customerId: 'cust-1', points: 100, tier: 'BRONZE' };
      mockRepository.findByCustomerId.mockResolvedValue(account);

      await expect(service.deductPoints('cust-1', 500, 'REDEMPTION')).rejects.toThrow(AppError);
      await expect(service.deductPoints('cust-1', 500, 'REDEMPTION')).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe('getTransactions', () => {
    it('should return paginated loyalty transactions', async () => {
      const transactions = [
        { id: 'tx-1', customerId: 'cust-1', points: 200, type: 'CREDIT', reason: 'PURCHASE', createdAt: new Date() },
        { id: 'tx-2', customerId: 'cust-1', points: -50, type: 'DEBIT', reason: 'REDEMPTION', createdAt: new Date() },
      ];
      mockRepository.getTransactions.mockResolvedValue({ data: transactions, total: 2, page: 1, limit: 10 });

      const result = await service.getTransactions('cust-1', { page: 1, limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });
  });

  describe('calculateTier', () => {
    it('should return BRONZE for points below 1000', () => {
      expect(service.calculateTier(0)).toBe('BRONZE');
      expect(service.calculateTier(999)).toBe('BRONZE');
    });

    it('should return SILVER for points between 1000 and 4999', () => {
      expect(service.calculateTier(1000)).toBe('SILVER');
      expect(service.calculateTier(4999)).toBe('SILVER');
    });

    it('should return GOLD for points between 5000 and 9999', () => {
      expect(service.calculateTier(5000)).toBe('GOLD');
      expect(service.calculateTier(9999)).toBe('GOLD');
    });

    it('should return PLATINUM for points 10000 and above', () => {
      expect(service.calculateTier(10000)).toBe('PLATINUM');
      expect(service.calculateTier(99999)).toBe('PLATINUM');
    });
  });
});