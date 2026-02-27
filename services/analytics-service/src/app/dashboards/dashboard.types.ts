import type { DashboardType } from './dashboard.schemas';

export interface DashboardEntity {
  id: string;
  name: string;
  description?: string | null;
  type: DashboardType;
  isDefault: boolean;
  config: unknown;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}




export interface DashboardWidgetEntity {
  id: string;
  dashboardId: string;
  title: string;
  widgetType: string;
  metricKey?: string | null;
  config: unknown;
  position: unknown;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardConfig {
  refreshInterval?: number;
  dateRange?: string;
  timezone?: string;
  [key: string]: unknown;
}

export interface WidgetConfig {
  format?: string;
  comparison?: string;
  period?: string;
  days?: number;
  limit?: number;
  columns?: string[];
  [key: string]: unknown;
}

export interface WidgetPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface WidgetResponse {
  id: string;
  dashboardId: string;
  title: string;
  widgetType: string;
  metricKey?: string | null;
  config: WidgetConfig;
  position: WidgetPosition;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardResponse {
  id: string;
  name: string;
  description?: string | null;
  type: DashboardType;
  isDefault: boolean;
  config: DashboardConfig;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  widgets: WidgetResponse[];
}

export interface DashboardSummaryResponse {
  id: string;
  name: string;
  description?: string | null;
  type: DashboardType;
  isDefault: boolean;
  widgetCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateDashboardInput = {
  name: string;
  description?: string;
  type: DashboardType;
  isDefault?: boolean;
  createdBy: string;
  config?: Record<string, unknown>;
};

export type UpdateDashboardInput = {
  name?: string;
  description?: string;
  config?: Record<string, unknown>;
};

export type CreateWidgetInput = {
  dashboardId: string;
  title: string;
  widgetType: string;
  metricKey?: string;
  config?: Record<string, unknown>;
  position: WidgetPosition;
};

export type UpdateWidgetInput = {
  title?: string;
  widgetType?: string;
  metricKey?: string;
  config?: Record<string, unknown>;
  position?: WidgetPosition;
};

export type DashboardListFilters = {
  type?: DashboardType;
  page?: number;
  limit?: number;
};
export interface PaginatedDashboardsResponse {
  data: DashboardSummaryResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DashboardDataResponse {
  dashboardId: string;
  widgets: {
    widgetId: string;
    metricKey?: string | null;
    data: unknown;
    refreshedAt: Date;
  }[];
  refreshedAt: Date;
}

export type Dashboard = DashboardEntity;
export type DashboardWithWidgets = DashboardEntity & { widgets: WidgetResponse[] };
export type DashboardWithCount = DashboardEntity & {
  widgets: WidgetResponse[];
  _count: { widgets: number };
};
export type Widget = WidgetResponse;
export interface PaginatedDashboards {
  data: DashboardWithCount[];
  total: number;
}
export interface FindAllDashboardsQuery {
  page: number;
  limit: number;
  type?: DashboardType;
  createdBy?: string;
}