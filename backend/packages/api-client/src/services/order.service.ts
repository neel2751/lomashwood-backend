import { HttpClient } from '../utils/http';
import {
  PaginatedResponse,
} from '../types/api.types';
import {
  Order,
  CreateOrderRequest,
  UpdateOrderStatusRequest,
  Payment,
  CreatePaymentRequest,
  Refund,
  CreateRefundRequest,
  Invoice,
  GenerateInvoiceRequest,
} from '../types/order.types';

// Define missing types
interface UpdateOrderRequest extends UpdateOrderStatusRequest {}

interface OrderFilters {
  customerId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  minTotal?: number;
  maxTotal?: number;
}

export class OrderService {
  constructor(private apiClient: HttpClient) {}

  // Order Management
  async getOrders(params?: OrderFilters & {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<Order[]>> {
    return this.apiClient.get<PaginatedResponse<Order[]>>('/orders', { params });
  }

  async getOrder(orderId: string): Promise<Order> {
    return this.apiClient.get<Order>(`/orders/${orderId}`);
  }

  async createOrder(orderData: CreateOrderRequest): Promise<Order> {
    return this.apiClient.post<Order>('/orders', orderData);
  }

  async updateOrder(orderId: string, updateData: UpdateOrderRequest): Promise<Order> {
    return this.apiClient.put<Order>(`/orders/${orderId}`, updateData);
  }

  async deleteOrder(orderId: string): Promise<void> {
    return this.apiClient.delete<void>(`/orders/${orderId}`);
  }

  async cancelOrder(orderId: string, reason?: string): Promise<Order> {
    return this.apiClient.post<Order>(`/orders/${orderId}/cancel`, { reason });
  }

  // Customer Orders
  async getCustomerOrders(customerId: string, params?: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResponse<Order[]>> {
    return this.apiClient.get<PaginatedResponse<Order[]>>(`/customers/${customerId}/orders`, { params });
  }

  async getCustomerOrder(customerId: string, orderId: string): Promise<Order> {
    return this.apiClient.get<Order>(`/customers/${customerId}/orders/${orderId}`);
  }

  // Order Status Management
  async updateOrderStatus(orderId: string, status: string, notes?: string): Promise<Order> {
    return this.apiClient.patch<Order>(`/orders/${orderId}/status`, { status, notes });
  }

  async getOrderHistory(orderId: string): Promise<any[]> {
    return this.apiClient.get<any[]>(`/orders/${orderId}/history`);
  }

  // Payment Management
  async getPayments(orderId?: string, params?: {
    page?: number;
    limit?: number;
    status?: string;
    method?: string;
  }): Promise<PaginatedResponse<Payment[]>> {
    const url = orderId ? `/orders/${orderId}/payments` : '/payments';
    return this.apiClient.get<PaginatedResponse<Payment[]>>(url, { params });
  }

  async getPayment(paymentId: string): Promise<Payment> {
    return this.apiClient.get<Payment>(`/payments/${paymentId}`);
  }

  async createPayment(paymentData: CreatePaymentRequest): Promise<Payment> {
    return this.apiClient.post<Payment>('/payments', paymentData);
  }

  async updatePayment(paymentId: string, updateData: Partial<Payment>): Promise<Payment> {
    return this.apiClient.put<Payment>(`/payments/${paymentId}`, updateData);
  }

  async cancelPayment(paymentId: string, reason?: string): Promise<Payment> {
    return this.apiClient.post<Payment>(`/payments/${paymentId}/cancel`, { reason });
  }

  // Payment Methods
  async getPaymentMethods(): Promise<any[]> {
    return this.apiClient.get<any[]>('/payments/methods');
  }

  async addPaymentMethod(methodData: any): Promise<any> {
    return this.apiClient.post<any>('/payments/methods', methodData);
  }

  async removePaymentMethod(methodId: string): Promise<void> {
    return this.apiClient.delete<void>(`/payments/methods/${methodId}`);
  }

  // Refund Management
  async getRefunds(orderId?: string, params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<PaginatedResponse<Refund[]>> {
    const url = orderId ? `/orders/${orderId}/refunds` : '/refunds';
    return this.apiClient.get<PaginatedResponse<Refund[]>>(url, { params });
  }

  async getRefund(refundId: string): Promise<Refund> {
    return this.apiClient.get<Refund>(`/refunds/${refundId}`);
  }

  async createRefund(refundData: CreateRefundRequest): Promise<Refund> {
    return this.apiClient.post<Refund>('/refunds', refundData);
  }

  async updateRefund(refundId: string, updateData: Partial<Refund>): Promise<Refund> {
    return this.apiClient.put<Refund>(`/refunds/${refundId}`, updateData);
  }

  async processRefund(refundId: string): Promise<Refund> {
    return this.apiClient.post<Refund>(`/refunds/${refundId}/process`);
  }

  // Invoice Management
  async getInvoices(orderId?: string, params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<PaginatedResponse<Invoice[]>> {
    const url = orderId ? `/orders/${orderId}/invoices` : '/invoices';
    return this.apiClient.get<PaginatedResponse<Invoice[]>>(url, { params });
  }

  async getInvoice(invoiceId: string): Promise<Invoice> {
    return this.apiClient.get<Invoice>(`/invoices/${invoiceId}`);
  }

  async createInvoice(orderId: string, invoiceData?: any): Promise<Invoice> {
    return this.apiClient.post<Invoice>(`/orders/${orderId}/invoices`, invoiceData);
  }

  async updateInvoice(invoiceId: string, updateData: Partial<Invoice>): Promise<Invoice> {
    return this.apiClient.put<Invoice>(`/invoices/${invoiceId}`, updateData);
  }

  async downloadInvoice(invoiceId: string): Promise<Blob> {
    return this.apiClient.getBlob(`/invoices/${invoiceId}/download`);
  }

  async sendInvoice(invoiceId: string, email: string): Promise<void> {
    return this.apiClient.post<void>(`/invoices/${invoiceId}/send`, { email });
  }

  // Order Analytics
  async getOrderStats(params?: {
    startDate?: string;
    endDate?: string;
    status?: string;
  }): Promise<{
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    ordersByStatus: Record<string, number>;
    revenueByMonth: Array<{ month: string; revenue: number }>;
  }> {
    return this.apiClient.get<any>('/orders/stats', { params });
  }

  async getRevenueReport(params?: {
    startDate?: string;
    endDate?: string;
    groupBy?: 'day' | 'week' | 'month' | 'year';
  }): Promise<Array<{
    period: string;
    revenue: number;
    orders: number;
    averageOrderValue: number;
  }>> {
    return this.apiClient.get<any[]>('/orders/revenue', { params });
  }

  // Order Export
  async exportOrders(params?: OrderFilters & {
    format?: 'csv' | 'excel' | 'pdf';
    startDate?: string;
    endDate?: string;
  }): Promise<Blob> {
    return this.apiClient.getBlob('/orders/export', params);
  }

  // Order Search
  async searchOrders(query: string, params?: {
    page?: number;
    limit?: number;
    filters?: OrderFilters;
  }): Promise<PaginatedResponse<Order[]>> {
    return this.apiClient.get<PaginatedResponse<Order[]>>('/orders/search', {
      params: { q: query, ...params },
    });
  }

  // Order Validation
  async validateOrder(orderData: CreateOrderRequest): Promise<{
    valid: boolean;
    errors?: string[];
    warnings?: string[];
    estimatedTotal?: number;
    taxAmount?: number;
    shippingCost?: number;
  }> {
    return this.apiClient.post<any>('/orders/validate', orderData);
  }

  // Order Tracking
  async trackOrder(orderId: string): Promise<{
    currentStatus: string;
    estimatedDelivery: string;
    trackingNumber?: string;
    trackingUrl?: string;
    history: Array<{
      status: string;
      timestamp: string;
      location?: string;
      description: string;
    }>;
  }> {
    return this.apiClient.get<any>(`/orders/${orderId}/track`);
  }

  // Order Notes
  async getOrderNotes(orderId: string): Promise<Array<{
    id: string;
    content: string;
    author: string;
    createdAt: string;
    isInternal: boolean;
  }>> {
    return this.apiClient.get<any[]>(`/orders/${orderId}/notes`);
  }

  async addOrderNote(orderId: string, note: {
    content: string;
    isInternal?: boolean;
  }): Promise<any> {
    return this.apiClient.post<any>(`/orders/${orderId}/notes`, note);
  }

  // Order Items
  async getOrderItems(orderId: string): Promise<Array<{
    id: string;
    productId: string;
    productName: string;
    productImage: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    specifications?: any;
  }>> {
    return this.apiClient.get<any[]>(`/orders/${orderId}/items`);
  }

  async addOrderItem(orderId: string, item: {
    productId: string;
    quantity: number;
    unitPrice?: number;
  }): Promise<any> {
    return this.apiClient.post<any>(`/orders/${orderId}/items`, item);
  }

  async updateOrderItem(orderId: string, itemId: string, updateData: {
    quantity?: number;
    unitPrice?: number;
  }): Promise<any> {
    return this.apiClient.put<any>(`/orders/${orderId}/items/${itemId}`, updateData);
  }

  async removeOrderItem(orderId: string, itemId: string): Promise<void> {
    return this.apiClient.delete<void>(`/orders/${orderId}/items/${itemId}`);
  }

  // Order Shipping
  async getOrderShipping(orderId: string): Promise<{
    method: string;
    cost: number;
    estimatedDelivery: string;
    trackingNumber?: string;
    address: any;
  }> {
    return this.apiClient.get<any>(`/orders/${orderId}/shipping`);
  }

  async updateOrderShipping(orderId: string, shippingData: {
    method: string;
    address: any;
    instructions?: string;
  }): Promise<any> {
    return this.apiClient.put<any>(`/orders/${orderId}/shipping`, shippingData);
  }

  // Order Discounts
  async applyDiscount(orderId: string, discountCode: string): Promise<{
    discountAmount: number;
    finalTotal: number;
    appliedDiscounts: any[];
  }> {
    return this.apiClient.post<any>(`/orders/${orderId}/discount`, { code: discountCode });
  }

  async removeDiscount(orderId: string, discountId: string): Promise<{
    discountAmount: number;
    finalTotal: number;
    appliedDiscounts: any[];
  }> {
    return this.apiClient.delete<any>(`/orders/${orderId}/discount/${discountId}`);
  }

  // Order Templates
  async getOrderTemplates(): Promise<Array<{
    id: string;
    name: string;
    description: string;
    items: any[];
    settings: any;
  }>> {
    return this.apiClient.get<any[]>('/orders/templates');
  }

  async createOrderFromTemplate(templateId: string, customizations?: any): Promise<Order> {
    return this.apiClient.post<Order>(`/orders/templates/${templateId}`, customizations);
  }
}
