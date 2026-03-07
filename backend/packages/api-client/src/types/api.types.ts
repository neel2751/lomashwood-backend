// Common API response types
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

export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
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

export interface FilterParams {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  [key: string]: any;
}

// Common entity interfaces
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface SoftDeleteEntity extends BaseEntity {
  deletedAt?: string;
  isActive: boolean;
}

export interface Timestamps {
  createdAt: string;
  updatedAt: string;
}

// Error types
export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  path: string;
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

// File upload types
export interface FileUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
}

export interface UploadResponse {
  url: string;
  filename: string;
  size: number;
  mimetype: string;
}

// Search and filter types
export interface SearchRequest {
  query: string;
  filters?: Record<string, any>;
  sort?: SortParams;
  pagination?: PaginationParams;
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  facets?: Record<string, Array<{ value: string; count: number }>>;
}

// Export types
export interface ExportRequest {
  format: 'csv' | 'excel' | 'pdf';
  filters?: Record<string, any>;
  fields?: string[];
}

export interface ExportResponse {
  downloadUrl: string;
  filename: string;
  size: number;
  expiresAt: string;
}

// Dashboard types
export interface DashboardStats {
  total: number;
  growth: number;
  period: string;
}

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
  }>;
}

// Notification types
export interface NotificationChannel {
  type: 'email' | 'sms' | 'push' | 'in_app';
  enabled: boolean;
  settings?: Record<string, any>;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationChannel['type'];
  subject?: string;
  content: string;
  variables: string[];
}

// Configuration types
export interface AppConfig {
  name: string;
  version: string;
  environment: 'development' | 'staging' | 'production';
  features: Record<string, boolean>;
  limits: {
    uploadSize: number;
    apiRateLimit: number;
  };
}

// Health check types
export interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  services: Record<string, {
    status: 'healthy' | 'unhealthy' | 'degraded';
    responseTime: number;
    error?: string;
  }>;
  uptime: number;
  version: string;
}

// CMS Page types
export interface CmsPage extends BaseEntity {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  status: 'draft' | 'published' | 'archived';
  featuredImage?: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  tags: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    canonicalUrl?: string;
  };
  publishedAt?: string;
  scheduledPublishAt?: string;
  template?: string;
  layout?: string;
  metadata?: Record<string, any>;
}

export interface CreateCmsPageRequest {
  title: string;
  slug?: string;
  content: string;
  excerpt?: string;
  status?: 'draft' | 'published' | 'archived';
  featuredImage?: string;
  categoryId?: string;
  tagIds?: string[];
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    canonicalUrl?: string;
  };
  template?: string;
  layout?: string;
  metadata?: Record<string, any>;
  scheduledPublishAt?: string;
}

export interface UpdateCmsPageRequest extends Partial<CreateCmsPageRequest> {}

export interface CmsPageFilters extends FilterParams {
  author?: string;
  category?: string;
  tags?: string[];
  template?: string;
  layout?: string;
  featuredImage?: boolean;
}

// Support Ticket types
export interface SupportTicket extends BaseEntity {
  ticketNumber: string;
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'pending' | 'resolved' | 'closed';
  type: 'inquiry' | 'bug' | 'feature' | 'complaint' | 'other';
  category: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  };
  tags: Array<{
    id: string;
    name: string;
    color?: string;
  }>;
  attachments: Array<{
    id: string;
    filename: string;
    url: string;
    size: number;
    mimetype: string;
  }>;
  customFields: Record<string, any>;
  source: 'email' | 'web' | 'api' | 'phone' | 'chat';
  satisfaction?: {
    rating: number;
    comment?: string;
  };
  resolution?: {
    description: string;
    resolvedAt: string;
    resolvedBy: string;
  };
  dueDate?: string;
  escalatedAt?: string;
  reopenedAt?: string;
  lastActivityAt: string;
}

export interface CreateSupportTicketRequest {
  subject: string;
  description: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  type?: 'inquiry' | 'bug' | 'feature' | 'complaint' | 'other';
  category?: string;
  customerId?: string;
  assignedToId?: string;
  tagIds?: string[];
  attachments?: File[];
  customFields?: Record<string, any>;
  source?: 'email' | 'web' | 'api' | 'phone' | 'chat';
  dueDate?: string;
}

