import request from 'supertest';
import express from 'express';
import { NotificationController } from '../../app/notifications/notification.controller';
import { NotificationService } from '../../app/notifications/notification.service';
import { NotificationStatus, NotificationType } from '../../app/notifications/notification.types';

jest.mock('../../app/notifications/notification.service');

const mockService = new NotificationService(null as any) as jest.Mocked<NotificationService>;

const app = express();
app.use(express.json());

const controller = new NotificationController(mockService);
app.get('/notifications/:id', (req, res) => controller.getById(req, res));
app.get('/notifications/user/:userId', (req, res) => controller.getByUserId(req, res));
app.delete('/notifications/:id', (req, res) => controller.remove(req, res));

describe('NotificationController', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('GET /notifications/:id', () => {
    it('returns 200 with notification', async () => {
      const notif = { id: 'notif-1', type: NotificationType.EMAIL, status: NotificationStatus.SENT };
      mockService.findById.mockResolvedValue(notif);

      const res = await request(app).get('/notifications/notif-1');

      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({ id: 'notif-1' });
    });

    it('returns 404 when not found', async () => {
      mockService.findById.mockResolvedValue(null);

      const res = await request(app).get('/notifications/missing');

      expect(res.status).toBe(404);
    });
  });

  describe('GET /notifications/user/:userId', () => {
    it('returns 200 with user notifications', async () => {
      const notifications = [
        { id: 'n1', userId: 'user-1' },
        { id: 'n2', userId: 'user-1' },
      ];
      mockService.findByUserId.mockResolvedValue(notifications);

      const res = await request(app).get('/notifications/user/user-1');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
    });
  });

  describe('DELETE /notifications/:id', () => {
    it('returns 204 on successful delete', async () => {
      mockService.delete.mockResolvedValue(undefined);

      const res = await request(app).delete('/notifications/notif-1');

      expect(res.status).toBe(204);
    });
  });
});