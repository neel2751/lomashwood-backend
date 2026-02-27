import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { logger } from './logger';
import { ServiceError } from './errors';

export interface HttpClientConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
  retryAttempts?: number;
  retryDelay?: number;
  validateStatus?: (status: number) => boolean;
}

export interface RequestOptions extends AxiosRequestConfig {
  skipRetry?: boolean;
  skipLogging?: boolean;
  customErrorHandler?: (error: AxiosError) => void;
}

export class HttpClient {
  private client: AxiosInstance;
  private retryAttempts: number;
  private retryDelay: number;

  constructor(config: HttpClientConfig) {
    this.retryAttempts = config.retryAttempts || 3;
    this.retryDelay = config.retryDelay || 1000;

    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...config.headers,
      },
      validateStatus: config.validateStatus || ((status) => status >= 200 && status < 300),
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.client.interceptors.request.use(
      (config) => {
        const requestId = this.generateRequestId();
        config.headers['X-Request-ID'] = requestId;
        config.headers['X-Request-Time'] = new Date().toISOString();

        if (!(config as any).skipLogging) {
          logger.debug('HTTP Request', {
            requestId,
            method: config.method?.toUpperCase(),
            url: config.url,
            baseURL: config.baseURL,
            headers: this.sanitizeHeaders(config.headers),
          });
        }

        return config;
      },
      (error) => {
        logger.error('HTTP Request Interceptor Error', { error: error.message });
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        const requestId = response.config.headers['X-Request-ID'];
        const requestTime = response.config.headers['X-Request-Time'];
        const duration = requestTime 
          ? Date.now() - new Date(requestTime as string).getTime()
          : undefined;

        if (!(response.config as any).skipLogging) {
          logger.debug('HTTP Response', {
            requestId,
            status: response.status,
            statusText: response.statusText,
            duration: duration ? `${duration}ms` : undefined,
          });
        }

        return response;
      },
      async (error: AxiosError) => {
        const requestId = error.config?.headers['X-Request-ID'];
        const skipRetry = (error.config as any)?.skipRetry;

        logger.error('HTTP Response Error', {
          requestId,
          status: error.response?.status,
          message: error.message,
          url: error.config?.url,
        });

        if (!skipRetry && this.shouldRetry(error)) {
          return this.retryRequest(error);
        }

        if ((error.config as any)?.customErrorHandler) {
          (error.config as any).customErrorHandler(error);
        }

        throw this.transformError(error);
      }
    );
  }

  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  private sanitizeHeaders(headers?: Record<string, any>): Record<string, any> {
    if (!headers) return {};

    const sanitized = { ...headers };
    const sensitiveKeys = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];

    Object.keys(sanitized).forEach(key => {
      if (sensitiveKeys.includes(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  private shouldRetry(error: AxiosError): boolean {
    if (!error.config) return false;

    const retryableStatuses = [408, 429, 500, 502, 503, 504];
    const status = error.response?.status;

    const isRetryableStatus = status ? retryableStatuses.includes(status) : false;
    const isNetworkError = !error.response && error.code !== 'ECONNABORTED';
    const isTimeout = error.code === 'ECONNABORTED';

    return isRetryableStatus || isNetworkError || isTimeout;
  }

  private async retryRequest(error: AxiosError, retryCount = 0): Promise<any> {
    if (retryCount >= this.retryAttempts) {
      throw this.transformError(error);
    }

    const delay = this.calculateRetryDelay(retryCount);
    
    logger.info('Retrying HTTP request', {
      requestId: error.config?.headers['X-Request-ID'],
      attempt: retryCount + 1,
      maxAttempts: this.retryAttempts,
      delay: `${delay}ms`,
    });

    await this.sleep(delay);

    try {
      return await this.client.request(error.config!);
    } catch (retryError) {
      return this.retryRequest(retryError as AxiosError, retryCount + 1);
    }
  }

  private calculateRetryDelay(retryCount: number): number {
    const exponentialDelay = Math.pow(2, retryCount) * this.retryDelay;
    const jitter = Math.random() * 1000;
    return Math.min(exponentialDelay + jitter, 30000);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private transformError(error: AxiosError): ServiceError {
    const status = error.response?.status || 500;
    const message = this.extractErrorMessage(error);
    const code = this.extractErrorCode(error);

    return new ServiceError(message, status, code, {
      url: error.config?.url,
      method: error.config?.method,
      requestId: error.config?.headers['X-Request-ID'],
      originalError: error.message,
    });
  }

  private extractErrorMessage(error: AxiosError): string {
    if (error.response?.data) {
      const data = error.response.data as any;
      return data.message || data.error || data.msg || error.message;
    }

    if (error.code === 'ECONNABORTED') {
      return 'Request timeout';
    }

    if (error.code === 'ECONNREFUSED') {
      return 'Service unavailable';
    }

    return error.message || 'An unexpected error occurred';
  }

  private extractErrorCode(error: AxiosError): string {
    if (error.response?.data) {
      const data = error.response.data as any;
      return data.code || data.errorCode || 'UNKNOWN_ERROR';
    }

    if (error.code) {
      return error.code;
    }

    return 'HTTP_ERROR';
  }

  public async get<T = any>(url: string, options?: RequestOptions): Promise<T> {
    const response = await this.client.get<T>(url, options);
    return response.data;
  }

  public async post<T = any>(url: string, data?: any, options?: RequestOptions): Promise<T> {
    const response = await this.client.post<T>(url, data, options);
    return response.data;
  }

  public async put<T = any>(url: string, data?: any, options?: RequestOptions): Promise<T> {
    const response = await this.client.put<T>(url, data, options);
    return response.data;
  }

  public async patch<T = any>(url: string, data?: any, options?: RequestOptions): Promise<T> {
    const response = await this.client.patch<T>(url, data, options);
    return response.data;
  }

  public async delete<T = any>(url: string, options?: RequestOptions): Promise<T> {
    const response = await this.client.delete<T>(url, options);
    return response.data;
  }

  public async request<T = any>(config: RequestOptions): Promise<T> {
    const response = await this.client.request<T>(config);
    return response.data;
  }

  public setAuthToken(token: string): void {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  public removeAuthToken(): void {
    delete this.client.defaults.headers.common['Authorization'];
  }

  public setApiKey(apiKey: string): void {
    this.client.defaults.headers.common['X-API-Key'] = apiKey;
  }

  public removeApiKey(): void {
    delete this.client.defaults.headers.common['X-API-Key'];
  }

  public setHeader(key: string, value: string): void {
    this.client.defaults.headers.common[key] = value;
  }

  public removeHeader(key: string): void {
    delete this.client.defaults.headers.common[key];
  }

  public getClient(): AxiosInstance {
    return this.client;
  }
}

export const createHttpClient = (config: HttpClientConfig): HttpClient => {
  return new HttpClient(config);
};

export const createServiceClient = (
  baseURL: string,
  timeout?: number,
  headers?: Record<string, string>
): HttpClient => {
  return new HttpClient({
    baseURL,
    timeout,
    headers,
    retryAttempts: 3,
    retryDelay: 1000,
  });
};

export const isNetworkError = (error: any): boolean => {
  return !error.response && error.request !== undefined;
};

export const isTimeoutError = (error: any): boolean => {
  return error.code === 'ECONNABORTED' || error.message?.includes('timeout');
};

export const isServerError = (error: any): boolean => {
  const status = error.response?.status;
  return status >= 500 && status < 600;
};

export const isClientError = (error: any): boolean => {
  const status = error.response?.status;
  return status >= 400 && status < 500;
};

export const isAuthenticationError = (error: any): boolean => {
  const status = error.response?.status;
  return status === 401 || status === 403;
};

export const isValidationError = (error: any): boolean => {
  const status = error.response?.status;
  return status === 400 || status === 422;
};

export const isNotFoundError = (error: any): boolean => {
  const status = error.response?.status;
  return status === 404;
};

export const isRateLimitError = (error: any): boolean => {
  const status = error.response?.status;
  return status === 429;
};