import request from 'supertest';
import express from 'express';
import { loyaltyRouter } from '../../src/app/loyalty/loyalty.routes';
import { LoyaltyService } from '../../src/app/loyalty/loyalty.service';

jest.mock('../../src/app/loyalty/loyalty.service');
jest.mock('../../src/shared/middlewares/auth.middleware', () => ({
  authenticate: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    req.user = { id: 'user-1', customerId: 'cust-1', role: 'CUSTOMER' };
    next();
  },
  requireRole: (_role: string) => (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
}));

const mockService = {
  getAccount: jest.fn(),
  createAccount: jest.fn(),
  addPoints: jest.fn(),
  deductPoints: jest.fn(),
  getTransactions: jest.fn(),
  calculateTier: jest.fn(),
};

(LoyaltyService as jest.Mock).mockImplementation(() => mockService);

const app = express();
app.use(express.json());
app.use('/api/loyalty', loyaltyRouter);
app.use((err: Error & { statusCode?: number }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(err.statusCode ?? 500).json({ message: err.message });
});

describe('Loyalty Routes', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('GET /api/loyalty', () => {
    it('should return 200 with loyalty account', async () => {
      const account = { id: 'loy-1', customerId: 'cust-1', points: 1500, tier: 'SILVER', createdAt: new Date().toISOString() };
      mockService.getAccount.mockResolvedValue(account);

      const res = await request(app).get('/api/loyalty');

      expect(res.status).toBe(200);
      expect(res.body.points).toBe(1500);
      expect(res.body.tier).toBe('SILVER');
    });

    it('should return 404 when no loyalty account exists', async () => {
      const error = Object.assign(new Error('Loyalty account not found'), { statusCode: 404 });
      mockService.getAccount.mockRejectedValue(error);

      const res = await request(app).get('/api/loyalty');

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/loyalty', () => {
    it('should return 201 with created loyalty account', async () => {
      const created = { id: 'loy-new', customerId: 'cust-1', points: 0, tier: 'BRONZE', createdAt: new Date().toISOString() };
      mockService.createAccount.mockResolvedValue(created);

      const res = await request(app).post('/api/loyalty');

      expect(res.status).toBe(201);
      expect(res.body.points).toBe(0);
      expect(res.body.tier).toBe('BRONZE');
    });

    it('should return 409 when account already exists', async () => {
      const error = Object.assign(new Error('Loyalty account already exists'), { statusCode: 409 });
      mockService.createAccount.mockRejectedValue(error);

      const res = await request(app).post('/api/loyalty');

      expect(res.status).toBe(409);
    });
  });

  describe('GET /api/loyalty/transactions', () => {
    it('should return 200 with paginated transaction history', async () => {
      const result = {
        data: [
          { id: 'tx-1', customerId: 'cust-1', points: 200, type: 'CREDIT', reason: 'PURCHASE', createdAt: new Date().toISOString() },
          { id: 'tx-2', customerId: 'cust-1', points: -50, type: 'DEBIT', reason: 'REDEMPTION', createdAt: new Date().toISOString() },
        ],
        total: 2,
        page: 1,
        limit: 10,
      };
      mockService.getTransactions.mockResolvedValue(result);

      const res = await request(app).get('/api/loyalty/transactions').query({ page: '1', limit: '10' });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].type).toBe('CREDIT');
    });

    it('should use default pagination when no query params', async () => {
      const result = { data: [], total: 0, page: 1, limit: 10 };
      mockService.getTransactions.mockResolvedValue(result);

      const res = await request(app).get('/api/loyalty/transactions');

      expect(res.status).toBe(200);
      expect(mockService.getTransactions).toHaveBeenCalledWith('cust-1', { page: 1, limit: 10 });
    });
  });

  describe('POST /api/loyalty/points/add (admin)', () => {
    it('should return 200 with updated account after adding points', async () => {
      const updated = { id: 'loy-1', customerId: 'cust-1', points: 1700, tier: 'SILVER' };
      mockService.addPoints.mockResolvedValue(updated);

      const res = await request(app).post('/api/loyalty/points/add').send({ customerId: 'cust-1', points: 200, reason: 'PURCHASE' });

      expect(res.status).toBe(200);
      expect(res.body.points).toBe(1700);
    });

    it('should return 422 when points is not positive', async () => {
      const res = await request(app).post('/api/loyalty/points/add').send({ customerId: 'cust-1', points: 0, reason: 'PURCHASE' });

      expect(res.status).toBe(422);
    });
  });

  describe('POST /api/loyalty/points/redeem', () => {
    it('should return 200 with updated account after deducting points', async () => {
      const updated = { id: 'loy-1', customerId: 'cust-1', points: 1300, tier: 'SILVER' };
      mockService.deductPoints.mockResolvedValue(updated);

      const res = await request(app).post('/api/loyalty/points/redeem').send({ points: 200, reason: 'REDEMPTION' });

      expect(res.status).toBe(200);
      expect(res.body.points).toBe(1300);
    });

    it('should return 400 when insufficient points', async () => {
      const error = Object.assign(new Error('Insufficient points balance'), { statusCode: 400 });
      mockService.deductPoints.mockRejectedValue(error);

      const res = await request(app).post('/api/loyalty/points/redeem').send({ points: 99999, reason: 'REDEMPTION' });

      expect(res.status).toBe(400);
    });

    it('should return 422 when points is missing', async () => {
      const res = await request(app).post('/api/loyalty/points/redeem').send({ reason: 'REDEMPTION' });

      expect(res.status).toBe(422);
    });
  });
});