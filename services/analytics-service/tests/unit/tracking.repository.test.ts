import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { TrackingRepository } from '../../app/tracking/tracking.repository';

const mockPrisma = {
  analyticsEvent: {
    create: jest.fn(),
    findUnique: jest.fn(),
    createMany: jest.fn(),
  },
  analyticsPageview: {
    create: jest.fn(),
    findUnique: jest.fn(),
    createMany: jest.fn(),
  },
  analyticsSession: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

const makeRepository = () => new TrackingRepository(mockPrisma as never);

describe('TrackingRepository', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('createEvent', () => {
    it('creates event and returns mapped record', async () => {
      const raw = { id: 'evt-1', sessionId: 'sess-1', name: 'click', properties: {}, userId: null, ipAddress: null, userAgent: null, createdAt: new Date() };
      mockPrisma.analyticsEvent.create.mockResolvedValue(raw);

      const repo = makeRepository();
      const result = await repo.createEvent({ sessionId: 'sess-1', name: 'click', properties: {} });

      expect(result.id).toBe('evt-1');
    });
  });

  describe('createPageview', () => {
    it('creates pageview and returns mapped record', async () => {
      const raw = { id: 'pv-1', sessionId: 'sess-1', url: '/kitchens', title: 'Kitchens', referrer: null, duration: null, userId: null, createdAt: new Date() };
      mockPrisma.analyticsPageview.create.mockResolvedValue(raw);

      const repo = makeRepository();
      const result = await repo.createPageview({ sessionId: 'sess-1', url: '/kitchens', title: 'Kitchens' });

      expect(result.url).toBe('/kitchens');
    });
  });

  describe('createSession', () => {
    it('creates session and returns mapped record', async () => {
      const raw = { id: 'sess-1', visitorId: 'v-1', userId: null, startedAt: new Date(), endedAt: null, duration: null, pageCount: 0, referrer: null, utmSource: null, utmMedium: null, utmCampaign: null, createdAt: new Date() };
      mockPrisma.analyticsSession.create.mockResolvedValue(raw);

      const repo = makeRepository();
      const result = await repo.createSession({ visitorId: 'v-1' });

      expect(result.id).toBe('sess-1');
    });
  });

  describe('endSession', () => {
    it('updates session endedAt and duration', async () => {
      const endedAt = new Date();
      const raw = { id: 'sess-1', visitorId: 'v-1', startedAt: new Date(Date.now() - 300_000), endedAt, duration: 300, pageCount: 3, userId: null, referrer: null, utmSource: null, utmMedium: null, utmCampaign: null, createdAt: new Date() };
      mockPrisma.analyticsSession.update.mockResolvedValue(raw);

      const repo = makeRepository();
      const result = await repo.endSession('sess-1', endedAt);

      expect(result.endedAt).toEqual(endedAt);
      expect(mockPrisma.analyticsSession.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'sess-1' } }),
      );
    });
  });

  describe('findSessionById', () => {
    it('returns mapped session when found', async () => {
      const raw = { id: 'sess-1', visitorId: 'v-1', userId: null, startedAt: new Date(), endedAt: null, duration: null, pageCount: 0, referrer: null, utmSource: null, utmMedium: null, utmCampaign: null, createdAt: new Date() };
      mockPrisma.analyticsSession.findUnique.mockResolvedValue(raw);

      const repo = makeRepository();
      const result = await repo.findSessionById('sess-1');

      expect(result?.id).toBe('sess-1');
    });

    it('returns null when not found', async () => {
      mockPrisma.analyticsSession.findUnique.mockResolvedValue(null);

      const repo = makeRepository();
      expect(await repo.findSessionById('missing')).toBeNull();
    });
  });

  describe('bulkCreateEvents', () => {
    it('calls createMany with correct count', async () => {
      mockPrisma.analyticsEvent.createMany.mockResolvedValue({ count: 3 });

      const repo = makeRepository();
      const count = await repo.bulkCreateEvents([
        { sessionId: 'sess-1', name: 'click', properties: {} },
        { sessionId: 'sess-1', name: 'scroll', properties: {} },
        { sessionId: 'sess-1', name: 'hover', properties: {} },
      ]);

      expect(count).toBe(3);
    });
  });
});