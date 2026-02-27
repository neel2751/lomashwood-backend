export type TrackingEventType =
  | 'PAGE_VIEW'
  | 'PRODUCT_VIEW'
  | 'PRODUCT_FILTER'
  | 'ADD_TO_WISHLIST'
  | 'REMOVE_FROM_WISHLIST'
  | 'BOOKING_STARTED'
  | 'BOOKING_STEP_COMPLETED'
  | 'BOOKING_SUBMITTED'
  | 'BOOKING_CANCELLED'
  | 'BROCHURE_REQUESTED'
  | 'CONTACT_SUBMITTED'
  | 'NEWSLETTER_SUBSCRIBED'
  | 'SHOWROOM_VIEWED'
  | 'SEARCH_PERFORMED'
  | 'CHECKOUT_STARTED'
  | 'CHECKOUT_COMPLETED'
  | 'PAYMENT_INITIATED'
  | 'PAYMENT_COMPLETED'
  | 'PAYMENT_FAILED'
  | 'CUSTOM';

export type FunnelStepStatus = 'ENTERED' | 'COMPLETED' | 'DROPPED';

export type ExportFormat = 'CSV' | 'XLSX' | 'JSON' | 'PDF';

export type ExportStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'EXPIRED';

export type MetricPeriod = 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface TrackingEvent {
  readonly id: string;
  readonly sessionId: string;
  readonly userId: string | null;
  readonly anonymousId: string;
  readonly type: TrackingEventType;
  readonly properties: Record<string, unknown>;
  readonly page: string | null;
  readonly referrer: string | null;
  readonly userAgent: string | null;
  readonly ipAddress: string | null;
  readonly country: string | null;
  readonly device: string | null;
  readonly browser: string | null;
  readonly os: string | null;
  readonly timestamp: Date;
}

export interface AnalyticsSession {
  readonly id: string;
  readonly userId: string | null;
  readonly anonymousId: string;
  readonly startedAt: Date;
  readonly endedAt: Date | null;
  readonly duration: number | null;
  readonly pageViewCount: number;
  readonly eventCount: number;
  readonly entryPage: string | null;
  readonly exitPage: string | null;
  readonly referrer: string | null;
  readonly utmSource: string | null;
  readonly utmMedium: string | null;
  readonly utmCampaign: string | null;
  readonly country: string | null;
  readonly device: string | null;
  readonly browser: string | null;
}

export interface FunnelStep {
  readonly id: string;
  readonly funnelId: string;
  readonly name: string;
  readonly eventType: TrackingEventType;
  readonly position: number;
  readonly filters: Record<string, unknown>;
}

export interface Funnel {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly steps: readonly FunnelStep[];
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface FunnelResult {
  readonly funnelId: string;
  readonly period: string;
  readonly steps: readonly FunnelStepResult[];
  readonly overallConversionRate: number;
}

export interface FunnelStepResult {
  readonly stepId: string;
  readonly name: string;
  readonly position: number;
  readonly users: number;
  readonly conversionRate: number;
  readonly dropOffRate: number;
}

export interface DashboardWidget {
  readonly id: string;
  readonly dashboardId: string;
  readonly type: string;
  readonly title: string;
  readonly config: Record<string, unknown>;
  readonly position: WidgetPosition;
  readonly refreshIntervalSeconds: number | null;
}

export interface WidgetPosition {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface Dashboard {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly widgets: readonly DashboardWidget[];
  readonly isDefault: boolean;
  readonly createdBy: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface Metric {
  readonly id: string;
  readonly name: string;
  readonly value: number;
  readonly period: MetricPeriod;
  readonly periodStart: Date;
  readonly periodEnd: Date;
  readonly dimensions: Record<string, string>;
  readonly computedAt: Date;
}

export interface ExportJob {
  readonly id: string;
  readonly requestedBy: string;
  readonly format: ExportFormat;
  readonly filters: Record<string, unknown>;
  readonly status: ExportStatus;
  readonly fileUrl: string | null;
  readonly rowCount: number | null;
  readonly fileSizeBytes: number | null;
  readonly expiresAt: Date | null;
  readonly createdAt: Date;
  readonly completedAt: Date | null;
}

export interface BusinessMetrics {
  readonly totalBookings: number;
  readonly bookingsByType: Record<string, number>;
  readonly bookingConversionRate: number;
  readonly totalBrochureRequests: number;
  readonly totalNewsletterSubscribers: number;
  readonly totalProductViews: number;
  readonly topViewedProducts: readonly TopViewedProduct[];
  readonly topPerformingShowrooms: readonly TopShowroom[];
  readonly period: string;
}

export interface TopViewedProduct {
  readonly productId: string;
  readonly title: string;
  readonly views: number;
  readonly category: string;
}

export interface TopShowroom {
  readonly showroomId: string;
  readonly name: string;
  readonly bookings: number;
  readonly views: number;
}

export interface EventTrackedEventPayload {
  readonly eventId: string;
  readonly sessionId: string;
  readonly userId: string | null;
  readonly type: TrackingEventType;
  readonly timestamp: Date;
}

export interface ReportGeneratedEventPayload {
  readonly exportJobId: string;
  readonly requestedBy: string;
  readonly format: ExportFormat;
  readonly fileUrl: string;
  readonly rowCount: number;
  readonly generatedAt: Date;
}

export interface FunnelCompletedEventPayload {
  readonly sessionId: string;
  readonly userId: string | null;
  readonly funnelId: string;
  readonly funnelName: string;
  readonly completedAt: Date;
}

export interface DashboardRefreshedEventPayload {
  readonly dashboardId: string;
  readonly refreshedBy: string | null;
  readonly refreshedAt: Date;
}