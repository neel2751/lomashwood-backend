export const BLOG_CACHE_TTL_SECONDS = 300; 

export const BLOG_CACHE_KEYS = {
  LIST: 'blog:list',
  DETAIL: (slug: string) => `blog:detail:${slug}`,
  FEATURED: 'blog:featured',
  BY_CATEGORY: (categoryId: string) => `blog:category:${categoryId}`,
} as const;

export const BLOG_DEFAULT_PAGE_SIZE = 12;
export const BLOG_MAX_PAGE_SIZE = 50;
export const BLOG_SLUG_MAX_LENGTH = 200;
export const BLOG_TITLE_MAX_LENGTH = 255;
export const BLOG_EXCERPT_MAX_LENGTH = 500;

export const BLOG_EVENTS = {
  PUBLISHED: 'blog.published',
  UPDATED: 'blog.updated',
  UNPUBLISHED: 'blog.unpublished',
  DELETED: 'blog.deleted',
} as const;

export const BLOG_ERROR_CODES = {
  NOT_FOUND: 'BLOG_NOT_FOUND',
  SLUG_CONFLICT: 'BLOG_SLUG_CONFLICT',
  CATEGORY_NOT_FOUND: 'BLOG_CATEGORY_NOT_FOUND',
  INVALID_STATUS_TRANSITION: 'BLOG_INVALID_STATUS_TRANSITION',
  PUBLISH_REQUIRES_CONTENT: 'BLOG_PUBLISH_REQUIRES_CONTENT',
} as const;

export const BLOG_ALLOWED_STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['PUBLISHED', 'ARCHIVED'],
  PUBLISHED: ['DRAFT', 'ARCHIVED'],
  ARCHIVED: ['DRAFT'],
} as const;

export const BLOG_SORT_FIELDS = ['publishedAt', 'createdAt', 'title'] as const;
export const BLOG_SORT_ORDERS = ['asc', 'desc'] as const;