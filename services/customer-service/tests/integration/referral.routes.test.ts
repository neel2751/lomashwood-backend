import request from 'supertest';
import express from 'express';
import { referralRouter } from '../../src/app/referral/referral.routes';
import { ReferralService } from '../../src/app/referral/referral.service';

jest.mock('../../src/app/referral/referral.service');
jest.mock('../../src/shared/middlewares/auth.middleware', () => ({
  authenticate: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    req.user = { id: 'user-1', customerId: 'cust-1', role: 'CUSTOMER' };
    next();
  },
}));

const mockService = {
  getOrCreateReferralCode: jest.fn(),
  applyReferralCode: jest.fn(),
  getStats: jest.fn(),
  getByCode: jest.fn(),
};

(ReferralService as jest.Mock).mockImplementation(() => mockService);

const app = express();
app.use(express.json());
app.use('/api/referrals', referralRouter);
app.use((err: Error & { statusCode?: number }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(err.statusCode ?? 500).json({ message: err.message });
});

describe('Referral Routes', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('GET /api/referrals/code', () => {
    it('should return 200 with customer referral code', async () => {
      const referral = { id: 'ref-1', customerId: 'cust-1', code: 'LW-JOHN123', usageCount: 3, createdAt: new Date().toISOString() };
      mockService.getOrCreateReferralCode.mockResolvedValue(referral);

      const res = await request(app).get('/api/referrals/code');

      expect(res.status).toBe(200);
      expect(res.body.code).toBe('LW-JOHN123');
      expect(res.body.usageCount).toBe(3);
    });

    it('should create a new code if customer has none', async () => {
      const referral = { id: 'ref-new', customerId: 'cust-1', code: 'LW-NEWCODE', usageCount: 0 };
      mockService.getOrCreateReferralCode.mockResolvedValue(referral);

      const res = await request(app).get('/api/referrals/code');

      expect(res.status).toBe(200);
      expect(res.body.code).toMatch(/^LW-/);
    });
  });

  describe('POST /api/referrals/apply', () => {
    it('should return 200 when referral code successfully applied', async () => {
      const result = { id: 'ru-1', referralId: 'ref-1', referredCustomerId: 'cust-1', createdAt: new Date().toISOString() };
      mockService.applyReferralCode.mockResolvedValue(result);

      const res = await request(app).post('/api/referrals/apply').send({ code: 'LW-FRIEND' });

      expect(res.status).toBe(200);
      expect(res.body.id).toBe('ru-1');
    });

    it('should return 404 when referral code not found', async () => {
      const error = Object.assign(new Error('Referral code not found'), { statusCode: 404 });
      mockService.applyReferralCode.mockRejectedValue(error);

      const res = await request(app).post('/api/referrals/apply').send({ code: 'LW-INVALID' });

      expect(res.status).toBe(404);
    });

    it('should return 400 when customer applies their own code', async () => {
      const error = Object.assign(new Error('Cannot apply your own referral code'), { statusCode: 400 });
      mockService.applyReferralCode.mockRejectedValue(error);

      const res = await request(app).post('/api/referrals/apply').send({ code: 'LW-OWN123' });

      expect(res.status).toBe(400);
    });

    it('should return 409 when customer already used a referral code', async () => {
      const error = Object.assign(new Error('You have already used a referral code'), { statusCode: 409 });
      mockService.applyReferralCode.mockRejectedValue(error);

      const res = await request(app).post('/api/referrals/apply').send({ code: 'LW-ANOTHER' });

      expect(res.status).toBe(409);
    });

    it('should return 422 when code is missing', async () => {
      const res = await request(app).post('/api/referrals/apply').send({});

      expect(res.status).toBe(422);
    });
  });

  describe('GET /api/referrals/stats', () => {
    it('should return 200 with referral statistics', async () => {
      const stats = { totalReferrals: 5, successfulReferrals: 3, pendingReferrals: 2, totalPointsEarned: 1500 };
      mockService.getStats.mockResolvedValue(stats);

      const res = await request(app).get('/api/referrals/stats');

      expect(res.status).toBe(200);
      expect(res.body.totalReferrals).toBe(5);
      expect(res.body.totalPointsEarned).toBe(1500);
    });

    it('should return 200 with zero stats for new customer', async () => {
      const stats = { totalReferrals: 0, successfulReferrals: 0, pendingReferrals: 0, totalPointsEarned: 0 };
      mockService.getStats.mockResolvedValue(stats);

      const res = await request(app).get('/api/referrals/stats');

      expect(res.status).toBe(200);
      expect(res.body.totalReferrals).toBe(0);
    });
  });

  describe('GET /api/referrals/validate/:code', () => {
    it('should return 200 when code is valid', async () => {
      const referral = { id: 'ref-1', code: 'LW-VALID', customerId: 'cust-other' };
      mockService.getByCode.mockResolvedValue(referral);

      const res = await request(app).get('/api/referrals/validate/LW-VALID');

      expect(res.status).toBe(200);
      expect(res.body.valid).toBe(true);
    });

    it('should return 404 when code is invalid', async () => {
      const error = Object.assign(new Error('Referral code not found'), { statusCode: 404 });
      mockService.getByCode.mockRejectedValue(error);

      const res = await request(app).get('/api/referrals/validate/LW-NOTEXIST');

      expect(res.status).toBe(404);
    });
  });
});