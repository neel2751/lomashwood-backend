import { FIXED_DATE, FIXED_IDS, FIXED_RANGE_START, FIXED_RANGE_END } from './common.fixture';
import {
  emailNotificationMetricsFixture,
  emailEngagementMetricsFixture,
  dailyNotificationTrendFixture,
  nodemailerPerformanceFixture,
  sesPerformanceFixture,
  twilioPerformanceFixture,
} from './metrics.fixture';
import { appointmentFunnelAnalysisFixture } from './funnels.fixture';
import { cohortAnalysisFixture } from './cohorts.fixture';

export interface IReport {
  id:          string;
  name:        string;
  type:        'DELIVERY' | 'ENGAGEMENT' | 'CAMPAIGN' | 'FUNNEL' | 'COHORT' | 'PROVIDER' | 'CUSTOM';
  status:      'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  dateRange:   { from: Date; to: Date };
  filters:     Record<string, unknown>;
  data:        Record<string, unknown> | null;
  generatedAt: Date | null;
  createdBy:   string;
  createdAt:   Date;
  updatedAt:   Date;
}

export const deliveryReportFixture: IReport = {
  id:     FIXED_IDS.REPORT_1,
  name:   'January 2025 Delivery Report',
  type:   'DELIVERY',
  status: 'COMPLETED',
  dateRange: { from: FIXED_RANGE_START, to: FIXED_RANGE_END },
  filters: { channel: 'ALL' },
  data: {
    summary:     emailNotificationMetricsFixture,
    byChannel: {
      EMAIL: emailNotificationMetricsFixture,
    },
    trend:       dailyNotificationTrendFixture,
    providers:   [nodemailerPerformanceFixture, sesPerformanceFixture],
  },
  generatedAt: FIXED_DATE,
  createdBy:   'clxuser1000000000000000001',
  createdAt:   FIXED_DATE,
  updatedAt:   FIXED_DATE,
};

export const engagementReportFixture: IReport = {
  id:     'clxrprt20000000000000000002',
  name:   'January 2025 Email Engagement Report',
  type:   'ENGAGEMENT',
  status: 'COMPLETED',
  dateRange: { from: FIXED_RANGE_START, to: FIXED_RANGE_END },
  filters: { channel: 'EMAIL' },
  data: {
    summary:  emailEngagementMetricsFixture,
    trend:    dailyNotificationTrendFixture,
    topTemplates: [
      { slug: 'appointment-confirmation-email', openRate: 0.52, clickRate: 0.14, sent: 840 },
      { slug: 'brochure-request-confirmation-email', openRate: 0.44, clickRate: 0.09, sent: 420 },
    ],
  },
  generatedAt: FIXED_DATE,
  createdBy:   'clxuser1000000000000000001',
  createdAt:   FIXED_DATE,
  updatedAt:   FIXED_DATE,
};

export const funnelReportFixture: IReport = {
  id:     'clxrprt30000000000000000003',
  name:   'Appointment Funnel Report – Jan 2025',
  type:   'FUNNEL',
  status: 'COMPLETED',
  dateRange: { from: FIXED_RANGE_START, to: FIXED_RANGE_END },
  filters: { funnelId: FIXED_IDS.FUNNEL_1 },
  data: {
    funnel: appointmentFunnelAnalysisFixture,
    comparison: null,
  },
  generatedAt: FIXED_DATE,
  createdBy:   'clxuser1000000000000000001',
  createdAt:   FIXED_DATE,
  updatedAt:   FIXED_DATE,
};

export const cohortReportFixture: IReport = {
  id:     'clxrprt40000000000000000004',
  name:   'Q4 2024 Cohort Retention Report',
  type:   'COHORT',
  status: 'COMPLETED',
  dateRange: { from: new Date('2024-10-01'), to: new Date('2024-12-31') },
  filters: { cohortId: FIXED_IDS.COHORT_1 },
  data: {
    cohort:      cohortAnalysisFixture,
    insights: [
      'Month 1 retention is 40.5%, above industry average of 25%.',
      'Cohort size grew 28% from November to December.',
    ],
  },
  generatedAt: FIXED_DATE,
  createdBy:   'clxuser1000000000000000001',
  createdAt:   FIXED_DATE,
  updatedAt:   FIXED_DATE,
};

export const processingReportFixture: IReport = {
  id:          'clxrprt50000000000000000005',
  name:        'Provider Performance Report',
  type:        'PROVIDER',
  status:      'PROCESSING',
  dateRange:   { from: FIXED_RANGE_START, to: FIXED_RANGE_END },
  filters:     {},
  data:        null,
  generatedAt: null,
  createdBy:   'clxuser1000000000000000001',
  createdAt:   FIXED_DATE,
  updatedAt:   FIXED_DATE,
};

export const failedReportFixture: IReport = {
  ...processingReportFixture,
  id:     'clxrprt60000000000000000006',
  name:   'Failed Custom Report',
  type:   'CUSTOM',
  status: 'FAILED',
  data:   { error: 'Timeout exceeded after 30s' },
};

export const pendingReportFixture: IReport = {
  ...processingReportFixture,
  id:     'clxrprt70000000000000000007',
  name:   'Pending Campaign Report',
  type:   'CAMPAIGN',
  status: 'PENDING',
  data:   null,
};

export const allReportsFixture: IReport[] = [
  deliveryReportFixture,
  engagementReportFixture,
  funnelReportFixture,
  cohortReportFixture,
  processingReportFixture,
  failedReportFixture,
];