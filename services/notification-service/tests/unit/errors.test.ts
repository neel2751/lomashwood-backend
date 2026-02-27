import {
  NotificationError,
  NotificationNotFoundError,
  TemplateNotFoundError,
  TemplateRenderError,
  EmailDeliveryError,
  SmsDeliveryError,
  PushDeliveryError,
  WebhookDispatchError,
  RateLimitExceededError,
  InvalidRecipientError,
  CampaignStateError,
  SubscriptionConflictError,
  ProviderError,
} from '../../shared/errors';

describe('Notification Service Errors', () => {
  describe('NotificationError', () => {
    it('is an instance of Error', () => {
      const err = new NotificationError('base error');
      expect(err).toBeInstanceOf(Error);
    });

    it('sets message correctly', () => {
      const err = new NotificationError('base error');
      expect(err.message).toBe('base error');
    });

    it('has correct name', () => {
      const err = new NotificationError('base error');
      expect(err.name).toBe('NotificationError');
    });

    it('accepts an optional statusCode', () => {
      const err = new NotificationError('base error', 422);
      expect(err.statusCode).toBe(422);
    });

    it('defaults statusCode to 500', () => {
      const err = new NotificationError('base error');
      expect(err.statusCode).toBe(500);
    });
  });

  describe('NotificationNotFoundError', () => {
    it('is an instance of NotificationError', () => {
      const err = new NotificationNotFoundError('notif-1');
      expect(err).toBeInstanceOf(NotificationError);
    });

    it('sets statusCode to 404', () => {
      const err = new NotificationNotFoundError('notif-1');
      expect(err.statusCode).toBe(404);
    });

    it('includes notification id in message', () => {
      const err = new NotificationNotFoundError('notif-abc');
      expect(err.message).toContain('notif-abc');
    });
  });

  describe('TemplateNotFoundError', () => {
    it('is an instance of NotificationError', () => {
      const err = new TemplateNotFoundError('welcome-email');
      expect(err).toBeInstanceOf(NotificationError);
    });

    it('sets statusCode to 404', () => {
      const err = new TemplateNotFoundError('welcome-email');
      expect(err.statusCode).toBe(404);
    });

    it('includes template name in message', () => {
      const err = new TemplateNotFoundError('welcome-email');
      expect(err.message).toContain('welcome-email');
    });
  });

  describe('TemplateRenderError', () => {
    it('is an instance of NotificationError', () => {
      const err = new TemplateRenderError('welcome-email', 'missing variable');
      expect(err).toBeInstanceOf(NotificationError);
    });

    it('sets statusCode to 422', () => {
      const err = new TemplateRenderError('welcome-email', 'missing variable');
      expect(err.statusCode).toBe(422);
    });

    it('includes template name and reason in message', () => {
      const err = new TemplateRenderError('welcome-email', 'missing variable');
      expect(err.message).toContain('welcome-email');
      expect(err.message).toContain('missing variable');
    });
  });

  describe('EmailDeliveryError', () => {
    it('is an instance of NotificationError', () => {
      const err = new EmailDeliveryError('user@example.com', 'SMTP timeout');
      expect(err).toBeInstanceOf(NotificationError);
    });

    it('sets statusCode to 502', () => {
      const err = new EmailDeliveryError('user@example.com', 'SMTP timeout');
      expect(err.statusCode).toBe(502);
    });

    it('exposes recipient and reason', () => {
      const err = new EmailDeliveryError('user@example.com', 'SMTP timeout');
      expect(err.recipient).toBe('user@example.com');
      expect(err.reason).toBe('SMTP timeout');
    });
  });

  describe('SmsDeliveryError', () => {
    it('is an instance of NotificationError', () => {
      const err = new SmsDeliveryError('+447911123456', 'Invalid number');
      expect(err).toBeInstanceOf(NotificationError);
    });

    it('sets statusCode to 502', () => {
      const err = new SmsDeliveryError('+447911123456', 'Invalid number');
      expect(err.statusCode).toBe(502);
    });

    it('exposes recipient and reason', () => {
      const err = new SmsDeliveryError('+447911123456', 'Invalid number');
      expect(err.recipient).toBe('+447911123456');
      expect(err.reason).toBe('Invalid number');
    });
  });

  describe('PushDeliveryError', () => {
    it('is an instance of NotificationError', () => {
      const err = new PushDeliveryError('device-token-abc', 'Invalid registration token');
      expect(err).toBeInstanceOf(NotificationError);
    });

    it('sets statusCode to 502', () => {
      const err = new PushDeliveryError('device-token-abc', 'Invalid registration token');
      expect(err.statusCode).toBe(502);
    });

    it('exposes token and reason', () => {
      const err = new PushDeliveryError('device-token-abc', 'Invalid registration token');
      expect(err.token).toBe('device-token-abc');
      expect(err.reason).toBe('Invalid registration token');
    });
  });

  describe('WebhookDispatchError', () => {
    it('is an instance of NotificationError', () => {
      const err = new WebhookDispatchError('wh-1', 'https://example.com/hook', 503);
      expect(err).toBeInstanceOf(NotificationError);
    });

    it('exposes webhookId, url and responseCode', () => {
      const err = new WebhookDispatchError('wh-1', 'https://example.com/hook', 503);
      expect(err.webhookId).toBe('wh-1');
      expect(err.url).toBe('https://example.com/hook');
      expect(err.responseCode).toBe(503);
    });
  });

  describe('RateLimitExceededError', () => {
    it('is an instance of NotificationError', () => {
      const err = new RateLimitExceededError('email', 'user-1');
      expect(err).toBeInstanceOf(NotificationError);
    });

    it('sets statusCode to 429', () => {
      const err = new RateLimitExceededError('email', 'user-1');
      expect(err.statusCode).toBe(429);
    });

    it('includes channel and userId in message', () => {
      const err = new RateLimitExceededError('email', 'user-1');
      expect(err.message).toContain('email');
      expect(err.message).toContain('user-1');
    });
  });

  describe('InvalidRecipientError', () => {
    it('is an instance of NotificationError', () => {
      const err = new InvalidRecipientError('bad-recipient', 'email');
      expect(err).toBeInstanceOf(NotificationError);
    });

    it('sets statusCode to 400', () => {
      const err = new InvalidRecipientError('bad-recipient', 'email');
      expect(err.statusCode).toBe(400);
    });
  });

  describe('CampaignStateError', () => {
    it('is an instance of NotificationError', () => {
      const err = new CampaignStateError('camp-1', 'ACTIVE', 'DRAFT');
      expect(err).toBeInstanceOf(NotificationError);
    });

    it('sets statusCode to 409', () => {
      const err = new CampaignStateError('camp-1', 'ACTIVE', 'DRAFT');
      expect(err.statusCode).toBe(409);
    });

    it('includes current and target state in message', () => {
      const err = new CampaignStateError('camp-1', 'ACTIVE', 'DRAFT');
      expect(err.message).toContain('ACTIVE');
      expect(err.message).toContain('DRAFT');
    });
  });

  describe('SubscriptionConflictError', () => {
    it('is an instance of NotificationError', () => {
      const err = new SubscriptionConflictError('user-1', 'promotions');
      expect(err).toBeInstanceOf(NotificationError);
    });

    it('sets statusCode to 409', () => {
      const err = new SubscriptionConflictError('user-1', 'promotions');
      expect(err.statusCode).toBe(409);
    });
  });

  describe('ProviderError', () => {
    it('is an instance of NotificationError', () => {
      const err = new ProviderError('twilio', 'Auth failure');
      expect(err).toBeInstanceOf(NotificationError);
    });

    it('sets statusCode to 503', () => {
      const err = new ProviderError('twilio', 'Auth failure');
      expect(err.statusCode).toBe(503);
    });

    it('exposes provider name and reason', () => {
      const err = new ProviderError('twilio', 'Auth failure');
      expect(err.provider).toBe('twilio');
      expect(err.reason).toBe('Auth failure');
    });
  });
});