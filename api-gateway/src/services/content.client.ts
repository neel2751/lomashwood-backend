import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { logger } from '../utils/logger';
import { config } from '../config';

interface ContentServiceConfig {
  baseURL: string;
  timeout: number;
  retries: number;
}

interface CreateBlogRequest {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  author?: string;
  tags?: string[];
  category?: string;
  metaTitle?: string;
  metaDescription?: string;
  isPublished?: boolean;
}

interface UpdateBlogRequest {
  title?: string;
  slug?: string;
  content?: string;
  excerpt?: string;
  featuredImage?: string;
  author?: string;
  tags?: string[];
  category?: string;
  metaTitle?: string;
  metaDescription?: string;
  isPublished?: boolean;
}

interface CreateMediaWallRequest {
  title: string;
  description: string;
  images: string[];
  backgroundImage?: string;
  isActive?: boolean;
}

interface UpdateMediaWallRequest {
  title?: string;
  description?: string;
  images?: string[];
  backgroundImage?: string;
  isActive?: boolean;
}

interface CreateFinanceContentRequest {
  title: string;
  description: string;
  content: string;
  isActive?: boolean;
}

interface UpdateFinanceContentRequest {
  title?: string;
  description?: string;
  content?: string;
  isActive?: boolean;
}

interface CreateHomeSliderRequest {
  image: string;
  title: string;
  description: string;
  buttonName: string;
  buttonLink?: string;
  order?: number;
  isActive?: boolean;
}

interface UpdateHomeSliderRequest {
  image?: string;
  title?: string;
  description?: string;
  buttonName?: string;
  buttonLink?: string;
  order?: number;
  isActive?: boolean;
}

interface CreateDynamicPageRequest {
  type: 'ABOUT_US' | 'WHY_CHOOSE_US' | 'CONTACT_US' | 'CAREER' | 'TERMS' | 'PRIVACY';
  title: string;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
  isActive?: boolean;
}

interface UpdateDynamicPageRequest {
  title?: string;
  content?: string;
  metaTitle?: string;
  metaDescription?: string;
  isActive?: boolean;
}

interface CreateFAQRequest {
  question: string;
  answer: string;
  category?: string;
  order?: number;
  isActive?: boolean;
}

interface UpdateFAQRequest {
  question?: string;
  answer?: string;
  category?: string;
  order?: number;
  isActive?: boolean;
}

interface NewsletterSubscribeRequest {
  email: string;
}

interface CreateAccreditationRequest {
  name: string;
  image: string;
  description?: string;
  link?: string;
  order?: number;
  isActive?: boolean;
}

interface UpdateAccreditationRequest {
  name?: string;
  image?: string;
  description?: string;
  link?: string;
  order?: number;
  isActive?: boolean;
}

interface CreateLogoRequest {
  name: string;
  image: string;
  link?: string;
  order?: number;
  isActive?: boolean;
}

interface CreateReviewRequest {
  customerName: string;
  rating: number;
  title: string;
  content: string;
  productId?: string;
  isVerified?: boolean;
  isApproved?: boolean;
}

interface UpdateReviewRequest {
  customerName?: string;
  rating?: number;
  title?: string;
  content?: string;
  isApproved?: boolean;
}

interface CreateOurProcessRequest {
  step: number;
  title: string;
  description: string;
  icon?: string;
  isActive?: boolean;
}

interface UpdateOurProcessRequest {
  step?: number;
  title?: string;
  description?: string;
  icon?: string;
  isActive?: boolean;
}

interface CreateProjectRequest {
  title: string;
  description: string;
  category: 'KITCHEN' | 'BEDROOM';
  images: string[];
  location?: string;
  completedDate?: string;
  isFeatured?: boolean;
  isActive?: boolean;
}

interface UpdateProjectRequest {
  title?: string;
  description?: string;
  category?: 'KITCHEN' | 'BEDROOM';
  images?: string[];
  location?: string;
  completedDate?: string;
  isFeatured?: boolean;
  isActive?: boolean;
}

interface ContentResponse {
  success: boolean;
  data?: any;
  error?: any;
}

class ContentClient {
  private client: AxiosInstance;
  private readonly contentConfig: ContentServiceConfig;

