import { HttpClient } from '../utils/http';
import { PaginatedResponse } from '../types/api.types';

// ── Missing types (move to api.types.ts and re-export from there if preferred) ──

export interface Invoice {
  id: string;
  invoiceNumber: string;
  type: 'STANDARD' | 'PROFORMA' | 'CREDIT' | 'DEBIT';
  status: 'DRAFT' | 'SENT' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE' | 'CANCELLED' | 'VOID';
  customerId: string;
  orderId?: string;
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    taxRate: number;
    taxAmount: number;
    discountRate: number;
    discountAmount: number;
  }>;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  currency: string;
  dueDate?: string;
  notes?: string;
  terms?: string;
  customFields?: Record<string, any>;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateInvoiceRequest {
  type?: 'STANDARD' | 'PROFORMA' | 'CREDIT' | 'DEBIT';
  customerId: string;
  orderId?: string;
  items: Array<{
    productId?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate?: number;
    discountRate?: number;
    metadata?: any;
  }>;
  currency?: string;
  dueDate?: string;
  notes?: string;
  terms?: string;
  customFields?: Record<string, any>;
}

export interface UpdateInvoiceRequest {
  type?: 'STANDARD' | 'PROFORMA' | 'CREDIT' | 'DEBIT';
  items?: Array<{
    productId?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate?: number;
    discountRate?: number;
    metadata?: any;
  }>;
  currency?: string;
  dueDate?: string;
  notes?: string;
  terms?: string;
  customFields?: Record<string, any>;
}

export interface InvoiceFilters {
  status?: 'DRAFT' | 'SENT' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE' | 'CANCELLED' | 'VOID';
  type?: 'STANDARD' | 'PROFORMA' | 'CREDIT' | 'DEBIT';
  customerId?: string;
  orderId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

// ── Service ───────────────────────────────────────────────────────────────────

export class InvoiceService {
  constructor(private HttpClient: HttpClient) {}

  // ── Invoice Management ───────────────────────────────────────────────────────

