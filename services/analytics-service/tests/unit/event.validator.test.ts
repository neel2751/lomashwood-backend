import { z } from 'zod';

const trackEventSchema = z.object({
  eventName: z.string().min(1).max(100),
  eventType: z.enum(['PAGE_VIEW', 'CLICK', 'FORM_SUBMIT', 'PURCHASE', 'CUSTOM']),
  sessionId: z.string().uuid(),
  userId: z.string().uuid().optional(),
  url: z.string().url(),
  referrer: z.string().url().optional(),
  properties: z.record(z.unknown()).optional(),
  userAgent: z.string().optional(),
  ipAddress: z.string().optional(),
});

const getEventsQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().int().positive()),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().int().positive().max(100)),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  eventType: z
    .enum(['PAGE_VIEW', 'CLICK', 'FORM_SUBMIT', 'PURCHASE', 'CUSTOM'])
    .optional(),
  userId: z.string().uuid().optional(),
  sessionId: z.string().uuid().optional(),
});

describe('Event Validators', () => {
  describe('trackEventSchema', () => {
    const validPayload = {
      eventName: 'page_view',
      eventType: 'PAGE_VIEW' as const,
      sessionId: '123e4567-e89b-12d3-a456-426614174000',
      url: 'https://lomashwood.co.uk/kitchens',
    };

    it('should pass with valid minimal payload', () => {
      const result = trackEventSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it('should pass with full valid payload', () => {
      const fullPayload = {
        ...validPayload,
        userId: '223e4567-e89b-12d3-a456-426614174001',
        referrer: 'https://google.com',
        properties: { source: 'organic', category: 'kitchen' },
        userAgent: 'Mozilla/5.0',
        ipAddress: '127.0.0.1',
      };

      const result = trackEventSchema.safeParse(fullPayload);
      expect(result.success).toBe(true);
    });

    it('should fail when eventName is empty', () => {
      const result = trackEventSchema.safeParse({ ...validPayload, eventName: '' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('eventName');
      }
    });

    it('should fail when eventName exceeds 100 characters', () => {
      const result = trackEventSchema.safeParse({
        ...validPayload,
        eventName: 'a'.repeat(101),
      });
      expect(result.success).toBe(false);
    });

    it('should fail with invalid eventType', () => {
      const result = trackEventSchema.safeParse({
        ...validPayload,
        eventType: 'INVALID_TYPE',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('eventType');
      }
    });

    it('should fail with invalid sessionId (not UUID)', () => {
      const result = trackEventSchema.safeParse({
        ...validPayload,
        sessionId: 'not-a-uuid',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('sessionId');
      }
    });

    it('should fail with invalid url', () => {
      const result = trackEventSchema.safeParse({
        ...validPayload,
        url: 'not-a-valid-url',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('url');
      }
    });

    it('should fail when required fields are missing', () => {
      const result = trackEventSchema.safeParse({});
      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.error.issues.map((i) => i.path[0]);
        expect(paths).toContain('eventName');
        expect(paths).toContain('eventType');
        expect(paths).toContain('sessionId');
        expect(paths).toContain('url');
      }
    });

    it('should allow all valid eventType enum values', () => {
      const eventTypes = ['PAGE_VIEW', 'CLICK', 'FORM_SUBMIT', 'PURCHASE', 'CUSTOM'];
      eventTypes.forEach((eventType) => {
        const result = trackEventSchema.safeParse({ ...validPayload, eventType });
        expect(result.success).toBe(true);
      });
    });

    it('should accept optional userId as valid UUID', () => {
      const result = trackEventSchema.safeParse({
        ...validPayload,
        userId: '323e4567-e89b-12d3-a456-426614174002',
      });
      expect(result.success).toBe(true);
    });

    it('should fail when userId is provided but not a valid UUID', () => {
      const result = trackEventSchema.safeParse({
        ...validPayload,
        userId: 'invalid-user-id',
      });
      expect(result.success).toBe(false);
    });

    it('should accept properties as a record of unknown values', () => {
      const result = trackEventSchema.safeParse({
        ...validPayload,
        properties: {
          productId: 'prod-123',
          category: 'kitchen',
          price: 1500,
          available: true,
        },
      });
      expect(result.success).toBe(true);
    });
  });

  describe('getEventsQuerySchema', () => {
    it('should pass with empty query (use defaults)', () => {
      const result = getEventsQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it('should parse page and limit strings to numbers', () => {
      const result = getEventsQuerySchema.safeParse({ page: '2', limit: '50' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(50);
      }
    });

    it('should fail when limit exceeds 100', () => {
      const result = getEventsQuerySchema.safeParse({ limit: '101' });
      expect(result.success).toBe(false);
    });

    it('should pass with valid date range', () => {
      const result = getEventsQuerySchema.safeParse({
        startDate: '2026-01-01T00:00:00Z',
        endDate: '2026-01-31T23:59:59Z',
      });
      expect(result.success).toBe(true);
    });

    it('should fail with invalid date format', () => {
      const result = getEventsQuerySchema.safeParse({
        startDate: '01-01-2026',
      });
      expect(result.success).toBe(false);
    });

    it('should fail with invalid eventType filter', () => {
      const result = getEventsQuerySchema.safeParse({ eventType: 'UNKNOWN' });
      expect(result.success).toBe(false);
    });

    it('should pass with valid eventType filter', () => {
      const result = getEventsQuerySchema.safeParse({ eventType: 'PAGE_VIEW' });
      expect(result.success).toBe(true);
    });
  });
});