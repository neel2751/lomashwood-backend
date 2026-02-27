import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { logger } from '../utils/logger';
import { config } from '../config';

interface OrderServiceConfig {
  baseURL: string;
  timeout: number;
  retries: number;
}

interface CreateOrderRequest {
  customerId: string;
  items: {
    productId: string;
    quantity: number;
    price: number;
    productName: string;
    productImage?: string;
  }[];
  shippingAddress: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    postcode: string;
    country: string;
    phone: string;
  };
  billingAddress?: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    postcode: string;
    country: string;
    phone: string;
  };
  couponCode?: string;
  notes?: string;
}

interface UpdateOrderRequest {
  status?: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
  trackingNumber?: string;
  notes?: string;
}

interface OrderFilterRequest {
  customerId?: string;
  status?: string;
  minAmount?: number;
  maxAmount?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface CreatePaymentIntentRequest {
  orderId: string;
  amount: number;
  currency?: string;
  customerId: string;
  metadata?: Record<string, any>;
}

interface ConfirmPaymentRequest {
  paymentIntentId: string;
  paymentMethodId: string;
}

interface CreateRefundRequest {
  paymentId: string;
  amount?: number;
  reason?: string;
}

interface ApplyCouponRequest {
  orderId: string;
  couponCode: string;
}

interface CreateInvoiceRequest {
  orderId: string;
  customerId: string;
}

interface OrderResponse {
  success: boolean;
  data?: any;
  error?: any;
}

class OrderClient {
  private client: AxiosInstance;
  private readonly orderConfig: OrderServiceConfig;

