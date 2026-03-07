// Base API Response Types
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  errors?: any[];
  meta?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  meta?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}

// Upload Types
export interface UploadedFile {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  secureUrl?: string;
  thumbnailUrl?: string;
  mediumUrl?: string;
  largeUrl?: string;
  dimensions?: {
    width: number;
    height: number;
  };
  duration?: number; // For video/audio files
  metadata?: {
    exif?: any;
    colorProfile?: string;
    hasTransparency?: boolean;
    aspectRatio?: string;
  };
  tags?: string[];
  category?: string;
  alt?: string;
  caption?: string;
  description?: string;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  downloadCount: number;
  lastAccessed?: string;
  storageProvider: 'local' | 'aws' | 'cloudinary' | 'google';
  storagePath: string;
  cdnUrl?: string;
  variants?: FileVariant[];
  processing?: {
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    progress?: number;
    error?: string;
  };
  security: {
    virusScanned: boolean;
    virusClean: boolean;
    scannedAt?: string;
  };
}

export interface FileVariant {
  id: string;
  name: string;
  url: string;
  size: number;
  dimensions?: {
    width: number;
    height: number;
  };
  format: string;
  quality?: number;
  createdAt: string;
}

export interface CreateUploadRequest {
  category?: string;
  tags?: string[];
  alt?: string;
  caption?: string;
  description?: string;
  isPublic?: boolean;
  processing?: {
    resize?: {
      width?: number;
      height?: number;
      fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
    };
    compress?: {
      quality?: number;
      format?: 'jpeg' | 'png' | 'webp' | 'avif';
    };
    watermark?: {
      text?: string;
      image?: string;
      position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
      opacity?: number;
    };
    generateThumbnails?: boolean;
  };
  validation?: {
    maxSize?: number;
    allowedTypes?: string[];
    maxDimensions?: {
      width: number;
      height: number;
    };
  };
}

export interface UpdateUploadRequest {
  name?: string;
  alt?: string;
  caption?: string;
  description?: string;
  tags?: string[];
  category?: string;
  isPublic?: boolean;
}

export interface UploadFilters {
  search?: string;
  category?: string;
  tags?: string[];
  mimeType?: string;
  uploadedBy?: string;
  isPublic?: boolean;
  startDate?: string;
  endDate?: string;
  minSize?: number;
  maxSize?: number;
  hasDimensions?: boolean;
  processingStatus?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  storageProvider?: 'local' | 'aws' | 'cloudinary' | 'google';
}

export interface UploadStats {
  totalFiles: number;
  totalSize: number;
  totalUploads: number;
  totalDownloads: number;
  averageFileSize: number;
  filesByType: Record<string, number>;
  filesByCategory: Record<string, number>;
  uploadsByDate: Array<{
    date: string;
    count: number;
    size: number;
  }>;
  downloadsByDate: Array<{
    date: string;
    count: number;
  }>;
  topFiles: Array<{
    id: string;
    name: string;
    downloads: number;
    size: number;
  }>;
  storageUsage: {
    used: number;
    available: number;
    percentage: number;
  };
}

export interface FileProcessingJob {
  id: string;
  fileId: string;
  type: 'RESIZE' | 'COMPRESS' | 'WATERMARK' | 'CONVERT' | 'THUMBNAILS' | 'OPTIMIZE';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress?: number;
  options: any;
  result?: {
    variants: FileVariant[];
    optimizedSize?: number;
    compressionRatio?: number;
  };
  error?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  estimatedCompletion?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  retryCount: number;
  maxRetries: number;
}

export interface CreateProcessingJobRequest {
  fileId: string;
  type: 'RESIZE' | 'COMPRESS' | 'WATERMARK' | 'CONVERT' | 'THUMBNAILS' | 'OPTIMIZE';
  options: any;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

// File Validation Types
export interface FileValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
  fileInfo?: {
    size: number;
    type: string;
    dimensions?: {
      width: number;
      height: number;
    };
    duration?: number;
    format: string;
    quality?: number;
  };
  security?: {
    virusScanned: boolean;
    virusClean: boolean;
    threats?: string[];
  };
  duplicates?: Array<{
    id: string;
    name: string;
    url: string;
    similarity: number;
  }>;
}

