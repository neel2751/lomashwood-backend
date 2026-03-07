import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/common/decorators/roles.decorator';
import { CurrentUser } from '../auth/common/decorators/current-user.decorator';
import { PushService } from './push.service';
import { SendPushDto } from './dto/send-push.dto';
import { ApiResponse } from '../../../../packages/api-client/src/types/api.types';

@ApiTags('push')
@Controller('push')
@UseGuards(JwtAuthGuard)
export class PushController {
  constructor(private readonly pushService: PushService) {}

  @Post('send')
  @ApiOperation({ summary: 'Send push notification' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 201, description: 'Push notification sent successfully' })
  async sendPush(@Body() sendPushDto: SendPushDto): Promise<ApiResponse<any>> {
    const result = await this.pushService.sendPush(sendPushDto);
    return {
      success: true,
      data: result,
    };
  }

  @Post('send-bulk')
  @ApiOperation({ summary: 'Send bulk push notifications' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 201, description: 'Bulk push notifications sent successfully' })
  async sendBulkPush(@Body() sendBulkPushDto: { tokens: string[]; notification: any; data?: any }): Promise<ApiResponse<any>> {
    const result = await this.pushService.sendBulkPush(sendBulkPushDto.tokens, sendBulkPushDto.notification, sendBulkPushDto.data);
    return {
      success: true,
      data: result,
    };
  }

  @Post('send-to-topic')
  @ApiOperation({ summary: 'Send push notification to topic' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 201, description: 'Push notification sent to topic successfully' })
  async sendToTopic(@Body() sendToTopicDto: { topic: string; notification: any; data?: any }): Promise<ApiResponse<any>> {
    const result = await this.pushService.sendToTopic(sendToTopicDto.topic, sendToTopicDto.notification, sendToTopicDto.data);
    return {
      success: true,
      data: result,
    };
  }

  @Post('send-to-condition')
  @ApiOperation({ summary: 'Send push notification to condition' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 201, description: 'Push notification sent to condition successfully' })
  async sendToCondition(@Body() sendToConditionDto: { condition: string; notification: any; data?: any }): Promise<ApiResponse<any>> {
    const result = await this.pushService.sendToCondition(sendToConditionDto.condition, sendToConditionDto.notification, sendToConditionDto.data);
    return {
      success: true,
      data: result,
    };
  }

