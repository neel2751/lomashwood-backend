import type { PaginationParams } from "./api.types";

export type GroupByPeriod = "day" | "week" | "month";

export type DateRangeParams = {
  startDate: string;
  endDate: string;
};

export type AnalyticsOverview = {
  totalRevenue: number;
  totalOrders: number;
  totalAppointments: number;
  totalCustomers: number;
  revenueChange: number;
  ordersChange: number;
  appointmentsChange: number;
  customersChange: number;
  revenueChart: ChartDataPoint[];
  ordersChart: ChartDataPoint[];
};

export type ChartDataPoint = {
  date: string;
  value: number;
};

export type RevenueStats = {
  date: string;
  revenue: number;
  orders: number;
};

export type OrderStats = {
  date: string;
  count: number;
  status: string;
};

export type AppointmentStats = {
  total: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
};

export type CustomerStats = {
  newCustomers: number;
  returningCustomers: number;
  topCustomers: TopCustomer[];
};

export type TopCustomer = {
  id: string;
  name: string;
  email?: string;
  totalSpend: number;
  orderCount: number;
};

export type TopProduct = {
  productId: string;
  title: string;
  category: string;
  views: number;
  conversions: number;
  conversionRate: number;
};

export type CohortRow = Record<string, number>;

export type TrackingEvent = {
  id: string;
  event: string;
  userId?: string;
  sessionId?: string;
  page?: string;
  properties: Record<string, unknown>;
  timestamp: string;
  createdAt: string;
};

export type FunnelStep = {
  name: string;
  event: string;
  conditions?: Record<string, unknown>;
};

export type Funnel = {
  id: string;
  name: string;
  steps: FunnelStep[];
  conversionRate: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type FunnelResult = {
  steps: FunnelStepResult[];
  overallConversionRate: number;
};

export type FunnelStepResult = {
  name: string;
  count: number;
  dropoffRate: number;
  conversionRate: number;
};

export type WidgetPosition = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type DashboardWidget = {
  id: string;
  type: string;
  title: string;
  config: Record<string, unknown>;
  position: WidgetPosition;
};

export type AnalyticsDashboard = {
  id: string;
  name: string;
  widgets: DashboardWidget[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateFunnelPayload = {
  name: string;
  steps: FunnelStep[];
  isActive?: boolean;
};

export type UpdateFunnelPayload = Partial<CreateFunnelPayload>;

export type CreateDashboardPayload = {
  name: string;
  widgets?: DashboardWidget[];
};

export type AddWidgetPayload = {
  type: string;
  title: string;
  config: Record<string, unknown>;
  position: WidgetPosition;
};

export type ExportFormat = "csv" | "xlsx" | "json";

export type ExportResource =
  | "orders"
  | "products"
  | "customers"
  | "appointments"
  | "payments"
  | "refunds"
  | "inventory"
  | "reviews"
  | "support"
  | "analytics";

export type ExportParams = DateRangeParams & {
  format: ExportFormat;
  filters?: Record<string, unknown>;
};

export type AnalyticsFilterParams = PaginationParams & {
  startDate?: string;
  endDate?: string;
  groupBy?: GroupByPeriod;
};

export type FunnelFilterParams = PaginationParams & {
  search?: string;
  isActive?: boolean;
};

export type DashboardFilterParams = PaginationParams & {
  search?: string;
};