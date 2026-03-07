import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class HttpClient {
  private client: AxiosInstance;

  constructor(baseURL: string, options?: AxiosRequestConfig) {
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized access
          this.handleUnauthorized();
        }
        return Promise.reject(error);
      }
    );
  }

  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken');
    }
    return null;
  }

  private handleUnauthorized() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
  }

  setAuthToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', token);
    }
  }

  removeAuthToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
    }
  }

  async get<T>(url: string, params?: any): Promise<T> {
    const response = await this.client.get<ApiResponse<T>>(url, { params });
    return response.data.data as T;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.post<ApiResponse<T>>(url, data);
    return response.data.data as T;
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.put<ApiResponse<T>>(url, data);
    return response.data.data as T;
  }

  async patch<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.patch<ApiResponse<T>>(url, data);
    return response.data.data as T;
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.client.delete<ApiResponse<T>>(url);
    return response.data.data as T;
  }

  async upload<T>(url: string, formData: FormData): Promise<T> {
    const response = await this.client.post<ApiResponse<T>>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data as T;
  }

  async getBlob(url: string, params?: any): Promise<Blob> {
    const response = await this.client.get<Blob>(url, {
      params,
      responseType: 'blob',
    });
    return response.data;
  }
}

// Create service-specific clients
export const createAuthService = () => new HttpClient(process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || 'http://localhost:3001');
export const createProductService = () => new HttpClient(process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL || 'http://localhost:3002');
export const createOrderService = () => new HttpClient(process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || 'http://localhost:3003');
export const createAppointmentService = () => new HttpClient(process.env.NEXT_PUBLIC_APPOINTMENT_SERVICE_URL || 'http://localhost:3004');
export const createCustomerService = () => new HttpClient(process.env.NEXT_PUBLIC_CUSTOMER_SERVICE_URL || 'http://localhost:3005');
export const createContentService = () => new HttpClient(process.env.NEXT_PUBLIC_CONTENT_SERVICE_URL || 'http://localhost:3006');
export const createNotificationService = () => new HttpClient(process.env.NEXT_PUBLIC_NOTIFICATION_SERVICE_URL || 'http://localhost:3007');
export const createAnalyticsService = () => new HttpClient(process.env.NEXT_PUBLIC_ANALYTICS_SERVICE_URL || 'http://localhost:3008');
export const createUploadService = () => new HttpClient(process.env.NEXT_PUBLIC_UPLOAD_SERVICE_URL || 'http://localhost:3009');