export interface UpdateSupportTicketRequest extends Partial<CreateSupportTicketRequest> {
  status?: 'open' | 'pending' | 'resolved' | 'closed';
  resolution?: {
    description: string;
  };
  satisfaction?: {
    rating: number;
    comment?: string;
  };
}

export interface SupportTicketFilters extends FilterParams {
  ticketNumber?: string;
  priority?: string;
  status?: string;
  type?: string;
  category?: string;
  customerId?: string;
  assignedToId?: string;
  tagIds?: string[];
  source?: string;
  hasAttachments?: boolean;
  isOverdue?: boolean;
  satisfactionRating?: number;
  dateRange?: {
    created?: {
      startDate: string;
      endDate: string;
    };
    resolved?: {
      startDate: string;
      endDate: string;
    };
    due?: {
      startDate: string;
      endDate: string;
    };
  };
}

// Session types
export interface Session extends BaseEntity {
  sessionId: string;
  userId?: string;
  userType: 'customer' | 'agent' | 'admin' | 'guest';
  status: 'active' | 'inactive' | 'expired' | 'terminated';
  deviceInfo: {
    deviceId?: string;
    deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
    platform: string;
    browser: string;
    browserVersion: string;
    os: string;
    osVersion: string;
    screenResolution?: string;
  };
  location: {
    ip?: string;
    country?: string;
    region?: string;
    city?: string;
    timezone?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  authentication: {
    method: 'password' | 'oauth' | 'sso' | 'token' | 'guest';
    provider?: string;
    authenticatedAt?: string;
    expiresAt?: string;
    lastActivityAt: string;
  };
  security: {
    riskLevel: 'low' | 'medium' | 'high';
    riskFactors: string[];
    securityEvents: Array<{
      type: string;
      timestamp: string;
      description: string;
      severity: 'low' | 'medium' | 'high';
    }>;
    twoFactorAuthenticated?: boolean;
  };
  activity: {
    pagesVisited: number;
    timeSpent: number;
    lastPage?: string;
    actions: Array<{
      type: string;
      timestamp: string;
      details: Record<string, any>;
    }>;
  };
  metadata: Record<string, any>;
  terminatedAt?: string;
  terminationReason?: string;
}

export interface CreateSessionRequest {
  userId?: string;
  userType: 'customer' | 'agent' | 'admin' | 'guest';
  deviceInfo?: {
    deviceId?: string;
    deviceType?: 'desktop' | 'mobile' | 'tablet' | 'unknown';
    platform?: string;
    browser?: string;
    browserVersion?: string;
    os?: string;
    osVersion?: string;
    screenResolution?: string;
  };
  authentication: {
    method: 'password' | 'oauth' | 'sso' | 'token' | 'guest';
    provider?: string;
    credentials?: Record<string, any>;
    expiresAt?: string;
  };
  metadata?: Record<string, any>;
}

export interface UpdateSessionRequest extends Partial<CreateSessionRequest> {
  status?: 'active' | 'inactive' | 'expired' | 'terminated';
  terminationReason?: string;
  metadata?: Record<string, any>;
}

export interface SessionFilters extends FilterParams {
  sessionId?: string;
  userId?: string;
  userType?: string;
  status?: string;
  deviceType?: string;
  platform?: string;
  browser?: string;
  os?: string;
  country?: string;
  region?: string;
  city?: string;
  authenticationMethod?: string;
  provider?: string;
  riskLevel?: string;
  hasTwoFactor?: boolean;
  dateRange?: {
    created?: {
      startDate: string;
      endDate: string;
    };
    lastActivity?: {
      startDate: string;
      endDate: string;
    };
    expires?: {
      startDate: string;
      endDate: string;
    };
  };
}

// Upload types
export interface UploadedFile extends BaseEntity {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
  path: string;
  hash: string;
  metadata: {
    width?: number;
    height?: number;
    duration?: number;
    format?: string;
    quality?: number;
    exif?: Record<string, any>;
    thumbnails?: Array<{
      url: string;
      width: number;
      height: number;
      size: number;
    }>;
  };
  uploadedBy: {
    id: string;
    name: string;
    email: string;
  };
  status: 'uploading' | 'processing' | 'completed' | 'failed' | 'deleted';
  processing: {
    stages: Array<{
      name: string;
      status: 'pending' | 'processing' | 'completed' | 'failed';
      startedAt?: string;
      completedAt?: string;
      error?: string;
    }>;
    progress: number;
    estimatedTimeRemaining?: number;
  };
  security: {
    scanned: boolean;
    scanResult?: 'clean' | 'infected' | 'suspicious';
    scanDate?: string;
    virusName?: string;
  };
  access: {
    isPublic: boolean;
    allowedUsers?: string[];
    allowedRoles?: string[];
    expiresAt?: string;
    downloadCount: number;
    maxDownloads?: number;
  };
  tags: Array<{
    id: string;
    name: string;
    color?: string;
  }>;
  category?: {
    id: string;
    name: string;
  };
  customFields: Record<string, any>;
  deletedAt?: string;
  deletedBy?: string;
}

export interface CreateUploadRequest {
  filename?: string;
  category?: string;
  tagIds?: string[];
  isPublic?: boolean;
  allowedUsers?: string[];
  allowedRoles?: string[];
  expiresAt?: string;
  maxDownloads?: number;
  customFields?: Record<string, any>;
  processing?: {
    generateThumbnails?: boolean;
    thumbnailSizes?: Array<{ width: number; height: number }>;
    optimize?: boolean;
    quality?: number;
    watermark?: {
      text?: string;
      image?: string;
      position?: string;
      opacity?: number;
    };
    resize?: {
      width?: number;
      height?: number;
      maintainAspectRatio?: boolean;
    };
    extractMetadata?: boolean;
  };
}

export interface UpdateUploadRequest extends Partial<CreateUploadRequest> {
  status?: 'uploading' | 'processing' | 'completed' | 'failed' | 'deleted';
  url?: string;
  metadata?: Partial<UploadedFile['metadata']>;
  access?: {
    isPublic?: boolean;
    allowedUsers?: string[];
    allowedRoles?: string[];
    expiresAt?: string;
    maxDownloads?: number;
  };
}

export interface UploadFilters extends FilterParams {
  filename?: string;
  mimetype?: string;
  category?: string;
  tagIds?: string[];
  uploadedBy?: string;
  status?: string;
  isPublic?: boolean;
  hasExpiration?: boolean;
  isExpired?: boolean;
  scanResult?: string;
  sizeRange?: {
    min?: number;
    max?: number;
  };
  dateRange?: {
    uploaded?: {
      startDate: string;
      endDate: string;
    };
    expires?: {
      startDate: string;
      endDate: string;
    };
  };
}

export interface UploadStats {
  totalFiles: number;
  totalSize: number;
  avgFileSize: number;
  filesByStatus: Array<{
    status: string;
    count: number;
    size: number;
    percentage: number;
  }>;
  filesByType: Array<{
    mimetype: string;
    count: number;
    size: number;
    percentage: number;
  }>;
  filesByCategory: Array<{
    category: string;
    count: number;
    size: number;
    percentage: number;
  }>;
  uploadsToday: number;
  uploadsThisWeek: number;
  uploadsThisMonth: number;
  storageUsed: number;
  storageAvailable: number;
  bandwidthUsed: number;
  topUploaders: Array<{
    user: {
      id: string;
      name: string;
    };
    count: number;
    size: number;
  }>;
  recentFiles: Array<{
    id: string;
    filename: string;
    mimetype: string;
    size: number;
    uploadedAt: string;
    uploadedBy: {
      name: string;
    };
  }>;
}

export interface FileProcessingJob extends BaseEntity {
  jobId: string;
  fileId: string;
  file: {
    id: string;
    filename: string;
    mimetype: string;
    size: number;
  };
  type: 'thumbnail' | 'resize' | 'optimize' | 'watermark' | 'extract' | 'convert' | 'custom';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  config: Record<string, any>;
  result?: {
    success: boolean;
    data?: any;
    error?: string;
  };
  startedAt?: string;
  completedAt?: string;
  estimatedTimeRemaining?: number;
  priority: number;
  retryCount: number;
  maxRetries: number;
  nextRetryAt?: string;
}

export interface CreateProcessingJobRequest {
  fileId: string;
  type: 'thumbnail' | 'resize' | 'optimize' | 'watermark' | 'extract' | 'convert' | 'custom';
  config: Record<string, any>;
  priority?: number;
  maxRetries?: number;
}
// ─── Template types ───────────────────────────────────────────────────────────
// Append these exports to src/types/api.types.ts

export type TemplateStatus = 'draft' | 'published' | 'archived';
export type TemplateType = 'email' | 'sms' | 'push' | 'document' | 'page' | string;

export interface Template extends BaseEntity {
  name: string;
  description?: string;
  content: string;
  type: TemplateType;
  status: TemplateStatus;
  categoryId?: string;
  category?: {
    id: string;
    name: string;
  };
  variables?: Array<{
    name: string;
    type: string;
    label: string;
    required: boolean;
    defaultValue?: any;
  }>;
  version?: number;
  isActive: boolean;
  createdBy?: {
    id: string;
    name: string;
  };
}

export interface CreateTemplateRequest {
  name: string;
  description?: string;
  content: string;
  type: TemplateType;
  status?: TemplateStatus;
  categoryId?: string;
  variables?: Template['variables'];
  isActive?: boolean;
}

export interface UpdateTemplateRequest extends Partial<CreateTemplateRequest> {}

export interface TemplateFilters extends FilterParams {
  type?: TemplateType;
  status?: TemplateStatus;
  categoryId?: string;
  isActive?: boolean;
  createdBy?: string;
}
// ─── Size types ───────────────────────────────────────────────────────────────
// Append these exports to src/types/api.types.ts

export type SizeSystem = 'US' | 'UK' | 'EU' | 'IT' | 'FR' | 'JP' | 'AU' | string;
export type SizeCategoryType = 'clothing' | 'furniture' | 'general';

export interface Size extends BaseEntity {
  name: string;
  value: string;
  slug: string;
  description?: string;
  categoryId?: string;
  category?: {
    id: string;
    name: string;
    slug: string;
    type: SizeCategoryType;
  };
  system?: SizeSystem;
  order?: number;
  isActive: boolean;
  measurements?: Record<string, number>;
}

export interface CreateSizeRequest {
  name: string;
  value: string;
  slug?: string;
  description?: string;
  categoryId?: string;
  system?: SizeSystem;
  order?: number;
  isActive?: boolean;
  measurements?: Record<string, number>;
}

export interface UpdateSizeRequest extends Partial<CreateSizeRequest> {}

export interface SizeFilters extends FilterParams {
  categoryId?: string;
  system?: SizeSystem;
  isActive?: boolean;
  category?: SizeCategoryType;
}
// ─── SEO types ────────────────────────────────────────────────────────────────
// Append these exports to src/types/api.types.ts

export type SeoEntityType = 'page' | 'product' | 'category' | 'blog' | string;

export interface Seo extends BaseEntity {
  entityType: SeoEntityType;
  entityId: string;
  title?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  slug?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
  noFollow?: boolean;
  openGraph?: {
    title?: string;
    description?: string;
    image?: string;
    type?: string;
  };
  twitterCard?: {
    title?: string;
    description?: string;
    image?: string;
    card?: 'summary' | 'summary_large_image' | 'app' | 'player';
  };
  structuredData?: Record<string, any>;
  score?: number;
  lastAnalyzedAt?: string;
}

export interface CreateSeoRequest {
  entityType: SeoEntityType;
  entityId: string;
  title?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  slug?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
  noFollow?: boolean;
  openGraph?: Seo['openGraph'];
  twitterCard?: Seo['twitterCard'];
  structuredData?: Record<string, any>;
}

export interface UpdateSeoRequest extends Partial<Omit<CreateSeoRequest, 'entityType' | 'entityId'>> {}

export interface SeoFilters extends FilterParams {
  entityType?: SeoEntityType;
  entityId?: string;
  noIndex?: boolean;
  noFollow?: boolean;
  hasScore?: boolean;
  minScore?: number;
  maxScore?: number;
}