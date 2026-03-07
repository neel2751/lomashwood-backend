import { HttpClient } from '../utils/http';
import {
  PaginatedResponse,
  SupportTicket,
  CreateSupportTicketRequest,
  UpdateSupportTicketRequest,
  SupportTicketFilters,
} from '../types/api.types';

export class SupportService {
  constructor(private apiClient: HttpClient) {}

  // Support Ticket Management
  async getSupportTickets(params?: SupportTicketFilters & {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<SupportTicket[]>> {
    return this.apiClient.get<PaginatedResponse<SupportTicket[]>>('/support/tickets', { params });
  }

  async getSupportTicket(ticketId: string): Promise<SupportTicket> {
    return this.apiClient.get<SupportTicket>(`/support/tickets/${ticketId}`);
  }

  async getSupportTicketByNumber(ticketNumber: string): Promise<SupportTicket> {
    return this.apiClient.get<SupportTicket>(`/support/tickets/number/${ticketNumber}`);
  }

  async createSupportTicket(ticketData: CreateSupportTicketRequest): Promise<SupportTicket> {
    if (ticketData.attachments && ticketData.attachments.length > 0) {
      const formData = new FormData();
      Object.entries(ticketData).forEach(([key, value]) => {
        if (key !== 'attachments') {
          if (typeof value === 'object') {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, String(value));
          }
        }
      });
      ticketData.attachments.forEach((file, index) => {
        formData.append(`attachments[${index}]`, file);
      });
      return this.apiClient.post<SupportTicket>('/support/tickets', formData);
    }
    return this.apiClient.post<SupportTicket>('/support/tickets', ticketData);
  }

  async updateSupportTicket(ticketId: string, updateData: UpdateSupportTicketRequest): Promise<SupportTicket> {
    return this.apiClient.put<SupportTicket>(`/support/tickets/${ticketId}`, updateData);
  }

  async deleteSupportTicket(ticketId: string): Promise<void> {
    return this.apiClient.delete<void>(`/support/tickets/${ticketId}`);
  }

  // Ticket Status Management
  async assignSupportTicket(ticketId: string, assignedToId: string): Promise<SupportTicket> {
    return this.apiClient.post<SupportTicket>(`/support/tickets/${ticketId}/assign`, { assignedToId });
  }

  async unassignSupportTicket(ticketId: string): Promise<SupportTicket> {
    return this.apiClient.post<SupportTicket>(`/support/tickets/${ticketId}/unassign`, {});
  }

  async escalateSupportTicket(ticketId: string, reason: string): Promise<SupportTicket> {
    return this.apiClient.post<SupportTicket>(`/support/tickets/${ticketId}/escalate`, { reason });
  }

  async resolveSupportTicket(ticketId: string, resolution: string): Promise<SupportTicket> {
    return this.apiClient.post<SupportTicket>(`/support/tickets/${ticketId}/resolve`, { resolution });
  }

  async closeSupportTicket(ticketId: string): Promise<SupportTicket> {
    return this.apiClient.post<SupportTicket>(`/support/tickets/${ticketId}/close`, {});
  }

  async reopenSupportTicket(ticketId: string, reason: string): Promise<SupportTicket> {
    return this.apiClient.post<SupportTicket>(`/support/tickets/${ticketId}/reopen`, { reason });
  }

  // Ticket Comments
  async getSupportTicketComments(ticketId: string): Promise<Array<{
    id: string;
    content: string;
    author: {
      id: string;
      name: string;
      email: string;
      type: 'customer' | 'agent' | 'system';
    };
    isInternal: boolean;
    attachments: Array<{
      id: string;
      filename: string;
      url: string;
      size: number;
      mimetype: string;
    }>;
    createdAt: string;
    updatedAt: string;
  }>> {
    return this.apiClient.get<Array<any>>(`/support/tickets/${ticketId}/comments`);
  }

  async addSupportTicketComment(ticketId: string, comment: {
    content: string;
    isInternal?: boolean;
    attachments?: File[];
  }): Promise<any> {
    if (comment.attachments && comment.attachments.length > 0) {
      const formData = new FormData();
      formData.append('content', comment.content);
      formData.append('isInternal', String(comment.isInternal || false));
      comment.attachments.forEach((file, index) => {
        formData.append(`attachments[${index}]`, file);
      });
      return this.apiClient.post<any>(`/support/tickets/${ticketId}/comments`, formData);
    }
    return this.apiClient.post<any>(`/support/tickets/${ticketId}/comments`, comment);
  }

  async updateSupportTicketComment(ticketId: string, commentId: string, content: string): Promise<any> {
    return this.apiClient.put<any>(`/support/tickets/${ticketId}/comments/${commentId}`, { content });
  }

  async deleteSupportTicketComment(ticketId: string, commentId: string): Promise<void> {
    return this.apiClient.delete<void>(`/support/tickets/${ticketId}/comments/${commentId}`);
  }

  // Ticket Attachments
  async addSupportTicketAttachment(ticketId: string, file: File): Promise<{
    id: string;
    filename: string;
    url: string;
    size: number;
    mimetype: string;
  }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.apiClient.post<any>(`/support/tickets/${ticketId}/attachments`, formData);
  }

