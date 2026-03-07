import { HttpClient } from '../utils/http';
import { PaginatedResponse } from '../types/api.types';

interface Seo {
  id: string;
  entityType: string;
  entityId: string;
  title: string;
  metaDescription: string;
  metaKeywords?: string[];
  slug?: string;
  canonicalUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateSeoRequest {
  entityType: string;
  entityId: string;
  title: string;
  metaDescription: string;
  metaKeywords?: string[];
  slug?: string;
  canonicalUrl?: string;
  [key: string]: any;
}

interface UpdateSeoRequest {
  title?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  slug?: string;
  canonicalUrl?: string;
  [key: string]: any;
}

interface SeoFilters {
  entityType?: string;
  entityId?: string;
  status?: string;
}

export class SeoService {
  constructor(private HttpClient: HttpClient) {}

  async getSeoData(params?: SeoFilters & {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<Seo[]>> {
    return this.HttpClient.get<PaginatedResponse<Seo[]>>('/seo', { params });
  }

  async getSeoDataByEntity(entityType: string, entityId: string): Promise<Seo> {
    return this.HttpClient.get<Seo>(`/seo/${entityType}/${entityId}`);
  }

  async createSeoData(seoData: CreateSeoRequest): Promise<Seo> {
    return this.HttpClient.post<Seo>('/seo', seoData);
  }

  async updateSeoData(entityType: string, entityId: string, updateData: UpdateSeoRequest): Promise<Seo> {
    return this.HttpClient.put<Seo>(`/seo/${entityType}/${entityId}`, updateData);
  }

  async deleteSeoData(entityType: string, entityId: string): Promise<void> {
    return this.HttpClient.delete<void>(`/seo/${entityType}/${entityId}`);
  }

  async analyzeSeo(entityType: string, entityId: string): Promise<{
    entityType: string;
    entityId: string;
    score: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    issues: Array<{
      type: 'ERROR' | 'WARNING' | 'INFO';
      category: 'TITLE' | 'META' | 'CONTENT' | 'TECHNICAL' | 'PERFORMANCE';
      message: string;
      suggestion: string;
      impact: 'HIGH' | 'MEDIUM' | 'LOW';
    }>;
    recommendations: Array<{
      priority: 'HIGH' | 'MEDIUM' | 'LOW';
      category: string;
      action: string;
      expectedImpact: string;
    }>;
    metrics: {
      titleLength: number;
      descriptionLength: number;
      keywordDensity: number;
      readabilityScore: number;
      wordCount: number;
      headingStructure: {
        h1: number;
        h2: number;
        h3: number;
      };
      imageOptimization: {
        totalImages: number;
        optimizedImages: number;
        missingAlt: number;
      };
      internalLinks: number;
      externalLinks: number;
    };
    competitorAnalysis?: {
      competitors: Array<{
        url: string;
        title: string;
        description: string;
        score: number;
      }>;
      averageScore: number;
      ranking: number;
    };
  }> {
    return this.HttpClient.post<any>(`/seo/${entityType}/${entityId}/analyze`);
  }

  async getSeoScore(entityType: string, entityId: string): Promise<{
    entityType: string;
    entityId: string;
    overallScore: number;
    categoryScores: {
      title: number;
      meta: number;
      content: number;
      technical: number;
      performance: number;
    };
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    lastAnalyzed: string;
    trend: {
      direction: 'UP' | 'DOWN' | 'STABLE';
      change: number;
      previousScore: number;
    };
  }> {
    return this.HttpClient.get<any>(`/seo/${entityType}/${entityId}/score`);
  }

  async searchKeywords(query: string, params?: {
    limit?: number;
    includeRelated?: boolean;
    includeQuestions?: boolean;
    location?: string;
    language?: string;
  }): Promise<{
    query: string;
    keywords: Array<{
      keyword: string;
      volume: number;
      difficulty: number;
      opportunity: number;
      trend: 'UP' | 'DOWN' | 'STABLE';
      cpc?: number;
      competition: 'LOW' | 'MEDIUM' | 'HIGH';
      intent: 'INFORMATIONAL' | 'COMMERCIAL' | 'TRANSACTIONAL' | 'NAVIGATIONAL';
      relatedKeywords?: string[];
    }>;
    suggestions: Array<{
      keyword: string;
      type: 'RELATED' | 'QUESTION' | 'LONG_TAIL';
      volume: number;
      difficulty: number;
    }>;
    questions: Array<{
      question: string;
      volume: number;
      difficulty: number;
      answer?: string;
    }>;
  }> {
    return this.HttpClient.get<any>('/seo/keywords/search', {
      params: { q: query, ...params },
    });
  }

  async getKeywordSuggestions(entityType: string, entityId: string): Promise<{
    entityType: string;
    entityId: string;
    primaryKeywords: Array<{
      keyword: string;
      relevance: number;
      volume: number;
      difficulty: number;
    }>;
    secondaryKeywords: Array<{
      keyword: string;
      relevance: number;
      volume: number;
      difficulty: number;
    }>;
    longTailKeywords: Array<{
      keyword: string;
      relevance: number;
      volume: number;
      difficulty: number;
    }>;
    questions: Array<{
      question: string;
      relevance: number;
      volume: number;
      difficulty: number;
    }>;
  }> {
    return this.HttpClient.get<any>(`/seo/${entityType}/${entityId}/keywords`);
  }

  async trackKeyword(keyword: string, params?: {
    location?: string;
    language?: string;
    device?: 'DESKTOP' | 'MOBILE' | 'TABLET';
  }): Promise<{
    keyword: string;
    trackingId: string;
    currentRanking: number;
    searchVolume: number;
    difficulty: number;
    url?: string;
    trackedSince: string;
  }> {
    return this.HttpClient.post<any>('/seo/keywords/track', { keyword, ...params });
  }

  async getKeywordRankings(trackingId: string, params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{
    trackingId: string;
    keyword: string;
    currentRanking: number;
    bestRanking: number;
    averageRanking: number;
    rankings: Array<{
      date: string;
      ranking: number;
      url?: string;
    }>;
    competitors: Array<{
      url: string;
      ranking: number;
    }>;
    searchVolume: number;
    difficulty: number;
  }> {
    return this.HttpClient.get<any>(`/seo/keywords/${trackingId}/rankings`, { params });
  }

  async analyzeCompetitors(entityType: string, entityId: string): Promise<{
    entityType: string;
    entityId: string;
    competitors: Array<{
      url: string;
      title: string;
      description: string;
      score: number;
      strengths: string[];
      weaknesses: string[];
      keywords: Array<{
        keyword: string;
        ranking: number;
        volume: number;
      }>;
      referringLinks: number;
      domainAuthority: number;
    }>;
    gaps: Array<{
      keyword: string;
      opportunity: number;
      difficulty: number;
      reason: string;
    }>;
    opportunities: Array<{
      type: 'KEYWORD' | 'CONTENT' | 'TECHNICAL';
      description: string;
      potentialImpact: 'HIGH' | 'MEDIUM' | 'LOW';
      effort: 'HIGH' | 'MEDIUM' | 'LOW';
    }>;
  }> {
    return this.HttpClient.post<any>(`/seo/${entityType}/${entityId}/competitors`);
  }

  async getCompetitorKeywords(competitorUrl: string): Promise<{
    url: string;
    keywords: Array<{
      keyword: string;
      ranking: number;
      volume: number;
      difficulty: number;
      url: string;
    }>;
    topKeywords: Array<{
      keyword: string;
      ranking: number;
      volume: number;
      difficulty: number;
    }>;
    keywordGaps: Array<{
      keyword: string;
      opportunity: number;
      difficulty: number;
    }>;
  }> {
    return this.HttpClient.get<any>(`/seo/competitors/${encodeURIComponent(competitorUrl)}/keywords`);
  }

  async optimizeContent(entityType: string, entityId: string, optimizationData: {
    targetKeywords?: string[];
    targetAudience?: string;
    contentType?: string;
    tone?: string;
    length?: 'SHORT' | 'MEDIUM' | 'LONG';
  }): Promise<{
    entityType: string;
    entityId: string;
    suggestions: {
      title: {
        current: string;
        suggestions: Array<{
          title: string;
          score: number;
          reason: string;
        }>;
      };
      meta: {
        current: string;
        suggestions: Array<{
          description: string;
          score: number;
          reason: string;
        }>;
      };
      content: {
        suggestions: Array<{
          type: 'HEADING' | 'PARAGRAPH' | 'LIST' | 'IMAGE' | 'LINK';
          position: number;
          content: string;
          reason: string;
        }>;
      };
      keywords: {
        primary: string[];
        secondary: string[];
        density: Record<string, number>;
      };
    };
    readability: {
      score: number;
      grade: number;
      suggestions: string[];
    };
  }> {
    return this.HttpClient.post<any>(`/seo/${entityType}/${entityId}/optimize`, optimizationData);
  }

  async generateContentOutline(params: {
    topic: string;
    targetKeywords?: string[];
    contentType?: 'BLOG_POST' | 'LANDING_PAGE' | 'PRODUCT_DESCRIPTION' | 'CATEGORY_PAGE';
    targetAudience?: string;
    tone?: string;
    length?: 'SHORT' | 'MEDIUM' | 'LONG';
    includeSeoTips?: boolean;
  }): Promise<{
    topic: string;
    outline: Array<{
      type: 'HEADING' | 'SUBHEADING' | 'CONTENT' | 'LIST' | 'IMAGE' | 'VIDEO';
      level: number;
      title: string;
      description?: string;
      keywords?: string[];
      wordCount?: number;
      seoTips?: string[];
    }>;
    seo: {
      primaryKeywords: string[];
      secondaryKeywords: string[];
      metaTitle: string;
      metaDescription: string;
      url: string;
    };
    estimatedWordCount: number;
    estimatedReadTime: number;
  }> {
    return this.HttpClient.post<any>('/seo/content/outline', params);
  }

  async crawlWebsite(url: string, options?: {
    maxPages?: number;
    depth?: number;
    includeSubdomains?: boolean;
    followSitemap?: boolean;
  }): Promise<{
    crawlId: string;
    status: 'PENDING' | 'CRAWLING' | 'COMPLETED' | 'FAILED';
    url: string;
    options: any;
    startedAt: string;
    estimatedCompletion?: string;
  }> {
    return this.HttpClient.post<any>('/seo/crawl', { url, ...options });
  }

  async getCrawlResults(crawlId: string): Promise<{
    crawlId: string;
    status: 'PENDING' | 'CRAWLING' | 'COMPLETED' | 'FAILED';
    url: string;
    results: {
      pages: Array<{
        url: string;
        title: string;
        status: number;
        issues: Array<{
          type: string;
          severity: 'ERROR' | 'WARNING' | 'INFO';
          message: string;
        }>;
        score: number;
      }>;
      summary: {
        totalPages: number;
        crawledPages: number;
        errorPages: number;
        warningPages: number;
        averageScore: number;
      };
      topIssues: Array<{
        type: string;
        count: number;
        severity: string;
      }>;
    };
    completedAt?: string;
    error?: string;
  }> {
    return this.HttpClient.get<any>(`/seo/crawl/${crawlId}`);
  }

  async getTechnicalSeoAudit(url: string): Promise<{
    url: string;
    score: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    categories: {
      performance: {
        score: number;
        issues: Array<{
          type: string;
          severity: string;
          message: string;
          impact: string;
        }>;
      };
      security: {
        score: number;
        issues: Array<{
          type: string;
          severity: string;
          message: string;
          impact: string;
        }>;
      };
      accessibility: {
        score: number;
        issues: Array<{
          type: string;
          severity: string;
          message: string;
          impact: string;
        }>;
      };
      bestPractices: {
        score: number;
        issues: Array<{
          type: string;
          severity: string;
          message: string;
          impact: string;
        }>;
      };
      seo: {
        score: number;
        issues: Array<{
          type: string;
          severity: string;
          message: string;
          impact: string;
        }>;
      };
    };
    recommendations: Array<{
      priority: 'HIGH' | 'MEDIUM' | 'LOW';
      category: string;
      action: string;
      expectedImpact: string;
    }>;
  }> {
    return this.HttpClient.get<any>(`/seo/audit/${encodeURIComponent(url)}`);
  }

  async getReferringLinks(url: string, params?: {
    page?: number;
    limit?: number;
    quality?: 'ALL' | 'HIGH' | 'MEDIUM' | 'LOW';
    status?: 'ACTIVE' | 'LOST';
  }): Promise<PaginatedResponse<Array<{
    url: string;
    title: string;
    anchorText: string;
    linkType: 'TEXT' | 'IMAGE' | 'REDIRECT';
    quality: 'HIGH' | 'MEDIUM' | 'LOW';
    status: 'ACTIVE' | 'LOST';
    domainAuthority: number;
    pageAuthority: number;
    spamScore: number;
    firstSeen: string;
    lastSeen: string;
  }>>> {
    return this.HttpClient.get<PaginatedResponse<any[]>>(`/seo/referring-links/${encodeURIComponent(url)}`, { params });
  }

  async getLinkOpportunities(entityType: string, entityId: string): Promise<{
    entityType: string;
    entityId: string;
    opportunities: Array<{
      url: string;
      title: string;
      type: 'GUEST_POST' | 'BROKEN_LINK' | 'RESOURCE_PAGE' | 'DIRECTORY';
      domainAuthority: number;
      relevance: number;
      difficulty: 'EASY' | 'MEDIUM' | 'HARD';
      estimatedValue: number;
      contactInfo?: {
        email?: string;
        form?: string;
      };
    }>;
    competitorLinks: Array<{
      url: string;
      title: string;
      domainAuthority: number;
      relevance: number;
    }>;
  }> {
    return this.HttpClient.get<any>(`/seo/${entityType}/${entityId}/link-opportunities`);
  }

  async getLocalSeoData(businessId: string): Promise<{
    businessId: string;
    businessName: string;
    address: any;
    phone: string;
    website: string;
    categories: string[];
    googleBusinessProfile: {
      verified: boolean;
      rating: number;
      reviews: number;
      photos: number;
      posts: number;
      questions: number;
    };
    localRankings: Array<{
      keyword: string;
      ranking: number;
      localPack: boolean;
      mapPosition?: number;
    }>;
    citations: {
      total: number;
      consistent: number;
      inconsistent: number;
      missing: number;
    };
    reviews: {
      total: number;
      average: number;
      distribution: Record<number, number>;
      recent: Array<{
        platform: string;
        rating: number;
        content: string;
        date: string;
      }>;
    };
  }> {
    return this.HttpClient.get<any>(`/seo/local/${businessId}`);
  }

  async optimizeLocalSeo(businessId: string, optimizationData: {
    categories?: string[];
    services?: Array<{
      name: string;
      description: string;
    }>;
    hours?: any;
    photos?: File[];
  }): Promise<any> {
    const formData = new FormData();

    if (optimizationData.categories) {
      formData.append('categories', JSON.stringify(optimizationData.categories));
    }

    if (optimizationData.services) {
      formData.append('services', JSON.stringify(optimizationData.services));
    }

    if (optimizationData.hours) {
      formData.append('hours', JSON.stringify(optimizationData.hours));
    }

    if (optimizationData.photos) {
      optimizationData.photos.forEach((photo, index) => {
        formData.append(`photos_${index}`, photo);
      });
    }

    return this.HttpClient.post<any>(`/seo/local/${businessId}/optimize`, formData);
  }

  async generateSeoReport(params: {
    entityType: string;
    entityId?: string;
    reportType: 'ANALYSIS' | 'KEYWORDS' | 'COMPETITORS' | 'TECHNICAL' | 'LOCAL' | 'COMPREHENSIVE';
    startDate?: string;
    endDate?: string;
    format?: 'PDF' | 'EXCEL' | 'CSV';
    includeRecommendations?: boolean;
  }): Promise<Blob> {
    return this.HttpClient.post<Blob>('/seo/reports', params);
  }

  async getSeoReports(params?: {
    page?: number;
    limit?: number;
    reportType?: string;
    entityType?: string;
  }): Promise<PaginatedResponse<Array<{
    id: string;
    entityType: string;
    entityId?: string;
    reportType: string;
    generatedAt: string;
    generatedBy: string;
    downloadUrl: string;
    expiresAt: string;
  }>>> {
    return this.HttpClient.get<PaginatedResponse<any[]>>('/seo/reports', { params });
  }

  async getSeoSettings(): Promise<{
    general: {
      defaultTitleTemplate: string;
      defaultMetaDescription: string;
      defaultMetaKeywords: string[];
      autoGenerateSlugs: boolean;
      enableStructuredData: boolean;
      enableOpenGraph: boolean;
      enableTwitterCards: boolean;
    };
    analysis: {
      enableAutoAnalysis: boolean;
      analysisFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
      keywordTrackingLimit: number;
      competitorTrackingLimit: number;
    };
    reporting: {
      autoGenerateReports: boolean;
      reportFrequency: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';
      reportRecipients: string[];
    };
    integration: {
      googleAnalytics?: {
        enabled: boolean;
        trackingId: string;
      };
      googleSearchConsole?: {
        enabled: boolean;
        siteUrl: string;
      };
      rankTracker?: {
        enabled: boolean;
        apiKey: string;
      };
      linkAnalyzer?: {
        enabled: boolean;
        apiKey: string;
      };
    };
  }> {
    return this.HttpClient.get<any>('/seo/settings');
  }

  async updateSeoSettings(settings: {
    general?: {
      defaultTitleTemplate?: string;
      defaultMetaDescription?: string;
      defaultMetaKeywords?: string[];
      autoGenerateSlugs?: boolean;
      enableStructuredData?: boolean;
      enableOpenGraph?: boolean;
      enableTwitterCards?: boolean;
    };
    analysis?: {
      enableAutoAnalysis?: boolean;
      analysisFrequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
      keywordTrackingLimit?: number;
      competitorTrackingLimit?: number;
    };
    reporting?: {
      autoGenerateReports?: boolean;
      reportFrequency?: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';
      reportRecipients?: string[];
    };
    integration?: {
      googleAnalytics?: {
        enabled?: boolean;
        trackingId?: string;
      };
      googleSearchConsole?: {
        enabled?: boolean;
        siteUrl?: string;
      };
      rankTracker?: {
        enabled?: boolean;
        apiKey?: string;
      };
      linkAnalyzer?: {
        enabled?: boolean;
        apiKey?: string;
      };
    };
  }): Promise<any> {
    return this.HttpClient.put<any>('/seo/settings', settings);
  }

  async exportSeoData(params?: {
    format?: 'CSV' | 'EXCEL' | 'JSON';
    entityType?: string;
    includeAnalytics?: boolean;
    includeKeywords?: boolean;
  }): Promise<Blob> {
    return this.HttpClient.get<Blob>('/seo/export', {
      params,
      responseType: 'blob',
    });
  }

  async importSeoData(file: File, options?: {
    overwrite?: boolean;
    createMissing?: boolean;
    validateEntities?: boolean;
  }): Promise<{
    imported: number;
    updated: number;
    skipped: number;
    errors: Array<{
      row: number;
      error: string;
      data: any;
    }>;
  }> {
    const formData = new FormData();
    formData.append('file', file);

    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        formData.append(key, value.toString());
      });
    }

    return this.HttpClient.post<any>('/seo/import', formData);
  }
}