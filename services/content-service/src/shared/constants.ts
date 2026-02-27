

export const SERVICE_NAME = 'content-service' as const;
export const API_VERSION = 'v1' as const;
export const SERVICE_VERSION = '1.0.0' as const;



export const BLOG = {
  STATUS: {
    DRAFT:     'DRAFT',
    SCHEDULED: 'SCHEDULED',
    PUBLISHED: 'PUBLISHED',
    ARCHIVED:  'ARCHIVED',
  },

  CATEGORY: {
    KITCHEN:  'KITCHEN',
    BEDROOM:  'BEDROOM',
    GENERAL:  'GENERAL',
  },


  WORDS_PER_MINUTE: 200,

  
  META_DESCRIPTION_MAX_LENGTH: 160,


  META_TITLE_MAX_LENGTH: 70,


  MAX_TAGS: 10,

 
  TITLE_MAX_LENGTH: 200,


  EXCERPT_MAX_LENGTH: 500,

  
  SLUG_PATTERN: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,

  LIST_CACHE_TTL_SECONDS: 300,


  DETAIL_CACHE_TTL_SECONDS: 600,
} as const;



export const CMS_PAGE = {
  STATUS: {
    DRAFT:     'DRAFT',
    PUBLISHED: 'PUBLISHED',
    ARCHIVED:  'ARCHIVED',
  },

  TYPE: {
    FINANCE:          'FINANCE',
    ABOUT:            'ABOUT',
    OUR_PROCESS:      'OUR_PROCESS',
    WHY_CHOOSE_US:    'WHY_CHOOSE_US',
    CONTACT:          'CONTACT',
    CAREERS:          'CAREERS',
    MEDIA_WALL:       'MEDIA_WALL',
    CUSTOMER_REVIEWS: 'CUSTOMER_REVIEWS',
    TERMS_CONDITIONS: 'TERMS_CONDITIONS',
    PRIVACY_POLICY:   'PRIVACY_POLICY',
    COOKIES:          'COOKIES',
    LANDING:          'LANDING',
    CUSTOM:           'CUSTOM',
  },

  TITLE_MAX_LENGTH: 200,

  CACHE_TTL_SECONDS: 900,
} as const;



export const MEDIA = {
  FILE_TYPE: {
    IMAGE:    'IMAGE',
    VIDEO:    'VIDEO',
    DOCUMENT: 'DOCUMENT',
    OTHER:    'OTHER',
  },

  ENTITY_TYPE: {
    BLOG:         'BLOG',
    PAGE:         'PAGE',
    PRODUCT:      'PRODUCT',
    MEDIA_WALL:   'MEDIA_WALL',
    SHOWROOM:     'SHOWROOM',
    LANDING:      'LANDING',
    HOME_SLIDER:  'HOME_SLIDER',
    BROCHURE:     'BROCHURE',
  },

  MAX_SIZE_BYTES: 50 * 1024 * 1024,

  THUMBNAIL_MIN_SIZE_BYTES: 100 * 1024,

  THUMBNAIL_WIDTHS_PX: [320, 640, 1024, 1920] as const,

  ALLOWED_MIME_TYPES: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',
  ] as const,

  IMAGE_MIME_TYPES: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
  ] as const,

  VIDEO_MIME_TYPES: [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',
  ] as const,

  SIGNED_URL_EXPIRY_SECONDS: 3_600,

  LIST_CACHE_TTL_SECONDS: 300,
} as const;



