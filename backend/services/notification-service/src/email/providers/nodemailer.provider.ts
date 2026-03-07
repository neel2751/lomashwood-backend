import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NodemailerProvider {
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const config = {
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT') || 587,
      secure: this.configService.get<boolean>('SMTP_SECURE') || false,
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
      tls: {
        rejectUnauthorized: false,
      },
    };

    this.transporter = nodemailer.createTransporter(config);
  }

  async sendEmail(emailData: {
    to: string | string[];
    subject: string;
    content: string;
    template?: string;
    templateData?: any;
    attachments?: any[];
    from?: string;
    replyTo?: string;
    cc?: string | string[];
    bcc?: string | string[];
    priority?: string;
    headers?: any;
  }): Promise<any> {
    try {
      const fromEmail = emailData.from || this.configService.get<string>('EMAIL_FROM');
      
      const mailOptions: nodemailer.SendMailOptions = {
        from: fromEmail,
        to: Array.isArray(emailData.to) ? emailData.to.join(', ') : emailData.to,
        subject: emailData.subject,
        html: emailData.content,
        text: this.stripHtml(emailData.content),
      };

      // Handle optional fields
      if (emailData.replyTo) {
        mailOptions.replyTo = emailData.replyTo;
      }

      if (emailData.cc) {
        mailOptions.cc = Array.isArray(emailData.cc) ? emailData.cc.join(', ') : emailData.cc;
      }

      if (emailData.bcc) {
        mailOptions.bcc = Array.isArray(emailData.bcc) ? emailData.bcc.join(', ') : emailData.bcc;
      }

      if (emailData.priority) {
        mailOptions.priority = emailData.priority as nodemailer.SendMailOptions['priority'];
      }

      if (emailData.headers) {
        mailOptions.headers = emailData.headers;
      }

      // Handle attachments
      if (emailData.attachments && emailData.attachments.length > 0) {
        mailOptions.attachments = emailData.attachments.map(attachment => ({
          filename: attachment.filename,
          content: attachment.content,
          contentType: attachment.type,
          contentDisposition: attachment.disposition || 'attachment',
          cid: attachment.contentId,
        }));
      }

      // Process template if provided
      if (emailData.template && emailData.templateData) {
        const processedContent = await this.processTemplate(emailData.template, emailData.templateData);
        mailOptions.html = processedContent.html;
        mailOptions.text = processedContent.text;
      }

      const result = await this.transporter.sendMail(mailOptions);
      
      return {
        success: true,
        messageId: result.messageId,
        response: result.response,
        envelope: result.envelope,
        accepted: result.accepted,
        rejected: result.rejected,
        pending: result.pending,
      };
    } catch (error) {
      console.error('Nodemailer error:', error);
      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }
  }

  async sendTemplateEmail(templateData: {
    templateId: string;
    to: string | string[];
    templateData?: any;
    from?: string;
    replyTo?: string;
    cc?: string | string[];
    bcc?: string | string[];
    priority?: string;
    headers?: any;
  }): Promise<any> {
    // For nodemailer, we'll need to implement template handling
    // This would typically involve fetching templates from a database or file system
    const template = await this.getTemplate(templateData.templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    const subject = this.processTemplateString(template.subject, templateData.templateData);
    const content = this.processTemplateString(template.content, templateData.templateData);

    return this.sendEmail({
      ...templateData,
      subject,
      content,
    });
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Nodemailer connection verification failed:', error);
      return false;
    }
  }

  async getTransporterInfo(): Promise<any> {
    try {
      return this.transporter.transporter;
    } catch (error) {
      console.error('Error getting transporter info:', error);
      return null;
    }
  }

  async getTemplate(templateId: string): Promise<any> {
    // This would typically fetch from a database or file system
    // For now, returning mock data
    const templates = [
      {
        id: 'welcome',
        name: 'Welcome Email',
        subject: 'Welcome to Lomash Wood',
        content: '<h1>Welcome {{name}}!</h1><p>Thank you for joining Lomash Wood.</p>',
      },
      {
        id: 'order-confirmation',
        name: 'Order Confirmation',
        subject: 'Order Confirmation #{{orderNumber}}',
        content: '<h2>Order Confirmation</h2><p>Your order #{{orderNumber}} has been confirmed.</p>',
      },
      {
        id: 'password-reset',
        name: 'Password Reset',
        subject: 'Reset Your Password',
        content: '<h1>Password Reset</h1><p>Click here to reset your password: <a href="{{resetLink}}">Reset Password</a></p>',
      },
    ];

    return templates.find(t => t.id === templateId) || null;
  }

  async getTemplates(): Promise<any[]> {
    // This would typically fetch from a database or file system
    return [
      {
        id: 'welcome',
        name: 'Welcome Email',
        subject: 'Welcome to Lomash Wood',
        content: '<h1>Welcome {{name}}!</h1><p>Thank you for joining Lomash Wood.</p>',
        variables: ['name'],
      },
      {
        id: 'order-confirmation',
        name: 'Order Confirmation',
        subject: 'Order Confirmation #{{orderNumber}}',
        content: '<h2>Order Confirmation</h2><p>Your order #{{orderNumber}} has been confirmed.</p>',
        variables: ['orderNumber'],
      },
      {
        id: 'password-reset',
        name: 'Password Reset',
        subject: 'Reset Your Password',
        content: '<h1>Password Reset</h1><p>Click here to reset your password: <a href="{{resetLink}}">Reset Password</a></p>',
        variables: ['resetLink'],
      },
    ];
  }

  async createTemplate(templateData: {
    name: string;
    subject: string;
    content: string;
    variables?: string[];
  }): Promise<any> {
    const template = {
      id: this.generateId(),
      ...templateData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log('Nodemailer template created:', template);
    return template;
  }

  async updateTemplate(templateId: string, templateData: {
    name?: string;
    subject?: string;
    content?: string;
    variables?: string[];
  }): Promise<any | null> {
    const template = await this.getTemplate(templateId);
    if (!template) {
      return null;
    }

    const updatedTemplate = {
      ...template,
      ...templateData,
      updatedAt: new Date(),
    };

    console.log('Nodemailer template updated:', updatedTemplate);
    return updatedTemplate;
  }

  async deleteTemplate(templateId: string): Promise<boolean> {
    const template = await this.getTemplate(templateId);
    if (!template) {
      return false;
    }

    console.log('Nodemailer template deleted:', templateId);
    return true;
  }

  async testConnection(): Promise<any> {
    try {
      const result = await this.transporter.verify();
      return {
        success: true,
        message: 'SMTP connection successful',
        result,
      };
    } catch (error) {
      console.error('SMTP connection test failed:', error);
      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }
  }

  async sendTestEmail(to: string): Promise<any> {
    const testEmail = {
      to,
      subject: 'Test Email from Nodemailer',
      content: '<h1>Test Email</h1><p>This is a test email to verify your Nodemailer configuration.</p>',
    };

    return this.sendEmail(testEmail);
  }

  async getQueueInfo(): Promise<any> {
    try {
      // This would typically return queue information if using a queue system
      return {
        isIdle: this.transporter.isIdle(),
        isQueued: this.transporter.isQueued(),
        queueSize: 0, // This would be actual queue size if using a queue
      };
    } catch (error) {
      console.error('Error getting queue info:', error);
      return null;
    }
  }

  async closeTransporter(): Promise<void> {
    try {
      this.transporter.close();
    } catch (error) {
      console.error('Error closing transporter:', error);
    }
  }

  async restartTransporter(): Promise<void> {
    try {
      await this.closeTransporter();
      this.initializeTransporter();
    } catch (error) {
      console.error('Error restarting transporter:', error);
    }
  }

  async getDnsRecords(domain: string): Promise<any> {
    try {
      // This would typically use a DNS lookup service
      // For now, returning mock data
      return {
        mx: [
          { exchange: 'mail.' + domain, priority: 10 },
        ],
        spf: 'v=spf1 include:_spf.google.com ~all',
        dkim: 'v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...',
        dmarc: 'v=DMARC1; p=quarantine; rua=mailto:dmarc@' + domain,
      };
    } catch (error) {
      console.error('Error getting DNS records:', error);
      return null;
    }
  }

  async validateEmail(email: string): Promise<any> {
    try {
      // This would typically use an email validation service
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValid = emailRegex.test(email);
      
      return {
        email,
        isValid,
        isDisposable: false, // This would check against disposable email lists
        isFree: false, // This would check against free email providers
        suggestions: isValid ? [] : this.generateEmailSuggestions(email),
      };
    } catch (error) {
      console.error('Error validating email:', error);
      return {
        email,
        isValid: false,
        error: error.message,
      };
    }
  }

  async trackEmail(messageId: string, event: string, data?: any): Promise<any> {
    try {
      // This would typically log email tracking events
      const trackingData = {
        messageId,
        event,
        timestamp: new Date(),
        data,
      };

      console.log('Email tracking event:', trackingData);
      return {
        success: true,
        trackingData,
      };
    } catch (error) {
      console.error('Error tracking email:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private async processTemplate(templateId: string, templateData?: any): Promise<{ html: string; text: string }> {
    const template = await this.getTemplate(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    const html = this.processTemplateString(template.content, templateData);
    const text = this.stripHtml(html);

    return { html, text };
  }

  private processTemplateString(template: string, data?: any): string {
    if (!data) return template;
    
    let processed = template;
    for (const [key, value] of Object.entries(data)) {
      processed = processed.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }
    return processed;
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '');
  }

  private generateEmailSuggestions(email: string): string[] {
    const [localPart, domain] = email.split('@');
    const suggestions: string[] = [];
    
    // Common typos and their corrections
    const commonDomains = {
      'gamil.com': 'gmail.com',
      'gmial.com': 'gmail.com',
      'gmail.co': 'gmail.com',
      'yahooo.com': 'yahoo.com',
      'yaho.com': 'yahoo.com',
      'outlok.com': 'outlook.com',
      'hotmal.com': 'hotmail.com',
    };

    const correctedDomain = commonDomains[domain];
    if (correctedDomain) {
      suggestions.push(`${localPart}@${correctedDomain}`);
    }

    return suggestions;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
