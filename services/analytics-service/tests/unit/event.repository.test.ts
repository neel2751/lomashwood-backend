import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { TrackingRepository } from '../../src/app/tracking/tracking.repository';
import { EventType, DeviceType } from '../../src/app/tracking/tracking.schemas';

// Mock the getPrismaClient function
jest.mock('../../src/infrastructure/db/prisma.client', () => ({
  getPrismaClient: jest.fn(),
}));

const { getPrismaClient } = require('../../src/infrastructure/db/prisma.client');

const mockPrisma = {
  analyticsEvent: {
    create: jest.fn(),
    createMany: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    deleteMany: jest.fn(),
  },
  analyticsSession: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  pageView: {
    create: jest.fn(),
  },
  trackingConfig: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('TrackingRepository', () => {
  let trackingRepository: TrackingRepository;

  const mockEvent = {
    id: 'event-id-1',
    sessionId: 'session-id-1',
    visitorId: 'visitor-id-1',
    userId: 'user-id-1',
    eventType: EventType.PAGE_VIEW,
    eventName: 'page_view',
    page: 'https://lomashwood.co.uk/kitchens',
    referrer: 'https://google.com',
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
    utmContent: null,
    utmTerm: null,
    deviceType: DeviceType.DESKTOP,
    browser: 'Chrome',
    os: 'Windows',
    country: 'UK',
    region: 'England',
    city: 'London',
    ipHash: 'hash123',
    properties: { source: 'organic' },
    duration: 1000,
    createdAt: new Date('2026-01-01T10:00:00Z'),
    updatedAt: new Date('2026-01-01T10:00:00Z'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    getPrismaClient.mockReturnValue(mockPrisma);
    trackingRepository = new TrackingRepository();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createEvent', () => {
    it('should create a tracking event in the database', async () => {
      mockPrisma.analyticsEvent.create.mockResolvedValue(mockEvent);

      const dto = {
        eventName: 'page_view',
        eventType: EventType.PAGE_VIEW,
        sessionId: 'session-id-1',
        visitorId: 'visitor-id-1',
        page: 'https://lomashwood.co.uk/kitchens',
      };

      const result = await trackingRepository.createEvent(dto);

      expect(mockPrisma.analyticsEvent.create).toHaveBeenCalled();
      expect(result).toEqual(mockEvent);
    });

    it('should throw when prisma create fails', async () => {
      mockPrisma.analyticsEvent.create.mockRejectedValue(new Error('Unique constraint'));

      await expect(
        trackingRepository.createEvent({
          eventName: 'page_view',
          eventType: EventType.PAGE_VIEW,
          sessionId: 'session-id-1',
          visitorId: 'visitor-id-1',
          page: 'https://lomashwood.co.uk',
        })
      ).rejects.toThrow('Unique constraint');
    });
  });

  describe('createManyEvents', () => {
    it('should create multiple tracking events', async () => {
      const events = [mockEvent, { ...mockEvent, id: 'event-id-2' }];
      mockPrisma.analyticsEvent.createMany.mockResolvedValue({ count: 2 });

      const dtos = [
        {
          eventName: 'page_view',
          eventType: EventType.PAGE_VIEW,
          sessionId: 'session-id-1',
          visitorId: 'visitor-id-1',
          page: 'https://lomashwood.co.uk/kitchens',
        },
      ];

      const result = await trackingRepository.createManyEvents(dtos);

      expect(mockPrisma.analyticsEvent.createMany).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });
  });

  describe('findSessionById', () => {
    it('should return a session by id', async () => {
      mockPrisma.analyticsSession.findUnique.mockResolvedValue({
        id: 'session-id-1',
        visitorId: 'visitor-id-1',
      });

      const result = await trackingRepository.findSessionById('session-id-1');

      expect(mockPrisma.analyticsSession.findUnique).toHaveBeenCalledWith({
        where: { id: 'session-id-1' },
      });
      expect((result as Partial<{ id: string }>)?.id).toBe('session-id-1');
    });

    it('should return null when session not found', async () => {
      mockPrisma.analyticsSession.findUnique.mockResolvedValue(null);

      const result = await trackingRepository.findSessionById('nonexistent-id');

      expect(result).toBeNull();
    });
  });



});