import { FIXED_DATE, FIXED_RANGE_START, FIXED_RANGE_END } from './common.fixture';

export interface INotificationMetrics {
  total: number;
  sent: number;
  delivered: number;
  failed: number;
  pending: number;
  cancelled: number;
  bounced: number;
  deliveryRate: number;
  failureRate: number;
  bounceRate: number;
}

export interface IEngagementMetrics {
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalUnsubscribed: number;
  totalComplained: number;
  openRate: number;
  clickRate: number;
  clickToOpenRate: number;
  unsubscribeRate: number;
  complaintRate: number;
}

export interface ITimeSeriesPoint {
  timestamp: string;
  value: number;
}

export interface ITimeSeries {
  granularity: 'hour' | 'day' | 'week' | 'month';
  points: ITimeSeriesPoint[];
}

export interface IProviderPerformance {
  providerId: string;
  providerName: string;
  channel: string;
  totalAttempts: number;
  totalSucceeded: number;
  totalFailed: number;
  successRate: number;
  averageLatencyMs: number;
  p95LatencyMs: number;
  consecutiveFailures: number;
  lastHealthStatus: boolean;
  isDefault: boolean;
}

export interface IChannelBreakdown {
  channel: string;
  count: number;
  percent: number;
}

export interface IRealTimeStats {
  timestamp: Date;
  lastMinute: { sent: number; delivered: number; failed: number };
  lastHour: { sent: number; delivered: number; failed: number };
  activeProviders: number;
  degradedProviders: number;
  queueDepths: Record<string, number>;
}

export const emailNotificationMetricsFixture: INotificationMetrics = {
  total:        4200,
  sent:         4158,
  delivered:    4020,
  failed:       138,
  pending:      0,
  cancelled:    42,
  bounced:      84,
  deliveryRate: 0.9669,
  failureRate:  0.0329,
  bounceRate:   0.0205,
};

export const smsNotificationMetricsFixture: INotificationMetrics = {
  total:        1800,
  sent:         1782,
  delivered:    1746,
  failed:       36,
  pending:      0,
  cancelled:    18,
  bounced:      18,
  deliveryRate: 0.9798,
  failureRate:  0.02,
  bounceRate:   0.0102,
};

export const pushNotificationMetricsFixture: INotificationMetrics = {
  total:        3000,
  sent:         2760,
  delivered:    2364,
  failed:       396,
  pending:      0,
  cancelled:    240,
  bounced:      0,
  deliveryRate: 0.8565,
  failureRate:  0.132,
  bounceRate:   0,
};

export const allChannelsTotalMetricsFixture: INotificationMetrics = {
  total:        9000,
  sent:         8700,
  delivered:    8130,
  failed:       570,
  pending:      0,
  cancelled:    300,
  bounced:      102,
  deliveryRate: 0.9345,
  failureRate:  0.0633,
  bounceRate:   0.0124,
};

export const zeroMetricsFixture: INotificationMetrics = {
  total:        0,
  sent:         0,
  delivered:    0,
  failed:       0,
  pending:      0,
  cancelled:    0,
  bounced:      0,
  deliveryRate: 0,
  failureRate:  0,
  bounceRate:   0,
};

export const emailEngagementMetricsFixture: IEngagementMetrics = {
  totalDelivered:    4020,
  totalOpened:       920,
  totalClicked:      184,
  totalUnsubscribed: 12,
  totalComplained:   4,
  openRate:          0.2289,
  clickRate:         0.0458,
  clickToOpenRate:   0.2,
  unsubscribeRate:   0.0030,
  complaintRate:     0.001,
};

export const smsEngagementMetricsFixture: IEngagementMetrics = {
  totalDelivered:    1746,
  totalOpened:       0,
  totalClicked:      96,
  totalUnsubscribed: 4,
  totalComplained:   0,
  openRate:          0,
  clickRate:         0.055,
  clickToOpenRate:   0,
  unsubscribeRate:   0.0023,
  complaintRate:     0,
};

export const dailyNotificationTrendFixture: ITimeSeries = {
  granularity: 'day',
  points: [
    { timestamp: '2025-01-01', value: 280 },
    { timestamp: '2025-01-02', value: 295 },
    { timestamp: '2025-01-03', value: 310 },
    { timestamp: '2025-01-04', value: 250 },
    { timestamp: '2025-01-05', value: 220 },
    { timestamp: '2025-01-06', value: 198 },
    { timestamp: '2025-01-07', value: 312 },
    { timestamp: '2025-01-08', value: 298 },
    { timestamp: '2025-01-09', value: 320 },
    { timestamp: '2025-01-10', value: 335 },
    { timestamp: '2025-01-11', value: 260 },
    { timestamp: '2025-01-12', value: 230 },
    { timestamp: '2025-01-13', value: 218 },
    { timestamp: '2025-01-14', value: 342 },
    { timestamp: '2025-01-15', value: 328 },
  ],
};

