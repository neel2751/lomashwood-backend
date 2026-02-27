import { describe, it, expect } from '@jest/globals';
import {
  SERVICE_NAME,
  PAGINATION,
  CACHE_TTL,
  METRIC_CHANNELS,
  NOTIFICATION_STATUSES,
  CAMPAIGN_STATUSES,
  DELIVERY_EVENTS,
  DATE_GRANULARITY,
  EXPORT_FORMATS,
  DATE_RANGE_PRESETS,
} from '../../src/shared/constants';

describe('Service identity', () => {
  it('SERVICE_NAME is the correct service identifier', () => {
    expect(SERVICE_NAME).toBe('analytics-service');
  });
});

describe('Pagination defaults', () => {
  it('PAGINATION.DEFAULT_PAGE is 1', () => {
    expect(PAGINATION.DEFAULT_PAGE).toBe(1);
  });

  it('PAGINATION.DEFAULT_LIMIT is 20', () => {
    expect(PAGINATION.DEFAULT_LIMIT).toBe(20);
  });

  it('PAGINATION.MAX_LIMIT is 100', () => {
    expect(PAGINATION.MAX_LIMIT).toBe(100);
  });

  it('MAX_LIMIT is greater than DEFAULT_LIMIT', () => {
    expect(PAGINATION.MAX_LIMIT).toBeGreaterThan(PAGINATION.DEFAULT_LIMIT);
  });
});

describe('NOTIFICATION_STATUSES constants', () => {
  it('contains expected statuses', () => {
    expect(NOTIFICATION_STATUSES.PENDING).toBe('PENDING');
    expect(NOTIFICATION_STATUSES.SENT).toBe('SENT');
    expect(NOTIFICATION_STATUSES.FAILED).toBe('FAILED');
  });

  it('all values are non-empty strings', () => {
    Object.values(NOTIFICATION_STATUSES).forEach((v) => {
      expect(typeof v).toBe('string');
      expect((v as string).length).toBeGreaterThan(0);
    });
  });
});

describe('METRIC_CHANNELS constants', () => {
  it('contains EMAIL, SMS, PUSH and ALL', () => {
    expect(METRIC_CHANNELS.EMAIL).toBeDefined();
    expect(METRIC_CHANNELS.SMS).toBeDefined();
    expect(METRIC_CHANNELS.PUSH).toBeDefined();
    expect(METRIC_CHANNELS.ALL).toBeDefined();
  });

  it('all values are non-empty strings', () => {
    Object.values(METRIC_CHANNELS).forEach((v) => {
      expect(typeof v).toBe('string');
      expect((v as string).length).toBeGreaterThan(0);
    });
  });
});

describe('CACHE_TTL', () => {
  it('REAL_TIME is the shortest TTL', () => {
    expect(CACHE_TTL.REAL_TIME).toBeLessThan(CACHE_TTL.DASHBOARD_SUMMARY);
  });

  it('DASHBOARD_SUMMARY is less than CHANNEL_STATS', () => {
    expect(CACHE_TTL.DASHBOARD_SUMMARY).toBeLessThan(CACHE_TTL.CHANNEL_STATS);
  });

  it('all values are positive integers in seconds', () => {
    Object.values(CACHE_TTL).forEach((v) => {
      expect(Number.isInteger(v as number)).toBe(true);
      expect(v as number).toBeGreaterThan(0);
    });
  });
});

describe('DATE_GRANULARITY', () => {
  it('contains hour, day, week, month and year', () => {
    expect(DATE_GRANULARITY.HOUR).toBe('hour');
    expect(DATE_GRANULARITY.DAY).toBe('day');
    expect(DATE_GRANULARITY.WEEK).toBe('week');
    expect(DATE_GRANULARITY.MONTH).toBe('month');
    expect(DATE_GRANULARITY.YEAR).toBe('year');
  });
});

describe('EXPORT_FORMATS', () => {
  it('contains csv, json and xlsx', () => {
    expect(EXPORT_FORMATS.CSV).toBe('csv');
    expect(EXPORT_FORMATS.JSON).toBe('json');
    expect(EXPORT_FORMATS.XLSX).toBe('xlsx');
  });
});

describe('DATE_RANGE_PRESETS', () => {
  it('contains common date range presets', () => {
    expect(DATE_RANGE_PRESETS.TODAY).toBeDefined();
    expect(DATE_RANGE_PRESETS.LAST_7_DAYS).toBeDefined();
    expect(DATE_RANGE_PRESETS.LAST_30_DAYS).toBeDefined();
    expect(DATE_RANGE_PRESETS.CUSTOM).toBeDefined();
  });

  it('all values are non-empty strings', () => {
    Object.values(DATE_RANGE_PRESETS).forEach((v) => {
      expect(typeof v).toBe('string');
      expect((v as string).length).toBeGreaterThan(0);
    });
  });
});

describe('DELIVERY_EVENTS', () => {
  it('contains key delivery event types', () => {
    expect(DELIVERY_EVENTS.DELIVERED).toBe('DELIVERED');
    expect(DELIVERY_EVENTS.OPENED).toBe('OPENED');
    expect(DELIVERY_EVENTS.CLICKED).toBe('CLICKED');
    expect(DELIVERY_EVENTS.BOUNCED).toBe('BOUNCED');
    expect(DELIVERY_EVENTS.FAILED).toBe('FAILED');
  });
});

describe('CAMPAIGN_STATUSES', () => {
  it('contains key campaign statuses', () => {
    expect(CAMPAIGN_STATUSES.DRAFT).toBe('DRAFT');
    expect(CAMPAIGN_STATUSES.RUNNING).toBe('RUNNING');
    expect(CAMPAIGN_STATUSES.COMPLETED).toBe('COMPLETED');
    expect(CAMPAIGN_STATUSES.CANCELLED).toBe('CANCELLED');
  });
});