  @Get('logs')
  @ApiOperation({ summary: 'Get push notification logs' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Push notification logs retrieved successfully' })
  async getPushLogs(@Query() query: any): Promise<ApiResponse<any>> {
    const result = await this.pushService.getPushLogs(query);
    return {
      success: true,
      data: result,
    };
  }

  @Get('logs/:id')
  @ApiOperation({ summary: 'Get push notification log by ID' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Push notification log retrieved successfully' })
  async getPushLogById(@Param('id') id: string): Promise<ApiResponse<any>> {
    const result = await this.pushService.getPushLogById(id);
    return {
      success: true,
      data: result,
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get push notification statistics' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Push notification statistics retrieved successfully' })
  async getPushStats(@Query() query: any): Promise<ApiResponse<any>> {
    const result = await this.pushService.getPushStats(query);
    return {
      success: true,
      data: result,
    };
  }

  @Get('providers')
  @ApiOperation({ summary: 'Get available push notification providers' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Push notification providers retrieved successfully' })
  async getPushProviders(): Promise<ApiResponse<any>> {
    const result = await this.pushService.getPushProviders();
    return {
      success: true,
      data: result,
    };
  }

  @Post('resend/:id')
  @ApiOperation({ summary: 'Resend push notification' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Push notification resent successfully' })
  async resendPush(@Param('id') id: string): Promise<ApiResponse<any>> {
    const result = await this.pushService.resendPush(id);
    return {
      success: true,
      data: result,
    };
  }

  @Post('preview')
  @ApiOperation({ summary: 'Preview push notification' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Push notification preview generated successfully' })
  async previewPush(@Body() previewDto: { notification: any; data?: any }): Promise<ApiResponse<any>> {
    const result = await this.pushService.previewPush(previewDto.notification, previewDto.data);
    return {
      success: true,
      data: result,
    };
  }

  @Get('topics')
  @ApiOperation({ summary: 'Get available topics' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Topics retrieved successfully' })
  async getTopics(): Promise<ApiResponse<any>> {
    const result = await this.pushService.getTopics();
    return {
      success: true,
      data: result,
    };
  }

  @Post('subscribe-to-topic')
  @ApiOperation({ summary: 'Subscribe to topic' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Subscribed to topic successfully' })
  async subscribeToTopic(@Body() subscribeDto: { token: string; topic: string }): Promise<ApiResponse<any>> {
    const result = await this.pushService.subscribeToTopic(subscribeDto.token, subscribeDto.topic);
    return {
      success: true,
      data: result,
    };
  }

  @Post('unsubscribe-from-topic')
  @ApiOperation({ summary: 'Unsubscribe from topic' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Unsubscribed from topic successfully' })
  async unsubscribeFromTopic(@Body() unsubscribeDto: { token: string; topic: string }): Promise<ApiResponse<any>> {
    const result = await this.pushService.unsubscribeFromTopic(unsubscribeDto.token, unsubscribeDto.topic);
    return {
      success: true,
      data: result,
    };
  }

  @Get('device-tokens')
  @ApiOperation({ summary: 'Get device tokens' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Device tokens retrieved successfully' })
  async getDeviceTokens(@Query() query: any): Promise<ApiResponse<any>> {
    const result = await this.pushService.getDeviceTokens(query);
    return {
      success: true,
      data: result,
    };
  }

  @Post('register-device')
  @ApiOperation({ summary: 'Register device token' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 201, description: 'Device token registered successfully' })
  async registerDevice(@Body() registerDto: { token: string; userId?: string; platform?: string; metadata?: any }): Promise<ApiResponse<any>> {
    const result = await this.pushService.registerDevice(registerDto.token, registerDto.userId, registerDto.platform, registerDto.metadata);
    return {
      success: true,
      data: result,
    };
  }

  @Delete('unregister-device/:token')
  @ApiOperation({ summary: 'Unregister device token' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Device token unregistered successfully' })
  async unregisterDevice(@Param('token') token: string): Promise<ApiResponse<any>> {
    const result = await this.pushService.unregisterDevice(token);
    return {
      success: true,
      data: result,
    };
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get push notification analytics' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Push notification analytics retrieved successfully' })
  async getPushAnalytics(@Query() query: any): Promise<ApiResponse<any>> {
    const result = await this.pushService.getPushAnalytics(query);
    return {
      success: true,
      data: result,
    };
  }

  @Get('delivery-reports')
  @ApiOperation({ summary: 'Get delivery reports' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Delivery reports retrieved successfully' })
  async getDeliveryReports(@Query() query: any): Promise<ApiResponse<any>> {
    const result = await this.pushService.getDeliveryReports(query);
    return {
      success: true,
      data: result,
    };
  }

  @Get('bounces')
  @ApiOperation({ summary: 'Get push notification bounces' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Push notification bounces retrieved successfully' })
  async getPushBounces(@Query() query: any): Promise<ApiResponse<any>> {
    const result = await this.pushService.getPushBounces(query);
    return {
      success: true,
      data: result,
    };
  }

  @Post('schedule')
  @ApiOperation({ summary: 'Schedule push notification' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 201, description: 'Push notification scheduled successfully' })
  async schedulePush(@Body() scheduleDto: { notification: any; data?: any; scheduledAt: Date; timezone?: string }): Promise<ApiResponse<any>> {
    const result = await this.pushService.schedulePush(scheduleDto.notification, scheduleDto.data, scheduleDto.scheduledAt, scheduleDto.timezone);
    return {
      success: true,
      data: result,
    };
  }

  @Get('scheduled')
  @ApiOperation({ summary: 'Get scheduled push notifications' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Scheduled push notifications retrieved successfully' })
  async getScheduledPushNotifications(@Query() query: any): Promise<ApiResponse<any>> {
    const result = await this.pushService.getScheduledPushNotifications(query);
    return {
      success: true,
      data: result,
    };
  }

  @Put('scheduled/:id')
  @ApiOperation({ summary: 'Update scheduled push notification' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Scheduled push notification updated successfully' })
  async updateScheduledPush(@Param('id') id: string, @Body() updateDto: any): Promise<ApiResponse<any>> {
    const result = await this.pushService.updateScheduledPush(id, updateDto);
    return {
      success: true,
      data: result,
    };
  }

  @Delete('scheduled/:id')
  @ApiOperation({ summary: 'Cancel scheduled push notification' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Scheduled push notification cancelled successfully' })
  async cancelScheduledPush(@Param('id') id: string): Promise<ApiResponse<any>> {
    const result = await this.pushService.cancelScheduledPush(id);
    return {
      success: true,
      data: result,
    };
  }

  @Post('webhooks')
  @ApiOperation({ summary: 'Create webhook' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 201, description: 'Webhook created successfully' })
  async createWebhook(@Body() webhookDto: { url: string; events: string[]; secret?: string; headers?: any }): Promise<ApiResponse<any>> {
    const result = await this.pushService.createWebhook(webhookDto);
    return {
      success: true,
      data: result,
    };
  }

  @Get('webhooks')
  @ApiOperation({ summary: 'Get webhooks' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Webhooks retrieved successfully' })
  async getWebhooks(): Promise<ApiResponse<any>> {
    const result = await this.pushService.getWebhooks();
    return {
      success: true,
      data: result,
    };
  }

  @Get('webhooks/:id')
  @ApiOperation({ summary: 'Get webhook by ID' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Webhook retrieved successfully' })
  async getWebhookById(@Param('id') id: string): Promise<ApiResponse<any>> {
    const result = await this.pushService.getWebhookById(id);
    return {
      success: true,
      data: result,
    };
  }

  @Put('webhooks/:id')
  @ApiOperation({ summary: 'Update webhook' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Webhook updated successfully' })
  async updateWebhook(@Param('id') id: string, @Body() updateDto: any): Promise<ApiResponse<any>> {
    const result = await this.pushService.updateWebhook(id, updateDto);
    return {
      success: true,
      data: result,
    };
  }

  @Delete('webhooks/:id')
  @ApiOperation({ summary: 'Delete webhook' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Webhook deleted successfully' })
  async deleteWebhook(@Param('id') id: string): Promise<ApiResponse<any>> {
    const result = await this.pushService.deleteWebhook(id);
    return {
      success: true,
      data: result,
    };
  }

  @Post('test-connection')
  @ApiOperation({ summary: 'Test push notification provider connection' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Connection test successful' })
  async testConnection(@Body() testDto: { provider?: string }): Promise<ApiResponse<any>> {
    const result = await this.pushService.testConnection(testDto.provider);
    return {
      success: true,
      data: result,
    };
  }

  @Get('usage')
  @ApiOperation({ summary: 'Get push notification usage' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Push notification usage retrieved successfully' })
  async getPushUsage(@Query() query: any): Promise<ApiResponse<any>> {
    const result = await this.pushService.getPushUsage(query);
    return {
      success: true,
      data: result,
    };
  }

  @Post('validate-token')
  @ApiOperation({ summary: 'Validate device token' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Device token validated successfully' })
  async validateToken(@Body() validateDto: { token: string }): Promise<ApiResponse<any>> {
    const result = await this.pushService.validateToken(validateDto.token);
    return {
      success: true,
      data: result,
    };
  }

  @Get('platform-stats')
  @ApiOperation({ summary: 'Get platform statistics' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Platform statistics retrieved successfully' })
  async getPlatformStats(@Query() query: any): Promise<ApiResponse<any>> {
    const result = await this.pushService.getPlatformStats(query);
    return {
      success: true,
      data: result,
    };
  }

  @Post('send-multicast')
  @ApiOperation({ summary: 'Send multicast push notification' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 201, description: 'Multicast push notification sent successfully' })
  async sendMulticast(@Body() multicastDto: { tokens: string[]; notification: any; data?: any }): Promise<ApiResponse<any>> {
    const result = await this.pushService.sendMulticast(multicastDto.tokens, multicastDto.notification, multicastDto.data);
    return {
      success: true,
      data: result,
    };
  }

  @Get('batch-status/:batchId')
  @ApiOperation({ summary: 'Get batch status' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Batch status retrieved successfully' })
  async getBatchStatus(@Param('batchId') batchId: string): Promise<ApiResponse<any>> {
    const result = await this.pushService.getBatchStatus(batchId);
    return {
      success: true,
      data: result,
    };
  }

  @Post('preferences')
  @ApiOperation({ summary: 'Set push notification preferences' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 201, description: 'Push notification preferences set successfully' })
  async setPushPreferences(@Body() preferencesDto: { userId: string; preferences: any }): Promise<ApiResponse<any>> {
    const result = await this.pushService.setPushPreferences(preferencesDto.userId, preferencesDto.preferences);
    return {
      success: true,
      data: result,
    };
  }

  @Get('preferences/:userId')
  @ApiOperation({ summary: 'Get push notification preferences' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Push notification preferences retrieved successfully' })
  async getPushPreferences(@Param('userId') userId: string): Promise<ApiResponse<any>> {
    const result = await this.pushService.getPushPreferences(userId);
    return {
      success: true,
      data: result,
    };
  }

  @Post('unsubscribe')
  @ApiOperation({ summary: 'Unsubscribe from push notifications' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Unsubscribed from push notifications successfully' })
  async unsubscribeFromPush(@Body() unsubscribeDto: { token: string; reason?: string }): Promise<ApiResponse<any>> {
    const result = await this.pushService.unsubscribeFromPush(unsubscribeDto.token, unsubscribeDto.reason);
    return {
      success: true,
      data: result,
    };
  }

  @Post('resubscribe')
  @ApiOperation({ summary: 'Resubscribe to push notifications' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Resubscribed to push notifications successfully' })
  async resubscribeToPush(@Body() resubscribeDto: { token: string }): Promise<ApiResponse<any>> {
    const result = await this.pushService.resubscribeToPush(resubscribeDto.token);
    return {
      success: true,
      data: result,
    };
  }

  @Get('segments')
  @ApiOperation({ summary: 'Get audience segments' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Audience segments retrieved successfully' })
  async getAudienceSegments(@Query() query: any): Promise<ApiResponse<any>> {
    const result = await this.pushService.getAudienceSegments(query);
    return {
      success: true,
      data: result,
    };
  }

  @Post('send-to-segment')
  @ApiOperation({ summary: 'Send push notification to segment' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 201, description: 'Push notification sent to segment successfully' })
  async sendToSegment(@Body() segmentDto: { segmentId: string; notification: any; data?: any }): Promise<ApiResponse<any>> {
    const result = await this.pushService.sendToSegment(segmentDto.segmentId, segmentDto.notification, segmentDto.data);
    return {
      success: true,
      data: result,
    };
  }

  @Get('campaigns')
  @ApiOperation({ summary: 'Get push notification campaigns' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Push notification campaigns retrieved successfully' })
  async getPushCampaigns(@Query() query: any): Promise<ApiResponse<any>> {
    const result = await this.pushService.getPushCampaigns(query);
    return {
      success: true,
      data: result,
    };
  }

  @Post('campaigns')
  @ApiOperation({ summary: 'Create push notification campaign' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 201, description: 'Push notification campaign created successfully' })
  async createPushCampaign(@Body() campaignDto: any): Promise<ApiResponse<any>> {
    const result = await this.pushService.createPushCampaign(campaignDto);
    return {
      success: true,
      data: result,
    };
  }

  @Get('campaigns/:id')
  @ApiOperation({ summary: 'Get push notification campaign by ID' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Push notification campaign retrieved successfully' })
  async getPushCampaignById(@Param('id') id: string): Promise<ApiResponse<any>> {
    const result = await this.pushService.getPushCampaignById(id);
    return {
      success: true,
      data: result,
    };
  }

  @Put('campaigns/:id')
  @ApiOperation({ summary: 'Update push notification campaign' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Push notification campaign updated successfully' })
  async updatePushCampaign(@Param('id') id: string, @Body() updateDto: any): Promise<ApiResponse<any>> {
    const result = await this.pushService.updatePushCampaign(id, updateDto);
    return {
      success: true,
      data: result,
    };
  }

  @Delete('campaigns/:id')
  @ApiOperation({ summary: 'Delete push notification campaign' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Push notification campaign deleted successfully' })
  async deletePushCampaign(@Param('id') id: string): Promise<ApiResponse<any>> {
    const result = await this.pushService.deletePushCampaign(id);
    return {
      success: true,
      data: result,
    };
  }

  @Post('campaigns/:id/send')
  @ApiOperation({ summary: 'Send push notification campaign' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Push notification campaign sent successfully' })
  async sendPushCampaign(@Param('id') id: string): Promise<ApiResponse<any>> {
    const result = await this.pushService.sendPushCampaign(id);
    return {
      success: true,
      data: result,
    };
  }

  @Get('templates')
  @ApiOperation({ summary: 'Get push notification templates' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Push notification templates retrieved successfully' })
  async getPushTemplates(@Query() query: any): Promise<ApiResponse<any>> {
    const result = await this.pushService.getPushTemplates(query);
    return {
      success: true,
      data: result,
    };
  }

  @Post('templates')
  @ApiOperation({ summary: 'Create push notification template' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 201, description: 'Push notification template created successfully' })
  async createPushTemplate(@Body() templateDto: any): Promise<ApiResponse<any>> {
    const result = await this.pushService.createPushTemplate(templateDto);
    return {
      success: true,
      data: result,
    };
  }

  @Get('templates/:id')
  @ApiOperation({ summary: 'Get push notification template by ID' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Push notification template retrieved successfully' })
  async getPushTemplateById(@Param('id') id: string): Promise<ApiResponse<any>> {
    const result = await this.pushService.getPushTemplateById(id);
    return {
      success: true,
      data: result,
    };
  }

  @Put('templates/:id')
  @ApiOperation({ summary: 'Update push notification template' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Push notification template updated successfully' })
  async updatePushTemplate(@Param('id') id: string, @Body() updateDto: any): Promise<ApiResponse<any>> {
    const result = await this.pushService.updatePushTemplate(id, updateDto);
    return {
      success: true,
      data: result,
    };
  }

  @Delete('templates/:id')
  @ApiOperation({ summary: 'Delete push notification template' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Push notification template deleted successfully' })
  async deletePushTemplate(@Param('id') id: string): Promise<ApiResponse<any>> {
    const result = await this.pushService.deletePushTemplate(id);
    return {
      success: true,
      data: result,
    };
  }

  @Post('templates/:id/send')
  @ApiOperation({ summary: 'Send push notification using template' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Push notification sent using template successfully' })
  async sendPushTemplate(@Param('id') id: string, @Body() sendDto: { tokens: string[]; data?: any }): Promise<ApiResponse<any>> {
    const result = await this.pushService.sendPushTemplate(id, sendDto.tokens, sendDto.data);
    return {
      success: true,
      data: result,
    };
  }
}
