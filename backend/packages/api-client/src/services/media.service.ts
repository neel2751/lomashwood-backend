import { HttpClient } from '../utils/http';
import { PaginatedResponse } from '../types/api.types';

// ── Missing types (move to api.types.ts and re-export from there if preferred) ──

export interface Media {
  id: string;
  name: string;
  filename: string;
  url: string;
  type: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'AUDIO' | 'OTHER';
  mimeType: string;
  size: number;
  dimensions?: { width: number; height: number };
  duration?: number;
  alt?: string;
  caption?: string;
  category?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateMediaRequest {
  alt?: string;
  caption?: string;
  category?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateMediaRequest {
  name?: string;
  alt?: string;
  caption?: string;
  category?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface MediaFilters {
  type?: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'AUDIO' | 'OTHER';
  mimeType?: string;
  category?: string;
  tags?: string[];
  search?: string;
  startDate?: string;
  endDate?: string;
}

// ── Service ───────────────────────────────────────────────────────────────────

export class MediaService {
  constructor(private HttpClient: HttpClient) {}

  // ── Media Management ─────────────────────────────────────────────────────────

  async getMedia(params?: MediaFilters & {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<Media[]>> {
    return this.HttpClient.get<PaginatedResponse<Media[]>>('/media', { params });
  }

  async getMediaItem(mediaId: string): Promise<Media> {
    return this.HttpClient.get<Media>(`/media/${mediaId}`);
  }

  async uploadMedia(file: File, mediaData?: CreateMediaRequest): Promise<Media> {
    const formData = new FormData();
    formData.append('file', file);

    if (mediaData) {
      Object.entries(mediaData).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(v => formData.append(key, v));
        } else if (typeof value === 'object' && value !== null) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value);
        }
      });
    }

    // Content-Type and onUploadProgress must be handled by the HttpClient
    // interceptor / config layer; post() accepts only 2 args here
    return this.HttpClient.post<Media>('/media/upload', formData);
  }

