import { HttpClient } from '../utils/http';
import { PaginatedResponse } from '../types/api.types';

// ── Missing types (move to api.types.ts and re-export from there if preferred) ──

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
  publishedAt?: string;
  createdAt: string;
  updatedAt?: string;
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
}

export interface UpdateBlogRequest {
  title?: string;
  slug?: string;
  content?: string;
  excerpt?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED';
  categoryId?: string;
  tagIds?: string[];
  featuredImage?: string;
  publishedAt?: string;
}

export interface BlogFilters {
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED';
  categoryId?: string;
  authorId?: string;
  tagId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface MediaItem {
  id: string;
  url: string;
  type: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'AUDIO';
  filename: string;
  size: number;
  mimeType: string;
  alt?: string;
  caption?: string;
  tags?: string[];
  category?: string;
  dimensions?: { width: number; height: number };
  createdAt: string;
  updatedAt?: string;
}

export interface CreateMediaItemRequest {
  url: string;
  type: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'AUDIO';
  filename: string;
  size: number;
  mimeType: string;
  alt?: string;
  caption?: string;
  tags?: string[];
  category?: string;
}

export interface UpdateMediaItemRequest {
  alt?: string;
  caption?: string;
  tags?: string[];
  category?: string;
}

export interface MediaFilters {
  type?: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'AUDIO';
  category?: string;
  tags?: string[];
  search?: string;
}

export interface CmsPage {
  id: string;
  title: string;
  slug: string;
  content: any;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  templateId?: string;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  publishedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateCmsPageRequest {
  title: string;
  slug?: string;
  content?: any;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  templateId?: string;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
}

export interface UpdateCmsPageRequest {
  title?: string;
  slug?: string;
  content?: any;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
}

export interface CmsPageFilters {
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  search?: string;
  templateId?: string;
}

export interface Showroom {
  id: string;
  title: string;
  slug: string;
  description?: string;
  content: any;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  location?: string;
  featuredImage?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateShowroomRequest {
  title: string;
  slug?: string;
  description?: string;
  content?: any;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  location?: string;
  featuredImage?: string;
}

export interface UpdateShowroomRequest {
  title?: string;
  slug?: string;
  description?: string;
  content?: any;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  location?: string;
  featuredImage?: string;
}

export interface ShowroomFilters {
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  location?: string;
  search?: string;
}

export interface LandingPage {
  id: string;
  title: string;
  slug: string;
  content: any;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  campaign?: string;
  featuredImage?: string;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  publishedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateLandingPageRequest {
  title: string;
  slug?: string;
  content?: any;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  campaign?: string;
  featuredImage?: string;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
}

export interface UpdateLandingPageRequest {
  title?: string;
  slug?: string;
  content?: any;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  campaign?: string;
  featuredImage?: string;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
}

export interface LandingPageFilters {
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  campaign?: string;
  search?: string;
}

// ── Service ───────────────────────────────────────────────────────────────────

export class ContentService {
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

  async publishBlog(blogId: string): Promise<Blog> {
    return this.HttpClient.post<Blog>(`/blogs/${blogId}/publish`);
  }

  async unpublishBlog(blogId: string): Promise<Blog> {
    return this.HttpClient.post<Blog>(`/blogs/${blogId}/unpublish`);
  }

  async duplicateBlog(blogId: string): Promise<Blog> {
    return this.HttpClient.post<Blog>(`/blogs/${blogId}/duplicate`);
  }

  // ── Blog Categories ──────────────────────────────────────────────────────────

  async getBlogCategories(): Promise<Array<{
    id: string;
    name: string;
    slug: string;
    description?: string;
    blogCount: number;
  }>> {
    return this.HttpClient.get<any[]>('/blogs/categories');
  }

  async createBlogCategory(categoryData: {
    name: string;
    slug: string;
    description?: string;
  }): Promise<any> {
    return this.HttpClient.post<any>('/blogs/categories', categoryData);
  }

  async updateBlogCategory(categoryId: string, updateData: {
    name?: string;
    slug?: string;
    description?: string;
  }): Promise<any> {
    return this.HttpClient.put<any>(`/blogs/categories/${categoryId}`, updateData);
  }

  async deleteBlogCategory(categoryId: string): Promise<void> {
    return this.HttpClient.delete<void>(`/blogs/categories/${categoryId}`);
  }

  // ── Blog Tags ────────────────────────────────────────────────────────────────

  async getBlogTags(): Promise<Array<{
    id: string;
    name: string;
    slug: string;
    blogCount: number;
  }>> {
    return this.HttpClient.get<any[]>('/blogs/tags');
  }

