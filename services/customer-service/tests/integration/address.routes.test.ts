import request from 'supertest';
import express from 'express';
import { addressRouter } from '../../src/app/address/address.routes';
import { AddressService } from '../../src/app/address/address.service';

jest.mock('../../src/app/address/address.service');
jest.mock('../../src/shared/middlewares/auth.middleware', () => ({
  authenticate: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    req.user = { id: 'user-1', customerId: 'cust-1', role: 'CUSTOMER' };
    next();
  },
}));

const mockService = {
  getByCustomerId: jest.fn(),
  getById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  setDefault: jest.fn(),
};

(AddressService as jest.Mock).mockImplementation(() => mockService);

const app = express();
app.use(express.json());
app.use('/api/addresses', addressRouter);
app.use((err: Error & { statusCode?: number }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(err.statusCode ?? 500).json({ message: err.message });
});

describe('Address Routes', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('GET /api/addresses', () => {
    it('should return 200 with list of addresses', async () => {
      const addresses = [
        { id: 'addr-1', customerId: 'cust-1', line1: '10 Downing Street', city: 'London', postcode: 'SW1A 2AA', isDefault: true },
        { id: 'addr-2', customerId: 'cust-1', line1: '221B Baker Street', city: 'London', postcode: 'NW1 6XE', isDefault: false },
      ];
      mockService.getByCustomerId.mockResolvedValue(addresses);

      const res = await request(app).get('/api/addresses');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].isDefault).toBe(true);
    });

    it('should return 200 with empty array when no addresses', async () => {
      mockService.getByCustomerId.mockResolvedValue([]);

      const res = await request(app).get('/api/addresses');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('GET /api/addresses/:id', () => {
    it('should return 200 with address by id', async () => {
      const address = { id: 'addr-1', customerId: 'cust-1', line1: '10 Downing Street', city: 'London', postcode: 'SW1A 2AA', isDefault: true };
      mockService.getById.mockResolvedValue(address);

      const res = await request(app).get('/api/addresses/addr-1');

      expect(res.status).toBe(200);
      expect(res.body.id).toBe('addr-1');
    });

    it('should return 404 when address not found', async () => {
      const error = Object.assign(new Error('Address not found'), { statusCode: 404 });
      mockService.getById.mockRejectedValue(error);

      const res = await request(app).get('/api/addresses/nonexistent');

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/addresses', () => {
    it('should return 201 with created address', async () => {
      const input = { line1: '1 New Street', city: 'Manchester', county: 'Greater Manchester', postcode: 'M1 1AE', country: 'GB' };
      const created = { id: 'addr-new', customerId: 'cust-1', ...input, isDefault: false };
      mockService.create.mockResolvedValue(created);

      const res = await request(app).post('/api/addresses').send(input);

      expect(res.status).toBe(201);
      expect(res.body.id).toBe('addr-new');
    });

    it('should auto-set first address as default', async () => {
      const input = { line1: '1 New Street', city: 'Manchester', postcode: 'M1 1AE', country: 'GB' };
      const created = { id: 'addr-new', customerId: 'cust-1', ...input, isDefault: true };
      mockService.create.mockResolvedValue(created);

      const res = await request(app).post('/api/addresses').send(input);

      expect(res.status).toBe(201);
      expect(res.body.isDefault).toBe(true);
    });

    it('should return 422 when required fields are missing', async () => {
      const res = await request(app).post('/api/addresses').send({ city: 'London' });

      expect(res.status).toBe(422);
    });
  });

  describe('PATCH /api/addresses/:id', () => {
    it('should return 200 with updated address', async () => {
      const updated = { id: 'addr-1', customerId: 'cust-1', line1: '10 Downing Street', city: 'London', postcode: 'SW1A 2AA', isDefault: true };
      mockService.update.mockResolvedValue(updated);

      const res = await request(app).patch('/api/addresses/addr-1').send({ line1: '10 Downing Street' });

      expect(res.status).toBe(200);
      expect(res.body.line1).toBe('10 Downing Street');
    });

    it('should return 404 when address not found', async () => {
      const error = Object.assign(new Error('Address not found'), { statusCode: 404 });
      mockService.update.mockRejectedValue(error);

      const res = await request(app).patch('/api/addresses/nonexistent').send({ city: 'London' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/addresses/:id', () => {
    it('should return 204 on successful deletion', async () => {
      mockService.delete.mockResolvedValue(undefined);

      const res = await request(app).delete('/api/addresses/addr-2');

      expect(res.status).toBe(204);
    });

    it('should return 400 when deleting the only default address', async () => {
      const error = Object.assign(new Error('Cannot delete the only default address'), { statusCode: 400 });
      mockService.delete.mockRejectedValue(error);

      const res = await request(app).delete('/api/addresses/addr-1');

      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /api/addresses/:id/default', () => {
    it('should return 200 when address set as default', async () => {
      const updated = { id: 'addr-2', customerId: 'cust-1', isDefault: true };
      mockService.setDefault.mockResolvedValue(updated);

      const res = await request(app).patch('/api/addresses/addr-2/default');

      expect(res.status).toBe(200);
      expect(res.body.isDefault).toBe(true);
    });

    it('should return 403 when address belongs to another customer', async () => {
      const error = Object.assign(new Error('Access denied'), { statusCode: 403 });
      mockService.setDefault.mockRejectedValue(error);

      const res = await request(app).patch('/api/addresses/addr-other/default');

      expect(res.status).toBe(403);
    });
  });
});