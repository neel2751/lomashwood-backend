import { NotificationService } from '../../src/app/notifications/notification.service';
import { NotificationRepository } from '../../src/app/notifications/notification.repository';
import { EventProducer } from '../../src/infrastructure/messaging/event-producer';
import {
  CreateNotificationDto,
  NotificationType,
  NotificationChannel,
  NotificationPriority,
  NotificationStatus,
} from '../../src/app/notifications/notification.types';
import { AppError } from '../../src/shared/errors';

jest.mock('../../src/app/notifications/notification.repository');
jest.mock('../../src/infrastructure/messaging/event-producer');

describe('NotificationService', () => {
  let service: NotificationService;
  let mockRepository: jest.Mocked<NotificationRepository>;
  let mockEventProducer: jest.Mocked<EventProducer>;

  beforeEach(() => {
    mockRepository = new NotificationRepository(null as any) as jest.Mocked<NotificationRepository>;
    mockEventProducer = new EventProducer(null as any) as jest.Mocked<EventProducer>;
    service = new NotificationService(mockRepository, mockEventProducer);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendProductCreatedNotification', () => {
    it('should send notification when product is created', async () => {
      const productData = {
        id: 'product-123',
        title: 'Luna Kitchen',
        category: 'KITCHEN',
        createdBy: 'user-123',
        createdByEmail: 'admin@lomashwood.com',
      };

      const createNotificationDto: CreateNotificationDto = {
        type: NotificationType.PRODUCT_CREATED,
        channel: NotificationChannel.EMAIL,
        priority: NotificationPriority.MEDIUM,
        recipientId: productData.createdBy,
        recipientEmail: productData.createdByEmail,
        subject: 'New Product Created',
        message: `Product "${productData.title}" has been created successfully`,
        metadata: {
          productId: productData.id,
          productTitle: productData.title,
          category: productData.category,
        },
      };

      const mockNotification = {
        id: 'notification-123',
        ...createNotificationDto,
        status: NotificationStatus.PENDING,
        sentAt: null,
        createdAt: new Date('2026-02-12T10:00:00Z'),
        updatedAt: new Date('2026-02-12T10:00:00Z'),
      };

      mockRepository.create = jest.fn().mockResolvedValue(mockNotification);
      mockEventProducer.publish = jest.fn().mockResolvedValue(true);

      const result = await service.sendProductCreatedNotification(productData);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: NotificationType.PRODUCT_CREATED,
          recipientId: productData.createdBy,
        })
      );
      expect(mockEventProducer.publish).toHaveBeenCalledWith(
        'notification.product.created',
        expect.objectContaining({
          notificationId: mockNotification.id,
          productId: productData.id,
        })
      );
      expect(result).toEqual(mockNotification);
    });

    it('should handle errors when creating notification fails', async () => {
      const productData = {
        id: 'product-123',
        title: 'Luna Kitchen',
        category: 'KITCHEN',
        createdBy: 'user-123',
        createdByEmail: 'admin@lomashwood.com',
      };

      const error = new Error('Database error');
      mockRepository.create = jest.fn().mockRejectedValue(error);

      await expect(service.sendProductCreatedNotification(productData)).rejects.toThrow(
        'Database error'
      );
      expect(mockEventProducer.publish).not.toHaveBeenCalled();
    });
  });

  describe('sendInventoryLowStockAlert', () => {
    it('should send alert when inventory is low', async () => {
      const inventoryData = {
        productId: 'product-123',
        productTitle: 'Luna Kitchen - White',
        currentStock: 5,
        threshold: 10,
        locationId: 'warehouse-1',
      };

      const createNotificationDto: CreateNotificationDto = {
        type: NotificationType.INVENTORY_LOW_STOCK,
        channel: NotificationChannel.EMAIL,
        priority: NotificationPriority.HIGH,
        recipientEmail: 'inventory@lomashwood.com',
        subject: 'Low Stock Alert',
        message: `Product "${inventoryData.productTitle}" is running low on stock. Current: ${inventoryData.currentStock}, Threshold: ${inventoryData.threshold}`,
        metadata: {
          productId: inventoryData.productId,
          currentStock: inventoryData.currentStock,
          threshold: inventoryData.threshold,
          locationId: inventoryData.locationId,
        },
      };

      const mockNotification = {
        id: 'notification-456',
        ...createNotificationDto,
        status: NotificationStatus.PENDING,
        sentAt: null,
        createdAt: new Date('2026-02-12T10:00:00Z'),
        updatedAt: new Date('2026-02-12T10:00:00Z'),
      };

      mockRepository.create = jest.fn().mockResolvedValue(mockNotification);
      mockEventProducer.publish = jest.fn().mockResolvedValue(true);

      const result = await service.sendInventoryLowStockAlert(inventoryData);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: NotificationType.INVENTORY_LOW_STOCK,
          priority: NotificationPriority.HIGH,
        })
      );
      expect(mockEventProducer.publish).toHaveBeenCalledWith(
        'notification.inventory.low-stock',
        expect.any(Object)
      );
      expect(result).toEqual(mockNotification);
    });

    it('should send critical alert when stock is critically low', async () => {
      const inventoryData = {
        productId: 'product-123',
        productTitle: 'Luna Kitchen - White',
        currentStock: 2,
        threshold: 10,
        locationId: 'warehouse-1',
      };

      const mockNotification = {
        id: 'notification-456',
        type: NotificationType.INVENTORY_LOW_STOCK,
        channel: NotificationChannel.EMAIL,
        priority: NotificationPriority.CRITICAL,
        status: NotificationStatus.PENDING,
        createdAt: new Date('2026-02-12T10:00:00Z'),
        updatedAt: new Date('2026-02-12T10:00:00Z'),
      };

      mockRepository.create = jest.fn().mockResolvedValue(mockNotification);
      mockEventProducer.publish = jest.fn().mockResolvedValue(true);

      const result = await service.sendInventoryLowStockAlert(inventoryData);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: NotificationPriority.CRITICAL,
        })
      );
      expect(result.priority).toBe(NotificationPriority.CRITICAL);
    });
  });

  describe('sendPriceChangeNotification', () => {
    it('should send notification when product price changes', async () => {
      const priceChangeData = {
        productId: 'product-123',
        productTitle: 'Luna Kitchen - White',
        oldPrice: 25000,
        newPrice: 22000,
        discountPercentage: 12,
        changedBy: 'admin-123',
        changedByEmail: 'admin@lomashwood.com',
      };

      const createNotificationDto: CreateNotificationDto = {
        type: NotificationType.PRICE_CHANGED,
        channel: NotificationChannel.EMAIL,
        priority: NotificationPriority.MEDIUM,
        recipientId: priceChangeData.changedBy,
        recipientEmail: priceChangeData.changedByEmail,
        subject: 'Product Price Updated',
        message: `Price for "${priceChangeData.productTitle}" changed from £${priceChangeData.oldPrice / 100} to £${priceChangeData.newPrice / 100} (${priceChangeData.discountPercentage}% discount)`,
        metadata: {
          productId: priceChangeData.productId,
          oldPrice: priceChangeData.oldPrice,
          newPrice: priceChangeData.newPrice,
          discountPercentage: priceChangeData.discountPercentage,
        },
      };

      const mockNotification = {
        id: 'notification-789',
        ...createNotificationDto,
        status: NotificationStatus.PENDING,
        sentAt: null,
        createdAt: new Date('2026-02-12T10:00:00Z'),
        updatedAt: new Date('2026-02-12T10:00:00Z'),
      };

      mockRepository.create = jest.fn().mockResolvedValue(mockNotification);
      mockEventProducer.publish = jest.fn().mockResolvedValue(true);

      const result = await service.sendPriceChangeNotification(priceChangeData);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: NotificationType.PRICE_CHANGED,
        })
      );
      expect(mockEventProducer.publish).toHaveBeenCalledWith(
        'notification.price.changed',
        expect.any(Object)
      );
      expect(result).toEqual(mockNotification);
    });
  });

  describe('sendProductOutOfStockNotification', () => {
    it('should send notification when product is out of stock', async () => {
      const outOfStockData = {
        productId: 'product-123',
        productTitle: 'Luna Kitchen - White',
        lastStockDate: new Date('2026-02-10T15:00:00Z'),
      };

      const mockNotification = {
        id: 'notification-101',
        type: NotificationType.PRODUCT_OUT_OF_STOCK,
        channel: NotificationChannel.EMAIL,
        priority: NotificationPriority.HIGH,
        recipientEmail: 'inventory@lomashwood.com',
        subject: 'Product Out of Stock',
        message: `Product "${outOfStockData.productTitle}" is now out of stock`,
        metadata: {
          productId: outOfStockData.productId,
          lastStockDate: outOfStockData.lastStockDate,
        },
        status: NotificationStatus.PENDING,
        sentAt: null,
        createdAt: new Date('2026-02-12T10:00:00Z'),
        updatedAt: new Date('2026-02-12T10:00:00Z'),
      };

      mockRepository.create = jest.fn().mockResolvedValue(mockNotification);
      mockEventProducer.publish = jest.fn().mockResolvedValue(true);

      const result = await service.sendProductOutOfStockNotification(outOfStockData);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: NotificationType.PRODUCT_OUT_OF_STOCK,
          priority: NotificationPriority.HIGH,
        })
      );
      expect(result).toEqual(mockNotification);
    });
  });

  describe('getNotificationById', () => {
    it('should return notification by ID', async () => {
      const notificationId = 'notification-123';
      const mockNotification = {
        id: notificationId,
        type: NotificationType.PRODUCT_CREATED,
        channel: NotificationChannel.EMAIL,
        priority: NotificationPriority.MEDIUM,
        recipientId: 'user-123',
        recipientEmail: 'user@example.com',
        subject: 'Test Notification',
        message: 'Test message',
        status: NotificationStatus.SENT,
        sentAt: new Date('2026-02-12T10:05:00Z'),
        createdAt: new Date('2026-02-12T10:00:00Z'),
        updatedAt: new Date('2026-02-12T10:05:00Z'),
      };

      mockRepository.findById = jest.fn().mockResolvedValue(mockNotification);

      const result = await service.getNotificationById(notificationId);

      expect(mockRepository.findById).toHaveBeenCalledWith(notificationId);
      expect(result).toEqual(mockNotification);
    });

    it('should throw error when notification not found', async () => {
      const notificationId = 'non-existent-notification';
      mockRepository.findById = jest.fn().mockResolvedValue(null);

      await expect(service.getNotificationById(notificationId)).rejects.toThrow(
        AppError
      );
      await expect(service.getNotificationById(notificationId)).rejects.toThrow(
        'Notification not found'
      );
    });
  });

  describe('getNotificationsByRecipient', () => {
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
          createdAt: new Date('2026-02-12T09:00:00Z'),
          updatedAt: new Date('2026-02-12T10:00:00Z'),
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
          createdAt: new Date('2026-02-12T11:00:00Z'),
          updatedAt: new Date('2026-02-12T11:00:00Z'),
        },
      ];

      mockRepository.findByRecipient = jest.fn().mockResolvedValue(mockNotifications);

      const result = await service.getNotificationsByRecipient(recipientId);

      expect(mockRepository.findByRecipient).toHaveBeenCalledWith(recipientId);
      expect(result).toEqual(mockNotifications);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no notifications found', async () => {
      const recipientId = 'user-with-no-notifications';
      mockRepository.findByRecipient = jest.fn().mockResolvedValue([]);

      const result = await service.getNotificationsByRecipient(recipientId);

      expect(result).toEqual([]);
    });
  });

  describe('getAllNotifications', () => {
    it('should return paginated notifications', async () => {
      const paginationParams = {
        page: 1,
        limit: 10,
      };

      const mockPaginatedResult = {
        data: [
          {
            id: 'notification-1',
            type: NotificationType.PRODUCT_CREATED,
            channel: NotificationChannel.EMAIL,
            priority: NotificationPriority.MEDIUM,
            status: NotificationStatus.SENT,
            createdAt: new Date('2026-02-12T10:00:00Z'),
            updatedAt: new Date('2026-02-12T10:00:00Z'),
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      mockRepository.findAll = jest.fn().mockResolvedValue(mockPaginatedResult);

      const result = await service.getAllNotifications(paginationParams);

      expect(mockRepository.findAll).toHaveBeenCalledWith(paginationParams);
      expect(result).toEqual(mockPaginatedResult);
    });

    it('should filter notifications by status', async () => {
      const paginationParams = {
        page: 1,
        limit: 10,
        status: NotificationStatus.PENDING,
      };

      const mockPaginatedResult = {
        data: [
          {
            id: 'notification-1',
            type: NotificationType.INVENTORY_LOW_STOCK,
            channel: NotificationChannel.EMAIL,
            priority: NotificationPriority.HIGH,
            status: NotificationStatus.PENDING,
            createdAt: new Date('2026-02-12T10:00:00Z'),
            updatedAt: new Date('2026-02-12T10:00:00Z'),
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      mockRepository.findAll = jest.fn().mockResolvedValue(mockPaginatedResult);

      const result = await service.getAllNotifications(paginationParams);

      expect(mockRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          status: NotificationStatus.PENDING,
        })
      );
      expect(result.data[0].status).toBe(NotificationStatus.PENDING);
    });
  });

  describe('updateNotificationStatus', () => {
    it('should update notification status to SENT', async () => {
      const notificationId = 'notification-123';
      const updateDto = {
        status: NotificationStatus.SENT,
        sentAt: new Date('2026-02-12T10:05:00Z'),
      };

      const mockUpdatedNotification = {
        id: notificationId,
        type: NotificationType.PRODUCT_CREATED,
        channel: NotificationChannel.EMAIL,
        priority: NotificationPriority.MEDIUM,
        recipientId: 'user-123',
        recipientEmail: 'user@example.com',
        subject: 'Test',
        message: 'Test message',
        status: NotificationStatus.SENT,
        sentAt: updateDto.sentAt,
        createdAt: new Date('2026-02-12T10:00:00Z'),
        updatedAt: new Date('2026-02-12T10:05:00Z'),
      };

      mockRepository.findById = jest.fn().mockResolvedValue({
        ...mockUpdatedNotification,
        status: NotificationStatus.PENDING,
        sentAt: null,
      });
      mockRepository.update = jest.fn().mockResolvedValue(mockUpdatedNotification);

      const result = await service.updateNotificationStatus(notificationId, updateDto);

      expect(mockRepository.update).toHaveBeenCalledWith(notificationId, updateDto);
      expect(result.status).toBe(NotificationStatus.SENT);
      expect(result.sentAt).toEqual(updateDto.sentAt);
    });

    it('should update notification status to FAILED', async () => {
      const notificationId = 'notification-123';
      const updateDto = {
        status: NotificationStatus.FAILED,
        errorMessage: 'SMTP connection failed',
      };

      const mockUpdatedNotification = {
        id: notificationId,
        type: NotificationType.PRODUCT_CREATED,
        channel: NotificationChannel.EMAIL,
        priority: NotificationPriority.MEDIUM,
        status: NotificationStatus.FAILED,
        errorMessage: updateDto.errorMessage,
        createdAt: new Date('2026-02-12T10:00:00Z'),
        updatedAt: new Date('2026-02-12T10:05:00Z'),
      };

      mockRepository.findById = jest.fn().mockResolvedValue({
        ...mockUpdatedNotification,
        status: NotificationStatus.PENDING,
      });
      mockRepository.update = jest.fn().mockResolvedValue(mockUpdatedNotification);

      const result = await service.updateNotificationStatus(notificationId, updateDto);

      expect(result.status).toBe(NotificationStatus.FAILED);
      expect(result.errorMessage).toBe(updateDto.errorMessage);
    });

    it('should throw error when notification not found', async () => {
      const notificationId = 'non-existent-notification';
      const updateDto = {
        status: NotificationStatus.SENT,
      };

      mockRepository.findById = jest.fn().mockResolvedValue(null);

      await expect(
        service.updateNotificationStatus(notificationId, updateDto)
      ).rejects.toThrow(AppError);
    });
  });

  describe('retryFailedNotification', () => {
    it('should retry failed notification', async () => {
      const notificationId = 'notification-123';
      const mockFailedNotification = {
        id: notificationId,
        type: NotificationType.PRODUCT_CREATED,
        channel: NotificationChannel.EMAIL,
        priority: NotificationPriority.MEDIUM,
        recipientEmail: 'user@example.com',
        subject: 'Test',
        message: 'Test message',
        status: NotificationStatus.FAILED,
        retryCount: 1,
        createdAt: new Date('2026-02-12T10:00:00Z'),
        updatedAt: new Date('2026-02-12T10:05:00Z'),
      };

      const mockRetriedNotification = {
        ...mockFailedNotification,
        status: NotificationStatus.PENDING,
        retryCount: 2,
        updatedAt: new Date('2026-02-12T10:10:00Z'),
      };

      mockRepository.findById = jest.fn().mockResolvedValue(mockFailedNotification);
      mockRepository.update = jest.fn().mockResolvedValue(mockRetriedNotification);
      mockEventProducer.publish = jest.fn().mockResolvedValue(true);

      const result = await service.retryFailedNotification(notificationId);

      expect(mockRepository.update).toHaveBeenCalledWith(
        notificationId,
        expect.objectContaining({
          status: NotificationStatus.PENDING,
          retryCount: 2,
        })
      );
      expect(mockEventProducer.publish).toHaveBeenCalled();
      expect(result.retryCount).toBe(2);
    });

    it('should throw error when notification is not in failed state', async () => {
      const notificationId = 'notification-123';
      const mockNotification = {
        id: notificationId,
        status: NotificationStatus.SENT,
      };

      mockRepository.findById = jest.fn().mockResolvedValue(mockNotification);

      await expect(service.retryFailedNotification(notificationId)).rejects.toThrow(
        'Only failed notifications can be retried'
      );
    });

    it('should throw error when max retry count exceeded', async () => {
      const notificationId = 'notification-123';
      const mockNotification = {
        id: notificationId,
        status: NotificationStatus.FAILED,
        retryCount: 5,
      };

      mockRepository.findById = jest.fn().mockResolvedValue(mockNotification);

      await expect(service.retryFailedNotification(notificationId)).rejects.toThrow(
        'Maximum retry count exceeded'
      );
    });
  });

  describe('deleteNotification', () => {
    it('should soft delete notification', async () => {
      const notificationId = 'notification-123';
      const mockDeletedNotification = {
        id: notificationId,
        type: NotificationType.PRODUCT_CREATED,
        status: NotificationStatus.SENT,
        deletedAt: new Date('2026-02-12T12:00:00Z'),
        createdAt: new Date('2026-02-12T10:00:00Z'),
        updatedAt: new Date('2026-02-12T12:00:00Z'),
      };

      mockRepository.findById = jest.fn().mockResolvedValue({
        ...mockDeletedNotification,
        deletedAt: null,
      });
      mockRepository.delete = jest.fn().mockResolvedValue(mockDeletedNotification);

      const result = await service.deleteNotification(notificationId);

      expect(mockRepository.delete).toHaveBeenCalledWith(notificationId);
      expect(result.deletedAt).toBeTruthy();
    });

    it('should throw error when notification not found', async () => {
      const notificationId = 'non-existent-notification';
      mockRepository.findById = jest.fn().mockResolvedValue(null);

      await expect(service.deleteNotification(notificationId)).rejects.toThrow(
        AppError
      );
    });
  });

  describe('getNotificationStatistics', () => {
    it('should return notification statistics', async () => {
      const mockStats = {
        total: 100,
        sent: 85,
        pending: 10,
        failed: 5,
        byType: {
          [NotificationType.PRODUCT_CREATED]: 40,
          [NotificationType.INVENTORY_LOW_STOCK]: 30,
          [NotificationType.PRICE_CHANGED]: 20,
          [NotificationType.PRODUCT_OUT_OF_STOCK]: 10,
        },
        byChannel: {
          [NotificationChannel.EMAIL]: 80,
          [NotificationChannel.SMS]: 15,
          [NotificationChannel.PUSH]: 5,
        },
      };

      mockRepository.getStatistics = jest.fn().mockResolvedValue(mockStats);

      const result = await service.getNotificationStatistics();

      expect(mockRepository.getStatistics).toHaveBeenCalled();
      expect(result).toEqual(mockStats);
      expect(result.total).toBe(100);
      expect(result.sent).toBe(85);
    });
  });
});