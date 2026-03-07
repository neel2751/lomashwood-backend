import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { NotificationTemplate } from './entities/notification-template.entity';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectRepository(NotificationTemplate)
    private readonly templateRepository: Repository<NotificationTemplate>,
    private readonly configService: ConfigService,
  ) {}

  async createTemplate(createTemplateDto: CreateTemplateDto): Promise<NotificationTemplate> {
    const template = this.templateRepository.create(createTemplateDto);
    return this.templateRepository.save(template);
  }

  async getTemplates(query: any): Promise<{ templates: NotificationTemplate[]; total: number; page: number; limit: number }> {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 10);
    const skip = (page - 1) * limit;

    const whereClause: any = {};
    
    if (query.category) {
      whereClause.category = query.category;
    }
    
    if (query.type) {
      whereClause.type = query.type;
    }
    
    if (query.status) {
      whereClause.status = query.status;
    }
    
    if (query.search) {
      whereClause.name = { $like: `%${query.search}%` };
    }

    const [templates, total] = await this.templateRepository.findAndCount({
      where: whereClause,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { templates, total, page, limit };
  }

  async getTemplateById(id: string): Promise<NotificationTemplate> {
    return this.templateRepository.findOne({ where: { id } });
  }

  async updateTemplate(id: string, updateTemplateDto: UpdateTemplateDto): Promise<NotificationTemplate> {
    const template = await this.templateRepository.findOne({ where: { id } });
    
    if (!template) {
      throw new Error('Template not found');
    }

    Object.assign(template, updateTemplateDto);
    return this.templateRepository.save(template);
  }

  async deleteTemplate(id: string): Promise<any> {
    const template = await this.templateRepository.findOne({ where: { id } });
    
    if (!template) {
      throw new Error('Template not found');
    }

    await this.templateRepository.remove(template);
    return {
      success: true,
      id,
      deletedAt: new Date(),
    };
  }

  async previewTemplate(id: string, data?: any): Promise<any> {
    const template = await this.templateRepository.findOne({ where: { id } });
    
    if (!template) {
      throw new Error('Template not found');
    }

    // Mock template compilation with sample data
    const sampleData = data || {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      company: 'Acme Corp',
      date: new Date().toLocaleDateString(),
    };

    const compiledContent = this.compileTemplateContent(template.content, sampleData);
    const compiledSubject = this.compileTemplateContent(template.subject || '', sampleData);

    return {
      template: {
        id: template.id,
        name: template.name,
        type: template.type,
        category: template.category,
      },
      preview: {
        subject: compiledSubject,
        content: compiledContent,
        html: template.htmlContent ? this.compileTemplateContent(template.htmlContent, sampleData) : null,
        sms: template.smsContent ? this.compileTemplateContent(template.smsContent, sampleData) : null,
        push: template.pushContent ? this.compileTemplateContent(template.pushContent, sampleData) : null,
      },
      sampleData,
      compiledAt: new Date(),
    };
  }

  async sendTestNotification(id: string, recipient: string, data?: any, type?: string): Promise<any> {
    const template = await this.templateRepository.findOne({ where: { id } });
    
    if (!template) {
      throw new Error('Template not found');
    }

    // Mock sending test notification
    const testNotification = {
      id: this.generateId(),
      templateId: template.id,
      templateName: template.name,
      recipient,
      type: type || template.type,
      data: data || {},
      status: 'sent',
      sentAt: new Date(),
      preview: await this.previewTemplate(id, data),
    };

    return testNotification;
  }

  async getTemplateCategories(): Promise<any[]> {
    // Mock implementation - in real app, this would fetch from database
    return [
      { name: 'welcome', description: 'Welcome templates for new users', count: 15 },
      { name: 'notification', description: 'General notification templates', count: 32 },
      { name: 'marketing', description: 'Marketing and promotional templates', count: 28 },
      { name: 'transactional', description: 'Transactional email templates', count: 45 },
      { name: 'alert', description: 'Alert and warning templates', count: 12 },
      { name: 'newsletter', description: 'Newsletter templates', count: 8 },
      { name: 'reminder', description: 'Reminder templates', count: 18 },
      { name: 'survey', description: 'Survey and feedback templates', count: 6 },
    ];
  }

  async getTemplateTypes(): Promise<any[]> {
    // Mock implementation - in real app, this would fetch from database
    return [
      { name: 'email', description: 'Email templates', count: 120 },
      { name: 'sms', description: 'SMS templates', count: 45 },
      { name: 'push', description: 'Push notification templates', count: 38 },
      { name: 'webhook', description: 'Webhook templates', count: 12 },
      { name: 'inapp', description: 'In-app notification templates', count: 25 },
    ];
  }

  async getTemplateVariables(): Promise<any[]> {
    // Mock implementation - in real app, this would fetch from database
    return [
      { name: 'firstName', type: 'string', description: 'User first name', example: 'John' },
      { name: 'lastName', type: 'string', description: 'User last name', example: 'Doe' },
      { name: 'email', type: 'string', description: 'User email address', example: 'john.doe@example.com' },
      { name: 'company', type: 'string', description: 'Company name', example: 'Acme Corp' },
      { name: 'date', type: 'date', description: 'Current date', example: '2024-01-01' },
      { name: 'time', type: 'time', description: 'Current time', example: '12:00:00' },
      { name: 'amount', type: 'number', description: 'Monetary amount', example: 100.00 },
      { name: 'currency', type: 'string', description: 'Currency code', example: 'USD' },
      { name: 'productName', type: 'string', description: 'Product name', example: 'Premium Plan' },
      { name: 'orderId', type: 'string', description: 'Order ID', example: 'ORD-12345' },
      { name: 'trackingNumber', type: 'string', description: 'Tracking number', example: 'TRK-67890' },
      { name: 'supportEmail', type: 'string', description: 'Support email', example: 'support@example.com' },
      { name: 'websiteUrl', type: 'url', description: 'Website URL', example: 'https://example.com' },
      { name: 'phoneNumber', type: 'string', description: 'Phone number', example: '+1234567890' },
      { name: 'address', type: 'string', description: 'Address', example: '123 Main St, City, State' },
    ];
  }

  async cloneTemplate(id: string, name: string, description?: string): Promise<NotificationTemplate> {
    const originalTemplate = await this.templateRepository.findOne({ where: { id } });
    
    if (!originalTemplate) {
      throw new Error('Template not found');
    }

    const clonedTemplate = this.templateRepository.create({
      ...originalTemplate,
      id: undefined,
      name,
      description: description || `Cloned from ${originalTemplate.name}`,
      originalTemplateId: originalTemplate.id,
      createdAt: undefined,
      updatedAt: undefined,
    });

    return this.templateRepository.save(clonedTemplate);
  }

  async duplicateTemplate(id: string): Promise<NotificationTemplate> {
    const originalTemplate = await this.templateRepository.findOne({ where: { id } });
    
    if (!originalTemplate) {
      throw new Error('Template not found');
    }

    const duplicatedTemplate = this.templateRepository.create({
      ...originalTemplate,
      id: undefined,
      name: `${originalTemplate.name} (Copy)`,
      description: `Copy of ${originalTemplate.name}`,
      originalTemplateId: originalTemplate.id,
      createdAt: undefined,
      updatedAt: undefined,
    });

    return this.templateRepository.save(duplicatedTemplate);
  }

  async exportTemplate(id: string, format?: string): Promise<any> {
    const template = await this.templateRepository.findOne({ where: { id } });
    
    if (!template) {
      throw new Error('Template not found');
    }

    const exportFormat = format || 'json';
    
    if (exportFormat === 'json') {
      return {
        format: 'json',
        template: {
          id: template.id,
          name: template.name,
          description: template.description,
          type: template.type,
          category: template.category,
          subject: template.subject,
          content: template.content,
          htmlContent: template.htmlContent,
          smsContent: template.smsContent,
          pushContent: template.pushContent,
          variables: template.variables,
          tags: template.tags,
          metadata: template.metadata,
          createdAt: template.createdAt,
          updatedAt: template.updatedAt,
        },
        exportedAt: new Date(),
      };
    } else if (exportFormat === 'html') {
      return {
        format: 'html',
        content: template.htmlContent || template.content,
        exportedAt: new Date(),
      };
    } else if (exportFormat === 'txt') {
      return {
        format: 'txt',
        content: template.content,
        exportedAt: new Date(),
      };
    } else {
      throw new Error(`Unsupported export format: ${exportFormat}`);
    }
  }

  async importTemplate(templateData: any, format?: string): Promise<NotificationTemplate> {
    const importFormat = format || 'json';
    
    if (importFormat === 'json') {
      const template = this.templateRepository.create({
        name: templateData.name,
        description: templateData.description,
        type: templateData.type,
        category: templateData.category,
        subject: templateData.subject,
        content: templateData.content,
        htmlContent: templateData.htmlContent,
        smsContent: templateData.smsContent,
        pushContent: templateData.pushContent,
        variables: templateData.variables,
        tags: templateData.tags,
        metadata: templateData.metadata,
      });

      return this.templateRepository.save(template);
    } else {
      throw new Error(`Unsupported import format: ${importFormat}`);
    }
  }

  async bulkImportTemplates(templates: any[], format?: string): Promise<any> {
    const results = [];
    
    for (const templateData of templates) {
      try {
        const importedTemplate = await this.importTemplate(templateData, format);
        results.push({
          success: true,
          template: importedTemplate,
        });
      } catch (error) {
        results.push({
          success: false,
          error: error.message,
          templateData,
        });
      }
    }

    return {
      results,
      total: templates.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      importedAt: new Date(),
    };
  }

  async bulkExportTemplates(templateIds: string[], format?: string): Promise<any> {
    const templates = await this.templateRepository.findByIds(templateIds);
    const exportedTemplates = [];

    for (const template of templates) {
      const exportedTemplate = await this.exportTemplate(template.id, format);
      exportedTemplates.push(exportedTemplate);
    }

    return {
      format: format || 'json',
      templates: exportedTemplates,
      total: templates.length,
      exportedAt: new Date(),
    };
  }

  async validateTemplate(id: string): Promise<any> {
    const template = await this.templateRepository.findOne({ where: { id } });
    
    if (!template) {
      throw new Error('Template not found');
    }

    const validationResults = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: [],
    };

    // Validate required fields
    if (!template.name) {
      validationResults.errors.push('Template name is required');
      validationResults.isValid = false;
    }

    if (!template.type) {
      validationResults.errors.push('Template type is required');
      validationResults.isValid = false;
    }

    if (!template.content) {
      validationResults.errors.push('Template content is required');
      validationResults.isValid = false;
    }

    // Validate template syntax
    try {
      this.compileTemplateContent(template.content, {});
    } catch (error) {
      validationResults.errors.push(`Template syntax error: ${error.message}`);
      validationResults.isValid = false;
    }

    // Validate variables
    if (template.variables && Array.isArray(template.variables)) {
      const contentVariables = this.extractVariables(template.content);
      const missingVariables = contentVariables.filter(v => !template.variables.includes(v));
      
      if (missingVariables.length > 0) {
        validationResults.warnings.push(`Undefined variables found: ${missingVariables.join(', ')}`);
      }
    }

    // Validate HTML content if present
    if (template.htmlContent) {
      try {
        this.compileTemplateContent(template.htmlContent, {});
      } catch (error) {
        validationResults.errors.push(`HTML template syntax error: ${error.message}`);
        validationResults.isValid = false;
      }
    }

    return validationResults;
  }

  async compileTemplate(id: string, data?: any): Promise<any> {
    const template = await this.templateRepository.findOne({ where: { id } });
    
    if (!template) {
      throw new Error('Template not found');
    }

    const compiledData = data || {};

    return {
      template: {
        id: template.id,
        name: template.name,
        type: template.type,
      },
      compiled: {
        subject: this.compileTemplateContent(template.subject || '', compiledData),
        content: this.compileTemplateContent(template.content, compiledData),
        html: template.htmlContent ? this.compileTemplateContent(template.htmlContent, compiledData) : null,
        sms: template.smsContent ? this.compileTemplateContent(template.smsContent, compiledData) : null,
        push: template.pushContent ? this.compileTemplateContent(template.pushContent, compiledData) : null,
      },
      data: compiledData,
      compiledAt: new Date(),
    };
  }

  async getTemplateVersions(id: string): Promise<any[]> {
    // Mock implementation - in real app, this would fetch from database
    return [
      {
        id: 'v1',
        version: '1.0.0',
        changes: 'Initial version',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        createdBy: 'admin',
        isActive: false,
      },
      {
        id: 'v2',
        version: '1.1.0',
        changes: 'Updated subject line',
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        createdBy: 'editor',
        isActive: false,
      },
      {
        id: 'v3',
        version: '1.2.0',
        changes: 'Added HTML content',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        createdBy: 'designer',
        isActive: true,
      },
    ];
  }

  async createTemplateVersion(id: string, version: string, changes?: string): Promise<any> {
    // Mock implementation - in real app, this would save to database
    return {
      id: this.generateId(),
      templateId: id,
      version,
      changes: changes || `Version ${version}`,
      createdAt: new Date(),
      createdBy: 'current_user',
      isActive: true,
    };
  }

  async updateTemplateVersion(id: string, version: string, updateDto: any): Promise<any> {
    // Mock implementation - in real app, this would update database
    return {
      templateId: id,
      version,
      ...updateDto,
      updatedAt: new Date(),
      updatedBy: 'current_user',
    };
  }

  async deleteTemplateVersion(id: string, version: string): Promise<any> {
    // Mock implementation - in real app, this would delete from database
    return {
      templateId: id,
      version,
      deletedAt: new Date(),
      deletedBy: 'current_user',
    };
  }

  async restoreTemplateVersion(id: string, version: string): Promise<any> {
    // Mock implementation - in real app, this would restore version
    return {
      templateId: id,
      version,
      restoredAt: new Date(),
      restoredBy: 'current_user',
      isActive: true,
    };
  }

  async getTemplateAnalytics(id: string, query: any): Promise<any> {
    const { startDate, endDate } = query;
    
    // Mock implementation - in real app, this would calculate from database
    return {
      templateId: id,
      period: {
        startDate: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: endDate || new Date(),
      },
      usage: {
        totalSent: 15000,
        totalDelivered: 13500,
        totalOpened: 8100,
        totalClicked: 2430,
        totalConverted: 486,
      },
      rates: {
        deliveryRate: 90,
        openRate: 60,
        clickRate: 30,
        conversionRate: 20,
      },
      performance: {
        averageDeliveryTime: 2.5,
        averageOpenTime: 15.2,
        averageClickTime: 45.8,
      },
      breakdown: {
        byDay: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          sent: Math.floor(Math.random() * 1000),
          delivered: Math.floor(Math.random() * 900),
          opened: Math.floor(Math.random() * 600),
          clicked: Math.floor(Math.random() * 200),
        })),
        byHour: Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          sent: Math.floor(Math.random() * 100),
          delivered: Math.floor(Math.random() * 90),
          opened: Math.floor(Math.random() * 60),
          clicked: Math.floor(Math.random() * 20),
        })),
      },
    };
  }

  async getTemplateStats(id: string, query: any): Promise<any> {
    // Mock implementation - in real app, this would calculate from database
    return {
      templateId: id,
      overall: {
        totalUsage: 50000,
        successRate: 95.5,
        averageRating: 4.2,
        totalViews: 125000,
      },
      recent: {
        lastUsed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        lastUpdated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        timesUsedThisMonth: 1500,
        timesUsedThisYear: 18000,
      },
      performance: {
        ranking: 3,
        category: 'Top 5%',
        trend: 'improving',
        score: 87.5,
      },
    };
  }

  async getTemplateUsage(id: string, query: any): Promise<any> {
    // Mock implementation - in real app, this would fetch from database
    return {
      templateId: id,
      usage: [
        {
          id: 'usage_1',
          sentAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          recipient: 'user1@example.com',
          type: 'email',
          status: 'delivered',
          opened: true,
          clicked: false,
        },
        {
          id: 'usage_2',
          sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          recipient: 'user2@example.com',
          type: 'email',
          status: 'delivered',
          opened: true,
          clicked: true,
        },
        {
          id: 'usage_3',
          sentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          recipient: 'user3@example.com',
          type: 'sms',
          status: 'delivered',
          opened: null,
          clicked: null,
        },
      ],
      total: 3,
    };
  }

  async getTemplatePerformance(id: string, query: any): Promise<any> {
    // Mock implementation - in real app, this would calculate from database
    return {
      templateId: id,
      metrics: {
        speed: {
          averageCompilationTime: 0.05,
          averageDeliveryTime: 2.3,
          averageProcessingTime: 1.8,
        },
        quality: {
          errorRate: 0.02,
          bounceRate: 0.05,
          complaintRate: 0.01,
        },
        engagement: {
          averageOpenTime: 15.5,
          averageClickTime: 42.3,
          averageReadTime: 120.8,
        },
      },
      benchmarks: {
        comparedToAverage: {
          speed: 'faster',
          quality: 'better',
          engagement: 'higher',
        },
        percentile: {
          speed: 85,
          quality: 92,
          engagement: 78,
        },
      },
    };
  }

  async markTemplateAsFavorite(id: string): Promise<any> {
    const template = await this.templateRepository.findOne({ where: { id } });
    
    if (!template) {
      throw new Error('Template not found');
    }

    template.isFavorite = true;
    await this.templateRepository.save(template);

    return {
      templateId: id,
      isFavorite: true,
      markedAt: new Date(),
    };
  }

  async unmarkTemplateAsFavorite(id: string): Promise<any> {
    const template = await this.templateRepository.findOne({ where: { id } });
    
    if (!template) {
      throw new Error('Template not found');
    }

    template.isFavorite = false;
    await this.templateRepository.save(template);

    return {
      templateId: id,
      isFavorite: false,
      unmarkedAt: new Date(),
    };
  }

  async getFavoriteTemplates(query: any): Promise<{ templates: NotificationTemplate[]; total: number; page: number; limit: number }> {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 10);
    const skip = (page - 1) * limit;

    const [templates, total] = await this.templateRepository.findAndCount({
      where: { isFavorite: true },
      skip,
      take: limit,
      order: { updatedAt: 'DESC' },
    });

    return { templates, total, page, limit };
  }

  async archiveTemplate(id: string): Promise<any> {
    const template = await this.templateRepository.findOne({ where: { id } });
    
    if (!template) {
      throw new Error('Template not found');
    }

    template.isArchived = true;
    await this.templateRepository.save(template);

    return {
      templateId: id,
      isArchived: true,
      archivedAt: new Date(),
    };
  }

  async unarchiveTemplate(id: string): Promise<any> {
    const template = await this.templateRepository.findOne({ where: { id } });
    
    if (!template) {
      throw new Error('Template not found');
    }

    template.isArchived = false;
    await this.templateRepository.save(template);

    return {
      templateId: id,
      isArchived: false,
      unarchivedAt: new Date(),
    };
  }

  async getArchivedTemplates(query: any): Promise<{ templates: NotificationTemplate[]; total: number; page: number; limit: number }> {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 10);
    const skip = (page - 1) * limit;

    const [templates, total] = await this.templateRepository.findAndCount({
      where: { isArchived: true },
      skip,
      take: limit,
      order: { archivedAt: 'DESC' },
    });

    return { templates, total, page, limit };
  }

  async publishTemplate(id: string): Promise<any> {
    const template = await this.templateRepository.findOne({ where: { id } });
    
    if (!template) {
      throw new Error('Template not found');
    }

    template.isPublished = true;
    template.publishedAt = new Date();
    await this.templateRepository.save(template);

    return {
      templateId: id,
      isPublished: true,
      publishedAt: template.publishedAt,
    };
  }

  async unpublishTemplate(id: string): Promise<any> {
    const template = await this.templateRepository.findOne({ where: { id } });
    
    if (!template) {
      throw new Error('Template not found');
    }

    template.isPublished = false;
    template.publishedAt = null;
    await this.templateRepository.save(template);

    return {
      templateId: id,
      isPublished: false,
      unpublishedAt: new Date(),
    };
  }

  async getPublishedTemplates(query: any): Promise<{ templates: NotificationTemplate[]; total: number; page: number; limit: number }> {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 10);
    const skip = (page - 1) * limit;

    const [templates, total] = await this.templateRepository.findAndCount({
      where: { isPublished: true },
      skip,
      take: limit,
      order: { publishedAt: 'DESC' },
    });

    return { templates, total, page, limit };
  }

  async approveTemplate(id: string, approvedBy: string, notes?: string): Promise<any> {
    const template = await this.templateRepository.findOne({ where: { id } });
    
    if (!template) {
      throw new Error('Template not found');
    }

    template.status = 'approved';
    template.approvedBy = approvedBy;
    template.approvedAt = new Date();
    template.approvalNotes = notes;
    await this.templateRepository.save(template);

    return {
      templateId: id,
      status: 'approved',
      approvedBy,
      approvedAt: template.approvedAt,
      approvalNotes: notes,
    };
  }

  async rejectTemplate(id: string, rejectedBy: string, reason: string): Promise<any> {
    const template = await this.templateRepository.findOne({ where: { id } });
    
    if (!template) {
      throw new Error('Template not found');
    }

    template.status = 'rejected';
    template.rejectedBy = rejectedBy;
    template.rejectedAt = new Date();
    template.rejectionReason = reason;
    await this.templateRepository.save(template);

    return {
      templateId: id,
      status: 'rejected',
      rejectedBy,
      rejectedAt: template.rejectedAt,
      rejectionReason: reason,
    };
  }

  async getTemplatesPendingApproval(query: any): Promise<{ templates: NotificationTemplate[]; total: number; page: number; limit: number }> {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 10);
    const skip = (page - 1) * limit;

    const [templates, total] = await this.templateRepository.findAndCount({
      where: { status: 'pending_approval' },
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { templates, total, page, limit };
  }

  async shareTemplate(id: string, users: string[], permissions?: string[]): Promise<any> {
    // Mock implementation - in real app, this would save to database
    return {
      templateId: id,
      sharedWith: users,
      permissions: permissions || ['view', 'use'],
      sharedAt: new Date(),
      sharedBy: 'current_user',
    };
  }

  async unshareTemplate(id: string, userId: string): Promise<any> {
    // Mock implementation - in real app, this would update database
    return {
      templateId: id,
      unsharedWith: userId,
      unsharedAt: new Date(),
      unsharedBy: 'current_user',
    };
  }

  async getSharedTemplateUsers(id: string): Promise<any[]> {
    // Mock implementation - in real app, this would fetch from database
    return [
      {
        userId: 'user1',
        email: 'user1@example.com',
        permissions: ['view', 'use'],
        sharedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
      {
        userId: 'user2',
        email: 'user2@example.com',
        permissions: ['view'],
        sharedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
    ];
  }

  async getTemplatesSharedWithMe(query: any): Promise<{ templates: NotificationTemplate[]; total: number; page: number; limit: number }> {
    // Mock implementation - in real app, this would fetch from database
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 10);
    const skip = (page - 1) * limit;

    const [templates, total] = await this.templateRepository.findAndCount({
      where: { sharedWith: { $contains: 'current_user' } },
      skip,
      take: limit,
      order: { sharedAt: 'DESC' },
    });

    return { templates, total, page, limit };
  }

  async lockTemplate(id: string, lockedBy: string, reason?: string): Promise<any> {
    const template = await this.templateRepository.findOne({ where: { id } });
    
    if (!template) {
      throw new Error('Template not found');
    }

    template.isLocked = true;
    template.lockedBy = lockedBy;
    template.lockedAt = new Date();
    template.lockReason = reason;
    await this.templateRepository.save(template);

    return {
      templateId: id,
      isLocked: true,
      lockedBy,
      lockedAt: template.lockedAt,
      lockReason: reason,
    };
  }

  async unlockTemplate(id: string, unlockedBy: string): Promise<any> {
    const template = await this.templateRepository.findOne({ where: { id } });
    
    if (!template) {
      throw new Error('Template not found');
    }

    template.isLocked = false;
    template.lockedBy = null;
    template.lockedAt = null;
    template.lockReason = null;
    template.unlockedBy = unlockedBy;
    template.unlockedAt = new Date();
    await this.templateRepository.save(template);

    return {
      templateId: id,
      isLocked: false,
      unlockedBy,
      unlockedAt: template.unlockedAt,
    };
  }

  async getTemplateLockStatus(id: string): Promise<any> {
    const template = await this.templateRepository.findOne({ where: { id } });
    
    if (!template) {
      throw new Error('Template not found');
    }

    return {
      templateId: id,
      isLocked: template.isLocked || false,
      lockedBy: template.lockedBy,
      lockedAt: template.lockedAt,
      lockReason: template.lockReason,
      unlockedBy: template.unlockedBy,
      unlockedAt: template.unlockedAt,
    };
  }

  async getLockedTemplates(query: any): Promise<{ templates: NotificationTemplate[]; total: number; page: number; limit: number }> {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 10);
    const skip = (page - 1) * limit;

    const [templates, total] = await this.templateRepository.findAndCount({
      where: { isLocked: true },
      skip,
      take: limit,
      order: { lockedAt: 'DESC' },
    });

    return { templates, total, page, limit };
  }

  async addTagToTemplate(id: string, tag: string): Promise<any> {
    const template = await this.templateRepository.findOne({ where: { id } });
    
    if (!template) {
      throw new Error('Template not found');
    }

    if (!template.tags) {
      template.tags = [];
    }

    if (!template.tags.includes(tag)) {
      template.tags.push(tag);
      await this.templateRepository.save(template);
    }

    return {
      templateId: id,
      tag,
      addedAt: new Date(),
    };
  }

  async removeTagFromTemplate(id: string, tag: string): Promise<any> {
    const template = await this.templateRepository.findOne({ where: { id } });
    
    if (!template) {
      throw new Error('Template not found');
    }

    if (template.tags && template.tags.includes(tag)) {
      template.tags = template.tags.filter(t => t !== tag);
      await this.templateRepository.save(template);
    }

    return {
      templateId: id,
      tag,
      removedAt: new Date(),
    };
  }

  async getTemplateTags(): Promise<any[]> {
    // Mock implementation - in real app, this would fetch from database
    return [
      { tag: 'welcome', count: 15 },
      { tag: 'marketing', count: 28 },
      { tag: 'transactional', count: 45 },
      { tag: 'alert', count: 12 },
      { tag: 'newsletter', count: 8 },
      { tag: 'reminder', count: 18 },
      { tag: 'survey', count: 6 },
      { tag: 'promotion', count: 22 },
    ];
  }

  async getTemplatesByTag(tag: string, query: any): Promise<{ templates: NotificationTemplate[]; total: number; page: number; limit: number }> {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 10);
    const skip = (page - 1) * limit;

    const [templates, total] = await this.templateRepository.findAndCount({
      where: { tags: { $contains: tag } },
      skip,
      take: limit,
      order: { updatedAt: 'DESC' },
    });

    return { templates, total, page, limit };
  }

  async addCommentToTemplate(id: string, comment: string, userId: string): Promise<any> {
    // Mock implementation - in real app, this would save to database
    return {
      id: this.generateId(),
      templateId: id,
      comment,
      userId,
      createdAt: new Date(),
    };
  }

  async getTemplateComments(id: string): Promise<any[]> {
    // Mock implementation - in real app, this would fetch from database
    return [
      {
        id: 'comment_1',
        templateId: id,
        comment: 'Great template design!',
        userId: 'user1',
        userName: 'John Doe',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'comment_2',
        templateId: id,
        comment: 'Maybe we should add more variables',
        userId: 'user2',
        userName: 'Jane Smith',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    ];
  }

  async deleteTemplateComment(id: string, commentId: string): Promise<any> {
    // Mock implementation - in real app, this would delete from database
    return {
      templateId: id,
      commentId,
      deletedAt: new Date(),
      deletedBy: 'current_user',
    };
  }

  async searchTemplates(query: string, filters?: any): Promise<{ templates: NotificationTemplate[]; total: number; page: number; limit: number }> {
    const page = parseInt(filters?.page || '1', 10);
    const limit = parseInt(filters?.limit || '10', 10);
    const skip = (page - 1) * limit;

    const whereClause: any = {
      $or: [
        { name: { $like: `%${query}%` } },
        { description: { $like: `%${query}%` } },
        { content: { $like: `%${query}%` } },
        { tags: { $contains: query } },
      ],
    };

    if (filters?.category) {
      whereClause.category = filters.category;
    }

    if (filters?.type) {
      whereClause.type = filters.type;
    }

    if (filters?.status) {
      whereClause.status = filters.status;
    }

    const [templates, total] = await this.templateRepository.findAndCount({
      where: whereClause,
      skip,
      take: limit,
      order: { updatedAt: 'DESC' },
    });

    return { templates, total, page, limit };
  }

  async getRecentlyUsedTemplates(query: any): Promise<{ templates: NotificationTemplate[]; total: number; page: number; limit: number }> {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 10);
    const skip = (page - 1) * limit;

    // Mock implementation - in real app, this would fetch based on usage history
    const [templates, total] = await this.templateRepository.findAndCount({
      where: { lastUsedAt: { $ne: null } },
      skip,
      take: limit,
      order: { lastUsedAt: 'DESC' },
    });

    return { templates, total, page, limit };
  }

  async getPopularTemplates(query: any): Promise<{ templates: NotificationTemplate[]; total: number; page: number; limit: number }> {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 10);
    const skip = (page - 1) * limit;

    // Mock implementation - in real app, this would fetch based on usage count
    const [templates, total] = await this.templateRepository.findAndCount({
      where: { usageCount: { $gt: 0 } },
      skip,
      take: limit,
      order: { usageCount: 'DESC' },
    });

    return { templates, total, page, limit };
  }

  async getTrendingTemplates(query: any): Promise<{ templates: NotificationTemplate[]; total: number; page: number; limit: number }> {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 10);
    const skip = (page - 1) * limit;

    // Mock implementation - in real app, this would fetch based on recent usage trends
    const [templates, total] = await this.templateRepository.findAndCount({
      where: { trendingScore: { $gt: 0 } },
      skip,
      take: limit,
      order: { trendingScore: 'DESC' },
    });

    return { templates, total, page, limit };
  }

  async getRecommendedTemplates(query: any): Promise<{ templates: NotificationTemplate[]; total: number; page: number; limit: number }> {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 10);
    const skip = (page - 1) * limit;

    // Mock implementation - in real app, this would fetch based on user preferences
    const [templates, total] = await this.templateRepository.findAndCount({
      where: { recommended: true },
      skip,
      take: limit,
      order: { recommendationScore: 'DESC' },
    });

    return { templates, total, page, limit };
  }

  async getTemplateSuggestions(query: any): Promise<any[]> {
    // Mock implementation - in real app, this would generate suggestions based on AI
    return [
      {
        id: 'suggestion_1',
        name: 'Welcome Email Template',
        description: 'A professional welcome email for new users',
        category: 'welcome',
        type: 'email',
        score: 0.95,
        reason: 'Based on your recent activity with user onboarding',
      },
      {
        id: 'suggestion_2',
        name: 'Order Confirmation',
        description: 'Order confirmation template with tracking details',
        category: 'transactional',
        type: 'email',
        score: 0.88,
        reason: 'Popular template in your industry',
      },
      {
        id: 'suggestion_3',
        name: 'Promotional Offer',
        description: 'Eye-catching promotional template with discount',
        category: 'marketing',
        type: 'email',
        score: 0.82,
        reason: 'High performing template similar to your brand',
      },
    ];
  }

  async bulkOperations(operation: string, templateIds: string[], data?: any): Promise<any> {
    const results = [];
    
    for (const templateId of templateIds) {
      try {
        let result;
        
        switch (operation) {
          case 'archive':
            result = await this.archiveTemplate(templateId);
            break;
          case 'unarchive':
            result = await this.unarchiveTemplate(templateId);
            break;
          case 'publish':
            result = await this.publishTemplate(templateId);
            break;
          case 'unpublish':
            result = await this.unpublishTemplate(templateId);
            break;
          case 'favorite':
            result = await this.markTemplateAsFavorite(templateId);
            break;
          case 'unfavorite':
            result = await this.unmarkTemplateAsFavorite(templateId);
            break;
          case 'delete':
            result = await this.deleteTemplate(templateId);
            break;
          case 'addTags':
            if (data?.tags) {
              for (const tag of data.tags) {
                await this.addTagToTemplate(templateId, tag);
              }
            }
            result = { templateId, tagsAdded: data?.tags || [] };
            break;
          case 'removeTags':
            if (data?.tags) {
              for (const tag of data.tags) {
                await this.removeTagFromTemplate(templateId, tag);
              }
            }
            result = { templateId, tagsRemoved: data?.tags || [] };
            break;
          default:
            throw new Error(`Unsupported operation: ${operation}`);
        }
        
        results.push({
          templateId,
          success: true,
          result,
        });
      } catch (error) {
        results.push({
          templateId,
          success: false,
          error: error.message,
        });
      }
    }

    return {
      operation,
      results,
      total: templateIds.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      completedAt: new Date(),
    };
  }

  async getTemplateStatistics(query: any): Promise<any> {
    // Mock implementation - in real app, this would calculate from database
    return {
      overview: {
        totalTemplates: 150,
        activeTemplates: 120,
        archivedTemplates: 30,
        publishedTemplates: 85,
        draftTemplates: 35,
      },
      byType: {
        email: 80,
        sms: 35,
        push: 25,
        webhook: 10,
      },
      byCategory: {
        welcome: 15,
        notification: 32,
        marketing: 28,
        transactional: 45,
        alert: 12,
        newsletter: 8,
        reminder: 18,
        survey: 6,
      },
      byStatus: {
        draft: 35,
        pending_approval: 12,
        approved: 85,
        rejected: 8,
        archived: 30,
      },
      usage: {
        totalUsage: 500000,
        averageUsagePerTemplate: 3333,
        mostUsedTemplate: 'Welcome Email',
        leastUsedTemplate: 'Survey Request',
      },
      performance: {
        averageDeliveryRate: 94.5,
        averageOpenRate: 62.3,
        averageClickRate: 28.7,
        averageConversionRate: 18.2,
      },
      trends: {
        createdThisMonth: 12,
        updatedThisMonth: 28,
        usedThisMonth: 15000,
        popularCategories: ['transactional', 'marketing', 'notification'],
      },
    };
  }

  async getTemplatesServiceHealth(): Promise<any> {
    // Mock implementation - in real app, this would check service health
    return {
      status: 'healthy',
      timestamp: new Date(),
      services: {
        database: {
          status: 'healthy',
          responseTime: 15,
          lastCheck: new Date(),
        },
        cache: {
          status: 'healthy',
          responseTime: 2,
          lastCheck: new Date(),
        },
        storage: {
          status: 'healthy',
          responseTime: 8,
          lastCheck: new Date(),
        },
      },
      metrics: {
        totalRequests: 150000,
        averageResponseTime: 45,
        errorRate: 0.02,
        uptime: 99.95,
      },
      version: '1.0.0',
      environment: 'production',
    };
  }

  private compileTemplateContent(content: string, data: any): string {
    // Simple template compilation - in real app, use a proper template engine
    let compiled = content;
    
    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      compiled = compiled.replace(regex, String(value));
    }
    
    return compiled;
  }

  private extractVariables(content: string): string[] {
    // Extract template variables - in real app, use a proper parser
    const variables = [];
    const regex = /{{\s*([^}]+)\s*}}/g;
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      variables.push(match[1].trim());
    }
    
    return [...new Set(variables)];
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
