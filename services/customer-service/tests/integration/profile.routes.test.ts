import request from 'supertest';
import express from 'express';
import { profileRouter } from '../../src/app/profiles/profile.routes';
import { ProfileService } from '../../src/app/profiles/profile.service';

jest.mock('../../src/app/profiles/profile.service');
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
  updateAvatar: jest.fn(),
  delete: jest.fn(),
  getAll: jest.fn(),
};

(ProfileService as jest.Mock).mockImplementation(() => mockService);

const app = express();
app.use(express.json());
app.use('/api/profiles', profileRouter);
app.use((err: Error & { statusCode?: number }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(err.statusCode ?? 500).json({ message: err.message });
});

describe('Profile Routes', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('GET /api/profiles/me', () => {
    it('should return 200 with user profile', async () => {
      const profile = { id: 'prof-1', userId: 'user-1', firstName: 'John', lastName: 'Doe', bio: 'Kitchen enthusiast', avatarUrl: null };
      mockService.getByUserId.mockResolvedValue(profile);

      const res = await request(app).get('/api/profiles/me');

      expect(res.status).toBe(200);
      expect(res.body.id).toBe('prof-1');
      expect(res.body.bio).toBe('Kitchen enthusiast');
    });

    it('should return 404 when profile does not exist', async () => {
      const error = Object.assign(new Error('Profile not found'), { statusCode: 404 });
      mockService.getByUserId.mockRejectedValue(error);

      const res = await request(app).get('/api/profiles/me');

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/profiles', () => {
    it('should return 201 with created profile', async () => {
      const input = { firstName: 'Alice', lastName: 'Jones', bio: 'Loves modern kitchens' };
      const created = { id: 'prof-new', userId: 'user-1', ...input, avatarUrl: null };
      mockService.create.mockResolvedValue(created);

      const res = await request(app).post('/api/profiles').send(input);

      expect(res.status).toBe(201);
      expect(res.body.id).toBe('prof-new');
    });

    it('should return 409 when profile already exists for user', async () => {
      const error = Object.assign(new Error('Profile already exists'), { statusCode: 409 });
      mockService.create.mockRejectedValue(error);

      const res = await request(app).post('/api/profiles').send({ firstName: 'Alice', lastName: 'Jones' });

      expect(res.status).toBe(409);
    });
  });

  describe('PATCH /api/profiles/me', () => {
    it('should return 200 with updated profile', async () => {
      const updated = { id: 'prof-1', userId: 'user-1', firstName: 'John', lastName: 'Doe', bio: 'Updated bio', avatarUrl: null };
      mockService.update.mockResolvedValue(updated);

      const res = await request(app).patch('/api/profiles/me').send({ bio: 'Updated bio' });

      expect(res.status).toBe(200);
      expect(res.body.bio).toBe('Updated bio');
    });
  });

  describe('PATCH /api/profiles/me/avatar', () => {
    it('should return 200 with updated avatar URL', async () => {
      const updated = { id: 'prof-1', userId: 'user-1', avatarUrl: 'https://cdn.lomashwood.co.uk/avatars/user-1.jpg' };
      mockService.updateAvatar.mockResolvedValue(updated);

      const res = await request(app).patch('/api/profiles/me/avatar').send({ avatarUrl: 'https://cdn.lomashwood.co.uk/avatars/user-1.jpg' });

      expect(res.status).toBe(200);
      expect(res.body.avatarUrl).toBe('https://cdn.lomashwood.co.uk/avatars/user-1.jpg');
    });

    it('should return 422 when avatarUrl is missing', async () => {
      const res = await request(app).patch('/api/profiles/me/avatar').send({});

      expect(res.status).toBe(422);
    });
  });

  describe('DELETE /api/profiles/me', () => {
    it('should return 204 on successful deletion', async () => {
      mockService.delete.mockResolvedValue(undefined);

      const res = await request(app).delete('/api/profiles/me');

      expect(res.status).toBe(204);
    });
  });

  describe('GET /api/profiles/:id', () => {
    it('should return 200 with profile by id', async () => {
      const profile = { id: 'prof-1', userId: 'user-1', firstName: 'John', lastName: 'Doe' };
      mockService.getById.mockResolvedValue(profile);

      const res = await request(app).get('/api/profiles/prof-1');

      expect(res.status).toBe(200);
      expect(res.body.id).toBe('prof-1');
    });

    it('should return 404 when profile not found', async () => {
      const error = Object.assign(new Error('Profile not found'), { statusCode: 404 });
      mockService.getById.mockRejectedValue(error);

      const res = await request(app).get('/api/profiles/nonexistent');

      expect(res.status).toBe(404);
    });
  });
});