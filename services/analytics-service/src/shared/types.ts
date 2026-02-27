import type {
  DATE_GRANULARITY,
  METRIC_CHANNELS,
  NOTIFICATION_STATUSES,
  CAMPAIGN_STATUSES,
  DELIVERY_EVENTS,
  DATE_RANGE_PRESETS,
  EXPORT_FORMATS,
} from './constants';

export type DateGranularity     = (typeof DATE_GRANULARITY)[keyof typeof DATE_GRANULARITY];
export type MetricChannel       = (typeof METRIC_CHANNELS)[keyof typeof METRIC_CHANNELS];
export type NotificationStatus  = (typeof NOTIFICATION_STATUSES)[keyof typeof NOTIFICATION_STATUSES];
export type CampaignStatus      = (typeof CAMPAIGN_STATUSES)[keyof typeof CAMPAIGN_STATUSES];
export type DeliveryEvent       = (typeof DELIVERY_EVENTS)[keyof typeof DELIVERY_EVENTS];
export type DateRangePreset     = (typeof DATE_RANGE_PRESETS)[keyof typeof DATE_RANGE_PRESETS];
export type ExportFormat        = (typeof EXPORT_FORMATS)[keyof typeof EXPORT_FORMATS];

export interface IDateRange {
  from: Date;
  to:   Date;
}

export interface IDateRangeInput {
  preset?: DateRangePreset;
  from?:   string | Date;
  to?:     string | Date;
}

export interface IApiResponse<T> {
  success: boolean;
  data:    T;
  meta?:   Record<string, unknown>;
}

export interface IApiErrorResponse {
  success: boolean;
  error:   {
    message:    string;
    code:       string;
    statusCode: number;
    errors?:    Record<string, string | string[]>;
  };
}

export interface IPaginationMeta {
  page:       number;
  limit:      number;
  total:      number;
  totalPages: number;
  hasNext:    boolean;
  hasPrev:    boolean;
}

export interface IPaginatedResponse<T> {
  data:       T[];
  pagination: IPaginationMeta;
}

export interface ITimeSeriesPoint {
  timestamp: string;
  value:     number;
  label?:    string;
}

export interface ITimeSeries {
  granularity: DateGranularity;
  points:      ITimeSeriesPoint[];
}

export interface INotificationMetrics {
  total:      number;
  sent:       number;
  delivered:  number;
  failed:     number;
  pending:    number;
  cancelled:  number;
  bounced:    number;
  deliveryRate:  number;
  failureRate:   number;
  bounceRate:    number;
}

export interface IEngagementMetrics {
  totalDelivered:   number;
  totalOpened:      number;
  totalClicked:     number;
  totalUnsubscribed: number;
  totalComplained:  number;
  openRate:         number;
  clickRate:        number;
  clickToOpenRate:  number;
  unsubscribeRate:  number;
  complaintRate:    number;
}

export interface IDashboardSummary {
  dateRange:   IDateRange;
  totals:      INotificationMetrics;
  engagement:  IEngagementMetrics;
  byChannel:   Record<string, INotificationMetrics>;
  trend:       ITimeSeries;
  topCampaigns: ICampaignSummary[];
}

export interface ICampaignSummary {
  id:               string;
  name:             string;
  channel:          string;
  status:           CampaignStatus;
  totalRecipients:  number;
  totalSent:        number;
  totalDelivered:   number;
  totalOpened:      number;
  totalClicked:     number;
  totalFailed:      number;
  totalBounced:     number;
  totalUnsubscribed: number;
  openRate:         number;
  clickRate:        number;
  deliveryRate:     number;
  scheduledAt:      Date | null;
  startedAt:        Date | null;
  completedAt:      Date | null;
}

export interface IProviderPerformance {
  providerId:          string;
  providerName:        string;
  channel:             string;
  totalAttempts:       number;
  totalSucceeded:      number;
  totalFailed:         number;
  successRate:         number;
  averageLatencyMs:    number;
  p95LatencyMs:        number;
  consecutiveFailures: number;
  lastHealthStatus:    boolean | null;
  isDefault:           boolean;
}

export interface IFunnelStep {
  label:      string;
  event:      DeliveryEvent;
  count:      number;
  rate:       number;
  dropOff:    number;
  dropOffRate: number;
}

export interface IDeliveryFunnel {
  channel:   string;
  dateRange: IDateRange;
  steps:     IFunnelStep[];
}

export interface IChannelBreakdown {
  channel: string;
  count:   number;
  percent: number;
}

export interface IRealTimeStats {
  timestamp:        Date;
  lastMinute:       { sent: number; delivered: number; failed: number };
  lastHour:         { sent: number; delivered: number; failed: number };
  activeProviders:  number;
  degradedProviders: number;
  queueDepths:      Record<string, number>;
}

export interface IExportRequest {
  reportType: string;
  format:     ExportFormat;
  dateRange:  IDateRangeInput;
  channel?:   string;
  campaignId?: string;
  filters?:   Record<string, unknown>;
}

export interface IExportResult {
  jobId:     string;
  status:    'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  format:    ExportFormat;
  url?:      string;
  expiresAt?: Date;
  createdAt: Date;
}

export interface IRetentionDataPoint {
  cohortDate:   string;
  cohortSize:   number;
  period:       number;
  retained:     number;
  retentionRate: number;
}

export interface ISortOptions {
  field:     string;
  direction: 'asc' | 'desc';
}

export interface IFilterOptions {
  channel?:    string;
  status?:     string;
  campaignId?: string;
  templateId?: string;
  providerId?: string;
  dateRange?:  IDateRangeInput;
}