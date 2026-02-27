import { MediaWallLayout, ContentStatus } from '@prisma/client';

export { MediaWallLayout, ContentStatus };

export interface MediaWall {
  id: string;
  title: string;
  description: string | null;
  backgroundImageUrl: string | null;
  backgroundImageKey: string | null;
  backgroundVideoUrl: string | null;
  backgroundVideoKey: string | null;
  layout: MediaWallLayout;
  ctaText: string | null;
  ctaUrl: string | null;
  status: ContentStatus;
  sortOrder: number;
  publishedAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  items?: Array<{
    id: string;
    mediaItemId: string;
    sortOrder: number;
    captionTitle: string | null;
    captionBody: string | null;
    linkUrl: string | null;
  }>;
}

export interface MediaWallDto {
  id: string;
  title: string;
  description: string | null;
  backgroundImageUrl: string | null;
  backgroundVideoUrl: string | null;
  layout: MediaWallLayout;
  ctaText: string | null;
  ctaUrl: string | null;
  status: ContentStatus;
  sortOrder: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMediaWallPayload {
  title: string;
  description?: string;
  backgroundImageUrl?: string;
  backgroundImageKey?: string;
  backgroundVideoUrl?: string;
  backgroundVideoKey?: string;
  layout?: MediaWallLayout;
  ctaText?: string;
  ctaUrl?: string;
  status?: ContentStatus;
  sortOrder?: number;
  publishedAt?: Date;
}

export interface UpdateMediaWallPayload {
  title?: string;
  description?: string | null;
  backgroundImageUrl?: string | null;
  backgroundImageKey?: string | null;
  backgroundVideoUrl?: string | null;
  backgroundVideoKey?: string | null;
  layout?: MediaWallLayout;
  ctaText?: string | null;
  ctaUrl?: string | null;
  status?: ContentStatus;
  sortOrder?: number;
  publishedAt?: Date | null;
}

export interface ReorderMediaWallPayload {
  items: Array<{ id: string; sortOrder: number }>;
}

export interface MediaWallListQuery {
  page?: number;
  limit?: number;
  isActive?: boolean;
  sortBy?: 'sortOrder' | 'createdAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedMediaWallResult {
  data: MediaWallDto[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface MediaWallRepository {
  findAll(query: MediaWallListQuery): Promise<PaginatedMediaWallResult>;
  findById(id: string): Promise<MediaWall | null>;
  findActive(): Promise<MediaWall[]>;
  create(payload: CreateMediaWallPayload): Promise<MediaWall>;
  update(id: string, payload: UpdateMediaWallPayload): Promise<MediaWall>;
  reorder(items: Array<{ id: string; sortOrder: number }>): Promise<void>;
  softDelete(id: string): Promise<void>;
  sortOrderExists(sortOrder: number, excludeId?: string): Promise<boolean>;
}

export interface MediaWallService {
  listMedia(query: MediaWallListQuery): Promise<PaginatedMediaWallResult>;
  getMediaById(id: string): Promise<MediaWallDto>;
  getActiveMedia(): Promise<MediaWallDto[]>;
  createMedia(payload: CreateMediaWallPayload): Promise<MediaWallDto>;
  updateMedia(id: string, payload: UpdateMediaWallPayload): Promise<MediaWallDto>;
  reorderMedia(payload: ReorderMediaWallPayload): Promise<void>;
  deleteMedia(id: string): Promise<void>;
}