  async createBlogTag(tagData: {
    name: string;
    slug: string;
  }): Promise<any> {
    return this.HttpClient.post<any>('/blogs/tags', tagData);
  }

  async updateBlogTag(tagId: string, updateData: {
    name?: string;
    slug?: string;
  }): Promise<any> {
    return this.HttpClient.put<any>(`/blogs/tags/${tagId}`, updateData);
  }

  async deleteBlogTag(tagId: string): Promise<void> {
    return this.HttpClient.delete<void>(`/blogs/tags/${tagId}`);
  }

  // ── Blog Comments ────────────────────────────────────────────────────────────

  async getBlogComments(blogId: string, params?: {
    page?: number;
    limit?: number;
    status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  }): Promise<PaginatedResponse<Array<{
    id: string;
    content: string;
    author: string;
    email?: string;
    createdAt: string;
    status: string;
  }>>> {
    return this.HttpClient.get<PaginatedResponse<any[]>>(`/blogs/${blogId}/comments`, { params });
  }

  async addBlogComment(blogId: string, commentData: {
    content: string;
    author: string;
    email?: string;
  }): Promise<any> {
    return this.HttpClient.post<any>(`/blogs/${blogId}/comments`, commentData);
  }

  async approveBlogComment(blogId: string, commentId: string): Promise<any> {
    return this.HttpClient.post<any>(`/blogs/${blogId}/comments/${commentId}/approve`);
  }

  async rejectBlogComment(blogId: string, commentId: string): Promise<any> {
    return this.HttpClient.post<any>(`/blogs/${blogId}/comments/${commentId}/reject`);
  }

  async deleteBlogComment(blogId: string, commentId: string): Promise<void> {
    return this.HttpClient.delete<void>(`/blogs/${blogId}/comments/${commentId}`);
  }

  // ── Media Management ─────────────────────────────────────────────────────────

  async getMediaItems(params?: MediaFilters & {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<MediaItem[]>> {
    return this.HttpClient.get<PaginatedResponse<MediaItem[]>>('/media', { params });
  }

  async getMediaItem(mediaId: string): Promise<MediaItem> {
    return this.HttpClient.get<MediaItem>(`/media/${mediaId}`);
  }

  async createMediaItem(mediaData: CreateMediaItemRequest): Promise<MediaItem> {
    return this.HttpClient.post<MediaItem>('/media', mediaData);
  }

  async updateMediaItem(mediaId: string, updateData: UpdateMediaItemRequest): Promise<MediaItem> {
    return this.HttpClient.put<MediaItem>(`/media/${mediaId}`, updateData);
  }

  async deleteMediaItem(mediaId: string): Promise<void> {
    return this.HttpClient.delete<void>(`/media/${mediaId}`);
  }

  async uploadMedia(file: File, metadata?: {
    alt?: string;
    caption?: string;
    tags?: string[];
    category?: string;
  }): Promise<MediaItem> {
    const formData = new FormData();
    formData.append('file', file);

    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(v => formData.append(key, v));
        } else {
          formData.append(key, value);
        }
      });
    }

    // Content-Type set automatically when passing FormData
    return this.HttpClient.post<MediaItem>('/media/upload', formData);
  }

  async getMediaCategories(): Promise<Array<{
    id: string;
    name: string;
    mediaCount: number;
  }>> {
    return this.HttpClient.get<any[]>('/media/categories');
  }

  // ── CMS Pages ────────────────────────────────────────────────────────────────

