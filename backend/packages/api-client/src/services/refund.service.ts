import { HttpClient } from '../utils/http';
import { PaginatedResponse } from '../types/api.types';

interface Refund {
  id: string;
  orderId: string;
  paymentId: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  reason: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateRefundRequest {
  orderId: string;
  paymentId?: string;
  amount: number;
  reason: string;
  items?: Array<{
    orderItemId: string;
    quantity: number;
  }>;
  [key: string]: any;
}

interface UpdateRefundRequest {
  amount?: number;
  reason?: string;
  status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  [key: string]: any;
}

interface RefundFilters {
  orderId?: string;
  paymentId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  customerId?: string;
}

export class RefundService {
  constructor(private HttpClient: HttpClient) {}

  async getRefunds(params?: RefundFilters & {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<Refund[]>> {
    return this.HttpClient.get<PaginatedResponse<Refund[]>>('/refunds', { params });
  }

  async getRefund(refundId: string): Promise<Refund> {
    return this.HttpClient.get<Refund>(`/refunds/${refundId}`);
  }

  async getPaymentRefunds(paymentId: string, params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Refund[]>> {
    return this.HttpClient.get<PaginatedResponse<Refund[]>>(`/refunds/payment/${paymentId}`, { params });
  }

  async getOrderRefunds(orderId: string, params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Refund[]>> {
    return this.HttpClient.get<PaginatedResponse<Refund[]>>(`/refunds/order/${orderId}`, { params });
  }

  async createRefund(refundData: CreateRefundRequest): Promise<Refund> {
    return this.HttpClient.post<Refund>('/refunds', refundData);
  }

  async updateRefund(refundId: string, updateData: UpdateRefundRequest): Promise<Refund> {
    return this.HttpClient.put<Refund>(`/refunds/${refundId}`, updateData);
  }

  async deleteRefund(refundId: string): Promise<void> {
    return this.HttpClient.delete<void>(`/refunds/${refundId}`);
  }

  async processRefund(refundId: string, processingData: {
    method: 'ORIGINAL' | 'STORE_CREDIT' | 'BANK_TRANSFER' | 'CHECK';
    bankDetails?: {
      accountNumber: string;
      routingNumber: string;
      accountHolderName: string;
      bankName: string;
    };
    checkDetails?: {
      payeeName: string;
      address: any;
    };
    notes?: string;
  }): Promise<{
    refundId: string;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    processedAt?: string;
    estimatedCompletion?: string;
    trackingNumber?: string;
    gatewayResponse?: any;
  }> {
    return this.HttpClient.post<any>(`/refunds/${refundId}/process`, processingData);
  }

  async confirmRefund(refundId: string, confirmationData: {
    transactionId?: string;
    gatewayResponse?: any;
    status?: 'COMPLETED' | 'FAILED';
    notes?: string;
  }): Promise<Refund> {
    return this.HttpClient.post<Refund>(`/refunds/${refundId}/confirm`, confirmationData);
  }

  async cancelRefund(refundId: string, reason?: string): Promise<Refund> {
    return this.HttpClient.post<Refund>(`/refunds/${refundId}/cancel`, { reason });
  }

  async getRefundItems(refundId: string): Promise<Array<{
    id: string;
    refundId: string;
    orderItemId: string;
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    reason: string;
    condition: 'NEW' | 'USED' | 'DAMAGED' | 'MISSING_PARTS';
    canRestock: boolean;
    metadata?: any;
  }>> {
    return this.HttpClient.get<any[]>(`/refunds/${refundId}/items`);
  }

  async addRefundItem(refundId: string, itemData: {
    orderItemId: string;
    quantity: number;
    reason: string;
    condition: 'NEW' | 'USED' | 'DAMAGED' | 'MISSING_PARTS';
    canRestock?: boolean;
    metadata?: any;
  }): Promise<any> {
    return this.HttpClient.post<any>(`/refunds/${refundId}/items`, itemData);
  }

  async updateRefundItem(refundId: string, itemId: string, updateData: {
    quantity?: number;
    reason?: string;
    condition?: 'NEW' | 'USED' | 'DAMAGED' | 'MISSING_PARTS';
    canRestock?: boolean;
    metadata?: any;
  }): Promise<any> {
    return this.HttpClient.put<any>(`/refunds/${refundId}/items/${itemId}`, updateData);
  }

  async deleteRefundItem(refundId: string, itemId: string): Promise<void> {
    return this.HttpClient.delete<void>(`/refunds/${refundId}/items/${itemId}`);
  }

  async getRefundReasons(params?: {
    page?: number;
    limit?: number;
    type?: 'PRODUCT' | 'SERVICE' | 'SHIPPING' | 'BILLING';
    isActive?: boolean;
  }): Promise<PaginatedResponse<Array<{
    id: string;
    name: string;
    description?: string;
    type: 'PRODUCT' | 'SERVICE' | 'SHIPPING' | 'BILLING';
    isActive: boolean;
    requiresApproval: boolean;
    canRestock: boolean;
    createdAt: string;
  }>>> {
    return this.HttpClient.get<PaginatedResponse<any[]>>('/refunds/reasons', { params });
  }

  async createRefundReason(reasonData: {
    name: string;
    description?: string;
    type: 'PRODUCT' | 'SERVICE' | 'SHIPPING' | 'BILLING';
    requiresApproval?: boolean;
    canRestock?: boolean;
  }): Promise<any> {
    return this.HttpClient.post<any>('/refunds/reasons', reasonData);
  }

  async updateRefundReason(reasonId: string, updateData: {
    name?: string;
    description?: string;
    isActive?: boolean;
    requiresApproval?: boolean;
    canRestock?: boolean;
  }): Promise<any> {
    return this.HttpClient.put<any>(`/refunds/reasons/${reasonId}`, updateData);
  }

  async deleteRefundReason(reasonId: string): Promise<void> {
    return this.HttpClient.delete<void>(`/refunds/reasons/${reasonId}`);
  }

  async getRefundPolicies(params?: {
    page?: number;
    limit?: number;
    productId?: string;
    categoryId?: string;
    isActive?: boolean;
  }): Promise<PaginatedResponse<Array<{
    id: string;
    name: string;
    description?: string;
    productId?: string;
    categoryId?: string;
    timeLimit: number;
    conditions: Array<{
      type: string;
      value: any;
      description: string;
    }>;
    refundMethod: 'ORIGINAL' | 'STORE_CREDIT' | 'BANK_TRANSFER';
    restockFee?: number;
    isActive: boolean;
    createdAt: string;
  }>>> {
    return this.HttpClient.get<PaginatedResponse<any[]>>('/refunds/policies', { params });
  }

  async getRefundPolicy(policyId: string): Promise<{
    id: string;
    name: string;
    description?: string;
    productId?: string;
    categoryId?: string;
    timeLimit: number;
    conditions: Array<{
      type: string;
      value: any;
      description: string;
    }>;
    refundMethod: 'ORIGINAL' | 'STORE_CREDIT' | 'BANK_TRANSFER';
    restockFee?: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  }> {
    return this.HttpClient.get<any>(`/refunds/policies/${policyId}`);
  }

  async createRefundPolicy(policyData: {
    name: string;
    description?: string;
    productId?: string;
    categoryId?: string;
    timeLimit: number;
    conditions: Array<{
      type: string;
      value: any;
      description: string;
    }>;
    refundMethod: 'ORIGINAL' | 'STORE_CREDIT' | 'BANK_TRANSFER';
    restockFee?: number;
    isActive?: boolean;
  }): Promise<any> {
    return this.HttpClient.post<any>('/refunds/policies', policyData);
  }

  async updateRefundPolicy(policyId: string, updateData: {
    name?: string;
    description?: string;
    timeLimit?: number;
    conditions?: Array<{
      type: string;
      value: any;
      description: string;
    }>;
    refundMethod?: 'ORIGINAL' | 'STORE_CREDIT' | 'BANK_TRANSFER';
    restockFee?: number;
    isActive?: boolean;
  }): Promise<any> {
    return this.HttpClient.put<any>(`/refunds/policies/${policyId}`, updateData);
  }

  async deleteRefundPolicy(policyId: string): Promise<void> {
    return this.HttpClient.delete<void>(`/refunds/policies/${policyId}`);
  }

  async checkRefundEligibility(orderId: string, orderItemId?: string): Promise<{
    eligible: boolean;
    policy?: {
      id: string;
      name: string;
      timeLimit: number;
      conditions: any[];
    };
    timeRemaining?: number;
    refundableAmount?: number;
    refundMethod?: string;
    restockFee?: number;
    reasons?: Array<{
      id: string;
      name: string;
      description: string;
    }>;
    restrictions?: string[];
  }> {
    return this.HttpClient.get<any>(`/refunds/eligibility/${orderId}`, {
      params: { orderItemId },
    });
  }

  async getRefundApprovals(params?: {
    page?: number;
    limit?: number;
    status?: 'PENDING' | 'APPROVED' | 'REJECTED';
    requiresApproval?: boolean;
  }): Promise<PaginatedResponse<Array<{
    id: string;
    refundId: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    requestedBy: string;
    approvedBy?: string;
    approvedAt?: string;
    rejectedAt?: string;
    reason?: string;
    notes?: string;
  }>>> {
    return this.HttpClient.get<PaginatedResponse<any[]>>('/refunds/approvals', { params });
  }

  async approveRefund(refundId: string, approvalData: {
    notes?: string;
    overridePolicy?: boolean;
  }): Promise<Refund> {
    return this.HttpClient.post<Refund>(`/refunds/${refundId}/approve`, approvalData);
  }

  async rejectRefund(refundId: string, rejectionData: {
    reason: string;
    notes?: string;
  }): Promise<Refund> {
    return this.HttpClient.post<Refund>(`/refunds/${refundId}/reject`, rejectionData);
  }

  async getRefundTracking(refundId: string): Promise<Array<{
    id: string;
    refundId: string;
    status: string;
    location?: string;
    timestamp: string;
    description: string;
    metadata?: any;
  }>> {
    return this.HttpClient.get<any[]>(`/refunds/${refundId}/tracking`);
  }

  async addRefundTracking(refundId: string, trackingData: {
    status: string;
    location?: string;
    description: string;
    metadata?: any;
  }): Promise<any> {
    return this.HttpClient.post<any>(`/refunds/${refundId}/tracking`, trackingData);
  }

  async getRefundAnalytics(params?: {
    startDate?: string;
    endDate?: string;
    productId?: string;
    reasonId?: string;
    status?: string;
  }): Promise<{
    totalRefunds: number;
    totalAmount: number;
    averageAmount: number;
    refundRate: number;
    refundsByReason: Record<string, {
      count: number;
      amount: number;
      percentage: number;
    }>;
    refundsByStatus: Record<string, {
      count: number;
      amount: number;
      percentage: number;
    }>;
    refundsByMonth: Array<{
      month: string;
      refunds: number;
      amount: number;
    }>;
    topProducts: Array<{
      productId: string;
      productName: string;
      refunds: number;
      amount: number;
      refundRate: number;
    }>;
    processingTime: {
      average: number;
      median: number;
      min: number;
      max: number;
    };
  }> {
    return this.HttpClient.get<any>('/refunds/analytics', { params });
  }

  async getRefundReasonAnalytics(reasonId: string, params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{
    reasonId: string;
    reasonName: string;
    totalRefunds: number;
    totalAmount: number;
    averageAmount: number;
    refundRate: number;
    monthlyStats: Array<{
      month: string;
      refunds: number;
      amount: number;
    }>;
    topProducts: Array<{
      productId: string;
      productName: string;
      refunds: number;
      amount: number;
    }>;
  }> {
    return this.HttpClient.get<any>(`/refunds/analytics/reason/${reasonId}`, { params });
  }

  async generateRefundReport(params?: {
    type?: 'SUMMARY' | 'DETAILED' | 'REASONS' | 'POLICIES';
    startDate?: string;
    endDate?: string;
    productId?: string;
    reasonId?: string;
    status?: string;
    format?: 'csv' | 'excel' | 'pdf';
  }): Promise<Blob> {
    return this.HttpClient.post<Blob>('/refunds/reports', params);
  }

  async searchRefunds(query: string, params?: {
    page?: number;
    limit?: number;
    customerId?: string;
    orderId?: string;
    status?: string;
  }): Promise<PaginatedResponse<Refund[]>> {
    return this.HttpClient.get<PaginatedResponse<Refund[]>>('/refunds/search', {
      params: { q: query, ...params },
    });
  }

  async validateRefund(refundData: CreateRefundRequest): Promise<{
    valid: boolean;
    errors?: string[];
    warnings?: string[];
    policy?: {
      id: string;
      name: string;
      timeLimit: number;
      conditions: any[];
    };
    eligibility?: {
      eligible: boolean;
      timeRemaining?: number;
      refundableAmount?: number;
      refundMethod?: string;
      restockFee?: number;
    };
    calculations?: {
      subtotal: number;
      restockFee: number;
      taxAmount: number;
      totalAmount: number;
    };
  }> {
    return this.HttpClient.post<any>('/refunds/validate', refundData);
  }

  async getRefundSettings(): Promise<{
    defaultTimeLimit: number;
    defaultRefundMethod: 'ORIGINAL' | 'STORE_CREDIT' | 'BANK_TRANSFER';
    defaultRestockFee: number;
    requireApproval: boolean;
    autoApproveThreshold: number;
    currency: string;
    emailSettings: {
      fromEmail: string;
      fromName: string;
      replyTo?: string;
    };
    trackingSettings: {
      enableTracking: boolean;
      defaultCarrier: string;
    };
  }> {
    return this.HttpClient.get<any>('/refunds/settings');
  }

  async updateRefundSettings(settings: {
    defaultTimeLimit?: number;
    defaultRefundMethod?: 'ORIGINAL' | 'STORE_CREDIT' | 'BANK_TRANSFER';
    defaultRestockFee?: number;
    requireApproval?: boolean;
    autoApproveThreshold?: number;
    currency?: string;
    emailSettings?: {
      fromEmail?: string;
      fromName?: string;
      replyTo?: string;
    };
    trackingSettings?: {
      enableTracking?: boolean;
      defaultCarrier?: string;
    };
  }): Promise<any> {
    return this.HttpClient.put<any>('/refunds/settings', settings);
  }

  async exportRefunds(params?: {
    format?: 'csv' | 'excel' | 'json';
    includeItems?: boolean;
    includeTracking?: boolean;
    startDate?: string;
    endDate?: string;
    status?: string;
  }): Promise<Blob> {
    return this.HttpClient.get<Blob>('/refunds/export', {
      params,
      responseType: 'blob',
    });
  }

  async importRefunds(file: File, options?: {
    overwrite?: boolean;
    createMissing?: boolean;
    validateOrders?: boolean;
    validatePayments?: boolean;
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

    return this.HttpClient.post<any>('/refunds/import', formData);
  }
}