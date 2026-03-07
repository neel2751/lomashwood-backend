import { HttpClient } from '../utils/http';
import {
  PaginatedResponse,
} from '../types/api.types';
import {
  Payment,
  CreatePaymentRequest,
  PaymentWebhookRequest,
} from '../types/order.types';

// Define missing types
interface UpdatePaymentRequest extends Partial<Payment> {}

interface PaymentFilters {
  orderId?: string;
  customerId?: string;
  status?: string;
  method?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
}

export class PaymentService {
  constructor(private apiClient: HttpClient) {}

  // Payment Management
  async getPayments(params?: PaymentFilters & {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<Payment[]>> {
    return this.apiClient.get<PaginatedResponse<Payment[]>>('/payments', { params });
  }

  async getPayment(paymentId: string): Promise<Payment> {
    return this.apiClient.get<Payment>(`/payments/${paymentId}`);
  }

  async getPaymentsByOrder(orderId: string, params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Payment[]>> {
    return this.apiClient.get<PaginatedResponse<Payment[]>>(`/payments/order/${orderId}`, { params });
  }

  async createPayment(paymentData: CreatePaymentRequest): Promise<Payment> {
    return this.apiClient.post<Payment>('/payments', paymentData);
  }

  async updatePayment(paymentId: string, updateData: UpdatePaymentRequest): Promise<Payment> {
    return this.apiClient.put<Payment>(`/payments/${paymentId}`, updateData);
  }

  async deletePayment(paymentId: string): Promise<void> {
    return this.apiClient.delete<void>(`/payments/${paymentId}`);
  }

  // Payment Processing
  async processPayment(paymentId: string, method: 'CREDIT_CARD' | 'DEBIT_CARD' | 'PAYPAL' | 'STRIPE' | 'RAZORPAY' | 'BANK_TRANSFER' | 'CASH_ON_DELIVERY', paymentData: {
    amount: number;
    currency?: string;
    paymentMethodDetails: any;
    billingAddress?: any;
    returnUrl?: string;
    cancelUrl?: string;
  }): Promise<{
    paymentId: string;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    paymentUrl?: string;
    redirectUrl?: string;
    transactionId?: string;
    gatewayResponse?: any;
  }> {
    return this.apiClient.post<any>(`/payments/${paymentId}/process`, {
      method,
      ...paymentData,
    });
  }

  async confirmPayment(paymentId: string, confirmationData: {
    transactionId?: string;
    gatewayResponse?: any;
    status?: 'COMPLETED' | 'FAILED';
  }): Promise<Payment> {
    return this.apiClient.post<Payment>(`/payments/${paymentId}/confirm`, confirmationData);
  }

  async cancelPayment(paymentId: string, reason?: string): Promise<Payment> {
    return this.apiClient.post<Payment>(`/payments/${paymentId}/cancel`, { reason });
  }

  async refundPayment(paymentId: string, refundData: {
    amount?: number;
    reason: string;
    refundMethod?: 'ORIGINAL' | 'STORE_CREDIT' | 'BANK_TRANSFER';
    metadata?: any;
  }): Promise<{
    refundId: string;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    amount: number;
    currency: string;
    gatewayResponse?: any;
  }> {
    return this.apiClient.post<any>(`/payments/${paymentId}/refund`, refundData);
  }

  // Payment Methods
  async getPaymentMethods(params?: {
    page?: number;
    limit?: number;
    type?: 'CREDIT_CARD' | 'DEBIT_CARD' | 'PAYPAL' | 'STRIPE' | 'RAZORPAY' | 'BANK_TRANSFER';
    status?: 'ACTIVE' | 'INACTIVE';
  }): Promise<PaginatedResponse<Array<{
    id: string;
    type: string;
    name: string;
    description?: string;
    isActive: boolean;
    supportedCurrencies: string[];
    fees: Array<{
      type: 'FIXED' | 'PERCENTAGE';
      value: number;
      currency: string;
    }>;
    config: any;
    createdAt: string;
  }>>> {
    return this.apiClient.get<PaginatedResponse<any[]>>('/payments/methods', { params });
  }

  async getPaymentMethod(methodId: string): Promise<{
    id: string;
    type: string;
    name: string;
    description?: string;
    isActive: boolean;
    supportedCurrencies: string[];
    fees: Array<{
      type: 'FIXED' | 'PERCENTAGE';
      value: number;
      currency: string;
    }>;
    config: any;
    createdAt: string;
    updatedAt: string;
  }> {
    return this.apiClient.get<any>(`/payments/methods/${methodId}`);
  }

  async createPaymentMethod(methodData: {
    type: string;
    name: string;
    description?: string;
    isActive?: boolean;
    supportedCurrencies: string[];
    fees: Array<{
      type: 'FIXED' | 'PERCENTAGE';
      value: number;
      currency: string;
    }>;
    config: any;
  }): Promise<any> {
    return this.apiClient.post<any>('/payments/methods', methodData);
  }

  async updatePaymentMethod(methodId: string, updateData: {
    name?: string;
    description?: string;
    isActive?: boolean;
    supportedCurrencies?: string[];
    fees?: Array<{
      type: 'FIXED' | 'PERCENTAGE';
      value: number;
      currency: string;
    }>;
    config?: any;
  }): Promise<any> {
    return this.apiClient.put<any>(`/payments/methods/${methodId}`, updateData);
  }

  async deletePaymentMethod(methodId: string): Promise<void> {
    return this.apiClient.delete<void>(`/payments/methods/${methodId}`);
  }

  // Customer Payment Methods
  async getCustomerPaymentMethods(customerId: string, params?: {
    page?: number;
    limit?: number;
    type?: string;
    isDefault?: boolean;
  }): Promise<PaginatedResponse<Array<{
    id: string;
    customerId: string;
    type: string;
    lastFour?: string;
    expiryMonth?: number;
    expiryYear?: number;
    brand?: string;
    isDefault: boolean;
    isExpired: boolean;
    createdAt: string;
  }>>> {
    return this.apiClient.get<PaginatedResponse<any[]>>(`/payments/customers/${customerId}/methods`, { params });
  }

  async addCustomerPaymentMethod(customerId: string, methodData: {
    type: string;
    token?: string;
    details: any;
    isDefault?: boolean;
    billingAddress?: any;
  }): Promise<any> {
    return this.apiClient.post<any>(`/payments/customers/${customerId}/methods`, methodData);
  }

  async updateCustomerPaymentMethod(customerId: string, methodId: string, updateData: {
    isDefault?: boolean;
    billingAddress?: any;
    expiryMonth?: number;
    expiryYear?: number;
  }): Promise<any> {
    return this.apiClient.put<any>(`/payments/customers/${customerId}/methods/${methodId}`, updateData);
  }

  async deleteCustomerPaymentMethod(customerId: string, methodId: string): Promise<void> {
    return this.apiClient.delete<void>(`/payments/customers/${customerId}/methods/${methodId}`);
  }

  async setDefaultPaymentMethod(customerId: string, methodId: string): Promise<void> {
    return this.apiClient.post<void>(`/payments/customers/${customerId}/methods/${methodId}/default`);
  }

  // Payment Webhooks
  async getPaymentWebhooks(params?: {
    page?: number;
    limit?: number;
    status?: 'ACTIVE' | 'INACTIVE';
  }): Promise<PaginatedResponse<Array<{
    id: string;
    url: string;
    events: string[];
    secret?: string;
    isActive: boolean;
    retryPolicy: {
      maxRetries: number;
      retryDelay: number;
    };
    createdAt: string;
    lastTriggered?: string;
  }>>> {
    return this.apiClient.get<PaginatedResponse<any[]>>('/payments/webhooks', { params });
  }

  async createPaymentWebhook(webhookData: {
    url: string;
    events: string[];
    secret?: string;
    isActive?: boolean;
    retryPolicy?: {
      maxRetries?: number;
      retryDelay?: number;
    };
  }): Promise<any> {
    return this.apiClient.post<any>('/payments/webhooks', webhookData);
  }

  async updatePaymentWebhook(webhookId: string, updateData: {
    url?: string;
    events?: string[];
    secret?: string;
    isActive?: boolean;
    retryPolicy?: {
      maxRetries?: number;
      retryDelay?: number;
    };
  }): Promise<any> {
    return this.apiClient.put<any>(`/payments/webhooks/${webhookId}`, updateData);
  }

  async deletePaymentWebhook(webhookId: string): Promise<void> {
    return this.apiClient.delete<void>(`/payments/webhooks/${webhookId}`);
  }

  async testPaymentWebhook(webhookId: string): Promise<{
    success: boolean;
    response?: any;
    error?: string;
  }> {
    return this.apiClient.post<any>(`/payments/webhooks/${webhookId}/test`);
  }

  // Payment Analytics
  async getPaymentAnalytics(params?: {
    startDate?: string;
    endDate?: string;
    method?: string;
    status?: string;
  }): Promise<{
    totalPayments: number;
    totalAmount: number;
    averageAmount: number;
    successRate: number;
    paymentsByMethod: Record<string, {
      count: number;
      amount: number;
      successRate: number;
    }>;
    paymentsByStatus: Record<string, {
      count: number;
      amount: number;
      percentage: number;
    }>;
    dailyStats: Array<{
      date: string;
      payments: number;
      amount: number;
      successRate: number;
    }>;
    refunds: {
      totalRefunds: number;
      totalRefundAmount: number;
      refundRate: number;
    };
  }> {
    return this.apiClient.get<any>('/payments/analytics', { params });
  }

  async getPaymentMethodAnalytics(methodId: string, params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{
    methodId: string;
    methodName: string;
    totalPayments: number;
    totalAmount: number;
    averageAmount: number;
    successRate: number;
    fees: {
      totalFees: number;
      averageFee: number;
      feeRate: number;
    };
    performance: Array<{
      date: string;
      payments: number;
      amount: number;
      successRate: number;
    }>;
  }> {
    return this.apiClient.get<any>(`/payments/methods/${methodId}/analytics`, { params });
  }

  // Payment Disputes
  async getPaymentDisputes(params?: {
    page?: number;
    limit?: number;
    status?: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'CLOSED';
    reason?: string;
  }): Promise<PaginatedResponse<Array<{
    id: string;
    paymentId: string;
    amount: number;
    currency: string;
    reason: string;
    status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'CLOSED';
    evidence: Array<{
      type: string;
      url: string;
      description?: string;
    }>;
    createdAt: string;
    resolvedAt?: string;
  }>>> {
    return this.apiClient.get<PaginatedResponse<any[]>>('/payments/disputes', { params });
  }

  async getPaymentDispute(disputeId: string): Promise<{
    id: string;
    paymentId: string;
    amount: number;
    currency: string;
    reason: string;
    status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'CLOSED';
    evidence: Array<{
      type: string;
      url: string;
      description?: string;
    }>;
    createdAt: string;
    resolvedAt?: string;
    resolution?: string;
  }> {
    return this.apiClient.get<any>(`/payments/disputes/${disputeId}`);
  }

  async respondToDispute(disputeId: string, responseData: {
    response: string;
    evidence: Array<{
      type: string;
      file: File;
      description?: string;
    }>;
  }): Promise<any> {
    const formData = new FormData();
    formData.append('response', responseData.response);

    responseData.evidence.forEach((evidence, index) => {
      formData.append(`evidence_${index}_file`, evidence.file);
      formData.append(`evidence_${index}_type`, evidence.type);
      if (evidence.description) {
        formData.append(`evidence_${index}_description`, evidence.description);
      }
    });

    return this.apiClient.upload<any>(`/payments/disputes/${disputeId}/respond`, formData);
  }

  // Payment Subscriptions
  async getPaymentSubscriptions(params?: {
    page?: number;
    limit?: number;
    status?: 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'SUSPENDED';
  }): Promise<PaginatedResponse<Array<{
    id: string;
    customerId: string;
    planId: string;
    status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'SUSPENDED';
    amount: number;
    currency: string;
    interval: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
    currentPeriodStart: string;
    currentPeriodEnd: string;
    createdAt: string;
  }>>> {
    return this.apiClient.get<PaginatedResponse<any[]>>('/payments/subscriptions', { params });
  }

  async createSubscription(subscriptionData: {
    customerId: string;
    planId: string;
    paymentMethodId: string;
    trialPeriodDays?: number;
    metadata?: any;
  }): Promise<any> {
    return this.apiClient.post<any>('/payments/subscriptions', subscriptionData);
  }

  async cancelSubscription(subscriptionId: string, reason?: string): Promise<any> {
    return this.apiClient.post<any>(`/payments/subscriptions/${subscriptionId}/cancel`, { reason });
  }

  async pauseSubscription(subscriptionId: string, reason?: string): Promise<any> {
    return this.apiClient.post<any>(`/payments/subscriptions/${subscriptionId}/pause`, { reason });
  }

  async resumeSubscription(subscriptionId: string): Promise<any> {
    return this.apiClient.post<any>(`/payments/subscriptions/${subscriptionId}/resume`);
  }

  // Payment Reports
  async generatePaymentReport(params?: {
    type?: 'TRANSACTIONS' | 'REFUNDS' | 'DISPUTES' | 'METHODS' | 'ANALYTICS';
    startDate?: string;
    endDate?: string;
    format?: 'csv' | 'excel' | 'pdf';
    filters?: {
      method?: string;
      status?: string;
      customerId?: string;
    };
  }): Promise<Blob> {
    return this.apiClient.getBlob('/payments/reports', params);
  }

  // Payment Search
  async searchPayments(query: string, params?: {
    page?: number;
    limit?: number;
    customerId?: string;
    orderId?: string;
  }): Promise<PaginatedResponse<Payment[]>> {
    return this.apiClient.get<PaginatedResponse<Payment[]>>('/payments/search', {
      params: { q: query, ...params },
    });
  }

  // Payment Validation
  async validatePayment(paymentData: CreatePaymentRequest): Promise<{
    valid: boolean;
    errors?: string[];
    warnings?: string[];
    fees?: {
      amount: number;
      currency: string;
      breakdown: Array<{
        type: string;
        amount: number;
        description: string;
      }>;
    };
    estimatedProcessingTime?: number;
  }> {
    return this.apiClient.post<any>('/payments/validate', paymentData);
  }

  // Payment Settings
  async getPaymentSettings(): Promise<{
    defaultCurrency: string;
    supportedCurrencies: string[];
    autoCapture: boolean;
    refundPolicy: {
      days: number;
      automatic: boolean;
    };
    disputePolicy: {
      autoRespond: boolean;
      responseTemplate?: string;
    };
    webhookSettings: {
      retryAttempts: number;
      retryDelay: number;
    };
    security: {
      require3DS: boolean;
      fraudDetection: boolean;
      velocityChecks: boolean;
    };
  }> {
    return this.apiClient.get<any>('/payments/settings');
  }

  async updatePaymentSettings(settings: {
    defaultCurrency?: string;
    supportedCurrencies?: string[];
    autoCapture?: boolean;
    refundPolicy?: {
      days?: number;
      automatic?: boolean;
    };
    disputePolicy?: {
      autoRespond?: boolean;
      responseTemplate?: string;
    };
    webhookSettings?: {
      retryAttempts?: number;
      retryDelay?: number;
    };
    security?: {
      require3DS?: boolean;
      fraudDetection?: boolean;
      velocityChecks?: boolean;
    };
  }): Promise<any> {
    return this.apiClient.put<any>('/payments/settings', settings);
  }
}