  async deleteSupportTicketAttachment(ticketId: string, attachmentId: string): Promise<void> {
    return this.apiClient.delete<void>(`/support/tickets/${ticketId}/attachments/${attachmentId}`);
  }

  // Ticket Satisfaction
  async setSupportTicketSatisfaction(ticketId: string, rating: number, comment?: string): Promise<SupportTicket> {
    return this.apiClient.post<SupportTicket>(`/support/tickets/${ticketId}/satisfaction`, { rating, comment });
  }

  // Ticket Search
  async searchSupportTickets(query: string, params?: {
    page?: number;
    limit?: number;
    filters?: SupportTicketFilters;
  }): Promise<PaginatedResponse<SupportTicket[]>> {
    return this.apiClient.get<PaginatedResponse<SupportTicket[]>>('/support/tickets/search', {
      params: { query, ...params }
    });
  }

  // Support Analytics
  async getSupportAnalytics(params?: {
    startDate?: string;
    endDate?: string;
    groupBy?: 'day' | 'week' | 'month';
    metrics?: string[];
  }): Promise<{
    summary: {
      totalTickets: number;
      openTickets: number;
      resolvedTickets: number;
      closedTickets: number;
      avgResponseTime: number;
      avgResolutionTime: number;
      customerSatisfaction: number;
      firstContactResolution: number;
    };
    trends: Array<{
      date: string;
      created: number;
      resolved: number;
      closed: number;
      avgResponseTime: number;
      avgResolutionTime: number;
      satisfaction: number;
    }>;
    byPriority: Array<{
      priority: string;
      count: number;
      percentage: number;
    }>;
    byStatus: Array<{
      status: string;
      count: number;
      percentage: number;
    }>;
    byCategory: Array<{
      category: string;
      count: number;
      percentage: number;
    }>;
    byType: Array<{
      type: string;
      count: number;
      percentage: number;
    }>;
    bySource: Array<{
      source: string;
      count: number;
      percentage: number;
    }>;
    topAgents: Array<{
      agent: {
        id: string;
        name: string;
      };
      ticketsHandled: number;
      avgResponseTime: number;
      avgResolutionTime: number;
      customerSatisfaction: number;
    }>;
  }> {
    return this.apiClient.get<any>('/support/analytics', { params });
  }

  async getSupportStats(): Promise<{
    totalTickets: number;
    openTickets: number;
    pendingTickets: number;
    resolvedTickets: number;
    closedTickets: number;
    overdueTickets: number;
    escalatedTickets: number;
    avgResponseTime: number;
    avgResolutionTime: number;
    customerSatisfaction: number;
    firstContactResolution: number;
    ticketsToday: number;
    ticketsThisWeek: number;
    ticketsThisMonth: number;
  }> {
    return this.apiClient.get<any>('/support/stats');
  }

  // Support Categories
  async getSupportCategories(): Promise<Array<{
    id: string;
    name: string;
    description?: string;
    isActive: boolean;
    sortOrder: number;
    ticketCount: number;
  }>> {
    return this.apiClient.get<Array<any>>('/support/categories');
  }

  async createSupportCategory(categoryData: {
    name: string;
    description?: string;
    isActive?: boolean;
    sortOrder?: number;
  }): Promise<any> {
    return this.apiClient.post<any>('/support/categories', categoryData);
  }

