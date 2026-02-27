import request from 'supertest';
import express from 'express';
import { reviewRouter } from '../../src/app/reviews/review.routes';
import { ReviewService } from '../../src/app/reviews/review.service';

jest.mock('../../src/app/reviews/review.service');
jest.mock('../../src/shared/middlewares/auth.middleware', () => ({
  authenticate: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    req.user = { id: 'user-1', customerId: 'cust-1', role: 'CUSTOMER' };
    next();
  },
  requireRole: (_role: string) => (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
}));

const mockService = {
  getById: jest.fn(),
  getByProductId: jest.fn(),
  getByCustomerId: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  approve: jest.fn(),
  reject: jest.fn(),
  getAll: jest.fn(),
};

(ReviewService as jest.Mock).mockImplementation(() => mockService);

const app = express();
app.use(express.json());
app.use('/api/reviews', reviewRouter);
app.use((err: Error & { statusCode?: number }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(err.statusCode ?? 500).json({ message: err.message });
});

describe('Review Routes', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('GET /api/reviews/product/:productId', () => {
    it('should return 200 with approved reviews for product', async () => {
      const result = {
        data: [
          { id: 'rev-1', productId: 'prod-1', rating: 5, title: 'Excellent', body: 'Loved it', status: 'APPROVED' },
          { id: 'rev-2', productId: 'prod-1', rating: 4, title: 'Very good', body: 'Happy with it', status: 'APPROVED' },
        ],
        total: 2,
        page: 1,
        limit: 10,
      };
      mockService.getByProductId.mockResolvedValue(result);

      const res = await request(app).get('/api/reviews/product/prod-1').query({ page: '1', limit: '10' });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.total).toBe(2);
    });
  });

  describe('GET /api/reviews/me', () => {
    it('should return 200 with all reviews by authenticated customer', async () => {
      const reviews = [
        { id: 'rev-1', customerId: 'cust-1', productId: 'prod-1', rating: 5, status: 'APPROVED' },
      ];
      mockService.getByCustomerId.mockResolvedValue(reviews);

      const res = await request(app).get('/api/reviews/me');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(mockService.getByCustomerId).toHaveBeenCalledWith('cust-1');
    });
  });

  describe('GET /api/reviews/:id', () => {
    it('should return 200 with review by id', async () => {
      const review = { id: 'rev-1', customerId: 'cust-1', productId: 'prod-1', rating: 5, title: 'Great', body: 'Excellent quality', status: 'APPROVED' };
      mockService.getById.mockResolvedValue(review);

      const res = await request(app).get('/api/reviews/rev-1');

      expect(res.status).toBe(200);
      expect(res.body.id).toBe('rev-1');
    });

    it('should return 404 when review not found', async () => {
      const error = Object.assign(new Error('Review not found'), { statusCode: 404 });
      mockService.getById.mockRejectedValue(error);

      const res = await request(app).get('/api/reviews/nonexistent');

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/reviews', () => {
    it('should return 201 with created review in PENDING status', async () => {
      const input = { productId: 'prod-1', rating: 5, title: 'Amazing kitchen', body: 'Beautifully made and great quality' };
      const created = { id: 'rev-new', customerId: 'cust-1', ...input, status: 'PENDING', createdAt: new Date().toISOString() };
      mockService.create.mockResolvedValue(created);

      const res = await request(app).post('/api/reviews').send(input);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('PENDING');
      expect(res.body.id).toBe('rev-new');
    });

    it('should return 409 when customer already reviewed product', async () => {
      const error = Object.assign(new Error('You have already reviewed this product'), { statusCode: 409 });
      mockService.create.mockRejectedValue(error);

      const res = await request(app).post('/api/reviews').send({ productId: 'prod-1', rating: 4, title: 'Good', body: 'Nice product' });

      expect(res.status).toBe(409);
    });

    it('should return 422 when rating is out of range', async () => {
      const res = await request(app).post('/api/reviews').send({ productId: 'prod-1', rating: 6, title: 'Test', body: 'Test body' });

      expect(res.status).toBe(422);
    });

    it('should return 422 when required fields are missing', async () => {
      const res = await request(app).post('/api/reviews').send({ productId: 'prod-1' });

      expect(res.status).toBe(422);
    });
  });

  describe('PATCH /api/reviews/:id', () => {
    it('should return 200 with updated review', async () => {
      const updated = { id: 'rev-1', customerId: 'cust-1', rating: 5, body: 'Updated review body', status: 'PENDING' };
      mockService.update.mockResolvedValue(updated);

      const res = await request(app).patch('/api/reviews/rev-1').send({ rating: 5, body: 'Updated review body' });

      expect(res.status).toBe(200);
      expect(res.body.body).toBe('Updated review body');
    });

    it('should return 403 when trying to update another customers review', async () => {
      const error = Object.assign(new Error('Access denied'), { statusCode: 403 });
      mockService.update.mockRejectedValue(error);

      const res = await request(app).patch('/api/reviews/rev-other').send({ body: 'Modified' });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/reviews/:id', () => {
    it('should return 204 on successful deletion', async () => {
      mockService.delete.mockResolvedValue(undefined);

      const res = await request(app).delete('/api/reviews/rev-1');

      expect(res.status).toBe(204);
    });

    it('should return 403 when trying to delete another customers review', async () => {
      const error = Object.assign(new Error('Access denied'), { statusCode: 403 });
      mockService.delete.mockRejectedValue(error);

      const res = await request(app).delete('/api/reviews/rev-other');

      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/reviews/:id/approve (admin)', () => {
    it('should return 200 with approved review', async () => {
      const approved = { id: 'rev-1', status: 'APPROVED' };
      mockService.approve.mockResolvedValue(approved);

      const res = await request(app).patch('/api/reviews/rev-1/approve');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('APPROVED');
    });
  });

  describe('PATCH /api/reviews/:id/reject (admin)', () => {
    it('should return 200 with rejected review', async () => {
      const rejected = { id: 'rev-1', status: 'REJECTED' };
      mockService.reject.mockResolvedValue(rejected);

      const res = await request(app).patch('/api/reviews/rev-1/reject');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('REJECTED');
    });
  });
});