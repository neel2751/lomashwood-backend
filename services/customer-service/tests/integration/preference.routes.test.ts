import request from 'supertest';
import express from 'express';
import { preferenceRouter } from '../../src/app/preference/preference.routes';
import { PreferenceService } from '../../src/app/preference/preference.service';

jest.mock('../../src/app/preference/preference.service');
jest.mock('../../src/shared/middlewares/auth.middleware', () => ({
  authenticate: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    req.user = { id: 'user-1', customerId: 'cust-1', role: 'CUSTOMER' };
    next();
  },
}));

const mockService = {
  getByCustomerId: jest.fn(),
  upsert: jest.fn(),
  updateNotificationPreference: jest.fn(),
  subscribeNewsletter: jest.fn(),
  unsubscribeNewsletter: jest.fn(),
};

(PreferenceService as jest.Mock).mockImplementation(() => mockService);

const app = express();
app.use(express.json());
app.use('/api/preferences', preferenceRouter);
app.use((err: Error & { statusCode?: number }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(err.statusCode ?? 500).json({ message: err.message });
});

describe('Preference Routes', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('GET /api/preferences', () => {
    it('should return 200 with customer preferences', async () => {
      const prefs = {
        id: 'pref-1',
        customerId: 'cust-1',
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        marketingEmails: false,
        newsletterSubscribed: true,
        preferredContactMethod: 'EMAIL',
      };
      mockService.getByCustomerId.mockResolvedValue(prefs);

      const res = await request(app).get('/api/preferences');

      expect(res.status).toBe(200);
      expect(res.body.id).toBe('pref-1');
      expect(res.body.emailNotifications).toBe(true);
    });

    it('should return 200 with null when preferences not set', async () => {
      mockService.getByCustomerId.mockResolvedValue(null);

      const res = await request(app).get('/api/preferences');

      expect(res.status).toBe(200);
      expect(res.body).toBeNull();
    });
  });

  describe('PUT /api/preferences', () => {
    it('should return 200 with upserted preferences', async () => {
      const input = { emailNotifications: true, smsNotifications: true, pushNotifications: false, marketingEmails: true, newsletterSubscribed: false, preferredContactMethod: 'SMS' };
      const upserted = { id: 'pref-1', customerId: 'cust-1', ...input };
      mockService.upsert.mockResolvedValue(upserted);

      const res = await request(app).put('/api/preferences').send(input);

      expect(res.status).toBe(200);
      expect(res.body.smsNotifications).toBe(true);
    });

    it('should return 422 when preferredContactMethod is invalid', async () => {
      const res = await request(app).put('/api/preferences').send({ preferredContactMethod: 'TELEGRAM' });

      expect(res.status).toBe(422);
    });
  });

  describe('PATCH /api/preferences/:key', () => {
    it('should return 200 when valid preference key updated', async () => {
      const updated = { id: 'pref-1', customerId: 'cust-1', marketingEmails: false };
      mockService.updateNotificationPreference.mockResolvedValue(updated);

      const res = await request(app).patch('/api/preferences/marketingEmails').send({ value: false });

      expect(res.status).toBe(200);
      expect(res.body.marketingEmails).toBe(false);
    });

    it('should return 400 when preference key is invalid', async () => {
      const error = Object.assign(new Error('Invalid preference key'), { statusCode: 400 });
      mockService.updateNotificationPreference.mockRejectedValue(error);

      const res = await request(app).patch('/api/preferences/invalidKey').send({ value: true });

      expect(res.status).toBe(400);
    });

    it('should return 422 when value is not boolean', async () => {
      const res = await request(app).patch('/api/preferences/emailNotifications').send({ value: 'yes' });

      expect(res.status).toBe(422);
    });
  });

  describe('POST /api/preferences/newsletter/subscribe', () => {
    it('should return 200 when subscribed', async () => {
      const updated = { id: 'pref-1', customerId: 'cust-1', newsletterSubscribed: true };
      mockService.subscribeNewsletter.mockResolvedValue(updated);

      const res = await request(app).post('/api/preferences/newsletter/subscribe');

      expect(res.status).toBe(200);
      expect(res.body.newsletterSubscribed).toBe(true);
    });
  });

  describe('POST /api/preferences/newsletter/unsubscribe', () => {
    it('should return 200 when unsubscribed', async () => {
      const updated = { id: 'pref-1', customerId: 'cust-1', newsletterSubscribed: false };
      mockService.unsubscribeNewsletter.mockResolvedValue(updated);

      const res = await request(app).post('/api/preferences/newsletter/unsubscribe');

      expect(res.status).toBe(200);
      expect(res.body.newsletterSubscribed).toBe(false);
    });
  });
});