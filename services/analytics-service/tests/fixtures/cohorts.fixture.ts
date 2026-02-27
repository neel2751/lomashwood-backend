import { FIXED_DATE, FIXED_IDS, FIXED_RANGE_START, FIXED_RANGE_END } from './common.fixture';

export interface ICohortDefinition {
  id:          string;
  name:        string;
  description: string;
  type:        'ACQUISITION' | 'BEHAVIOUR' | 'CUSTOM';
  criteria:    Record<string, unknown>;
  isActive:    boolean;
  createdAt:   Date;
  updatedAt:   Date;
}

export interface ICohortDataPoint {
  cohortDate:    string;
  cohortSize:    number;
  period:        number;
  periodLabel:   string;
  retained:      number;
  retentionRate: number;
}

export interface ICohortAnalysis {
  cohortId:      string;
  cohortName:    string;
  granularity:   'week' | 'month';
  dateRange:     { from: Date; to: Date };
  dataPoints:    ICohortDataPoint[];
  avgRetention:  number[];
}

export const acquisitionCohortDefinitionFixture: ICohortDefinition = {
  id:          FIXED_IDS.COHORT_1,
  name:        'Monthly Acquisition Cohort',
  description: 'Groups users by month of first visit and tracks return visits.',
  type:        'ACQUISITION',
  criteria:    { trigger: 'first_session', granularity: 'month' },
  isActive:    true,
  createdAt:   FIXED_DATE,
  updatedAt:   FIXED_DATE,
};

export const appointmentCohortDefinitionFixture: ICohortDefinition = {
  id:          'clxchrt20000000000000000002',
  name:        'Post-Appointment Engagement Cohort',
  description: 'Tracks engagement of users after booking an appointment.',
  type:        'BEHAVIOUR',
  criteria:    { trigger: 'Appointment Booked', granularity: 'week' },
  isActive:    true,
  createdAt:   FIXED_DATE,
  updatedAt:   FIXED_DATE,
};

export const cohortDataPointsFixture: ICohortDataPoint[] = [
  { cohortDate: '2024-11', cohortSize: 320, period: 0, periodLabel: 'Month 0', retained: 320, retentionRate: 1.0    },
  { cohortDate: '2024-11', cohortSize: 320, period: 1, periodLabel: 'Month 1', retained: 128, retentionRate: 0.4    },
  { cohortDate: '2024-11', cohortSize: 320, period: 2, periodLabel: 'Month 2', retained: 83,  retentionRate: 0.2594 },
  { cohortDate: '2024-12', cohortSize: 410, period: 0, periodLabel: 'Month 0', retained: 410, retentionRate: 1.0    },
  { cohortDate: '2024-12', cohortSize: 410, period: 1, periodLabel: 'Month 1', retained: 168, retentionRate: 0.4098 },
  { cohortDate: '2025-01', cohortSize: 380, period: 0, periodLabel: 'Month 0', retained: 380, retentionRate: 1.0    },
];

export const cohortAnalysisFixture: ICohortAnalysis = {
  cohortId:    FIXED_IDS.COHORT_1,
  cohortName:  'Monthly Acquisition Cohort',
  granularity: 'month',
  dateRange:   { from: FIXED_RANGE_START, to: FIXED_RANGE_END },
  dataPoints:  cohortDataPointsFixture,
  avgRetention: [1.0, 0.405, 0.2594],
};

export const weeklyRetentionCohortFixture: ICohortAnalysis = {
  cohortId:    'clxchrt20000000000000000002',
  cohortName:  'Post-Appointment Engagement Cohort',
  granularity: 'week',
  dateRange:   { from: FIXED_RANGE_START, to: FIXED_RANGE_END },
  dataPoints: [
    { cohortDate: '2025-W01', cohortSize: 42, period: 0, periodLabel: 'Week 0', retained: 42, retentionRate: 1.0    },
    { cohortDate: '2025-W01', cohortSize: 42, period: 1, periodLabel: 'Week 1', retained: 28, retentionRate: 0.6667 },
    { cohortDate: '2025-W01', cohortSize: 42, period: 2, periodLabel: 'Week 2', retained: 18, retentionRate: 0.4286 },
    { cohortDate: '2025-W01', cohortSize: 42, period: 4, periodLabel: 'Week 4', retained: 10, retentionRate: 0.2381 },
    { cohortDate: '2025-W02', cohortSize: 38, period: 0, periodLabel: 'Week 0', retained: 38, retentionRate: 1.0    },
    { cohortDate: '2025-W02', cohortSize: 38, period: 1, periodLabel: 'Week 1', retained: 24, retentionRate: 0.6316 },
  ],
  avgRetention: [1.0, 0.6491, 0.4286, 0.2381],
};

export const emptyCohortAnalysisFixture: ICohortAnalysis = {
  ...cohortAnalysisFixture,
  cohortId:    'clxchrt30000000000000000003',
  dataPoints:  [],
  avgRetention: [],
};

export const allCohortDefinitionsFixture: ICohortDefinition[] = [
  acquisitionCohortDefinitionFixture,
  appointmentCohortDefinitionFixture,
];