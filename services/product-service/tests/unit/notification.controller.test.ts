import { Request, Response, NextFunction } from 'express';
import { NotificationController } from '../../src/app/notifications/notification.controller';
import { NotificationService } from '../../src/app/notifications/notification.service';
import {
  CreateNotificationDto,
  UpdateNotificationDto,
  NotificationType,
  NotificationChannel,
  NotificationPriority,
  NotificationStatus,
} from '../../src/app/notifications/notification.types';
import { AppError } from '../../src/shared/errors';

jest.mock('../../src/app/notifications/notification.service');

describe('NotificationController', () => {
  let controller: NotificationController;
  let mockNotificationService: jest.Mocked<NotificationService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockNotificationService = new NotificationService(
      null as any,
      null as any
    ) as jest.Mocked<NotificationService>;
    controller = new NotificationController(mockNotificationService);

    mockRequest = {
      body: {},
      params: {},
      query: {},
      headers: {},
      user: {
        id: 'user-123',
        email: 'admin@lomashwood.com',
        role: 'ADMIN',
      },
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendProductCreatedNotification', () => {
    it('should send product created notification successfully', async () => {
      const productData = {
        id: 'product-123',
        title: 'Luna Kitchen',
        category: 'KITCHEN',
        createdBy: 'user-123',
        createdByEmail: 'admin@lomashwood.com',
      };

      const mockNotification = {
        id: 'notification-123',
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
        status: NotificationStatus.PENDING,
        sentAt: null,
        createdAt: new Date('2026-02-12T10:00:00Z'),
        updatedAt: new Date('2026-02-12T10:00:00Z'),
      };

      mockRequest.body = productData;
      mockNotificationService.sendProductCreatedNotification = jest
        .fn()
        .mockResolvedValue(mockNotification);

      await controller.sendProductCreatedNotification(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNotificationService.sendProductCreatedNotification).toHaveBeenCalledWith(
        productData
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockNotification,
        message: 'Product notification sent successfully',
      });
    });

    it('should handle errors when sending notification fails', async () => {
      const productData = {
        id: 'product-123',
        title: 'Luna Kitchen',
        category: 'KITCHEN',
        createdBy: 'user-123',
        createdByEmail: 'admin@lomashwood.com',
      };

      mockRequest.body = productData;
      const error = new Error('Email service unavailable');
      mockNotificationService.sendProductCreatedNotification = jest
        .fn()
        .mockRejectedValue(error);

      await controller.sendProductCreatedNotification(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should validate required fields', async () => {
      const invalidData = {
        id: 'product-123',
        title: '',
      };

      mockRequest.body = invalidData;
      const validationError = new AppError('Validation failed', 400);
      mockNotificationService.sendProductCreatedNotification = jest
        .fn()
        .mockRejectedValue(validationError);

      await controller.sendProductCreatedNotification(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });
  });

  describe('sendInventoryLowStockAlert', () => {
    it('should send low stock alert successfully', async () => {
      const inventoryData = {
        productId: 'product-123',
        productTitle: 'Luna Kitchen - White',
        currentStock: 5,
        threshold: 10,
        locationId: 'warehouse-1',
      };

      const mockNotification = {
        id: 'notification-456',
        type: NotificationType.INVENTORY_LOW_STOCK,
        channel: NotificationChannel.EMAIL,
        priority: NotificationPriority.HIGH,
        recipientEmail: 'inventory@lomashwood.com',
        subject: 'Low Stock Alert',
        message: `Product "${inventoryData.productTitle}" is running low on stock`,
        metadata: {
          productId: inventoryData.productId,
          currentStock: inventoryData.currentStock,
          threshold: inventoryData.threshold,
        },
        status: NotificationStatus.PENDING,
        createdAt: new Date('2026-02-12T10:00:00Z'),
        updatedAt: new Date('2026-02-12T10:00:00Z'),
      };

      mockRequest.body = inventoryData;
      mockNotificationService.sendInventoryLowStockAlert = jest
        .fn()
        .mockResolvedValue(mockNotification);

      await controller.sendInventoryLowStockAlert(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNotificationService.sendInventoryLowStockAlert).toHaveBeenCalledWith(
        inventoryData
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockNotification,
        message: 'Low stock alert sent successfully',
      });
    });

    it('should send critical alert when stock is extremely low', async () => {
      const inventoryData = {
        productId: 'product-123',
        productTitle: 'Luna Kitchen - White',
        currentStock: 1,
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

      mockRequest.body = inventoryData;
      mockNotificationService.sendInventoryLowStockAlert = jest
        .fn()
        .mockResolvedValue(mockNotification);

      await controller.sendInventoryLowStockAlert(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });
  });

  describe('sendPriceChangeNotification', () => {
    it('should send price change notification successfully', async () => {
      const priceChangeData = {
        productId: 'product-123',
        productTitle: 'Luna Kitchen - White',
        oldPrice: 25000,
        newPrice: 22000,
        discountPercentage: 12,
        changedBy: 'admin-123',
        changedByEmail: 'admin@lomashwood.com',
      };

      const mockNotification = {
        id: 'notification-789',
        type: NotificationType.PRICE_CHANGED,
        channel: NotificationChannel.EMAIL,
        priority: NotificationPriority.MEDIUM,
        recipientId: priceChangeData.changedBy,
        recipientEmail: priceChangeData.changedByEmail,
        subject: 'Product Price Updated',
        message: `Price for "${priceChangeData.productTitle}" changed`,
        metadata: {
          productId: priceChangeData.productId,
          oldPrice: priceChangeData.oldPrice,
          newPrice: priceChangeData.newPrice,
        },
        status: NotificationStatus.PENDING,
        createdAt: new Date('2026-02-12T10:00:00Z'),
        updatedAt: new Date('2026-02-12T10:00:00Z'),
      };

      mockRequest.body = priceChangeData;
      mockNotificationService.sendPriceChangeNotification = jest
        .fn()
        .mockResolvedValue(mockNotification);

      await controller.sendPriceChangeNotification(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNotificationService.sendPriceChangeNotification).toHaveBeenCalledWith(
        priceChangeData
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockNotification,
        message: 'Price change notification sent successfully',
      });
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

      mockRequest.params = { id: notificationId };
      mockNotificationService.getNotificationById = jest
        .fn()
        .mockResolvedValue(mockNotification);

      await controller.getNotificationById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNotificationService.getNotificationById).toHaveBeenCalledWith(
        notificationId
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockNotification,
      });
    });

    it('should return 404 when notification not found', async () => {
      const notificationId = 'non-existent-notification';
      mockRequest.params = { id: notificationId };

      const notFoundError = new AppError('Notification not found', 404);
      mockNotificationService.getNotificationById = jest
        .fn()
        .mockRejectedValue(notFoundError);

      await controller.getNotificationById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(notFoundError);
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
          createdAt: new Date('2026-02-12T10:00:00Z'),
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
          createdAt: new Date('2026-02-12T11:00:00Z'),
          updatedAt: new Date('2026-02-12T11:00:00Z'),
        },
      ];

      mockRequest.params = { recipientId };
      mockNotificationService.getNotificationsByRecipient = jest
        .fn()
        .mockResolvedValue(mockNotifications);

      await controller.getNotificationsByRecipient(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNotificationService.getNotificationsByRecipient).toHaveBeenCalledWith(
        recipientId
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockNotifications,
        count: 2,
      });
    });

    it('should return empty array when no notifications found', async () => {
      const recipientId = 'user-with-no-notifications';
      mockRequest.params = { recipientId };

      mockNotificationService.getNotificationsByRecipient = jest
        .fn()
        .mockResolvedValue([]);

      await controller.getNotificationsByRecipient(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: [],
        count: 0,
      });
    });
  });

  describe('getAllNotifications', () => {
    it('should return paginated notifications with default parameters', async () => {
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

      mockRequest.query = {};
      mockNotificationService.getAllNotifications = jest
        .fn()
        .mockResolvedValue(mockPaginatedResult);

      await controller.getAllNotifications(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNotificationService.getAllNotifications).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        ...mockPaginatedResult,
      });
    });

    it('should filter notifications by status', async () => {
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

      mockRequest.query = { status: 'PENDING', page: '1', limit: '10' };
      mockNotificationService.getAllNotifications = jest
        .fn()
        .mockResolvedValue(mockPaginatedResult);

      await controller.getAllNotifications(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNotificationService.getAllNotifications).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        status: 'PENDING',
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should filter notifications by type', async () => {
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

      mockRequest.query = { type: 'PRODUCT_CREATED', page: '1', limit: '10' };
      mockNotificationService.getAllNotifications = jest
        .fn()
        .mockResolvedValue(mockPaginatedResult);

      await controller.getAllNotifications(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNotificationService.getAllNotifications).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        type: 'PRODUCT_CREATED',
      });
    });

    it('should filter notifications by priority', async () => {
      const mockPaginatedResult = {
        data: [
          {
            id: 'notification-1',
            type: NotificationType.INVENTORY_LOW_STOCK,
            channel: NotificationChannel.EMAIL,
            priority: NotificationPriority.CRITICAL,
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

      mockRequest.query = { priority: 'CRITICAL', page: '1', limit: '10' };
      mockNotificationService.getAllNotifications = jest
        .fn()
        .mockResolvedValue(mockPaginatedResult);

      await controller.getAllNotifications(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNotificationService.getAllNotifications).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        priority: 'CRITICAL',
      });
    });

    it('should handle custom pagination parameters', async () => {
      const mockPaginatedResult = {
        data: [],
        total: 50,
        page: 2,
        limit: 20,
        totalPages: 3,
      };

      mockRequest.query = { page: '2', limit: '20' };
      mockNotificationService.getAllNotifications = jest
        .fn()
        .mockResolvedValue(mockPaginatedResult);

      await controller.getAllNotifications(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNotificationService.getAllNotifications).toHaveBeenCalledWith({
        page: 2,
        limit: 20,
      });
    });
  });

  describe('updateNotificationStatus', () => {
    it('should update notification status successfully', async () => {
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
        createdAt: new Date('2026-02-12T10:00:00Z'),
        updatedAt: new Date('2026-02-12T10:05:00Z'),
      };

      mockRequest.params = { id: notificationId };
      mockRequest.body = updateDto;
      mockNotificationService.updateNotificationStatus = jest
        .fn()
        .mockResolvedValue(mockUpdatedNotification);

      await controller.updateNotificationStatus(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNotificationService.updateNotificationStatus).toHaveBeenCalledWith(
        notificationId,
        updateDto
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedNotification,
        message: 'Notification status updated successfully',
      });
    });

    it('should update notification status to FAILED with error message', async () => {
      const notificationId = 'notification-123';
      const updateDto: UpdateNotificationDto = {
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

      mockRequest.params = { id: notificationId };
      mockRequest.body = updateDto;
      mockNotificationService.updateNotificationStatus = jest
        .fn()
        .mockResolvedValue(mockUpdatedNotification);

      await controller.updateNotificationStatus(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should handle invalid notification ID', async () => {
      const notificationId = 'invalid-notification';
      const updateDto: UpdateNotificationDto = {
        status: NotificationStatus.SENT,
      };

      mockRequest.params = { id: notificationId };
      mockRequest.body = updateDto;

      const notFoundError = new AppError('Notification not found', 404);
      mockNotificationService.updateNotificationStatus = jest
        .fn()
        .mockRejectedValue(notFoundError);

      await controller.updateNotificationStatus(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(notFoundError);
    });
  });

  describe('retryFailedNotification', () => {
    it('should retry failed notification successfully', async () => {
      const notificationId = 'notification-123';
      const mockRetriedNotification = {
        id: notificationId,
        type: NotificationType.PRODUCT_CREATED,
        channel: NotificationChannel.EMAIL,
        priority: NotificationPriority.MEDIUM,
        status: NotificationStatus.PENDING,
        retryCount: 2,
        createdAt: new Date('2026-02-12T10:00:00Z'),
        updatedAt: new Date('2026-02-12T10:10:00Z'),
      };

      mockRequest.params = { id: notificationId };
      mockNotificationService.retryFailedNotification = jest
        .fn()
        .mockResolvedValue(mockRetriedNotification);

      await controller.retryFailedNotification(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNotificationService.retryFailedNotification).toHaveBeenCalledWith(
        notificationId
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockRetriedNotification,
        message: 'Notification retry initiated successfully',
      });
    });

    it('should handle retry of non-failed notification', async () => {
      const notificationId = 'notification-123';
      mockRequest.params = { id: notificationId };

      const invalidStateError = new AppError(
        'Only failed notifications can be retried',
        400
      );
      mockNotificationService.retryFailedNotification = jest
        .fn()
        .mockRejectedValue(invalidStateError);

      await controller.retryFailedNotification(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(invalidStateError);
    });

    it('should handle max retry count exceeded', async () => {
      const notificationId = 'notification-123';
      mockRequest.params = { id: notificationId };

      const maxRetryError = new AppError('Maximum retry count exceeded', 400);
      mockNotificationService.retryFailedNotification = jest
        .fn()
        .mockRejectedValue(maxRetryError);

      await controller.retryFailedNotification(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(maxRetryError);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read successfully', async () => {
      const notificationId = 'notification-123';
      const mockUpdatedNotification = {
        id: notificationId,
        type: NotificationType.PRODUCT_CREATED,
        channel: NotificationChannel.EMAIL,
        priority: NotificationPriority.MEDIUM,
        status: NotificationStatus.SENT,
        readAt: new Date('2026-02-12T10:10:00Z'),
        createdAt: new Date('2026-02-12T10:00:00Z'),
        updatedAt: new Date('2026-02-12T10:10:00Z'),
      };

      mockRequest.params = { id: notificationId };
      mockNotificationService.updateNotificationStatus = jest
        .fn()
        .mockResolvedValue(mockUpdatedNotification);

      await controller.markAsRead(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNotificationService.updateNotificationStatus).toHaveBeenCalledWith(
        notificationId,
        expect.objectContaining({
          readAt: expect.any(Date),
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedNotification,
        message: 'Notification marked as read',
      });
    });

    it('should handle marking non-existent notification as read', async () => {
      const notificationId = 'non-existent-notification';
      mockRequest.params = { id: notificationId };

      const notFoundError = new AppError('Notification not found', 404);
      mockNotificationService.updateNotificationStatus = jest
        .fn()
        .mockRejectedValue(notFoundError);

      await controller.markAsRead(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(notFoundError);
    });
  });

  describe('getUnreadNotifications', () => {
    it('should return unread notifications for a recipient', async () => {
      const recipientId = 'user-123';
      const mockUnreadNotifications = [
        {
          id: 'notification-1',
          type: NotificationType.PRODUCT_CREATED,
          channel: NotificationChannel.EMAIL,
          priority: NotificationPriority.MEDIUM,
          recipientId,
          status: NotificationStatus.SENT,
          readAt: null,
          createdAt: new Date('2026-02-12T10:00:00Z'),
          updatedAt: new Date('2026-02-12T10:00:00Z'),
        },
        {
          id: 'notification-2',
          type: NotificationType.PRICE_CHANGED,
          channel: NotificationChannel.EMAIL,
          priority: NotificationPriority.LOW,
          recipientId,
          status: NotificationStatus.SENT,
          readAt: null,
          createdAt: new Date('2026-02-12T11:00:00Z'),
          updatedAt: new Date('2026-02-12T11:00:00Z'),
        },
      ];

      mockRequest.params = { recipientId };
      mockNotificationService.getUnreadNotifications = jest
        .fn()
        .mockResolvedValue(mockUnreadNotifications);

      await controller.getUnreadNotifications(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNotificationService.getUnreadNotifications).toHaveBeenCalledWith(
        recipientId
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockUnreadNotifications,
        count: 2,
      });
    });

    it('should return empty array when all notifications are read', async () => {
      const recipientId = 'user-123';
      mockRequest.params = { recipientId };

      mockNotificationService.getUnreadNotifications = jest
        .fn()
        .mockResolvedValue([]);

      await controller.getUnreadNotifications(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: [],
        count: 0,
      });
    });
  });

  describe('deleteNotification', () => {
    it('should soft delete notification successfully', async () => {
      const notificationId = 'notification-123';
      const mockDeletedNotification = {
        id: notificationId,
        type: NotificationType.PRODUCT_CREATED,
        status: NotificationStatus.SENT,
        deletedAt: new Date('2026-02-12T12:00:00Z'),
        createdAt: new Date('2026-02-12T10:00:00Z'),
        updatedAt: new Date('2026-02-12T12:00:00Z'),
      };

      mockRequest.params = { id: notificationId };
      mockNotificationService.deleteNotification = jest
        .fn()
        .mockResolvedValue(mockDeletedNotification);

      await controller.deleteNotification(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNotificationService.deleteNotification).toHaveBeenCalledWith(
        notificationId
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Notification deleted successfully',
      });
    });

    it('should handle deletion of non-existent notification', async () => {
      const notificationId = 'non-existent-notification';
      mockRequest.params = { id: notificationId };

      const notFoundError = new AppError('Notification not found', 404);
      mockNotificationService.deleteNotification = jest
        .fn()
        .mockRejectedValue(notFoundError);

      await controller.deleteNotification(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(notFoundError);
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
        byPriority: {
          [NotificationPriority.LOW]: 20,
          [NotificationPriority.MEDIUM]: 50,
          [NotificationPriority.HIGH]: 25,
          [NotificationPriority.CRITICAL]: 5,
        },
      };

      mockNotificationService.getNotificationStatistics = jest
        .fn()
        .mockResolvedValue(mockStats);

      await controller.getNotificationStatistics(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNotificationService.getNotificationStatistics).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockStats,
      });
    });

    it('should handle errors when retrieving statistics', async () => {
      const error = new Error('Database error');
      mockNotificationService.getNotificationStatistics = jest
        .fn()
        .mockRejectedValue(error);

      await controller.getNotificationStatistics(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('createNotification', () => {
    it('should create custom notification successfully', async () => {
      const createDto: CreateNotificationDto = {
        type: NotificationType.PRODUCT_CREATED,
        channel: NotificationChannel.EMAIL,
        priority: NotificationPriority.MEDIUM,
        recipientEmail: 'user@example.com',
        subject: 'Custom Notification',
        message: 'This is a custom notification',
        metadata: {
          customField: 'customValue',
        },
      };

      const mockNotification = {
        id: 'notification-999',
        ...createDto,
        status: NotificationStatus.PENDING,
        sentAt: null,
        createdAt: new Date('2026-02-12T10:00:00Z'),
        updatedAt: new Date('2026-02-12T10:00:00Z'),
      };

      mockRequest.body = createDto;
      mockNotificationService.createNotification = jest
        .fn()
        .mockResolvedValue(mockNotification);

      await controller.createNotification(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
        createDto
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockNotification,
        message: 'Notification created successfully',
      });
    });

    it('should validate notification data', async () => {
      const invalidDto = {
        type: 'INVALID_TYPE',
        channel: 'INVALID_CHANNEL',
      };

      mockRequest.body = invalidDto;
      const validationError = new AppError('Invalid notification data', 400);
      mockNotificationService.createNotification = jest
        .fn()
        .mockRejectedValue(validationError);

      await controller.createNotification(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });
  });
});