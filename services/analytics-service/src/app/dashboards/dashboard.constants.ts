export const DASHBOARD_ROUTES = {
  BASE: '/dashboards',
  BY_ID: '/:id',
  DEFAULT: '/default',
  WIDGETS: '/:id/widgets',
  WIDGET_BY_ID: '/:id/widgets/:widgetId',
  SET_DEFAULT: '/:id/set-default',
  REFRESH: '/:id/refresh',
} as const;

export const DASHBOARD_CACHE_KEYS = {
  dashboard: (id: string) => `dashboard:${id}`,
  allDashboards: () => `dashboards:all`,
  defaultDashboard: () => `dashboard:default`,
  dashboardData: (id: string) => `dashboard:${id}:data`,
} as const;

export const DASHBOARD_CACHE_TTL = {
  DASHBOARD: 600,
  ALL: 300,
  DATA: 300,
} as const;

export const DASHBOARD_ERRORS = {
  NOT_FOUND: 'Dashboard not found',
  WIDGET_NOT_FOUND: 'Widget not found',
  DEFAULT_EXISTS: 'A default dashboard of this type already exists',
  WIDGET_BELONGS_TO_OTHER: 'Widget does not belong to this dashboard',
  NAME_TAKEN: 'A dashboard with this name already exists',
} as const;

export const WIDGET_TYPES = {
  METRIC_CARD: 'metric_card',
  LINE_CHART: 'line_chart',
  BAR_CHART: 'bar_chart',
  PIE_CHART: 'pie_chart',
  TABLE: 'table',
  HEATMAP: 'heatmap',
  FUNNEL_CHART: 'funnel_chart',
  AREA_CHART: 'area_chart',
  SCATTER_PLOT: 'scatter_plot',
  GAUGE: 'gauge',
} as const;

export const DASHBOARD_MAX_WIDGETS = 20;
export const DASHBOARD_NAME_MAX_LENGTH = 255;
export const DASHBOARD_DESCRIPTION_MAX_LENGTH = 1024;