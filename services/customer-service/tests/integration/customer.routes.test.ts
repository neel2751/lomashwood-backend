import request from 'supertest';
import express from 'express';
import { customerRouter } from '../../src/app/customer/customer.routes';
import { CustomerService } from '../../src/app/customer/customer.service';

jest.mock('../../src/app/customer/customer.service');
jest.mock('../../src/shared/middlewares/auth.middleware', () => ({
  authenticate: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    req.user = { id: 'user-1', customerId: 'cust-1', role: 'CUSTOMER' };
    next();
  },
  requireRole: (_role: string) => (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
}));

const mockService = {
  getById: jest.fn(),
  getByUserId: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  getAll: jest.fn(),
};

(CustomerService as jest.Mock).mockImplementation(() => mockService);

const app = express();
app.use(express.json());
app.use('/api/customers', customerRouter);
app.use((err: Error & { statusCode?: number }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(err.statusCode ?? 500).json({ message: err.message });
});

describe('Customer Routes', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('GET /api/customers/me', () => {
    it('should return 200 with customer profile', async () => {
      const profile = { id: 'cust-1', userId: 'user-1', firstName: 'John', lastName: 'Doe', phone: '07700900123', postcode: 'SW1A 1AA', address: '10 Downing Street' };
      mockService.getByUserId.mockResolvedValue(profile);

      const res = await request(app).get('/api/customers/me');

      expect(res.status).toBe(200);
      expect(res.body.id).toBe('cust-1');
      expect(res.body.firstName).toBe('John');
    });

    it('should return 404 when profile does not exist', async () => {
      const error = Object.assign(new Error('Customer not found'), { statusCode: 404 });
      mockService.getByUserId.mockRejectedValue(error);

      const res = await request(app).get('/api/customers/me');

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Customer not found');
    });
  });

  describe('POST /api/customers', () => {
    it('should return 201 with created customer', async () => {
      const input = { firstName: 'Jane', lastName: 'Smith', phone: '07700900456', postcode: 'EC1A 1BB', address: '1 Angel Lane' };
      const created = { id: 'cust-new', userId: 'user-1', ...input };
      mockService.create.mockResolvedValue(created);

      const res = await request(app).post('/api/customers').send(input);

      expect(res.status).toBe(201);
      expect(res.body.id).toBe('cust-new');
    });

    it('should return 409 when customer already exists', async () => {
      const error = Object.assign(new Error('Customer already exists'), { statusCode: 409 });
      mockService.create.mockRejectedValue(error);

      const res = await request(app).post('/api/customers').send({ firstName: 'Jane', lastName: 'Smith', phone: '07700900456', postcode: 'EC1A 1BB', address: '1 Angel Lane' });

      expect(res.status).toBe(409);
    });

    it('should return 422 when required fields are missing', async () => {
      const res = await request(app).post('/api/customers').send({ firstName: 'Jane' });

      expect(res.status).toBe(422);
    });
  });

  describe('PATCH /api/customers/me', () => {
    it('should return 200 with updated customer', async () => {
      const updated = { id: 'cust-1', userId: 'user-1', firstName: 'John', lastName: 'Doe', phone: '07700900999', postcode: 'SW1A 1AA', address: '10 Downing Street' };
      mockService.update.mockResolvedValue(updated);

      const res = await request(app).patch('/api/customers/me').send({ phone: '07700900999' });

      expect(res.status).toBe(200);
      expect(res.body.phone).toBe('07700900999');
    });

    it('should return 404 when customer not found', async () => {
      const error = Object.assign(new Error('Customer not found'), { statusCode: 404 });
      mockService.update.mockRejectedValue(error);

      const res = await request(app).patch('/api/customers/me').send({ phone: '07700900000' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/customers/me', () => {
    it('should return 204 on successful deletion', async () => {
      mockService.delete.mockResolvedValue(undefined);

      const res = await request(app).delete('/api/customers/me');

      expect(res.status).toBe(204);
      expect(res.body).toEqual({});
    });
  });

  describe('GET /api/customers (admin)', () => {
    it('should return 200 with paginated customer list', async () => {
      const result = { data: [{ id: 'cust-1' }, { id: 'cust-2' }], total: 2, page: 1, limit: 10 };
      mockService.getAll.mockResolvedValue(result);

      const res = await request(app).get('/api/customers').query({ page: '1', limit: '10' });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.total).toBe(2);
    });

    it('should use default pagination when no query params provided', async () => {
      const result = { data: [], total: 0, page: 1, limit: 10 };
      mockService.getAll.mockResolvedValue(result);

      const res = await request(app).get('/api/customers');

      expect(res.status).toBe(200);
      expect(mockService.getAll).toHaveBeenCalledWith({ page: 1, limit: 10 });
    });
  });
});