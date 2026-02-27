export const REDIS_KEYS = {
  tracking: {
    config: (key: string) => `tracking:config:${key}`,
    allConfigs: () => `tracking:configs:all`,
    sessionExists: (sessionId: string) => `tracking:session:${sessionId}`,
  },

  funnel: {
    detail: (id: string) => `funnel:${id}`,
    all: () => `funnels:all`,
    results: (id: string, period: string) => `funnel:${id}:results:${period}`,
  },

  dashboard: {
    detail: (id: string) => `dashboard:${id}`,
    all: () => `dashboards:all`,
    default: () => `dashboard:default`,
    data: (id: string) => `dashboard:${id}:data`,
  },

  export: {
    detail: (id: string) => `export:${id}`,
    userList: (userId: string) => `exports:user:${userId}`,
  },

  metric: {
    snapshot: (key: string, period: string) => `metric:${key}:${period}`,
    daily: (key: string, date: string) => `metric:${key}:daily:${date}`,
  },
} as const;

export const REDIS_TTL = {
  TRACKING_CONFIG: 3600,
  SESSION: 1800,
  FUNNEL: 600,
  FUNNEL_RESULTS: 900,
  DASHBOARD: 600,
  DASHBOARD_DATA: 300,
  EXPORT: 300,
  METRIC_SNAPSHOT: 3600,
} as const;