  constructor() {
    // ── Fix: resolve URL/timeout safely across possible config shapes ──
    const services = config.services as Record<string, any>;

    const baseURL: string =
      services?.content?.url ??
      services?.contentService?.url ??
      services?.cms?.url ??
      (config as any).contentServiceUrl ??
      '';

    const timeout: number =
      services?.content?.timeout ??
      services?.contentService?.timeout ??
      services?.cms?.timeout ??
      (config as any).timeouts?.content ??
      (config as any).timeouts?.default ??
      15_000;

    this.contentConfig = {
      baseURL,
      timeout,
      retries: 3,
    };

    if (!baseURL) {
      logger.warn('ContentClient: baseURL is empty — check your config.services shape');
    }

    this.client = axios.create({
      baseURL: this.contentConfig.baseURL,
      timeout: this.contentConfig.timeout,
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

        logger.debug('Content service request', {
          method: reqConfig.method?.toUpperCase(),
          url: reqConfig.url,
          requestId,
        });

        return reqConfig;
      },
      (error) => {
        logger.error('Content service request error', { error: error.message });
        return Promise.reject(error);
      },
    );

    this.client.interceptors.response.use(
      (response) => {
        logger.debug('Content service response', {
          status: response.status,
          url: response.config.url,
          requestId: response.config.headers['X-Request-ID'],
        });
        return response;
      },
      async (error) => {
        // Renamed to avoid shadowing the imported `config`
        const retryConfig = error.config as AxiosRequestConfig & { _retry?: number };

        if (!retryConfig._retry) {
          retryConfig._retry = 0;
        }

        if (retryConfig._retry < this.contentConfig.retries && this.shouldRetry(error)) {
          retryConfig._retry += 1;

          logger.warn('Retrying content service request', {
            attempt: retryConfig._retry,
            maxRetries: this.contentConfig.retries,
            url: retryConfig.url,
          });

          await this.delay(retryConfig._retry * 1000);
          return this.client(retryConfig);
        }

        logger.error('Content service error', {
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
  ): Promise<ContentResponse> {
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
          message: 'Content service unavailable',
          code: 'SERVICE_UNAVAILABLE',
        },
      };
    }
  }

  // ── Blog ──────────────────────────────────────────────────────────────────

  async getBlogs(page?: number, limit?: number, requestId?: string): Promise<ContentResponse> {
    const q = new URLSearchParams();
    if (page) q.append('page', page.toString());
    if (limit) q.append('limit', limit.toString());
    return this.makeRequest('GET', `/api/v1/blog?${q.toString()}`, undefined, requestId);
  }

  async getBlogBySlug(slug: string, requestId?: string): Promise<ContentResponse> {
    return this.makeRequest('GET', `/api/v1/blog/${slug}`, undefined, requestId);
  }

  async createBlog(data: CreateBlogRequest, requestId?: string): Promise<ContentResponse> {
    return this.makeRequest('POST', '/api/v1/blog', data, requestId);
  }

  async updateBlog(id: string, data: UpdateBlogRequest, requestId?: string): Promise<ContentResponse> {
    return this.makeRequest('PATCH', `/api/v1/blog/${id}`, data, requestId);
  }

  async deleteBlog(id: string, requestId?: string): Promise<ContentResponse> {
    return this.makeRequest('DELETE', `/api/v1/blog/${id}`, undefined, requestId);
  }

  // ── Media Wall ────────────────────────────────────────────────────────────

  async getMediaWall(requestId?: string): Promise<ContentResponse> {
    return this.makeRequest('GET', '/api/v1/media-wall', undefined, requestId);
  }

  async createMediaWall(data: CreateMediaWallRequest, requestId?: string): Promise<ContentResponse> {
    return this.makeRequest('POST', '/api/v1/media-wall', data, requestId);
  }

  async updateMediaWall(id: string, data: UpdateMediaWallRequest, requestId?: string): Promise<ContentResponse> {
    return this.makeRequest('PATCH', `/api/v1/media-wall/${id}`, data, requestId);
  }

  async deleteMediaWall(id: string, requestId?: string): Promise<ContentResponse> {
    return this.makeRequest('DELETE', `/api/v1/media-wall/${id}`, undefined, requestId);
  }

  // ── Finance Content ───────────────────────────────────────────────────────

  async getFinanceContent(requestId?: string): Promise<ContentResponse> {
    return this.makeRequest('GET', '/api/v1/finance', undefined, requestId);
  }

  async createFinanceContent(data: CreateFinanceContentRequest, requestId?: string): Promise<ContentResponse> {
    return this.makeRequest('POST', '/api/v1/finance', data, requestId);
  }

  async updateFinanceContent(id: string, data: UpdateFinanceContentRequest, requestId?: string): Promise<ContentResponse> {
    return this.makeRequest('PATCH', `/api/v1/finance/${id}`, data, requestId);
  }

  async deleteFinanceContent(id: string, requestId?: string): Promise<ContentResponse> {
    return this.makeRequest('DELETE', `/api/v1/finance/${id}`, undefined, requestId);
  }

  // ── Home Sliders ──────────────────────────────────────────────────────────

  async getHomeSliders(requestId?: string): Promise<ContentResponse> {
    return this.makeRequest('GET', '/api/v1/home-sliders', undefined, requestId);
  }

  async createHomeSlider(data: CreateHomeSliderRequest, requestId?: string): Promise<ContentResponse> {
    return this.makeRequest('POST', '/api/v1/home-sliders', data, requestId);
  }

  async updateHomeSlider(id: string, data: UpdateHomeSliderRequest, requestId?: string): Promise<ContentResponse> {
    return this.makeRequest('PATCH', `/api/v1/home-sliders/${id}`, data, requestId);
  }

  async deleteHomeSlider(id: string, requestId?: string): Promise<ContentResponse> {
    return this.makeRequest('DELETE', `/api/v1/home-sliders/${id}`, undefined, requestId);
  }

  // ── Dynamic Pages ─────────────────────────────────────────────────────────

  async getDynamicPageByType(type: string, requestId?: string): Promise<ContentResponse> {
    return this.makeRequest('GET', `/api/v1/pages/${type}`, undefined, requestId);
  }

  async createDynamicPage(data: CreateDynamicPageRequest, requestId?: string): Promise<ContentResponse> {
    return this.makeRequest('POST', '/api/v1/pages', data, requestId);
  }

  async updateDynamicPage(id: string, data: UpdateDynamicPageRequest, requestId?: string): Promise<ContentResponse> {
    return this.makeRequest('PATCH', `/api/v1/pages/${id}`, data, requestId);
  }

  async deleteDynamicPage(id: string, requestId?: string): Promise<ContentResponse> {
    return this.makeRequest('DELETE', `/api/v1/pages/${id}`, undefined, requestId);
  }

  // ── FAQs ──────────────────────────────────────────────────────────────────

  async getFAQs(category?: string, requestId?: string): Promise<ContentResponse> {
    const url = category ? `/api/v1/faqs?category=${category}` : '/api/v1/faqs';
    return this.makeRequest('GET', url, undefined, requestId);
  }

  async createFAQ(data: CreateFAQRequest, requestId?: string): Promise<ContentResponse> {
    return this.makeRequest('POST', '/api/v1/faqs', data, requestId);
  }

  async updateFAQ(id: string, data: UpdateFAQRequest, requestId?: string): Promise<ContentResponse> {
    return this.makeRequest('PATCH', `/api/v1/faqs/${id}`, data, requestId);
  }

  async deleteFAQ(id: string, requestId?: string): Promise<ContentResponse> {
    return this.makeRequest('DELETE', `/api/v1/faqs/${id}`, undefined, requestId);
  }

  // ── Newsletter ────────────────────────────────────────────────────────────

  async subscribeNewsletter(data: NewsletterSubscribeRequest, requestId?: string): Promise<ContentResponse> {
    return this.makeRequest('POST', '/api/v1/newsletter', data, requestId);
  }

  async getNewsletterSubscribers(page?: number, limit?: number, requestId?: string): Promise<ContentResponse> {
    const q = new URLSearchParams();
    if (page) q.append('page', page.toString());
    if (limit) q.append('limit', limit.toString());
    return this.makeRequest('GET', `/api/v1/newsletter/subscribers?${q.toString()}`, undefined, requestId);
  }

  async unsubscribeNewsletter(email: string, requestId?: string): Promise<ContentResponse> {
    return this.makeRequest('POST', '/api/v1/newsletter/unsubscribe', { email }, requestId);
  }

  // ── Accreditations ────────────────────────────────────────────────────────

  async getAccreditations(requestId?: string): Promise<ContentResponse> {
    return this.makeRequest('GET', '/api/v1/accreditations', undefined, requestId);
  }

  async createAccreditation(data: CreateAccreditationRequest, requestId?: string): Promise<ContentResponse> {
    return this.makeRequest('POST', '/api/v1/accreditations', data, requestId);
  }

  async updateAccreditation(id: string, data: UpdateAccreditationRequest, requestId?: string): Promise<ContentResponse> {
    return this.makeRequest('PATCH', `/api/v1/accreditations/${id}`, data, requestId);
  }

  async deleteAccreditation(id: string, requestId?: string): Promise<ContentResponse> {
    return this.makeRequest('DELETE', `/api/v1/accreditations/${id}`, undefined, requestId);
  }

  // ── Logos ─────────────────────────────────────────────────────────────────

  async getLogos(requestId?: string): Promise<ContentResponse> {
    return this.makeRequest('GET', '/api/v1/logos', undefined, requestId);
  }

  async createLogo(data: CreateLogoRequest, requestId?: string): Promise<ContentResponse> {
    return this.makeRequest('POST', '/api/v1/logos', data, requestId);
  }

  async deleteLogo(id: string, requestId?: string): Promise<ContentResponse> {
    return this.makeRequest('DELETE', `/api/v1/logos/${id}`, undefined, requestId);
  }

  // ── Reviews ───────────────────────────────────────────────────────────────

  async getReviews(page?: number, limit?: number, requestId?: string): Promise<ContentResponse> {
    const q = new URLSearchParams();
    if (page) q.append('page', page.toString());
    if (limit) q.append('limit', limit.toString());
    return this.makeRequest('GET', `/api/v1/reviews?${q.toString()}`, undefined, requestId);
  }

  async getReviewById(id: string, requestId?: string): Promise<ContentResponse> {
    return this.makeRequest('GET', `/api/v1/reviews/${id}`, undefined, requestId);
  }

  async createReview(data: CreateReviewRequest, requestId?: string): Promise<ContentResponse> {
    return this.makeRequest('POST', '/api/v1/reviews', data, requestId);
  }

  async updateReview(id: string, data: UpdateReviewRequest, requestId?: string): Promise<ContentResponse> {
    return this.makeRequest('PATCH', `/api/v1/reviews/${id}`, data, requestId);
  }

  async deleteReview(id: string, requestId?: string): Promise<ContentResponse> {
    return this.makeRequest('DELETE', `/api/v1/reviews/${id}`, undefined, requestId);
  }

  async approveReview(id: string, requestId?: string): Promise<ContentResponse> {
    return this.makeRequest('POST', `/api/v1/reviews/${id}/approve`, undefined, requestId);
  }

  // ── Our Process ───────────────────────────────────────────────────────────

  async getOurProcess(requestId?: string): Promise<ContentResponse> {
    return this.makeRequest('GET', '/api/v1/our-process', undefined, requestId);
  }

  async createOurProcessStep(data: CreateOurProcessRequest, requestId?: string): Promise<ContentResponse> {
    return this.makeRequest('POST', '/api/v1/our-process', data, requestId);
  }

  async updateOurProcessStep(id: string, data: UpdateOurProcessRequest, requestId?: string): Promise<ContentResponse> {
    return this.makeRequest('PATCH', `/api/v1/our-process/${id}`, data, requestId);
  }

  async deleteOurProcessStep(id: string, requestId?: string): Promise<ContentResponse> {
    return this.makeRequest('DELETE', `/api/v1/our-process/${id}`, undefined, requestId);
  }

  // ── Projects ──────────────────────────────────────────────────────────────

  async getProjects(category?: string, page?: number, limit?: number, requestId?: string): Promise<ContentResponse> {
    const q = new URLSearchParams();
    if (category) q.append('category', category);
    if (page) q.append('page', page.toString());
    if (limit) q.append('limit', limit.toString());
    return this.makeRequest('GET', `/api/v1/projects?${q.toString()}`, undefined, requestId);
  }

  async getProjectById(id: string, requestId?: string): Promise<ContentResponse> {
    return this.makeRequest('GET', `/api/v1/projects/${id}`, undefined, requestId);
  }

  async createProject(data: CreateProjectRequest, requestId?: string): Promise<ContentResponse> {
    return this.makeRequest('POST', '/api/v1/projects', data, requestId);
  }

  async updateProject(id: string, data: UpdateProjectRequest, requestId?: string): Promise<ContentResponse> {
    return this.makeRequest('PATCH', `/api/v1/projects/${id}`, data, requestId);
  }

  async deleteProject(id: string, requestId?: string): Promise<ContentResponse> {
    return this.makeRequest('DELETE', `/api/v1/projects/${id}`, undefined, requestId);
  }

  async getFeaturedProjects(requestId?: string): Promise<ContentResponse> {
    return this.makeRequest('GET', '/api/v1/projects/featured', undefined, requestId);
  }

  // ── Health ────────────────────────────────────────────────────────────────

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch (error) {
      logger.error('Content service health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }
}

export const contentClient = new ContentClient();