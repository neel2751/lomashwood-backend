import { HttpClient } from '../utils/http';
import { PaginatedResponse } from '../types/api.types';
import {
  Customer,
  CreateCustomerRequest,
  UpdateCustomerRequest,
} from '../types/customer.types';

// ── Local types ───────────────────────────────────────────────────────────────

interface CustomerFilters {
  name?: string;
  email?: string;
  phone?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface Review {
  id: string;
  customerId: string;
  productId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface CreateReviewRequest {
  productId: string;
  rating: number;
  comment: string;
}

interface UpdateReviewRequest {
  rating?: number;
  comment?: string;
}

interface SupportTicket {
  id: string;
  customerId: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
}

interface CreateSupportTicketRequest {
  subject: string;
  description: string;
  priority: string;
}

interface UpdateSupportTicketRequest {
  status?: string;
  priority?: string;
  description?: string;
}

interface WishlistItem {
  id: string;
  productId: string;
  addedAt: string;
}

// ── Service ───────────────────────────────────────────────────────────────────

export class CustomerService {
  constructor(private apiClient: HttpClient) {}

  // ── Customer Management ──────────────────────────────────────────────────────

  async getCustomers(params?: CustomerFilters & {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<Customer[]>> {
    return this.apiClient.get<PaginatedResponse<Customer[]>>('/customers', { params });
  }

  async getCustomer(customerId: string): Promise<Customer> {
    return this.apiClient.get<Customer>(`/customers/${customerId}`);
  }

  async createCustomer(customerData: CreateCustomerRequest): Promise<Customer> {
    return this.apiClient.post<Customer>('/customers', customerData);
  }

  async updateCustomer(customerId: string, updateData: UpdateCustomerRequest): Promise<Customer> {
    return this.apiClient.put<Customer>(`/customers/${customerId}`, updateData);
  }

  async deleteCustomer(customerId: string): Promise<void> {
    return this.apiClient.delete<void>(`/customers/${customerId}`);
  }

  // ── Customer Profile ─────────────────────────────────────────────────────────

  async getCustomerProfile(customerId: string): Promise<Customer> {
    return this.apiClient.get<Customer>(`/customers/${customerId}/profile`);
  }

  async updateCustomerProfile(customerId: string, profileData: Partial<Customer>): Promise<Customer> {
    return this.apiClient.put<Customer>(`/customers/${customerId}/profile`, profileData);
  }

  async updateCustomerPreferences(customerId: string, preferences: Record<string, any>): Promise<Customer> {
    return this.apiClient.put<Customer>(`/customers/${customerId}/preferences`, { preferences });
  }

  // ── Customer Addresses ───────────────────────────────────────────────────────

  async getCustomerAddresses(customerId: string): Promise<Array<{
    id: string;
    type: 'HOME' | 'WORK' | 'BILLING' | 'SHIPPING';
    street: string;
    city: string;
    postalCode: string;
    country: string;
    isDefault: boolean;
  }>> {
    return this.apiClient.get<any[]>(`/customers/${customerId}/addresses`);
  }

  async addCustomerAddress(customerId: string, addressData: {
    type: 'HOME' | 'WORK' | 'BILLING' | 'SHIPPING';
    street: string;
    city: string;
    postalCode: string;
    country: string;
    isDefault?: boolean;
  }): Promise<any> {
    return this.apiClient.post<any>(`/customers/${customerId}/addresses`, addressData);
  }

  async updateCustomerAddress(customerId: string, addressId: string, addressData: any): Promise<any> {
    return this.apiClient.put<any>(`/customers/${customerId}/addresses/${addressId}`, addressData);
  }

  async deleteCustomerAddress(customerId: string, addressId: string): Promise<void> {
    return this.apiClient.delete<void>(`/customers/${customerId}/addresses/${addressId}`);
  }

  async setDefaultAddress(customerId: string, addressId: string): Promise<any> {
    return this.apiClient.patch<any>(`/customers/${customerId}/addresses/${addressId}/default`);
  }

  // ── Customer Reviews ─────────────────────────────────────────────────────────

  async getCustomerReviews(customerId: string, params?: {
    page?: number;
    limit?: number;
    rating?: number;
    productId?: string;
    status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  }): Promise<PaginatedResponse<Review[]>> {
    return this.apiClient.get<PaginatedResponse<Review[]>>(`/customers/${customerId}/reviews`, { params });
  }

  async createCustomerReview(customerId: string, reviewData: CreateReviewRequest): Promise<Review> {
    return this.apiClient.post<Review>(`/customers/${customerId}/reviews`, reviewData);
  }

  async updateCustomerReview(customerId: string, reviewId: string, updateData: UpdateReviewRequest): Promise<Review> {
    return this.apiClient.put<Review>(`/customers/${customerId}/reviews/${reviewId}`, updateData);
  }

  async deleteCustomerReview(customerId: string, reviewId: string): Promise<void> {
    return this.apiClient.delete<void>(`/customers/${customerId}/reviews/${reviewId}`);
  }

  // ── Customer Support Tickets ─────────────────────────────────────────────────

  async getCustomerSupportTickets(customerId: string, params?: {
    page?: number;
    limit?: number;
    status?: 'OPEN' | 'IN_PROGRESS' | 'CLOSED' | 'RESOLVED';
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    category?: string;
  }): Promise<PaginatedResponse<SupportTicket[]>> {
    return this.apiClient.get<PaginatedResponse<SupportTicket[]>>(`/customers/${customerId}/tickets`, { params });
  }

  async createCustomerSupportTicket(customerId: string, ticketData: CreateSupportTicketRequest): Promise<SupportTicket> {
    return this.apiClient.post<SupportTicket>(`/customers/${customerId}/tickets`, ticketData);
  }

  async getCustomerSupportTicket(customerId: string, ticketId: string): Promise<SupportTicket> {
    return this.apiClient.get<SupportTicket>(`/customers/${customerId}/tickets/${ticketId}`);
  }

  async updateCustomerSupportTicket(customerId: string, ticketId: string, updateData: UpdateSupportTicketRequest): Promise<SupportTicket> {
    return this.apiClient.put<SupportTicket>(`/customers/${customerId}/tickets/${ticketId}`, updateData);
  }

  async addCustomerTicketReply(customerId: string, ticketId: string, reply: {
    content: string;
    attachments?: string[];
  }): Promise<any> {
    return this.apiClient.post<any>(`/customers/${customerId}/tickets/${ticketId}/replies`, reply);
  }

  async closeCustomerTicket(customerId: string, ticketId: string, feedback?: {
    rating: number;
    comment: string;
  }): Promise<SupportTicket> {
    return this.apiClient.post<SupportTicket>(`/customers/${customerId}/tickets/${ticketId}/close`, { feedback });
  }

  // ── Customer Wishlist ────────────────────────────────────────────────────────

  async getCustomerWishlist(customerId: string, params?: {
    page?: number;
    limit?: number;
    category?: string;
  }): Promise<PaginatedResponse<WishlistItem[]>> {
    return this.apiClient.get<PaginatedResponse<WishlistItem[]>>(`/customers/${customerId}/wishlist`, { params });
  }

  async addToWishlist(customerId: string, productId: string, itemData?: {
    quantity?: number;
    notes?: string;
  }): Promise<WishlistItem> {
    return this.apiClient.post<WishlistItem>(`/customers/${customerId}/wishlist`, { productId, ...itemData });
  }

  async removeFromWishlist(customerId: string, itemId: string): Promise<void> {
    return this.apiClient.delete<void>(`/customers/${customerId}/wishlist/${itemId}`);
  }

  async updateWishlistItem(customerId: string, itemId: string, updateData: {
    quantity?: number;
    notes?: string;
  }): Promise<WishlistItem> {
    return this.apiClient.put<WishlistItem>(`/customers/${customerId}/wishlist/${itemId}`, updateData);
  }

  async clearWishlist(customerId: string): Promise<void> {
    return this.apiClient.delete<void>(`/customers/${customerId}/wishlist`);
  }

  // ── Customer Orders ──────────────────────────────────────────────────────────

  async getCustomerOrders(customerId: string, params?: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResponse<any[]>> {
    return this.apiClient.get<PaginatedResponse<any[]>>(`/customers/${customerId}/orders`, { params });
  }

  async getCustomerOrder(customerId: string, orderId: string): Promise<any> {
    return this.apiClient.get<any>(`/customers/${customerId}/orders/${orderId}`);
  }

  // ── Customer Appointments ────────────────────────────────────────────────────

  async getCustomerAppointments(customerId: string, params?: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResponse<any[]>> {
    return this.apiClient.get<PaginatedResponse<any[]>>(`/customers/${customerId}/appointments`, { params });
  }

  async getCustomerAppointment(customerId: string, appointmentId: string): Promise<any> {
    return this.apiClient.get<any>(`/customers/${customerId}/appointments/${appointmentId}`);
  }

  // ── Customer Analytics ───────────────────────────────────────────────────────

  async getCustomerStats(customerId: string): Promise<{
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    orderCount: number;
    reviewCount: number;
    averageRating: number;
    wishlistCount: number;
    supportTicketCount: number;
    appointmentCount: number;
    lastOrderDate: string;
    lastActivityDate: string;
  }> {
    return this.apiClient.get<any>(`/customers/${customerId}/stats`);
  }

  async getCustomerActivity(customerId: string, params?: {
    page?: number;
    limit?: number;
    type?: 'ORDER' | 'REVIEW' | 'APPOINTMENT' | 'SUPPORT' | 'WISHLIST';
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResponse<Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    data: any;
  }>>> {
    return this.apiClient.get<PaginatedResponse<any[]>>(`/customers/${customerId}/activity`, { params });
  }

  // ── Customer Communication ───────────────────────────────────────────────────

  async sendCustomerEmail(customerId: string, emailData: {
    subject: string;
    content: string;
    template?: string;
    variables?: Record<string, any>;
  }): Promise<void> {
    return this.apiClient.post<void>(`/customers/${customerId}/email`, emailData);
  }

  async sendCustomerSMS(customerId: string, smsData: {
    message: string;
    template?: string;
    variables?: Record<string, any>;
  }): Promise<void> {
    return this.apiClient.post<void>(`/customers/${customerId}/sms`, smsData);
  }

  async getCustomerCommunicationHistory(customerId: string, params?: {
    page?: number;
    limit?: number;
    type?: 'EMAIL' | 'SMS' | 'PUSH';
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResponse<Array<{
    id: string;
    type: string;
    subject?: string;
    content: string;
    timestamp: string;
    status: string;
    sent: boolean;
  }>>> {
    return this.apiClient.get<PaginatedResponse<any[]>>(`/customers/${customerId}/communications`, { params });
  }

  // ── Customer Segmentation ────────────────────────────────────────────────────

  async getCustomerSegments(): Promise<Array<{
    id: string;
    name: string;
    description: string;
    criteria: any;
    customerCount: number;
  }>> {
    return this.apiClient.get<any[]>('/customers/segments');
  }

  async getCustomersInSegment(segmentId: string, params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Customer[]>> {
    return this.apiClient.get<PaginatedResponse<Customer[]>>(`/customers/segments/${segmentId}`, { params });
  }

  async addCustomerToSegment(customerId: string, segmentId: string): Promise<void> {
    return this.apiClient.post<void>(`/customers/${customerId}/segments/${segmentId}`);
  }

  async removeCustomerFromSegment(customerId: string, segmentId: string): Promise<void> {
    return this.apiClient.delete<void>(`/customers/${customerId}/segments/${segmentId}`);
  }

  // ── Customer Export ──────────────────────────────────────────────────────────

  async exportCustomers(params?: CustomerFilters & {
    format?: 'csv' | 'excel';
    fields?: string[];
  }): Promise<Blob> {
    return this.apiClient.get<Blob>('/customers/export', {
      params,
      responseType: 'blob',
    });
  }

  // ── Customer Search ──────────────────────────────────────────────────────────

  async searchCustomers(query: string, params?: {
    page?: number;
    limit?: number;
    filters?: CustomerFilters;
  }): Promise<PaginatedResponse<Customer[]>> {
    return this.apiClient.get<PaginatedResponse<Customer[]>>('/customers/search', {
      params: { q: query, ...params },
    });
  }

  // ── Customer Validation ──────────────────────────────────────────────────────

  async validateCustomer(customerData: CreateCustomerRequest): Promise<{
    valid: boolean;
    errors?: string[];
    warnings?: string[];
    duplicates?: Customer[];
  }> {
    return this.apiClient.post<any>('/customers/validate', customerData);
  }

  // ── Customer Merge ───────────────────────────────────────────────────────────

  async mergeCustomers(primaryCustomerId: string, duplicateCustomerIds: string[]): Promise<Customer> {
    return this.apiClient.post<Customer>(`/customers/${primaryCustomerId}/merge`, {
      duplicateCustomerIds,
    });
  }

  // ── Customer Tags ────────────────────────────────────────────────────────────

  async getCustomerTags(customerId: string): Promise<Array<{
    id: string;
    name: string;
    color: string;
    createdAt: string;
  }>> {
    return this.apiClient.get<any[]>(`/customers/${customerId}/tags`);
  }

  async addCustomerTag(customerId: string, tagData: {
    name: string;
    color?: string;
  }): Promise<any> {
    return this.apiClient.post<any>(`/customers/${customerId}/tags`, tagData);
  }

  async removeCustomerTag(customerId: string, tagId: string): Promise<void> {
    return this.apiClient.delete<void>(`/customers/${customerId}/tags/${tagId}`);
  }

  // ── Customer Notes ───────────────────────────────────────────────────────────

  async getCustomerNotes(customerId: string): Promise<Array<{
    id: string;
    content: string;
    author: string;
    createdAt: string;
    isInternal: boolean;
  }>> {
    return this.apiClient.get<any[]>(`/customers/${customerId}/notes`);
  }

  async addCustomerNote(customerId: string, note: {
    content: string;
    isInternal?: boolean;
  }): Promise<any> {
    return this.apiClient.post<any>(`/customers/${customerId}/notes`, note);
  }

  async updateCustomerNote(customerId: string, noteId: string, updateData: {
    content: string;
    isInternal?: boolean;
  }): Promise<any> {
    return this.apiClient.put<any>(`/customers/${customerId}/notes/${noteId}`, updateData);
  }

  async deleteCustomerNote(customerId: string, noteId: string): Promise<void> {
    return this.apiClient.delete<void>(`/customers/${customerId}/notes/${noteId}`);
  }
}