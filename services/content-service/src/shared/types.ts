import type { BLOG, CMS_PAGE, MEDIA, SEO, LANDING } from './constants';



export type UUID = string;
export type ISODateString = string;
export type Slug = string;
export type HexColor = string;
export type Url = string;



export type BlogStatus = keyof typeof BLOG.STATUS;
export type BlogCategory = keyof typeof BLOG.CATEGORY;

export type CmsPageStatus = keyof typeof CMS_PAGE.STATUS;
export type CmsPageType = keyof typeof CMS_PAGE.TYPE;

export type MediaFileType = keyof typeof MEDIA.FILE_TYPE;
export type MediaEntityType = keyof typeof MEDIA.ENTITY_TYPE;

export type SeoEntityType = keyof typeof SEO.ENTITY_TYPE;
export type RobotsDirective = typeof SEO.ROBOTS[keyof typeof SEO.ROBOTS];
export type OgType = typeof SEO.OG_TYPE[keyof typeof SEO.OG_TYPE];

export type LandingStatus = keyof typeof LANDING.STATUS;



export interface AuthenticatedUser {
  id: UUID;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
}

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'CUSTOMER';



export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: ResponseMeta;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    fields?: FieldError[];
  };
}

export interface FieldError {
  field: string;
  message: string;
}

export interface ResponseMeta {
  requestId?: string;
  timestamp?: ISODateString;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;



export interface PaginationQuery {
  page: number;
  limit: number;
}

export interface SortQuery {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface DateRangeFilter {
  from?: ISODateString;
  to?: ISODateString;
}



export interface BlogListFilter extends PaginationQuery, SortQuery {
  status?: BlogStatus;
  category?: BlogCategory;
  tags?: string[];
  authorId?: UUID;
  search?: string;
  dateRange?: DateRangeFilter;
}

export interface BlogDTO {
  id: UUID;
  slug: Slug;
  title: string;
  excerpt: string | null;
  heroImageUrl: Url | null;
  images: Url[];
  content: string;
  tags: string[];
  category: BlogCategory;
  status: BlogStatus;
  readTimeMinutes: number | null;
  authorId: UUID;
  authorName: string;
  publishedAt: ISODateString | null;
  scheduledAt: ISODateString | null;
  seo: SeoMetaDTO | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface BlogSummaryDTO {
  id: UUID;
  slug: Slug;
  title: string;
  excerpt: string | null;
  heroImageUrl: Url | null;
  tags: string[];
  category: BlogCategory;
  status: BlogStatus;
  readTimeMinutes: number | null;
  authorName: string;
  publishedAt: ISODateString | null;
  createdAt: ISODateString;
}

export interface CreateBlogInput {
  title: string;
  slug: Slug;
  excerpt?: string;
  content: string;
  heroImageUrl?: Url;
  images?: Url[];
  tags?: string[];
  category: BlogCategory;
  status?: BlogStatus;
  scheduledAt?: ISODateString;
}

export interface UpdateBlogInput {
  title?: string;
  slug?: Slug;
  excerpt?: string;
  content?: string;
  heroImageUrl?: Url | null;
  images?: Url[];
  tags?: string[];
  category?: BlogCategory;
  status?: BlogStatus;
  scheduledAt?: ISODateString | null;
}



export interface CmsPageDTO {
  id: UUID;
  slug: Slug;
  title: string;
  description: string | null;
  heroImageUrl: Url | null;
  images: Url[];
  content: string;
  pageType: CmsPageType;
  status: CmsPageStatus;
  isIndexable: boolean;
  seo: SeoMetaDTO | null;
  publishedAt: ISODateString | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface CreatePageInput {
  slug: Slug;
  title: string;
  description?: string;
  heroImageUrl?: Url;
  images?: Url[];
  content: string;
  pageType: CmsPageType;
  status?: CmsPageStatus;
  isIndexable?: boolean;
}

export interface UpdatePageInput {
  slug?: Slug;
  title?: string;
  description?: string;
  heroImageUrl?: Url | null;
  images?: Url[];
  content?: string;
  pageType?: CmsPageType;
  status?: CmsPageStatus;
  isIndexable?: boolean;
}



export interface MediaDTO {
  id: UUID;
  entityType: MediaEntityType;
  entityId: UUID;
  url: Url;
  s3Key: string;
  filename: string;
  mimeType: string;
  fileType: MediaFileType;
  sizeBytes: number;
  widthPx: number | null;
  heightPx: number | null;
  durationSeconds: number | null;
  altText: string | null;
  thumbnails: ThumbnailDTO[];
  uploadedBy: UUID;
  uploadedAt: ISODateString;
  createdAt: ISODateString;
}

export interface ThumbnailDTO {
  widthPx: number;
  url: Url;
}

export interface MediaListFilter extends PaginationQuery {
  entityType?: MediaEntityType;
  entityId?: UUID;
  fileType?: MediaFileType;
  search?: string;
}



export interface SeoMetaDTO {
  id: UUID;
  entityType: SeoEntityType;
  entityId: UUID;
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: Url | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImageUrl: Url | null;
  twitterTitle: string | null;
  twitterDescription: string | null;
  twitterImageUrl: Url | null;
  structuredData: string | null;
  robotsDirective: RobotsDirective;
  updatedAt: ISODateString;
}

export interface CreateSeoInput {
  entityType: SeoEntityType;
  entityId: UUID;
  metaTitle: string;
  metaDescription: string;
  canonicalUrl?: Url;
  ogTitle?: string;
  ogDescription?: string;
  ogImageUrl?: Url;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImageUrl?: Url;
  structuredData?: string;
  robotsDirective?: RobotsDirective;
}

export interface UpdateSeoInput {
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: Url | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImageUrl?: Url | null;
  twitterTitle?: string | null;
  twitterDescription?: string | null;
  twitterImageUrl?: Url | null;
  structuredData?: string | null;
  robotsDirective?: RobotsDirective;
}



export interface LandingPageDTO {
  id: UUID;
  slug: Slug;
  title: string;
  description: string | null;
  heroImageUrl: Url | null;
  images: Url[];
  content: string;
  status: LandingStatus;
  isIndexable: boolean;
  seo: SeoMetaDTO | null;
  publishedAt: ISODateString | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface CreateLandingInput {
  slug: Slug;
  title: string;
  description?: string;
  heroImageUrl?: Url;
  images?: Url[];
  content: string;
  status?: LandingStatus;
  isIndexable?: boolean;
}

export interface UpdateLandingInput {
  slug?: Slug;
  title?: string;
  description?: string;
  heroImageUrl?: Url | null;
  images?: Url[];
  content?: string;
  status?: LandingStatus;
  isIndexable?: boolean;
}



export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface SoftDeletable {
  deletedAt: ISODateString | null;
}

export interface Auditable {
  createdAt: ISODateString;
  updatedAt: ISODateString;
  createdBy: UUID;
  updatedBy: UUID;
}

export interface CacheOptions {
  ttlSeconds?: number;
  skipCache?: boolean;
}

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}