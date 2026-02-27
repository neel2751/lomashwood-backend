import request from 'supertest';
import express from 'express';
import { notificationPreferenceRouter } from '../../src/app/notification-preference/notification-preference.routes';
import { NotificationPreferenceService } from '../../src/app/notification-preference/notification-preference.service';

jest.mock('../../src/app/notification-preference/notification-preference.service');
jest.mock('../../src/shared/middlewares/auth.middleware', () => ({
  authenticate: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    req.user = { id: 'user-1', customerId: 'cust-1', role: 'CUSTOMER' };
    next();
  },
}));

const mockService = {
  getPreferences: jest.fn(),
  upsertPreferences: jest.fn(),
  updateChannel: jest.fn(),
  muteAll: jest.fn(),
  enableAll: jest.fn(),
};

(NotificationPreferenceService as jest.Mock).mockImplementation(() => mockService);

const app = express();
app.use(express.json());
app.use('/api/notification-preferences', notificationPreferenceRouter);
app.use((err: Error & { statusCode?: number }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(err.statusCode ?? 500).json({ message: err.message });
});

describe('Notification Preference Routes', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('GET /api/notification-preferences', () => {
    it('should return 200 with notification preferences', async () => {
      const prefs = {
        id: 'npref-1',
        customerId: 'cust-1',
        orderUpdates: true,
        promotions: false,
        appointmentReminders: true,
        deliveryAlerts: true,
        reviewRequests: false,
        loyaltyUpdates: true,
        channels: { email: true, sms: false, push: true },
      };
      mockService.getPreferences.mockResolvedValue(prefs);

      const res = await request(app).get('/api/notification-preferences');

      expect(res.status).toBe(200);
      expect(res.body.orderUpdates).toBe(true);
      expect(res.body.channels.email).toBe(true);
    });

    it('should return 404 when preferences not found', async () => {
      const error = Object.assign(new Error('Preferences not found'), { statusCode: 404 });
      mockService.getPreferences.mockRejectedValue(error);

      const res = await request(app).get('/api/notification-preferences');

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/notification-preferences', () => {
    it('should return 200 with upserted preferences', async () => {
      const input = { orderUpdates: true, promotions: true, appointmentReminders: false, deliveryAlerts: true, reviewRequests: true, loyaltyUpdates: false };
      const upserted = { id: 'npref-1', customerId: 'cust-1', ...input, channels: { email: true, sms: false, push: false } };
      mockService.upsertPreferences.mockResolvedValue(upserted);

      const res = await request(app).put('/api/notification-preferences').send(input);

      expect(res.status).toBe(200);
      expect(res.body.promotions).toBe(true);
    });

    it('should return 200 with partial preference update', async () => {
      const upserted = { id: 'npref-1', customerId: 'cust-1', promotions: true };
      mockService.upsertPreferences.mockResolvedValue(upserted);

      const res = await request(app).put('/api/notification-preferences').send({ promotions: true });

      expect(res.status).toBe(200);
    });
  });

  describe('PATCH /api/notification-preferences/channels/:channel', () => {
    it('should return 200 when email channel enabled', async () => {
      const updated = { id: 'npref-1', customerId: 'cust-1', channels: { email: true, sms: false, push: false } };
      mockService.updateChannel.mockResolvedValue(updated);

      const res = await request(app).patch('/api/notification-preferences/channels/email').send({ enabled: true });

      expect(res.status).toBe(200);
      expect(res.body.channels.email).toBe(true);
    });

    it('should return 200 when sms channel disabled', async () => {
      const updated = { id: 'npref-1', customerId: 'cust-1', channels: { email: true, sms: false, push: false } };
      mockService.updateChannel.mockResolvedValue(updated);

      const res = await request(app).patch('/api/notification-preferences/channels/sms').send({ enabled: false });

      expect(res.status).toBe(200);
      expect(res.body.channels.sms).toBe(false);
    });

    it('should return 400 when channel is invalid', async () => {
      const error = Object.assign(new Error('Invalid channel'), { statusCode: 400 });
      mockService.updateChannel.mockRejectedValue(error);

      const res = await request(app).patch('/api/notification-preferences/channels/telegram').send({ enabled: true });

      expect(res.status).toBe(400);
    });

    it('should return 422 when enabled is not a boolean', async () => {
      const res = await request(app).patch('/api/notification-preferences/channels/email').send({ enabled: 'yes' });

      expect(res.status).toBe(422);
    });
  });

  describe('POST /api/notification-preferences/mute', () => {
    it('should return 200 with all notifications disabled', async () => {
      const muted = {
        id: 'npref-1',
        customerId: 'cust-1',
        orderUpdates: false,
        promotions: false,
        appointmentReminders: false,
        deliveryAlerts: false,
        reviewRequests: false,
        loyaltyUpdates: false,
      };
      mockService.muteAll.mockResolvedValue(muted);

      const res = await request(app).post('/api/notification-preferences/mute');

      expect(res.status).toBe(200);
      expect(res.body.orderUpdates).toBe(false);
      expect(res.body.promotions).toBe(false);
    });
  });

  describe('POST /api/notification-preferences/unmute', () => {
    it('should return 200 with all notifications enabled', async () => {
      const enabled = {
        id: 'npref-1',
        customerId: 'cust-1',
        orderUpdates: true,
        promotions: true,
        appointmentReminders: true,
        deliveryAlerts: true,
        reviewRequests: true,
        loyaltyUpdates: true,
      };
      mockService.enableAll.mockResolvedValue(enabled);

      const res = await request(app).post('/api/notification-preferences/unmute');

      expect(res.status).toBe(200);
      expect(res.body.orderUpdates).toBe(true);
      expect(res.body.promotions).toBe(true);
    });
  });
});