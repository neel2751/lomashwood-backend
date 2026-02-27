import { createNotificationSchema, updateNotificationStatusSchema } from '../../app/notifications/notification.schemas';
import { NotificationStatus, NotificationType } from '../../app/notifications/notification.types';

describe('Notification Validators', () => {
  describe('createNotificationSchema', () => {
    it('passes with valid payload', () => {
      const input = {
        userId: 'user-1',
        type: NotificationType.EMAIL,
        subject: 'Hello',
        body: 'World',
      };

      const result = createNotificationSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('fails when userId is missing', () => {
      const input = {
        type: NotificationType.EMAIL,
        subject: 'Hello',
        body: 'World',
      };

      const result = createNotificationSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('fails with invalid type', () => {
      const input = {
        userId: 'user-1',
        type: 'CARRIER_PIGEON',
        subject: 'Hello',
        body: 'World',
      };

      const result = createNotificationSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('fails when subject is empty', () => {
      const input = {
        userId: 'user-1',
        type: NotificationType.EMAIL,
        subject: '',
        body: 'World',
      };

      const result = createNotificationSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('fails when body is missing', () => {
      const input = {
        userId: 'user-1',
        type: NotificationType.SMS,
        subject: 'Hello',
      };

      const result = createNotificationSchema.safeParse(input);

      expect(result.success).toBe(false);
    });
  });

  describe('updateNotificationStatusSchema', () => {
    it('passes with valid status', () => {
      const input = { status: NotificationStatus.SENT };

      const result = updateNotificationStatusSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('fails with invalid status', () => {
      const input = { status: 'DELIVERED' };

      const result = updateNotificationStatusSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('fails when status is missing', () => {
      const result = updateNotificationStatusSchema.safeParse({});

      expect(result.success).toBe(false);
    });

    it('passes FAILED status with optional error message', () => {
      const input = { status: NotificationStatus.FAILED, error: 'SMTP timeout' };

      const result = updateNotificationStatusSchema.safeParse(input);

      expect(result.success).toBe(true);
    });
  });
});