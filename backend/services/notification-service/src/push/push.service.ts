import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import { PushLog } from './entities/push-log.entity';
import { SendPushDto } from './dto/send-push.dto';
import { FirebaseProvider } from './providers/firebase.provider';

@Injectable()
export class PushService {
  constructor(
    @InjectRepository(PushLog)
    private readonly pushLogRepository: Repository<PushLog>,
    @InjectQueue('push') private readonly pushQueue: Queue,
    private readonly configService: ConfigService,
    private readonly firebaseProvider: FirebaseProvider,
  ) {}

  async sendPush(sendPushDto: SendPushDto): Promise<PushLog> {
    const pushLog = this.pushLogRepository.create({
      ...sendPushDto,
      status: 'PENDING',
      sentAt: null,
      deliveredAt: null,
      failedAt: null,
    });

    const savedLog = await this.pushLogRepository.save(pushLog);

    // Add to queue for processing
    await this.pushQueue.add('send-push', {
      pushId: savedLog.id,
      provider: sendPushDto.provider || 'firebase',
    });

    return savedLog;
  }

  async sendBulkPush(tokens: string[], notification: any, data?: any): Promise<PushLog[]> {
    const results: PushLog[] = [];

    for (const token of tokens) {
      const pushLog = this.pushLogRepository.create({
        token,
        notification,
        data,
        provider: 'firebase',
        status: 'PENDING',
        sentAt: null,
        deliveredAt: null,
        failedAt: null,
      });

      const savedLog = await this.pushLogRepository.save(pushLog);
      results.push(savedLog);

      // Add to queue for processing
      await this.pushQueue.add('send-push', {
        pushId: savedLog.id,
        provider: 'firebase',
      });
    }

    return results;
  }

  async sendToTopic(topic: string, notification: any, data?: any): Promise<any> {
    const pushLog = this.pushLogRepository.create({
      topic,
      notification,
      data,
      provider: 'firebase',
      status: 'PENDING',
      sentAt: null,
      deliveredAt: null,
      failedAt: null,
    });

    const savedLog = await this.pushLogRepository.save(pushLog);

    // Add to queue for processing
    await this.pushQueue.add('send-to-topic', {
      pushId: savedLog.id,
      topic,
      notification,
      data,
    });

    return savedLog;
  }

  async sendToCondition(condition: string, notification: any, data?: any): Promise<any> {
    const pushLog = this.pushLogRepository.create({
      condition,
      notification,
      data,
      provider: 'firebase',
      status: 'PENDING',
      sentAt: null,
      deliveredAt: null,
      failedAt: null,
    });

    const savedLog = await this.pushLogRepository.save(pushLog);

    // Add to queue for processing
    await this.pushQueue.add('send-to-condition', {
      pushId: savedLog.id,
      condition,
      notification,
      data,
    });

    return savedLog;
  }

  async getPushLogs(query: any): Promise<{ logs: PushLog[]; total: number; page: number; limit: number }> {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 10);
    const skip = (page - 1) * limit;

    const [logs, total] = await this.pushLogRepository.findAndCount({
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
      where: query.status ? { status: query.status } : {},
    });

