import axios, { AxiosInstance, AxiosError } from 'axios';
import { config } from '../config';
import { logger } from '../utils/logger';
import { ServiceError } from '../utils/errors';

interface CustomerProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone: string;
  postcode: string;
  address: string;
  createdAt: Date;
  updatedAt: Date;
}

interface WishlistItem {
  id: string;
  customerId: string;
  productId: string;
  addedAt: Date;
}

interface Review {
  id: string;
  customerId: string;
  productId?: string;
  rating: number;
  title: string;
  description: string;
  images?: string[];
  video?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: Date;
}

interface SupportTicket {
  id: string;
  customerId: string;
  subject: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: Date;
  updatedAt: Date;
}

interface LoyaltyPoints {
  id: string;
  customerId: string;
  totalPoints: number;
  availablePoints: number;
  usedPoints: number;
  expiringPoints: number;
  expiryDate?: Date;
}

interface CreateProfileDto {
  userId: string;
  firstName: string;
  lastName: string;
  phone: string;
  postcode: string;
  address: string;
}

interface UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  postcode?: string;
  address?: string;
}

interface CreateWishlistDto {
  customerId: string;
  productId: string;
}

interface CreateReviewDto {
  customerId: string;
  productId?: string;
  rating: number;
  title: string;
  description: string;
  images?: string[];
  video?: string;
}

