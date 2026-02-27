export const CONSULTANT_ERRORS = {
  NOT_FOUND: 'Consultant not found',
  ALREADY_EXISTS: 'Consultant with this email already exists',
  INACTIVE: 'Consultant is inactive',
  INVALID_SHOWROOM: 'Invalid showroom ID',
  INVALID_SPECIALIZATION: 'Invalid specialization',
  MAX_SPECIALIZATIONS: 'Maximum 10 specializations allowed',
  UPDATE_FAILED: 'Consultant update failed',
  DELETE_FAILED: 'Consultant deletion failed',
} as const;

export const CONSULTANT_REDIS_KEYS = {
  consultantById: (id: string) => `consultant:${id}`,
  allConsultants: 'consultants:all',
  activeConsultants: 'consultants:active',
  consultantsByShowroom: (showroomId: string) => `consultants:showroom:${showroomId}`,
  consultantStats: (id: string) => `consultant:stats:${id}`,
} as const;

export const CONSULTANT_CACHE_TTL = 300;

export const CONSULTANT_STATS_CACHE_TTL = 60;

export const CONSULTANT_EVENTS = {
  CREATED: 'consultant.created',
  UPDATED: 'consultant.updated',
  DELETED: 'consultant.deleted',
  ACTIVATED: 'consultant.activated',
  DEACTIVATED: 'consultant.deactivated',
} as const;

export const CONSULTANT_PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

export const CONSULTANT_SPECIALIZATIONS = {
  KITCHEN: 'kitchen',
  BEDROOM: 'bedroom',
  BOTH: 'both',
  INTERIOR_DESIGN: 'interior_design',
  PROJECT_MANAGEMENT: 'project_management',
  INSTALLATION: 'installation',
} as const;

export const CONSULTANT_SPECIALIZATION_LABELS: Record<string, string> = {
  kitchen: 'Kitchen Design',
  bedroom: 'Bedroom Design',
  both: 'Kitchen & Bedroom Design',
  interior_design: 'Interior Design',
  project_management: 'Project Management',
  installation: 'Installation',
};

export const CONSULTANT_MAX_SPECIALIZATIONS = 10;

export const CONSULTANT_MAX_DAILY_BOOKINGS = 8;

export const CONSULTANT_WORKING_DAYS = {
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
} as const;

export const CONSULTANT_DEFAULT_SLOT_DURATION = 60;

export const CONSULTANT_AVATAR_MAX_SIZE_MB = 5;

export const CONSULTANT_AVATAR_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;