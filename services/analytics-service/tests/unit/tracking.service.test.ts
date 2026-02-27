import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { TrackingService } from '../../app/tracking/tracking.service';
import { TrackingRepository } from '../../app/tracking/tracking.repository';
import { AppError } from '../../shared/errors';

const mockRepository = {
  createEvent: jest.fn(),
  createPageview: jest.fn(),
  createSession: jest.fn(),
  endSession: jest.fn(),
  findSessionById: jest.fn(),
  findEventById: jest.fn(),
  findPageviewById: jest.fn(),
};

const mockEventProducer = {
  publish: jest.fn().mockResolvedValue(undefined),
};

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

const makeService = () =>
  new TrackingService(
    mockRepository as unknown as TrackingRepository,
    mockEventProducer as never,
    mockLogger as never,
  );

describe('TrackingService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('trackEvent', () => {
    it('creates an event record and publishes domain event', async () => {
      const event = { id: 'evt-1', sessionId: 'sess-1', name: 'click', properties: {}, createdAt: new Date() };
      mockRepository.createEvent.mockResolvedValue(event);

      const service = makeService();
      const result = await service.trackEvent({ sessionId: 'sess-1', name: 'click', properties: {} });

      expect(result.id).toBe('evt-1');
      expect(mockEventProducer.publish).toHaveBeenCalledTimes(1);
    });
  });

  describe('trackPageview', () => {
    it('creates a pageview record', async () => {
      const pv = { id: 'pv-1', sessionId: 'sess-1', url: '/kitchens', title: 'Kitchens', createdAt: new Date() };
      mockRepository.createPageview.mockResolvedValue(pv);

      const service = makeService();
      const result = await service.trackPageview({ sessionId: 'sess-1', url: '/kitchens', title: 'Kitchens' });

      expect(result.url).toBe('/kitchens');
      expect(mockRepository.createPageview).toHaveBeenCalledTimes(1);
    });
  });

  describe('startSession', () => {
    it('creates a session record', async () => {
      const session = { id: 'sess-1', visitorId: 'v-1', startedAt: new Date(), endedAt: null, createdAt: new Date() };
      mockRepository.createSession.mockResolvedValue(session);

      const service = makeService();
      const result = await service.startSession({ visitorId: 'v-1' });

      expect(result.id).toBe('sess-1');
      expect(result.endedAt).toBeNull();
    });
  });

  describe('endSession', () => {
    it('ends an active session', async () => {
      const session = { id: 'sess-1', visitorId: 'v-1', endedAt: null, startedAt: new Date(), createdAt: new Date() };
      const ended = { ...session, endedAt: new Date(), duration: 300 };
      mockRepository.findSessionById.mockResolvedValue(session);
      mockRepository.endSession.mockResolvedValue(ended);

      const service = makeService();
      const result = await service.endSession('sess-1');

      expect(result.endedAt).not.toBeNull();
    });

    it('throws AppError when session already ended', async () => {
      const session = { id: 'sess-1', endedAt: new Date() };
      mockRepository.findSessionById.mockResolvedValue(session);

      const service = makeService();
      await expect(service.endSession('sess-1')).rejects.toBeInstanceOf(AppError);
    });

    it('throws AppError when session not found', async () => {
      mockRepository.findSessionById.mockResolvedValue(null);

      const service = makeService();
      await expect(service.endSession('missing')).rejects.toBeInstanceOf(AppError);
    });
  });

  describe('batchTrack', () => {
    it('processes multiple events and pageviews in one call', async () => {
      const event = { id: 'evt-1', sessionId: 'sess-1', name: 'click', properties: {}, createdAt: new Date() };
      const pv = { id: 'pv-1', sessionId: 'sess-1', url: '/kitchens', title: 'Kitchens', createdAt: new Date() };
      mockRepository.createEvent.mockResolvedValue(event);
      mockRepository.createPageview.mockResolvedValue(pv);

      const service = makeService();
      const result = await service.batchTrack({
        sessionId: 'sess-1',
        events: [{ name: 'click', properties: {} }],
        pageviews: [{ url: '/kitchens', title: 'Kitchens' }],
      });

      expect(result.events).toHaveLength(1);
      expect(result.pageviews).toHaveLength(1);
    });
  });
});