export const hourlyTrendFixture: ITimeSeries = {
  granularity: 'hour',
  points: [
    { timestamp: '2025-01-15T00:00:00.000Z', value: 12 },
    { timestamp: '2025-01-15T01:00:00.000Z', value: 8  },
    { timestamp: '2025-01-15T02:00:00.000Z', value: 5  },
    { timestamp: '2025-01-15T06:00:00.000Z', value: 18 },
    { timestamp: '2025-01-15T09:00:00.000Z', value: 45 },
    { timestamp: '2025-01-15T10:00:00.000Z', value: 62 },
    { timestamp: '2025-01-15T11:00:00.000Z', value: 58 },
    { timestamp: '2025-01-15T12:00:00.000Z', value: 71 },
    { timestamp: '2025-01-15T17:00:00.000Z', value: 84 },
    { timestamp: '2025-01-15T18:00:00.000Z', value: 92 },
    { timestamp: '2025-01-15T20:00:00.000Z', value: 55 },
    { timestamp: '2025-01-15T22:00:00.000Z', value: 30 },
    { timestamp: '2025-01-15T23:00:00.000Z', value: 18 },
  ],
};

export const openRateTrendFixture: ITimeSeries = {
  granularity: 'day',
  points: [
    { timestamp: '2025-01-01', value: 0.218 },
    { timestamp: '2025-01-07', value: 0.231 },
    { timestamp: '2025-01-14', value: 0.225 },
    { timestamp: '2025-01-15', value: 0.240 },
  ],
};

export const nodemailerPerformanceFixture: IProviderPerformance = {
  providerId:          'clxprov10000000000000000001',
  providerName:        'nodemailer-smtp',
  channel:             'EMAIL',
  totalAttempts:       4200,
  totalSucceeded:      4060,
  totalFailed:         140,
  successRate:         0.9667,
  averageLatencyMs:    248,
  p95LatencyMs:        840,
  consecutiveFailures: 0,
  lastHealthStatus:    true,
  isDefault:           true,
};

export const sesPerformanceFixture: IProviderPerformance = {
  providerId:          'clxprov20000000000000000002',
  providerName:        'aws-ses',
  channel:             'EMAIL',
  totalAttempts:       320,
  totalSucceeded:      318,
  totalFailed:         2,
  successRate:         0.9938,
  averageLatencyMs:    182,
  p95LatencyMs:        540,
  consecutiveFailures: 0,
  lastHealthStatus:    true,
  isDefault:           false,
};

export const twilioPerformanceFixture: IProviderPerformance = {
  providerId:          'clxprov30000000000000000003',
  providerName:        'twilio-sms',
  channel:             'SMS',
  totalAttempts:       1800,
  totalSucceeded:      1762,
  totalFailed:         38,
  successRate:         0.9789,
  averageLatencyMs:    412,
  p95LatencyMs:        1200,
  consecutiveFailures: 0,
  lastHealthStatus:    true,
  isDefault:           true,
};

export const degradedProviderPerformanceFixture: IProviderPerformance = {
  ...nodemailerPerformanceFixture,
  providerId:          'clxprov50000000000000000005',
  providerName:        'nodemailer-degraded',
  totalFailed:         480,
  successRate:         0.52,
  consecutiveFailures: 5,
  lastHealthStatus:    false,
};

export const channelBreakdownFixture: IChannelBreakdown[] = [
  { channel: 'EMAIL', count: 4200, percent: 0.4667 },
  { channel: 'SMS',   count: 1800, percent: 0.2    },
  { channel: 'PUSH',  count: 3000, percent: 0.3333 },
];

export const realTimeStatsFixture: IRealTimeStats = {
  timestamp:         FIXED_DATE,
  lastMinute:        { sent: 18, delivered: 16, failed: 2  },
  lastHour:          { sent: 980, delivered: 920, failed: 60 },
  activeProviders:   4,
  degradedProviders: 0,
  queueDepths:       { 'lomash:email': 82, 'lomash:sms': 24, 'lomash:push': 45 },
};

export const realTimeStatsDegradedFixture: IRealTimeStats = {
  ...realTimeStatsFixture,
  lastMinute:        { sent: 8, delivered: 3, failed: 5 },
  activeProviders:   3,
  degradedProviders: 1,
  queueDepths:       { 'lomash:email': 480, 'lomash:sms': 24, 'lomash:push': 45 },
};