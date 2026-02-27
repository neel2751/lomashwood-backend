export const FUNNEL_ROUTES = {
  BASE: '/funnels',
  BY_ID: '/:id',
  RESULTS: '/:id/results',
  COMPUTE: '/:id/compute',
  PAUSE: '/:id/pause',
  RESUME: '/:id/resume',
  ARCHIVE: '/:id/archive',
} as const;

export const FUNNEL_CACHE_KEYS = {
  funnel: (id: string) => `funnel:${id}`,
  allFunnels: () => `funnels:all`,
  results: (id: string, period: string) => `funnel:${id}:results:${period}`,
} as const;

export const FUNNEL_CACHE_TTL = {
  FUNNEL: 600,
  ALL_FUNNELS: 300,
  RESULTS: 900,
} as const;

export const FUNNEL_ERRORS = {
  NOT_FOUND: 'Funnel not found',
  ALREADY_ARCHIVED: 'Funnel is already archived',
  ALREADY_ACTIVE: 'Funnel is already active',
  ALREADY_PAUSED: 'Funnel is already paused',
  STEPS_REQUIRED: 'Funnel must have at least one step',
  STEP_ORDER_INVALID: 'Funnel steps must have sequential order values starting at 1',
  RESULT_NOT_FOUND: 'Funnel result not found for the specified period',
  COMPUTE_FAILED: 'Funnel computation failed',
} as const;

export const FUNNEL_STEP_MIN = 1;
export const FUNNEL_STEP_MAX = 10;
export const FUNNEL_NAME_MAX_LENGTH = 255;
export const FUNNEL_DESCRIPTION_MAX_LENGTH = 1024;