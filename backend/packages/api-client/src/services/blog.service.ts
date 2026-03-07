import { HttpClient } from '../utils/http';
import {
  PaginatedResponse,
} from '../types/api.types';

// ── Local type definitions (add to api.types.ts and re-export from there if preferred) ──

export interface Blog {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED';
  authorId: string;
  categoryId?: string;
  tagIds?: string[];
  featuredImage?: string;
  readTime?: number;
  views?: number;
  reads?: number;
  commentsCount?: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt?: string;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    canonicalUrl?: string;
    metaRobots?: string;
  };
}

export interface CreateBlogRequest {
  title: string;
  slug?: string;
  content: string;
  excerpt?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED';
  authorId: string;
  categoryId?: string;
  tagIds?: string[];
  featuredImage?: string;
  publishedAt?: string;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    canonicalUrl?: string;
    metaRobots?: string;
  };
}

export interface UpdateBlogRequest {
  title?: string;
  slug?: string;
  content?: string;
  excerpt?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED';
  authorId?: string;
  categoryId?: string;
  tagIds?: string[];
  featuredImage?: string;
  publishedAt?: string;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    canonicalUrl?: string;
    metaRobots?: string;
  };
}

export interface BlogFilters {
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED';
  categoryId?: string;
  authorId?: string;
  tagId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

// ── Shared sub-types ──

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  blogCount: number;
  isActive: boolean;
  createdAt: string;
}

interface BlogTag {
  id: string;
  name: string;
  slug: string;
  blogCount: number;
  isActive: boolean;
  createdAt: string;
}

interface BlogAuthor {
  id: string;
  userId: string;
  name: string;
  email: string;
  bio?: string;
  avatar?: string;
  blogCount: number;
  isActive: boolean;
  socialLinks: {
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
  createdAt: string;
}

interface BlogComment {
  id: string;
  blogId: string;
  parentId?: string;
  authorName: string;
  authorEmail: string;
  content: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SPAM';
  createdAt: string;
  updatedAt?: string;
  replies?: Array<{
    id: string;
    authorName: string;
    content: string;
    createdAt: string;
  }>;
}

interface SeoRecommendation {
  type: 'ERROR' | 'WARNING' | 'INFO';
  message: string;
  suggestion: string;
}

// ── Service ──

export class BlogService {
  constructor(private HttpClient: HttpClient) {}

  // ── Blog Management ──────────────────────────────────────────────────────────

