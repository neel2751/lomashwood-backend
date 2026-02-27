import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_STATUSES,
  DELIVERY_STATUSES,
  CAMPAIGN_STATUSES,
  SUBSCRIPTION_STATUSES,
  RETRY_STRATEGIES,
  TEMPLATE_CHANNELS,
  WEBHOOK_STATUSES,
  DEFAULT_RETRY_POLICY,
  DEFAULT_RATE_LIMITS,
  SMS_MAX_LENGTH,
  PUSH_TITLE_MAX_LENGTH,
  PUSH_BODY_MAX_LENGTH,
  EMAIL_SUBJECT_MAX_LENGTH,
  REDIS_KEY_PREFIXES,
  NOTIFICATION_EVENTS,
  JOB_NAMES,
  PROVIDER_NAMES,
} from '../../shared/constants';

describe('Notification Service Constants', () => {
  describe('NOTIFICATION_CHANNELS', () => {
    it('contains EMAIL channel', () => {
      expect(NOTIFICATION_CHANNELS).toContain('EMAIL');
    });

    it('contains SMS channel', () => {
      expect(NOTIFICATION_CHANNELS).toContain('SMS');
    });

    it('contains PUSH channel', () => {
      expect(NOTIFICATION_CHANNELS).toContain('PUSH');
    });

    it('has exactly 3 channels', () => {
      expect(NOTIFICATION_CHANNELS).toHaveLength(3);
    });
  });

  describe('NOTIFICATION_STATUSES', () => {
    it('contains PENDING status', () => {
      expect(NOTIFICATION_STATUSES).toContain('PENDING');
    });

    it('contains SENT status', () => {
      expect(NOTIFICATION_STATUSES).toContain('SENT');
    });

    it('contains FAILED status', () => {
      expect(NOTIFICATION_STATUSES).toContain('FAILED');
    });
  });

  describe('DELIVERY_STATUSES', () => {
    it('contains DELIVERED status', () => {
      expect(DELIVERY_STATUSES).toContain('DELIVERED');
    });

    it('contains FAILED status', () => {
      expect(DELIVERY_STATUSES).toContain('FAILED');
    });

    it('contains BOUNCED status', () => {
      expect(DELIVERY_STATUSES).toContain('BOUNCED');
    });
  });

  describe('CAMPAIGN_STATUSES', () => {
    it('contains all expected campaign lifecycle states', () => {
      expect(CAMPAIGN_STATUSES).toContain('DRAFT');
      expect(CAMPAIGN_STATUSES).toContain('ACTIVE');
      expect(CAMPAIGN_STATUSES).toContain('PAUSED');
      expect(CAMPAIGN_STATUSES).toContain('CANCELLED');
      expect(CAMPAIGN_STATUSES).toContain('COMPLETED');
    });
  });

  describe('SUBSCRIPTION_STATUSES', () => {
    it('contains ACTIVE and INACTIVE statuses', () => {
      expect(SUBSCRIPTION_STATUSES).toContain('ACTIVE');
      expect(SUBSCRIPTION_STATUSES).toContain('INACTIVE');
    });
  });

  describe('RETRY_STRATEGIES', () => {
    it('contains LINEAR strategy', () => {
      expect(RETRY_STRATEGIES).toContain('LINEAR');
    });

    it('contains EXPONENTIAL_BACKOFF strategy', () => {
      expect(RETRY_STRATEGIES).toContain('EXPONENTIAL_BACKOFF');
    });

    it('contains FIXED strategy', () => {
      expect(RETRY_STRATEGIES).toContain('FIXED');
    });
  });

  describe('TEMPLATE_CHANNELS', () => {
    it('mirrors notification channels', () => {
      expect(TEMPLATE_CHANNELS).toContain('EMAIL');
      expect(TEMPLATE_CHANNELS).toContain('SMS');
      expect(TEMPLATE_CHANNELS).toContain('PUSH');
    });
  });

  describe('WEBHOOK_STATUSES', () => {
    it('contains ACTIVE and INACTIVE statuses', () => {
      expect(WEBHOOK_STATUSES).toContain('ACTIVE');
      expect(WEBHOOK_STATUSES).toContain('INACTIVE');
    });
  });

  describe('DEFAULT_RETRY_POLICY', () => {
    it('has a maxAttempts value greater than 0', () => {
      expect(DEFAULT_RETRY_POLICY.maxAttempts).toBeGreaterThan(0);
    });

    it('has an initialDelayMs value greater than 0', () => {
      expect(DEFAULT_RETRY_POLICY.initialDelayMs).toBeGreaterThan(0);
    });

    it('has a defined strategy', () => {
      expect(RETRY_STRATEGIES).toContain(DEFAULT_RETRY_POLICY.strategy);
    });
  });

  describe('DEFAULT_RATE_LIMITS', () => {
    it('defines EMAIL rate limits', () => {
      expect(DEFAULT_RATE_LIMITS).toHaveProperty('EMAIL');
      expect(DEFAULT_RATE_LIMITS.EMAIL.maxPerMinute).toBeGreaterThan(0);
      expect(DEFAULT_RATE_LIMITS.EMAIL.maxPerHour).toBeGreaterThan(0);
      expect(DEFAULT_RATE_LIMITS.EMAIL.maxPerDay).toBeGreaterThan(0);
    });

    it('defines SMS rate limits', () => {
      expect(DEFAULT_RATE_LIMITS).toHaveProperty('SMS');
      expect(DEFAULT_RATE_LIMITS.SMS.maxPerMinute).toBeGreaterThan(0);
    });

    it('defines PUSH rate limits', () => {
      expect(DEFAULT_RATE_LIMITS).toHaveProperty('PUSH');
      expect(DEFAULT_RATE_LIMITS.PUSH.maxPerMinute).toBeGreaterThan(0);
    });

    it('EMAIL daily limit is greater than hourly limit', () => {
      expect(DEFAULT_RATE_LIMITS.EMAIL.maxPerDay).toBeGreaterThan(DEFAULT_RATE_LIMITS.EMAIL.maxPerHour);
    });

    it('EMAIL hourly limit is greater than per-minute limit', () => {
      expect(DEFAULT_RATE_LIMITS.EMAIL.maxPerHour).toBeGreaterThan(DEFAULT_RATE_LIMITS.EMAIL.maxPerMinute);
    });
  });

  describe('Message length limits', () => {
    it('SMS_MAX_LENGTH is 160', () => {
      expect(SMS_MAX_LENGTH).toBe(160);
    });

    it('PUSH_TITLE_MAX_LENGTH is a positive number', () => {
      expect(PUSH_TITLE_MAX_LENGTH).toBeGreaterThan(0);
    });

    it('PUSH_BODY_MAX_LENGTH is a positive number', () => {
      expect(PUSH_BODY_MAX_LENGTH).toBeGreaterThan(0);
    });

    it('EMAIL_SUBJECT_MAX_LENGTH is a positive number', () => {
      expect(EMAIL_SUBJECT_MAX_LENGTH).toBeGreaterThan(0);
    });

    it('PUSH_BODY_MAX_LENGTH is greater than PUSH_TITLE_MAX_LENGTH', () => {
      expect(PUSH_BODY_MAX_LENGTH).toBeGreaterThanOrEqual(PUSH_TITLE_MAX_LENGTH);
    });
  });

  describe('REDIS_KEY_PREFIXES', () => {
    it('defines rate limit prefix', () => {
      expect(REDIS_KEY_PREFIXES).toHaveProperty('RATE_LIMIT');
      expect(typeof REDIS_KEY_PREFIXES.RATE_LIMIT).toBe('string');
      expect(REDIS_KEY_PREFIXES.RATE_LIMIT.length).toBeGreaterThan(0);
    });

    it('defines notification prefix', () => {
      expect(REDIS_KEY_PREFIXES).toHaveProperty('NOTIFICATION');
      expect(typeof REDIS_KEY_PREFIXES.NOTIFICATION).toBe('string');
    });

    it('defines session prefix', () => {
      expect(REDIS_KEY_PREFIXES).toHaveProperty('SESSION');
      expect(typeof REDIS_KEY_PREFIXES.SESSION).toBe('string');
    });

    it('all prefixes are unique', () => {
      const values = Object.values(REDIS_KEY_PREFIXES);
      const unique = new Set(values);
      expect(unique.size).toBe(values.length);
    });
  });

  describe('NOTIFICATION_EVENTS', () => {
    it('defines EMAIL_SENT event', () => {
      expect(NOTIFICATION_EVENTS).toHaveProperty('EMAIL_SENT');
    });

    it('defines SMS_SENT event', () => {
      expect(NOTIFICATION_EVENTS).toHaveProperty('SMS_SENT');
    });

    it('defines PUSH_SENT event', () => {
      expect(NOTIFICATION_EVENTS).toHaveProperty('PUSH_SENT');
    });

    it('defines NOTIFICATION_FAILED event', () => {
      expect(NOTIFICATION_EVENTS).toHaveProperty('NOTIFICATION_FAILED');
    });

    it('all event values are non-empty strings', () => {
      Object.values(NOTIFICATION_EVENTS).forEach((value) => {
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      });
    });
  });

  describe('JOB_NAMES', () => {
    it('defines RETRY_FAILED_MESSAGES job', () => {
      expect(JOB_NAMES).toHaveProperty('RETRY_FAILED_MESSAGES');
    });

    it('defines PURGE_OLD_LOGS job', () => {
      expect(JOB_NAMES).toHaveProperty('PURGE_OLD_LOGS');
    });

    it('defines CLEANUP_TEMPLATES job', () => {
      expect(JOB_NAMES).toHaveProperty('CLEANUP_TEMPLATES');
    });

    it('defines ROTATE_PROVIDER_KEYS job', () => {
      expect(JOB_NAMES).toHaveProperty('ROTATE_PROVIDER_KEYS');
    });

    it('all job names are non-empty strings', () => {
      Object.values(JOB_NAMES).forEach((value) => {
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      });
    });
  });

  describe('PROVIDER_NAMES', () => {
    it('defines email providers', () => {
      expect(PROVIDER_NAMES).toHaveProperty('NODEMAILER');
      expect(PROVIDER_NAMES).toHaveProperty('SES');
    });

    it('defines sms providers', () => {
      expect(PROVIDER_NAMES).toHaveProperty('TWILIO');
      expect(PROVIDER_NAMES).toHaveProperty('MSG91');
    });

    it('defines push providers', () => {
      expect(PROVIDER_NAMES).toHaveProperty('FIREBASE');
      expect(PROVIDER_NAMES).toHaveProperty('WEBPUSH');
    });

    it('all provider names are non-empty strings', () => {
      Object.values(PROVIDER_NAMES).forEach((value) => {
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      });
    });
  });
});