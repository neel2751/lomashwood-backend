export const SEO_CACHE_TTL_SECONDS = 1800; 

export const SEO_CACHE_KEYS = {
  BY_ENTITY: (entityType: string, entityId: string) =>
    `seo:entity:${entityType}:${entityId}`,
  BY_SLUG: (entityType: string, slug: string) =>
    `seo:slug:${entityType}:${slug}`,
  LIST: 'seo:list',
} as const;


export const SEO_ENTITY_TYPES = [
  'blog',
  'page',
  'product',
  'category',
  'landing-page',
  'showroom',
  'offer',
] as const;

export type SeoEntityType = (typeof SEO_ENTITY_TYPES)[number];


export const SEO_META_TITLE_MAX_LENGTH = 70;
export const SEO_META_DESCRIPTION_MAX_LENGTH = 160;
export const SEO_OG_TITLE_MAX_LENGTH = 95;
export const SEO_OG_DESCRIPTION_MAX_LENGTH = 200;
export const SEO_CANONICAL_URL_MAX_LENGTH = 2048;



export const SEO_ROBOTS_VALUES = [
  'index,follow',
  'index,nofollow',
  'noindex,follow',
  'noindex,nofollow',
] as const;

export type SeoRobotsValue = (typeof SEO_ROBOTS_VALUES)[number];

export const SEO_DEFAULT_ROBOTS: SeoRobotsValue = 'index,follow';



export const SEO_EVENTS = {
  CREATED: 'seo.created',
  UPDATED: 'seo.updated',
  DELETED: 'seo.deleted',
} as const;



export const SEO_ERROR_CODES = {
  NOT_FOUND: 'SEO_NOT_FOUND',
  DUPLICATE_ENTITY: 'SEO_DUPLICATE_ENTITY',
  INVALID_ENTITY_TYPE: 'SEO_INVALID_ENTITY_TYPE',
} as const;



export const SEO_DEFAULT_PAGE_SIZE = 50;
export const SEO_MAX_PAGE_SIZE = 200;