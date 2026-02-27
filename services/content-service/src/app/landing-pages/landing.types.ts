import { LandingTemplate } from './landing.constants';

export enum ContentStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
  SCHEDULED = 'SCHEDULED',
}

export type { LandingTemplate };

export interface LandingPage {
  id: string;
  title: string;
  slug: string;
  headline: string;
  subheadline: string | null;
  status: ContentStatus;
  sections: unknown;
  coverImageUrl: string | null;
  backgroundImageUrl: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface LandingPageSummaryDto {
  id: string;
  slug: string;
  title: string;
  headline: string;
  subheadline: string | null;
  coverImageUrl: string | null;
  status: ContentStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LandingPageDetailDto extends LandingPageSummaryDto {
  backgroundImageUrl: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  sections: unknown;
}

export interface PaginatedLandingResult {
  data: LandingPageSummaryDto[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface CreateLandingPagePayload {
  slug: string;
  title: string;
  headline: string;
  subheadline?: string;
  coverImageUrl?: string;
  backgroundImageUrl?: string;
  sections?: unknown;
  status?: ContentStatus;
  metaTitle?: string;
  metaDescription?: string;
}

export interface UpdateLandingPagePayload {
  slug?: string;
  title?: string;
  headline?: string;
  subheadline?: string | null;
  coverImageUrl?: string | null;
  backgroundImageUrl?: string | null;
  sections?: unknown;
  status?: ContentStatus;
  metaTitle?: string | null;
  metaDescription?: string | null;
}

export interface LandingListQuery {
  page: number;
  limit: number;
  status?: ContentStatus;
  search?: string;
  sortBy?: 'title' | 'createdAt' | 'updatedAt' | 'publishedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface LandingRepository {
  findAll(query: LandingListQuery): Promise<PaginatedLandingResult>;
  findById(id: string): Promise<LandingPage | null>;
  findBySlug(slug: string): Promise<LandingPage | null>;
  findActive(): Promise<LandingPage[]>;
  create(payload: CreateLandingPagePayload): Promise<LandingPage>;
  update(id: string, payload: UpdateLandingPagePayload): Promise<LandingPage>;
  softDelete(id: string): Promise<void>;
  slugExists(slug: string, excludeId?: string): Promise<boolean>;
}

export interface LandingService {
  listLandingPages(query: LandingListQuery): Promise<PaginatedLandingResult>;
  getLandingBySlug(slug: string): Promise<LandingPageDetailDto>;
  getLandingById(id: string): Promise<LandingPageDetailDto>;
  getActiveLandingPages(): Promise<LandingPageSummaryDto[]>;
  createLandingPage(payload: CreateLandingPagePayload): Promise<LandingPageDetailDto>;
  updateLandingPage(id: string, payload: UpdateLandingPagePayload): Promise<LandingPageDetailDto>;
  deleteLandingPage(id: string): Promise<void>;
}