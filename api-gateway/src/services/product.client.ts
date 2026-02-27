import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { logger } from '../utils/logger';
import { config } from '../config';

interface ProductServiceConfig {
  baseURL: string;
  timeout: number;
  retries: number;
}

interface CreateProductRequest {
  title: string;
  description: string;
  category: 'KITCHEN' | 'BEDROOM';
  images: string[];
  colourIds: string[];
  price?: number;
  rangeName?: string;
  style?: string;
  finish?: string;
  units?: {
    image: string;
    title: string;
    description: string;
  }[];
}

interface UpdateProductRequest {
  title?: string;
  description?: string;
  category?: 'KITCHEN' | 'BEDROOM';
  images?: string[];
  colourIds?: string[];
  price?: number;
  rangeName?: string;
  style?: string;
  finish?: string;
  units?: {
    image: string;
    title: string;
    description: string;
  }[];
  isActive?: boolean;
}

interface ProductFilterRequest {
  category?: 'KITCHEN' | 'BEDROOM';
  colourIds?: string[];
  style?: string;
  finish?: string;
  range?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface CreateColourRequest {
  name: string;
  hexCode: string;
}

interface UpdateColourRequest {
  name?: string;
  hexCode?: string;
  isActive?: boolean;
}

interface CreateCategoryRequest {
  name: string;
  slug: string;
  description?: string;
  image?: string;
}

interface UpdateCategoryRequest {
  name?: string;
  slug?: string;
  description?: string;
  image?: string;
  isActive?: boolean;
}

interface ProductResponse {
  success: boolean;
  data?: any;
  error?: any;
}

class ProductClient {
  private client: AxiosInstance;
  private readonly productConfig: ProductServiceConfig;

  constructor() {
    
    const services = config.services as Record<string, any>;

    const baseURL: string =
      services?.product?.url ??
      services?.productService?.url ??
      services?.products?.url ??
      (config as any).productServiceUrl ??
      '';

    const timeout: number =
      services?.product?.timeout ??
      services?.productService?.timeout ??
      (config as any).timeouts?.product ??
      (config as any).timeouts?.default ??
      15_000;

    this.productConfig = {
      baseURL,
      timeout,
      retries: 3,
    };

    if (!baseURL) {
      logger.warn('ProductClient: baseURL is empty — check your config.services shape');
    }

    this.client = axios.create({
      baseURL: this.productConfig.baseURL,
      timeout: this.productConfig.timeout,
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

        logger.debug('Product service request', {
          method: reqConfig.method?.toUpperCase(),
          url: reqConfig.url,
          requestId,
        });

        return reqConfig;
      },
      (error) => {
        logger.error('Product service request error', { error: error.message });
        return Promise.reject(error);
      },
    );

    this.client.interceptors.response.use(
      (response) => {
        logger.debug('Product service response', {
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

        if (retryConfig._retry < this.productConfig.retries && this.shouldRetry(error)) {
          retryConfig._retry += 1;

          logger.warn('Retrying product service request', {
            attempt: retryConfig._retry,
            maxRetries: this.productConfig.retries,
            url: retryConfig.url,
          });

          await this.delay(retryConfig._retry * 1000);
          return this.client(retryConfig);
        }

        logger.error('Product service error', {
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
  ): Promise<ProductResponse> {
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
          message: 'Product service unavailable',
          code: 'SERVICE_UNAVAILABLE',
        },
      };
    }
  }

  

  async getProducts(filters: ProductFilterRequest, requestId?: string): Promise<ProductResponse> {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach((v) => queryParams.append(key, v.toString()));
        } else {
          queryParams.append(key, value.toString());
        }
      }
    });
    return this.makeRequest('GET', `/api/v1/products?${queryParams.toString()}`, undefined, requestId);
  }

  async getProductById(productId: string, requestId?: string): Promise<ProductResponse> {
    return this.makeRequest('GET', `/api/v1/products/${productId}`, undefined, requestId);
  }

  async getProductBySlug(slug: string, requestId?: string): Promise<ProductResponse> {
    return this.makeRequest('GET', `/api/v1/products/slug/${slug}`, undefined, requestId);
  }

  async createProduct(data: CreateProductRequest, requestId?: string): Promise<ProductResponse> {
    return this.makeRequest('POST', '/api/v1/products', data, requestId);
  }

  async updateProduct(productId: string, data: UpdateProductRequest, requestId?: string): Promise<ProductResponse> {
    return this.makeRequest('PATCH', `/api/v1/products/${productId}`, data, requestId);
  }

  async deleteProduct(productId: string, requestId?: string): Promise<ProductResponse> {
    return this.makeRequest('DELETE', `/api/v1/products/${productId}`, undefined, requestId);
  }

  

