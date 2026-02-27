import request from 'supertest';
import express from 'express';
import { supportTicketRouter } from '../../src/app/support/support.routes';
import { SupportTicketService } from '../../src/app/support/support.service';

jest.mock('../../src/app/support/support.service');
jest.mock('../../src/shared/middlewares/auth.middleware', () => ({
  authenticate: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    req.user = { id: 'user-1', customerId: 'cust-1', role: 'CUSTOMER' };
    next();
  },
  requireRole: (_role: string) => (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
}));

const mockService = {
  getById: jest.fn(),
  getByCustomerId: jest.fn(),
  create: jest.fn(),
  addMessage: jest.fn(),
  close: jest.fn(),
  updatePriority: jest.fn(),
  getAll: jest.fn(),
};

(SupportTicketService as jest.Mock).mockImplementation(() => mockService);

const app = express();
app.use(express.json());
app.use('/api/support', supportTicketRouter);
app.use((err: Error & { statusCode?: number }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(err.statusCode ?? 500).json({ message: err.message });
});

describe('Support Ticket Routes', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('GET /api/support/tickets', () => {
    it('should return 200 with paginated customer tickets', async () => {
      const result = {
        data: [
          { id: 'tkt-1', customerId: 'cust-1', subject: 'Kitchen issue', status: 'OPEN', priority: 'MEDIUM' },
          { id: 'tkt-2', customerId: 'cust-1', subject: 'Delivery delay', status: 'CLOSED', priority: 'LOW' },
        ],
        total: 2,
        page: 1,
        limit: 10,
      };
      mockService.getByCustomerId.mockResolvedValue(result);

      const res = await request(app).get('/api/support/tickets').query({ page: '1', limit: '10' });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
    });
  });

  describe('GET /api/support/tickets/:id', () => {
    it('should return 200 with ticket and its messages', async () => {
      const ticket = {
        id: 'tkt-1',
        customerId: 'cust-1',
        subject: 'Damaged cabinet door',
        status: 'OPEN',
        priority: 'HIGH',
        messages: [
          { id: 'msg-1', ticketId: 'tkt-1', senderId: 'cust-1', body: 'The hinge is broken', createdAt: new Date().toISOString() },
        ],
      };
      mockService.getById.mockResolvedValue(ticket);

      const res = await request(app).get('/api/support/tickets/tkt-1');

      expect(res.status).toBe(200);
      expect(res.body.messages).toHaveLength(1);
    });

    it('should return 404 when ticket not found', async () => {
      const error = Object.assign(new Error('Ticket not found'), { statusCode: 404 });
      mockService.getById.mockRejectedValue(error);

      const res = await request(app).get('/api/support/tickets/nonexistent');

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/support/tickets', () => {
    it('should return 201 with created ticket in OPEN status', async () => {
      const input = { subject: 'Missing hardware', description: 'The cabinet pack is missing hinge screws', category: 'WARRANTY' };
      const created = { id: 'tkt-new', customerId: 'cust-1', ...input, status: 'OPEN', priority: 'MEDIUM', createdAt: new Date().toISOString() };
      mockService.create.mockResolvedValue(created);

      const res = await request(app).post('/api/support/tickets').send(input);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('OPEN');
      expect(res.body.id).toBe('tkt-new');
    });

    it('should return 422 when subject is missing', async () => {
      const res = await request(app).post('/api/support/tickets').send({ description: 'Some issue', category: 'GENERAL' });

      expect(res.status).toBe(422);
    });

    it('should return 422 when description is missing', async () => {
      const res = await request(app).post('/api/support/tickets').send({ subject: 'Issue', category: 'GENERAL' });

      expect(res.status).toBe(422);
    });
  });

  describe('POST /api/support/tickets/:id/messages', () => {
    it('should return 201 with new message', async () => {
      const message = { id: 'msg-new', ticketId: 'tkt-1', senderId: 'cust-1', body: 'Still waiting for update', createdAt: new Date().toISOString() };
      mockService.addMessage.mockResolvedValue(message);

      const res = await request(app).post('/api/support/tickets/tkt-1/messages').send({ body: 'Still waiting for update' });

      expect(res.status).toBe(201);
      expect(res.body.body).toBe('Still waiting for update');
    });

    it('should return 400 when ticket is closed', async () => {
      const error = Object.assign(new Error('Cannot message on a closed ticket'), { statusCode: 400 });
      mockService.addMessage.mockRejectedValue(error);

      const res = await request(app).post('/api/support/tickets/tkt-closed/messages').send({ body: 'Hello' });

      expect(res.status).toBe(400);
    });

    it('should return 422 when body is empty', async () => {
      const res = await request(app).post('/api/support/tickets/tkt-1/messages').send({ body: '' });

      expect(res.status).toBe(422);
    });
  });

  describe('PATCH /api/support/tickets/:id/close', () => {
    it('should return 200 with closed ticket', async () => {
      const closed = { id: 'tkt-1', status: 'CLOSED', closedAt: new Date().toISOString() };
      mockService.close.mockResolvedValue(closed);

      const res = await request(app).patch('/api/support/tickets/tkt-1/close');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('CLOSED');
    });

    it('should return 403 when non-owner tries to close', async () => {
      const error = Object.assign(new Error('Access denied'), { statusCode: 403 });
      mockService.close.mockRejectedValue(error);

      const res = await request(app).patch('/api/support/tickets/tkt-other/close');

      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/support/tickets/:id/priority (admin)', () => {
    it('should return 200 with updated priority', async () => {
      const updated = { id: 'tkt-1', priority: 'URGENT' };
      mockService.updatePriority.mockResolvedValue(updated);

      const res = await request(app).patch('/api/support/tickets/tkt-1/priority').send({ priority: 'URGENT' });

      expect(res.status).toBe(200);
      expect(res.body.priority).toBe('URGENT');
    });

    it('should return 422 when priority value is invalid', async () => {
      const res = await request(app).patch('/api/support/tickets/tkt-1/priority').send({ priority: 'CRITICAL' });

      expect(res.status).toBe(422);
    });
  });

  describe('GET /api/support/tickets/admin (admin)', () => {
    it('should return 200 with all paginated tickets', async () => {
      const result = { data: [{ id: 'tkt-1' }, { id: 'tkt-2' }], total: 2, page: 1, limit: 10 };
      mockService.getAll.mockResolvedValue(result);

      const res = await request(app).get('/api/support/admin').query({ page: '1', limit: '10' });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
    });
  });
});