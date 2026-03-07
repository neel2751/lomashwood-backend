import { HttpClient } from '../utils/http';
import {
  PaginatedResponse,
  Template,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  TemplateFilters,
} from '../types/api.types';

export class TemplateService {
  constructor(private HttpClient: HttpClient) {}

  // Template Management
  async getTemplates(params?: TemplateFilters & {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<Template[]>> {
    return this.HttpClient.get<PaginatedResponse<Template[]>>('/templates', { params });
  }

  async getTemplate(templateId: string): Promise<Template> {
    return this.HttpClient.get<Template>(`/templates/${templateId}`);
  }

  async createTemplate(templateData: CreateTemplateRequest): Promise<Template> {
    return this.HttpClient.post<Template>('/templates', templateData);
  }

  async updateTemplate(templateId: string, updateData: UpdateTemplateRequest): Promise<Template> {
    return this.HttpClient.put<Template>(`/templates/${templateId}`, updateData);
  }

  async deleteTemplate(templateId: string): Promise<void> {
    return this.HttpClient.delete<void>(`/templates/${templateId}`);
  }

  // Template Categories
  async getTemplateCategories(): Promise<Array<{
    id: string;
    name: string;
    description?: string;
    templateCount: number;
    isActive: boolean;
    createdAt: string;
  }>> {
    return this.HttpClient.get<any[]>('/templates/categories');
  }

  async createTemplateCategory(categoryData: {
    name: string;
    description?: string;
    isActive?: boolean;
  }): Promise<any> {
    return this.HttpClient.post<any>('/templates/categories', categoryData);
  }

  async updateTemplateCategory(categoryId: string, updateData: {
    name?: string;
    description?: string;
    isActive?: boolean;
  }): Promise<any> {
    return this.HttpClient.put<any>(`/templates/categories/${categoryId}`, updateData);
  }

  async deleteTemplateCategory(categoryId: string): Promise<void> {
    return this.HttpClient.delete<void>(`/templates/categories/${categoryId}`);
  }

  async getTemplatesByCategory(categoryId: string, params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<Template[]>> {
    return this.HttpClient.get<PaginatedResponse<Template[]>>(`/templates/categories/${categoryId}`, { params });
  }

  // Template Preview
  async previewTemplate(templateId: string, variables?: Record<string, any>): Promise<{
    templateId: string;
    html: string;
    text?: string;
    subject?: string;
    variables: Record<string, any>;
    renderedAt: string;
  }> {
    return this.HttpClient.post<any>(`/templates/${templateId}/preview`, { variables });
  }

  async previewTemplateWithContent(templateId: string, previewData: {
    content?: string;
    variables?: Record<string, any>;
    context?: Record<string, any>;
  }): Promise<{
    templateId: string;
    html: string;
    text?: string;
    subject?: string;
    variables: Record<string, any>;
    context: Record<string, any>;
    renderedAt: string;
  }> {
    return this.HttpClient.post<any>(`/templates/${templateId}/preview-with-content`, previewData);
  }

  // Template Variables
  async getTemplateVariables(templateId: string): Promise<Array<{
    name: string;
    type: string;
    label: string;
    description?: string;
    required: boolean;
    defaultValue?: any;
    options?: Array<{
      label: string;
      value: any;
    }>;
    validation?: {
      min?: number;
      max?: number;
      pattern?: string;
      custom?: string;
    };
  }>> {
    return this.HttpClient.get<any[]>(`/templates/${templateId}/variables`);
  }

  async validateTemplateVariables(templateId: string, variables: Record<string, any>): Promise<{
    valid: boolean;
    errors?: Array<{
      variable: string;
      message: string;
      value: any;
    }>;
    warnings?: Array<{
      variable: string;
      message: string;
      value: any;
    }>;
  }> {
    return this.HttpClient.post<any>(`/templates/${templateId}/validate`, { variables });
  }

  // Template Rendering
  async renderTemplate(templateId: string, renderData: {
    variables: Record<string, any>;
    context?: Record<string, any>;
    format?: 'HTML' | 'TEXT' | 'JSON';
  }): Promise<{
    templateId: string;
    rendered: string;
    format: string;
    variables: Record<string, any>;
    context: Record<string, any>;
    renderedAt: string;
    metadata?: {
      wordCount?: number;
      characterCount?: number;
      renderingTime?: number;
    };
  }> {
    return this.HttpClient.post<any>(`/templates/${templateId}/render`, renderData);
  }

  async renderTemplateBatch(templateId: string, batchData: {
    items: Array<{
      id: string;
      variables: Record<string, any>;
      context?: Record<string, any>;
    }>;
    format?: 'HTML' | 'TEXT' | 'JSON';
  }): Promise<Array<{
    id: string;
    rendered: string;
    format: string;
    variables: Record<string, any>;
    context: Record<string, any>;
    renderedAt: string;
    errors?: Array<{
      variable: string;
      message: string;
    }>;
  }>> {
    return this.HttpClient.post<any[]>(`/templates/${templateId}/render-batch`, batchData);
  }

  // Template Versions
  async getTemplateVersions(templateId: string, params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Array<{
    id: string;
    templateId: string;
    version: number;
    name: string;
    content: string;
    variables: any;
    author: {
      id: string;
      name: string;
    };
    changeLog?: string;
    isActive: boolean;
    createdAt: string;
  }>>> {
    return this.HttpClient.get<PaginatedResponse<any[]>>(`/templates/${templateId}/versions`, { params });
  }

  async createTemplateVersion(templateId: string, versionData: {
    name: string;
    content?: string;
    variables?: any;
    changeLog?: string;
  }): Promise<any> {
    return this.HttpClient.post<any>(`/templates/${templateId}/versions`, versionData);
  }

  async restoreTemplateVersion(templateId: string, versionId: string): Promise<Template> {
    return this.HttpClient.post<Template>(`/templates/${templateId}/versions/${versionId}/restore`);
  }

  async compareTemplateVersions(templateId: string, version1: string, version2: string): Promise<{
    templateId: string;
    version1: {
      id: string;
      version: number;
      createdAt: string;
    };
    version2: {
      id: string;
      version: number;
      createdAt: string;
    };
    differences: Array<{
      type: 'ADDED' | 'REMOVED' | 'MODIFIED';
      path: string;
      oldValue?: any;
      newValue?: any;
    }>;
  }> {
    return this.HttpClient.get<any>(`/templates/${templateId}/versions/compare`, {
      params: { version1, version2 },
    });
  }

  // Template Testing
  async testTemplate(templateId: string, testData: {
    testCases: Array<{
      name: string;
      variables: Record<string, any>;
      expectedOutput?: string;
      context?: Record<string, any>;
    }>;
  }): Promise<{
    templateId: string;
    testResults: Array<{
      testCase: string;
      passed: boolean;
      output: string;
      expectedOutput?: string;
      error?: string;
      executionTime: number;
    }>;
    summary: {
      total: number;
      passed: number;
      failed: number;
      successRate: number;
    };
    testedAt: string;
  }> {
    return this.HttpClient.post<any>(`/templates/${templateId}/test`, testData);
  }

  async getTemplateTestHistory(templateId: string, params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Array<{
    id: string;
    templateId: string;
    testResults: any;
    summary: any;
    testedAt: string;
    testedBy: string;
  }>>> {
    return this.HttpClient.get<PaginatedResponse<any[]>>(`/templates/${templateId}/test-history`, { params });
  }

  // Template Analytics
  async getTemplateAnalytics(templateId: string, params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{
    templateId: string;
    usage: {
      totalRenderings: number;
      uniqueUsers: number;
      averageRenderTime: number;
      errorRate: number;
    };
    performance: {
      averageRenderTime: number;
      fastestRenderTime: number;
      slowestRenderTime: number;
      renderTimeDistribution: Array<{
        range: string;
        count: number;
      }>;
    };
    errors: Array<{
      type: string;
      count: number;
      message: string;
      lastOccurred: string;
    }>;
    variables: Array<{
      name: string;
      usage: number;
      errorRate: number;
      averageValue?: any;
    }>;
    dailyStats: Array<{
      date: string;
      renderings: number;
      uniqueUsers: number;
      averageRenderTime: number;
      errors: number;
    }>;
  }> {
    return this.HttpClient.get<any>(`/templates/${templateId}/analytics`, { params });
  }

  async getTemplateUsageStats(params?: {
    startDate?: string;
    endDate?: string;
    categoryId?: string;
  }): Promise<{
    totalTemplates: number;
    totalRenderings: number;
    uniqueUsers: number;
    averageRenderTime: number;
    topTemplates: Array<{
      templateId: string;
      name: string;
      renderings: number;
      uniqueUsers: number;
      averageRenderTime: number;
    }>;
    categoryStats: Array<{
      categoryId: string;
      categoryName: string;
      renderings: number;
      uniqueUsers: number;
    }>;
    dailyStats: Array<{
      date: string;
      renderings: number;
      uniqueUsers: number;
      averageRenderTime: number;
    }>;
  }> {
    return this.HttpClient.get<any>('/templates/analytics', { params });
  }

  // Template Search
  async searchTemplates(query: string, params?: {
    page?: number;
    limit?: number;
    categoryId?: string;
    type?: string;
  }): Promise<PaginatedResponse<Template[]>> {
    return this.HttpClient.get<PaginatedResponse<Template[]>>('/templates/search', {
      params: { q: query, ...params },
    });
  }

  // Template Cloning
  async cloneTemplate(templateId: string, cloneData: {
    name: string;
    description?: string;
    categoryId?: string;
    copyContent?: boolean;
    copyVariables?: boolean;
  }): Promise<Template> {
    return this.HttpClient.post<Template>(`/templates/${templateId}/clone`, cloneData);
  }

  // Template Export/Import
  async exportTemplate(templateId: string, options?: {
    format?: 'JSON' | 'HTML' | 'ZIP';
    includeVersions?: boolean;
    includeAnalytics?: boolean;
  }): Promise<Blob> {
    return this.HttpClient.get<Blob>(`/templates/${templateId}/export`, {
      params: options,
      responseType: 'blob',
    });
  }

  async exportTemplates(params?: {
    templateIds?: string[];
    categoryId?: string;
    format?: 'JSON' | 'ZIP';
    includeVersions?: boolean;
    includeAnalytics?: boolean;
  }): Promise<Blob> {
    return this.HttpClient.get<Blob>('/templates/export', {
      params,
      responseType: 'blob',
    });
  }

  async importTemplate(file: File, options?: {
    overwrite?: boolean;
    createMissing?: boolean;
    validateSyntax?: boolean;
    categoryId?: string;
  }): Promise<{
    imported: number;
    updated: number;
    skipped: number;
    errors: Array<{
      row: number;
      error: string;
      data: any;
    }>;
  }> {
    const formData = new FormData();
    formData.append('file', file);

    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        formData.append(key, value.toString());
      });
    }

    
return this.HttpClient.upload<any>('/templates/import', formData);
  }

  
  async validateTemplate(templateData: {
    name: string;
    content: string;
    variables?: any;
    categoryId?: string;
  }): Promise<{
    valid: boolean;
    errors?: Array<{
      type: 'SYNTAX' | 'VARIABLE' | 'LOGIC' | 'SECURITY';
      message: string;
      line?: number;
      column?: number;
    }>;
    warnings?: Array<{
      type: 'PERFORMANCE' | 'ACCESSIBILITY' | 'SEO';
      message: string;
      suggestion: string;
    }>;
    suggestions?: Array<{
      type: 'OPTIMIZATION' | 'BEST_PRACTICE';
      message: string;
      improvement: string;
    }>;
  }> {
    return this.HttpClient.post<any>('/templates/validate', templateData);
  }

  // Template Security
  async checkTemplateSecurity(templateId: string): Promise<{
    templateId: string;
    securityLevel: 'SAFE' | 'WARNING' | 'RISKY' | 'UNSAFE';
    issues: Array<{
      type: 'XSS' | 'INJECTION' | 'PRIVILEGE_ESCALATION' | 'DATA_EXPOSURE';
      severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      message: string;
      location?: {
        line: number;
        column: number;
      };
      recommendation: string;
    }>;
    recommendations: Array<{
      priority: 'HIGH' | 'MEDIUM' | 'LOW';
      action: string;
      description: string;
    }>;
    scannedAt: string;
  }> {
    return this.HttpClient.post<any>(`/templates/${templateId}/security-check`);
  }

  // Template Optimization
  async optimizeTemplate(templateId: string, optimizationData?: {
    focus?: 'PERFORMANCE' | 'SEO' | 'ACCESSIBILITY' | 'ALL';
    variables?: Record<string, any>;
  }): Promise<{
    templateId: string;
    originalContent: string;
    optimizedContent: string;
    optimizations: Array<{
      type: 'PERFORMANCE' | 'SEO' | 'ACCESSIBILITY';
      action: string;
      description: string;
      impact: 'HIGH' | 'MEDIUM' | 'LOW';
    }>;
    metrics: {
      originalSize: number;
      optimizedSize: number;
      sizeReduction: number;
      estimatedPerformanceGain: number;
    };
    optimizedAt: string;
  }> {
    return this.HttpClient.post<any>(`/templates/${templateId}/optimize`, optimizationData);
  }

  // Template Settings
  async getTemplateSettings(): Promise<{
    general: {
      defaultCategory?: string;
      allowUserTemplates: boolean;
      requireApproval: boolean;
      enableVersioning: boolean;
      maxVersions: number;
    };
    security: {
      enableSecurityScanning: boolean;
      allowedFunctions: string[];
      blockedFunctions: string[];
      maxExecutionTime: number;
    };
    performance: {
      enableCaching: boolean;
      cacheTimeout: number;
      enableCompression: boolean;
      maxTemplateSize: number;
    };
    notifications: {
      newTemplateNotification: boolean;
      templateErrorNotification: boolean;
      performanceAlerts: boolean;
    };
  }> {
    return this.HttpClient.get<any>('/templates/settings');
  }

  async updateTemplateSettings(settings: {
    general?: {
      defaultCategory?: string;
      allowUserTemplates?: boolean;
      requireApproval?: boolean;
      enableVersioning?: boolean;
      maxVersions?: number;
    };
    security?: {
      enableSecurityScanning?: boolean;
      allowedFunctions?: string[];
      blockedFunctions?: string[];
      maxExecutionTime?: number;
    };
    performance?: {
      enableCaching?: boolean;
      cacheTimeout?: number;
      enableCompression?: boolean;
      maxTemplateSize?: number;
    };
    notifications?: {
      newTemplateNotification?: boolean;
      templateErrorNotification?: boolean;
      performanceAlerts?: boolean;
    };
  }): Promise<any> {
    return this.HttpClient.put<any>('/templates/settings', settings);
  }

  // Template Collaboration
  async getTemplateCollaborators(templateId: string): Promise<Array<{
    userId: string;
    name: string;
    email: string;
    role: 'OWNER' | 'EDITOR' | 'VIEWER';
    permissions: string[];
    addedAt: string;
    lastActive?: string;
  }>> {
    return this.HttpClient.get<any[]>(`/templates/${templateId}/collaborators`);
  }

  async addTemplateCollaborator(templateId: string, collaboratorData: {
    userId: string;
    role: 'OWNER' | 'EDITOR' | 'VIEWER';
    permissions?: string[];
  }): Promise<any> {
    return this.HttpClient.post<any>(`/templates/${templateId}/collaborators`, collaboratorData);
  }

  async updateTemplateCollaborator(templateId: string, userId: string, updateData: {
    role?: 'OWNER' | 'EDITOR' | 'VIEWER';
    permissions?: string[];
  }): Promise<any> {
    return this.HttpClient.put<any>(`/templates/${templateId}/collaborators/${userId}`, updateData);
  }

  async removeTemplateCollaborator(templateId: string, userId: string): Promise<void> {
    return this.HttpClient.delete<void>(`/templates/${templateId}/collaborators/${userId}`);
  }

  // Template Comments
  async getTemplateComments(templateId: string, params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Array<{
    id: string;
    templateId: string;
    userId: string;
    userName: string;
    content: string;
    position?: {
      line: number;
      column: number;
    };
    resolved: boolean;
    createdAt: string;
    updatedAt?: string;
    replies?: Array<{
      id: string;
      userId: string;
      userName: string;
      content: string;
      createdAt: string;
    }>;
  }>>> {
    return this.HttpClient.get<PaginatedResponse<any[]>>(`/templates/${templateId}/comments`, { params });
  }

  async addTemplateComment(templateId: string, commentData: {
    content: string;
    position?: {
      line: number;
      column: number;
    };
  }): Promise<any> {
    return this.HttpClient.post<any>(`/templates/${templateId}/comments`, commentData);
  }

  async updateTemplateComment(templateId: string, commentId: string, updateData: {
    content?: string;
    resolved?: boolean;
  }): Promise<any> {
    return this.HttpClient.put<any>(`/templates/${templateId}/comments/${commentId}`, updateData);
  }

  async deleteTemplateComment(templateId: string, commentId: string): Promise<void> {
    return this.HttpClient.delete<void>(`/templates/${templateId}/comments/${commentId}`);
  }
}