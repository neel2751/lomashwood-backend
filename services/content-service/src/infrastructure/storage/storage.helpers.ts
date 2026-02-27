/**
 * content-service/src/infrastructure/storage/storage.helpers.ts
 *
 * Storage utility functions for the Content Service.
 * Provides:
 *   - File validation (type, size, dimensions)
 *   - Path generation and sanitization
 *   - Image optimization hints
 *   - URL transformations and CDN optimizations
 *   - Batch operations helpers
 */

import path from 'node:path';
import crypto from 'node:crypto';
import { Readable } from 'node:stream';
import { logger } from '../../config/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface FileValidationOptions {
  allowedMimeTypes?: string[];
  maxSizeBytes?: number;
  minSizeBytes?: number;
  allowedExtensions?: string[];
}

export interface ImageValidationOptions extends FileValidationOptions {
  maxWidth?: number;
  maxHeight?: number;
  minWidth?: number;
  minHeight?: number;
}

export interface FileMetadata {
  filename: string;
  mimeType: string;
  size: number;
  extension: string;
  hash?: string;
}

export interface ImageMetadata extends FileMetadata {
  width?: number;
  height?: number;
  format?: string;
}

export interface PathOptions {
  prefix?: string;
  preserveFilename?: boolean;
  includeTimestamp?: boolean;
  includeHash?: boolean;
}

export interface ImageOptimizationParams {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png' | 'avif';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

export type ContentType =
  | 'blog'
  | 'page'
  | 'media-wall'
  | 'landing'
  | 'seo'
  | 'general';

// ---------------------------------------------------------------------------
// File Validation
// ---------------------------------------------------------------------------
const DEFAULT_MAX_SIZE = 50 * 1024 * 1024; // 50MB
const DEFAULT_MIN_SIZE = 1024; // 1KB

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/avif',
];

const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
];

