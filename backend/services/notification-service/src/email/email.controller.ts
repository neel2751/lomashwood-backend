import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/common/decorators/roles.decorator';
import { CurrentUser } from '../auth/common/decorators/current-user.decorator';
import { EmailService } from './email.service';
import { SendEmailDto } from './dto/send-email.dto';
import { ApiResponse } from '../../../../packages/api-client/src/types/api.types';

@ApiTags('email')
@Controller('email')
@UseGuards(JwtAuthGuard)
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('send')
  @ApiOperation({ summary: 'Send email' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 201, description: 'Email sent successfully' })
  async sendEmail(@Body() sendEmailDto: SendEmailDto): Promise<ApiResponse<any>> {
    const result = await this.emailService.sendEmail(sendEmailDto);
    return {
      success: true,
      data: result,
    };
  }

  @Post('send-bulk')
  @ApiOperation({ summary: 'Send bulk emails' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 201, description: 'Bulk emails sent successfully' })
  async sendBulkEmail(@Body() bulkData: {
    recipients: string[];
    subject: string;
    content: string;
    template?: string;
    templateData?: any;
    attachments?: any[];
    provider?: string;
  }): Promise<ApiResponse<any>> {
    const result = await this.emailService.sendBulkEmail(bulkData);
    return {
      success: true,
      data: result,
    };
  }

  @Post('send-template')
  @ApiOperation({ summary: 'Send email using template' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 201, description: 'Template email sent successfully' })
  async sendTemplateEmail(@Body() templateData: {
    templateId: string;
    to: string | string[];
    templateData?: any;
    provider?: string;
  }): Promise<ApiResponse<any>> {
    const result = await this.emailService.sendTemplateEmail(templateData);
    return {
      success: true,
      data: result,
    };
  }

  @Get('logs')
  @ApiOperation({ summary: 'Get email logs' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Email logs retrieved successfully' })
  async getEmailLogs(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
    @Query('provider') provider?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string
  ): Promise<ApiResponse<any>> {
    const logs = await this.emailService.getEmailLogs({
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
  @ApiOperation({ summary: 'Get email log by ID' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Email log retrieved successfully' })
  async getEmailLog(@Param('id') id: string): Promise<ApiResponse<any>> {
    const log = await this.emailService.getEmailLog(id);
    if (!log) {
      return {
        success: false,
        message: 'Email log not found',
        error: 'EMAIL_LOG_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: log,
    };
  }

  @Get('templates')
  @ApiOperation({ summary: 'Get email templates' })
  @SwaggerApiResponse({ status: 200, description: 'Email templates retrieved successfully' })
  async getEmailTemplates(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('category') category?: string,
    @Query('search') search?: string
  ): Promise<ApiResponse<any>> {
    const templates = await this.emailService.getEmailTemplates(page, limit, category, search);
    return {
      success: true,
      data: templates,
    };
  }

  @Get('templates/:id')
  @ApiOperation({ summary: 'Get email template by ID' })
  @SwaggerApiResponse({ status: 200, description: 'Email template retrieved successfully' })
  async getEmailTemplate(@Param('id') id: string): Promise<ApiResponse<any>> {
    const template = await this.emailService.getEmailTemplate(id);
    if (!template) {
      return {
        success: false,
        message: 'Email template not found',
        error: 'EMAIL_TEMPLATE_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: template,
    };
  }

  @Post('templates')
  @ApiOperation({ summary: 'Create email template' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 201, description: 'Email template created successfully' })
  async createEmailTemplate(@Body() templateData: {
    name: string;
    subject: string;
    content: string;
    category?: string;
    variables?: string[];
    isActive?: boolean;
    description?: string;
  }): Promise<ApiResponse<any>> {
    const template = await this.emailService.createEmailTemplate(templateData);
    return {
      success: true,
      data: template,
    };
  }

  @Put('templates/:id')
  @ApiOperation({ summary: 'Update email template' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Email template updated successfully' })
  async updateEmailTemplate(
    @Param('id') id: string,
    @Body() templateData: {
      name?: string;
      subject?: string;
      content?: string;
      category?: string;
      variables?: string[];
      isActive?: boolean;
      description?: string;
    }
  ): Promise<ApiResponse<any>> {
    const template = await this.emailService.updateEmailTemplate(id, templateData);
    if (!template) {
      return {
        success: false,
        message: 'Email template not found',
        error: 'EMAIL_TEMPLATE_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: template,
    };
  }

  @Delete('templates/:id')
  @ApiOperation({ summary: 'Delete email template' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Email template deleted successfully' })
  async deleteEmailTemplate(@Param('id') id: string): Promise<ApiResponse<any>> {
    const result = await this.emailService.deleteEmailTemplate(id);
    if (!result) {
      return {
        success: false,
        message: 'Email template not found',
        error: 'EMAIL_TEMPLATE_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: result,
    };
  }

  @Post('test')
  @ApiOperation({ summary: 'Test email configuration' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Email test sent successfully' })
  async testEmail(@Body() testData: {
    to: string;
    provider?: string;
  }): Promise<ApiResponse<any>> {
    const result = await this.emailService.testEmail(testData.to, testData.provider);
    return {
      success: true,
      data: result,
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get email statistics' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Email statistics retrieved successfully' })
  async getEmailStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('provider') provider?: string
  ): Promise<ApiResponse<any>> {
    const stats = await this.emailService.getEmailStats(
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
  @ApiOperation({ summary: 'Get available email providers' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Email providers retrieved successfully' })
  async getEmailProviders(): Promise<ApiResponse<any>> {
    const providers = await this.emailService.getEmailProviders();
    return {
      success: true,
      data: providers,
    };
  }

  @Post('resend/:id')
  @ApiOperation({ summary: 'Resend failed email' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Email resent successfully' })
  async resendEmail(@Param('id') id: string): Promise<ApiResponse<any>> {
    const result = await this.emailService.resendEmail(id);
    if (!result) {
      return {
        success: false,
        message: 'Email log not found or cannot be resent',
        error: 'EMAIL_RESEND_FAILED',
      };
    }
    return {
      success: true,
      data: result,
    };
  }

  @Post('preview')
  @ApiOperation({ summary: 'Preview email template' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Email preview generated successfully' })
  async previewEmail(@Body() previewData: {
    templateId: string;
    templateData?: any;
  }): Promise<ApiResponse<any>> {
    const preview = await this.emailService.previewEmail(previewData.templateId, previewData.templateData);
    return {
      success: true,
      data: preview,
    };
  }

  @Get('bounces')
  @ApiOperation({ summary: 'Get email bounces' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Email bounces retrieved successfully' })
  async getEmailBounces(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('email') email?: string
  ): Promise<ApiResponse<any>> {
    const bounces = await this.emailService.getEmailBounces({
      page,
      limit,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      email,
    });
    return {
      success: true,
      data: bounces,
    };
  }

  @Get('complaints')
  @ApiOperation({ summary: 'Get email complaints' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Email complaints retrieved successfully' })
  async getEmailComplaints(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('email') email?: string
  ): Promise<ApiResponse<any>> {
    const complaints = await this.emailService.getEmailComplaints({
      page,
      limit,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      email,
    });
    return {
      success: true,
      data: complaints,
    };
  }

  @Post('unsubscribe/:token')
  @ApiOperation({ summary: 'Unsubscribe from emails' })
  @SwaggerApiResponse({ status: 200, description: 'Unsubscribe processed successfully' })
  async unsubscribe(@Param('token') token: string): Promise<ApiResponse<any>> {
    const result = await this.emailService.unsubscribe(token);
    return {
      success: true,
      data: result,
    };
  }

  @Get('subscriptions/:email')
  @ApiOperation({ summary: 'Get email subscriptions' })
  @SwaggerApiResponse({ status: 200, description: 'Email subscriptions retrieved successfully' })
  async getEmailSubscriptions(@Param('email') email: string): Promise<ApiResponse<any>> {
    const subscriptions = await this.emailService.getEmailSubscriptions(email);
    return {
      success: true,
      data: subscriptions,
    };
  }

  @Put('subscriptions/:email')
  @ApiOperation({ summary: 'Update email subscriptions' })
  @SwaggerApiResponse({ status: 200, description: 'Email subscriptions updated successfully' })
  async updateEmailSubscriptions(
    @Param('email') email: string,
    @Body() subscriptionData: {
      marketing?: boolean;
      newsletters?: boolean;
      promotions?: boolean;
      updates?: boolean;
      security?: boolean;
    }
  ): Promise<ApiResponse<any>> {
    const subscriptions = await this.emailService.updateEmailSubscriptions(email, subscriptionData);
    return {
      success: true,
      data: subscriptions,
    };
  }

  @Get('webhooks')
  @ApiOperation({ summary: 'Get email webhook configurations' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Webhook configurations retrieved successfully' })
  async getEmailWebhooks(): Promise<ApiResponse<any>> {
    const webhooks = await this.emailService.getEmailWebhooks();
    return {
      success: true,
      data: webhooks,
    };
  }

  @Post('webhooks')
  @ApiOperation({ summary: 'Create email webhook' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 201, description: 'Email webhook created successfully' })
  async createEmailWebhook(@Body() webhookData: {
    url: string;
    events: string[];
    secret?: string;
    isActive?: boolean;
  }): Promise<ApiResponse<any>> {
    const webhook = await this.emailService.createEmailWebhook(webhookData);
    return {
      success: true,
      data: webhook,
    };
  }

  @Put('webhooks/:id')
  @ApiOperation({ summary: 'Update email webhook' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Email webhook updated successfully' })
  async updateEmailWebhook(
    @Param('id') id: string,
    @Body() webhookData: {
      url?: string;
      events?: string[];
      secret?: string;
      isActive?: boolean;
    }
  ): Promise<ApiResponse<any>> {
    const webhook = await this.emailService.updateEmailWebhook(id, webhookData);
    if (!webhook) {
      return {
        success: false,
        message: 'Email webhook not found',
        error: 'EMAIL_WEBHOOK_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: webhook,
    };
  }

  @Delete('webhooks/:id')
  @ApiOperation({ summary: 'Delete email webhook' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Email webhook deleted successfully' })
  async deleteEmailWebhook(@Param('id') id: string): Promise<ApiResponse<any>> {
    const result = await this.emailService.deleteEmailWebhook(id);
    if (!result) {
      return {
        success: false,
        message: 'Email webhook not found',
        error: 'EMAIL_WEBHOOK_NOT_FOUND',
      };
    }
    return {
      success: true,
      data: result,
    };
  }
}
