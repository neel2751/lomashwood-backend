import request from 'supertest';
import express from 'express';
import { ratingRouter } from '../../src/app/reviews/rating.routes';
import { RatingService } from '../../src/app/reviews/review.service';

jest.mock('../../src/app/reviews/review.service');
jest.mock('../../src/shared/middlewares/auth.middleware', () => ({
  authenticate: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    req.user = { id: 'user-1', customerId: 'cust-1', role: 'CUSTOMER' };
    next();
  },
}));

const mockService = {
  getProductRating: jest.fn(),
  rateProduct: jest.fn(),
  deleteRating: jest.fn(),
  getCustomerRating: jest.fn(),
};

(RatingService as jest.Mock).mockImplementation(() => mockService);

const app = express();
app.use(express.json());
app.use('/api/ratings', ratingRouter);
app.use((err: Error & { statusCode?: number }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(err.statusCode ?? 500).json({ message: err.message });
});

describe('Rating Routes', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('GET /api/ratings/product/:productId', () => {
    it('should return 200 with average rating and distribution', async () => {
      const ratingData = { average: 4.3, total: 100, distribution: { 1: 2, 2: 3, 3: 10, 4: 25, 5: 60 } };
      mockService.getProductRating.mockResolvedValue(ratingData);

      const res = await request(app).get('/api/ratings/product/prod-1');

      expect(res.status).toBe(200);
      expect(res.body.average).toBe(4.3);
      expect(res.body.distribution[5]).toBe(60);
    });

    it('should return 200 with zero average for unrated product', async () => {
      const ratingData = { average: 0, total: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
      mockService.getProductRating.mockResolvedValue(ratingData);

      const res = await request(app).get('/api/ratings/product/prod-new');

      expect(res.status).toBe(200);
      expect(res.body.average).toBe(0);
    });
  });

  describe('GET /api/ratings/product/:productId/me', () => {
    it('should return 200 with customer rating for product', async () => {
      const rating = { id: 'rat-1', customerId: 'cust-1', productId: 'prod-1', value: 4 };
      mockService.getCustomerRating.mockResolvedValue(rating);

      const res = await request(app).get('/api/ratings/product/prod-1/me');

      expect(res.status).toBe(200);
      expect(res.body.value).toBe(4);
    });

    it('should return 200 with null when customer has not rated', async () => {
      mockService.getCustomerRating.mockResolvedValue(null);

      const res = await request(app).get('/api/ratings/product/prod-unrated/me');

      expect(res.status).toBe(200);
      expect(res.body).toBeNull();
    });
  });

  describe('POST /api/ratings/product/:productId', () => {
    it('should return 200 with upserted rating', async () => {
      const rating = { id: 'rat-1', customerId: 'cust-1', productId: 'prod-1', value: 5 };
      mockService.rateProduct.mockResolvedValue(rating);

      const res = await request(app).post('/api/ratings/product/prod-1').send({ value: 5 });

      expect(res.status).toBe(200);
      expect(res.body.value).toBe(5);
    });

    it('should return 422 when rating value is below 1', async () => {
      const res = await request(app).post('/api/ratings/product/prod-1').send({ value: 0 });

      expect(res.status).toBe(422);
    });

    it('should return 422 when rating value exceeds 5', async () => {
      const res = await request(app).post('/api/ratings/product/prod-1').send({ value: 6 });

      expect(res.status).toBe(422);
    });

    it('should return 422 when value is missing', async () => {
      const res = await request(app).post('/api/ratings/product/prod-1').send({});

      expect(res.status).toBe(422);
    });
  });

  describe('DELETE /api/ratings/product/:productId', () => {
    it('should return 204 when rating deleted', async () => {
      mockService.deleteRating.mockResolvedValue(undefined);

      const res = await request(app).delete('/api/ratings/product/prod-1');

      expect(res.status).toBe(204);
    });

    it('should return 404 when rating does not exist', async () => {
      const error = Object.assign(new Error('Rating not found'), { statusCode: 404 });
      mockService.deleteRating.mockRejectedValue(error);

      const res = await request(app).delete('/api/ratings/product/prod-unrated');

      expect(res.status).toBe(404);
    });
  });
});