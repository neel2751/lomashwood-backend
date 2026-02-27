import type {
  INotificationMetrics,
  IEngagementMetrics,
  IDashboardSummary,
  ICampaignSummary,
  IProviderPerformance,
  IFunnelStep,
  IDeliveryFunnel,
  ITimeSeriesPoint,
  ITimeSeries,
  IRealTimeStats,
  IDateRange,
  IPaginationMeta,
  IPaginatedResponse,
} from '../shared/types';

export const FIXED_DATE       = new Date('2025-01-15T10:00:00.000Z');
export const FIXED_RANGE: IDateRange = {
  from: new Date('2025-01-01T00:00:00.000Z'),
  to:   new Date('2025-01-31T23:59:59.999Z'),
};

export function makeNotificationMetrics(
  overrides: Partial<INotificationMetrics> = {},
): INotificationMetrics {
  return {
    total:        1000,
    sent:         980,
    delivered:    940,
    failed:       40,
    pending:      10,
    cancelled:    10,
    bounced:      20,
    deliveryRate: 0.9592,
    failureRate:  0.04,
    bounceRate:   0.0208,
    ...overrides,
  };
}

export function makeEngagementMetrics(
  overrides: Partial<IEngagementMetrics> = {},
): IEngagementMetrics {
  return {
    totalDelivered:    940,
    totalOpened:       215,
    totalClicked:      47,
    totalUnsubscribed: 3,
    totalComplained:   1,
    openRate:          0.2287,
    clickRate:         0.05,
    clickToOpenRate:   0.2186,
    unsubscribeRate:   0.0032,
    complaintRate:     0.0011,
    ...overrides,
  };
}

export function makeTimeSeriesPoint(
  overrides: Partial<ITimeSeriesPoint> = {},
): ITimeSeriesPoint {
  return {
    timestamp: '2025-01-15',
    value:     42,
    ...overrides,
  };
}

export function makeTimeSeries(
  overrides: Partial<ITimeSeries & { points: Partial<ITimeSeriesPoint>[] }> = {},
): ITimeSeries {
  const points = (overrides.points ?? []).map(makeTimeSeriesPoint);
  return {
    granularity: 'day',
    points: points.length > 0 ? points : [
      makeTimeSeriesPoint({ timestamp: '2025-01-13', value: 30 }),
      makeTimeSeriesPoint({ timestamp: '2025-01-14', value: 45 }),
      makeTimeSeriesPoint({ timestamp: '2025-01-15', value: 42 }),
    ],
    ...omitKey(overrides, 'points'),
  };
}

export function makeCampaignSummary(
  overrides: Partial<ICampaignSummary> = {},
): ICampaignSummary {
  return {
    id:                'clxcamp10000000000000000001',
    name:              'Spring Kitchen Collection Launch',
    channel:           'EMAIL',
    status:            'COMPLETED',
    totalRecipients:   5000,
    totalSent:         4950,
    totalDelivered:    4800,
    totalOpened:       1920,
    totalClicked:      384,
    totalFailed:       150,
    totalBounced:      50,
    totalUnsubscribed: 12,
    openRate:          0.4,
    clickRate:         0.08,
    deliveryRate:      0.9697,
    scheduledAt:       FIXED_DATE,
    startedAt:         FIXED_DATE,
    completedAt:       FIXED_DATE,
    ...overrides,
  };
}

export function makeDashboardSummary(
  overrides: Partial<IDashboardSummary> = {},
): IDashboardSummary {
  return {
    dateRange:    FIXED_RANGE,
    totals:       makeNotificationMetrics(),
    engagement:   makeEngagementMetrics(),
    byChannel: {
      EMAIL: makeNotificationMetrics({ total: 700, sent: 690, delivered: 670 }),
      SMS:   makeNotificationMetrics({ total: 200, sent: 198, delivered: 195 }),
      PUSH:  makeNotificationMetrics({ total: 100, sent:  92, delivered:  75 }),
    },
    trend:        makeTimeSeries(),
    topCampaigns: [makeCampaignSummary()],
    ...overrides,
  };
}

export function makeProviderPerformance(
  overrides: Partial<IProviderPerformance> = {},
): IProviderPerformance {
  return {
    providerId:          'clxprov10000000000000000001',
    providerName:        'nodemailer-smtp',
    channel:             'EMAIL',
    totalAttempts:       1000,
    totalSucceeded:      960,
    totalFailed:         40,
    successRate:         0.96,
    averageLatencyMs:    245,
    p95LatencyMs:        820,
    consecutiveFailures: 0,
    lastHealthStatus:    true,
    isDefault:           true,
    ...overrides,
  };
}