export const SEO = {
  ENTITY_TYPE: {
    BLOG:       'BLOG',
    PAGE:       'PAGE',
    PRODUCT:    'PRODUCT',
    LANDING:    'LANDING',
    MEDIA_WALL: 'MEDIA_WALL',
    SHOWROOM:   'SHOWROOM',
  },

  ROBOTS: {
    INDEX_FOLLOW:   'index,follow',
    NOINDEX_FOLLOW: 'noindex,follow',
    INDEX_NOFOLLOW: 'index,nofollow',
    NOINDEX_ALL:    'noindex,nofollow',
  },

  OG_TYPE: {
    ARTICLE: 'article',
    WEBSITE: 'website',
    PRODUCT: 'product',
  },

  META_TITLE_MAX_LENGTH:       70,
  META_DESCRIPTION_MAX_LENGTH: 160,
  OG_TITLE_MAX_LENGTH:         95,
  OG_DESCRIPTION_MAX_LENGTH:   200,

  CACHE_TTL_SECONDS: 600,
  OG_IMAGE_WIDTH:  1200,
  OG_IMAGE_HEIGHT: 630,
} as const;



export const LANDING = {
  STATUS: {
    DRAFT:     'DRAFT',
    PUBLISHED: 'PUBLISHED',
    ARCHIVED:  'ARCHIVED',
  },

  TITLE_MAX_LENGTH: 200,

  CACHE_TTL_SECONDS: 900,
} as const;



export const PAGINATION = {
  DEFAULT_PAGE:     1,
  DEFAULT_LIMIT:    20,
  MAX_LIMIT:        100,
  MIN_LIMIT:        1,
} as const;



export const CACHE_KEYS = {
  BLOG_LIST:        'blog:list',
  BLOG_DETAIL:      'blog:detail',
  BLOG_BY_SLUG:     'blog:slug',
  BLOG_CATEGORY:    'blog:category',

  PAGE_LIST:        'page:list',
  PAGE_DETAIL:      'page:detail',
  PAGE_BY_SLUG:     'page:slug',

  MEDIA_LIST:       'media:list',
  MEDIA_DETAIL:     'media:detail',

  SEO_DETAIL:       'seo:detail',
  SEO_BY_ENTITY:    'seo:entity',

  LANDING_LIST:     'landing:list',
  LANDING_DETAIL:   'landing:detail',
  LANDING_BY_SLUG:  'landing:slug',

  SITEMAP:          'sitemap:xml',
} as const;



export const SORT = {
  ORDER: {
    ASC:  'asc',
    DESC: 'desc',
  },

  BLOG_FIELDS:    ['publishedAt', 'title', 'createdAt', 'updatedAt'] as const,
  PRODUCT_FIELDS: ['title', 'createdAt', 'updatedAt'] as const,
  PAGE_FIELDS:    ['title', 'publishedAt', 'updatedAt'] as const,
  MEDIA_FIELDS:   ['uploadedAt', 'filename', 'sizeBytes'] as const,
} as const;



export const EVENT_TOPICS = {
  BLOG_PUBLISHED:     'lomash.content.blog.published',
  BLOG_UPDATED:       'lomash.content.blog.updated',
  MEDIA_UPLOADED:     'lomash.content.media.uploaded',
  PAGE_PUBLISHED:     'lomash.content.page.published',
  SEO_UPDATED:        'lomash.content.seo.updated',
  SITEMAP_REGENERATE: 'lomash.content.sitemap.regenerate',

  
  PRODUCT_CREATED: 'lomash.product.created',
  PRODUCT_UPDATED: 'lomash.product.updated',
  ORDER_CREATED:   'lomash.order.created',
} as const;



export const HEADERS = {
  REQUEST_ID:        'x-request-id',
  USER_PAYLOAD:      'x-user-payload',
  INTERNAL_SECRET:   'x-internal-secret',
  CORRELATION_ID:    'x-correlation-id',
} as const;



export const PATTERNS = {
  SLUG:       /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  UUID:       /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  HEX_COLOR:  /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/,
  URL:        /^https?:\/\/.+/,
} as const;



export const SITEMAP = {
  CHANGE_FREQ: {
    ALWAYS:  'always',
    HOURLY:  'hourly',
    DAILY:   'daily',
    WEEKLY:  'weekly',
    MONTHLY: 'monthly',
    YEARLY:  'yearly',
    NEVER:   'never',
  },
  MAX_URLS_PER_FILE: 50_000,
} as const;