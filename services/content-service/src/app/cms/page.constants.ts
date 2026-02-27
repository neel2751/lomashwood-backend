export const PAGE_CACHE_TTL_SECONDS = 900; 

export const PAGE_CACHE_KEYS = {
  LIST: 'cms:page:list',
  DETAIL: (slug: string) => `cms:page:detail:${slug}`,
  BY_ID: (id: string) => `cms:page:id:${id}`,
  PUBLISHED: 'cms:page:published',
} as const;

export const PAGE_DEFAULT_PAGE_SIZE = 25;
export const PAGE_MAX_PAGE_SIZE = 100;
export const PAGE_TITLE_MAX_LENGTH = 255;
export const PAGE_SLUG_MAX_LENGTH = 200;


export const PAGE_SYSTEM_SLUGS = [
  'about-us',
  'why-choose-us',
  'our-process',
  'contact-us',
  'customer-reviews',
  'finance',
  'careers',
  'terms-and-conditions',
  'privacy-policy',
  'cookies',
  'faqs',
] as const;

export type SystemSlug = (typeof PAGE_SYSTEM_SLUGS)[number];

export const PAGE_EVENTS = {
  PUBLISHED: 'page.published',
  UPDATED: 'page.updated',
  UNPUBLISHED: 'page.unpublished',
  DELETED: 'page.deleted',
} as const;

export const PAGE_ERROR_CODES = {
  NOT_FOUND: 'PAGE_NOT_FOUND',
  SLUG_CONFLICT: 'PAGE_SLUG_CONFLICT',
  SYSTEM_SLUG_IMMUTABLE: 'PAGE_SYSTEM_SLUG_IMMUTABLE',
  SYSTEM_PAGE_NO_DELETE: 'PAGE_SYSTEM_PAGE_NO_DELETE',
  INVALID_STATUS_TRANSITION: 'PAGE_INVALID_STATUS_TRANSITION',
  PUBLISH_REQUIRES_CONTENT: 'PAGE_PUBLISH_REQUIRES_CONTENT',
} as const;

export const PAGE_ALLOWED_STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['PUBLISHED'],
  PUBLISHED: ['DRAFT'],
} as const;

export const PAGE_SORT_FIELDS = ['title', 'createdAt', 'updatedAt'] as const;
export const PAGE_SORT_ORDERS = ['asc', 'desc'] as const;