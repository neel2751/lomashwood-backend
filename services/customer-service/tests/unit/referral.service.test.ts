import { ReferralService } from '../../src/app/referral/referral.service';
import { ReferralRepository } from '../../src/app/referral/referral.repository';
import { AppError } from '../../src/shared/errors';

jest.mock('../../src/app/referral/referral.repository');

const mockRepository = {
  findByCustomerId: jest.fn(),
  findByCode: jest.fn(),
  findByReferredId: jest.fn(),
  create: jest.fn(),
  recordReferral: jest.fn(),
  getStats: jest.fn(),
  findAll: jest.fn(),
};

describe('ReferralService', () => {
  let service: ReferralService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ReferralService(mockRepository as unknown as ReferralRepository);
  });

  describe('getOrCreateReferralCode', () => {
    it('should return existing referral code if one exists', async () => {
      const referral = { id: 'ref-1', customerId: 'cust-1', code: 'LW-JOHN123', usageCount: 3 };
      mockRepository.findByCustomerId.mockResolvedValue(referral);

      const result = await service.getOrCreateReferralCode('cust-1');

      expect(result).toEqual(referral);
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should create a new referral code if none exists', async () => {
      const created = { id: 'ref-new', customerId: 'cust-1', code: 'LW-NEWCODE', usageCount: 0 };
      mockRepository.findByCustomerId.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(created);

      const result = await service.getOrCreateReferralCode('cust-1');

      expect(result).toEqual(created);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ customerId: 'cust-1' })
      );
    });
  });

  describe('applyReferralCode', () => {
    it('should apply referral code for a new customer', async () => {
      const referral = { id: 'ref-1', customerId: 'cust-referrer', code: 'LW-JOHN123', usageCount: 0 };
      const recorded = { id: 'rec-1', referralId: 'ref-1', referredCustomerId: 'cust-new', createdAt: new Date() };

      mockRepository.findByCode.mockResolvedValue(referral);
      mockRepository.findByReferredId.mockResolvedValue(null);
      mockRepository.recordReferral.mockResolvedValue(recorded);

      const result = await service.applyReferralCode('LW-JOHN123', 'cust-new');

      expect(result).toEqual(recorded);
      expect(mockRepository.recordReferral).toHaveBeenCalledWith('ref-1', 'cust-new');
    });

    it('should throw AppError 404 when referral code not found', async () => {
      mockRepository.findByCode.mockResolvedValue(null);

      await expect(service.applyReferralCode('INVALID-CODE', 'cust-new')).rejects.toThrow(AppError);
      await expect(service.applyReferralCode('INVALID-CODE', 'cust-new')).rejects.toMatchObject({ statusCode: 404 });
    });

    it('should throw AppError 400 when customer applies their own code', async () => {
      const referral = { id: 'ref-1', customerId: 'cust-1', code: 'LW-OWN', usageCount: 0 };
      mockRepository.findByCode.mockResolvedValue(referral);

      await expect(service.applyReferralCode('LW-OWN', 'cust-1')).rejects.toThrow(AppError);
      await expect(service.applyReferralCode('LW-OWN', 'cust-1')).rejects.toMatchObject({ statusCode: 400 });
    });

    it('should throw AppError 409 when customer has already used a referral code', async () => {
      const referral = { id: 'ref-1', customerId: 'cust-referrer', code: 'LW-CODE', usageCount: 0 };
      const existingReferral = { id: 'rec-1', referredCustomerId: 'cust-1' };

      mockRepository.findByCode.mockResolvedValue(referral);
      mockRepository.findByReferredId.mockResolvedValue(existingReferral);

      await expect(service.applyReferralCode('LW-CODE', 'cust-1')).rejects.toThrow(AppError);
      await expect(service.applyReferralCode('LW-CODE', 'cust-1')).rejects.toMatchObject({ statusCode: 409 });
    });
  });

  describe('getStats', () => {
    it('should return referral statistics for a customer', async () => {
      const stats = { totalReferrals: 5, successfulReferrals: 3, pendingReferrals: 2, totalPointsEarned: 1500 };
      mockRepository.getStats.mockResolvedValue(stats);

      const result = await service.getStats('cust-1');

      expect(result).toEqual(stats);
      expect(mockRepository.getStats).toHaveBeenCalledWith('cust-1');
    });
  });

  describe('getByCode', () => {
    it('should return referral by code', async () => {
      const referral = { id: 'ref-1', code: 'LW-ABC', customerId: 'cust-1' };
      mockRepository.findByCode.mockResolvedValue(referral);

      const result = await service.getByCode('LW-ABC');

      expect(result).toEqual(referral);
    });

    it('should throw AppError 404 when code not found', async () => {
      mockRepository.findByCode.mockResolvedValue(null);

      await expect(service.getByCode('NOTFOUND')).rejects.toThrow(AppError);
      await expect(service.getByCode('NOTFOUND')).rejects.toMatchObject({ statusCode: 404 });
    });
  });
});