// File Category Types
export interface FileCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  fileCount: number;
  totalSize: number;
  allowedTypes: string[];
  maxSize: number;
  processing: {
    autoResize?: boolean;
    autoCompress?: boolean;
    generateThumbnails?: boolean;
    watermark?: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

// File Tag Types
export interface FileTag {
  id: string;
  name: string;
  slug: string;
  color?: string;
  description?: string;
  fileCount: number;
  createdAt: string;
  updatedAt: string;
}

// Backup Types
export interface FileBackup {
  id: string;
  name: string;
  description?: string;
  status: 'CREATING' | 'COMPLETED' | 'FAILED' | 'EXPIRED';
  fileCount: number;
  totalSize: number;
  compressedSize: number;
  downloadUrl?: string;
  expiresAt?: string;
  createdAt: string;
  completedAt?: string;
  createdBy: string;
  includeFiles?: string[];
  excludeFiles?: string[];
  filters?: UploadFilters;
}

export interface FileRestore {
  id: string;
  backupId: string;
  status: 'RESTORING' | 'COMPLETED' | 'FAILED' | 'PARTIAL';
  fileCount: number;
  restoredCount: number;
  failedCount: number;
  skippedCount: number;
  totalSize: number;
  restoredSize: number;
  errors?: Array<{
    fileId: string;
    fileName: string;
    error: string;
  }>;
  createdAt: string;
  completedAt?: string;
  createdBy: string;
  options: {
    overwrite?: boolean;
    preserveVersions?: boolean;
    restoreToCategory?: string;
  };
}

// Upload Preset Types
export interface UploadPreset {
  id: string;
  name: string;
  description?: string;
  category?: string;
  icon?: string;
  isActive: boolean;
  processing: {
    resize?: {
      width?: number;
      height?: number;
      fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
    };
    compress?: {
      quality?: number;
      format?: 'jpeg' | 'png' | 'webp' | 'avif';
    };
    watermark?: {
      text?: string;
      image?: string;
      position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
      opacity?: number;
    };
    generateThumbnails?: boolean;
    thumbnailSizes?: Array<{
      width: number;
      height: number;
      name: string;
    }>;
  };
  validation: {
    allowedTypes: string[];
    maxSize: number;
    maxDimensions?: {
      width: number;
      height: number;
    };
    minDimensions?: {
      width: number;
      height: number;
    };
    requireAlt?: boolean;
    scanForViruses?: boolean;
  };
  metadata: {
    autoExtract?: boolean;
    generateColors?: boolean;
    generateTags?: boolean;
    detectObjects?: boolean;
  };
  security: {
    isPublic?: boolean;
    allowedRoles?: string[];
    downloadAuth?: boolean;
  };
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  usageCount: number;
}

// File Analytics Types
export interface FileAnalytics {
  fileId: string;
  views: number;
  downloads: number;
  uniqueViews: number;
  averageViewDuration?: number;
  bounceRate?: number;
  referrers: Array<{
    source: string;
    count: number;
    percentage: number;
  }>;
  devices: Array<{
    device: string;
    count: number;
    percentage: number;
  }>;
  locations: Array<{
    country: string;
    count: number;
    percentage: number;
  }>;
  timeSeries: Array<{
    date: string;
    views: number;
    downloads: number;
    uniqueViews: number;
  }>;
  topReferringPages: Array<{
    url: string;
    title?: string;
    views: number;
  }>;
}

// File Search Types
export interface FileSearchResult {
  id: string;
  name: string;
  url: string;
  thumbnailUrl?: string;
  mimeType: string;
  size: number;
  dimensions?: {
    width: number;
    height: number;
  };
  tags?: string[];
  category?: string;
  alt?: string;
  caption?: string;
  relevanceScore: number;
  highlights?: Array<{
    field: string;
    fragments: string[];
  }>;
}

export interface FileSearchFilters {
  query?: string;
  category?: string;
  tags?: string[];
  mimeType?: string;
  uploadedBy?: string;
  isPublic?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  sizeRange?: {
    min: number;
    max: number;
  };
  dimensions?: {
    width?: {
      min?: number;
      max?: number;
    };
    height?: {
      min?: number;
      max?: number;
    };
  };
  processingStatus?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  hasColorProfile?: boolean;
  hasTransparency?: boolean;
  aspectRatio?: string;
  sortBy?: 'relevance' | 'name' | 'size' | 'createdAt' | 'downloads' | 'views';
  sortOrder?: 'asc' | 'desc';
}

// File Webhook Types
export interface FileWebhook {
  id: string;
  name: string;
  url: string;
  events: Array<
    'FILE_UPLOADED' | 'FILE_PROCESSED' | 'FILE_DELETED' | 'FILE_UPDATED' | 'BACKUP_COMPLETED' | 'RESTORE_COMPLETED'
  >;
  secret?: string;
  isActive: boolean;
  retryPolicy: {
    maxRetries: number;
    retryDelay: number;
    backoffMultiplier: number;
  };
  headers?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  lastTriggered?: string;
  successCount: number;
  failureCount: number;
}

export interface FileWebhookEvent {
  id: string;
  webhookId: string;
  event: string;
  payload: any;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'RETRYING';
  attempts: number;
  maxAttempts: number;
  response?: {
    status: number;
    body: string;
    headers: Record<string, string>;
  };
  error?: string;
  createdAt: string;
  sentAt?: string;
  nextRetryAt?: string;
}
