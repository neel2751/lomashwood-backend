import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import { EmailLog } from './entities/email-log.entity';
import { SendEmailDto } from './dto/send-email.dto';
import { SendgridProvider } from './providers/sendgrid.provider';
import { NodemailerProvider } from './providers/nodemailer.provider';

@Injectable()
export class EmailService {
  constructor(
    @InjectRepository(EmailLog)
    private readonly emailLogRepository: Repository<EmailLog>,
    @InjectQueue('emails') private readonly emailQueue: Queue,
    private readonly configService: ConfigService,
    private readonly sendgridProvider: SendgridProvider,
    private readonly nodemailerProvider: NodemailerProvider,
  ) {}

  async sendEmail(sendEmailDto: SendEmailDto): Promise<EmailLog> {
    const emailLog = this.emailLogRepository.create({
      ...sendEmailDto,
      status: 'PENDING',
      sentAt: null,
      deliveredAt: null,
      failedAt: null,
    });

    const savedLog = await this.emailLogRepository.save(emailLog);

    // Add to queue for processing
    await this.emailQueue.add('send-email', {
      emailId: savedLog.id,
      provider: sendEmailDto.provider || 'sendgrid',
    });

    return savedLog;
  }

  async sendBulkEmail(bulkData: {
    recipients: string[];
    subject: string;
    content: string;
    template?: string;
    templateData?: any;
    attachments?: any[];
    provider?: string;
  }): Promise<{ sent: number; failed: number; details: any[] }> {
    const results = {
      sent: 0,
      failed: 0,
      details: [] as any[],
    };

    const provider = bulkData.provider || 'sendgrid';

    for (const recipient of bulkData.recipients) {
      try {
        const emailData: SendEmailDto = {
          to: recipient,
          subject: bulkData.subject,
          content: bulkData.content,
          template: bulkData.template,
          templateData: bulkData.templateData,
          attachments: bulkData.attachments,
          provider,
        };

        const result = await this.sendEmail(emailData);
        results.details.push({
          recipient,
          emailId: result.id,
          status: 'PENDING',
        });
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

  async sendTemplateEmail(templateData: {
    templateId: string;
    to: string | string[];
    templateData?: any;
    provider?: string;
  }): Promise<EmailLog> {
    const template = await this.getEmailTemplate(templateData.templateId);
    if (!template) {
      throw new Error('Email template not found');
    }

    const subject = this.processTemplate(template.subject, templateData.templateData);
    const content = this.processTemplate(template.content, templateData.templateData);

    return this.sendEmail({
      to: templateData.to,
      subject,
      content,
      template: templateData.templateId,
      templateData: templateData.templateData,
      provider: templateData.provider || 'sendgrid',
    });
  }

  async getEmailLogs(params: {
    page: number;
    limit: number;
    status?: string;
    provider?: string;
    startDate?: Date;
    endDate?: Date;
    search?: string;
  }): Promise<{ logs: EmailLog[]; total: number; page: number; limit: number }> {
    const { page, limit, status, provider, startDate, endDate, search } = params;
    const skip = (page - 1) * limit;

    const query = this.emailLogRepository.createQueryBuilder('email');

    if (status) {
      query.andWhere('email.status = :status', { status });
    }

    if (provider) {
      query.andWhere('email.provider = :provider', { provider });
    }

    if (startDate) {
      query.andWhere('email.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('email.createdAt <= :endDate', { endDate });
    }

    if (search) {
      query.andWhere('(email.to ILIKE :search OR email.subject ILIKE :search OR email.content ILIKE :search)', 
        { search: `%${search}%` });
    }

    const [logs, total] = await query
      .orderBy('email.createdAt', 'DESC')
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

  async getEmailLog(id: string): Promise<EmailLog | null> {
    return this.emailLogRepository.findOne({
      where: { id },
    });
  }

  async getEmailTemplates(
    page: number = 1,
    limit: number = 10,
    category?: string,
    search?: string
  ): Promise<{ templates: any[]; total: number; page: number; limit: number }> {
    // This would typically fetch from a templates table
    // For now, returning mock data
    const templates = [
      {
        id: '1',
        name: 'Welcome Email',
        subject: 'Welcome to Lomash Wood',
        content: 'Welcome {{name}}! Thank you for joining Lomash Wood.',
        category: 'onboarding',
        variables: ['name'],
        isActive: true,
        description: 'Welcome email for new users',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        name: 'Order Confirmation',
        subject: 'Order Confirmation #{{orderNumber}}',
        content: 'Your order #{{orderNumber}} has been confirmed.',
        category: 'orders',
        variables: ['orderNumber', 'customerName'],
        isActive: true,
        description: 'Order confirmation email',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '3',
        name: 'Password Reset',
        subject: 'Reset Your Password',
        content: 'Click here to reset your password: {{resetLink}}',
        category: 'security',
        variables: ['resetLink', 'name'],
        isActive: true,
        description: 'Password reset email',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    let filteredTemplates = templates;

    if (category) {
      filteredTemplates = filteredTemplates.filter(t => t.category === category);
    }

    if (search) {
      filteredTemplates = filteredTemplates.filter(t => 
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.subject.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    const startIndex = (page - 1) * limit;
    const paginatedTemplates = filteredTemplates.slice(startIndex, startIndex + limit);

    return {
      templates: paginatedTemplates,
      total: filteredTemplates.length,
      page,
      limit,
    };
  }

  async getEmailTemplate(id: string): Promise<any | null> {
    const templates = await this.getEmailTemplates();
    return templates.templates.find(t => t.id === id) || null;
  }

  async createEmailTemplate(templateData: {
    name: string;
    subject: string;
    content: string;
    category?: string;
    variables?: string[];
    isActive?: boolean;
    description?: string;
  }): Promise<any> {
    const template = {
      id: this.generateId(),
      ...templateData,
      isActive: templateData.isActive !== undefined ? templateData.isActive : true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log('Email template created:', template);
    return template;
  }

  async updateEmailTemplate(
    id: string,
    templateData: {
      name?: string;
      subject?: string;
      content?: string;
      category?: string;
      variables?: string[];
      isActive?: boolean;
      description?: string;
    }
  ): Promise<any | null> {
    const template = await this.getEmailTemplate(id);
    if (!template) {
      return null;
    }

    const updatedTemplate = {
      ...template,
      ...templateData,
      updatedAt: new Date(),
    };

    console.log('Email template updated:', updatedTemplate);
    return updatedTemplate;
  }

  async deleteEmailTemplate(id: string): Promise<boolean> {
    const template = await this.getEmailTemplate(id);
    if (!template) {
      return false;
    }

    console.log('Email template deleted:', id);
    return true;
  }

  async testEmail(to: string, provider?: string): Promise<any> {
    const testContent = {
      subject: 'Test Email from Lomash Wood',
      content: 'This is a test email to verify your email configuration.',
      to,
      provider: provider || 'sendgrid',
    };

    const result = await this.sendEmail(testContent);
    return {
      success: true,
      emailId: result.id,
      message: 'Test email sent successfully',
    };
  }

  async getEmailStats(
    startDate?: Date,
    endDate?: Date,
    provider?: string
  ): Promise<any> {
    const query = this.emailLogRepository.createQueryBuilder('email');

    if (startDate) {
      query.andWhere('email.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('email.createdAt <= :endDate', { endDate });
    }

    if (provider) {
      query.andWhere('email.provider = :provider', { provider });
    }

    const total = await query.getCount();
    const sent = await query.andWhere('email.status = :status', { status: 'SENT' }).getCount();
    const delivered = await query.andWhere('email.status = :status', { status: 'DELIVERED' }).getCount();
    const failed = await query.andWhere('email.status = :status', { status: 'FAILED' }).getCount();
    const bounced = await query.andWhere('email.status = :status', { status: 'BOUNCED' }).getCount();
    const complained = await query.andWhere('email.status = :status', { status: 'COMPLAINED' }).getCount();

    const providerBreakdown = await this.emailLogRepository
      .createQueryBuilder('email')
      .select('email.provider', 'provider')
      .addSelect('COUNT(*)', 'count')
      .groupBy('email.provider')
      .getRawMany();

    const dailyStats = await this.emailLogRepository
      .createQueryBuilder('email')
      .select('DATE(email.createdAt)', 'date')
      .addSelect('COUNT(*)', 'count')
      .groupBy('DATE(email.createdAt)')
      .orderBy('DATE(email.createdAt)', 'DESC')
      .limit(30)
      .getRawMany();

    return {
      total,
      sent,
      delivered,
      failed,
      bounced,
      complained,
      deliveryRate: sent > 0 ? (delivered / sent) * 100 : 0,
      bounceRate: sent > 0 ? (bounced / sent) * 100 : 0,
      complaintRate: sent > 0 ? (complained / sent) * 100 : 0,
      providerBreakdown,
      dailyStats,
    };
  }

  async getEmailProviders(): Promise<any[]> {
    return [
      {
        name: 'sendgrid',
        displayName: 'SendGrid',
        description: 'Reliable email delivery service',
        isActive: true,
        features: ['templates', 'analytics', 'webhooks'],
      },
      {
        name: 'nodemailer',
        displayName: 'Nodemailer (SMTP)',
        description: 'Direct SMTP email sending',
        isActive: true,
        features: ['smtp', 'attachments', 'html'],
      },
    ];
  }

  async resendEmail(id: string): Promise<EmailLog | null> {
    const emailLog = await this.getEmailLog(id);
    if (!emailLog || emailLog.status !== 'FAILED') {
      return null;
    }

    const resendData = {
      to: emailLog.to,
      subject: emailLog.subject,
      content: emailLog.content,
      template: emailLog.template,
      templateData: emailLog.templateData,
      attachments: emailLog.attachments,
      provider: emailLog.provider,
    };

    return this.sendEmail(resendData);
  }

  async previewEmail(templateId: string, templateData?: any): Promise<any> {
    const template = await this.getEmailTemplate(templateId);
    if (!template) {
      throw new Error('Email template not found');
    }

    const subject = this.processTemplate(template.subject, templateData);
    const content = this.processTemplate(template.content, templateData);

    return {
      templateId,
      subject,
      content,
      html: this.convertToHtml(content),
      preview: this.generatePreview(content),
    };
  }

  async getEmailBounces(params: {
    page: number;
    limit: number;
    startDate?: Date;
    endDate?: Date;
    email?: string;
  }): Promise<{ bounces: any[]; total: number; page: number; limit: number }> {
    const { page, limit, startDate, endDate, email } = params;
    const skip = (page - 1) * limit;

    const query = this.emailLogRepository.createQueryBuilder('email')
      .where('email.status IN (:...statuses)', { statuses: ['BOUNCED', 'SOFT_BOUNCED'] });

    if (startDate) {
      query.andWhere('email.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('email.createdAt <= :endDate', { endDate });
    }

    if (email) {
      query.andWhere('email.to = :email', { email });
    }

    const [bounces, total] = await query
      .orderBy('email.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      bounces,
      total,
      page,
      limit,
    };
  }

  async getEmailComplaints(params: {
    page: number;
    limit: number;
    startDate?: Date;
    endDate?: Date;
    email?: string;
  }): Promise<{ complaints: any[]; total: number; page: number; limit: number }> {
    const { page, limit, startDate, endDate, email } = params;
    const skip = (page - 1) * limit;

    const query = this.emailLogRepository.createQueryBuilder('email')
      .where('email.status = :status', { status: 'COMPLAINED' });

    if (startDate) {
      query.andWhere('email.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('email.createdAt <= :endDate', { endDate });
    }

    if (email) {
      query.andWhere('email.to = :email', { email });
    }

    const [complaints, total] = await query
      .orderBy('email.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      complaints,
      total,
      page,
      limit,
    };
  }

  async unsubscribe(token: string): Promise<any> {
    // This would typically validate the token and update subscription preferences
    // For now, returning mock data
    return {
      success: true,
      message: 'Successfully unsubscribed from marketing emails',
      token,
      unsubscribedAt: new Date(),
    };
  }

  async getEmailSubscriptions(email: string): Promise<any> {
    // This would typically fetch from user subscription table
    // For now, returning mock data
    return {
      email,
      marketing: true,
      newsletters: true,
      promotions: true,
      updates: true,
      security: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async updateEmailSubscriptions(
    email: string,
    subscriptionData: {
      marketing?: boolean;
      newsletters?: boolean;
      promotions?: boolean;
      updates?: boolean;
      security?: boolean;
    }
  ): Promise<any> {
    const subscriptions = {
      email,
      ...subscriptionData,
      updatedAt: new Date(),
    };

    console.log('Email subscriptions updated:', subscriptions);
    return subscriptions;
  }

  async getEmailWebhooks(): Promise<any[]> {
    // This would typically fetch from webhook table
    // For now, returning mock data
    return [
      {
        id: '1',
        url: 'https://api.lomashwood.com/webhooks/email',
        events: ['delivered', 'opened', 'clicked', 'bounced', 'complained'],
        secret: 'webhook-secret-key',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }

  async createEmailWebhook(webhookData: {
    url: string;
    events: string[];
    secret?: string;
    isActive?: boolean;
  }): Promise<any> {
    const webhook = {
      id: this.generateId(),
      ...webhookData,
      isActive: webhookData.isActive !== undefined ? webhookData.isActive : true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log('Email webhook created:', webhook);
    return webhook;
  }

  async updateEmailWebhook(
    id: string,
    webhookData: {
      url?: string;
      events?: string[];
      secret?: string;
      isActive?: boolean;
    }
  ): Promise<any | null> {
    const webhooks = await this.getEmailWebhooks();
    const webhook = webhooks.find(w => w.id === id);
    if (!webhook) {
      return null;
    }

    const updatedWebhook = {
      ...webhook,
      ...webhookData,
      updatedAt: new Date(),
    };

    console.log('Email webhook updated:', updatedWebhook);
    return updatedWebhook;
  }

  async deleteEmailWebhook(id: string): Promise<boolean> {
    const webhooks = await this.getEmailWebhooks();
    const webhook = webhooks.find(w => w.id === id);
    if (!webhook) {
      return false;
    }

    console.log('Email webhook deleted:', id);
    return true;
  }

  private processTemplate(template: string, data?: any): string {
    if (!data) return template;
    
    let processed = template;
    for (const [key, value] of Object.entries(data)) {
      processed = processed.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }
    return processed;
  }

  private convertToHtml(content: string): string {
    // Simple conversion of text to HTML
    return content
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
  }

  private generatePreview(content: string): string {
    // Generate a preview of the email content
    return content.length > 200 ? content.substring(0, 200) + '...' : content;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