export function makeFunnelStep(
  overrides: Partial<IFunnelStep> = {},
): IFunnelStep {
  return {
    label:       'Delivered',
    event:       'DELIVERED',
    count:       4800,
    rate:        0.9697,
    dropOff:     150,
    dropOffRate: 0.0303,
    ...overrides,
  };
}

export function makeDeliveryFunnel(
  overrides: Partial<IDeliveryFunnel> = {},
): IDeliveryFunnel {
  return {
    channel:   'EMAIL',
    dateRange: FIXED_RANGE,
    steps: [
      makeFunnelStep({ label: 'Sent',      event: 'DELIVERED',  count: 4950, rate: 1,      dropOff: 50,   dropOffRate: 0.0101 }),
      makeFunnelStep({ label: 'Delivered', event: 'DELIVERED',  count: 4800, rate: 0.9697, dropOff: 150,  dropOffRate: 0.0303 }),
      makeFunnelStep({ label: 'Opened',    event: 'OPENED',     count: 1920, rate: 0.4,    dropOff: 2880, dropOffRate: 0.6    }),
      makeFunnelStep({ label: 'Clicked',   event: 'CLICKED',    count: 384,  rate: 0.2,    dropOff: 1536, dropOffRate: 0.8    }),
    ],
    ...overrides,
  };
}

export function makeRealTimeStats(
  overrides: Partial<IRealTimeStats> = {},
): IRealTimeStats {
  return {
    timestamp:         FIXED_DATE,
    lastMinute:        { sent: 12, delivered: 11, failed: 1 },
    lastHour:          { sent: 720, delivered: 695, failed: 25 },
    activeProviders:   3,
    degradedProviders: 0,
    queueDepths:       { 'lomash:email': 45, 'lomash:sms': 12, 'lomash:push': 8 },
    ...overrides,
  };
}

export function makePaginationMeta(
  overrides: Partial<IPaginationMeta> = {},
): IPaginationMeta {
  return {
    page:       1,
    limit:      20,
    total:      100,
    totalPages: 5,
    hasNext:    true,
    hasPrev:    false,
    ...overrides,
  };
}

export function makePaginatedResponse<T>(
  data:       T[],
  overrides:  Partial<IPaginationMeta> = {},
): IPaginatedResponse<T> {
  return {
    data,
    pagination: makePaginationMeta({ total: data.length, totalPages: 1, hasNext: false, ...overrides }),
  };
}

export function makeRawNotificationRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id:                'clxnotif1000000000000000001',
    channel:           'EMAIL',
    status:            'DELIVERED',
    priority:          'NORMAL',
    recipientEmail:    'john.doe@example.com',
    recipientPhone:    null,
    recipientDevice:   null,
    templateId:        'clxtmpl10000000000000000001',
    campaignId:        null,
    batchId:           null,
    providerId:        'clxprov10000000000000000001',
    providerMessageId: 'provider_msg_id_001',
    retryCount:        0,
    sentAt:            FIXED_DATE,
    deliveredAt:       FIXED_DATE,
    createdAt:         FIXED_DATE,
    updatedAt:         FIXED_DATE,
    ...overrides,
  };
}

export function makeRawDeliveryReportRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id:                'clxdeliv1000000000000000001',
    notificationId:    'clxnotif1000000000000000001',
    providerId:        'clxprov10000000000000000001',
    status:            'DELIVERED',
    providerMessageId: 'provider_msg_id_001',
    providerTimestamp: FIXED_DATE,
    openedAt:          null,
    clickedAt:         null,
    bouncedAt:         null,
    bounceType:        null,
    complainedAt:      null,
    unsubscribedAt:    null,
    segments:          null,
    createdAt:         FIXED_DATE,
    ...overrides,
  };
}

export function makeAggregatedRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    _count: { _all: 100 },
    channel: 'EMAIL',
    status:  'DELIVERED',
    ...overrides,
  };
}

function omitKey<T extends Record<string, unknown>, K extends keyof T>(obj: T, key: K): Omit<T, K> {
  const { [key]: _omitted, ...rest } = obj;
  return rest as Omit<T, K>;
}