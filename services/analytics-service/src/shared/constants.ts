export const SERVICE_NAME    = 'analytics-service';
export const SERVICE_VERSION = '1.0.0';

export const HTTP_STATUS = {
  OK:                    200,
  CREATED:               201,
  ACCEPTED:              202,
  NO_CONTENT:            204,
  BAD_REQUEST:           400,
  UNAUTHORIZED:          401,
  FORBIDDEN:             403,
  NOT_FOUND:             404,
  CONFLICT:              409,
  UNPROCESSABLE_ENTITY:  422,
  TOO_MANY_REQUESTS:     429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY:           502,
  SERVICE_UNAVAILABLE:   503,
} as const;

export const PAGINATION = {
  DEFAULT_PAGE:  1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT:     100,
  MIN_LIMIT:     1,
} as const;

export const DATE_GRANULARITY = {
  HOUR:  'hour',
  DAY:   'day',
  WEEK:  'week',
  MONTH: 'month',
  YEAR:  'year',
} as const;

export const METRIC_CHANNELS = {
  EMAIL: 'EMAIL',
  SMS:   'SMS',
  PUSH:  'PUSH',
  ALL:   'ALL',
} as const;

export const NOTIFICATION_STATUSES = {
  PENDING:    'PENDING',
  QUEUED:     'QUEUED',
  PROCESSING: 'PROCESSING',
  SENT:       'SENT',
  DELIVERED:  'DELIVERED',
  FAILED:     'FAILED',
  CANCELLED:  'CANCELLED',
  BOUNCED:    'BOUNCED',
} as const;

export const CAMPAIGN_STATUSES = {
  DRAFT:     'DRAFT',
  SCHEDULED: 'SCHEDULED',
  RUNNING:   'RUNNING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export const DELIVERY_EVENTS = {
  DELIVERED:    'DELIVERED',
  OPENED:       'OPENED',
  CLICKED:      'CLICKED',
  BOUNCED:      'BOUNCED',
  COMPLAINED:   'COMPLAINED',
  UNSUBSCRIBED: 'UNSUBSCRIBED',
  FAILED:       'FAILED',
} as const;

export const CACHE_TTL = {
  DASHBOARD_SUMMARY:    60,
  CHANNEL_STATS:        120,
  CAMPAIGN_STATS:       300,
  FUNNEL_REPORT:        600,
  PROVIDER_PERFORMANCE: 180,
  ENGAGEMENT_TREND:     300,
  REAL_TIME:            10,
} as const;

export const CACHE_KEYS = {
  DASHBOARD_SUMMARY:    (range: string)      => `analytics:dashboard:${range}`,
  CHANNEL_STATS:        (channel: string)    => `analytics:channel:${channel}`,
  CAMPAIGN_STATS:       (id: string)         => `analytics:campaign:${id}`,
  PROVIDER_PERFORMANCE: (provider: string)   => `analytics:provider:${provider}`,
  ENGAGEMENT_TREND:     (channel: string, granularity: string) => `analytics:trend:${channel}:${granularity}`,
} as const;

export const DATE_RANGE_PRESETS = {
  TODAY:        'today',
  YESTERDAY:    'yesterday',
  LAST_7_DAYS:  'last_7_days',
  LAST_30_DAYS: 'last_30_days',
  LAST_90_DAYS: 'last_90_days',
  THIS_MONTH:   'this_month',
  LAST_MONTH:   'last_month',
  THIS_YEAR:    'this_year',
  CUSTOM:       'custom',
} as const;

export const ANALYTICS_EVENTS = {
  REPORT_GENERATED:      'analytics:report:generated',
  EXPORT_REQUESTED:      'analytics:export:requested',
  REAL_TIME_UPDATE:      'analytics:realtime:update',
  ALERT_TRIGGERED:       'analytics:alert:triggered',
} as const;

export const EXPORT_FORMATS = {
  CSV:  'csv',
  JSON: 'json',
  XLSX: 'xlsx',
} as const;

export const RATE_THRESHOLD_WARN  = 0.05;
export const RATE_THRESHOLD_CRIT  = 0.15;
export const OPEN_RATE_BENCHMARK  = 0.21;
export const CLICK_RATE_BENCHMARK = 0.025;