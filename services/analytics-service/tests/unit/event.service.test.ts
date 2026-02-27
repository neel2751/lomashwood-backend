import { EventService } from '../../src/app/tracking/tracking.service';
import { EventRepository } from '../../src/app/tracking/tracking.repository';

jest.mock('../../src/app/tracking/tracking.repository');

const mockEventRepository = jest.mocked(EventRepository);

describe('EventService', () => {
  let eventService: EventService;
  let mockRepo: jest.Mocked<EventRepository>;

  const mockEvent = {
    id: 'event-id-1',
    eventName: 'page_view',
    eventType: 'PAGE_VIEW' as const,
    sessionId: 'session-id-1',
    userId: 'user-id-1',
    url: 'https://lomashwood.co.uk/kitchens',
    properties: { source: 'organic' },
    userAgent: 'Mozilla/5.0',
    ipAddress: '127.0.0.1',
    referrer: 'https://google.com',
    timestamp: new Date('2026-01-01T10:00:00Z'),
  };

  beforeEach(() => {
    mockRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findMany: jest.fn(),
      findByUserId: jest.fn(),
      findBySessionId: jest.fn(),
      countByEventName: jest.fn(),
      deleteOlderThan: jest.fn(),
    } as unknown as jest.Mocked<EventRepository>;

    mockEventRepository.mockImplementation(() => mockRepo);
    eventService = new EventService(mockRepo);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('trackEvent', () => {
    it('should create and return a tracked event', async () => {
      mockRepo.create.mockResolvedValue(mockEvent);

      const dto = {
        eventName: 'page_view',
        eventType: 'PAGE_VIEW' as const,
        sessionId: 'session-id-1',
        url: 'https://lomashwood.co.uk/kitchens',
        properties: { source: 'organic' },
      };

      const result = await eventService.trackEvent(dto);

      expect(mockRepo.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockEvent);
    });

    it('should throw if repository throws', async () => {
      mockRepo.create.mockRejectedValue(new Error('DB error'));

      await expect(
        eventService.trackEvent({
          eventName: 'page_view',
          eventType: 'PAGE_VIEW',
          sessionId: 'session-id-1',
          url: 'https://lomashwood.co.uk',
        })
      ).rejects.toThrow('DB error');
    });
  });

  describe('getEventById', () => {
    it('should return event by id', async () => {
      mockRepo.findById.mockResolvedValue(mockEvent);

      const result = await eventService.getEventById('event-id-1');

      expect(mockRepo.findById).toHaveBeenCalledWith('event-id-1');
      expect(result).toEqual(mockEvent);
    });

    it('should return null if event not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      const result = await eventService.getEventById('nonexistent-id');

      expect(result).toBeNull();
    });
  });

  describe('getEvents', () => {
    it('should return paginated events', async () => {
      const paginatedResult = {
        data: [mockEvent],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      };

      mockRepo.findMany.mockResolvedValue(paginatedResult);

      const result = await eventService.getEvents({ page: 1, limit: 20 });

      expect(mockRepo.findMany).toHaveBeenCalledWith({ page: 1, limit: 20 });
      expect(result).toEqual(paginatedResult);
    });

    it('should apply filters when provided', async () => {
      const paginatedResult = {
        data: [mockEvent],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      };

      mockRepo.findMany.mockResolvedValue(paginatedResult);

      const params = {
        page: 1,
        limit: 20,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-01-31'),
      };

      const result = await eventService.getEvents(params);

      expect(mockRepo.findMany).toHaveBeenCalledWith(params);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('getUserEvents', () => {
    it('should return events for a specific user', async () => {
      const paginatedResult = {
        data: [mockEvent],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      };

      mockRepo.findByUserId.mockResolvedValue(paginatedResult);

      const result = await eventService.getUserEvents('user-id-1', { page: 1, limit: 20 });

      expect(mockRepo.findByUserId).toHaveBeenCalledWith('user-id-1', { page: 1, limit: 20 });
      expect(result).toEqual(paginatedResult);
    });
  });

  describe('getSessionEvents', () => {
    it('should return events for a specific session', async () => {
      const paginatedResult = {
        data: [mockEvent],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      };

      mockRepo.findBySessionId.mockResolvedValue(paginatedResult);

      const result = await eventService.getSessionEvents('session-id-1', { page: 1, limit: 20 });

      expect(mockRepo.findBySessionId).toHaveBeenCalledWith('session-id-1', { page: 1, limit: 20 });
      expect(result).toEqual(paginatedResult);
    });
  });

  describe('trackPageView', () => {
    it('should track a page view event', async () => {
      const pageViewEvent = { ...mockEvent, eventType: 'PAGE_VIEW' as const };
      mockRepo.create.mockResolvedValue(pageViewEvent);

      const result = await eventService.trackPageView(
        'https://lomashwood.co.uk/kitchens',
        'session-id-1',
        'user-id-1',
        'https://google.com'
      );

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          eventName: 'page_view',
          eventType: 'PAGE_VIEW',
          sessionId: 'session-id-1',
          userId: 'user-id-1',
          url: 'https://lomashwood.co.uk/kitchens',
          referrer: 'https://google.com',
        })
      );
      expect(result).toEqual(pageViewEvent);
    });
  });
});