  async getCategories(requestId?: string): Promise<ProductResponse> {
    return this.makeRequest('GET', '/api/v1/categories', undefined, requestId);
  }

  async getCategoryById(categoryId: string, requestId?: string): Promise<ProductResponse> {
    return this.makeRequest('GET', `/api/v1/categories/${categoryId}`, undefined, requestId);
  }

  async createCategory(data: CreateCategoryRequest, requestId?: string): Promise<ProductResponse> {
    return this.makeRequest('POST', '/api/v1/categories', data, requestId);
  }

  async updateCategory(categoryId: string, data: UpdateCategoryRequest, requestId?: string): Promise<ProductResponse> {
    return this.makeRequest('PATCH', `/api/v1/categories/${categoryId}`, data, requestId);
  }

  async deleteCategory(categoryId: string, requestId?: string): Promise<ProductResponse> {
    return this.makeRequest('DELETE', `/api/v1/categories/${categoryId}`, undefined, requestId);
  }

  

  async getColours(requestId?: string): Promise<ProductResponse> {
    return this.makeRequest('GET', '/api/v1/colours', undefined, requestId);
  }

  async getColourById(colourId: string, requestId?: string): Promise<ProductResponse> {
    return this.makeRequest('GET', `/api/v1/colours/${colourId}`, undefined, requestId);
  }

  async createColour(data: CreateColourRequest, requestId?: string): Promise<ProductResponse> {
    return this.makeRequest('POST', '/api/v1/colours', data, requestId);
  }

  async updateColour(colourId: string, data: UpdateColourRequest, requestId?: string): Promise<ProductResponse> {
    return this.makeRequest('PATCH', `/api/v1/colours/${colourId}`, data, requestId);
  }

  async deleteColour(colourId: string, requestId?: string): Promise<ProductResponse> {
    return this.makeRequest('DELETE', `/api/v1/colours/${colourId}`, undefined, requestId);
  }

  

  async getProductsByCategory(category: string, requestId?: string): Promise<ProductResponse> {
    return this.makeRequest('GET', `/api/v1/products/category/${category}`, undefined, requestId);
  }

  async getProductsByColour(colourId: string, requestId?: string): Promise<ProductResponse> {
    return this.makeRequest('GET', `/api/v1/products/colour/${colourId}`, undefined, requestId);
  }

  async getFeaturedProducts(category?: string, requestId?: string): Promise<ProductResponse> {
    const url = category
      ? `/api/v1/products/featured?category=${category}`
      : '/api/v1/products/featured';
    return this.makeRequest('GET', url, undefined, requestId);
  }

  async searchProducts(query: string, filters?: ProductFilterRequest, requestId?: string): Promise<ProductResponse> {
    const queryParams = new URLSearchParams({ q: query });
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach((v) => queryParams.append(key, v.toString()));
          } else {
            queryParams.append(key, value.toString());
          }
        }
      });
    }
    return this.makeRequest('GET', `/api/v1/products/search?${queryParams.toString()}`, undefined, requestId);
  }

  async getRelatedProducts(productId: string, limit?: number, requestId?: string): Promise<ProductResponse> {
    const url = limit
      ? `/api/v1/products/${productId}/related?limit=${limit}`
      : `/api/v1/products/${productId}/related`;
    return this.makeRequest('GET', url, undefined, requestId);
  }

  

  async getProductInventory(productId: string, requestId?: string): Promise<ProductResponse> {
    return this.makeRequest('GET', `/api/v1/products/${productId}/inventory`, undefined, requestId);
  }

  async updateProductInventory(productId: string, quantity: number, requestId?: string): Promise<ProductResponse> {
    return this.makeRequest('PATCH', `/api/v1/products/${productId}/inventory`, { quantity }, requestId);
  }

  

  async getProductRanges(requestId?: string): Promise<ProductResponse> {
    return this.makeRequest('GET', '/api/v1/ranges', undefined, requestId);
  }

  async getProductsByRange(rangeName: string, requestId?: string): Promise<ProductResponse> {
    return this.makeRequest('GET', `/api/v1/products/range/${rangeName}`, undefined, requestId);
  }

  async getProductStyles(requestId?: string): Promise<ProductResponse> {
    return this.makeRequest('GET', '/api/v1/styles', undefined, requestId);
  }

  async getProductFinishes(requestId?: string): Promise<ProductResponse> {
    return this.makeRequest('GET', '/api/v1/finishes', undefined, requestId);
  }

  

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch (error) {
      logger.error('Product service health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }
}

export const productClient = new ProductClient();