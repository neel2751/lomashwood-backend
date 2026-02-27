import { describe, it, expect } from '@jest/globals';
import {
  chunk,
  sleep,
  exponentialDelay,
  sanitizePhone,
  maskEmail,
  maskPhone,
  buildDateRange,
  formatDuration,
  roundToDecimalPlaces,
  groupByDate,
  fillDateGaps,
} from '../../shared/utils';

describe('chunk', () => {
  it('splits array into chunks of given size', () => {
    const result = chunk([1, 2, 3, 4, 5], 2);
    expect(result).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('returns single chunk when size exceeds array length', () => {
    const result = chunk([1, 2], 10);
    expect(result).toEqual([[1, 2]]);
  });

  it('returns empty array for empty input', () => {
    expect(chunk([], 3)).toEqual([]);
  });
});

describe('sleep', () => {
  it('resolves after given milliseconds', async () => {
    const start = Date.now();
    await sleep(50);
    expect(Date.now() - start).toBeGreaterThanOrEqual(45);
  });
});

describe('exponentialDelay', () => {
  it('returns base delay for attempt 0', () => {
    expect(exponentialDelay(0, 500)).toBe(500);
  });

  it('doubles delay on each attempt', () => {
    expect(exponentialDelay(1, 500)).toBe(1000);
    expect(exponentialDelay(2, 500)).toBe(2000);
    expect(exponentialDelay(3, 500)).toBe(4000);
  });
});

describe('sanitizePhone', () => {
  it('removes non-numeric characters except leading plus', () => {
    expect(sanitizePhone('+44 7700 900 123')).toBe('+447700900123');
  });

  it('strips dashes and spaces', () => {
    expect(sanitizePhone('07700-900-123')).toBe('07700900123');
  });
});

describe('maskEmail', () => {
  it('masks all but first two chars of local part', () => {
    const masked = maskEmail('johndoe@example.com');
    expect(masked).toMatch(/^jo\*+@example\.com$/);
  });

  it('preserves domain part unchanged', () => {
    const masked = maskEmail('a@test.co.uk');
    expect(masked).toContain('@test.co.uk');
  });
});

describe('maskPhone', () => {
  it('masks all but last 4 digits', () => {
    const masked = maskPhone('+447700900123');
    expect(masked).toMatch(/\*+0123$/);
  });

  it('preserves last 4 digits', () => {
    const masked = maskPhone('07700900456');
    expect(masked.slice(-4)).toBe('0456');
  });
});

describe('buildDateRange', () => {
  it('returns from set to start of day and to set to end of day', () => {
    const { from, to } = buildDateRange('2025-01-01', '2025-01-31');
    expect(from.getHours()).toBe(0);
    expect(from.getMinutes()).toBe(0);
    expect(to.getHours()).toBe(23);
    expect(to.getMinutes()).toBe(59);
  });
});

describe('formatDuration', () => {
  it('formats seconds into mm:ss', () => {
    expect(formatDuration(90)).toBe('1:30');
    expect(formatDuration(3661)).toBe('61:01');
  });

  it('returns 0:00 for zero seconds', () => {
    expect(formatDuration(0)).toBe('0:00');
  });
});

describe('roundToDecimalPlaces', () => {
  it('rounds to specified decimal places', () => {
    expect(roundToDecimalPlaces(0.123456, 2)).toBe(0.12);
    expect(roundToDecimalPlaces(0.125, 2)).toBe(0.13);
  });

  it('handles integers correctly', () => {
    expect(roundToDecimalPlaces(5, 2)).toBe(5);
  });
});

describe('groupByDate', () => {
  it('groups records by ISO date string key', () => {
    const records = [
      { date: new Date('2025-01-01'), value: 10 },
      { date: new Date('2025-01-01'), value: 20 },
      { date: new Date('2025-01-02'), value: 5 },
    ];
    const grouped = groupByDate(records, (r) => r.date);
    expect(Object.keys(grouped)).toHaveLength(2);
    expect(grouped['2025-01-01']).toHaveLength(2);
  });
});

describe('fillDateGaps', () => {
  it('inserts zero-value entries for missing dates in range', () => {
    const data = [
      { date: '2025-01-01', value: 10 },
      { date: '2025-01-03', value: 5 },
    ];
    const filled = fillDateGaps(data, new Date('2025-01-01'), new Date('2025-01-03'));
    expect(filled).toHaveLength(3);
    expect(filled[1].date).toBe('2025-01-02');
    expect(filled[1].value).toBe(0);
  });
});