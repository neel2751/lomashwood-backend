import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/common/decorators/roles.decorator';
import { CurrentUser } from '../auth/common/decorators/current-user.decorator';
import { SmsService } from './sms.service';
import { SendSmsDto } from './dto/send-sms.dto';
import { ApiResponse } from '../../../../packages/api-client/src/types/api.types';

@ApiTags('sms')
@Controller('sms')
@UseGuards(JwtAuthGuard)
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  @Post('send')
  @ApiOperation({ summary: 'Send SMS' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 201, description: 'SMS sent successfully' })
  async sendSms(@Body() sendSmsDto: SendSmsDto): Promise<ApiResponse<any>> {
    const result = await this.smsService.sendSms(sendSmsDto);
    return {
      success: true,
      data: result,
    };
  }

  @Post('send-bulk')
  @ApiOperation({ summary: 'Send bulk SMS' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 201, description: 'Bulk SMS sent successfully' })
  async sendBulkSms(@Body() bulkData: {
    recipients: string[];
    message: string;
    template?: string;
    templateData?: any;
    provider?: string;
  }): Promise<ApiResponse<any>> {
    const result = await this.smsService.sendBulkSms(bulkData);
    return {
      success: true,
      data: result,
    };
  }

  @Post('send-template')
  @ApiOperation({ summary: 'Send SMS using template' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 201, description: 'Template SMS sent successfully' })
  async sendTemplateSms(@Body() templateData: {
    templateId: string;
    to: string | string[];
    templateData?: any;
    provider?: string;
  }): Promise<ApiResponse<any>> {
    const result = await this.smsService.sendTemplateSms(templateData);
    return {
      success: true,
      data: result,
    };
  }

  @Post('send-otp')
  @ApiOperation({ summary: 'Send OTP SMS' })
  @SwaggerApiResponse({ status: 201, description: 'OTP SMS sent successfully' })
  async sendOtpSms(@Body() otpData: {
    to: string;
    purpose: string;
    length?: number;
    expiry?: number;
    provider?: string;
  }): Promise<ApiResponse<any>> {
    const result = await this.smsService.sendOtpSms(otpData);
    return {
      success: true,
      data: result,
    };
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify OTP SMS' })
  @SwaggerApiResponse({ status: 200, description: 'OTP verified successfully' })
  async verifyOtpSms(@Body() verifyData: {
    to: string;
    otp: string;
    purpose: string;
  }): Promise<ApiResponse<any>> {
    const result = await this.smsService.verifyOtpSms(verifyData.to, verifyData.otp, verifyData.purpose);
    return {
      success: true,
      data: result,
    };
  }

  @Get('logs')
  @ApiOperation({ summary: 'Get SMS logs' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'SMS logs retrieved successfully' })
  async getSmsLogs(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
    @Query('provider') provider?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string
  ): Promise<ApiResponse<any>> {
    const logs = await this.smsService.getSmsLogs({
      page,
      limit,
      status,
      provider,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      search,
    });
    return {
      success: true,
      data: logs,
    };
  }

  @Get('logs/:id')
  @ApiOperation({ summary: 'Get SMS log by ID' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'SMS log retrieved successfully' })
  async getSmsLog(@Param('id') id: string): Promise<ApiResponse<any>> {
    const log = await this.smsService.getSmsLog(id);
    if (!log) {
      return {
        success: false,
        message: 'SMS log not found',
        error: 'SMS_LOG_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: log,
    };
  }

  @Get('templates')
  @ApiOperation({ summary: 'Get SMS templates' })
  @SwaggerApiResponse({ status: 200, description: 'SMS templates retrieved successfully' })
  async getSmsTemplates(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('category') category?: string,
    @Query('search') search?: string
  ): Promise<ApiResponse<any>> {
    const templates = await this.smsService.getSmsTemplates(page, limit, category, search);
    return {
      success: true,
      data: templates,
    };
  }

  @Get('templates/:id')
  @ApiOperation({ summary: 'Get SMS template by ID' })
  @SwaggerApiResponse({ status: 200, description: 'SMS template retrieved successfully' })
  async getSmsTemplate(@Param('id') id: string): Promise<ApiResponse<any>> {
    const template = await this.smsService.getSmsTemplate(id);
    if (!template) {
      return {
        success: false,
        message: 'SMS template not found',
        error: 'SMS_TEMPLATE_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: template,
    };
  }

  @Post('templates')
  @ApiOperation({ summary: 'Create SMS template' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 201, description: 'SMS template created successfully' })
  async createSmsTemplate(@Body() templateData: {
    name: string;
    content: string;
    category?: string;
    variables?: string[];
    isActive?: boolean;
    description?: string;
  }): Promise<ApiResponse<any>> {
    const template = await this.smsService.createSmsTemplate(templateData);
    return {
      success: true,
      data: template,
    };
  }

  @Put('templates/:id')
  @ApiOperation({ summary: 'Update SMS template' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'SMS template updated successfully' })
  async updateSmsTemplate(
    @Param('id') id: string,
    @Body() templateData: {
      name?: string;
      content?: string;
      category?: string;
      variables?: string[];
      isActive?: boolean;
      description?: string;
    }
  ): Promise<ApiResponse<any>> {
    const template = await this.smsService.updateSmsTemplate(id, templateData);
    if (!template) {
      return {
        success: false,
        message: 'SMS template not found',
        error: 'SMS_TEMPLATE_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: template,
    };
  }

  @Delete('templates/:id')
  @ApiOperation({ summary: 'Delete SMS template' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'SMS template deleted successfully' })
  async deleteSmsTemplate(@Param('id') id: string): Promise<ApiResponse<any>> {
    const result = await this.smsService.deleteSmsTemplate(id);
    if (!result) {
      return {
        success: false,
        message: 'SMS template not found',
        error: 'SMS_TEMPLATE_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: result,
    };
  }

  @Post('test')
  @ApiOperation({ summary: 'Test SMS configuration' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'SMS test sent successfully' })
  async testSms(@Body() testData: {
    to: string;
    provider?: string;
  }): Promise<ApiResponse<any>> {
    const result = await this.smsService.testSms(testData.to, testData.provider);
    return {
      success: true,
      data: result,
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get SMS statistics' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'SMS statistics retrieved successfully' })
  async getSmsStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('provider') provider?: string
  ): Promise<ApiResponse<any>> {
    const stats = await this.smsService.getSmsStats(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      provider
    );
    return {
      success: true,
      data: stats,
    };
  }

  @Get('providers')
  @ApiOperation({ summary: 'Get available SMS providers' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'SMS providers retrieved successfully' })
  async getSmsProviders(): Promise<ApiResponse<any>> {
    const providers = await this.smsService.getSmsProviders();
    return {
      success: true,
      data: providers,
    };
  }

  @Post('resend/:id')
  @ApiOperation({ summary: 'Resend failed SMS' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'SMS resent successfully' })
  async resendSms(@Param('id') id: string): Promise<ApiResponse<any>> {
    const result = await this.smsService.resendSms(id);
    if (!result) {
      return {
        success: false,
        message: 'SMS log not found or cannot be resent',
        error: 'SMS_RESEND_FAILED',
      };
    }
    return {
      success: true,
      data: result,
    };
  }

  @Post('preview')
  @ApiOperation({ summary: 'Preview SMS template' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'SMS preview generated successfully' })
  async previewSms(@Body() previewData: {
    templateId: string;
    templateData?: any;
  }): Promise<ApiResponse<any>> {
    const preview = await this.smsService.previewSms(previewData.templateId, previewData.templateData);
    return {
      success: true,
      data: preview,
    };
  }

  @Get('bounces')
  @ApiOperation({ summary: 'Get SMS bounces' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'SMS bounces retrieved successfully' })
  async getSmsBounces(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('phone') phone?: string
  ): Promise<ApiResponse<any>> {
    const bounces = await this.smsService.getSmsBounces({
      page,
      limit,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      phone,
    });
    return {
      success: true,
      data: bounces,
    };
  }

  @Get('delivery-reports')
  @ApiOperation({ summary: 'Get SMS delivery reports' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'SMS delivery reports retrieved successfully' })
  async getSmsDeliveryReports(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ): Promise<ApiResponse<any>> {
    const reports = await this.smsService.getSmsDeliveryReports({
      page,
      limit,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
    return {
      success: true,
      data: reports,
    };
  }

  @Post('schedule')
  @ApiOperation({ summary: 'Schedule SMS' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 201, description: 'SMS scheduled successfully' })
  async scheduleSms(@Body() scheduleData: {
    to: string | string[];
    message: string;
    scheduledAt: string;
    template?: string;
    templateData?: any;
    provider?: string;
  }): Promise<ApiResponse<any>> {
    const result = await this.smsService.scheduleSms(scheduleData);
    return {
      success: true,
      data: result,
    };
  }

  @Get('scheduled')
  @ApiOperation({ summary: 'Get scheduled SMS' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Scheduled SMS retrieved successfully' })
  async getScheduledSms(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ): Promise<ApiResponse<any>> {
    const scheduled = await this.smsService.getScheduledSms({
      page,
      limit,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
    return {
      success: true,
      data: scheduled,
    };
  }

  @Put('scheduled/:id/cancel')
  @ApiOperation({ summary: 'Cancel scheduled SMS' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Scheduled SMS cancelled successfully' })
  async cancelScheduledSms(@Param('id') id: string): Promise<ApiResponse<any>> {
    const result = await this.smsService.cancelScheduledSms(id);
    if (!result) {
      return {
        success: false,
        message: 'Scheduled SMS not found or cannot be cancelled',
        error: 'SCHEDULED_SMS_CANCEL_FAILED',
      };
    }
    return {
      success: true,
      data: result,
    };
  }

  @Post('webhooks/inbound')
  @ApiOperation({ summary: 'Handle inbound SMS webhook' })
  async handleInboundSmsWebhook(@Body() webhookData: any): Promise<ApiResponse<any>> {
    const result = await this.smsService.handleInboundSmsWebhook(webhookData);
    return {
      success: true,
      data: result,
    };
  }

  @Post('webhooks/delivery')
  @ApiOperation({ summary: 'Handle SMS delivery webhook' })
  async handleSmsDeliveryWebhook(@Body() webhookData: any): Promise<ApiResponse<any>> {
    const result = await this.smsService.handleSmsDeliveryWebhook(webhookData);
    return {
      success: true,
      data: result,
    };
  }

  @Get('webhooks')
  @ApiOperation({ summary: 'Get SMS webhook configurations' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Webhook configurations retrieved successfully' })
  async getSmsWebhooks(): Promise<ApiResponse<any>> {
    const webhooks = await this.smsService.getSmsWebhooks();
    return {
      success: true,
      data: webhooks,
    };
  }

  @Post('webhooks')
  @ApiOperation({ summary: 'Create SMS webhook' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 201, description: 'SMS webhook created successfully' })
  async createSmsWebhook(@Body() webhookData: {
    url: string;
    events: string[];
    secret?: string;
    isActive?: boolean;
  }): Promise<ApiResponse<any>> {
    const webhook = await this.smsService.createSmsWebhook(webhookData);
    return {
      success: true,
      data: webhook,
    };
  }

  @Put('webhooks/:id')
  @ApiOperation({ summary: 'Update SMS webhook' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'SMS webhook updated successfully' })
  async updateSmsWebhook(
    @Param('id') id: string,
    @Body() webhookData: {
      url?: string;
      events?: string[];
      secret?: string;
      isActive?: boolean;
    }
  ): Promise<ApiResponse<any>> {
    const webhook = await this.smsService.updateSmsWebhook(id, webhookData);
    if (!webhook) {
      return {
        success: false,
        message: 'SMS webhook not found',
        error: 'SMS_WEBHOOK_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: webhook,
    };
  }

  @Delete('webhooks/:id')
  @ApiOperation({ summary: 'Delete SMS webhook' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'SMS webhook deleted successfully' })
  async deleteSmsWebhook(@Param('id') id: string): Promise<ApiResponse<any>> {
    const result = await this.smsService.deleteSmsWebhook(id);
    if (!result) {
      return {
        success: false,
        message: 'SMS webhook not found',
        error: 'SMS_WEBHOOK_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: result,
    };
  }

  @Get('subscriptions/:phone')
  @ApiOperation({ summary: 'Get SMS subscriptions' })
  @SwaggerApiResponse({ status: 200, description: 'SMS subscriptions retrieved successfully' })
  async getSmsSubscriptions(@Param('phone') phone: string): Promise<ApiResponse<any>> {
    const subscriptions = await this.smsService.getSmsSubscriptions(phone);
    return {
      success: true,
      data: subscriptions,
    };
  }

  @Put('subscriptions/:phone')
  @ApiOperation({ summary: 'Update SMS subscriptions' })
  @SwaggerApiResponse({ status: 200, description: 'SMS subscriptions updated successfully' })
  async updateSmsSubscriptions(
    @Param('phone') phone: string,
    @Body() subscriptionData: {
      marketing?: boolean;
      notifications?: boolean;
      alerts?: boolean;
      updates?: boolean;
    }
  ): Promise<ApiResponse<any>> {
    const subscriptions = await this.smsService.updateSmsSubscriptions(phone, subscriptionData);
    return {
      success: true,
      data: subscriptions,
    };
  }

  @Post('unsubscribe/:phone')
  @ApiOperation({ summary: 'Unsubscribe from SMS' })
  async unsubscribeSms(
    @Param('phone') phone: string,
    @Body() unsubscribeData: {
      reason?: string;
      token?: string;
    }
  ): Promise<ApiResponse<any>> {
    const result = await this.smsService.unsubscribeSms(phone, unsubscribeData.reason, unsubscribeData.token);
    return {
      success: true,
      data: result,
    };
  }

  @Get('phone-validation/:phone')
  @ApiOperation({ summary: 'Validate phone number' })
  @SwaggerApiResponse({ status: 200, description: 'Phone number validation result' })
  async validatePhoneNumber(@Param('phone') phone: string): Promise<ApiResponse<any>> {
    const validation = await this.smsService.validatePhoneNumber(phone);
    return {
      success: true,
      data: validation,
    };
  }

  @Get('carrier-lookup/:phone')
  @ApiOperation({ summary: 'Lookup phone carrier' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Phone carrier lookup result' })
  async lookupPhoneCarrier(@Param('phone') phone: string): Promise<ApiResponse<any>> {
    const carrier = await this.smsService.lookupPhoneCarrier(phone);
    return {
      success: true,
      data: carrier,
    };
  }

  @Get('pricing')
  @ApiOperation({ summary: 'Get SMS pricing' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'SMS pricing retrieved successfully' })
  async getSmsPricing(
    @Query('provider') provider?: string,
    @Query('country') country?: string
  ): Promise<ApiResponse<any>> {
    const pricing = await this.smsService.getSmsPricing(provider, country);
    return {
      success: true,
      data: pricing,
    };
  }

  @Get('usage')
  @ApiOperation({ summary: 'Get SMS usage' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'SMS usage retrieved successfully' })
  async getSmsUsage(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('provider') provider?: string,
    @Query('groupBy') groupBy?: string
  ): Promise<ApiResponse<any>> {
    const usage = await this.smsService.getSmsUsage(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      provider,
      groupBy
    );
    return {
      success: true,
      data: usage,
    };
  }

  @Post('blacklist')
  @ApiOperation({ summary: 'Add phone to blacklist' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 201, description: 'Phone added to blacklist successfully' })
  async addToBlacklist(@Body() blacklistData: {
    phone: string;
    reason?: string;
    expiry?: string;
  }): Promise<ApiResponse<any>> {
    const result = await this.smsService.addToBlacklist(blacklistData);
    return {
      success: true,
      data: result,
    };
  }

  @Get('blacklist')
  @ApiOperation({ summary: 'Get phone blacklist' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Phone blacklist retrieved successfully' })
  async getBlacklist(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string
  ): Promise<ApiResponse<any>> {
    const blacklist = await this.smsService.getBlacklist(page, limit, search);
    return {
      success: true,
      data: blacklist,
    };
  }

  @Delete('blacklist/:phone')
  @ApiOperation({ summary: 'Remove phone from blacklist' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Phone removed from blacklist successfully' })
  async removeFromBlacklist(@Param('phone') phone: string): Promise<ApiResponse<any>> {
    const result = await this.smsService.removeFromBlacklist(phone);
    if (!result) {
      return {
        success: false,
        message: 'Phone not found in blacklist',
        error: 'BLACKLIST_PHONE_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: result,
    };
  }
}
