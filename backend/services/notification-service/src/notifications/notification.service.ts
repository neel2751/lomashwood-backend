import { v4 as uuidv4 } from 'uuid';
import { ApiResponse, PaginatedResponse } from '../../../../../packages/api-client/src/types/api.types';

interface Notification {
  id: string;
  userId: string;
  type: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
  title: string;
  message: string;
  data?: any;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'READ';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  scheduledAt?: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  retryCount: number;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

interface EmailLog {
  id: string;
  notificationId: string;
  to: string;
  subject: string;
  template?: string;
  templateData?: any;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'BOUNCE' | 'COMPLAINT' | 'FAILED';
  provider: string;
  providerMessageId?: string;
  errorMessage?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface SmsLog {
  id: string;
  notificationId: string;
  to: string;
  message: string;
  template?: string;
  templateData?: any;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'UNDELIVERED';
  provider: string;
  providerMessageId?: string;
  errorMessage?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface PushLog {
  id: string;
  notificationId: string;
  deviceTokens: string[];
  title: string;
  message: string;
  data?: any;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED';
  provider: string;
  successCount: number;
  failureCount: number;
  errorMessage?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface NotificationTemplate {
  id: string;
  name: string;
  type: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
  subject?: string;
  content: string;
  variables: string[];
  isActive: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface GetNotificationsParams {
  page: number;
  limit: number;
  filters: {
    userId?: string;
    type?: string;
    status?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };
}

interface GetLogsParams {
  page: number;
  limit: number;
  filters: {
    status?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };
}

interface GetTemplatesParams {
  page: number;
  limit: number;
  filters: {
    type?: string;
    active?: boolean;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };
}

export class NotificationService {
  private notifications: Notification[] = [];
  private emailLogs: EmailLog[] = [];
  private smsLogs: SmsLog[] = [];
  private pushLogs: PushLog[] = [];
  private templates: NotificationTemplate[] = [];

  constructor() {
    this.initializeMockData();
  }

  async getNotifications(params: GetNotificationsParams): Promise<PaginatedResponse<Notification[]>> {
    try {
      let filteredNotifications = [...this.notifications];

      // Apply filters
      if (params.filters.userId) {
        filteredNotifications = filteredNotifications.filter(n => n.userId === params.filters.userId);
      }

      if (params.filters.type) {
        filteredNotifications = filteredNotifications.filter(n => n.type === params.filters.type);
      }

      if (params.filters.status) {
        filteredNotifications = filteredNotifications.filter(n => n.status === params.filters.status);
      }

      if (params.filters.search) {
        const searchTerm = params.filters.search.toLowerCase();
        filteredNotifications = filteredNotifications.filter(n =>
          n.title.toLowerCase().includes(searchTerm) ||
          n.message.toLowerCase().includes(searchTerm)
        );
      }

      // Sort notifications
      const sortBy = params.filters.sortBy || 'createdAt';
      const sortOrder = params.filters.sortOrder || 'desc';
      
      filteredNotifications.sort((a, b) => {
        let aValue: any = a[sortBy as keyof Notification];
        let bValue: any = b[sortBy as keyof Notification];
        
        if (aValue instanceof Date) {
          aValue = aValue.getTime();
          bValue = (bValue as Date).getTime();
        }
        
        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        } else {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
        }
      });

      // Pagination
      const total = filteredNotifications.length;
      const totalPages = Math.ceil(total / params.limit);
      const startIndex = (params.page - 1) * params.limit;
      const endIndex = startIndex + params.limit;
      const paginatedNotifications = filteredNotifications.slice(startIndex, endIndex);

      return {
        success: true,
        data: paginatedNotifications,
        pagination: {
          page: params.page,
          limit: params.limit,
          total,
          totalPages,
          hasNext: params.page < totalPages,
          hasPrev: params.page > 1,
        },
      };
    } catch (error) {
      console.error('Get notifications error:', error);
      return {
        success: false,
        message: 'Failed to fetch notifications',
        error: 'GET_NOTIFICATIONS_FAILED',
      };
    }
  }

  async getNotification(id: string): Promise<ApiResponse<Notification>> {
    try {
      const notification = this.notifications.find(n => n.id === id);
      
      if (!notification) {
        return {
          success: false,
          message: 'Notification not found',
          error: 'NOTIFICATION_NOT_FOUND',
        };
      }

      return {
        success: true,
        data: notification,
      };
    } catch (error) {
      console.error('Get notification error:', error);
      return {
        success: false,
        message: 'Failed to fetch notification',
        error: 'GET_NOTIFICATION_FAILED',
      };
    }
  }

  async createNotification(notificationData: Omit<Notification, 'id' | 'createdAt' | 'updatedAt' | 'retryCount'>): Promise<ApiResponse<Notification>> {
    try {
      const notification: Notification = {
        id: uuidv4(),
        ...notificationData,
        retryCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.notifications.push(notification);

      // Process the notification based on type
      await this.processNotification(notification);

      return {
        success: true,
        data: notification,
      };
    } catch (error) {
      console.error('Create notification error:', error);
      return {
        success: false,
        message: 'Failed to create notification',
        error: 'CREATE_NOTIFICATION_FAILED',
      };
    }
  }

  async markAsRead(id: string): Promise<ApiResponse<Notification>> {
    try {
      const notificationIndex = this.notifications.findIndex(n => n.id === id);
      
      if (notificationIndex === -1) {
        return {
          success: false,
          message: 'Notification not found',
          error: 'NOTIFICATION_NOT_FOUND',
        };
      }

      const updatedNotification: Notification = {
        ...this.notifications[notificationIndex],
        status: 'READ',
        readAt: new Date(),
        updatedAt: new Date(),
      };

      this.notifications[notificationIndex] = updatedNotification;

      return {
        success: true,
        data: updatedNotification,
      };
    } catch (error) {
      console.error('Mark notification as read error:', error);
      return {
        success: false,
        message: 'Failed to mark notification as read',
        error: 'MARK_AS_READ_FAILED',
      };
    }
  }

  async markAllAsRead(userId: string): Promise<ApiResponse<void>> {
    try {
      const userNotifications = this.notifications.filter(n => n.userId === userId && n.status !== 'READ');
      
      userNotifications.forEach(notification => {
        const index = this.notifications.findIndex(n => n.id === notification.id);
        if (index !== -1) {
          this.notifications[index] = {
            ...this.notifications[index],
            status: 'READ',
            readAt: new Date(),
            updatedAt: new Date(),
          };
        }
      });

      return {
        success: true,
        message: 'All notifications marked as read',
      };
    } catch (error) {
      console.error('Mark all notifications as read error:', error);
      return {
        success: false,
        message: 'Failed to mark all notifications as read',
        error: 'MARK_ALL_AS_READ_FAILED',
      };
    }
  }

  async sendEmail(emailData: any): Promise<ApiResponse<EmailLog>> {
    try {
      const emailLog: EmailLog = {
        id: uuidv4(),
        notificationId: emailData.notificationId || uuidv4(),
        to: emailData.to,
        subject: emailData.subject,
        template: emailData.template,
        templateData: emailData.templateData,
        status: 'PENDING',
        provider: 'nodemailer',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.emailLogs.push(emailLog);

      // Simulate sending email
      setTimeout(() => {
        const index = this.emailLogs.findIndex(log => log.id === emailLog.id);
        if (index !== -1) {
          this.emailLogs[index] = {
            ...this.emailLogs[index],
            status: 'SENT',
            providerMessageId: `msg_${Date.now()}`,
            sentAt: new Date(),
            updatedAt: new Date(),
          };
        }
      }, 1000);

      return {
        success: true,
        data: emailLog,
      };
    } catch (error) {
      console.error('Send email error:', error);
      return {
        success: false,
        message: 'Failed to send email',
        error: 'SEND_EMAIL_FAILED',
      };
    }
  }

  async sendSms(smsData: any): Promise<ApiResponse<SmsLog>> {
    try {
      const smsLog: SmsLog = {
        id: uuidv4(),
        notificationId: smsData.notificationId || uuidv4(),
        to: smsData.to,
        message: smsData.message,
        template: smsData.template,
        templateData: smsData.templateData,
        status: 'PENDING',
        provider: 'twilio',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.smsLogs.push(smsLog);

      // Simulate sending SMS
      setTimeout(() => {
        const index = this.smsLogs.findIndex(log => log.id === smsLog.id);
        if (index !== -1) {
          this.smsLogs[index] = {
            ...this.smsLogs[index],
            status: 'SENT',
            providerMessageId: `sms_${Date.now()}`,
            sentAt: new Date(),
            updatedAt: new Date(),
          };
        }
      }, 1000);

      return {
        success: true,
        data: smsLog,
      };
    } catch (error) {
      console.error('Send SMS error:', error);
      return {
        success: false,
        message: 'Failed to send SMS',
        error: 'SEND_SMS_FAILED',
      };
    }
  }

  async sendPushNotification(pushData: any): Promise<ApiResponse<PushLog>> {
    try {
      const pushLog: PushLog = {
        id: uuidv4(),
        notificationId: pushData.notificationId || uuidv4(),
        deviceTokens: pushData.deviceTokens,
        title: pushData.title,
        message: pushData.message,
        data: pushData.data,
        status: 'PENDING',
        provider: 'firebase',
        successCount: 0,
        failureCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.pushLogs.push(pushLog);

      // Simulate sending push notification
      setTimeout(() => {
        const index = this.pushLogs.findIndex(log => log.id === pushLog.id);
        if (index !== -1) {
          this.pushLogs[index] = {
            ...this.pushLogs[index],
            status: 'SENT',
            successCount: pushData.deviceTokens.length,
            failureCount: 0,
            sentAt: new Date(),
            updatedAt: new Date(),
          };
        }
      }, 1000);

      return {
        success: true,
        data: pushLog,
      };
    } catch (error) {
      console.error('Send push notification error:', error);
      return {
        success: false,
        message: 'Failed to send push notification',
        error: 'SEND_PUSH_FAILED',
      };
    }
  }

  async getEmailLogs(params: GetLogsParams): Promise<PaginatedResponse<EmailLog[]>> {
    try {
      let filteredLogs = [...this.emailLogs];

      // Apply filters
      if (params.filters.status) {
        filteredLogs = filteredLogs.filter(log => log.status === params.filters.status);
      }

      if (params.filters.search) {
        const searchTerm = params.filters.search.toLowerCase();
        filteredLogs = filteredLogs.filter(log =>
          log.to.toLowerCase().includes(searchTerm) ||
          log.subject.toLowerCase().includes(searchTerm)
        );
      }

      // Sort logs
      const sortBy = params.filters.sortBy || 'createdAt';
      const sortOrder = params.filters.sortOrder || 'desc';
      
      filteredLogs.sort((a, b) => {
        let aValue: any = a[sortBy as keyof EmailLog];
        let bValue: any = b[sortBy as keyof EmailLog];
        
        if (aValue instanceof Date) {
          aValue = aValue.getTime();
          bValue = (bValue as Date).getTime();
        }
        
        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        } else {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
        }
      });

      // Pagination
      const total = filteredLogs.length;
      const totalPages = Math.ceil(total / params.limit);
      const startIndex = (params.page - 1) * params.limit;
      const endIndex = startIndex + params.limit;
      const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

      return {
        success: true,
        data: paginatedLogs,
        pagination: {
          page: params.page,
          limit: params.limit,
          total,
          totalPages,
          hasNext: params.page < totalPages,
          hasPrev: params.page > 1,
        },
      };
    } catch (error) {
      console.error('Get email logs error:', error);
      return {
        success: false,
        message: 'Failed to fetch email logs',
        error: 'GET_EMAIL_LOGS_FAILED',
      };
    }
  }

  async getSmsLogs(params: GetLogsParams): Promise<PaginatedResponse<SmsLog[]>> {
    try {
      let filteredLogs = [...this.smsLogs];

      // Apply filters
      if (params.filters.status) {
        filteredLogs = filteredLogs.filter(log => log.status === params.filters.status);
      }

      if (params.filters.search) {
        const searchTerm = params.filters.search.toLowerCase();
        filteredLogs = filteredLogs.filter(log =>
          log.to.toLowerCase().includes(searchTerm) ||
          log.message.toLowerCase().includes(searchTerm)
        );
      }

      // Sort logs
      const sortBy = params.filters.sortBy || 'createdAt';
      const sortOrder = params.filters.sortOrder || 'desc';
      
      filteredLogs.sort((a, b) => {
        let aValue: any = a[sortBy as keyof SmsLog];
        let bValue: any = b[sortBy as keyof SmsLog];
        
        if (aValue instanceof Date) {
          aValue = aValue.getTime();
          bValue = (bValue as Date).getTime();
        }
        
        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        } else {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
        }
      });

      // Pagination
      const total = filteredLogs.length;
      const totalPages = Math.ceil(total / params.limit);
      const startIndex = (params.page - 1) * params.limit;
      const endIndex = startIndex + params.limit;
      const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

      return {
        success: true,
        data: paginatedLogs,
        pagination: {
          page: params.page,
          limit: params.limit,
          total,
          totalPages,
          hasNext: params.page < totalPages,
          hasPrev: params.page > 1,
        },
      };
    } catch (error) {
      console.error('Get SMS logs error:', error);
      return {
        success: false,
        message: 'Failed to fetch SMS logs',
        error: 'GET_SMS_LOGS_FAILED',
      };
    }
  }

  async getPushLogs(params: GetLogsParams): Promise<PaginatedResponse<PushLog[]>> {
    try {
      let filteredLogs = [...this.pushLogs];

      // Apply filters
      if (params.filters.status) {
        filteredLogs = filteredLogs.filter(log => log.status === params.filters.status);
      }

      if (params.filters.search) {
        const searchTerm = params.filters.search.toLowerCase();
        filteredLogs = filteredLogs.filter(log =>
          log.title.toLowerCase().includes(searchTerm) ||
          log.message.toLowerCase().includes(searchTerm)
        );
      }

      // Sort logs
      const sortBy = params.filters.sortBy || 'createdAt';
      const sortOrder = params.filters.sortOrder || 'desc';
      
      filteredLogs.sort((a, b) => {
        let aValue: any = a[sortBy as keyof PushLog];
        let bValue: any = b[sortBy as keyof PushLog];
        
        if (aValue instanceof Date) {
          aValue = aValue.getTime();
          bValue = (bValue as Date).getTime();
        }
        
        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        } else {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
        }
      });

      // Pagination
      const total = filteredLogs.length;
      const totalPages = Math.ceil(total / params.limit);
      const startIndex = (params.page - 1) * params.limit;
      const endIndex = startIndex + params.limit;
      const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

      return {
        success: true,
        data: paginatedLogs,
        pagination: {
          page: params.page,
          limit: params.limit,
          total,
          totalPages,
          hasNext: params.page < totalPages,
          hasPrev: params.page > 1,
        },
      };
    } catch (error) {
      console.error('Get push logs error:', error);
      return {
        success: false,
        message: 'Failed to fetch push logs',
        error: 'GET_PUSH_LOGS_FAILED',
      };
    }
  }

  async getNotificationTemplates(params: GetTemplatesParams): Promise<PaginatedResponse<NotificationTemplate[]>> {
    try {
      let filteredTemplates = [...this.templates];

      // Apply filters
      if (params.filters.type) {
        filteredTemplates = filteredTemplates.filter(t => t.type === params.filters.type);
      }

      if (params.filters.active !== undefined) {
        filteredTemplates = filteredTemplates.filter(t => t.isActive === params.filters.active);
      }

      if (params.filters.search) {
        const searchTerm = params.filters.search.toLowerCase();
        filteredTemplates = filteredTemplates.filter(t =>
          t.name.toLowerCase().includes(searchTerm) ||
          t.description?.toLowerCase().includes(searchTerm)
        );
      }

      // Sort templates
      const sortBy = params.filters.sortBy || 'createdAt';
      const sortOrder = params.filters.sortOrder || 'desc';
      
      filteredTemplates.sort((a, b) => {
        let aValue: any = a[sortBy as keyof NotificationTemplate];
        let bValue: any = b[sortBy as keyof NotificationTemplate];
        
        if (aValue instanceof Date) {
          aValue = aValue.getTime();
          bValue = (bValue as Date).getTime();
        }
        
        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        } else {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
        }
      });

      // Pagination
      const total = filteredTemplates.length;
      const totalPages = Math.ceil(total / params.limit);
      const startIndex = (params.page - 1) * params.limit;
      const endIndex = startIndex + params.limit;
      const paginatedTemplates = filteredTemplates.slice(startIndex, endIndex);

      return {
        success: true,
        data: paginatedTemplates,
        pagination: {
          page: params.page,
          limit: params.limit,
          total,
          totalPages,
          hasNext: params.page < totalPages,
          hasPrev: params.page > 1,
        },
      };
    } catch (error) {
      console.error('Get notification templates error:', error);
      return {
        success: false,
        message: 'Failed to fetch notification templates',
        error: 'GET_TEMPLATES_FAILED',
      };
    }
  }

  async createNotificationTemplate(templateData: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<NotificationTemplate>> {
    try {
      const template: NotificationTemplate = {
        id: uuidv4(),
        ...templateData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.templates.push(template);

      return {
        success: true,
        data: template,
      };
    } catch (error) {
      console.error('Create notification template error:', error);
      return {
        success: false,
        message: 'Failed to create notification template',
        error: 'CREATE_TEMPLATE_FAILED',
      };
    }
  }

  private async processNotification(notification: Notification): Promise<void> {
    try {
      // Process notification based on type
      switch (notification.type) {
        case 'EMAIL':
          await this.sendEmail({
            notificationId: notification.id,
            to: notification.userId + '@example.com', // Mock email
            subject: notification.title,
            message: notification.message,
          });
          break;
        case 'SMS':
          await this.sendSms({
            notificationId: notification.id,
            to: '+1234567890', // Mock phone
            message: notification.message,
          });
          break;
        case 'PUSH':
          await this.sendPushNotification({
            notificationId: notification.id,
            deviceTokens: ['mock_token'], // Mock device token
            title: notification.title,
            message: notification.message,
          });
          break;
        case 'IN_APP':
          // In-app notifications are already stored
          break;
      }
    } catch (error) {
      console.error('Process notification error:', error);
    }
  }

  private initializeMockData(): void {
    // Initialize mock templates
    this.templates = [
      {
        id: uuidv4(),
        name: 'Welcome Email',
        type: 'EMAIL',
        subject: 'Welcome to Lomash Wood!',
        content: 'Hello {{name}}, welcome to Lomash Wood! We\'re excited to have you on board.',
        variables: ['name'],
        isActive: true,
        description: 'Welcome email for new customers',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        name: 'Order Confirmation',
        type: 'EMAIL',
        subject: 'Order Confirmation - {{orderNumber}}',
        content: 'Your order {{orderNumber}} has been confirmed. Total: {{total}}',
        variables: ['orderNumber', 'total'],
        isActive: true,
        description: 'Order confirmation email',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Initialize mock notifications
    this.notifications = [
      {
        id: uuidv4(),
        userId: 'user-1',
        type: 'IN_APP',
        title: 'Welcome!',
        message: 'Welcome to Lomash Wood. Explore our amazing furniture collection.',
        status: 'READ',
        priority: 'MEDIUM',
        readAt: new Date(),
        retryCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }
}