    return { logs, total, page, limit };
  }

  async getPushLogById(id: string): Promise<PushLog> {
    return this.pushLogRepository.findOne({ where: { id } });
  }

  async getPushStats(query: any): Promise<any> {
    const { startDate, endDate } = query;
    const whereClause: any = {};

    if (startDate && endDate) {
      whereClause.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const total = await this.pushLogRepository.count({ where: whereClause });
    const sent = await this.pushLogRepository.count({ where: { ...whereClause, status: 'SENT' } });
    const delivered = await this.pushLogRepository.count({ where: { ...whereClause, status: 'DELIVERED' } });
    const failed = await this.pushLogRepository.count({ where: { ...whereClause, status: 'FAILED' } });

    return {
      total,
      sent,
      delivered,
      failed,
      deliveryRate: total > 0 ? (delivered / total) * 100 : 0,
      successRate: total > 0 ? (sent / total) * 100 : 0,
    };
  }

  async getPushProviders(): Promise<any[]> {
    return [
      {
        name: 'firebase',
        displayName: 'Firebase Cloud Messaging',
        description: 'Google Firebase Cloud Messaging service',
        features: ['multicast', 'topics', 'conditions', 'analytics'],
        supported: true,
      },
      {
        name: 'apns',
        displayName: 'Apple Push Notification Service',
        description: 'Apple Push Notification Service for iOS devices',
        features: ['voip', 'background', 'mutable-content'],
        supported: false,
      },
      {
        name: 'fcm',
        displayName: 'Firebase Cloud Messaging (Legacy)',
        description: 'Legacy Firebase Cloud Messaging',
        features: ['basic', 'topics'],
        supported: false,
      },
    ];
  }

  async resendPush(id: string): Promise<PushLog> {
    const pushLog = await this.pushLogRepository.findOne({ where: { id } });
    
    if (!pushLog) {
      throw new Error('Push notification log not found');
    }

    // Create new log entry for resend
    const newLog = this.pushLogRepository.create({
      ...pushLog,
      id: undefined,
      status: 'PENDING',
      sentAt: null,
      deliveredAt: null,
      failedAt: null,
      parentPushId: pushLog.id,
    });

    const savedLog = await this.pushLogRepository.save(newLog);

    // Add to queue for processing
    await this.pushQueue.add('send-push', {
      pushId: savedLog.id,
      provider: pushLog.provider || 'firebase',
    });

    return savedLog;
  }

  async previewPush(notification: any, data?: any): Promise<any> {
    return {
      notification,
      data,
      preview: {
        title: notification.title,
        body: notification.body,
        icon: notification.icon,
        clickAction: notification.click_action,
        sound: notification.sound,
        badge: notification.badge,
        image: notification.image,
        data: data || {},
      },
      formatted: JSON.stringify({ notification, data }, null, 2),
    };
  }

  async getTopics(): Promise<any[]> {
    // Mock implementation - in real app, this would fetch from database
    return [
      { name: 'news', description: 'News and updates', subscribers: 1500 },
      { name: 'promotions', description: 'Promotional offers', subscribers: 2300 },
      { name: 'alerts', description: 'System alerts', subscribers: 800 },
      { name: 'updates', description: 'App updates', subscribers: 3200 },
    ];
  }

  async subscribeToTopic(token: string, topic: string): Promise<any> {
    // Mock implementation - in real app, this would call Firebase API
    return {
      success: true,
      token,
      topic,
      subscribedAt: new Date(),
    };
  }

  async unsubscribeFromTopic(token: string, topic: string): Promise<any> {
    // Mock implementation - in real app, this would call Firebase API
    return {
      success: true,
      token,
      topic,
      unsubscribedAt: new Date(),
    };
  }

  async getDeviceTokens(query: any): Promise<{ tokens: any[]; total: number; page: number; limit: number }> {
    // Mock implementation - in real app, this would fetch from database
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 10);
    const skip = (page - 1) * limit;

    const mockTokens = Array.from({ length: 50 }, (_, i) => ({
      id: `token_${i + 1}`,
      token: `mock_token_${i + 1}_${Math.random().toString(36).substr(2, 9)}`,
      userId: `user_${(i % 10) + 1}`,
      platform: i % 2 === 0 ? 'android' : 'ios',
      deviceModel: `Device_${i + 1}`,
      appVersion: '1.0.0',
      isActive: true,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      lastUsedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    }));

    const tokens = mockTokens.slice(skip, skip + limit);
    const total = mockTokens.length;

    return { tokens, total, page, limit };
  }

  async registerDevice(token: string, userId?: string, platform?: string, metadata?: any): Promise<any> {
    // Mock implementation - in real app, this would save to database
    return {
      id: this.generateId(),
      token,
      userId,
      platform: platform || 'unknown',
      metadata: metadata || {},
      isActive: true,
      createdAt: new Date(),
      lastUsedAt: new Date(),
    };
  }

  async unregisterDevice(token: string): Promise<any> {
    // Mock implementation - in real app, this would update database
    return {
      success: true,
      token,
      unregisteredAt: new Date(),
    };
  }

  async getPushAnalytics(query: any): Promise<any> {
    const { startDate, endDate } = query;
    
    // Mock implementation - in real app, this would calculate from database
    return {
      totalSent: 15000,
      totalDelivered: 13500,
      totalFailed: 1500,
      deliveryRate: 90,
      averageDeliveryTime: 2.5,
      platformStats: {
        android: { sent: 9000, delivered: 8100, failed: 900 },
        ios: { sent: 6000, delivered: 5400, failed: 600 },
      },
      hourlyStats: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        sent: Math.floor(Math.random() * 1000),
        delivered: Math.floor(Math.random() * 900),
        failed: Math.floor(Math.random() * 100),
      })),
      dailyStats: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        sent: Math.floor(Math.random() * 1000),
        delivered: Math.floor(Math.random() * 900),
        failed: Math.floor(Math.random() * 100),
      })),
    };
  }

  async getDeliveryReports(query: any): Promise<any> {
    // Mock implementation - in real app, this would fetch from database
    return {
      reports: [
        {
          id: 'report_1',
          messageId: 'msg_1',
          token: 'token_1',
          status: 'delivered',
          deliveredAt: new Date(),
          deviceInfo: {
            platform: 'android',
            appVersion: '1.0.0',
            deviceModel: 'Pixel 6',
          },
        },
        {
          id: 'report_2',
          messageId: 'msg_2',
          token: 'token_2',
          status: 'failed',
          error: 'Invalid token',
          failedAt: new Date(),
          deviceInfo: {
            platform: 'ios',
            appVersion: '1.0.0',
            deviceModel: 'iPhone 13',
          },
        },
      ],
      total: 2,
    };
  }

  async getPushBounces(query: any): Promise<any> {
    // Mock implementation - in real app, this would fetch from database
    return {
      bounces: [
        {
          id: 'bounce_1',
          token: 'token_1',
          reason: 'Invalid token',
          bouncedAt: new Date(),
          permanent: true,
        },
        {
          id: 'bounce_2',
          token: 'token_2',
          reason: 'Device not registered',
          bouncedAt: new Date(),
          permanent: false,
        },
      ],
      total: 2,
    };
  }

  async schedulePush(notification: any, data?: any, scheduledAt?: Date, timezone?: string): Promise<any> {
    const pushLog = this.pushLogRepository.create({
      notification,
      data,
      provider: 'firebase',
      status: 'SCHEDULED',
      scheduledAt: scheduledAt || new Date(),
      timezone,
      sentAt: null,
      deliveredAt: null,
      failedAt: null,
    });

    const savedLog = await this.pushLogRepository.save(pushLog);

    // Add to queue for scheduled processing
    await this.pushQueue.add('schedule-push', {
      pushId: savedLog.id,
      scheduledAt: savedLog.scheduledAt,
      timezone,
    });

    return savedLog;
  }

  async getScheduledPushNotifications(query: any): Promise<{ notifications: PushLog[]; total: number; page: number; limit: number }> {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 10);
    const skip = (page - 1) * limit;

    const [notifications, total] = await this.pushLogRepository.findAndCount({
      where: { status: 'SCHEDULED' },
      skip,
      take: limit,
      order: { scheduledAt: 'ASC' },
    });

    return { notifications, total, page, limit };
  }

  async updateScheduledPush(id: string, updateDto: any): Promise<PushLog> {
    const pushLog = await this.pushLogRepository.findOne({ where: { id } });
    
    if (!pushLog) {
      throw new Error('Scheduled push notification not found');
    }

    Object.assign(pushLog, updateDto);
    return this.pushLogRepository.save(pushLog);
  }

  async cancelScheduledPush(id: string): Promise<PushLog> {
    const pushLog = await this.pushLogRepository.findOne({ where: { id } });
    
    if (!pushLog) {
      throw new Error('Scheduled push notification not found');
    }

    pushLog.status = 'CANCELLED';
    return this.pushLogRepository.save(pushLog);
  }

  async createWebhook(webhookDto: { url: string; events: string[]; secret?: string; headers?: any }): Promise<any> {
    // Mock implementation - in real app, this would save to database
    return {
      id: this.generateId(),
      ...webhookDto,
      isActive: true,
      createdAt: new Date(),
      lastTriggeredAt: null,
    };
  }

  async getWebhooks(): Promise<any[]> {
    // Mock implementation - in real app, this would fetch from database
    return [
      {
        id: 'webhook_1',
        url: 'https://example.com/webhook',
        events: ['delivered', 'failed', 'bounced'],
        secret: 'webhook_secret',
        isActive: true,
        createdAt: new Date(),
        lastTriggeredAt: new Date(),
      },
    ];
  }

  async getWebhookById(id: string): Promise<any> {
    // Mock implementation - in real app, this would fetch from database
    return {
      id,
      url: 'https://example.com/webhook',
      events: ['delivered', 'failed', 'bounced'],
      secret: 'webhook_secret',
      isActive: true,
      createdAt: new Date(),
      lastTriggeredAt: new Date(),
    };
  }

  async updateWebhook(id: string, updateDto: any): Promise<any> {
    // Mock implementation - in real app, this would update database
    return {
      id,
      ...updateDto,
      updatedAt: new Date(),
    };
  }

  async deleteWebhook(id: string): Promise<any> {
    // Mock implementation - in real app, this would delete from database
    return {
      success: true,
      id,
      deletedAt: new Date(),
    };
  }

  async testConnection(provider?: string): Promise<any> {
    const providerName = provider || 'firebase';
    
    if (providerName === 'firebase') {
      return await this.firebaseProvider.testConnection();
    }

    return {
      success: false,
      error: `Provider ${providerName} not supported`,
    };
  }

  async getPushUsage(query: any): Promise<any> {
    const { startDate, endDate } = query;
    
    // Mock implementation - in real app, this would calculate from database
    return {
      totalSent: 15000,
      totalDelivered: 13500,
      totalFailed: 1500,
      cost: 25.50,
      currency: 'USD',
      provider: 'firebase',
      period: {
        startDate: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: endDate || new Date(),
      },
      breakdown: {
        android: { sent: 9000, delivered: 8100, failed: 900, cost: 15.30 },
        ios: { sent: 6000, delivered: 5400, failed: 600, cost: 10.20 },
      },
    };
  }

  async validateToken(token: string): Promise<any> {
    // Mock implementation - in real app, this would validate with provider
    return {
      valid: Math.random() > 0.1, // 90% success rate for demo
      token,
      platform: Math.random() > 0.5 ? 'android' : 'ios',
      validatedAt: new Date(),
    };
  }

  async getPlatformStats(query: any): Promise<any> {
    // Mock implementation - in real app, this would calculate from database
    return {
      platforms: [
        {
          name: 'android',
          totalTokens: 5000,
          activeTokens: 4500,
          sent: 9000,
          delivered: 8100,
          failed: 900,
          deliveryRate: 90,
        },
        {
          name: 'ios',
          totalTokens: 3000,
          activeTokens: 2800,
          sent: 6000,
          delivered: 5400,
          failed: 600,
          deliveryRate: 90,
        },
        {
          name: 'web',
          totalTokens: 2000,
          activeTokens: 1800,
          sent: 0,
          delivered: 0,
          failed: 0,
          deliveryRate: 0,
        },
      ],
      totalTokens: 10000,
      activeTokens: 9100,
    };
  }

  async sendMulticast(tokens: string[], notification: any, data?: any): Promise<any> {
    // Mock implementation - in real app, this would call Firebase API
    const batchId = this.generateId();
    const results = tokens.map(token => ({
      token,
      success: Math.random() > 0.1, // 90% success rate
      messageId: this.generateId(),
      error: Math.random() > 0.9 ? 'Invalid token' : null,
    }));

    return {
      batchId,
      multicastId: this.generateId(),
      successCount: results.filter(r => r.success).length,
      failureCount: results.filter(r => !r.success).length,
      results,
      sentAt: new Date(),
    };
  }

  async getBatchStatus(batchId: string): Promise<any> {
    // Mock implementation - in real app, this would fetch from database
    return {
      batchId,
      status: 'completed',
      totalTokens: 100,
      successCount: 90,
      failureCount: 10,
      completedAt: new Date(),
      results: Array.from({ length: 10 }, (_, i) => ({
        token: `token_${i + 1}`,
        success: i < 9,
        messageId: i < 9 ? this.generateId() : null,
        error: i >= 9 ? 'Invalid token' : null,
      })),
    };
  }

  async setPushPreferences(userId: string, preferences: any): Promise<any> {
    // Mock implementation - in real app, this would save to database
    return {
      userId,
      preferences,
      updatedAt: new Date(),
    };
  }

  async getPushPreferences(userId: string): Promise<any> {
    // Mock implementation - in real app, this would fetch from database
    return {
      userId,
      preferences: {
        enabled: true,
        quietHours: {
          enabled: true,
          start: '22:00',
          end: '08:00',
        },
        categories: {
          news: true,
          promotions: false,
          alerts: true,
          updates: true,
        },
        frequency: 'daily',
      },
      updatedAt: new Date(),
    };
  }

  async unsubscribeFromPush(token: string, reason?: string): Promise<any> {
    // Mock implementation - in real app, this would update database
    return {
      success: true,
      token,
      reason: reason || 'User unsubscribed',
      unsubscribedAt: new Date(),
    };
  }

  async resubscribeToPush(token: string): Promise<any> {
    // Mock implementation - in real app, this would update database
    return {
      success: true,
      token,
      resubscribedAt: new Date(),
    };
  }

  async getAudienceSegments(query: any): Promise<any[]> {
    // Mock implementation - in real app, this would fetch from database
    return [
      {
        id: 'segment_1',
        name: 'Active Users',
        description: 'Users who have been active in the last 30 days',
        userCount: 5000,
        criteria: {
          lastActive: '30d',
          status: 'active',
        },
      },
      {
        id: 'segment_2',
        name: 'Premium Users',
        description: 'Users with premium subscription',
        userCount: 1500,
        criteria: {
          subscription: 'premium',
        },
      },
      {
        id: 'segment_3',
        name: 'New Users',
        description: 'Users who joined in the last 7 days',
        userCount: 500,
        criteria: {
          createdAt: '7d',
        },
      },
    ];
  }

  async sendToSegment(segmentId: string, notification: any, data?: any): Promise<any> {
    // Mock implementation - in real app, this would fetch segment users and send
    return {
      segmentId,
      notification,
      data,
      sentCount: 1000,
      campaignId: this.generateId(),
      sentAt: new Date(),
    };
  }

  async getPushCampaigns(query: any): Promise<{ campaigns: any[]; total: number; page: number; limit: number }> {
    // Mock implementation - in real app, this would fetch from database
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 10);
    const skip = (page - 1) * limit;

    const mockCampaigns = Array.from({ length: 25 }, (_, i) => ({
      id: `campaign_${i + 1}`,
      name: `Campaign ${i + 1}`,
      description: `Description for campaign ${i + 1}`,
      status: ['draft', 'scheduled', 'sent', 'completed'][i % 4],
      targetAudience: 'all_users',
      messageCount: Math.floor(Math.random() * 10000),
      deliveryRate: Math.floor(Math.random() * 100),
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      scheduledAt: i % 4 === 1 ? new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000) : null,
      sentAt: i % 4 === 2 ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) : null,
      completedAt: i % 4 === 3 ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) : null,
    }));

    const campaigns = mockCampaigns.slice(skip, skip + limit);
    const total = mockCampaigns.length;

    return { campaigns, total, page, limit };
  }

  async createPushCampaign(campaignDto: any): Promise<any> {
    // Mock implementation - in real app, this would save to database
    return {
      id: this.generateId(),
      ...campaignDto,
      status: 'draft',
      createdAt: new Date(),
    };
  }

  async getPushCampaignById(id: string): Promise<any> {
    // Mock implementation - in real app, this would fetch from database
    return {
      id,
      name: 'Sample Campaign',
      description: 'Sample campaign description',
      status: 'draft',
      targetAudience: 'all_users',
      messageCount: 0,
      deliveryRate: 0,
      createdAt: new Date(),
      scheduledAt: null,
      sentAt: null,
      completedAt: null,
    };
  }

  async updatePushCampaign(id: string, updateDto: any): Promise<any> {
    // Mock implementation - in real app, this would update database
    return {
      id,
      ...updateDto,
      updatedAt: new Date(),
    };
  }

  async deletePushCampaign(id: string): Promise<any> {
    // Mock implementation - in real app, this would delete from database
    return {
      success: true,
      id,
      deletedAt: new Date(),
    };
  }

  async sendPushCampaign(id: string): Promise<any> {
    // Mock implementation - in real app, this would send the campaign
    return {
      campaignId: id,
      status: 'sent',
      sentCount: 5000,
      sentAt: new Date(),
    };
  }

  async getPushTemplates(query: any): Promise<{ templates: any[]; total: number; page: number; limit: number }> {
    // Mock implementation - in real app, this would fetch from database
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 10);
    const skip = (page - 1) * limit;

    const mockTemplates = Array.from({ length: 15 }, (_, i) => ({
      id: `template_${i + 1}`,
      name: `Template ${i + 1}`,
      description: `Description for template ${i + 1}`,
      category: ['notification', 'alert', 'promotion', 'welcome'][i % 4],
      variables: ['title', 'body', 'imageUrl'],
      usageCount: Math.floor(Math.random() * 1000),
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    }));

    const templates = mockTemplates.slice(skip, skip + limit);
    const total = mockTemplates.length;

    return { templates, total, page, limit };
  }

  async createPushTemplate(templateDto: any): Promise<any> {
    // Mock implementation - in real app, this would save to database
    return {
      id: this.generateId(),
      ...templateDto,
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async getPushTemplateById(id: string): Promise<any> {
    // Mock implementation - in real app, this would fetch from database
    return {
      id,
      name: 'Sample Template',
      description: 'Sample template description',
      category: 'notification',
      variables: ['title', 'body', 'imageUrl'],
      usageCount: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async updatePushTemplate(id: string, updateDto: any): Promise<any> {
    // Mock implementation - in real app, this would update database
    return {
      id,
      ...updateDto,
      updatedAt: new Date(),
    };
  }

  async deletePushTemplate(id: string): Promise<any> {
    // Mock implementation - in real app, this would delete from database
    return {
      success: true,
      id,
      deletedAt: new Date(),
    };
  }

  async sendPushTemplate(id: string, tokens: string[], data?: any): Promise<any> {
    // Mock implementation - in real app, this would fetch template and send
    return {
      templateId: id,
      tokens,
      data,
      sentCount: tokens.length,
      campaignId: this.generateId(),
      sentAt: new Date(),
    };
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
