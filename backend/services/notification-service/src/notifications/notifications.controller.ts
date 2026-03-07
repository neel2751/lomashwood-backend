import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/common/decorators/roles.decorator';
import { CurrentUser } from '../auth/common/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';
import { SendNotificationDto } from './dto/send-notification.dto';
import { ApiResponse } from '../../../../packages/api-client/src/types/api.types';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  @SwaggerApiResponse({ status: 200, description: 'Notifications retrieved successfully' })
  async getNotifications(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @CurrentUser() user?: any
  ): Promise<ApiResponse<any>> {
    const notifications = await this.notificationsService.getUserNotifications(user?.id, {
      page,
      limit,
      type,
      status,
      search,
    });
    return {
      success: true,
      data: notifications,
    };
  }

  @Get('unread')
  @ApiOperation({ summary: 'Get unread notifications count' })
  @SwaggerApiResponse({ status: 200, description: 'Unread count retrieved successfully' })
  async getUnreadCount(@CurrentUser() user?: any): Promise<ApiResponse<any>> {
    const count = await this.notificationsService.getUnreadCount(user?.id);
    return {
      success: true,
      data: { count },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get notification by ID' })
  @SwaggerApiResponse({ status: 200, description: 'Notification retrieved successfully' })
  async getNotification(@Param('id') id: string, @CurrentUser() user?: any): Promise<ApiResponse<any>> {
    const notification = await this.notificationsService.getNotification(id, user?.id);
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
  }

  @Post()
  @ApiOperation({ summary: 'Send notification' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 201, description: 'Notification sent successfully' })
  async sendNotification(@Body() sendNotificationDto: SendNotificationDto): Promise<ApiResponse<any>> {
    const notification = await this.notificationsService.sendNotification(sendNotificationDto);
    return {
      success: true,
      data: notification,
    };
  }

  @Put(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @SwaggerApiResponse({ status: 200, description: 'Notification marked as read' })
  async markAsRead(@Param('id') id: string, @CurrentUser() user?: any): Promise<ApiResponse<any>> {
    const notification = await this.notificationsService.markAsRead(id, user?.id);
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
  }

  @Put('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @SwaggerApiResponse({ status: 200, description: 'All notifications marked as read' })
  async markAllAsRead(@CurrentUser() user?: any): Promise<ApiResponse<any>> {
    const result = await this.notificationsService.markAllAsRead(user?.id);
    return {
      success: true,
      data: result,
    };
  }

  @Put(':id/archive')
  @ApiOperation({ summary: 'Archive notification' })
  @SwaggerApiResponse({ status: 200, description: 'Notification archived successfully' })
  async archiveNotification(@Param('id') id: string, @CurrentUser() user?: any): Promise<ApiResponse<any>> {
    const notification = await this.notificationsService.archiveNotification(id, user?.id);
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
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete notification' })
  @SwaggerApiResponse({ status: 200, description: 'Notification deleted successfully' })
  async deleteNotification(@Param('id') id: string, @CurrentUser() user?: any): Promise<ApiResponse<any>> {
    const result = await this.notificationsService.deleteNotification(id, user?.id);
    if (!result) {
      return {
        success: false,
        message: 'Notification not found',
        error: 'NOTIFICATION_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: result,
    };
  }

  // Email endpoints
  @Post('emails/send')
  @ApiOperation({ summary: 'Send email notification' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 201, description: 'Email sent successfully' })
  async sendEmail(@Body() emailData: {
    to: string | string[];
    subject: string;
    content: string;
    template?: string;
    templateData?: any;
    attachments?: any[];
  }): Promise<ApiResponse<any>> {
    const result = await this.notificationsService.sendEmail(emailData);
    return {
      success: true,
      data: result,
    };
  }

  @Get('emails/logs')
  @ApiOperation({ summary: 'Get email logs' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Email logs retrieved successfully' })
  async getEmailLogs(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ): Promise<ApiResponse<any>> {
    const logs = await this.notificationsService.getEmailLogs({
      page,
      limit,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
    return {
      success: true,
      data: logs,
    };
  }

  // SMS endpoints
  @Post('sms/send')
  @ApiOperation({ summary: 'Send SMS notification' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 201, description: 'SMS sent successfully' })
  async sendSms(@Body() smsData: {
    to: string | string[];
    message: string;
    template?: string;
    templateData?: any;
  }): Promise<ApiResponse<any>> {
    const result = await this.notificationsService.sendSms(smsData);
    return {
      success: true,
      data: result,
    };
  }

  @Get('sms/logs')
  @ApiOperation({ summary: 'Get SMS logs' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'SMS logs retrieved successfully' })
  async getSmsLogs(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ): Promise<ApiResponse<any>> {
    const logs = await this.notificationsService.getSmsLogs({
      page,
      limit,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
    return {
      success: true,
      data: logs,
    };
  }

  // Push notification endpoints
  @Post('push/send')
  @ApiOperation({ summary: 'Send push notification' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 201, description: 'Push notification sent successfully' })
  async sendPushNotification(@Body() pushData: {
    to: string | string[];
    title: string;
    body: string;
    data?: any;
    icon?: string;
    badge?: number;
    sound?: string;
  }): Promise<ApiResponse<any>> {
    const result = await this.notificationsService.sendPushNotification(pushData);
    return {
      success: true,
      data: result,
    };
  }

  @Get('push/logs')
  @ApiOperation({ summary: 'Get push notification logs' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Push logs retrieved successfully' })
  async getPushLogs(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ): Promise<ApiResponse<any>> {
    const logs = await this.notificationsService.getPushLogs({
      page,
      limit,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
    return {
      success: true,
      data: logs,
    };
  }

  // Template endpoints
  @Get('templates')
  @ApiOperation({ summary: 'Get notification templates' })
  @SwaggerApiResponse({ status: 200, description: 'Templates retrieved successfully' })
  async getNotificationTemplates(
    @Query('type') type?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ): Promise<ApiResponse<any>> {
    const templates = await this.notificationsService.getNotificationTemplates(type, page, limit);
    return {
      success: true,
      data: templates,
    };
  }

  @Post('templates')
  @ApiOperation({ summary: 'Create notification template' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 201, description: 'Template created successfully' })
  async createNotificationTemplate(@Body() templateData: {
    name: string;
    type: string;
    subject?: string;
    content: string;
    variables?: string[];
    isActive?: boolean;
  }): Promise<ApiResponse<any>> {
    const template = await this.notificationsService.createNotificationTemplate(templateData);
    return {
      success: true,
      data: template,
    };
  }

  @Get('templates/:id')
  @ApiOperation({ summary: 'Get notification template by ID' })
  @SwaggerApiResponse({ status: 200, description: 'Template retrieved successfully' })
  async getNotificationTemplate(@Param('id') id: string): Promise<ApiResponse<any>> {
    const template = await this.notificationsService.getNotificationTemplate(id);
    if (!template) {
      return {
        success: false,
        message: 'Template not found',
        error: 'TEMPLATE_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: template,
    };
  }

  @Put('templates/:id')
  @ApiOperation({ summary: 'Update notification template' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Template updated successfully' })
  async updateNotificationTemplate(
    @Param('id') id: string,
    @Body() templateData: {
      name?: string;
      type?: string;
      subject?: string;
      content?: string;
      variables?: string[];
      isActive?: boolean;
    }
  ): Promise<ApiResponse<any>> {
    const template = await this.notificationsService.updateNotificationTemplate(id, templateData);
    if (!template) {
      return {
        success: false,
        message: 'Template not found',
        error: 'TEMPLATE_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: template,
    };
  }

  @Delete('templates/:id')
  @ApiOperation({ summary: 'Delete notification template' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Template deleted successfully' })
  async deleteNotificationTemplate(@Param('id') id: string): Promise<ApiResponse<any>> {
    const result = await this.notificationsService.deleteNotificationTemplate(id);
    if (!result) {
      return {
        success: false,
        message: 'Template not found',
        error: 'TEMPLATE_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: result,
    };
  }

  // Statistics endpoints
  @Get('stats')
  @ApiOperation({ summary: 'Get notification statistics' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getNotificationStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('type') type?: string
  ): Promise<ApiResponse<any>> {
    const stats = await this.notificationsService.getNotificationStats(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      type
    );
    return {
      success: true,
      data: stats,
    };
  }

  // Bulk operations
  @Post('bulk-send')
  @ApiOperation({ summary: 'Send bulk notifications' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 201, description: 'Bulk notifications sent successfully' })
  async sendBulkNotifications(@Body() bulkData: {
    recipients: string[];
    notification: SendNotificationDto;
    channels?: string[];
  }): Promise<ApiResponse<any>> {
    const result = await this.notificationsService.sendBulkNotifications(
      bulkData.recipients,
      bulkData.notification,
      bulkData.channels
    );
    return {
      success: true,
      data: result,
    };
  }

  @Put('bulk-read')
  @ApiOperation({ summary: 'Mark multiple notifications as read' })
  @SwaggerApiResponse({ status: 200, description: 'Notifications marked as read' })
  async markMultipleAsRead(
    @Body() body: { notificationIds: string[] },
    @CurrentUser() user?: any
  ): Promise<ApiResponse<any>> {
    const result = await this.notificationsService.markMultipleAsRead(body.notificationIds, user?.id);
    return {
      success: true,
      data: result,
    };
  }

  @Delete('bulk-delete')
  @ApiOperation({ summary: 'Delete multiple notifications' })
  @SwaggerApiResponse({ status: 200, description: 'Notifications deleted successfully' })
  async deleteMultipleNotifications(
    @Body() body: { notificationIds: string[] },
    @CurrentUser() user?: any
  ): Promise<ApiResponse<any>> {
    const result = await this.notificationsService.deleteMultipleNotifications(body.notificationIds, user?.id);
    return {
      success: true,
      data: result,
    };
  }

  // Settings endpoints
  @Get('settings')
  @ApiOperation({ summary: 'Get notification settings' })
  @SwaggerApiResponse({ status: 200, description: 'Settings retrieved successfully' })
  async getNotificationSettings(@CurrentUser() user?: any): Promise<ApiResponse<any>> {
    const settings = await this.notificationsService.getNotificationSettings(user?.id);
    return {
      success: true,
      data: settings,
    };
  }

  @Put('settings')
  @ApiOperation({ summary: 'Update notification settings' })
  @SwaggerApiResponse({ status: 200, description: 'Settings updated successfully' })
  async updateNotificationSettings(
    @Body() settingsData: {
      emailEnabled?: boolean;
      smsEnabled?: boolean;
      pushEnabled?: boolean;
      marketingEmails?: boolean;
      transactionalEmails?: boolean;
      marketingSms?: boolean;
      transactionalSms?: boolean;
      pushMarketing?: boolean;
      pushTransactional?: boolean;
      frequency?: string;
      quietHours?: {
        enabled: boolean;
        start: string;
        end: string;
      };
    },
    @CurrentUser() user?: any
  ): Promise<ApiResponse<any>> {
    const settings = await this.notificationsService.updateNotificationSettings(user?.id, settingsData);
    return {
      success: true,
      data: settings,
    };
  }

  // Preferences endpoints
  @Get('preferences')
  @ApiOperation({ summary: 'Get notification preferences' })
  @SwaggerApiResponse({ status: 200, description: 'Preferences retrieved successfully' })
  async getNotificationPreferences(@CurrentUser() user?: any): Promise<ApiResponse<any>> {
    const preferences = await this.notificationsService.getNotificationPreferences(user?.id);
    return {
      success: true,
      data: preferences,
    };
  }

  @Put('preferences')
  @ApiOperation({ summary: 'Update notification preferences' })
  @SwaggerApiResponse({ status: 200, description: 'Preferences updated successfully' })
  async updateNotificationPreferences(
    @Body() preferencesData: {
      orderUpdates?: boolean;
      deliveryUpdates?: boolean;
      paymentUpdates?: boolean;
      promotionalOffers?: boolean;
      newsletters?: boolean;
      accountUpdates?: boolean;
      securityAlerts?: boolean;
      systemUpdates?: boolean;
      recommendations?: boolean;
      reviews?: boolean;
      socialUpdates?: boolean;
    },
    @CurrentUser() user?: any
  ): Promise<ApiResponse<any>> {
    const preferences = await this.notificationsService.updateNotificationPreferences(user?.id, preferencesData);
    return {
      success: true,
      data: preferences,
    };
  }
}
