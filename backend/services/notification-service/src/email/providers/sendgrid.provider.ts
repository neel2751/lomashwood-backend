import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as SendGrid from '@sendgrid/mail';

@Injectable()
export class SendgridProvider {
  private readonly sendGrid: typeof SendGrid;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    if (!apiKey) {
      throw new Error('SendGrid API key is required');
    }

    this.sendGrid = SendGrid;
    this.sendGrid.setApiKey(apiKey);
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
    categories?: string[];
    customArgs?: any;
    sendAt?: Date;
  }): Promise<any> {
    try {
      const fromEmail = emailData.from || this.configService.get<string>('EMAIL_FROM');
      
      const msg: SendGrid.MailData = {
        to: Array.isArray(emailData.to) ? emailData.to : [emailData.to],
        from: fromEmail,
        subject: emailData.subject,
      };

      // Handle template or content
      if (emailData.template) {
        msg.templateId = emailData.template;
        if (emailData.templateData) {
          msg.dynamicTemplateData = emailData.templateData;
        }
      } else {
        msg.html = emailData.content;
        msg.text = this.stripHtml(emailData.content);
      }

      // Handle optional fields
      if (emailData.replyTo) {
        msg.replyTo = emailData.replyTo;
      }

      if (emailData.cc) {
        msg.cc = Array.isArray(emailData.cc) ? emailData.cc : [emailData.cc];
      }

      if (emailData.bcc) {
        msg.bcc = Array.isArray(emailData.bcc) ? emailData.bcc : [emailData.bcc];
      }

      if (emailData.attachments && emailData.attachments.length > 0) {
        msg.attachments = emailData.attachments.map(attachment => ({
          content: attachment.content,
          filename: attachment.filename,
          type: attachment.type,
          disposition: attachment.disposition || 'attachment',
          contentId: attachment.contentId,
        }));
      }

      if (emailData.categories && emailData.categories.length > 0) {
        msg.categories = emailData.categories;
      }

      if (emailData.customArgs) {
        msg.customArgs = emailData.customArgs;
      }

      if (emailData.sendAt) {
        msg.sendAt = emailData.sendAt.toISOString();
      }

      const [response] = await this.sendGrid.send(msg);
      
      return {
        success: true,
        messageId: response.headers['x-message-id'],
        status: response.statusCode,
        response: response.body,
      };
    } catch (error) {
      console.error('SendGrid error:', error);
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
    categories?: string[];
    customArgs?: any;
    sendAt?: Date;
  }): Promise<any> {
    return this.sendEmail({
      ...templateData,
      template: templateData.templateId,
    });
  }

  async validateApiKey(): Promise<boolean> {
    try {
      // Send a test email to validate the API key
      const testEmail = {
        to: this.configService.get<string>('EMAIL_FROM'),
        subject: 'SendGrid API Key Validation',
        content: 'This is a test email to validate the SendGrid API key.',
      };

      const result = await this.sendEmail(testEmail);
      return result.success;
    } catch (error) {
      console.error('SendGrid API key validation failed:', error);
      return false;
    }
  }

  async getTemplate(templateId: string): Promise<any> {
    try {
      const response = await this.sendGrid.request({
        method: 'GET',
        url: `/v3/templates/${templateId}`,
      });

      return {
        success: true,
        template: response.body,
      };
    } catch (error) {
      console.error('SendGrid template fetch error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getTemplates(): Promise<any> {
    try {
      const response = await this.sendGrid.request({
        method: 'GET',
        url: '/v3/templates',
        qs: {
          generations: 'dynamic',
          limit: 100,
        },
      });

      return {
        success: true,
        templates: response.body.templates,
      };
    } catch (error) {
      console.error('SendGrid templates fetch error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async createTemplate(templateData: {
    name: string;
    subject: string;
    htmlContent: string;
    textContent?: string;
    category?: string;
  }): Promise<any> {
    try {
      const response = await this.sendGrid.request({
        method: 'POST',
        url: '/v3/templates',
        body: {
          name: templateData.name,
          generation: 'dynamic',
        },
      });

      const templateId = response.body.id;

      // Create version for the template
      const versionResponse = await this.sendGrid.request({
        method: 'POST',
        url: `/v3/templates/${templateId}/versions`,
        body: {
          name: templateData.name,
          subject: templateData.subject,
          html_content: templateData.htmlContent,
          plain_content: templateData.textContent || this.stripHtml(templateData.htmlContent),
          category: templateData.category,
          active: 1,
        },
      });

      return {
        success: true,
        template: response.body,
        version: versionResponse.body,
      };
    } catch (error) {
      console.error('SendGrid template creation error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async updateTemplate(templateId: string, templateData: {
    name?: string;
    subject?: string;
    htmlContent?: string;
    textContent?: string;
    category?: string;
    active?: boolean;
  }): Promise<any> {
    try {
      // Get existing template versions
      const versionsResponse = await this.sendGrid.request({
        method: 'GET',
        url: `/v3/templates/${templateId}/versions`,
      });

      if (versionsResponse.body.versions.length === 0) {
        throw new Error('No template versions found');
      }

      const latestVersion = versionsResponse.body.versions[0];

      // Update the latest version
      const updateData: any = {};
      if (templateData.name) updateData.name = templateData.name;
      if (templateData.subject) updateData.subject = templateData.subject;
      if (templateData.htmlContent) updateData.html_content = templateData.htmlContent;
      if (templateData.textContent) updateData.plain_content = templateData.textContent;
      if (templateData.category) updateData.category = templateData.category;
      if (templateData.active !== undefined) updateData.active = templateData.active ? 1 : 0;

      const response = await this.sendGrid.request({
        method: 'PATCH',
        url: `/v3/templates/${templateId}/versions/${latestVersion.id}`,
        body: updateData,
      });

      return {
        success: true,
        version: response.body,
      };
    } catch (error) {
      console.error('SendGrid template update error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async deleteTemplate(templateId: string): Promise<any> {
    try {
      const response = await this.sendGrid.request({
        method: 'DELETE',
        url: `/v3/templates/${templateId}`,
      });

      return {
        success: true,
        message: 'Template deleted successfully',
      };
    } catch (error) {
      console.error('SendGrid template deletion error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getStats(params: {
    startDate?: Date;
    endDate?: Date;
    aggregatedBy?: string;
    limit?: number;
    offset?: number;
  }): Promise<any> {
    try {
      const queryParams: any = {};
      
      if (params.startDate) {
        queryParams.start_date = params.startDate.toISOString();
      }
      
      if (params.endDate) {
        queryParams.end_date = params.endDate.toISOString();
      }
      
      if (params.aggregatedBy) {
        queryParams.aggregated_by = params.aggregatedBy;
      }
      
      if (params.limit) {
        queryParams.limit = params.limit;
      }
      
      if (params.offset) {
        queryParams.offset = params.offset;
      }

      const response = await this.sendGrid.request({
        method: 'GET',
        url: '/v3/stats',
        qs: queryParams,
      });

      return {
        success: true,
        stats: response.body,
      };
    } catch (error) {
      console.error('SendGrid stats fetch error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getBounces(params: {
    startDate?: Date;
    endDate?: Date;
    email?: string;
    limit?: number;
    offset?: number;
  }): Promise<any> {
    try {
      const queryParams: any = {};
      
      if (params.startDate) {
        queryParams.start_time = params.startDate.toISOString();
      }
      
      if (params.endDate) {
        queryParams.end_time = params.endDate.toISOString();
      }
      
      if (params.email) {
        queryParams.email = params.email;
      }
      
      if (params.limit) {
        queryParams.limit = params.limit;
      }
      
      if (params.offset) {
        queryParams.offset = params.offset;
      }

      const response = await this.sendGrid.request({
        method: 'GET',
        url: '/v3/suppression/bounces',
        qs: queryParams,
      });

      return {
        success: true,
        bounces: response.body,
      };
    } catch (error) {
      console.error('SendGrid bounces fetch error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getComplaints(params: {
    startDate?: Date;
    endDate?: Date;
    email?: string;
    limit?: number;
    offset?: number;
  }): Promise<any> {
    try {
      const queryParams: any = {};
      
      if (params.startDate) {
        queryParams.start_time = params.startDate.toISOString();
      }
      
      if (params.endDate) {
        queryParams.end_time = params.endDate.toISOString();
      }
      
      if (params.email) {
        queryParams.email = params.email;
      }
      
      if (params.limit) {
        queryParams.limit = params.limit;
      }
      
      if (params.offset) {
        queryParams.offset = params.offset;
      }

      const response = await this.sendGrid.request({
        method: 'GET',
        url: '/v3/suppression/complaints',
        qs: queryParams,
      });

      return {
        success: true,
        complaints: response.body,
      };
    } catch (error) {
      console.error('SendGrid complaints fetch error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async addBounce(email: string, reason?: string): Promise<any> {
    try {
      const response = await this.sendGrid.request({
        method: 'POST',
        url: '/v3/suppression/bounces',
        body: {
          email,
          reason: reason || 'User reported',
        },
      });

      return {
        success: true,
        message: 'Bounce added successfully',
      };
    } catch (error) {
      console.error('SendGrid bounce addition error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async removeBounce(email: string): Promise<any> {
    try {
      const response = await this.sendGrid.request({
        method: 'DELETE',
        url: `/v3/suppression/bounces/${email}`,
      });

      return {
        success: true,
        message: 'Bounce removed successfully',
      };
    } catch (error) {
      console.error('SendGrid bounce removal error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async addComplaint(email: string): Promise<any> {
    try {
      const response = await this.sendGrid.request({
        method: 'POST',
        url: '/v3/suppression/complaints',
        body: {
          email,
        },
      });

      return {
        success: true,
        message: 'Complaint added successfully',
      };
    } catch (error) {
      console.error('SendGrid complaint addition error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async removeComplaint(email: string): Promise<any> {
    try {
      const response = await this.sendGrid.request({
        method: 'DELETE',
        url: `/v3/suppression/complaints/${email}`,
      });

      return {
        success: true,
        message: 'Complaint removed successfully',
      };
    } catch (error) {
      console.error('SendGrid complaint removal error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '');
  }
}
