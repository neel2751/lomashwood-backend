import {
  LOYALTY_TIERS,
  LOYALTY_TIER_THRESHOLDS,
  TICKET_STATUSES,
  TICKET_PRIORITIES,
  REVIEW_STATUSES,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_TYPES,
  REFERRAL_CODE_PREFIX,
  PAGINATION_DEFAULTS,
  POINTS_ACTIONS,
  RATING_MIN,
  RATING_MAX,
} from '../../src/shared/constants';

describe('LOYALTY_TIERS', () => {
  it('should define all four loyalty tiers', () => {
    expect(LOYALTY_TIERS).toContain('BRONZE');
    expect(LOYALTY_TIERS).toContain('SILVER');
    expect(LOYALTY_TIERS).toContain('GOLD');
    expect(LOYALTY_TIERS).toContain('PLATINUM');
  });

  it('should have exactly four tiers', () => {
    expect(LOYALTY_TIERS).toHaveLength(4);
  });
});

describe('LOYALTY_TIER_THRESHOLDS', () => {
  it('should define thresholds for all non-bronze tiers', () => {
    expect(LOYALTY_TIER_THRESHOLDS).toHaveProperty('SILVER');
    expect(LOYALTY_TIER_THRESHOLDS).toHaveProperty('GOLD');
    expect(LOYALTY_TIER_THRESHOLDS).toHaveProperty('PLATINUM');
  });

  it('should have ascending threshold values', () => {
    expect(LOYALTY_TIER_THRESHOLDS.SILVER).toBeLessThan(LOYALTY_TIER_THRESHOLDS.GOLD);
    expect(LOYALTY_TIER_THRESHOLDS.GOLD).toBeLessThan(LOYALTY_TIER_THRESHOLDS.PLATINUM);
  });

  it('should have positive threshold values', () => {
    Object.values(LOYALTY_TIER_THRESHOLDS).forEach((threshold) => {
      expect(threshold).toBeGreaterThan(0);
    });
  });
});

describe('TICKET_STATUSES', () => {
  it('should define core ticket statuses', () => {
    expect(TICKET_STATUSES).toContain('OPEN');
    expect(TICKET_STATUSES).toContain('IN_PROGRESS');
    expect(TICKET_STATUSES).toContain('RESOLVED');
    expect(TICKET_STATUSES).toContain('CLOSED');
  });
});

describe('TICKET_PRIORITIES', () => {
  it('should define all priority levels', () => {
    expect(TICKET_PRIORITIES).toContain('LOW');
    expect(TICKET_PRIORITIES).toContain('MEDIUM');
    expect(TICKET_PRIORITIES).toContain('HIGH');
    expect(TICKET_PRIORITIES).toContain('URGENT');
  });
});

describe('REVIEW_STATUSES', () => {
  it('should define all review statuses', () => {
    expect(REVIEW_STATUSES).toContain('PENDING');
    expect(REVIEW_STATUSES).toContain('APPROVED');
    expect(REVIEW_STATUSES).toContain('REJECTED');
  });
});

describe('NOTIFICATION_CHANNELS', () => {
  it('should define all delivery channels', () => {
    expect(NOTIFICATION_CHANNELS).toContain('email');
    expect(NOTIFICATION_CHANNELS).toContain('sms');
    expect(NOTIFICATION_CHANNELS).toContain('push');
  });

  it('should have exactly three channels', () => {
    expect(NOTIFICATION_CHANNELS).toHaveLength(3);
  });
});

describe('NOTIFICATION_TYPES', () => {
  it('should define all notification type keys', () => {
    expect(NOTIFICATION_TYPES).toContain('orderUpdates');
    expect(NOTIFICATION_TYPES).toContain('promotions');
    expect(NOTIFICATION_TYPES).toContain('appointmentReminders');
    expect(NOTIFICATION_TYPES).toContain('deliveryAlerts');
    expect(NOTIFICATION_TYPES).toContain('reviewRequests');
    expect(NOTIFICATION_TYPES).toContain('loyaltyUpdates');
  });
});

describe('REFERRAL_CODE_PREFIX', () => {
  it('should be the string LW-', () => {
    expect(REFERRAL_CODE_PREFIX).toBe('LW-');
  });
});

describe('PAGINATION_DEFAULTS', () => {
  it('should define default page as 1', () => {
    expect(PAGINATION_DEFAULTS.page).toBe(1);
  });

  it('should define a reasonable default limit', () => {
    expect(PAGINATION_DEFAULTS.limit).toBeGreaterThan(0);
    expect(PAGINATION_DEFAULTS.limit).toBeLessThanOrEqual(100);
  });

  it('should define a max limit', () => {
    expect(PAGINATION_DEFAULTS).toHaveProperty('maxLimit');
    expect(PAGINATION_DEFAULTS.maxLimit).toBeGreaterThanOrEqual(PAGINATION_DEFAULTS.limit);
  });
});

describe('POINTS_ACTIONS', () => {
  it('should define credit actions', () => {
    expect(POINTS_ACTIONS).toHaveProperty('PURCHASE');
    expect(POINTS_ACTIONS).toHaveProperty('REFERRAL');
    expect(POINTS_ACTIONS).toHaveProperty('REVIEW');
  });

  it('should define a debit action', () => {
    expect(POINTS_ACTIONS).toHaveProperty('REDEMPTION');
  });

  it('should have positive values for credit actions', () => {
    expect(POINTS_ACTIONS.PURCHASE).toBeGreaterThan(0);
    expect(POINTS_ACTIONS.REFERRAL).toBeGreaterThan(0);
  });
});

describe('RATING_MIN and RATING_MAX', () => {
  it('should define minimum rating as 1', () => {
    expect(RATING_MIN).toBe(1);
  });

  it('should define maximum rating as 5', () => {
    expect(RATING_MAX).toBe(5);
  });

  it('should have min less than max', () => {
    expect(RATING_MIN).toBeLessThan(RATING_MAX);
  });
});