const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export const validateFile = (
  metadata: FileMetadata,
  options: FileValidationOptions = {},
): { valid: boolean; error?: string } => {
  const {
    allowedMimeTypes,
    maxSizeBytes = DEFAULT_MAX_SIZE,
    minSizeBytes = DEFAULT_MIN_SIZE,
    allowedExtensions,
  } = options;

  // Size validation
  if (metadata.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size ${metadata.size} exceeds maximum ${maxSizeBytes} bytes`,
    };
  }

  if (metadata.size < minSizeBytes) {
    return {
      valid: false,
      error: `File size ${metadata.size} is below minimum ${minSizeBytes} bytes`,
    };
  }

  // MIME type validation
  if (allowedMimeTypes && !allowedMimeTypes.includes(metadata.mimeType)) {
    return {
      valid: false,
      error: `MIME type ${metadata.mimeType} is not allowed`,
    };
  }

  // Extension validation
  if (allowedExtensions && !allowedExtensions.includes(metadata.extension)) {
    return {
      valid: false,
      error: `Extension ${metadata.extension} is not allowed`,
    };
  }

  return { valid: true };
};

export const validateImage = (
  metadata: ImageMetadata,
  options: ImageValidationOptions = {},
): { valid: boolean; error?: string } => {
  // First validate as file
  const fileValidation = validateFile(metadata, {
    ...options,
    allowedMimeTypes: options.allowedMimeTypes ?? ALLOWED_IMAGE_TYPES,
  });

  if (!fileValidation.valid) {
    return fileValidation;
  }

  const { maxWidth, maxHeight, minWidth, minHeight } = options;

  // Dimension validation
  if (metadata.width && maxWidth && metadata.width > maxWidth) {
    return {
      valid: false,
      error: `Image width ${metadata.width}px exceeds maximum ${maxWidth}px`,
    };
  }

  if (metadata.height && maxHeight && metadata.height > maxHeight) {
    return {
      valid: false,
      error: `Image height ${metadata.height}px exceeds maximum ${maxHeight}px`,
    };
  }

  if (metadata.width && minWidth && metadata.width < minWidth) {
    return {
      valid: false,
      error: `Image width ${metadata.width}px is below minimum ${minWidth}px`,
    };
  }

  if (metadata.height && minHeight && metadata.height < minHeight) {
    return {
      valid: false,
      error: `Image height ${metadata.height}px is below minimum ${minHeight}px`,
    };
  }

  return { valid: true };
};

// ---------------------------------------------------------------------------
// Path Generation
// ---------------------------------------------------------------------------
export const generateStoragePath = (
  contentType: ContentType,
  filename: string,
  options: PathOptions = {},
): string => {
  const {
    prefix,
    preserveFilename = false,
    includeTimestamp = true,
    includeHash = true,
  } = options;

  const sanitized = sanitizeFilename(filename);
  const extension = path.extname(sanitized);
  const basename = path.basename(sanitized, extension);

  const parts: string[] = [];

  // Add prefix (content type by default)
  parts.push(prefix ?? contentType);

  // Add date-based folder structure for better organization
  if (includeTimestamp) {
    const now = new Date();
    parts.push(now.getFullYear().toString());
    parts.push((now.getMonth() + 1).toString().padStart(2, '0'));
  }

  // Generate filename
  let finalFilename: string;

  if (preserveFilename) {
    finalFilename = sanitized;
  } else {
    const components: string[] = [];

    if (includeTimestamp) {
      components.push(Date.now().toString());
    }

    if (includeHash) {
      const hash = crypto.randomBytes(8).toString('hex');
      components.push(hash);
    }

    if (basename && basename !== extension) {
      components.push(basename.substring(0, 50));
    }

    finalFilename = `${components.join('-')}${extension}`;
  }

  parts.push(finalFilename);

  return parts.join('/');
};

export const sanitizeFilename = (filename: string): string => {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

// ---------------------------------------------------------------------------
// Content-Type Specific Path Generators
// ---------------------------------------------------------------------------
export const getBlogImagePath = (filename: string): string => {
  return generateStoragePath('blog', filename, {
    includeTimestamp: true,
    includeHash: true,
  });
};

export const getMediaWallPath = (filename: string): string => {
  return generateStoragePath('media-wall', filename, {
    includeTimestamp: true,
    includeHash: true,
  });
};

export const getPageHeroPath = (filename: string): string => {
  return generateStoragePath('page', filename, {
    prefix: 'pages/heroes',
    includeTimestamp: true,
    includeHash: true,
  });
};

export const getLandingPagePath = (filename: string): string => {
  return generateStoragePath('landing', filename, {
    includeTimestamp: true,
    includeHash: true,
  });
};

export const getGeneralUploadPath = (filename: string): string => {
  return generateStoragePath('general', filename, {
    prefix: 'uploads',
    includeTimestamp: true,
    includeHash: true,
  });
};

// ---------------------------------------------------------------------------
// URL Transformations
// ---------------------------------------------------------------------------
export const buildOptimizedImageUrl = (
  baseUrl: string,
  params: ImageOptimizationParams,
): string => {
  const searchParams = new URLSearchParams();

  if (params.width) searchParams.set('w', params.width.toString());
  if (params.height) searchParams.set('h', params.height.toString());
  if (params.quality) searchParams.set('q', params.quality.toString());
  if (params.format) searchParams.set('fm', params.format);
  if (params.fit) searchParams.set('fit', params.fit);

  const query = searchParams.toString();
  return query ? `${baseUrl}?${query}` : baseUrl;
};

export const extractKeyFromUrl = (url: string): string | null => {
  try {
    const urlObj = new URL(url);

    // Extract from S3 URL pattern
    if (urlObj.hostname.includes('.s3.')) {
      return urlObj.pathname.substring(1); // Remove leading slash
    }

    // Extract from CloudFront/CDN URL
    if (urlObj.hostname.includes('cloudfront.net') || urlObj.hostname.includes('cdn.')) {
      return urlObj.pathname.substring(1);
    }

    return null;
  } catch (error) {
    logger.warn({
      context: 'extractKeyFromUrl',
      url,
      error: (error as Error).message,
    });
    return null;
  }
};

// ---------------------------------------------------------------------------
// Hash Generation
// ---------------------------------------------------------------------------
export const generateFileHash = async (
  data: Buffer | Readable,
): Promise<string> => {
  const hash = crypto.createHash('sha256');

  if (Buffer.isBuffer(data)) {
    hash.update(data);
    return hash.digest('hex');
  }

  // Handle streams
  return new Promise((resolve, reject) => {
    data.on('data', (chunk) => hash.update(chunk));
    data.on('end', () => resolve(hash.digest('hex')));
    data.on('error', reject);
  });
};

export const generateETag = (content: Buffer | string): string => {
  const hash = crypto.createHash('md5');
  hash.update(content);
  return `"${hash.digest('hex')}"`;
};

// ---------------------------------------------------------------------------
// MIME Type Detection
// ---------------------------------------------------------------------------
const MIME_TYPE_MAP: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.avif': 'image/avif',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ogg': 'video/ogg',
  '.mov': 'video/quicktime',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.txt': 'text/plain',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.zip': 'application/zip',
};

export const getMimeType = (filename: string): string => {
  const ext = path.extname(filename).toLowerCase();
  return MIME_TYPE_MAP[ext] ?? 'application/octet-stream';
};

export const isImageMimeType = (mimeType: string): boolean => {
  return ALLOWED_IMAGE_TYPES.includes(mimeType);
};

export const isVideoMimeType = (mimeType: string): boolean => {
  return ALLOWED_VIDEO_TYPES.includes(mimeType);
};

export const isDocumentMimeType = (mimeType: string): boolean => {
  return ALLOWED_DOCUMENT_TYPES.includes(mimeType);
};

// ---------------------------------------------------------------------------
// Size Formatting
// ---------------------------------------------------------------------------
export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

// ---------------------------------------------------------------------------
// Batch Operations
// ---------------------------------------------------------------------------
export const batchKeys = <T>(items: T[], batchSize = 1000): T[][] => {
  const batches: T[][] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }

  return batches;
};

export const extractKeysFromUrls = (urls: string[]): string[] => {
  return urls
    .map((url) => extractKeyFromUrl(url))
    .filter((key): key is string => key !== null);
};

// ---------------------------------------------------------------------------
// Cache Control Headers
// ---------------------------------------------------------------------------
export const getCacheControlHeader = (contentType: ContentType): string => {
  const cacheRules: Record<ContentType, string> = {
    blog: 'public, max-age=3600, s-maxage=7200, stale-while-revalidate=86400',
    page: 'public, max-age=3600, s-maxage=7200, stale-while-revalidate=86400',
    'media-wall': 'public, max-age=31536000, immutable',
    landing: 'public, max-age=1800, s-maxage=3600, stale-while-revalidate=86400',
    seo: 'public, max-age=86400, s-maxage=604800',
    general: 'public, max-age=31536000, immutable',
  };

  return cacheRules[contentType] ?? 'public, max-age=3600';
};

// ---------------------------------------------------------------------------
// Content-Type Specific Validators
// ---------------------------------------------------------------------------
export const validateBlogImage = (metadata: ImageMetadata) => {
  return validateImage(metadata, {
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
    maxWidth: 4096,
    maxHeight: 4096,
    minWidth: 400,
    minHeight: 300,
  });
};

export const validateMediaWallContent = (metadata: FileMetadata) => {
  const isImage = isImageMimeType(metadata.mimeType);
  const isVideo = isVideoMimeType(metadata.mimeType);

  if (!isImage && !isVideo) {
    return {
      valid: false,
      error: 'Media wall content must be image or video',
    };
  }

  if (isImage) {
    return validateImage(metadata as ImageMetadata, {
      maxSizeBytes: 15 * 1024 * 1024, // 15MB
      maxWidth: 3840, // 4K
      maxHeight: 2160,
    });
  }

  return validateFile(metadata, {
    maxSizeBytes: 100 * 1024 * 1024, // 100MB for videos
    allowedMimeTypes: ALLOWED_VIDEO_TYPES,
  });
};

export const validatePageHeroImage = (metadata: ImageMetadata) => {
  return validateImage(metadata, {
    maxSizeBytes: 5 * 1024 * 1024, // 5MB
    maxWidth: 2560,
    maxHeight: 1440,
    minWidth: 1200,
    minHeight: 600,
  });
};

// ---------------------------------------------------------------------------
// Export grouped helpers
// ---------------------------------------------------------------------------
export const storageHelpers = {
  // Validation
  validateFile,
  validateImage,
  validateBlogImage,
  validateMediaWallContent,
  validatePageHeroImage,

  // Path generation
  generateStoragePath,
  sanitizeFilename,
  getBlogImagePath,
  getMediaWallPath,
  getPageHeroPath,
  getLandingPagePath,
  getGeneralUploadPath,

  // URL operations
  buildOptimizedImageUrl,
  extractKeyFromUrl,
  extractKeysFromUrls,

  // MIME types
  getMimeType,
  isImageMimeType,
  isVideoMimeType,
  isDocumentMimeType,

  // Utilities
  generateFileHash,
  generateETag,
  formatBytes,
  batchKeys,
  getCacheControlHeader,
};