export const LANDING_CACHE_TTL_SECONDS = 1200; // 20 minutes

export const LANDING_CACHE_KEYS = {
  LIST: 'landing:list',
  DETAIL: (slug: string) => `landing:detail:${slug}`,
  BY_ID: (id: string) => `landing:id:${id}`,
  ACTIVE: 'landing:active',
  BY_TEMPLATE: (template: string) => `landing:template:${template}`,
} as const;

export const LANDING_DEFAULT_PAGE_SIZE = 20;
export const LANDING_MAX_PAGE_SIZE = 100;
export const LANDING_TITLE_MAX_LENGTH = 255;
export const LANDING_SLUG_MAX_LENGTH = 200;
export const LANDING_SUBTITLE_MAX_LENGTH = 500;
export const LANDING_CTA_TEXT_MAX_LENGTH = 100;
export const LANDING_CTA_URL_MAX_LENGTH = 2048;

export const LANDING_TEMPLATES = [
  'hero-full',      
  'hero-split',       
  'offer',           
  'package',          
  'campaign',        
  'showroom-promo',   
  'consultation',     
  'custom',           
] as const;

export type LandingTemplate = (typeof LANDING_TEMPLATES)[number];


export const LANDING_ALLOWED_STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['PUBLISHED', 'SCHEDULED'],
  SCHEDULED: ['PUBLISHED', 'DRAFT'],
  PUBLISHED: ['DRAFT', 'ARCHIVED'],
  ARCHIVED: ['DRAFT'],
} as const;


export const LANDING_EVENTS = {
  PUBLISHED: 'landing.published',
  UPDATED: 'landing.updated',
  UNPUBLISHED: 'landing.unpublished',
  ARCHIVED: 'landing.archived',
  SCHEDULED: 'landing.scheduled',
  DELETED: 'landing.deleted',
} as const;


export const LANDING_ERROR_CODES = {
  NOT_FOUND: 'LANDING_NOT_FOUND',
  SLUG_CONFLICT: 'LANDING_SLUG_CONFLICT',
  INVALID_STATUS_TRANSITION: 'LANDING_INVALID_STATUS_TRANSITION',
  PUBLISH_REQUIRES_CONTENT: 'LANDING_PUBLISH_REQUIRES_CONTENT',
  SCHEDULE_REQUIRES_FUTURE_DATE: 'LANDING_SCHEDULE_REQUIRES_FUTURE_DATE',
  TEMPLATE_MISMATCH: 'LANDING_TEMPLATE_MISMATCH',
} as const;

export const LANDING_SORT_FIELDS = [
  'title',
  'createdAt',
  'updatedAt',
  'publishedAt',
  'scheduledAt',
] as const;

export const LANDING_SORT_ORDERS = ['asc', 'desc'] as const;