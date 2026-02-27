import { Request, Response, NextFunction } from 'express';
import { TrackingController } from '../../src/app/tracking/tracking.controller';
import { EventService } from '../../src/app/tracking/tracking.service';

jest.mock('../../src/app/tracking/tracking.service');

describe('TrackingController (Event Methods)', () => {
  let controller: TrackingController;
  let mockEventService: jest.Mocked<EventService>;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

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
    mockEventService = {
      trackEvent: jest.fn(),
      getEventById: jest.fn(),
      getEvents: jest.fn(),
      getUserEvents: jest.fn(),
      getSessionEvents: jest.fn(),
      trackPageView: jest.fn(),
    } as unknown as jest.Mocked<EventService>;

    controller = new TrackingController(mockEventService);

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('trackEvent', () => {
    it('should return 201 with created event', async () => {
      mockEventService.trackEvent.mockResolvedValue(mockEvent);

      mockReq = {
        body: {
          eventName: 'page_view',
          eventType: 'PAGE_VIEW',
          sessionId: 'session-id-1',
          url: 'https://lomashwood.co.uk/kitchens',
        },
        headers: { 'user-agent': 'Mozilla/5.0' },
        ip: '127.0.0.1',
      };

      await controller.trackEvent(mockReq as Request, mockRes as Response, mockNext);

      expect(mockEventService.trackEvent).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: mockEvent })
      );
    });

    it('should call next with error on failure', async () => {
      const error = new Error('Service error');
      mockEventService.trackEvent.mockRejectedValue(error);

      mockReq = {
        body: {
          eventName: 'page_view',
          eventType: 'PAGE_VIEW',
          sessionId: 'session-id-1',
          url: 'https://lomashwood.co.uk',
        },
        headers: {},
        ip: '127.0.0.1',
      };

      await controller.trackEvent(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getEvent', () => {
    it('should return 200 with event data', async () => {
      mockEventService.getEventById.mockResolvedValue(mockEvent);

      mockReq = { params: { eventId: 'event-id-1' } };

      await controller.getEvent(mockReq as Request, mockRes as Response, mockNext);

      expect(mockEventService.getEventById).toHaveBeenCalledWith('event-id-1');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: mockEvent })
      );
    });

    it('should return 404 when event not found', async () => {
      mockEventService.getEventById.mockResolvedValue(null);

      mockReq = { params: { eventId: 'nonexistent' } };

      await controller.getEvent(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should call next on error', async () => {
      mockEventService.getEventById.mockRejectedValue(new Error('DB error'));

      mockReq = { params: { eventId: 'event-id-1' } };

      await controller.getEvent(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('getEvents', () => {
    it('should return 200 with paginated events', async () => {
      const paginatedResult = {
        data: [mockEvent],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      };

      mockEventService.getEvents.mockResolvedValue(paginatedResult);

      mockReq = { query: { page: '1', limit: '20' } };

      await controller.getEvents(mockReq as Request, mockRes as Response, mockNext);

      expect(mockEventService.getEvents).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it('should use default pagination when not provided', async () => {
      const paginatedResult = {
        data: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
      };

      mockEventService.getEvents.mockResolvedValue(paginatedResult);

      mockReq = { query: {} };

      await controller.getEvents(mockReq as Request, mockRes as Response, mockNext);

      expect(mockEventService.getEvents).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, limit: 20 })
      );
    });
  });

  describe('getUserEvents', () => {
    it('should return 200 with user events', async () => {
      const paginatedResult = {
        data: [mockEvent],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      };

      mockEventService.getUserEvents.mockResolvedValue(paginatedResult);

      mockReq = {
        params: { userId: 'user-id-1' },
        query: { page: '1', limit: '20' },
      };

      await controller.getUserEvents(mockReq as Request, mockRes as Response, mockNext);

      expect(mockEventService.getUserEvents).toHaveBeenCalledWith('user-id-1', expect.any(Object));
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getSessionEvents', () => {
    it('should return 200 with session events', async () => {
      const paginatedResult = {
        data: [mockEvent],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      };

      mockEventService.getSessionEvents.mockResolvedValue(paginatedResult);

      mockReq = {
        params: { sessionId: 'session-id-1' },
        query: { page: '1', limit: '20' },
      };

      await controller.getSessionEvents(mockReq as Request, mockRes as Response, mockNext);

      expect(mockEventService.getSessionEvents).toHaveBeenCalledWith('session-id-1', expect.any(Object));
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });
});