  async uploadMultipleMedia(files: File[], mediaData?: CreateMediaRequest): Promise<Media[]> {
    const formData = new FormData();

    files.forEach(file => {
      formData.append('files', file);
    });

    if (mediaData) {
      Object.entries(mediaData).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(v => formData.append(key, v));
        } else if (typeof value === 'object' && value !== null) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value);
        }
      });
    }

    // Content-Type set automatically when passing FormData
    return this.HttpClient.post<Media[]>('/media/upload/multiple', formData);
  }

  async updateMedia(mediaId: string, updateData: UpdateMediaRequest): Promise<Media> {
    return this.HttpClient.put<Media>(`/media/${mediaId}`, updateData);
  }

  async deleteMedia(mediaId: string): Promise<void> {
    return this.HttpClient.delete<void>(`/media/${mediaId}`);
  }

  async bulkDeleteMedia(mediaIds: string[]): Promise<void> {
    return this.HttpClient.post<void>('/media/bulk-delete', { mediaIds });
  }

  // ── Media Processing ─────────────────────────────────────────────────────────

  async processMedia(mediaId: string, processingOptions: {
    resize?: {
      width?: number;
      height?: number;
      fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
    };
    crop?: { x: number; y: number; width: number; height: number };
    compress?: { quality?: number; format?: 'jpeg' | 'png' | 'webp' | 'avif' };
    watermark?: {
      text?: string;
      image?: string;
      position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
      opacity?: number;
    };
    optimize?: boolean;
    generateThumbnails?: boolean;
  }): Promise<Media> {
    return this.HttpClient.post<Media>(`/media/${mediaId}/process`, processingOptions);
  }

  async getProcessingJobs(params?: {
    page?: number;
    limit?: number;
    status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    mediaId?: string;
  }): Promise<PaginatedResponse<Array<{
    id: string;
    mediaId: string;
    type: 'RESIZE' | 'COMPRESS' | 'WATERMARK' | 'CONVERT' | 'THUMBNAILS' | 'OPTIMIZE';
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    progress?: number;
    options: any;
    result?: {
      variants: Array<{
        id: string;
        name: string;
        url: string;
        size: number;
        dimensions?: { width: number; height: number };
        format: string;
      }>;
      optimizedSize?: number;
      compressionRatio?: number;
    };
    error?: string;
    createdAt: string;
    startedAt?: string;
    completedAt?: string;
    estimatedCompletion?: string;
  }>>> {
    return this.HttpClient.get<PaginatedResponse<any[]>>('/media/jobs', { params });
  }

  async getProcessingJob(jobId: string): Promise<{
    id: string;
    mediaId: string;
    type: 'RESIZE' | 'COMPRESS' | 'WATERMARK' | 'CONVERT' | 'THUMBNAILS' | 'OPTIMIZE';
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    progress?: number;
    options: any;
    result?: {
      variants: Array<{
        id: string;
        name: string;
        url: string;
        size: number;
        dimensions?: { width: number; height: number };
        format: string;
      }>;
      optimizedSize?: number;
      compressionRatio?: number;
    };
    error?: string;
    createdAt: string;
    startedAt?: string;
    completedAt?: string;
    estimatedCompletion?: string;
  }> {
    return this.HttpClient.get<any>(`/media/jobs/${jobId}`);
  }

  async cancelProcessingJob(jobId: string): Promise<any> {
    return this.HttpClient.post<any>(`/media/jobs/${jobId}/cancel`);
  }

  async retryProcessingJob(jobId: string): Promise<any> {
    return this.HttpClient.post<any>(`/media/jobs/${jobId}/retry`);
  }

  // ── Media Variants ───────────────────────────────────────────────────────────

  async getMediaVariants(mediaId: string): Promise<Array<{
    id: string;
    name: string;
    url: string;
    size: number;
    width?: number;
    height?: number;
    format: string;
    createdAt: string;
  }>> {
    return this.HttpClient.get<any[]>(`/media/${mediaId}/variants`);
  }

  async createMediaVariant(mediaId: string, variantData: {
    name: string;
    options: {
      resize?: {
        width?: number;
        height?: number;
        fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
      };
      compress?: { quality?: number; format?: 'jpeg' | 'png' | 'webp' | 'avif' };
    };
  }): Promise<any> {
    return this.HttpClient.post<any>(`/media/${mediaId}/variants`, variantData);
  }

  async deleteMediaVariant(mediaId: string, variantId: string): Promise<void> {
    return this.HttpClient.delete<void>(`/media/${mediaId}/variants/${variantId}`);
  }

  // ── Media Categories ─────────────────────────────────────────────────────────

  async getMediaCategories(): Promise<Array<{
    id: string;
    name: string;
    description?: string;
    mediaCount: number;
    totalSize: number;
    createdAt: string;
  }>> {
    return this.HttpClient.get<any[]>('/media/categories');
  }

  async createMediaCategory(categoryData: { name: string; description?: string }): Promise<any> {
    return this.HttpClient.post<any>('/media/categories', categoryData);
  }

  async updateMediaCategory(categoryId: string, updateData: {
    name?: string;
    description?: string;
  }): Promise<any> {
    return this.HttpClient.put<any>(`/media/categories/${categoryId}`, updateData);
  }

  async deleteMediaCategory(categoryId: string): Promise<void> {
    return this.HttpClient.delete<void>(`/media/categories/${categoryId}`);
  }

  async getMediaByCategory(categoryId: string, params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<Media[]>> {
    return this.HttpClient.get<PaginatedResponse<Media[]>>(`/media/categories/${categoryId}`, { params });
  }

  // ── Media Tags ───────────────────────────────────────────────────────────────

  async getMediaTags(): Promise<Array<{
    id: string;
    name: string;
    color?: string;
    mediaCount: number;
    createdAt: string;
  }>> {
    return this.HttpClient.get<any[]>('/media/tags');
  }

  async createMediaTag(tagData: { name: string; color?: string }): Promise<any> {
    return this.HttpClient.post<any>('/media/tags', tagData);
  }

  async updateMediaTag(tagId: string, updateData: { name?: string; color?: string }): Promise<any> {
    return this.HttpClient.put<any>(`/media/tags/${tagId}`, updateData);
  }

  async deleteMediaTag(tagId: string): Promise<void> {
    return this.HttpClient.delete<void>(`/media/tags/${tagId}`);
  }

  async addMediaTag(mediaId: string, tagId: string): Promise<void> {
    return this.HttpClient.post<void>(`/media/${mediaId}/tags/${tagId}`);
  }

  async removeMediaTag(mediaId: string, tagId: string): Promise<void> {
    return this.HttpClient.delete<void>(`/media/${mediaId}/tags/${tagId}`);
  }

  // ── Media Search ─────────────────────────────────────────────────────────────

  async searchMedia(query: string, params?: {
    page?: number;
    limit?: number;
    category?: string;
    tags?: string[];
    mimeType?: string;
  }): Promise<PaginatedResponse<Media[]>> {
    return this.HttpClient.get<PaginatedResponse<Media[]>>('/media/search', {
      params: { q: query, ...params },
    });
  }

  // ── Media Analytics ──────────────────────────────────────────────────────────

  async getMediaStats(params?: {
    startDate?: string;
    endDate?: string;
    category?: string;
  }): Promise<{
    totalFiles: number;
    totalSize: number;
    totalUploads: number;
    totalDownloads: number;
    averageFileSize: number;
    filesByType: Record<string, number>;
    filesByCategory: Record<string, number>;
    uploadsByDate: Array<{ date: string; count: number; size: number }>;
    downloadsByDate: Array<{ date: string; count: number }>;
    topFiles: Array<{ id: string; name: string; downloads: number; size: number }>;
    storageUsage: { used: number; available: number; percentage: number };
  }> {
    return this.HttpClient.get<any>('/media/stats', { params });
  }

  async getStorageUsage(): Promise<{
    totalUsed: number;
    totalAvailable: number;
    percentage: number;
    byCategory: Record<string, number>;
    byType: Record<string, number>;
    byDate: Array<{ date: string; uploaded: number; deleted: number; net: number }>;
  }> {
    return this.HttpClient.get<any>('/media/storage');
  }

  // ── Media Download ───────────────────────────────────────────────────────────

  async downloadMedia(mediaId: string, options?: {
    variant?: string;
    filename?: string;
  }): Promise<Blob> {
    return this.HttpClient.get<Blob>(`/media/${mediaId}/download`, {
      params: options,
      responseType: 'blob',
    });
  }

  async getMediaUrl(mediaId: string, options?: {
    variant?: string;
    expiresIn?: number;
    download?: boolean;
  }): Promise<{ url: string; expiresAt?: string }> {
    return this.HttpClient.get<any>(`/media/${mediaId}/url`, { params: options });
  }

  // ── Media Validation ─────────────────────────────────────────────────────────

  async validateMedia(file: File, options?: {
    checkImageIntegrity?: boolean;
    checkVirus?: boolean;
    checkDuplicates?: boolean;
  }): Promise<{
    valid: boolean;
    errors?: string[];
    warnings?: string[];
    fileInfo?: {
      size: number;
      type: string;
      dimensions?: { width: number; height: number };
      duration?: number;
      format: string;
      quality?: number;
    };
    security?: { virusScanned: boolean; virusClean: boolean; threats?: string[] };
    duplicates?: Array<{ id: string; name: string; url: string; similarity: number }>;
  }> {
    const formData = new FormData();
    formData.append('file', file);

    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        formData.append(key, value.toString());
      });
    }

    // Content-Type set automatically when passing FormData
    return this.HttpClient.post<any>('/media/validate', formData);
  }

  // ── Media Backup ─────────────────────────────────────────────────────────────

  async createBackup(mediaIds?: string[]): Promise<{
    backupId: string;
    status: 'CREATING' | 'COMPLETED' | 'FAILED';
    fileCount: number;
    totalSize: number;
    createdAt: string;
  }> {
    return this.HttpClient.post<any>('/media/backup', { mediaIds });
  }

  async getBackupStatus(backupId: string): Promise<{
    backupId: string;
    status: 'CREATING' | 'COMPLETED' | 'FAILED' | 'EXPIRED';
    fileCount: number;
    totalSize: number;
    compressedSize: number;
    downloadUrl?: string;
    expiresAt?: string;
    createdAt: string;
    completedAt?: string;
  }> {
    return this.HttpClient.get<any>(`/media/backup/${backupId}`);
  }

  async downloadBackup(backupId: string): Promise<Blob> {
    return this.HttpClient.get<Blob>(`/media/backup/${backupId}/download`, {
      responseType: 'blob',
    });
  }

  // ── Media Restore ────────────────────────────────────────────────────────────

  async getBackups(params?: {
    page?: number;
    limit?: number;
    status?: 'COMPLETED' | 'FAILED';
  }): Promise<PaginatedResponse<Array<{
    backupId: string;
    status: string;
    fileCount: number;
    totalSize: number;
    createdAt: string;
    completedAt?: string;
  }>>> {
    return this.HttpClient.get<PaginatedResponse<any[]>>('/media/backups', { params });
  }

  async restoreFromBackup(backupId: string, options?: {
    overwrite?: boolean;
    fileIds?: string[];
  }): Promise<{
    restoreId: string;
    status: 'RESTORING' | 'COMPLETED' | 'FAILED';
    fileCount: number;
    restoredCount?: number;
    createdAt: string;
  }> {
    return this.HttpClient.post<any>(`/media/backup/${backupId}/restore`, options);
  }

  async getRestoreStatus(restoreId: string): Promise<{
    restoreId: string;
    status: 'RESTORING' | 'COMPLETED' | 'FAILED';
    fileCount: number;
    restoredCount: number;
    failedCount: number;
    createdAt: string;
    completedAt?: string;
  }> {
    return this.HttpClient.get<any>(`/media/restore/${restoreId}`);
  }

  // ── Media Cleanup ────────────────────────────────────────────────────────────

  async cleanupMedia(options?: {
    olderThan?: string;
    unused?: boolean;
    duplicates?: boolean;
    dryRun?: boolean;
  }): Promise<{
    filesToDelete: Array<{
      id: string;
      name: string;
      size: number;
      lastAccessed: string;
      reason: string;
    }>;
    totalFiles: number;
    totalSize: number;
    dryRun: boolean;
  }> {
    return this.HttpClient.post<any>('/media/cleanup', options);
  }

  async executeCleanup(filesToDelete: string[]): Promise<{
    deletedFiles: string[];
    failedFiles: Array<{ id: string; error: string }>;
    totalDeleted: number;
    totalSize: number;
  }> {
    return this.HttpClient.post<any>('/media/cleanup/execute', { filesToDelete });
  }

  // ── Media Presets ────────────────────────────────────────────────────────────

  async getMediaPresets(): Promise<Array<{
    id: string;
    name: string;
    description?: string;
    category?: string;
    processing: { resize?: any; compress?: any; watermark?: any };
    validation: {
      allowedTypes: string[];
      maxSize: number;
      maxDimensions?: { width: number; height: number };
    };
    isActive: boolean;
    createdAt: string;
  }>> {
    return this.HttpClient.get<any[]>('/media/presets');
  }

  async createMediaPreset(presetData: {
    name: string;
    description?: string;
    category?: string;
    processing: any;
    validation: any;
  }): Promise<any> {
    return this.HttpClient.post<any>('/media/presets', presetData);
  }

  async updateMediaPreset(presetId: string, updateData: {
    name?: string;
    description?: string;
    category?: string;
    processing?: any;
    validation?: any;
  }): Promise<any> {
    return this.HttpClient.put<any>(`/media/presets/${presetId}`, updateData);
  }

  async deleteMediaPreset(presetId: string): Promise<void> {
    return this.HttpClient.delete<void>(`/media/presets/${presetId}`);
  }

  async applyMediaPreset(presetId: string, mediaId: string): Promise<Media> {
    return this.HttpClient.post<Media>(`/media/presets/${presetId}/apply`, { mediaId });
  }

  // ── Media Import / Export ────────────────────────────────────────────────────

  async exportMedia(params?: {
    format?: 'csv' | 'excel' | 'json';
    category?: string;
    tags?: string[];
    startDate?: string;
    endDate?: string;
  }): Promise<Blob> {
    return this.HttpClient.get<Blob>('/media/export', {
      params,
      responseType: 'blob',
    });
  }

  async importMedia(file: File, options?: {
    overwrite?: boolean;
    createMissing?: boolean;
    validateFiles?: boolean;
    category?: string;
    tags?: string[];
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

    // Content-Type set automatically when passing FormData
    return this.HttpClient.post<any>('/media/import', formData);
  }

  // ── Media Settings ───────────────────────────────────────────────────────────

  async getMediaSettings(): Promise<{
    upload: {
      maxFileSize: number;
      allowedTypes: string[];
      requireApproval: boolean;
      autoProcess: boolean;
    };
    storage: {
      provider: 'local' | 'aws' | 'cloudinary' | 'google';
      bucket?: string;
      region?: string;
    };
    processing: {
      autoCompress: boolean;
      autoWatermark: boolean;
      generateThumbnails: boolean;
      thumbnailSizes: Array<{ width: number; height: number; name: string }>;
    };
    security: {
      virusScanning: boolean;
      duplicateDetection: boolean;
      accessControl: boolean;
    };
  }> {
    return this.HttpClient.get<any>('/media/settings');
  }

  async updateMediaSettings(settings: {
    upload?: {
      maxFileSize?: number;
      allowedTypes?: string[];
      requireApproval?: boolean;
      autoProcess?: boolean;
    };
    storage?: {
      provider?: 'local' | 'aws' | 'cloudinary' | 'google';
      bucket?: string;
      region?: string;
    };
    processing?: {
      autoCompress?: boolean;
      autoWatermark?: boolean;
      generateThumbnails?: boolean;
      thumbnailSizes?: Array<{ width: number; height: number; name: string }>;
    };
    security?: {
      virusScanning?: boolean;
      duplicateDetection?: boolean;
      accessControl?: boolean;
    };
  }): Promise<any> {
    return this.HttpClient.put<any>('/media/settings', settings);
  }
}