import { SystemSlug } from './page.constants';


export type PageStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface CmsPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  status: PageStatus;
  isSystem: boolean;
  publishedAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CmsPageSummaryDto {
  id: string;
  slug: string;
  title: string;
  status: PageStatus;
  isSystem: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CmsPageDetailDto extends CmsPageSummaryDto {
  content: string;
}

export interface CreatePagePayload {
  slug: string;
  title: string;
  content: string;
  status?: PageStatus;
  isSystem?: boolean;
}

export interface UpdatePagePayload {
  title?: string;
  slug?: string;
  content?: string;
  status?: PageStatus;
}

export interface PageListQuery {
  page: number;
  limit: number;
  status?: PageStatus;
  isSystem?: boolean;
  search?: string;
  sortBy?: 'title' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedPageResult {
  data: CmsPageSummaryDto[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface PageRepository {
  findAll(query: PageListQuery): Promise<PaginatedPageResult>;
  findById(id: string): Promise<CmsPage | null>;
  findBySlug(slug: string): Promise<CmsPage | null>;
  findAllPublished(): Promise<CmsPage[]>;
  findBySystemSlug(slug: SystemSlug): Promise<CmsPage | null>;
  create(payload: CreatePagePayload): Promise<CmsPage>;
  update(id: string, payload: UpdatePagePayload): Promise<CmsPage>;
  softDelete(id: string): Promise<void>;
  slugExists(slug: string, excludeId?: string): Promise<boolean>;
}

export interface PageService {
  listPages(query: PageListQuery): Promise<PaginatedPageResult>;
  getPageBySlug(slug: string): Promise<CmsPageDetailDto>;
  getPageById(id: string): Promise<CmsPageDetailDto>;
  getPublishedPages(): Promise<CmsPageSummaryDto[]>;
  getSystemPage(slug: SystemSlug): Promise<CmsPageDetailDto>;
  createPage(payload: CreatePagePayload): Promise<CmsPageDetailDto>;
  updatePage(id: string, payload: UpdatePagePayload): Promise<CmsPageDetailDto>;
  deletePage(id: string): Promise<void>;
}