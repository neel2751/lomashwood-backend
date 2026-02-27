export const TEMPLATE_CONSTANTS = {
  SLUG_REGEX: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  VARIABLE_REGEX: /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g,
  MAX_SLUG_LENGTH: 100,
  MAX_NAME_LENGTH: 150,
  MAX_SUBJECT_LENGTH: 255,
  MAX_HTML_BODY_SIZE_KB: 512,
  MAX_TEXT_BODY_SIZE_KB: 64,
  MAX_SMS_BODY_LENGTH: 1600,
  MAX_PUSH_TITLE_LENGTH: 100,
  MAX_PUSH_BODY_LENGTH: 500,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  VERSION_HISTORY_LIMIT: 50,
} as const;

export const TEMPLATE_ROUTES = {
  BASE: '/templates',
  LIST: '/',
  CREATE: '/',
  GET_BY_ID: '/:id',
  GET_BY_SLUG: '/slug/:slug',
  UPDATE: '/:id',
  ARCHIVE: '/:id/archive',
  RESTORE: '/:id/restore',
  DELETE: '/:id',
  RENDER: '/render',
  VERSIONS: '/:id/versions',
} as const;

export const TEMPLATE_ERRORS = {
  NOT_FOUND: 'TEMPLATE_NOT_FOUND',
  SLUG_CONFLICT: 'TEMPLATE_SLUG_CONFLICT',
  INVALID_SLUG: 'TEMPLATE_INVALID_SLUG',
  RENDER_FAILED: 'TEMPLATE_RENDER_FAILED',
  MISSING_VARIABLE: 'TEMPLATE_MISSING_VARIABLE',
  INVALID_CHANNEL: 'TEMPLATE_INVALID_CHANNEL',
  ARCHIVED: 'TEMPLATE_ARCHIVED',
  MISSING_HTML_BODY: 'TEMPLATE_MISSING_HTML_BODY',
  MISSING_SUBJECT: 'TEMPLATE_MISSING_SUBJECT',
  BODY_TOO_LARGE: 'TEMPLATE_BODY_TOO_LARGE',
  SMS_TOO_LONG: 'TEMPLATE_SMS_TOO_LONG',
  VERSION_NOT_FOUND: 'TEMPLATE_VERSION_NOT_FOUND',
} as const;

export const TEMPLATE_EVENTS = {
  CREATED: 'template.created',
  UPDATED: 'template.updated',
  ARCHIVED: 'template.archived',
  RESTORED: 'template.restored',
  DELETED: 'template.deleted',
  RENDERED: 'template.rendered',
} as const;

export const TEMPLATE_CACHE_KEYS = {
  BY_ID: (id: string) => `template:id:${id}`,
  BY_SLUG_CHANNEL: (slug: string, channel: string) => `template:slug:${slug}:${channel}`,
  LIST: (page: number, limit: number, filter: string) => `template:list:${page}:${limit}:${filter}`,
} as const;

export const TEMPLATE_CACHE_TTL_SECONDS = {
  TEMPLATE: 300,    // 5 minutes
  LIST: 60,         // 1 minute
} as const;

// Built-in system template slugs
export const SYSTEM_TEMPLATES = {
  BOOKING_CONFIRMATION_EMAIL: 'booking-confirmation-email',
  BOOKING_REMINDER_EMAIL: 'booking-reminder-email',
  BOOKING_CANCELLATION_EMAIL: 'booking-cancellation-email',
  BOOKING_CONFIRMATION_SMS: 'booking-confirmation-sms',
  PAYMENT_RECEIPT_EMAIL: 'payment-receipt-email',
  BROCHURE_DELIVERY_EMAIL: 'brochure-delivery-email',
  BUSINESS_INQUIRY_ADMIN_EMAIL: 'business-inquiry-admin-email',
  WELCOME_EMAIL: 'welcome-email',
  PASSWORD_RESET_EMAIL: 'password-reset-email',
  NEWSLETTER_CONFIRM_EMAIL: 'newsletter-confirm-email',
} as const;