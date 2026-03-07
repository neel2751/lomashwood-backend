import { z } from 'zod';

// Event schema
export const EventSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  eventType: z.string(),
  eventName: z.string(),
  properties: z.record(z.any()).optional(),
  timestamp: z.string().datetime(),
  url: z.string().optional(),
  userAgent: z.string().optional(),
  ipAddress: z.string().optional(),
  referrer: z.string().optional(),
});

export type Event = z.infer<typeof EventSchema>;

export const TrackEventSchema = z.object({
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  eventType: z.string(),
  eventName: z.string(),
  properties: z.record(z.any()).optional(),
  url: z.string().optional(),
  userAgent: z.string().optional(),
  ipAddress: z.string().optional(),
  referrer: z.string().optional(),
});

export type TrackEventRequest = z.infer<typeof TrackEventSchema>;

export const QueryAnalyticsSchema = z.object({
  eventType: z.string().optional(),
  eventName: z.string().optional(),
  userId: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  properties: z.record(z.any()).optional(),
  groupBy: z.array(z.string()).optional(),
  aggregations: z.array(z.enum(['count', 'sum', 'avg', 'min', 'max'])).optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
});

export type QueryAnalyticsRequest = z.infer<typeof QueryAnalyticsSchema>;

// Funnel schema
export const FunnelSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  steps: z.array(z.object({
    id: z.string(),
    name: z.string(),
    eventType: z.string(),
    eventName: z.string(),
    properties: z.record(z.any()).optional(),
    order: z.number(),
  })),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Funnel = z.infer<typeof FunnelSchema>;

export const FunnelStepSchema = z.object({
  id: z.string(),
  funnelId: z.string(),
  name: z.string(),
  eventType: z.string(),
  eventName: z.string(),
  properties: z.record(z.any()).optional(),
  order: z.number(),
  conversionRate: z.number().optional(),
  dropoffRate: z.number().optional(),
  averageTime: z.number().optional(),
});

export type FunnelStep = z.infer<typeof FunnelStepSchema>;

export const CreateFunnelSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  steps: z.array(z.object({
    name: z.string(),
    eventType: z.string(),
    eventName: z.string(),
    properties: z.record(z.any()).optional(),
    order: z.number(),
  })),
  isActive: z.boolean().default(true),
});

export type CreateFunnelRequest = z.infer<typeof CreateFunnelSchema>;

export const UpdateFunnelSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  steps: z.array(z.object({
    id: z.string().optional(),
    name: z.string(),
    eventType: z.string(),
    eventName: z.string(),
    properties: z.record(z.any()).optional(),
    order: z.number(),
  })).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateFunnelRequest = z.infer<typeof UpdateFunnelSchema>;

// Dashboard schema
export const AnalyticsDashboardSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  widgets: z.array(z.object({
    id: z.string(),
    type: z.enum(['metric', 'chart', 'table', 'funnel', 'list']),
    title: z.string(),
    query: z.record(z.any()),
    config: z.record(z.any()).optional(),
    position: z.object({
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number(),
    }),
  })),
  isPublic: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type AnalyticsDashboard = z.infer<typeof AnalyticsDashboardSchema>;

export const DashboardWidgetSchema = z.object({
  id: z.string(),
  dashboardId: z.string(),
  type: z.enum(['metric', 'chart', 'table', 'funnel', 'list']),
  title: z.string(),
  query: z.record(z.any()),
  config: z.record(z.any()).optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
  }),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type DashboardWidget = z.infer<typeof DashboardWidgetSchema>;

export const CreateDashboardSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  widgets: z.array(z.object({
    type: z.enum(['metric', 'chart', 'table', 'funnel', 'list']),
    title: z.string(),
    query: z.record(z.any()),
    config: z.record(z.any()).optional(),
    position: z.object({
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number(),
    }),
  })),
  isPublic: z.boolean().default(false),
});

export type CreateDashboardRequest = z.infer<typeof CreateDashboardSchema>;

export const UpdateDashboardSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  widgets: z.array(z.object({
    id: z.string().optional(),
    type: z.enum(['metric', 'chart', 'table', 'funnel', 'list']),
    title: z.string(),
    query: z.record(z.any()),
    config: z.record(z.any()).optional(),
    position: z.object({
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number(),
    }),
  })).optional(),
  isPublic: z.boolean().optional(),
});

export type UpdateDashboardRequest = z.infer<typeof UpdateDashboardSchema>;

export const ExportReportSchema = z.object({
  type: z.enum(['events', 'funnel', 'dashboard']),
  id: z.string().optional(),
  filters: z.record(z.any()).optional(),
  format: z.enum(['csv', 'excel', 'pdf']),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

export type ExportReportRequest = z.infer<typeof ExportReportSchema>;
