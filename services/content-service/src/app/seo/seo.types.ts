import { SeoEntityType, SeoRobotsValue } from './seo.constants';

export type { SeoEntityType, SeoRobotsValue };

export interface SeoMeta {
  id: string;
  pagePath: string;
  title: string;
  description: string | null;
  keywords: string[];
  ogTitle: string | null;
  ogDescription: string | null;
  ogImageUrl: string | null;
  twitterTitle: string | null;
  twitterDescription: string | null;
  twitterImageUrl: string | null;
  canonicalUrl: string | null;
  indexStatus: string;
  structuredData: any | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SeoMetaDto {
  id: string;
  pagePath: string;
  title: string;
  description: string | null;
  keywords: string[];
  ogTitle: string | null;
  ogDescription: string | null;
  ogImageUrl: string | null;
  twitterTitle: string | null;
  twitterDescription: string | null;
  twitterImageUrl: string | null;
  canonicalUrl: string | null;
  indexStatus: string;
  structuredData: any | null;
  createdAt: string;
  updatedAt: string;
}

export interface SeoMetaEmbedDto {
  title: string | null;
  description: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImageUrl: string | null;
  canonicalUrl: string | null;
  twitterTitle: string | null;
  twitterDescription: string | null;
  twitterImageUrl: string | null;
}



export interface PaginatedSeoResult {
  data: SeoMetaDto[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}



export interface CreateSeoMetaPayload {
  entityType: SeoEntityType;
  entityId: string;
  metaTitle?: string;
  metaDescription?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonicalUrl?: string;
  robots?: SeoRobotsValue;
}

export interface UpdateSeoMetaPayload {
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
  canonicalUrl?: string | null;
  robots?: SeoRobotsValue;
}


export interface UpsertSeoMetaPayload extends CreateSeoMetaPayload {}

export interface SeoListQuery {
  page: number;
  limit: number;
  entityType?: SeoEntityType;
  search?: string;
}



export interface SeoRepository {
  findAll(query: SeoListQuery): Promise<PaginatedSeoResult>;
  findById(id: string): Promise<SeoMeta | null>;
  findByEntity(entityType: SeoEntityType, entityId: string): Promise<SeoMeta | null>;
  upsert(payload: UpsertSeoMetaPayload): Promise<SeoMeta>;
  update(id: string, payload: UpdateSeoMetaPayload): Promise<SeoMeta>;
  delete(id: string): Promise<void>;
  entityRecordExists(entityType: SeoEntityType, entityId: string, excludeId?: string): Promise<boolean>;
}



export interface SeoService {
  listSeoMeta(query: SeoListQuery): Promise<PaginatedSeoResult>;
  getSeoById(id: string): Promise<SeoMetaDto>;
  getSeoByEntity(entityType: SeoEntityType, entityId: string): Promise<SeoMetaDto>;
  upsertSeo(payload: UpsertSeoMetaPayload): Promise<SeoMetaDto>;
  updateSeo(id: string, payload: UpdateSeoMetaPayload): Promise<SeoMetaDto>;
  deleteSeo(id: string): Promise<void>;
}