  async getInvoices(params?: InvoiceFilters & {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<Invoice[]>> {
    return this.HttpClient.get<PaginatedResponse<Invoice[]>>('/invoices', { params });
  }

  async getInvoice(invoiceId: string): Promise<Invoice> {
    return this.HttpClient.get<Invoice>(`/invoices/${invoiceId}`);
  }

  async getInvoiceByNumber(invoiceNumber: string): Promise<Invoice> {
    return this.HttpClient.get<Invoice>(`/invoices/number/${invoiceNumber}`);
  }

  async createInvoice(invoiceData: CreateInvoiceRequest): Promise<Invoice> {
    return this.HttpClient.post<Invoice>('/invoices', invoiceData);
  }

  async updateInvoice(invoiceId: string, updateData: UpdateInvoiceRequest): Promise<Invoice> {
    return this.HttpClient.put<Invoice>(`/invoices/${invoiceId}`, updateData);
  }

  async deleteInvoice(invoiceId: string): Promise<void> {
    return this.HttpClient.delete<void>(`/invoices/${invoiceId}`);
  }

  // ── Order Invoices ───────────────────────────────────────────────────────────

  async getOrderInvoices(orderId: string, params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Invoice[]>> {
    return this.HttpClient.get<PaginatedResponse<Invoice[]>>(`/invoices/order/${orderId}`, { params });
  }

  async createOrderInvoice(orderId: string, invoiceData?: {
    dueDate?: string;
    notes?: string;
    terms?: string;
    customFields?: Record<string, any>;
  }): Promise<Invoice> {
    return this.HttpClient.post<Invoice>(`/invoices/order/${orderId}`, invoiceData);
  }

  // ── Customer Invoices ────────────────────────────────────────────────────────

  async getCustomerInvoices(customerId: string, params?: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResponse<Invoice[]>> {
    return this.HttpClient.get<PaginatedResponse<Invoice[]>>(`/invoices/customer/${customerId}`, { params });
  }

  // ── Invoice Generation ───────────────────────────────────────────────────────

  async generateInvoice(invoiceId: string, options?: {
    template?: string;
    format?: 'PDF' | 'HTML' | 'JSON';
    includePaymentHistory?: boolean;
    includeNotes?: boolean;
  }): Promise<{
    invoiceId: string;
    format: string;
    url?: string;
    content?: string;
    generatedAt: string;
  }> {
    return this.HttpClient.post<any>(`/invoices/${invoiceId}/generate`, options);
  }

  async downloadInvoice(invoiceId: string, format?: 'PDF' | 'HTML'): Promise<Blob> {
    return this.HttpClient.get<Blob>(`/invoices/${invoiceId}/download`, {
      params: { format },
      responseType: 'blob',
    });
  }

  async previewInvoice(invoiceId: string, template?: string): Promise<{
    html: string;
    css?: string;
    variables: Record<string, any>;
  }> {
    return this.HttpClient.get<any>(`/invoices/${invoiceId}/preview`, {
      params: { template },
    });
  }

  // ── Invoice Templates ────────────────────────────────────────────────────────

  async getInvoiceTemplates(params?: {
    page?: number;
    limit?: number;
    type?: 'STANDARD' | 'PROFORMA' | 'CREDIT' | 'DEBIT';
    isActive?: boolean;
  }): Promise<PaginatedResponse<Array<{
    id: string;
    name: string;
    type: 'STANDARD' | 'PROFORMA' | 'CREDIT' | 'DEBIT';
    description?: string;
    html: string;
    css?: string;
    variables: Array<{
      name: string;
      type: string;
      description: string;
      required: boolean;
    }>;
    isActive: boolean;
    isDefault: boolean;
    createdAt: string;
  }>>> {
    return this.HttpClient.get<PaginatedResponse<any[]>>('/invoices/templates', { params });
  }

  async getInvoiceTemplate(templateId: string): Promise<{
    id: string;
    name: string;
    type: 'STANDARD' | 'PROFORMA' | 'CREDIT' | 'DEBIT';
    description?: string;
    html: string;
    css?: string;
    variables: Array<{
      name: string;
      type: string;
      description: string;
      required: boolean;
    }>;
    isActive: boolean;
    isDefault: boolean;
    createdAt: string;
    updatedAt: string;
  }> {
    return this.HttpClient.get<any>(`/invoices/templates/${templateId}`);
  }

  async createInvoiceTemplate(templateData: {
    name: string;
    type: 'STANDARD' | 'PROFORMA' | 'CREDIT' | 'DEBIT';
    description?: string;
    html: string;
    css?: string;
    variables?: Array<{
      name: string;
      type: string;
      description: string;
      required: boolean;
    }>;
    isDefault?: boolean;
  }): Promise<any> {
    return this.HttpClient.post<any>('/invoices/templates', templateData);
  }

  async updateInvoiceTemplate(templateId: string, updateData: {
    name?: string;
    description?: string;
    html?: string;
    css?: string;
    variables?: Array<{
      name: string;
      type: string;
      description: string;
      required: boolean;
    }>;
    isActive?: boolean;
    isDefault?: boolean;
  }): Promise<any> {
    return this.HttpClient.put<any>(`/invoices/templates/${templateId}`, updateData);
  }

  async deleteInvoiceTemplate(templateId: string): Promise<void> {
    return this.HttpClient.delete<void>(`/invoices/templates/${templateId}`);
  }

  async setDefaultInvoiceTemplate(templateId: string): Promise<void> {
    return this.HttpClient.post<void>(`/invoices/templates/${templateId}/default`);
  }

  // ── Invoice Items ────────────────────────────────────────────────────────────

  async getInvoiceItems(invoiceId: string): Promise<Array<{
    id: string;
    invoiceId: string;
    productId?: string;
    productName?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    taxRate: number;
    taxAmount: number;
    discountRate: number;
    discountAmount: number;
    metadata?: any;
  }>> {
    return this.HttpClient.get<any[]>(`/invoices/${invoiceId}/items`);
  }

  async addInvoiceItem(invoiceId: string, itemData: {
    productId?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate?: number;
    discountRate?: number;
    metadata?: any;
  }): Promise<any> {
    return this.HttpClient.post<any>(`/invoices/${invoiceId}/items`, itemData);
  }

  async updateInvoiceItem(invoiceId: string, itemId: string, updateData: {
    description?: string;
    quantity?: number;
    unitPrice?: number;
    taxRate?: number;
    discountRate?: number;
    metadata?: any;
  }): Promise<any> {
    return this.HttpClient.put<any>(`/invoices/${invoiceId}/items/${itemId}`, updateData);
  }

  async deleteInvoiceItem(invoiceId: string, itemId: string): Promise<void> {
    return this.HttpClient.delete<void>(`/invoices/${invoiceId}/items/${itemId}`);
  }

  // ── Invoice Payments ─────────────────────────────────────────────────────────

  async getInvoicePayments(invoiceId: string): Promise<Array<{
    id: string;
    invoiceId: string;
    paymentId: string;
    amount: number;
    currency: string;
    paymentDate: string;
    method: string;
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
    reference?: string;
    notes?: string;
  }>> {
    return this.HttpClient.get<any[]>(`/invoices/${invoiceId}/payments`);
  }

  async applyPayment(invoiceId: string, paymentData: {
    amount: number;
    method: string;
    paymentDate?: string;
    reference?: string;
    notes?: string;
  }): Promise<any> {
    return this.HttpClient.post<any>(`/invoices/${invoiceId}/payments`, paymentData);
  }

  // ── Invoice Status Management ────────────────────────────────────────────────

  async updateInvoiceStatus(
    invoiceId: string,
    status: 'DRAFT' | 'SENT' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE' | 'CANCELLED' | 'VOID',
    reason?: string
  ): Promise<Invoice> {
    return this.HttpClient.post<Invoice>(`/invoices/${invoiceId}/status`, { status, reason });
  }

  async sendInvoice(invoiceId: string, sendData: {
    emails: string[];
    subject?: string;
    message?: string;
    attachPdf?: boolean;
    scheduledAt?: string;
  }): Promise<{
    invoiceId: string;
    sent: boolean;
    scheduledAt?: string;
    recipients: string[];
    sentAt?: string;
  }> {
    return this.HttpClient.post<any>(`/invoices/${invoiceId}/send`, sendData);
  }

  async markAsSent(invoiceId: string, method: 'EMAIL' | 'MAIL' | 'MANUAL', details?: {
    emails?: string[];
    trackingNumber?: string;
    sentAt?: string;
    notes?: string;
  }): Promise<Invoice> {
    return this.HttpClient.post<Invoice>(`/invoices/${invoiceId}/mark-sent`, { method, ...details });
  }

  // ── Invoice Reminders ────────────────────────────────────────────────────────

  async getInvoiceReminders(invoiceId: string): Promise<Array<{
    id: string;
    invoiceId: string;
    type: 'DUE_DATE' | 'OVERDUE' | 'CUSTOM';
    scheduledAt: string;
    sentAt?: string;
    status: 'PENDING' | 'SENT' | 'FAILED';
    template: string;
    recipients: string[];
  }>> {
    return this.HttpClient.get<any[]>(`/invoices/${invoiceId}/reminders`);
  }

  async createInvoiceReminder(invoiceId: string, reminderData: {
    type: 'DUE_DATE' | 'OVERDUE' | 'CUSTOM';
    scheduledAt: string;
    template: string;
    recipients: string[];
    customMessage?: string;
  }): Promise<any> {
    return this.HttpClient.post<any>(`/invoices/${invoiceId}/reminders`, reminderData);
  }

  async cancelInvoiceReminder(invoiceId: string, reminderId: string): Promise<void> {
    return this.HttpClient.delete<void>(`/invoices/${invoiceId}/reminders/${reminderId}`);
  }

  // ── Invoice Notes ────────────────────────────────────────────────────────────

  async getInvoiceNotes(invoiceId: string): Promise<Array<{
    id: string;
    invoiceId: string;
    content: string;
    author: string;
    isInternal: boolean;
    createdAt: string;
  }>> {
    return this.HttpClient.get<any[]>(`/invoices/${invoiceId}/notes`);
  }

  async addInvoiceNote(invoiceId: string, noteData: {
    content: string;
    isInternal?: boolean;
  }): Promise<any> {
    return this.HttpClient.post<any>(`/invoices/${invoiceId}/notes`, noteData);
  }

  async updateInvoiceNote(invoiceId: string, noteId: string, updateData: {
    content: string;
    isInternal?: boolean;
  }): Promise<any> {
    return this.HttpClient.put<any>(`/invoices/${invoiceId}/notes/${noteId}`, updateData);
  }

  async deleteInvoiceNote(invoiceId: string, noteId: string): Promise<void> {
    return this.HttpClient.delete<void>(`/invoices/${invoiceId}/notes/${noteId}`);
  }

  // ── Invoice Analytics ────────────────────────────────────────────────────────

  async getInvoiceAnalytics(params?: {
    startDate?: string;
    endDate?: string;
    customerId?: string;
    status?: string;
  }): Promise<{
    totalInvoices: number;
    totalAmount: number;
    paidAmount: number;
    unpaidAmount: number;
    overdueAmount: number;
    averageAmount: number;
    paymentRate: number;
    overdueRate: number;
    invoicesByStatus: Record<string, {
      count: number;
      amount: number;
      percentage: number;
    }>;
    monthlyStats: Array<{
      month: string;
      invoices: number;
      amount: number;
      paidAmount: number;
    }>;
    topCustomers: Array<{
      customerId: string;
      customerName: string;
      invoices: number;
      totalAmount: number;
      paidAmount: number;
    }>;
  }> {
    return this.HttpClient.get<any>('/invoices/analytics', { params });
  }

  async getCustomerInvoiceAnalytics(customerId: string, params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{
    customerId: string;
    totalInvoices: number;
    totalAmount: number;
    paidAmount: number;
    unpaidAmount: number;
    overdueAmount: number;
    averageAmount: number;
    paymentRate: number;
    overdueRate: number;
    monthlyStats: Array<{
      month: string;
      invoices: number;
      amount: number;
      paidAmount: number;
    }>;
  }> {
    return this.HttpClient.get<any>(`/invoices/analytics/customer/${customerId}`, { params });
  }

  // ── Invoice Reports ──────────────────────────────────────────────────────────

  async generateInvoiceReport(params?: {
    type?: 'SUMMARY' | 'DETAILED' | 'AGED' | 'TAX';
    startDate?: string;
    endDate?: string;
    customerId?: string;
    status?: string;
    format?: 'csv' | 'excel' | 'pdf';
  }): Promise<Blob> {
    // responseType: 'blob' must be handled by the HttpClient interceptor;
    // pass only 2 args to stay within the HttpClient.post signature
    return this.HttpClient.post<Blob>('/invoices/reports', params);
  }

  // ── Invoice Search ───────────────────────────────────────────────────────────

  async searchInvoices(query: string, params?: {
    page?: number;
    limit?: number;
    customerId?: string;
    status?: string;
  }): Promise<PaginatedResponse<Invoice[]>> {
    return this.HttpClient.get<PaginatedResponse<Invoice[]>>('/invoices/search', {
      params: { q: query, ...params },
    });
  }

  // ── Invoice Validation ───────────────────────────────────────────────────────

  async validateInvoice(invoiceData: CreateInvoiceRequest): Promise<{
    valid: boolean;
    errors?: string[];
    warnings?: string[];
    calculations?: {
      subtotal: number;
      taxAmount: number;
      discountAmount: number;
      totalAmount: number;
    };
  }> {
    return this.HttpClient.post<any>('/invoices/validate', invoiceData);
  }

  // ── Invoice Numbering ────────────────────────────────────────────────────────

  async getNextInvoiceNumber(type?: 'STANDARD' | 'PROFORMA' | 'CREDIT' | 'DEBIT'): Promise<{
    number: string;
    type: string;
    sequence: number;
  }> {
    return this.HttpClient.get<any>('/invoices/next-number', { params: { type } });
  }

  async getInvoiceNumberSettings(): Promise<{
    prefix: string;
    sequence: number;
    padding: number;
    resetFrequency: 'NEVER' | 'YEARLY' | 'MONTHLY' | 'DAILY';
    lastReset?: string;
  }> {
    return this.HttpClient.get<any>('/invoices/number-settings');
  }

  async updateInvoiceNumberSettings(settings: {
    prefix?: string;
    sequence?: number;
    padding?: number;
    resetFrequency?: 'NEVER' | 'YEARLY' | 'MONTHLY' | 'DAILY';
  }): Promise<any> {
    return this.HttpClient.put<any>('/invoices/number-settings', settings);
  }

  // ── Invoice Settings ─────────────────────────────────────────────────────────

  async getInvoiceSettings(): Promise<{
    defaultDueDays: number;
    defaultTerms: string;
    defaultTaxRate: number;
    currency: string;
    autoNumbering: boolean;
    emailSettings: {
      fromEmail: string;
      fromName: string;
      replyTo?: string;
    };
    reminderSettings: {
      dueDateReminder: boolean;
      overdueReminder: boolean;
      customReminders: Array<{
        days: number;
        template: string;
        enabled: boolean;
      }>;
    };
  }> {
    return this.HttpClient.get<any>('/invoices/settings');
  }

  async updateInvoiceSettings(settings: {
    defaultDueDays?: number;
    defaultTerms?: string;
    defaultTaxRate?: number;
    currency?: string;
    autoNumbering?: boolean;
    emailSettings?: {
      fromEmail?: string;
      fromName?: string;
      replyTo?: string;
    };
    reminderSettings?: {
      dueDateReminder?: boolean;
      overdueReminder?: boolean;
      customReminders?: Array<{
        days: number;
        template: string;
        enabled: boolean;
      }>;
    };
  }): Promise<any> {
    return this.HttpClient.put<any>('/invoices/settings', settings);
  }

  // ── Invoice Import / Export ──────────────────────────────────────────────────

  async exportInvoices(params?: {
    format?: 'csv' | 'excel' | 'json';
    includeItems?: boolean;
    includePayments?: boolean;
    startDate?: string;
    endDate?: string;
    status?: string;
  }): Promise<Blob> {
    return this.HttpClient.get<Blob>('/invoices/export', {
      params,
      responseType: 'blob',
    });
  }

  async importInvoices(file: File, options?: {
    overwrite?: boolean;
    createMissing?: boolean;
    validateCustomers?: boolean;
    validateProducts?: boolean;
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

    // Content-Type set automatically when passing FormData
    return this.HttpClient.post<any>('/invoices/import', formData);
  }
}