import { Request, Response, NextFunction } from 'express';
import { TrackingController } from '../../src/app/tracking/tracking.controller';
import { TrackingService } from '../../src/app/tracking/tracking.service';

jest.mock('../../src/app/tracking/tracking.service');
jest.mock('../../src/infrastructure/cache/redis.client');
jest.mock('../../src/config/logger');

describe('TrackingController', () => {
  let controller: TrackingController;
  let mockService: jest.Mocked<TrackingService>;
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

  const mockSession = {
    id: 'session-id-1',
    visitorId: 'visitor-1',
    startedAt: new Date('2026-01-01T10:00:00Z'),
    endedAt: null,
  };

  beforeEach(() => {
    // TrackingService is auto-mocked — grab the mock instance
    mockService = new TrackingService(null as never) as jest.Mocked<TrackingService>;

    controller = new TrackingController();

    // Inject the mock service onto the controller's private field
    (controller as unknown as { trackingService: TrackingService }).trackingService = mockService;

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
      mockService.trackEvent.mockResolvedValue(mockEvent as never);

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

      expect(mockService.trackEvent).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('should call next with error on failure', async () => {
      const error = new Error('Service error');
      mockService.trackEvent.mockRejectedValue(error);

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

  describe('trackBatch', () => {
    it('should return 200 with batch result', async () => {
      mockService.trackBatch.mockResolvedValue({
        processed: 2,
        failed: 0,
        eventIds: ['e-1', 'e-2'],
      } as never);

      mockReq = {
        body: {
          events: [
            { eventName: 'click', eventType: 'CLICK', sessionId: 'session-id-1', url: 'https://lomashwood.co.uk' },
            { eventName: 'scroll', eventType: 'SCROLL', sessionId: 'session-id-1', url: 'https://lomashwood.co.uk' },
          ],
        },
      };

      await controller.trackBatch(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.trackBatch).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should call next on error', async () => {
      mockService.trackBatch.mockRejectedValue(new Error('Batch error'));

      mockReq = { body: { events: [] } };

      await controller.trackBatch(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('startSession', () => {
    it('should return 201 with session', async () => {
      mockService.startSession.mockResolvedValue(mockSession as never);

      mockReq = {
        body: {
          visitorId: 'visitor-1',
          userAgent: 'Mozilla/5.0',
          ipAddress: '127.0.0.1',
        },
      };

      await controller.startSession(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.startSession).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('should call next on error', async () => {
      mockService.startSession.mockRejectedValue(new Error('Session error'));

      mockReq = { body: { visitorId: 'visitor-1' } };

      await controller.startSession(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('endSession', () => {
    it('should return 200 when session ended', async () => {
      mockService.endSession.mockResolvedValue({ ...mockSession, endedAt: new Date() } as never);

      mockReq = { body: { sessionId: 'session-id-1' } };

      await controller.endSession(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.endSession).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should call next on error', async () => {
      mockService.endSession.mockRejectedValue(new Error('End session error'));

      mockReq = { body: { sessionId: 'session-id-1' } };

      await controller.endSession(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('trackPageView', () => {
    it('should return 201 with page view', async () => {
      mockService.trackPageView.mockResolvedValue({
        id: 'pv-1',
        sessionId: 'session-id-1',
        url: 'https://lomashwood.co.uk',
      } as never);

      mockReq = {
        body: {
          sessionId: 'session-id-1',
          url: 'https://lomashwood.co.uk',
        },
      };

      await controller.trackPageView(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.trackPageView).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
  });

  describe('getAllConfigs', () => {
    it('should return 200 with configs', async () => {
      mockService.getAllTrackingConfigs.mockResolvedValue([] as never);

      mockReq = { query: { enabled: 'true' } };

      await controller.getAllConfigs(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.getAllTrackingConfigs).toHaveBeenCalledWith(true);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getConfigByKey', () => {
    it('should return 200 with config', async () => {
      mockService.getTrackingConfigByKey.mockResolvedValue({ key: 'ga4', enabled: true } as never);

      mockReq = { params: { key: 'ga4' } };

      await controller.getConfigByKey(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.getTrackingConfigByKey).toHaveBeenCalledWith('ga4');
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should call next on error', async () => {
      mockService.getTrackingConfigByKey.mockRejectedValue(new Error('Not found'));

      mockReq = { params: { key: 'missing' } };

      await controller.getConfigByKey(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });
});