  constructor() {
    
    const services = config.services as Record<string, any>;

    const baseURL: string =
      services?.orderPayment?.url ??
      services?.orderPaymentService?.url ??
      services?.order?.url ??
      services?.orders?.url ??
      (config as any).orderPaymentServiceUrl ??
      '';

    const timeout: number =
      services?.orderPayment?.timeout ??
      services?.orderPaymentService?.timeout ??
      services?.order?.timeout ??
      (config as any).timeouts?.order ??
      (config as any).timeouts?.default ??
      15_000;

    this.orderConfig = {
      baseURL,
      timeout,
      retries: 3,
    };

    if (!baseURL) {
      logger.warn('OrderClient: baseURL is empty — check your config.services shape');
    }

    this.client = axios.create({
      baseURL: this.orderConfig.baseURL,
      timeout: this.orderConfig.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.client.interceptors.request.use(
      (reqConfig) => {
        const requestId = (reqConfig as any).requestId;
        if (requestId) {
          reqConfig.headers['X-Request-ID'] = requestId;
        }

        logger.debug('Order service request', {
          method: reqConfig.method?.toUpperCase(),
          url: reqConfig.url,
          requestId,
        });

        return reqConfig;
      },
      (error) => {
        logger.error('Order service request error', { error: error.message });
        return Promise.reject(error);
      },
    );

    this.client.interceptors.response.use(
      (response) => {
        logger.debug('Order service response', {
          status: response.status,
          url: response.config.url,
          requestId: response.config.headers['X-Request-ID'],
        });
        return response;
      },
      async (error) => {
        
        const retryConfig = error.config as AxiosRequestConfig & { _retry?: number };

        if (!retryConfig._retry) {
          retryConfig._retry = 0;
        }

        if (retryConfig._retry < this.orderConfig.retries && this.shouldRetry(error)) {
          retryConfig._retry += 1;

          logger.warn('Retrying order service request', {
            attempt: retryConfig._retry,
            maxRetries: this.orderConfig.retries,
            url: retryConfig.url,
          });

          await this.delay(retryConfig._retry * 1000);
          return this.client(retryConfig);
        }

        logger.error('Order service error', {
          status: error.response?.status,
          message: error.message,
          url: retryConfig.url,
          requestId: retryConfig.headers?.['X-Request-ID'],
        });

        return Promise.reject(error);
      },
    );
  }

  private shouldRetry(error: any): boolean {
    if (!error.response) return true;
    const status = error.response.status;
    return status >= 500 || status === 429 || status === 408;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async makeRequest<T>(
    method: string,
    url: string,
    data?: any,
    requestId?: string,
  ): Promise<OrderResponse> {
    try {
      const response: AxiosResponse<T> = await this.client.request({
        method,
        url,
        data,
        ...({ requestId } as any),
      });

      return { success: true, data: response.data };
    } catch (error: any) {
      if (error.response) {
        return {
          success: false,
          error: {
            status: error.response.status,
            message: error.response.data?.message || error.message,
            code: error.response.data?.code,
            details: error.response.data?.details,
          },
        };
      }

      return {
        success: false,
        error: {
          status: 503,
          message: 'Order service unavailable',
          code: 'SERVICE_UNAVAILABLE',
        },
      };
    }
  }

  

  async createOrder(data: CreateOrderRequest, requestId?: string): Promise<OrderResponse> {
    return this.makeRequest('POST', '/api/v1/orders', data, requestId);
  }

  async getOrders(filters: OrderFilterRequest, requestId?: string): Promise<OrderResponse> {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    return this.makeRequest('GET', `/api/v1/orders?${queryParams.toString()}`, undefined, requestId);
  }

  async getOrderById(orderId: string, requestId?: string): Promise<OrderResponse> {
    return this.makeRequest('GET', `/api/v1/orders/${orderId}`, undefined, requestId);
  }

  async getOrderByNumber(orderNumber: string, requestId?: string): Promise<OrderResponse> {
    return this.makeRequest('GET', `/api/v1/orders/number/${orderNumber}`, undefined, requestId);
  }

  async updateOrder(orderId: string, data: UpdateOrderRequest, requestId?: string): Promise<OrderResponse> {
    return this.makeRequest('PATCH', `/api/v1/orders/${orderId}`, data, requestId);
  }

  async cancelOrder(orderId: string, reason?: string, requestId?: string): Promise<OrderResponse> {
    return this.makeRequest('POST', `/api/v1/orders/${orderId}/cancel`, { reason }, requestId);
  }

  async getCustomerOrders(customerId: string, requestId?: string): Promise<OrderResponse> {
    return this.makeRequest('GET', `/api/v1/orders/customer/${customerId}`, undefined, requestId);
  }

  

  async createPaymentIntent(data: CreatePaymentIntentRequest, requestId?: string): Promise<OrderResponse> {
    return this.makeRequest('POST', '/api/v1/payments/create-intent', data, requestId);
  }

  async confirmPayment(data: ConfirmPaymentRequest, requestId?: string): Promise<OrderResponse> {
    return this.makeRequest('POST', '/api/v1/payments/confirm', data, requestId);
  }

  async getPaymentById(paymentId: string, requestId?: string): Promise<OrderResponse> {
    return this.makeRequest('GET', `/api/v1/payments/${paymentId}`, undefined, requestId);
  }

  async getOrderPayments(orderId: string, requestId?: string): Promise<OrderResponse> {
    return this.makeRequest('GET', `/api/v1/orders/${orderId}/payments`, undefined, requestId);
  }

  async handleWebhook(provider: string, payload: any, _signature: string, requestId?: string): Promise<OrderResponse> {
  return this.makeRequest('POST', `/api/v1/webhooks/${provider}`, payload, requestId);
}

  async verifyPaymentStatus(orderId: string, requestId?: string): Promise<OrderResponse> {
    return this.makeRequest('GET', `/api/v1/orders/${orderId}/payment-status`, undefined, requestId);
  }

  async retryFailedPayment(orderId: string, requestId?: string): Promise<OrderResponse> {
    return this.makeRequest('POST', `/api/v1/orders/${orderId}/retry-payment`, undefined, requestId);
  }

  

  async createRefund(data: CreateRefundRequest, requestId?: string): Promise<OrderResponse> {
    return this.makeRequest('POST', '/api/v1/refunds', data, requestId);
  }

  async getRefundById(refundId: string, requestId?: string): Promise<OrderResponse> {
    return this.makeRequest('GET', `/api/v1/refunds/${refundId}`, undefined, requestId);
  }

  async getOrderRefunds(orderId: string, requestId?: string): Promise<OrderResponse> {
    return this.makeRequest('GET', `/api/v1/orders/${orderId}/refunds`, undefined, requestId);
  }

  

  async applyCoupon(data: ApplyCouponRequest, requestId?: string): Promise<OrderResponse> {
    return this.makeRequest('POST', '/api/v1/orders/apply-coupon', data, requestId);
  }

  async removeCoupon(orderId: string, requestId?: string): Promise<OrderResponse> {
    return this.makeRequest('DELETE', `/api/v1/orders/${orderId}/coupon`, undefined, requestId);
  }

  async validateCoupon(code: string, requestId?: string): Promise<OrderResponse> {
    return this.makeRequest('POST', '/api/v1/coupons/validate', { code }, requestId);
  }

  async calculateOrderTotal(orderId: string, requestId?: string): Promise<OrderResponse> {
    return this.makeRequest('GET', `/api/v1/orders/${orderId}/calculate`, undefined, requestId);
  }

  

  async createInvoice(data: CreateInvoiceRequest, requestId?: string): Promise<OrderResponse> {
    return this.makeRequest('POST', '/api/v1/invoices', data, requestId);
  }

  async getInvoiceById(invoiceId: string, requestId?: string): Promise<OrderResponse> {
    return this.makeRequest('GET', `/api/v1/invoices/${invoiceId}`, undefined, requestId);
  }

  async getOrderInvoice(orderId: string, requestId?: string): Promise<OrderResponse> {
    return this.makeRequest('GET', `/api/v1/orders/${orderId}/invoice`, undefined, requestId);
  }

  async downloadInvoice(invoiceId: string, requestId?: string): Promise<OrderResponse> {
    return this.makeRequest('GET', `/api/v1/invoices/${invoiceId}/download`, undefined, requestId);
  }

  

  async getOrderStatistics(startDate?: string, endDate?: string, requestId?: string): Promise<OrderResponse> {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    return this.makeRequest('GET', `/api/v1/orders/statistics?${queryParams.toString()}`, undefined, requestId);
  }

  async getRevenueStatistics(startDate?: string, endDate?: string, requestId?: string): Promise<OrderResponse> {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    return this.makeRequest('GET', `/api/v1/orders/revenue?${queryParams.toString()}`, undefined, requestId);
  }

  

  async estimateShipping(orderId: string, requestId?: string): Promise<OrderResponse> {
    return this.makeRequest('GET', `/api/v1/orders/${orderId}/shipping-estimate`, undefined, requestId);
  }

  async updateShippingAddress(orderId: string, address: any, requestId?: string): Promise<OrderResponse> {
    return this.makeRequest('PATCH', `/api/v1/orders/${orderId}/shipping-address`, address, requestId);
  }

  

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch (error) {
      logger.error('Order service health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }
}

export const orderClient = new OrderClient();