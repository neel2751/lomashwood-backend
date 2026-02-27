import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { NotificationRepository } from '../../src/app/notifications/notification.repository';
import {
  CreateNotificationDto,
  UpdateNotificationDto,
  NotificationType,
  NotificationChannel,
  NotificationPriority,
  NotificationStatus,
} from '../../src/app/notifications/notification.types';

jest.mock('../../src/infrastructure/db/prisma.client', () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>(),
}));

describe('NotificationRepository', () => {
  let repository: NotificationRepository;
  let prismaMock: DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    prismaMock = mockDeep<PrismaClient>();
    repository = new NotificationRepository(prismaMock as any);
  });

  afterEach(() => {
    mockReset(prismaMock);
  });

  describe('create', () => {
    it('should create a new notification record', async () => {
      const createDto: CreateNotificationDto = {
        type: NotificationType.PRODUCT_CREATED,
        channel: NotificationChannel.EMAIL,
        priority: NotificationPriority.MEDIUM,
        recipientId: 'user-123',
        recipientEmail: 'user@example.com',
        subject: 'New Product Created',
        message: 'A new product has been added to the catalog',
        metadata: {
          productId: 'product-123',
          productTitle: 'Luna Kitchen',
          category: 'KITCHEN',
        },
      };

      const mockNotification = {
        id: 'notification-123',
        ...createDto,
        status: NotificationStatus.PENDING,
        sentAt: null,
        readAt: null,
        retryCount: 0,
        errorMessage: null,
        createdAt: new Date('2026-02-12T10:00:00Z'),
        updatedAt: new Date('2026-02-12T10:00:00Z'),
        deletedAt: null,
      };

      prismaMock.notification.create.mockResolvedValue(mockNotification as any);

      const result = await repository.create(createDto);

      expect(result).toEqual(mockNotification);
      expect(prismaMock.notification.create).toHaveBeenCalledWith({
        data: {
          ...createDto,
          status: NotificationStatus.PENDING,
          retryCount: 0,
        },
      });
      expect(prismaMock.notification.create).toHaveBeenCalledTimes(1);
    });

    it('should create notification with default values', async () => {
      const createDto: CreateNotificationDto = {
        type: NotificationType.INVENTORY_LOW_STOCK,
        channel: NotificationChannel.EMAIL,
        priority: NotificationPriority.HIGH,
        recipientEmail: 'admin@lomashwood.com',
        subject: 'Low Stock Alert',
        message: 'Product inventory is running low',
      };

      const mockNotification = {
        id: 'notification-456',
        ...createDto,
        recipientId: null,
        metadata: null,
        status: NotificationStatus.PENDING,
        sentAt: null,
        readAt: null,
        retryCount: 0,
        errorMessage: null,
        createdAt: new Date('2026-02-12T10:00:00Z'),
        updatedAt: new Date('2026-02-12T10:00:00Z'),
        deletedAt: null,
      };

      prismaMock.notification.create.mockResolvedValue(mockNotification as any);

      const result = await repository.create(createDto);

      expect(result).toEqual(mockNotification);
      expect(result.status).toBe(NotificationStatus.PENDING);
      expect(result.retryCount).toBe(0);
    });

    it('should throw error when notification creation fails', async () => {
      const createDto: CreateNotificationDto = {
        type: NotificationType.PRODUCT_CREATED,
        channel: NotificationChannel.EMAIL,
        priority: NotificationPriority.MEDIUM,
        recipientEmail: 'user@example.com',
        subject: 'Test',
        message: 'Test message',
      };

      prismaMock.notification.create.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(repository.create(createDto)).rejects.toThrow(
        'Database connection failed'
      );
    });
  });

  describe('findById', () => {
    it('should return notification when found', async () => {
      const notificationId = 'notification-123';
      const mockNotification = {
        id: notificationId,
        type: NotificationType.PRODUCT_CREATED,
        channel: NotificationChannel.EMAIL,
        priority: NotificationPriority.MEDIUM,
        recipientId: 'user-123',
        recipientEmail: 'user@example.com',
        subject: 'New Product',
        message: 'Product created successfully',
        metadata: { productId: 'product-123' },
        status: NotificationStatus.SENT,
        sentAt: new Date('2026-02-12T10:05:00Z'),
        readAt: null,
        retryCount: 0,
        errorMessage: null,
        createdAt: new Date('2026-02-12T10:00:00Z'),
        updatedAt: new Date('2026-02-12T10:05:00Z'),
        deletedAt: null,
      };

      prismaMock.notification.findUnique.mockResolvedValue(mockNotification as any);

      const result = await repository.findById(notificationId);

      expect(result).toEqual(mockNotification);
      expect(prismaMock.notification.findUnique).toHaveBeenCalledWith({
        where: { id: notificationId },
      });
    });

    it('should return null when notification not found', async () => {
      const notificationId = 'non-existent-notification';

      prismaMock.notification.findUnique.mockResolvedValue(null);

      const result = await repository.findById(notificationId);

      expect(result).toBeNull();
      expect(prismaMock.notification.findUnique).toHaveBeenCalledWith({
        where: { id: notificationId },
      });
    });
  });

  describe('findByRecipient', () => {
    it('should return notifications for a specific recipient', async () => {
      const recipientId = 'user-123';
      const mockNotifications = [
        {
          id: 'notification-1',
          type: NotificationType.PRODUCT_CREATED,
          channel: NotificationChannel.EMAIL,
          priority: NotificationPriority.MEDIUM,
          recipientId,
          recipientEmail: 'user@example.com',
          subject: 'Product Created',
          message: 'New product created',
          status: NotificationStatus.SENT,
          sentAt: new Date('2026-02-12T10:00:00Z'),
          readAt: null,
          retryCount: 0,
          createdAt: new Date('2026-02-12T09:00:00Z'),
          updatedAt: new Date('2026-02-12T10:00:00Z'),
          deletedAt: null,
        },
        {
          id: 'notification-2',
          type: NotificationType.PRICE_CHANGED,
          channel: NotificationChannel.EMAIL,
          priority: NotificationPriority.LOW,
          recipientId,
          recipientEmail: 'user@example.com',
          subject: 'Price Changed',
          message: 'Product price updated',
          status: NotificationStatus.PENDING,
          sentAt: null,
          readAt: null,
          retryCount: 0,
          createdAt: new Date('2026-02-12T11:00:00Z'),
          updatedAt: new Date('2026-02-12T11:00:00Z'),
          deletedAt: null,
        },
      ];

      prismaMock.notification.findMany.mockResolvedValue(mockNotifications as any);

      const result = await repository.findByRecipient(recipientId);

      expect(result).toEqual(mockNotifications);
      expect(prismaMock.notification.findMany).toHaveBeenCalledWith({
        where: { recipientId },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array when no notifications found', async () => {
      const recipientId = 'user-with-no-notifications';

      prismaMock.notification.findMany.mockResolvedValue([]);

      const result = await repository.findByRecipient(recipientId);

      expect(result).toEqual([]);
    });
  });

  describe('findByRecipientEmail', () => {
    it('should return notifications by recipient email', async () => {
      const recipientEmail = 'user@example.com';
      const mockNotifications = [
        {
          id: 'notification-1',
          type: NotificationType.PRODUCT_CREATED,
          channel: NotificationChannel.EMAIL,
          priority: NotificationPriority.MEDIUM,
          recipientId: 'user-123',
          recipientEmail,
          subject: 'Test',
          message: 'Test message',
          status: NotificationStatus.SENT,
          sentAt: new Date('2026-02-12T10:00:00Z'),
          createdAt: new Date('2026-02-12T09:00:00Z'),
          updatedAt: new Date('2026-02-12T10:00:00Z'),
          deletedAt: null,
        },
      ];

      prismaMock.notification.findMany.mockResolvedValue(mockNotifications as any);

      const result = await repository.findByRecipientEmail(recipientEmail);

      expect(result).toEqual(mockNotifications);
      expect(prismaMock.notification.findMany).toHaveBeenCalledWith({
        where: { recipientEmail },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated notifications with default pagination', async () => {
      const mockNotifications = [
        {
          id: 'notification-1',
          type: NotificationType.PRODUCT_CREATED,
          channel: NotificationChannel.EMAIL,
          priority: NotificationPriority.MEDIUM,
          recipientEmail: 'user@example.com',
          subject: 'Test 1',
          message: 'Test message 1',
          status: NotificationStatus.SENT,
          sentAt: new Date('2026-02-12T10:00:00Z'),
          createdAt: new Date('2026-02-12T10:00:00Z'),
          updatedAt: new Date('2026-02-12T10:00:00Z'),
          deletedAt: null,
        },
        {
          id: 'notification-2',
          type: NotificationType.INVENTORY_LOW_STOCK,
          channel: NotificationChannel.EMAIL,
          priority: NotificationPriority.HIGH,
          recipientEmail: 'admin@example.com',
          subject: 'Test 2',
          message: 'Test message 2',
          status: NotificationStatus.PENDING,
          sentAt: null,
          createdAt: new Date('2026-02-12T11:00:00Z'),
          updatedAt: new Date('2026-02-12T11:00:00Z'),
          deletedAt: null,
        },
      ];

      prismaMock.notification.findMany.mockResolvedValue(mockNotifications as any);
      prismaMock.notification.count.mockResolvedValue(2);

      const result = await repository.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual(mockNotifications);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
      expect(prismaMock.notification.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        where: {},
      });
    });

    it('should filter notifications by status', async () => {
      const mockNotifications = [
        {
          id: 'notification-1',
          type: NotificationType.INVENTORY_LOW_STOCK,
          channel: NotificationChannel.EMAIL,
          priority: NotificationPriority.HIGH,
          status: NotificationStatus.PENDING,
          recipientEmail: 'admin@example.com',
          subject: 'Low Stock',
          message: 'Stock is low',
          createdAt: new Date('2026-02-12T10:00:00Z'),
          updatedAt: new Date('2026-02-12T10:00:00Z'),
          deletedAt: null,
        },
      ];

      prismaMock.notification.findMany.mockResolvedValue(mockNotifications as any);
      prismaMock.notification.count.mockResolvedValue(1);

      const result = await repository.findAll({
        page: 1,
        limit: 10,
        status: NotificationStatus.PENDING,
      });

      expect(result.data).toEqual(mockNotifications);
      expect(prismaMock.notification.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        where: { status: NotificationStatus.PENDING },
      });
    });

    it('should filter notifications by type', async () => {
      const mockNotifications = [
        {
          id: 'notification-1',
          type: NotificationType.PRODUCT_CREATED,
          channel: NotificationChannel.EMAIL,
          priority: NotificationPriority.MEDIUM,
          status: NotificationStatus.SENT,
          recipientEmail: 'user@example.com',
          subject: 'Product Created',
          message: 'New product',
          createdAt: new Date('2026-02-12T10:00:00Z'),
          updatedAt: new Date('2026-02-12T10:00:00Z'),
          deletedAt: null,
        },
      ];

      prismaMock.notification.findMany.mockResolvedValue(mockNotifications as any);
      prismaMock.notification.count.mockResolvedValue(1);

      const result = await repository.findAll({
        page: 1,
        limit: 10,
        type: NotificationType.PRODUCT_CREATED,
      });

      expect(result.data).toEqual(mockNotifications);
      expect(prismaMock.notification.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        where: { type: NotificationType.PRODUCT_CREATED },
      });
    });

    it('should filter notifications by priority', async () => {
      const mockNotifications = [
        {
          id: 'notification-1',
          type: NotificationType.INVENTORY_LOW_STOCK,
          channel: NotificationChannel.EMAIL,
          priority: NotificationPriority.CRITICAL,
          status: NotificationStatus.PENDING,
          recipientEmail: 'admin@example.com',
          subject: 'Critical Stock Alert',
          message: 'Stock critically low',
          createdAt: new Date('2026-02-12T10:00:00Z'),
          updatedAt: new Date('2026-02-12T10:00:00Z'),
          deletedAt: null,
        },
      ];

      prismaMock.notification.findMany.mockResolvedValue(mockNotifications as any);
      prismaMock.notification.count.mockResolvedValue(1);

      const result = await repository.findAll({
        page: 1,
        limit: 10,
        priority: NotificationPriority.CRITICAL,
      });

      expect(result.data[0].priority).toBe(NotificationPriority.CRITICAL);
    });

    it('should handle pagination correctly', async () => {
      const mockNotifications = [
        {
          id: 'notification-11',
          type: NotificationType.PRODUCT_CREATED,
          channel: NotificationChannel.EMAIL,
          priority: NotificationPriority.MEDIUM,
          status: NotificationStatus.SENT,
          recipientEmail: 'user@example.com',
          subject: 'Test',
          message: 'Test message',
          createdAt: new Date('2026-02-12T10:00:00Z'),
          updatedAt: new Date('2026-02-12T10:00:00Z'),
          deletedAt: null,
        },
      ];

      prismaMock.notification.findMany.mockResolvedValue(mockNotifications as any);
      prismaMock.notification.count.mockResolvedValue(25);

      const result = await repository.findAll({ page: 2, limit: 10 });

      expect(result.data).toEqual(mockNotifications);
      expect(result.total).toBe(25);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(3);
      expect(prismaMock.notification.findMany).toHaveBeenCalledWith({
        skip: 10,
        take: 10,
        orderBy: { createdAt: 'desc' },
        where: {},
      });
    });
  });

  describe('update', () => {
    it('should update notification status to SENT', async () => {
      const notificationId = 'notification-123';
      const updateDto: UpdateNotificationDto = {
        status: NotificationStatus.SENT,
        sentAt: new Date('2026-02-12T10:05:00Z'),
      };

      const mockUpdatedNotification = {
        id: notificationId,
        type: NotificationType.PRODUCT_CREATED,
        channel: NotificationChannel.EMAIL,
        priority: NotificationPriority.MEDIUM,
        recipientEmail: 'user@example.com',
        subject: 'Test',
        message: 'Test message',
        status: NotificationStatus.SENT,
        sentAt: updateDto.sentAt,
        readAt: null,
        retryCount: 0,
        errorMessage: null,
        createdAt: new Date('2026-02-12T10:00:00Z'),
        updatedAt: new Date('2026-02-12T10:05:00Z'),
        deletedAt: null,
      };

      prismaMock.notification.update.mockResolvedValue(mockUpdatedNotification as any);

      const result = await repository.update(notificationId, updateDto);

      expect(result).toEqual(mockUpdatedNotification);
      expect(prismaMock.notification.update).toHaveBeenCalledWith({
        where: { id: notificationId },
        data: updateDto,
      });
    });

    it('should update notification status to FAILED with error message', async () => {
      const notificationId = 'notification-123';
      const updateDto: UpdateNotificationDto = {
        status: NotificationStatus.FAILED,
        errorMessage: 'SMTP connection timeout',
        retryCount: 1,
      };

      const mockUpdatedNotification = {
        id: notificationId,
        type: NotificationType.PRODUCT_CREATED,
        channel: NotificationChannel.EMAIL,
        priority: NotificationPriority.MEDIUM,
        recipientEmail: 'user@example.com',
        subject: 'Test',
        message: 'Test message',
        status: NotificationStatus.FAILED,
        sentAt: null,
        readAt: null,
        retryCount: 1,
        errorMessage: 'SMTP connection timeout',
        createdAt: new Date('2026-02-12T10:00:00Z'),
        updatedAt: new Date('2026-02-12T10:05:00Z'),
        deletedAt: null,
      };

      prismaMock.notification.update.mockResolvedValue(mockUpdatedNotification as any);

      const result = await repository.update(notificationId, updateDto);

      expect(result.status).toBe(NotificationStatus.FAILED);
      expect(result.errorMessage).toBe('SMTP connection timeout');
      expect(result.retryCount).toBe(1);
    });

    it('should mark notification as read', async () => {
      const notificationId = 'notification-123';
      const updateDto: UpdateNotificationDto = {
        readAt: new Date('2026-02-12T10:10:00Z'),
      };

      const mockUpdatedNotification = {
        id: notificationId,
        type: NotificationType.PRODUCT_CREATED,
        channel: NotificationChannel.EMAIL,
        priority: NotificationPriority.MEDIUM,
        recipientEmail: 'user@example.com',
        subject: 'Test',
        message: 'Test message',
        status: NotificationStatus.SENT,
        sentAt: new Date('2026-02-12T10:05:00Z'),
        readAt: updateDto.readAt,
        retryCount: 0,
        createdAt: new Date('2026-02-12T10:00:00Z'),
        updatedAt: new Date('2026-02-12T10:10:00Z'),
        deletedAt: null,
      };

      prismaMock.notification.update.mockResolvedValue(mockUpdatedNotification as any);

      const result = await repository.update(notificationId, updateDto);

      expect(result.readAt).toEqual(updateDto.readAt);
    });

    it('should throw error when updating non-existent notification', async () => {
      const notificationId = 'non-existent-notification';
      const updateDto: UpdateNotificationDto = {
        status: NotificationStatus.FAILED,
      };

      prismaMock.notification.update.mockRejectedValue(
        new Error('Record not found')
      );

      await expect(repository.update(notificationId, updateDto)).rejects.toThrow(
        'Record not found'
      );
    });
  });

  describe('delete', () => {
    it('should soft delete notification', async () => {
      const notificationId = 'notification-123';
      const mockDeletedNotification = {
        id: notificationId,
        type: NotificationType.PRODUCT_CREATED,
        channel: NotificationChannel.EMAIL,
        priority: NotificationPriority.MEDIUM,
        recipientEmail: 'user@example.com',
        subject: 'Test',
        message: 'Test message',
        status: NotificationStatus.SENT,
        sentAt: new Date('2026-02-12T10:05:00Z'),
        readAt: null,
        retryCount: 0,
        createdAt: new Date('2026-02-12T10:00:00Z'),
        updatedAt: new Date('2026-02-12T12:00:00Z'),
        deletedAt: new Date('2026-02-12T12:00:00Z'),
      };

      prismaMock.notification.update.mockResolvedValue(mockDeletedNotification as any);

      const result = await repository.delete(notificationId);

      expect(result).toEqual(mockDeletedNotification);
      expect(prismaMock.notification.update).toHaveBeenCalledWith({
        where: { id: notificationId },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('should throw error when deleting non-existent notification', async () => {
      const notificationId = 'non-existent-notification';

      prismaMock.notification.update.mockRejectedValue(
        new Error('Record not found')
      );

      await expect(repository.delete(notificationId)).rejects.toThrow(
        'Record not found'
      );
    });
  });

  describe('findByStatus', () => {
    it('should return notifications with specific status', async () => {
      const mockNotifications = [
        {
          id: 'notification-1',
          type: NotificationType.INVENTORY_LOW_STOCK,
          channel: NotificationChannel.EMAIL,
          priority: NotificationPriority.HIGH,
          status: NotificationStatus.PENDING,
          recipientEmail: 'admin@example.com',
          subject: 'Low Stock',
          message: 'Stock is low',
          createdAt: new Date('2026-02-12T10:00:00Z'),
          updatedAt: new Date('2026-02-12T10:00:00Z'),
          deletedAt: null,
        },
      ];

      prismaMock.notification.findMany.mockResolvedValue(mockNotifications as any);

      const result = await repository.findByStatus(NotificationStatus.PENDING);

      expect(result).toEqual(mockNotifications);
      expect(prismaMock.notification.findMany).toHaveBeenCalledWith({
        where: { status: NotificationStatus.PENDING },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findByType', () => {
    it('should return notifications with specific type', async () => {
      const mockNotifications = [
        {
          id: 'notification-1',
          type: NotificationType.PRODUCT_CREATED,
          channel: NotificationChannel.EMAIL,
          priority: NotificationPriority.MEDIUM,
          status: NotificationStatus.SENT,
          recipientEmail: 'user@example.com',
          subject: 'Product Created',
          message: 'New product created',
          createdAt: new Date('2026-02-12T10:00:00Z'),
          updatedAt: new Date('2026-02-12T10:00:00Z'),
          deletedAt: null,
        },
      ];

      prismaMock.notification.findMany.mockResolvedValue(mockNotifications as any);

      const result = await repository.findByType(NotificationType.PRODUCT_CREATED);

      expect(result).toEqual(mockNotifications);
      expect(prismaMock.notification.findMany).toHaveBeenCalledWith({
        where: { type: NotificationType.PRODUCT_CREATED },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('countByStatus', () => {
    it('should return count of notifications by status', async () => {
      prismaMock.notification.count.mockResolvedValue(15);

      const result = await repository.countByStatus(NotificationStatus.SENT);

      expect(result).toBe(15);
      expect(prismaMock.notification.count).toHaveBeenCalledWith({
        where: { status: NotificationStatus.SENT },
      });
    });

    it('should return 0 when no notifications with given status', async () => {
      prismaMock.notification.count.mockResolvedValue(0);

      const result = await repository.countByStatus(NotificationStatus.FAILED);

      expect(result).toBe(0);
    });
  });

  describe('getStatistics', () => {
    it('should return notification statistics', async () => {
      prismaMock.notification.count.mockResolvedValueOnce(100); // total
      prismaMock.notification.count.mockResolvedValueOnce(85);  // sent
      prismaMock.notification.count.mockResolvedValueOnce(10);  // pending
      prismaMock.notification.count.mockResolvedValueOnce(5);   // failed

      prismaMock.notification.groupBy.mockResolvedValueOnce([
        { type: NotificationType.PRODUCT_CREATED, _count: { id: 40 } },
        { type: NotificationType.INVENTORY_LOW_STOCK, _count: { id: 30 } },
        { type: NotificationType.PRICE_CHANGED, _count: { id: 20 } },
        { type: NotificationType.PRODUCT_OUT_OF_STOCK, _count: { id: 10 } },
      ] as any);

      prismaMock.notification.groupBy.mockResolvedValueOnce([
        { channel: NotificationChannel.EMAIL, _count: { id: 80 } },
        { channel: NotificationChannel.SMS, _count: { id: 15 } },
        { channel: NotificationChannel.PUSH, _count: { id: 5 } },
      ] as any);

      const result = await repository.getStatistics();

      expect(result.total).toBe(100);
      expect(result.sent).toBe(85);
      expect(result.pending).toBe(10);
      expect(result.failed).toBe(5);
      expect(result.byType[NotificationType.PRODUCT_CREATED]).toBe(40);
      expect(result.byChannel[NotificationChannel.EMAIL]).toBe(80);
    });
  });

  describe('findPendingNotifications', () => {
    it('should return pending notifications', async () => {
      const mockNotifications = [
        {
          id: 'notification-1',
          type: NotificationType.PRODUCT_CREATED,
          channel: NotificationChannel.EMAIL,
          priority: NotificationPriority.HIGH,
          status: NotificationStatus.PENDING,
          recipientEmail: 'user@example.com',
          subject: 'Pending Notification',
          message: 'This notification is pending',
          retryCount: 0,
          createdAt: new Date('2026-02-12T10:00:00Z'),
          updatedAt: new Date('2026-02-12T10:00:00Z'),
          deletedAt: null,
        },
      ];

      prismaMock.notification.findMany.mockResolvedValue(mockNotifications as any);

      const result = await repository.findPendingNotifications();

      expect(result).toEqual(mockNotifications);
      expect(prismaMock.notification.findMany).toHaveBeenCalledWith({
        where: { status: NotificationStatus.PENDING },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'asc' },
        ],
      });
    });

    it('should limit number of pending notifications returned', async () => {
      const limit = 50;
      const mockNotifications = Array(50).fill(null).map((_, i) => ({
        id: `notification-${i}`,
        type: NotificationType.PRODUCT_CREATED,
        channel: NotificationChannel.EMAIL,
        priority: NotificationPriority.MEDIUM,
        status: NotificationStatus.PENDING,
        recipientEmail: 'user@example.com',
        subject: 'Test',
        message: 'Test message',
        createdAt: new Date('2026-02-12T10:00:00Z'),
        updatedAt: new Date('2026-02-12T10:00:00Z'),
        deletedAt: null,
      }));

      prismaMock.notification.findMany.mockResolvedValue(mockNotifications as any);

      const result = await repository.findPendingNotifications(limit);

      expect(result).toHaveLength(50);
      expect(prismaMock.notification.findMany).toHaveBeenCalledWith({
        where: { status: NotificationStatus.PENDING },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'asc' },
        ],
        take: limit,
      });
    });
  });

  describe('findFailedNotifications', () => {
    it('should return failed notifications eligible for retry', async () => {
      const maxRetries = 3;
      const mockNotifications = [
        {
          id: 'notification-1',
          type: NotificationType.INVENTORY_LOW_STOCK,
          channel: NotificationChannel.EMAIL,
          priority: NotificationPriority.HIGH,
          status: NotificationStatus.FAILED,
          recipientEmail: 'admin@example.com',
          subject: 'Failed Notification',
          message: 'This notification failed',
          retryCount: 1,
          errorMessage: 'SMTP timeout',
          createdAt: new Date('2026-02-12T10:00:00Z'),
          updatedAt: new Date('2026-02-12T10:05:00Z'),
          deletedAt: null,
        },
      ];

      prismaMock.notification.findMany.mockResolvedValue(mockNotifications as any);

      const result = await repository.findFailedNotifications(maxRetries);

      expect(result).toEqual(mockNotifications);
      expect(prismaMock.notification.findMany).toHaveBeenCalledWith({
        where: {
          status: NotificationStatus.FAILED,
          retryCount: { lt: maxRetries },
        },
        orderBy: { createdAt: 'asc' },
      });
    });

    it('should exclude notifications that exceeded max retries', async () => {
      const maxRetries = 3;
      prismaMock.notification.findMany.mockResolvedValue([]);

      const result = await repository.findFailedNotifications(maxRetries);

      expect(result).toEqual([]);
      expect(prismaMock.notification.findMany).toHaveBeenCalledWith({
        where: {
          status: NotificationStatus.FAILED,
          retryCount: { lt: maxRetries },
        },
        orderBy: { createdAt: 'asc' },
      });
    });
  });

  describe('findUnreadByRecipient', () => {
    it('should return unread notifications for a recipient', async () => {
      const recipientId = 'user-123';
      const mockNotifications = [
        {
          id: 'notification-1',
          type: NotificationType.PRODUCT_CREATED,
          channel: NotificationChannel.EMAIL,
          priority: NotificationPriority.MEDIUM,
          recipientId,
          recipientEmail: 'user@example.com',
          subject: 'Unread Notification',
          message: 'This notification is unread',
          status: NotificationStatus.SENT,
          sentAt: new Date('2026-02-12T10:00:00Z'),
          readAt: null,
          createdAt: new Date('2026-02-12T09:00:00Z'),
          updatedAt: new Date('2026-02-12T10:00:00Z'),
          deletedAt: null,
        },
      ];

      prismaMock.notification.findMany.mockResolvedValue(mockNotifications as any);

      const result = await repository.findUnreadByRecipient(recipientId);

      expect(result).toEqual(mockNotifications);
      expect(prismaMock.notification.findMany).toHaveBeenCalledWith({
        where: {
          recipientId,
          readAt: null,
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array when all notifications are read', async () => {
      const recipientId = 'user-123';
      prismaMock.notification.findMany.mockResolvedValue([]);

      const result = await repository.findUnreadByRecipient(recipientId);

      expect(result).toEqual([]);
    });
  });

  describe('bulkUpdateStatus', () => {
    it('should update status of multiple notifications', async () => {
      const notificationIds = ['notification-1', 'notification-2', 'notification-3'];
      const status = NotificationStatus.SENT;

      const mockResult = { count: 3 };

      prismaMock.notification.updateMany.mockResolvedValue(mockResult as any);

      const result = await repository.bulkUpdateStatus(notificationIds, status);

      expect(result).toEqual(mockResult);
      expect(prismaMock.notification.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: notificationIds },
        },
        data: {
          status,
          sentAt: expect.any(Date),
        },
      });
    });

    it('should return 0 count when no notifications updated', async () => {
      const notificationIds: string[] = [];
      const status = NotificationStatus.SENT;

      const mockResult = { count: 0 };

      prismaMock.notification.updateMany.mockResolvedValue(mockResult as any);

      const result = await repository.bulkUpdateStatus(notificationIds, status);

      expect(result.count).toBe(0);
    });
  });
});