interface CreateSupportTicketDto {
  customerId: string;
  subject: string;
  description: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export class CustomerServiceClient {
  private client: AxiosInstance;
  private readonly baseURL: string;
  private readonly timeout: number;
  private readonly maxRetries: number;

  constructor() {
    // ── Fix: resolve baseURL/timeout safely across possible config shapes ──
    const services = config.services as Record<string, any>;

    this.baseURL =
      services?.customer?.url ??
      services?.customerService?.url ??
      services?.customers?.url ??
      (config as any).customerServiceUrl ??
      '';

    this.timeout =
      services?.customer?.timeout ??
      services?.customerService?.timeout ??
      (config as any).timeouts?.customer ??
      (config as any).timeouts?.default ??
      10_000;

    this.maxRetries = 3;

    if (!this.baseURL) {
      logger.warn('CustomerServiceClient: baseURL is empty — check your config.services shape');
    }

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.client.interceptors.request.use(
      (reqConfig) => {
        const requestId = Math.random().toString(36).substring(7);
        reqConfig.headers['X-Request-ID'] = requestId;

        logger.info('Customer service request', {
          requestId,
          method: reqConfig.method?.toUpperCase(),
          url: reqConfig.url,
        });

        return reqConfig;
      },
      (error) => {
        logger.error('Customer service request error', { error });
        return Promise.reject(error);
      },
    );

    this.client.interceptors.response.use(
      (response) => {
        logger.info('Customer service response', {
          requestId: response.config.headers['X-Request-ID'],
          status: response.status,
        });
        return response;
      },
      async (error: AxiosError) => {
        const requestId = error.config?.headers['X-Request-ID'];

        logger.error('Customer service response error', {
          requestId,
          status: error.response?.status,
          message: error.message,
        });

        if (this.shouldRetry(error)) {
          return this.retryRequest(error);
        }

        throw this.handleError(error);
      },
    );
  }

  private shouldRetry(error: AxiosError): boolean {
    const retryableStatuses = [408, 429, 500, 502, 503, 504];
    const status = error.response?.status;
    return status ? retryableStatuses.includes(status) : false;
  }

  private async retryRequest(error: AxiosError, retryCount = 0): Promise<any> {
    if (retryCount >= this.maxRetries) {
      throw this.handleError(error);
    }

    const delay = Math.pow(2, retryCount) * 1000;
    await new Promise((resolve) => setTimeout(resolve, delay));

    logger.info('Retrying customer service request', {
      attempt: retryCount + 1,
      maxRetries: this.maxRetries,
    });

    try {
      return await this.client.request(error.config!);
    } catch (retryError) {
      return this.retryRequest(retryError as AxiosError, retryCount + 1);
    }
  }

  private handleError(error: AxiosError): ServiceError {
    const status = error.response?.status || 500;
    const message = (error.response?.data as any)?.message || error.message;
    return new ServiceError(message, status, 'CUSTOMER_SERVICE_ERROR');
  }

  // ── Profile ───────────────────────────────────────────────────────────────

  async createProfile(data: CreateProfileDto): Promise<CustomerProfile> {
    const response = await this.client.post<CustomerProfile>('/profiles', data);
    return response.data;
  }

  async getProfile(customerId: string): Promise<CustomerProfile> {
    const response = await this.client.get<CustomerProfile>(`/profiles/${customerId}`);
    return response.data;
  }

  async getProfileByUserId(userId: string): Promise<CustomerProfile> {
    const response = await this.client.get<CustomerProfile>(`/profiles/user/${userId}`);
    return response.data;
  }

  async updateProfile(customerId: string, data: UpdateProfileDto): Promise<CustomerProfile> {
    const response = await this.client.patch<CustomerProfile>(`/profiles/${customerId}`, data);
    return response.data;
  }

  async deleteProfile(customerId: string): Promise<void> {
    await this.client.delete(`/profiles/${customerId}`);
  }

  // ── Wishlist ──────────────────────────────────────────────────────────────

  async addToWishlist(data: CreateWishlistDto): Promise<WishlistItem> {
    const response = await this.client.post<WishlistItem>('/wishlist', data);
    return response.data;
  }

  async getWishlist(customerId: string, params?: PaginationParams): Promise<PaginatedResponse<WishlistItem>> {
    const response = await this.client.get<PaginatedResponse<WishlistItem>>(
      `/wishlist/${customerId}`,
      { params },
    );
    return response.data;
  }

  async removeFromWishlist(wishlistItemId: string): Promise<void> {
    await this.client.delete(`/wishlist/${wishlistItemId}`);
  }

  async clearWishlist(customerId: string): Promise<void> {
    await this.client.delete(`/wishlist/customer/${customerId}`);
  }

  // ── Reviews ───────────────────────────────────────────────────────────────

  async createReview(data: CreateReviewDto): Promise<Review> {
    const response = await this.client.post<Review>('/reviews', data);
    return response.data;
  }

  async getReviews(
    params?: PaginationParams & { status?: string; productId?: string },
  ): Promise<PaginatedResponse<Review>> {
    const response = await this.client.get<PaginatedResponse<Review>>('/reviews', { params });
    return response.data;
  }

  async getReview(reviewId: string): Promise<Review> {
    const response = await this.client.get<Review>(`/reviews/${reviewId}`);
    return response.data;
  }

  async getCustomerReviews(
    customerId: string,
    params?: PaginationParams,
  ): Promise<PaginatedResponse<Review>> {
    const response = await this.client.get<PaginatedResponse<Review>>(
      `/reviews/customer/${customerId}`,
      { params },
    );
    return response.data;
  }

  async updateReview(reviewId: string, data: Partial<CreateReviewDto>): Promise<Review> {
    const response = await this.client.patch<Review>(`/reviews/${reviewId}`, data);
    return response.data;
  }

  async deleteReview(reviewId: string): Promise<void> {
    await this.client.delete(`/reviews/${reviewId}`);
  }

  // ── Support Tickets ───────────────────────────────────────────────────────

  async createSupportTicket(data: CreateSupportTicketDto): Promise<SupportTicket> {
    const response = await this.client.post<SupportTicket>('/support', data);
    return response.data;
  }

  async getSupportTickets(
    params?: PaginationParams & { status?: string; priority?: string },
  ): Promise<PaginatedResponse<SupportTicket>> {
    const response = await this.client.get<PaginatedResponse<SupportTicket>>('/support', { params });
    return response.data;
  }

  async getSupportTicket(ticketId: string): Promise<SupportTicket> {
    const response = await this.client.get<SupportTicket>(`/support/${ticketId}`);
    return response.data;
  }

  async getCustomerTickets(
    customerId: string,
    params?: PaginationParams,
  ): Promise<PaginatedResponse<SupportTicket>> {
    const response = await this.client.get<PaginatedResponse<SupportTicket>>(
      `/support/customer/${customerId}`,
      { params },
    );
    return response.data;
  }

  async updateSupportTicket(
    ticketId: string,
    data: { status?: string; priority?: string },
  ): Promise<SupportTicket> {
    const response = await this.client.patch<SupportTicket>(`/support/${ticketId}`, data);
    return response.data;
  }

  async closeSupportTicket(ticketId: string): Promise<SupportTicket> {
    const response = await this.client.patch<SupportTicket>(`/support/${ticketId}/close`);
    return response.data;
  }

  // ── Loyalty Points ────────────────────────────────────────────────────────

  async getLoyaltyPoints(customerId: string): Promise<LoyaltyPoints> {
    const response = await this.client.get<LoyaltyPoints>(`/loyalty/${customerId}`);
    return response.data;
  }

  async addLoyaltyPoints(
    customerId: string,
    points: number,
    reason: string,
  ): Promise<LoyaltyPoints> {
    const response = await this.client.post<LoyaltyPoints>(`/loyalty/${customerId}/add`, {
      points,
      reason,
    });
    return response.data;
  }

  async redeemLoyaltyPoints(customerId: string, points: number): Promise<LoyaltyPoints> {
    const response = await this.client.post<LoyaltyPoints>(`/loyalty/${customerId}/redeem`, {
      points,
    });
    return response.data;
  }

  async getLoyaltyHistory(
    customerId: string,
    params?: PaginationParams,
  ): Promise<PaginatedResponse<any>> {
    const response = await this.client.get<PaginatedResponse<any>>(
      `/loyalty/${customerId}/history`,
      { params },
    );
    return response.data;
  }

  // ── Health ────────────────────────────────────────────────────────────────

  async healthCheck(): Promise<{ status: string; timestamp: Date }> {
    const response = await this.client.get('/health');
    return response.data;
  }
}

export const customerServiceClient = new CustomerServiceClient();