import { HttpClient } from '../utils/http';
import {
  PaginatedResponse,
  UploadedFile,
  CreateUploadRequest,
  UpdateUploadRequest,
  UploadFilters,
  UploadStats,
  FileProcessingJob,
  CreateProcessingJobRequest,
} from '../types/api.types';

export class UploadService {
  constructor(private apiClient: HttpClient) {}

  // File Upload
  async uploadFile(file: File, metadata?: CreateUploadRequest): Promise<UploadedFile> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        if (key === 'processing' && typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else if (Array.isArray(value)) {
          value.forEach((item, index) => {
            formData.append(`${key}[${index}]`, item);
          });
        } else if (typeof value === 'object' && value !== null) {
          Object.entries(value).forEach(([subKey, subValue]) => {
            formData.append(`${key}[${subKey}]`, String(subValue));
          });
        } else {
          formData.append(key, String(value));
        }
      });
    }

    return this.apiClient.upload<UploadedFile>('/uploads', formData);
  }

  async uploadMultipleFiles(files: File[], metadata?: CreateUploadRequest): Promise<UploadedFile[]> {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`files[${index}]`, file);
    });

    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        if (key === 'processing' && typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else if (Array.isArray(value)) {
          value.forEach((item, index) => {
            formData.append(`${key}[${index}]`, item);
          });
        } else if (typeof value === 'object' && value !== null) {
          Object.entries(value).forEach(([subKey, subValue]) => {
            formData.append(`${key}[${subKey}]`, String(subValue));
          });
        } else {
          formData.append(key, String(value));
        }
      });
    }

    return this.apiClient.upload<UploadedFile[]>('/uploads/multiple', formData);
  }

  async getUploadProgress(fileId: string): Promise<{
    fileId: string;
    progress: number;
    bytesUploaded: number;
    totalBytes: number;
    speed: number;
    estimatedTimeRemaining: number;
    status: 'uploading' | 'processing' | 'completed' | 'failed' | 'paused';
  }> {
    return this.apiClient.get<any>(`/uploads/${fileId}/progress`);
  }

  async pauseUpload(fileId: string): Promise<void> {
    return this.apiClient.post<void>(`/uploads/${fileId}/pause`, {});
  }

  async resumeUpload(fileId: string): Promise<void> {
    return this.apiClient.post<void>(`/uploads/${fileId}/resume`, {});
  }

  async cancelUpload(fileId: string): Promise<void> {
    return this.apiClient.delete<void>(`/uploads/${fileId}`);
  }

  // File Management
  async getFiles(params?: UploadFilters & {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<UploadedFile[]>> {
    return this.apiClient.get<PaginatedResponse<UploadedFile[]>>('/uploads', { params });
  }

  async getFile(fileId: string): Promise<UploadedFile> {
    return this.apiClient.get<UploadedFile>(`/uploads/${fileId}`);
  }

  async getFileByUrl(url: string): Promise<UploadedFile> {
    return this.apiClient.get<UploadedFile>('/uploads/by-url', { params: { url } });
  }

  async updateFile(fileId: string, updateData: UpdateUploadRequest): Promise<UploadedFile> {
    return this.apiClient.put<UploadedFile>(`/uploads/${fileId}`, updateData);
  }

  async deleteFile(fileId: string): Promise<void> {
    return this.apiClient.delete<void>(`/uploads/${fileId}`);
  }

  async deleteFiles(fileIds: string[]): Promise<void> {
    return this.apiClient.post<void>('/uploads/bulk-delete', { fileIds });
  }

  // File Download
  async downloadFile(fileId: string): Promise<Blob> {
    return this.apiClient.getBlob(`/uploads/${fileId}/download`);
  }

  async downloadFiles(fileIds: string[], format?: 'zip' | 'tar'): Promise<Blob> {
    return this.apiClient.getBlob('/uploads/bulk-download', {
      params: { fileIds: fileIds.join(','), format }
    });
  }

  async getDownloadUrl(fileId: string, expiresInSeconds?: number): Promise<{
    url: string;
    expiresAt: string;
  }> {
    return this.apiClient.get<any>(`/uploads/${fileId}/download-url`, {
      params: { expiresInSeconds }
    });
  }

  // File Processing
  async getProcessingJobs(params?: {
    fileId?: string;
    type?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<FileProcessingJob[]>> {
    return this.apiClient.get<PaginatedResponse<FileProcessingJob[]>>('/uploads/processing/jobs', { params });
  }

  async getProcessingJob(jobId: string): Promise<FileProcessingJob> {
    return this.apiClient.get<FileProcessingJob>(`/uploads/processing/jobs/${jobId}`);
  }

  async createProcessingJob(jobData: CreateProcessingJobRequest): Promise<FileProcessingJob> {
    return this.apiClient.post<FileProcessingJob>('/uploads/processing/jobs', jobData);
  }

  async cancelProcessingJob(jobId: string): Promise<void> {
    return this.apiClient.delete<void>(`/uploads/processing/jobs/${jobId}`);
  }

  async retryProcessingJob(jobId: string): Promise<FileProcessingJob> {
    return this.apiClient.post<FileProcessingJob>(`/uploads/processing/jobs/${jobId}/retry`, {});
  }

  // File Thumbnails
  async getFileThumbnails(fileId: string): Promise<Array<{
    url: string;
    width: number;
    height: number;
    size: number;
  }>> {
    return this.apiClient.get<Array<any>>(`/uploads/${fileId}/thumbnails`);
  }

  async generateThumbnail(fileId: string, options: {
    width: number;
    height: number;
    quality?: number;
    format?: 'jpeg' | 'png' | 'webp';
  }): Promise<{
    url: string;
    width: number;
    height: number;
    size: number;
  }> {
    return this.apiClient.post<any>(`/uploads/${fileId}/thumbnails`, options);
  }

  async deleteThumbnail(fileId: string, thumbnailId: string): Promise<void> {
    return this.apiClient.delete<void>(`/uploads/${fileId}/thumbnails/${thumbnailId}`);
  }

  // File Metadata
  async getFileMetadata(fileId: string): Promise<{
    basic: {
      filename: string;
      mimetype: string;
      size: number;
      hash: string;
    };
    technical: {
      width?: number;
      height?: number;
      duration?: number;
      format?: string;
      quality?: number;
      bitrate?: number;
      framerate?: number;
      channels?: number;
      sampleRate?: number;
    };
    exif?: Record<string, any>;
    custom: Record<string, any>;
  }> {
    return this.apiClient.get<any>(`/uploads/${fileId}/metadata`);
  }

  async updateFileMetadata(fileId: string, metadata: {
    custom?: Record<string, any>;
    exif?: Record<string, any>;
  }): Promise<UploadedFile> {
    return this.apiClient.put<UploadedFile>(`/uploads/${fileId}/metadata`, metadata);
  }

  async extractFileMetadata(fileId: string): Promise<{
    extracted: Record<string, any>;
    errors?: string[];
  }> {
    return this.apiClient.post<any>(`/uploads/${fileId}/metadata/extract`, {});
  }

  // File Security
  async scanFile(fileId: string): Promise<{
    scanned: boolean;
    scanResult: 'clean' | 'infected' | 'suspicious';
    scanDate: string;
    virusName?: string;
    threats?: Array<{
      type: string;
      name: string;
      severity: 'low' | 'medium' | 'high';
      description: string;
    }>;
  }> {
    return this.apiClient.post<any>(`/uploads/${fileId}/scan`, {});
  }

  async getScanResult(fileId: string): Promise<{
    scanned: boolean;
    scanResult?: 'clean' | 'infected' | 'suspicious';
    scanDate?: string;
    virusName?: string;
    threats?: Array<{
      type: string;
      name: string;
      severity: 'low' | 'medium' | 'high';
      description: string;
    }>;
  }> {
    return this.apiClient.get<any>(`/uploads/${fileId}/scan`);
  }

  // File Access Control
  async grantFileAccess(fileId: string, access: {
    allowedUsers?: string[];
    allowedRoles?: string[];
    expiresAt?: string;
    maxDownloads?: number;
  }): Promise<UploadedFile> {
    return this.apiClient.put<UploadedFile>(`/uploads/${fileId}/access`, access);
  }

  async revokeFileAccess(fileId: string, userIds?: string[], roleIds?: string[]): Promise<UploadedFile> {
    return this.apiClient.post<UploadedFile>(`/uploads/${fileId}/access/revoke`, { userIds, roleIds });
  }

  async getFileAccess(fileId: string): Promise<{
    isPublic: boolean;
    allowedUsers: Array<{
      id: string;
      name: string;
      email: string;
    }>;
    allowedRoles: Array<{
      id: string;
      name: string;
    }>;
    expiresAt?: string;
    maxDownloads?: number;
    downloadCount: number;
  }> {
    return this.apiClient.get<any>(`/uploads/${fileId}/access`);
  }

  // File Search
  async searchFiles(query: string, params?: {
    page?: number;
    limit?: number;
    filters?: UploadFilters;
  }): Promise<PaginatedResponse<UploadedFile[]>> {
    return this.apiClient.get<PaginatedResponse<UploadedFile[]>>('/uploads/search', {
      params: { query, ...params }
    });
  }

  // File Analytics
  async getUploadAnalytics(params?: {
    startDate?: string;
    endDate?: string;
    groupBy?: 'day' | 'week' | 'month';
    metrics?: string[];
    filters?: UploadFilters;
  }): Promise<{
    summary: {
      totalUploads: number;
      totalSize: number;
      uniqueUploaders: number;
      avgFileSize: number;
      storageUsed: number;
      bandwidthUsed: number;
      processingTime: number;
    };
    trends: Array<{
      date: string;
      uploads: number;
      size: number;
      uniqueUploaders: number;
      avgFileSize: number;
      storageUsed: number;
      bandwidthUsed: number;
    }>;
    byType: Array<{
      mimetype: string;
      uploads: number;
      size: number;
      percentage: number;
    }>;
    byCategory: Array<{
      category: string;
      uploads: number;
      size: number;
      percentage: number;
    }>;
    byStatus: Array<{
      status: string;
      uploads: number;
      size: number;
      percentage: number;
    }>;
    topUploaders: Array<{
      user: {
        id: string;
        name: string;
      };
      uploads: number;
      size: number;
      avgFileSize: number;
    }>;
    processingStats: {
      avgProcessingTime: number;
      successRate: number;
      failureRate: number;
      jobsByType: Array<{
        type: string;
        count: number;
        avgTime: number;
        successRate: number;
      }>;
    };
  }> {
    return this.apiClient.get<any>('/uploads/analytics', { params });
  }

  async getUploadStats(): Promise<UploadStats> {
    return this.apiClient.get<UploadStats>('/uploads/stats');
  }

  // File Categories
  async getUploadCategories(): Promise<Array<{
    id: string;
    name: string;
    description?: string;
    fileCount: number;
    totalSize: number;
    allowedTypes: string[];
    maxSize: number;
    isActive: boolean;
  }>> {
    return this.apiClient.get<Array<any>>('/uploads/categories');
  }

  async createUploadCategory(categoryData: {
    name: string;
    description?: string;
    allowedTypes?: string[];
    maxSize?: number;
    isActive?: boolean;
  }): Promise<any> {
    return this.apiClient.post<any>('/uploads/categories', categoryData);
  }

  async updateUploadCategory(categoryId: string, updateData: {
    name?: string;
    description?: string;
    allowedTypes?: string[];
    maxSize?: number;
    isActive?: boolean;
  }): Promise<any> {
    return this.apiClient.put<any>(`/uploads/categories/${categoryId}`, updateData);
  }

  async deleteUploadCategory(categoryId: string): Promise<void> {
    return this.apiClient.delete<void>(`/uploads/categories/${categoryId}`);
  }

  // File Tags
  async getUploadTags(): Promise<Array<{
    id: string;
    name: string;
    color?: string;
    fileCount: number;
  }>> {
    return this.apiClient.get<Array<any>>('/uploads/tags');
  }

  async createUploadTag(tagData: {
    name: string;
    color?: string;
  }): Promise<any> {
    return this.apiClient.post<any>('/uploads/tags', tagData);
  }

  async updateUploadTag(tagId: string, updateData: {
    name?: string;
    color?: string;
  }): Promise<any> {
    return this.apiClient.put<any>(`/uploads/tags/${tagId}`, updateData);
  }

  async deleteUploadTag(tagId: string): Promise<void> {
    return this.apiClient.delete<void>(`/uploads/tags/${tagId}`);
  }

  // File Export
  async exportUploads(params?: {
    format?: 'csv' | 'excel' | 'json';
    filters?: UploadFilters;
    fields?: string[];
    includeMetadata?: boolean;
    includeThumbnails?: boolean;
  }): Promise<Blob> {
    return this.apiClient.getBlob('/uploads/export', { params });
  }

  // File Cleanup
  async cleanupExpiredFiles(): Promise<{
    deletedCount: number;
    deletedFiles: Array<{
      id: string;
      filename: string;
      size: number;
      expiredAt: string;
    }>;
  }> {
    return this.apiClient.post<any>('/uploads/cleanup/expired', {});
  }

  async cleanupFailedUploads(): Promise<{
    deletedCount: number;
    deletedFiles: Array<{
      id: string;
      filename: string;
      failedAt: string;
      error?: string;
    }>;
  }> {
    return this.apiClient.post<any>('/uploads/cleanup/failed', {});
  }

  async cleanupOrphanedFiles(): Promise<{
    deletedCount: number;
    deletedFiles: Array<{
      id: string;
      filename: string;
      size: number;
      orphanedAt: string;
    }>;
  }> {
    return this.apiClient.post<any>('/uploads/cleanup/orphaned', {});
  }
}