  async getCmsPages(params?: CmsPageFilters & {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<CmsPage[]>> {
    return this.HttpClient.get<PaginatedResponse<CmsPage[]>>('/pages', { params });
  }

  async getCmsPage(pageId: string): Promise<CmsPage> {
    return this.HttpClient.get<CmsPage>(`/pages/${pageId}`);
  }

  async getCmsPageBySlug(slug: string): Promise<CmsPage> {
    return this.HttpClient.get<CmsPage>(`/pages/slug/${slug}`);
  }

  async createCmsPage(pageData: CreateCmsPageRequest): Promise<CmsPage> {
    return this.HttpClient.post<CmsPage>('/pages', pageData);
  }

  async updateCmsPage(pageId: string, updateData: UpdateCmsPageRequest): Promise<CmsPage> {
    return this.HttpClient.put<CmsPage>(`/pages/${pageId}`, updateData);
  }

  async deleteCmsPage(pageId: string): Promise<void> {
    return this.HttpClient.delete<void>(`/pages/${pageId}`);
  }

  async publishCmsPage(pageId: string): Promise<CmsPage> {
    return this.HttpClient.post<CmsPage>(`/pages/${pageId}/publish`);
  }

  async unpublishCmsPage(pageId: string): Promise<CmsPage> {
    return this.HttpClient.post<CmsPage>(`/pages/${pageId}/unpublish`);
  }

  async duplicateCmsPage(pageId: string): Promise<CmsPage> {
    return this.HttpClient.post<CmsPage>(`/pages/${pageId}/duplicate`);
  }

  // ── Page Templates ───────────────────────────────────────────────────────────

  async getCmsPageTemplates(): Promise<Array<{
    id: string;
    name: string;
    description: string;
    thumbnail?: string;
    structure: any;
  }>> {
    return this.HttpClient.get<any[]>('/pages/templates');
  }

  async createCmsPageFromTemplate(templateId: string, pageData: {
    title: string;
    slug: string;
    content?: any;
  }): Promise<CmsPage> {
    return this.HttpClient.post<CmsPage>(`/pages/templates/${templateId}`, pageData);
  }

  // ── Showroom Management ──────────────────────────────────────────────────────

  async getShowrooms(params?: ShowroomFilters & {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<Showroom[]>> {
    return this.HttpClient.get<PaginatedResponse<Showroom[]>>('/showrooms', { params });
  }

  async getShowroom(showroomId: string): Promise<Showroom> {
    return this.HttpClient.get<Showroom>(`/showrooms/${showroomId}`);
  }

  async getShowroomBySlug(slug: string): Promise<Showroom> {
    return this.HttpClient.get<Showroom>(`/showrooms/slug/${slug}`);
  }

  async createShowroom(showroomData: CreateShowroomRequest): Promise<Showroom> {
    return this.HttpClient.post<Showroom>('/showrooms', showroomData);
  }

  async updateShowroom(showroomId: string, updateData: UpdateShowroomRequest): Promise<Showroom> {
    return this.HttpClient.put<Showroom>(`/showrooms/${showroomId}`, updateData);
  }

  async deleteShowroom(showroomId: string): Promise<void> {
    return this.HttpClient.delete<void>(`/showrooms/${showroomId}`);
  }

  async publishShowroom(showroomId: string): Promise<Showroom> {
    return this.HttpClient.post<Showroom>(`/showrooms/${showroomId}/publish`);
  }

  async unpublishShowroom(showroomId: string): Promise<Showroom> {
    return this.HttpClient.post<Showroom>(`/showrooms/${showroomId}/unpublish`);
  }

  async duplicateShowroom(showroomId: string): Promise<Showroom> {
    return this.HttpClient.post<Showroom>(`/showrooms/${showroomId}/duplicate`);
  }

  // ── Landing Pages ────────────────────────────────────────────────────────────

  async getLandingPages(params?: LandingPageFilters & {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<LandingPage[]>> {
    return this.HttpClient.get<PaginatedResponse<LandingPage[]>>('/landing-pages', { params });
  }

  async getLandingPage(pageId: string): Promise<LandingPage> {
    return this.HttpClient.get<LandingPage>(`/landing-pages/${pageId}`);
  }

  async getLandingPageBySlug(slug: string): Promise<LandingPage> {
    return this.HttpClient.get<LandingPage>(`/landing-pages/slug/${slug}`);
  }

  async createLandingPage(pageData: CreateLandingPageRequest): Promise<LandingPage> {
    return this.HttpClient.post<LandingPage>('/landing-pages', pageData);
  }

  async updateLandingPage(pageId: string, updateData: UpdateLandingPageRequest): Promise<LandingPage> {
    return this.HttpClient.put<LandingPage>(`/landing-pages/${pageId}`, updateData);
  }

  async deleteLandingPage(pageId: string): Promise<void> {
    return this.HttpClient.delete<void>(`/landing-pages/${pageId}`);
  }

  async publishLandingPage(pageId: string): Promise<LandingPage> {
    return this.HttpClient.post<LandingPage>(`/landing-pages/${pageId}/publish`);
  }

  async unpublishLandingPage(pageId: string): Promise<LandingPage> {
    return this.HttpClient.post<LandingPage>(`/landing-pages/${pageId}/unpublish`);
  }

  async duplicateLandingPage(pageId: string): Promise<LandingPage> {
    return this.HttpClient.post<LandingPage>(`/landing-pages/${pageId}/duplicate`);
  }

  // ── Content Analytics ────────────────────────────────────────────────────────

  async getContentAnalytics(params?: {
    startDate?: string;
    endDate?: string;
    type?: 'blog' | 'page' | 'showroom' | 'landing';
  }): Promise<{
    totalViews: number;
    uniqueViews: number;
    averageTimeOnPage: number;
    bounceRate: number;
    topPages: Array<{
      id: string;
      title: string;
      type: string;
      views: number;
      averageTimeOnPage: number;
    }>;
    viewsByDate: Array<{
      date: string;
      views: number;
      uniqueViews: number;
    }>;
  }> {
    return this.HttpClient.get<any>('/content/analytics', { params });
  }

  async getPageAnalytics(pageId: string, params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{
    views: number;
    uniqueViews: number;
    averageTimeOnPage: number;
    bounceRate: number;
    exitRate: number;
    viewsByDate: Array<{
      date: string;
      views: number;
      uniqueViews: number;
    }>;
    trafficSources: Array<{
      source: string;
      views: number;
      percentage: number;
    }>;
    deviceBreakdown: Array<{
      device: string;
      views: number;
      percentage: number;
    }>;
  }> {
    return this.HttpClient.get<any>(`/content/analytics/${pageId}`, { params });
  }

  // ── Content Search ───────────────────────────────────────────────────────────

  async searchContent(query: string, params?: {
    page?: number;
    limit?: number;
    type?: 'blog' | 'page' | 'showroom' | 'landing' | 'media';
    category?: string;
  }): Promise<PaginatedResponse<Array<{
    id: string;
    title: string;
    type: string;
    excerpt?: string;
    url: string;
    relevanceScore: number;
  }>>> {
    return this.HttpClient.get<PaginatedResponse<any[]>>('/content/search', {
      params: { q: query, ...params },
    });
  }

  // ── Content Export ───────────────────────────────────────────────────────────

  async exportContent(params?: {
    type?: 'blog' | 'page' | 'showroom' | 'landing';
    format?: 'csv' | 'excel' | 'json';
    filters?: any;
  }): Promise<Blob> {
    return this.HttpClient.get<Blob>('/content/export', {
      params,
      responseType: 'blob',
    });
  }

  // ── Content Validation ───────────────────────────────────────────────────────

  async validateContent(type: string, content: any): Promise<{
    valid: boolean;
    errors?: string[];
    warnings?: string[];
    seoScore?: number;
    readabilityScore?: number;
  }> {
    return this.HttpClient.post<any>(`/content/validate/${type}`, content);
  }

  // ── SEO Management ───────────────────────────────────────────────────────────

  async generateSeoMetadata(type: string, content: any): Promise<{
    title: string;
    description: string;
    keywords: string[];
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
  }> {
    return this.HttpClient.post<any>(`/content/seo/${type}`, content);
  }

  async analyzeSeo(pageId: string): Promise<{
    score: number;
    issues: Array<{
      type: 'error' | 'warning' | 'info';
      message: string;
      recommendation: string;
    }>;
    recommendations: string[];
    competitorAnalysis?: any;
  }> {
    return this.HttpClient.get<any>(`/content/seo/${pageId}/analyze`);
  }

  // ── Content Scheduling ───────────────────────────────────────────────────────

  async scheduleContent(type: string, contentId: string, scheduleData: {
    publishAt: string;
    unpublishAt?: string;
  }): Promise<any> {
    return this.HttpClient.post<any>(`/content/${type}/${contentId}/schedule`, scheduleData);
  }

  async getScheduledContent(params?: {
    page?: number;
    limit?: number;
    type?: string;
    status?: 'scheduled' | 'published' | 'expired';
  }): Promise<PaginatedResponse<Array<{
    id: string;
    type: string;
    title: string;
    scheduledAt: string;
    status: string;
  }>>> {
    return this.HttpClient.get<PaginatedResponse<any[]>>('/content/scheduled', { params });
  }

  // ── Content Versioning ───────────────────────────────────────────────────────

  async getContentVersions(type: string, contentId: string): Promise<Array<{
    id: string;
    version: number;
    createdAt: string;
    author: string;
    changes: string;
  }>> {
    return this.HttpClient.get<any[]>(`/content/${type}/${contentId}/versions`);
  }

  async createContentVersion(type: string, contentId: string, versionData: {
    changes: string;
    content: any;
  }): Promise<any> {
    return this.HttpClient.post<any>(`/content/${type}/${contentId}/versions`, versionData);
  }

  async restoreContentVersion(type: string, contentId: string, versionId: string): Promise<any> {
    return this.HttpClient.post<any>(`/content/${type}/${contentId}/versions/${versionId}/restore`);
  }
}