  async getBlogs(params?: BlogFilters & {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<Blog[]>> {
    return this.HttpClient.get<PaginatedResponse<Blog[]>>('/blogs', { params });
  }

  async getBlog(blogId: string): Promise<Blog> {
    return this.HttpClient.get<Blog>(`/blogs/${blogId}`);
  }

  async getBlogBySlug(slug: string): Promise<Blog> {
    return this.HttpClient.get<Blog>(`/blogs/slug/${slug}`);
  }

  async createBlog(blogData: CreateBlogRequest): Promise<Blog> {
    return this.HttpClient.post<Blog>('/blogs', blogData);
  }

  async updateBlog(blogId: string, updateData: UpdateBlogRequest): Promise<Blog> {
    return this.HttpClient.put<Blog>(`/blogs/${blogId}`, updateData);
  }

  async deleteBlog(blogId: string): Promise<void> {
    return this.HttpClient.delete<void>(`/blogs/${blogId}`);
  }

  // ── Blog Categories ──────────────────────────────────────────────────────────

  async getBlogCategories(): Promise<BlogCategory[]> {
    return this.HttpClient.get<BlogCategory[]>('/blogs/categories');
  }

  async getBlogCategory(categoryId: string): Promise<BlogCategory> {
    return this.HttpClient.get<BlogCategory>(`/blogs/categories/${categoryId}`);
  }

  async createBlogCategory(categoryData: {
    name: string;
    slug: string;
    description?: string;
    isActive?: boolean;
  }): Promise<BlogCategory> {
    return this.HttpClient.post<BlogCategory>('/blogs/categories', categoryData);
  }

  async updateBlogCategory(categoryId: string, updateData: {
    name?: string;
    slug?: string;
    description?: string;
    isActive?: boolean;
  }): Promise<BlogCategory> {
    return this.HttpClient.put<BlogCategory>(`/blogs/categories/${categoryId}`, updateData);
  }

  async deleteBlogCategory(categoryId: string): Promise<void> {
    return this.HttpClient.delete<void>(`/blogs/categories/${categoryId}`);
  }

  async getBlogsByCategory(categoryId: string, params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<Blog[]>> {
    return this.HttpClient.get<PaginatedResponse<Blog[]>>(`/blogs/categories/${categoryId}`, { params });
  }

  // ── Blog Tags ────────────────────────────────────────────────────────────────

  async getBlogTags(): Promise<BlogTag[]> {
    return this.HttpClient.get<BlogTag[]>('/blogs/tags');
  }

  async createBlogTag(tagData: {
    name: string;
    slug: string;
    isActive?: boolean;
  }): Promise<BlogTag> {
    return this.HttpClient.post<BlogTag>('/blogs/tags', tagData);
  }

  async updateBlogTag(tagId: string, updateData: {
    name?: string;
    slug?: string;
    isActive?: boolean;
  }): Promise<BlogTag> {
    return this.HttpClient.put<BlogTag>(`/blogs/tags/${tagId}`, updateData);
  }

  async deleteBlogTag(tagId: string): Promise<void> {
    return this.HttpClient.delete<void>(`/blogs/tags/${tagId}`);
  }

  async getBlogsByTag(tagId: string, params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<Blog[]>> {
    return this.HttpClient.get<PaginatedResponse<Blog[]>>(`/blogs/tags/${tagId}`, { params });
  }

  // ── Blog Authors ─────────────────────────────────────────────────────────────

  async getBlogAuthors(): Promise<BlogAuthor[]> {
    return this.HttpClient.get<BlogAuthor[]>('/blogs/authors');
  }

  async getBlogAuthor(authorId: string): Promise<BlogAuthor> {
    return this.HttpClient.get<BlogAuthor>(`/blogs/authors/${authorId}`);
  }

  async getBlogsByAuthor(authorId: string, params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<Blog[]>> {
    return this.HttpClient.get<PaginatedResponse<Blog[]>>(`/blogs/authors/${authorId}`, { params });
  }

  // ── Blog Comments ────────────────────────────────────────────────────────────

  async getBlogComments(blogId: string, params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<BlogComment[]>> {
    return this.HttpClient.get<PaginatedResponse<BlogComment[]>>(`/blogs/${blogId}/comments`, { params });
  }

  async addBlogComment(blogId: string, commentData: {
    parentId?: string;
    authorName: string;
    authorEmail: string;
    content: string;
    website?: string;
  }): Promise<BlogComment> {
    return this.HttpClient.post<BlogComment>(`/blogs/${blogId}/comments`, commentData);
  }

  async updateBlogComment(blogId: string, commentId: string, updateData: {
    content: string;
  }): Promise<BlogComment> {
    return this.HttpClient.put<BlogComment>(`/blogs/${blogId}/comments/${commentId}`, updateData);
  }

  async deleteBlogComment(blogId: string, commentId: string): Promise<void> {
    return this.HttpClient.delete<void>(`/blogs/${blogId}/comments/${commentId}`);
  }

  async approveBlogComment(blogId: string, commentId: string): Promise<BlogComment> {
    return this.HttpClient.post<BlogComment>(`/blogs/${blogId}/comments/${commentId}/approve`);
  }

  async rejectBlogComment(blogId: string, commentId: string, reason?: string): Promise<BlogComment> {
    return this.HttpClient.post<BlogComment>(`/blogs/${blogId}/comments/${commentId}/reject`, { reason });
  }

  // ── Blog Analytics ───────────────────────────────────────────────────────────

  /**
   * Get aggregated analytics across all blogs (no blogId) or for a specific blog (with blogId).
   * Previously this was two duplicate method signatures — merged into one overloaded method.
   */
  async getBlogAnalytics(params?: {
    startDate?: string;
    endDate?: string;
    categoryId?: string;
    authorId?: string;
  }): Promise<{
    overview: {
      totalBlogs: number;
      publishedBlogs: number;
      draftBlogs: number;
      totalViews: number;
      totalReads: number;
      totalComments: number;
      averageReadTime: number;
    };
    popularBlogs: Array<{
      id: string;
      title: string;
      slug: string;
      views: number;
      reads: number;
      comments: number;
      readTime: number;
      publishedAt: string;
    }>;
    categoryStats: Array<{
      categoryId: string;
      categoryName: string;
      blogCount: number;
      totalViews: number;
      totalReads: number;
      averageReadTime: number;
    }>;
    authorStats: Array<{
      authorId: string;
      authorName: string;
      blogCount: number;
      totalViews: number;
      totalReads: number;
      averageReadTime: number;
    }>;
    engagementMetrics: {
      views: Array<{ date: string; count: number }>;
      reads: Array<{ date: string; count: number }>;
      comments: Array<{ date: string; count: number }>;
      shares: Array<{ date: string; count: number }>;
    };
    searchTerms: Array<{ term: string; count: number }>;
  }> {
    return this.HttpClient.get<any>('/blogs/analytics', { params });
  }

  async getBlogAnalyticsById(blogId: string, params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{
    blogId: string;
    title: string;
    views: number;
    reads: number;
    comments: number;
    shares: number;
    averageReadTime: number;
    bounceRate: number;
    engagementRate: number;
    dailyStats: Array<{
      date: string;
      views: number;
      reads: number;
      comments: number;
      shares: number;
    }>;
    referrers: Array<{ source: string; count: number; percentage: number }>;
    searchTerms: Array<{ term: string; count: number }>;
    readerDemographics: {
      countries: Array<{ country: string; count: number; percentage: number }>;
      devices: Array<{ device: string; count: number; percentage: number }>;
      browsers: Array<{ browser: string; count: number; percentage: number }>;
    };
  }> {
    return this.HttpClient.get<any>(`/blogs/${blogId}/analytics`, { params });
  }

  // ── Blog Search ──────────────────────────────────────────────────────────────

  async searchBlogs(query: string, params?: {
    page?: number;
    limit?: number;
    categoryId?: string;
    authorId?: string;
    tagId?: string;
  }): Promise<PaginatedResponse<Blog[]>> {
    return this.HttpClient.get<PaginatedResponse<Blog[]>>('/blogs/search', {
      params: { q: query, ...params },
    });
  }

  // ── Blog Scheduling ──────────────────────────────────────────────────────────

  async scheduleBlog(blogId: string, schedulingData: {
    publishAt: string;
    notifySubscribers?: boolean;
    socialMedia?: {
      twitter?: boolean;
      facebook?: boolean;
      linkedin?: boolean;
      instagram?: boolean;
    };
  }): Promise<{
    blogId: string;
    scheduledAt: string;
    status: 'SCHEDULED';
    notifications: { email: boolean; socialMedia: string[] };
  }> {
    return this.HttpClient.post<any>(`/blogs/${blogId}/schedule`, schedulingData);
  }

  async getScheduledBlogs(params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResponse<Array<{
    id: string;
    title: string;
    slug: string;
    scheduledAt: string;
    status: 'SCHEDULED';
    author: { id: string; name: string };
    notifications: { email: boolean; socialMedia: string[] };
  }>>> {
    return this.HttpClient.get<PaginatedResponse<any[]>>('/blogs/scheduled', { params });
  }

  async cancelScheduledBlog(blogId: string): Promise<Blog> {
    return this.HttpClient.post<Blog>(`/blogs/${blogId}/cancel-schedule`);
  }

  // ── Blog SEO ─────────────────────────────────────────────────────────────────

  async getBlogSeo(blogId: string): Promise<{
    blogId: string;
    title: string;
    description: string;
    keywords: string[];
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    canonicalUrl?: string;
    metaRobots: string;
    structuredData: any;
    readabilityScore: number;
    seoScore: number;
    recommendations: SeoRecommendation[];
  }> {
    return this.HttpClient.get<any>(`/blogs/${blogId}/seo`);
  }

  async updateBlogSeo(blogId: string, seoData: {
    title?: string;
    description?: string;
    keywords?: string[];
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    canonicalUrl?: string;
    metaRobots?: string;
  }): Promise<any> {
    return this.HttpClient.put<any>(`/blogs/${blogId}/seo`, seoData);
  }

  async analyzeBlogSeo(blogId: string): Promise<{
    blogId: string;
    score: number;
    issues: SeoRecommendation[];
    recommendations: string[];
    competitorAnalysis?: any;
  }> {
    return this.HttpClient.post<any>(`/blogs/${blogId}/seo/analyze`);
  }

  // ── Blog Import / Export ─────────────────────────────────────────────────────

  async exportBlogs(params?: {
    format?: 'csv' | 'excel' | 'json' | 'xml';
    categoryId?: string;
    authorId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    includeContent?: boolean;
    includeAnalytics?: boolean;
  }): Promise<Blob> {
    return this.HttpClient.get<Blob>('/blogs/export', {
      params,
      responseType: 'blob',
    });
  }

  async importBlogs(file: File, options?: {
    overwrite?: boolean;
    createMissing?: boolean;
    validateAuthors?: boolean;
    validateCategories?: boolean;
    publishImmediately?: boolean;
  }): Promise<{
    imported: number;
    updated: number;
    skipped: number;
    errors: Array<{ row: number; error: string; data: any }>;
  }> {
    const formData = new FormData();
    formData.append('file', file);

    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        formData.append(key, value.toString());
      });
    }

    // Content-Type is set automatically by the browser when passing FormData
    return this.HttpClient.post<any>('/blogs/import', formData);
  }

  // ── Blog Settings ────────────────────────────────────────────────────────────

  async getBlogSettings(): Promise<{
    general: {
      defaultAuthor?: string;
      defaultCategory?: string;
      allowComments: boolean;
      moderateComments: boolean;
      requireApproval: boolean;
      enableRss: boolean;
    };
    seo: {
      defaultMetaDescription: string;
      defaultMetaKeywords: string[];
      autoGenerateSlugs: boolean;
      enableStructuredData: boolean;
    };
    notifications: {
      newCommentNotification: boolean;
      newBlogNotification: boolean;
      subscriberNotification: boolean;
    };
    social: {
      enableSharing: boolean;
      defaultShareImage?: string;
      socialAccounts: {
        twitter?: string;
        facebook?: string;
        linkedin?: string;
        instagram?: string;
      };
    };
  }> {
    return this.HttpClient.get<any>('/blogs/settings');
  }

  async updateBlogSettings(settings: {
    general?: {
      defaultAuthor?: string;
      defaultCategory?: string;
      allowComments?: boolean;
      moderateComments?: boolean;
      requireApproval?: boolean;
      enableRss?: boolean;
    };
    seo?: {
      defaultMetaDescription?: string;
      defaultMetaKeywords?: string[];
      autoGenerateSlugs?: boolean;
      enableStructuredData?: boolean;
    };
    notifications?: {
      newCommentNotification?: boolean;
      newBlogNotification?: boolean;
      subscriberNotification?: boolean;
    };
    social?: {
      enableSharing?: boolean;
      defaultShareImage?: string;
      socialAccounts?: {
        twitter?: string;
        facebook?: string;
        linkedin?: string;
        instagram?: string;
      };
    };
  }): Promise<any> {
    return this.HttpClient.put<any>('/blogs/settings', settings);
  }

  // ── Blog Subscriptions ───────────────────────────────────────────────────────

  async getBlogSubscriptions(params?: {
    page?: number;
    limit?: number;
    status?: 'ACTIVE' | 'INACTIVE' | 'UNSUBSCRIBED';
  }): Promise<PaginatedResponse<Array<{
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    status: 'ACTIVE' | 'INACTIVE' | 'UNSUBSCRIBED';
    subscribedAt: string;
    unsubscribedAt?: string;
    preferences: {
      newPosts: boolean;
      weeklyDigest: boolean;
      categories: string[];
    };
  }>>> {
    return this.HttpClient.get<PaginatedResponse<any[]>>('/blogs/subscriptions', { params });
  }

  async subscribeToBlog(subscriptionData: {
    email: string;
    firstName?: string;
    lastName?: string;
    preferences?: {
      newPosts?: boolean;
      weeklyDigest?: boolean;
      categories?: string[];
    };
  }): Promise<any> {
    return this.HttpClient.post<any>('/blogs/subscribe', subscriptionData);
  }

  async unsubscribeFromBlog(email: string, reason?: string): Promise<void> {
    return this.HttpClient.post<void>('/blogs/unsubscribe', { email, reason });
  }

  async sendBlogNewsletter(newsletterData: {
    subject: string;
    content: string;
    blogIds?: string[];
    categories?: string[];
    sendTo?: 'ALL' | 'SUBSCRIBERS' | 'CUSTOM';
    customEmails?: string[];
    scheduledAt?: string;
  }): Promise<{
    newsletterId: string;
    status: 'PENDING' | 'SENDING' | 'SENT' | 'FAILED';
    recipientCount: number;
    scheduledAt?: string;
  }> {
    return this.HttpClient.post<any>('/blogs/newsletter', newsletterData);
  }
}