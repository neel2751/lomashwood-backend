export type ContentStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED';

export type ContentType = 'BLOG' | 'PAGE' | 'LANDING_PAGE' | 'FAQ' | 'TESTIMONIAL' | 'BANNER' | 'MEDIA';

export type BannerType = 'HERO_SLIDER' | 'OFFER_SLIDER' | 'ANNOUNCEMENT' | 'PROMOTIONAL';

export type MenuLocation = 'HEADER_NAV' | 'HAMBURGER' | 'FOOTER' | 'SIDEBAR';

export type MenuItemType = 'LINK' | 'DROPDOWN' | 'BUTTON' | 'DIVIDER';

export type TestimonialType = 'TEXT' | 'IMAGE' | 'VIDEO';

export type TestimonialCategory = 'KITCHEN' | 'BEDROOM' | 'GENERAL';

export type MediaType = 'IMAGE' | 'VIDEO' | 'DOCUMENT';

export type SeoEntityType = 'BLOG' | 'PAGE' | 'PRODUCT' | 'CATEGORY' | 'SHOWROOM';

export interface Blog {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly content: string;
  readonly excerpt: string | null;
  readonly coverImage: string | null;
  readonly authorId: string;
  readonly status: ContentStatus;
  readonly tags: readonly string[];
  readonly categoryId: string | null;
  readonly scheduledAt: Date | null;
  readonly publishedAt: Date | null;
  readonly seo: SeoMeta | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;
}

export interface BlogSummary {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly excerpt: string | null;
  readonly coverImage: string | null;
  readonly authorId: string;
  readonly status: ContentStatus;
  readonly tags: readonly string[];
  readonly publishedAt: Date | null;
  readonly createdAt: Date;
}

export interface Page {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly content: string;
  readonly status: ContentStatus;
  readonly publishedAt: Date | null;
  readonly seo: SeoMeta | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;
}

export interface MediaWall {
  readonly id: string;
  readonly title: string;
  readonly description: string | null;
  readonly backgroundImage: string | null;
  readonly items: readonly MediaWallItem[];
  readonly isActive: boolean;
  readonly updatedAt: Date;
}

export interface MediaWallItem {
  readonly id: string;
  readonly mediaWallId: string;
  readonly mediaId: string;
  readonly mediaUrl: string;
  readonly mediaType: MediaType;
  readonly caption: string | null;
  readonly position: number;
}

export interface Media {
  readonly id: string;
  readonly title: string;
  readonly type: MediaType;
  readonly url: string;
  readonly cdnUrl: string | null;
  readonly altText: string | null;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly width: number | null;
  readonly height: number | null;
  readonly folder: string | null;
  readonly uploadedBy: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;
}

export interface SeoMeta {
  readonly id: string;
  readonly entityId: string;
  readonly entityType: SeoEntityType;
  readonly metaTitle: string | null;
  readonly metaDescription: string | null;
  readonly canonicalUrl: string | null;
  readonly ogTitle: string | null;
  readonly ogDescription: string | null;
  readonly ogImage: string | null;
  readonly twitterCard: string | null;
  readonly twitterTitle: string | null;
  readonly twitterDescription: string | null;
  readonly structuredData: string | null;
  readonly noIndex: boolean;
  readonly noFollow: boolean;
  readonly updatedAt: Date;
}

export interface SeoDefaults {
  readonly defaultMetaTitle: string | null;
  readonly defaultMetaDescription: string | null;
  readonly defaultOgImage: string | null;
  readonly googleTagManagerId: string | null;
  readonly googleAnalyticsId: string | null;
  readonly googleSearchConsoleVerification: string | null;
  readonly updatedAt: Date;
}

export interface Banner {
  readonly id: string;
  readonly title: string;
  readonly description: string | null;
  readonly imageUrl: string;
  readonly buttonText: string | null;
  readonly buttonUrl: string | null;
  readonly badgeText: string | null;
  readonly type: BannerType;
  readonly position: number;
  readonly isActive: boolean;
  readonly validFrom: Date | null;
  readonly validTo: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface MenuItem {
  readonly id: string;
  readonly menuId: string;
  readonly label: string;
  readonly url: string | null;
  readonly type: MenuItemType;
  readonly badge: string | null;
  readonly position: number;
  readonly parentId: string | null;
  readonly children: readonly MenuItem[];
  readonly isExternal: boolean;
}

export interface Menu {
  readonly id: string;
  readonly name: string;
  readonly location: MenuLocation;
  readonly items: readonly MenuItem[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface FaqCategory {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly position: number;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface Faq {
  readonly id: string;
  readonly question: string;
  readonly answer: string;
  readonly categoryId: string;
  readonly position: number;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface Testimonial {
  readonly id: string;
  readonly customerName: string;
  readonly location: string | null;
  readonly rating: number;
  readonly title: string | null;
  readonly content: string;
  readonly videoUrl: string | null;
  readonly thumbnailUrl: string | null;
  readonly beforeImages: readonly string[];
  readonly afterImages: readonly string[];
  readonly type: TestimonialType;
  readonly category: TestimonialCategory;
  readonly isActive: boolean;
  readonly isFeatured: boolean;
  readonly displayPosition: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;
}

export interface HomeSlide {
  readonly id: string;
  readonly title: string;
  readonly description: string | null;
  readonly imageUrl: string;
  readonly buttonText: string | null;
  readonly buttonUrl: string | null;
  readonly position: number;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface Accreditation {
  readonly id: string;
  readonly name: string;
  readonly logoUrl: string;
  readonly url: string | null;
  readonly position: number;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface Logo {
  readonly id: string;
  readonly name: string;
  readonly logoUrl: string;
  readonly position: number;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface ContentSearchResult {
  readonly id: string;
  readonly type: ContentType;
  readonly title: string;
  readonly excerpt: string | null;
  readonly url: string;
  readonly imageUrl: string | null;
  readonly publishedAt: Date | null;
  readonly score: number;
}

export interface ContentSearchResponse {
  readonly results: readonly ContentSearchResult[];
  readonly total: number;
  readonly pagination: PaginationMeta;
}

export interface PaginationMeta {
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
  readonly hasNextPage: boolean;
  readonly hasPrevPage: boolean;
}

export interface BlogPublishedEventPayload {
  readonly blogId: string;
  readonly slug: string;
  readonly title: string;
  readonly authorId: string;
  readonly publishedAt: Date;
}

export interface BlogUpdatedEventPayload {
  readonly blogId: string;
  readonly slug: string;
  readonly updatedFields: readonly string[];
  readonly updatedAt: Date;
}

export interface MediaUploadedEventPayload {
  readonly mediaId: string;
  readonly type: MediaType;
  readonly url: string;
  readonly folder: string | null;
  readonly uploadedBy: string;
  readonly uploadedAt: Date;
}

export interface PagePublishedEventPayload {
  readonly pageId: string;
  readonly slug: string;
  readonly title: string;
  readonly publishedAt: Date;
}

export interface SeoUpdatedEventPayload {
  readonly entityId: string;
  readonly entityType: SeoEntityType;
  readonly updatedAt: Date;
}