import { FIXED_DATE, FIXED_IDS } from './common.fixture';

export interface IExport {
  id:          string;
  reportId:    string | null;
  reportType:  string;
  format:      'csv' | 'json' | 'xlsx';
  status:      'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  filters:     Record<string, unknown>;
  fileUrl:     string | null;
  fileSizeBytes: number | null;
  rowCount:    number | null;
  expiresAt:   Date | null;
  error:       string | null;
  requestedBy: string;
  createdAt:   Date;
  updatedAt:   Date;
}

export const completedCsvExportFixture: IExport = {
  id:          FIXED_IDS.EXPORT_1,
  reportId:    FIXED_IDS.REPORT_1,
  reportType:  'DELIVERY',
  format:      'csv',
  status:      'COMPLETED',
  filters:     { channel: 'ALL', dateFrom: '2025-01-01', dateTo: '2025-01-31' },
  fileUrl:     'https://exports.lomashwood.co.uk/analytics/delivery-report-jan-2025.csv',
  fileSizeBytes: 245760,
  rowCount:    9000,
  expiresAt:   new Date('2025-02-15T10:00:00.000Z'),
  error:       null,
  requestedBy: 'clxuser1000000000000000001',
  createdAt:   FIXED_DATE,
  updatedAt:   FIXED_DATE,
};

export const completedJsonExportFixture: IExport = {
  id:          'clxexpt20000000000000000002',
  reportId:    'clxrprt20000000000000000002',
  reportType:  'ENGAGEMENT',
  format:      'json',
  status:      'COMPLETED',
  filters:     { channel: 'EMAIL', dateFrom: '2025-01-01', dateTo: '2025-01-31' },
  fileUrl:     'https://exports.lomashwood.co.uk/analytics/engagement-report-jan-2025.json',
  fileSizeBytes: 98304,
  rowCount:    4020,
  expiresAt:   new Date('2025-02-15T10:00:00.000Z'),
  error:       null,
  requestedBy: 'clxuser1000000000000000001',
  createdAt:   FIXED_DATE,
  updatedAt:   FIXED_DATE,
};

export const completedXlsxExportFixture: IExport = {
  id:          'clxexpt30000000000000000003',
  reportId:    null,
  reportType:  'CAMPAIGN',
  format:      'xlsx',
  status:      'COMPLETED',
  filters:     { campaignId: 'clxcamp10000000000000000001' },
  fileUrl:     'https://exports.lomashwood.co.uk/analytics/campaign-report-spring.xlsx',
  fileSizeBytes: 512000,
  rowCount:    4950,
  expiresAt:   new Date('2025-02-15T10:00:00.000Z'),
  error:       null,
  requestedBy: 'clxuser1000000000000000001',
  createdAt:   FIXED_DATE,
  updatedAt:   FIXED_DATE,
};

export const processingExportFixture: IExport = {
  id:            'clxexpt40000000000000000004',
  reportId:      null,
  reportType:    'COHORT',
  format:        'csv',
  status:        'PROCESSING',
  filters:       { cohortId: FIXED_IDS.COHORT_1 },
  fileUrl:       null,
  fileSizeBytes: null,
  rowCount:      null,
  expiresAt:     null,
  error:         null,
  requestedBy:   'clxuser1000000000000000001',
  createdAt:     FIXED_DATE,
  updatedAt:     FIXED_DATE,
};

export const pendingExportFixture: IExport = {
  ...processingExportFixture,
  id:     'clxexpt50000000000000000005',
  status: 'PENDING',
  format: 'json',
};

export const failedExportFixture: IExport = {
  id:            'clxexpt60000000000000000006',
  reportId:      null,
  reportType:    'FUNNEL',
  format:        'xlsx',
  status:        'FAILED',
  filters:       { funnelId: FIXED_IDS.FUNNEL_1 },
  fileUrl:       null,
  fileSizeBytes: null,
  rowCount:      null,
  expiresAt:     null,
  error:         'Failed to generate XLSX: memory limit exceeded',
  requestedBy:   'clxuser1000000000000000001',
  createdAt:     FIXED_DATE,
  updatedAt:     FIXED_DATE,
};

export const expiredExportFixture: IExport = {
  ...completedCsvExportFixture,
  id:        'clxexpt70000000000000000007',
  expiresAt: new Date('2025-01-01T00:00:00.000Z'),
  fileUrl:   null,
};

export const exportCsvRowsFixture = [
  { id: 'clxnotif1000000000000000001', channel: 'EMAIL', status: 'DELIVERED', sentAt: '2025-01-15T10:00:00.000Z', deliveredAt: '2025-01-15T10:00:05.000Z', recipientEmail: 'john@example.com' },
  { id: 'clxnotif2000000000000000002', channel: 'EMAIL', status: 'OPENED',    sentAt: '2025-01-15T10:01:00.000Z', deliveredAt: '2025-01-15T10:01:04.000Z', recipientEmail: 'jane@example.com' },
  { id: 'clxnotif3000000000000000003', channel: 'SMS',   status: 'DELIVERED', sentAt: '2025-01-15T10:02:00.000Z', deliveredAt: '2025-01-15T10:02:02.000Z', recipientPhone: '+441234567890'    },
];

export const allExportsFixture: IExport[] = [
  completedCsvExportFixture,
  completedJsonExportFixture,
  completedXlsxExportFixture,
  processingExportFixture,
  failedExportFixture,
];