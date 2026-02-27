export const MEDIA_CACHE_TTL_SECONDS = 600; // 10 minutes

export const MEDIA_CACHE_KEYS = {
  LIST: 'media:list',
  DETAIL: (id: string) => `media:detail:${id}`,
  ACTIVE: 'media:active',
} as const;

export const MEDIA_DEFAULT_PAGE_SIZE = 20;
export const MEDIA_MAX_PAGE_SIZE = 100;
export const MEDIA_TITLE_MAX_LENGTH = 255;
export const MEDIA_DESCRIPTION_MAX_LENGTH = 1000;
export const MEDIA_CTA_TEXT_MAX_LENGTH = 100;
export const MEDIA_SORT_ORDER_MIN = 0;
export const MEDIA_SORT_ORDER_MAX = 9999;

export const MEDIA_ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

export const MEDIA_ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/ogg',
] as const;

export const MEDIA_EVENTS = {
  CREATED: 'media.created',
  UPDATED: 'media.updated',
  DELETED: 'media.deleted',
  REORDERED: 'media.reordered',
} as const;

export const MEDIA_ERROR_CODES = {
  NOT_FOUND: 'MEDIA_NOT_FOUND',
  INVALID_MEDIA_TYPE: 'MEDIA_INVALID_MEDIA_TYPE',
  INVALID_SORT_ORDER: 'MEDIA_INVALID_SORT_ORDER',
  DUPLICATE_SORT_ORDER: 'MEDIA_DUPLICATE_SORT_ORDER',
  ACTIVE_REQUIRED: 'MEDIA_ACTIVE_REQUIRED',
} as const;

export const MEDIA_SORT_FIELDS = ['sortOrder', 'createdAt', 'title'] as const;
export const MEDIA_SORT_ORDERS = ['asc', 'desc'] as const;