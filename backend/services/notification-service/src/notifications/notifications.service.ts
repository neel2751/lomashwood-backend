import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import { NotificationLog } from './entities/notification-log.entity';
import { SendNotificationDto } from './dto/send-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(NotificationLog)
    private readonly notificationLogRepository: Repository<NotificationLog>,
    @InjectQueue('notifications') private readonly notificationsQueue: Queue,
    private readonly configService: ConfigService,
  ) {}

  async getUserNotifications(
    userId: string,
    params: {
      page: number;
      limit: number;
      type?: string;
      status?: string;
      search?: string;
    }
  ): Promise<{ notifications: NotificationLog[]; total: number; page: number; limit: number }> {
    const { page, limit, type, status, search } = params;
    const skip = (page - 1) * limit;

    const query = this.notificationLogRepository.createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId });

    if (type) {
      query.andWhere('notification.type = :type', { type });
    }

    if (status) {
      query.andWhere('notification.status = :status', { status });
    }

    if (search) {
      query.andWhere('(notification.title ILIKE :search OR notification.message ILIKE :search)', 
        { search: `%${search}%` });
    }

    const [notifications, total] = await query
      .orderBy('notification.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      notifications,
      total,
      page,
      limit,
    };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationLogRepository.count({
      where: {
        userId,
        isRead: false,
        status: 'DELIVERED',
      },
    });
  }

  async getNotification(id: string, userId: string): Promise<NotificationLog | null> {
    return this.notificationLogRepository.findOne({
      where: {
        id,
        userId,
      },
    });
  }

  async sendNotification(sendNotificationDto: SendNotificationDto): Promise<NotificationLog> {
    const notification = this.notificationLogRepository.create({
      ...sendNotificationDto,
      status: 'PENDING',
      isRead: false,
    });

    const savedNotification = await this.notificationLogRepository.save(notification);

    // Add to queue for processing
    await this.notificationsQueue.add('send-notification', {
      notificationId: savedNotification.id,
    });

    return savedNotification;
  }

  async markAsRead(id: string, userId: string): Promise<NotificationLog | null> {
    const notification = await this.getNotification(id, userId);
    if (!notification) {
      return null;
    }

    await this.notificationLogRepository.update(id, {
      isRead: true,
      readAt: new Date(),
    });

    return this.getNotification(id, userId);
  }

  async markAllAsRead(userId: string): Promise<{ updated: number }> {
    const result = await this.notificationLogRepository.update(
      {
        userId,
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    );

    return { updated: result.affected || 0 };
  }

  async archiveNotification(id: string, userId: string): Promise<NotificationLog | null> {
    const notification = await this.getNotification(id, userId);
    if (!notification) {
      return null;
    }

    await this.notificationLogRepository.update(id, {
      status: 'ARCHIVED',
      archivedAt: new Date(),
    });

    return this.getNotification(id, userId);
  }

  async deleteNotification(id: string, userId: string): Promise<boolean> {
    const result = await this.notificationLogRepository.delete({
      id,
      userId,
    });

    return (result.affected || 0) > 0;
  }

  async sendEmail(emailData: {
    to: string | string[];
    subject: string;
    content: string;
    template?: string;
    templateData?: any;
    attachments?: any[];
  }): Promise<any> {
    const emailLog = this.notificationLogRepository.create({
      type: 'EMAIL',
      title: emailData.subject,
      message: emailData.content,
      recipient: Array.isArray(emailData.to) ? emailData.to.join(',') : emailData.to,
      status: 'PENDING',
      metadata: JSON.stringify({
        template: emailData.template,
        templateData: emailData.templateData,
        attachments: emailData.attachments,
      }),
    });

    const savedLog = await this.notificationLogRepository.save(emailLog);

    // Add to queue for processing
    await this.notificationsQueue.add('send-email', {
      emailId: savedLog.id,
      emailData,
    });

    return savedLog;
  }

  async getEmailLogs(params: {
    page: number;
    limit: number;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{ logs: NotificationLog[]; total: number; page: number; limit: number }> {
    const { page, limit, status, startDate, endDate } = params;
    const skip = (page - 1) * limit;

    const query = this.notificationLogRepository.createQueryBuilder('notification')
      .where('notification.type = :type', { type: 'EMAIL' });

    if (status) {
      query.andWhere('notification.status = :status', { status });
    }

    if (startDate) {
      query.andWhere('notification.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('notification.createdAt <= :endDate', { endDate });
    }

    const [logs, total] = await query
      .orderBy('notification.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      logs,
      total,
      page,
      limit,
    };
  }

  async sendSms(smsData: {
    to: string | string[];
    message: string;
    template?: string;
    templateData?: any;
  }): Promise<any> {
    const smsLog = this.notificationLogRepository.create({
      type: 'SMS',
      title: 'SMS Notification',
      message: smsData.message,
      recipient: Array.isArray(smsData.to) ? smsData.to.join(',') : smsData.to,
      status: 'PENDING',
      metadata: JSON.stringify({
        template: smsData.template,
        templateData: smsData.templateData,
      }),
    });

    const savedLog = await this.notificationLogRepository.save(smsLog);

    // Add to queue for processing
    await this.notificationsQueue.add('send-sms', {
      smsId: savedLog.id,
      smsData,
    });

    return savedLog;
  }

  async getSmsLogs(params: {
    page: number;
    limit: number;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{ logs: NotificationLog[]; total: number; page: number; limit: number }> {
    const { page, limit, status, startDate, endDate } = params;
    const skip = (page - 1) * limit;

    const query = this.notificationLogRepository.createQueryBuilder('notification')
      .where('notification.type = :type', { type: 'SMS' });

    if (status) {
      query.andWhere('notification.status = :status', { status });
    }

    if (startDate) {
      query.andWhere('notification.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('notification.createdAt <= :endDate', { endDate });
    }

    const [logs, total] = await query
      .orderBy('notification.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      logs,
      total,
      page,
      limit,
    };
  }

  async sendPushNotification(pushData: {
    to: string | string[];
    title: string;
    body: string;
    data?: any;
    icon?: string;
    badge?: number;
    sound?: string;
  }): Promise<any> {
    const pushLog = this.notificationLogRepository.create({
      type: 'PUSH',
      title: pushData.title,
      message: pushData.body,
      recipient: Array.isArray(pushData.to) ? pushData.to.join(',') : pushData.to,
      status: 'PENDING',
      metadata: JSON.stringify({
        data: pushData.data,
        icon: pushData.icon,
        badge: pushData.badge,
        sound: pushData.sound,
      }),
    });

    const savedLog = await this.notificationLogRepository.save(pushLog);

    // Add to queue for processing
    await this.notificationsQueue.add('send-push', {
      pushId: savedLog.id,
      pushData,
    });

    return savedLog;
  }

  async getPushLogs(params: {
    page: number;
    limit: number;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{ logs: NotificationLog[]; total: number; page: number; limit: number }> {
    const { page, limit, status, startDate, endDate } = params;
    const skip = (page - 1) * limit;

    const query = this.notificationLogRepository.createQueryBuilder('notification')
      .where('notification.type = :type', { type: 'PUSH' });

    if (status) {
      query.andWhere('notification.status = :status', { status });
    }

    if (startDate) {
      query.andWhere('notification.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('notification.createdAt <= :endDate', { endDate });
    }

    const [logs, total] = await query
      .orderBy('notification.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      logs,
      total,
      page,
      limit,
    };
  }

  async getNotificationTemplates(
    type?: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ templates: any[]; total: number; page: number; limit: number }> {
    // This would typically fetch from a templates table
    // For now, returning mock data
    const templates = [
      {
        id: '1',
        name: 'Welcome Email',
        type: 'EMAIL',
        subject: 'Welcome to Lomash Wood',
        content: 'Welcome {{name}}! Thank you for joining Lomash Wood.',
        variables: ['name'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        name: 'Order Confirmation',
        type: 'EMAIL',
        subject: 'Order Confirmation #{{orderNumber}}',
        content: 'Your order #{{orderNumber}} has been confirmed.',
        variables: ['orderNumber', 'customerName'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '3',
        name: 'Shipping Update',
        type: 'SMS',
        content: 'Your order #{{orderNumber}} has been shipped! Track it here: {{trackingUrl}}',
        variables: ['orderNumber', 'trackingUrl'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const filteredTemplates = type ? templates.filter(t => t.type === type) : templates;
    const startIndex = (page - 1) * limit;
    const paginatedTemplates = filteredTemplates.slice(startIndex, startIndex + limit);

    return {
      templates: paginatedTemplates,
      total: filteredTemplates.length,
      page,
      limit,
    };
  }

  async createNotificationTemplate(templateData: {
    name: string;
    type: string;
    subject?: string;
    content: string;
    variables?: string[];
    isActive?: boolean;
  }): Promise<any> {
    // This would typically save to a templates table
    // For now, returning mock data
    const template = {
      id: this.generateId(),
      ...templateData,
      isActive: templateData.isActive !== undefined ? templateData.isActive : true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log('Template created:', template);
    return template;
  }

  async getNotificationTemplate(id: string): Promise<any | null> {
    // This would typically fetch from templates table
    // For now, returning mock data
    const templates = await this.getNotificationTemplates();
    return templates.templates.find(t => t.id === id) || null;
  }

  async updateNotificationTemplate(
    id: string,
    templateData: {
      name?: string;
      type?: string;
      subject?: string;
      content?: string;
      variables?: string[];
      isActive?: boolean;
    }
  ): Promise<any | null> {
    const template = await this.getNotificationTemplate(id);
    if (!template) {
      return null;
    }

    const updatedTemplate = {
      ...template,
      ...templateData,
      updatedAt: new Date(),
    };

    console.log('Template updated:', updatedTemplate);
    return updatedTemplate;
  }

  async deleteNotificationTemplate(id: string): Promise<boolean> {
    const template = await this.getNotificationTemplate(id);
    if (!template) {
      return false;
    }

    console.log('Template deleted:', id);
    return true;
  }

  async getNotificationStats(
    startDate?: Date,
    endDate?: Date,
    type?: string
  ): Promise<any> {
    const query = this.notificationLogRepository.createQueryBuilder('notification');

    if (startDate) {
      query.andWhere('notification.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('notification.createdAt <= :endDate', { endDate });
    }

    if (type) {
      query.andWhere('notification.type = :type', { type });
    }

    const total = await query.getCount();
    const sent = await query.andWhere('notification.status = :status', { status: 'SENT' }).getCount();
    const delivered = await query.andWhere('notification.status = :status', { status: 'DELIVERED' }).getCount();
    const failed = await query.andWhere('notification.status = :status', { status: 'FAILED' }).getCount();
    const read = await query.andWhere('notification.isRead = :isRead', { isRead: true }).getCount();

    const typeBreakdown = await this.notificationLogRepository
      .createQueryBuilder('notification')
      .select('notification.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('notification.type')
      .getRawMany();

    const dailyStats = await this.notificationLogRepository
      .createQueryBuilder('notification')
      .select('DATE(notification.createdAt)', 'date')
      .addSelect('COUNT(*)', 'count')
      .groupBy('DATE(notification.createdAt)')
      .orderBy('DATE(notification.createdAt)', 'DESC')
      .limit(30)
      .getRawMany();

    return {
      total,
      sent,
      delivered,
      failed,
      read,
      readRate: total > 0 ? (read / total) * 100 : 0,
      deliveryRate: sent > 0 ? (delivered / sent) * 100 : 0,
      typeBreakdown,
      dailyStats,
    };
  }

  async sendBulkNotifications(
    recipients: string[],
    notification: SendNotificationDto,
    channels?: string[]
  ): Promise<{ sent: number; failed: number; details: any[] }> {
    const results = {
      sent: 0,
      failed: 0,
      details: [] as any[],
    };

    const channelsToSend = channels || ['EMAIL', 'SMS', 'PUSH'];

    for (const recipient of recipients) {
      try {
        for (const channel of channelsToSend) {
          const notificationData = {
            ...notification,
            userId: recipient,
            type: channel,
          };

          const result = await this.sendNotification(notificationData);
          results.details.push({
            recipient,
            channel,
            notificationId: result.id,
            status: 'PENDING',
          });
        }
        results.sent++;
      } catch (error) {
        results.failed++;
        results.details.push({
          recipient,
          error: error.message,
          status: 'FAILED',
        });
      }
    }

    return results;
  }

  async markMultipleAsRead(notificationIds: string[], userId: string): Promise<{ updated: number }> {
    const result = await this.notificationLogRepository.update(
      {
        id: { $in: notificationIds },
        userId,
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    );

    return { updated: result.affected || 0 };
  }

  async deleteMultipleNotifications(notificationIds: string[], userId: string): Promise<{ deleted: number }> {
    const result = await this.notificationLogRepository.delete({
      id: { $in: notificationIds },
      userId,
    });

    return { deleted: result.affected || 0 };
  }

  async getNotificationSettings(userId: string): Promise<any> {
    // This would typically fetch from user settings table
    // For now, returning mock data
    return {
      userId,
      emailEnabled: true,
      smsEnabled: true,
      pushEnabled: true,
      marketingEmails: true,
      transactionalEmails: true,
      marketingSms: false,
      transactionalSms: true,
      pushMarketing: true,
      pushTransactional: true,
      frequency: 'DAILY',
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00',
      },
    };
  }

  async updateNotificationSettings(userId: string, settingsData: any): Promise<any> {
    // This would typically update user settings table
    // For now, returning mock data
    const settings = {
      userId,
      ...settingsData,
      updatedAt: new Date(),
    };

    console.log('Settings updated:', settings);
    return settings;
  }

  async getNotificationPreferences(userId: string): Promise<any> {
    // This would typically fetch from user preferences table
    // For now, returning mock data
    return {
      userId,
      orderUpdates: true,
      deliveryUpdates: true,
      paymentUpdates: true,
      promotionalOffers: true,
      newsletters: false,
      accountUpdates: true,
      securityAlerts: true,
      systemUpdates: true,
      recommendations: true,
      reviews: true,
      socialUpdates: false,
    };
  }

  async updateNotificationPreferences(userId: string, preferencesData: any): Promise<any> {
    // This would typically update user preferences table
    // For now, returning mock data
    const preferences = {
      userId,
      ...preferencesData,
      updatedAt: new Date(),
    };

    console.log('Preferences updated:', preferences);
    return preferences;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
