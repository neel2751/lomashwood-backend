import { z } from "zod";

export const EventTypeEnum = z.enum([
  "PAGE_VIEW",
  "PRODUCT_VIEW",
  "PRODUCT_FILTER",
  "ADD_TO_WISHLIST",
  "REMOVE_FROM_WISHLIST",
  "BOOKING_STARTED",
  "BOOKING_COMPLETED",
  "BOOKING_ABANDONED",
  "BROCHURE_REQUESTED",
  "CONTACT_FORM_SUBMITTED",
  "NEWSLETTER_SUBSCRIBED",
  "SEARCH",
  "CLICK",
  "SCROLL",
  "VIDEO_PLAY",
  "VIDEO_PAUSE",
  "VIDEO_COMPLETE",
  "SHOWROOM_VIEWED",
  "ORDER_STARTED",
  "ORDER_COMPLETED",
  "PAYMENT_INITIATED",
  "PAYMENT_COMPLETED",
  "CUSTOM",
]);

export const TrackEventSchema = z.object({
  eventType: EventTypeEnum,
  eventName: z.string().max(255).optional(),
  userId: z.string().uuid().optional(),
  sessionId: z.string().min(1).max(255),
  properties: z.record(z.unknown()).optional().default({}),
  pageUrl: z.string().url().optional(),
  pageTitle: z.string().max(255).optional(),
  referrer: z.string().url().optional(),
  userAgent: z.string().max(512).optional(),
  ipAddress: z.string().ip().optional(),
  deviceType: z.enum(["DESKTOP", "MOBILE", "TABLET", "UNKNOWN"]).optional().default("UNKNOWN"),
  timestamp: z.coerce.date().optional().default(() => new Date()),
});

export const TrackPageViewSchema = z.object({
  sessionId: z.string().min(1).max(255),
  userId: z.string().uuid().optional(),
  url: z.string().url(),
  title: z.string().max(255).optional(),
  referrer: z.string().url().optional(),
  duration: z.number().int().min(0).optional(),
  scrollDepth: z.number().min(0).max(100).optional(),
  timestamp: z.coerce.date().optional().default(() => new Date()),
});

export const FunnelSchema = z.object({
  name: z.string().min(2).max(255).trim(),
  description: z.string().max(1000).optional(),
  steps: z
    .array(
      z.object({
        order: z.number().int().min(1),
        name: z.string().min(1).max(255).trim(),
        eventType: EventTypeEnum,
        conditions: z.record(z.unknown()).optional(),
      })
    )
    .min(2)
    .max(20),
  isActive: z.boolean().optional().default(true),
});

export const FunnelUpdateSchema = FunnelSchema.partial();

export const DashboardSchema = z.object({
  name: z.string().min(2).max(255).trim(),
  description: z.string().max(1000).optional(),
  widgets: z.array(
    z.object({
      widgetType: z.enum([
        "METRIC",
        "CHART",
        "TABLE",
        "FUNNEL",
        "MAP",
        "LIST",
      ]),
      title: z.string().min(1).max(255).trim(),
      config: z.record(z.unknown()),
      position: z.object({
        x: z.number().int().min(0),
        y: z.number().int().min(0),
        w: z.number().int().min(1),
        h: z.number().int().min(1),
      }),
    })
  ).max(30),
  isDefault: z.boolean().optional().default(false),
  isPublic: z.boolean().optional().default(false),
});

export const DashboardUpdateSchema = DashboardSchema.partial();

export const AnalyticsQuerySchema = z.object({
  metric: z.enum([
    "BOOKINGS",
    "ORDERS",
    "REVENUE",
    "PAGE_VIEWS",
    "UNIQUE_VISITORS",
    "BOUNCE_RATE",
    "CONVERSION_RATE",
    "AVERAGE_ORDER_VALUE",
    "CUSTOMER_ACQUISITION",
    "PRODUCT_VIEWS",
    "BROCHURE_REQUESTS",
  ]),
  dateFrom: z.coerce.date(),
  dateTo: z.coerce.date(),
  granularity: z
    .enum(["HOUR", "DAY", "WEEK", "MONTH", "QUARTER", "YEAR"])
    .optional()
    .default("DAY"),
  groupBy: z
    .array(z.enum(["CATEGORY", "PRODUCT", "SHOWROOM", "CHANNEL", "DEVICE"]))
    .optional()
    .default([]),
  filters: z.record(z.unknown()).optional(),
});

export const ExportSchema = z.object({
  reportType: z.enum([
    "BOOKINGS",
    "ORDERS",
    "CUSTOMERS",
    "PRODUCTS",
    "REVENUE",
    "ANALYTICS",
    "NEWSLETTER",
    "BROCHURES",
    "BUSINESS_INQUIRIES",
  ]),
  format: z.enum(["CSV", "XLSX", "PDF", "JSON"]),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  filters: z.record(z.unknown()).optional(),
  columns: z.array(z.string()).optional(),
  email: z.string().email().optional(),
});

export const AnalyticsFilterSchema = z.object({
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  userId: z.string().uuid().optional(),
  eventType: EventTypeEnum.optional(),
  deviceType: z.enum(["DESKTOP", "MOBILE", "TABLET", "UNKNOWN"]).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(1000).optional().default(100),
  sortBy: z
    .enum(["timestamp_asc", "timestamp_desc"])
    .optional()
    .default("timestamp_desc"),
});

export type EventTypeEnumType = z.infer<typeof EventTypeEnum>;
export type TrackEventInput = z.infer<typeof TrackEventSchema>;
export type TrackPageViewInput = z.infer<typeof TrackPageViewSchema>;
export type FunnelInput = z.infer<typeof FunnelSchema>;
export type FunnelUpdateInput = z.infer<typeof FunnelUpdateSchema>;
export type DashboardInput = z.infer<typeof DashboardSchema>;
export type DashboardUpdateInput = z.infer<typeof DashboardUpdateSchema>;
export type AnalyticsQueryInput = z.infer<typeof AnalyticsQuerySchema>;
export type ExportInput = z.infer<typeof ExportSchema>;
export type AnalyticsFilterInput = z.infer<typeof AnalyticsFilterSchema>;