  async updateSupportCategory(categoryId: string, updateData: {
    name?: string;
    description?: string;
    isActive?: boolean;
    sortOrder?: number;
  }): Promise<any> {
    return this.apiClient.put<any>(`/support/categories/${categoryId}`, updateData);
  }

  async deleteSupportCategory(categoryId: string): Promise<void> {
    return this.apiClient.delete<void>(`/support/categories/${categoryId}`);
  }

  // Support Tags
  async getSupportTags(): Promise<Array<{
    id: string;
    name: string;
    color?: string;
    ticketCount: number;
  }>> {
    return this.apiClient.get<Array<any>>('/support/tags');
  }

  async createSupportTag(tagData: {
    name: string;
    color?: string;
  }): Promise<any> {
    return this.apiClient.post<any>('/support/tags', tagData);
  }

  async updateSupportTag(tagId: string, updateData: {
    name?: string;
    color?: string;
  }): Promise<any> {
    return this.apiClient.put<any>(`/support/tags/${tagId}`, updateData);
  }

  async deleteSupportTag(tagId: string): Promise<void> {
    return this.apiClient.delete<void>(`/support/tags/${tagId}`);
  }

  // Support Agents
  async getSupportAgents(): Promise<Array<{
    id: string;
    name: string;
    email: string;
    isActive: boolean;
    role: string;
    ticketsHandled: number;
    avgResponseTime: number;
    avgResolutionTime: number;
    customerSatisfaction: number;
    currentWorkload: number;
    maxWorkload: number;
  }>> {
    return this.apiClient.get<Array<any>>('/support/agents');
  }

  async getSupportAgent(agentId: string): Promise<any> {
    return this.apiClient.get<any>(`/support/agents/${agentId}`);
  }

  async updateSupportAgentWorkload(agentId: string, maxWorkload: number): Promise<any> {
    return this.apiClient.put<any>(`/support/agents/${agentId}/workload`, { maxWorkload });
  }

  // Support Export
  async exportSupportTickets(params?: {
    format?: 'csv' | 'excel' | 'pdf';
    filters?: SupportTicketFilters;
    fields?: string[];
    includeComments?: boolean;
    includeAttachments?: boolean;
  }): Promise<Blob> {
    return this.apiClient.getBlob('/support/tickets/export', { params });
  }

  // Support Automation
  async getSupportAutomationRules(): Promise<Array<{
    id: string;
    name: string;
    description?: string;
    isActive: boolean;
    conditions: Array<{
      field: string;
      operator: string;
      value: any;
    }>;
    actions: Array<{
      type: string;
      config: Record<string, any>;
    }>;
    priority: number;
    triggerCount: number;
    lastTriggered?: string;
  }>> {
    return this.apiClient.get<Array<any>>('/support/automation/rules');
  }

  async createSupportAutomationRule(ruleData: {
    name: string;
    description?: string;
    conditions: Array<{
      field: string;
      operator: string;
      value: any;
    }>;
    actions: Array<{
      type: string;
      config: Record<string, any>;
    }>;
    priority?: number;
    isActive?: boolean;
  }): Promise<any> {
    return this.apiClient.post<any>('/support/automation/rules', ruleData);
  }

  async updateSupportAutomationRule(ruleId: string, updateData: {
    name?: string;
    description?: string;
    conditions?: Array<{
      field: string;
      operator: string;
      value: any;
    }>;
    actions?: Array<{
      type: string;
      config: Record<string, any>;
    }>;
    priority?: number;
    isActive?: boolean;
  }): Promise<any> {
    return this.apiClient.put<any>(`/support/automation/rules/${ruleId}`, updateData);
  }

  async deleteSupportAutomationRule(ruleId: string): Promise<void> {
    return this.apiClient.delete<void>(`/support/automation/rules/${ruleId}`);
  }

  async testSupportAutomationRule(ruleId: string, testData: Record<string, any>): Promise<{
    matches: boolean;
    actions: Array<{
      type: string;
      result: any;
    }>;
  }> {
    return this.apiClient.post<any>(`/support/automation/rules/${ruleId}/test`, testData);
  }
}
