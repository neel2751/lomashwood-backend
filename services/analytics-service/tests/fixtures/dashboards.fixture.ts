import { FIXED_DATE, FIXED_RANGE_START, FIXED_RANGE_END } from './common.fixture';
import {
  emailNotificationMetricsFixture,
  smsNotificationMetricsFixture,
  pushNotificationMetricsFixture,
  allChannelsTotalMetricsFixture,
  emailEngagementMetricsFixture,
  dailyNotificationTrendFixture,
  channelBreakdownFixture,
  nodemailerPerformanceFixture,
  sesPerformanceFixture,
  twilioPerformanceFixture,
  realTimeStatsFixture,
} from './metrics.fixture';
import type {
  INotificationMetrics,
  IEngagementMetrics,
  ITimeSeries,
} from './metrics.fixture';

export interface IDateRange {
  from: Date;
  to: Date;
}

export interface ICampaignDashboardSummary {
  id: string;
  name: string;
  channel: string;
  status: string;
  totalRecipients: number;
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalFailed: number;
  totalBounced: number;
  totalUnsubscribed: number;
  openRate: number;
  clickRate: number;
  deliveryRate: number;
  scheduledAt: Date;
  startedAt: Date;
  completedAt: Date;
}

export interface IDashboardSummary {
  dateRange: IDateRange;
  totals: INotificationMetrics;
  engagement: IEngagementMetrics;
  byChannel: {
    EMAIL: INotificationMetrics;
    SMS: INotificationMetrics;
    PUSH: INotificationMetrics;
  };
  trend: ITimeSeries;
  topCampaigns: ICampaignDashboardSummary[];
}

export const campaignDashboardSummaryFixture = {
  id:               'clxcamp10000000000000000001',
  name:             'Spring Kitchen Collection Launch',
  channel:          'EMAIL',
  status:           'COMPLETED',
  totalRecipients:  5000,
  totalSent:        4950,
  totalDelivered:   4800,
  totalOpened:      1920,
  totalClicked:     384,
  totalFailed:      150,
  totalBounced:     50,
  totalUnsubscribed: 12,
  openRate:         0.4,
  clickRate:        0.08,
  deliveryRate:     0.9697,
  scheduledAt:      FIXED_DATE,
  startedAt:        FIXED_DATE,
  completedAt:      FIXED_DATE,
};

export const dashboardSummaryFixture: IDashboardSummary = {
  dateRange:   { from: FIXED_RANGE_START, to: FIXED_RANGE_END },
  totals:      allChannelsTotalMetricsFixture,
  engagement:  emailEngagementMetricsFixture,
  byChannel: {
    EMAIL: emailNotificationMetricsFixture,
    SMS:   smsNotificationMetricsFixture,
    PUSH:  pushNotificationMetricsFixture,
  },
  trend:        dailyNotificationTrendFixture,
  topCampaigns: [campaignDashboardSummaryFixture],
};

export const emptyDashboardSummaryFixture: IDashboardSummary = {
  dateRange: { from: FIXED_RANGE_START, to: FIXED_RANGE_END },
  totals: {
    total: 0, sent: 0, delivered: 0, failed: 0,
    pending: 0, cancelled: 0, bounced: 0,
    deliveryRate: 0, failureRate: 0, bounceRate: 0,
  },
  engagement: {
    totalDelivered: 0, totalOpened: 0, totalClicked: 0,
    totalUnsubscribed: 0, totalComplained: 0,
    openRate: 0, clickRate: 0, clickToOpenRate: 0,
    unsubscribeRate: 0, complaintRate: 0,
  },
  byChannel: {
    EMAIL: { total: 0, sent: 0, delivered: 0, failed: 0, pending: 0, cancelled: 0, bounced: 0, deliveryRate: 0, failureRate: 0, bounceRate: 0 },
    SMS:   { total: 0, sent: 0, delivered: 0, failed: 0, pending: 0, cancelled: 0, bounced: 0, deliveryRate: 0, failureRate: 0, bounceRate: 0 },
    PUSH:  { total: 0, sent: 0, delivered: 0, failed: 0, pending: 0, cancelled: 0, bounced: 0, deliveryRate: 0, failureRate: 0, bounceRate: 0 },
  },
  trend:        { granularity: 'day', points: [] },
  topCampaigns: [],
};

export const dashboardWidgetsFixture = {
  deliveryRateCard: {
    title:   'Delivery Rate',
    value:   0.9345,
    change:  0.0082,
    trend:   'up',
    period:  'vs last 30 days',
  },
  openRateCard: {
    title:  'Open Rate (Email)',
    value:  0.2289,
    change: -0.0031,
    trend:  'down',
    period: 'vs last 30 days',
  },
  totalSentCard: {
    title:  'Total Sent',
    value:  8700,
    change: 0.084,
    trend:  'up',
    period: 'vs last 30 days',
  },
  failureRateCard: {
    title:  'Failure Rate',
    value:  0.0633,
    change: -0.0051,
    trend:  'down',
    period: 'vs last 30 days',
  },
};

export const providerHealthDashboardFixture = {
  summary: {
    totalProviders:    5,
    activeProviders:   4,
    degradedProviders: 0,
    inactiveProviders: 1,
  },
  providers:  [nodemailerPerformanceFixture, sesPerformanceFixture, twilioPerformanceFixture],
  recentAlerts: [],
};

export const realTimeDashboardFixture = {
  stats:        realTimeStatsFixture,
  channelBreakdown: channelBreakdownFixture,
  activeAlerts: [],
  systemStatus: 'healthy' as const,
};

export const alertsFixture = [
  {
    id:        'clxalrt10000000000000000001',
    type:      'FAILURE_RATE_HIGH',
    severity:  'warning',
    message:   'Email failure rate exceeded 5% threshold (current: 3.3%)',
    channel:   'EMAIL',
    value:     0.033,
    threshold: 0.05,
    triggeredAt: FIXED_DATE,
    resolvedAt:  null,
  },
];