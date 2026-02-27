import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { AnalyticsService } from '../../src/app/analytics/analytics.service';
import { AnalyticsRepository } from '../../src/app/analytics/analytics.repository';
import { EventProducer } from '../../src/infrastructure/messaging/event-producer';
import { RedisClient } from '../../src/infrastructure/cache/redis.client';
import { NotFoundError, ValidationError } from '../../src/shared/errors';
import { 
  ProductViewEvent, 
  ProductSearchEvent, 
  ProductFilterEvent,
  AnalyticsMetrics,
  ProductAnalytics,
  CategoryAnalytics 
} from '../../src/app/analytics/analytics.types';

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService;
  let analyticsRepository: jest.Mocked<AnalyticsRepository>;
  let eventProducer: jest.Mocked<EventProducer>;
  let redisClient: jest.Mocked<RedisClient>;

  beforeEach(() => {
    analyticsRepository = {
      trackProductView: jest.fn(),
      trackProductSearch: jest.fn(),
      trackProductFilter: jest.fn(),
      getProductViewCount: jest.fn(),
      getProductAnalytics: jest.fn(),
      getCategoryAnalytics: jest.fn(),
      getTopViewedProducts: jest.fn(),
      getTopSearchedTerms: jest.fn(),
      getPopularFilters: jest.fn(),
      getConversionMetrics: jest.fn(),
      getBounceRate: jest.fn(),
      getAverageSessionDuration: jest.fn(),
      getUserJourney: jest.fn(),
      getFunnelAnalytics: jest.fn(),
      deleteAnalyticsData: jest.fn(),
      exportAnalyticsData: jest.fn(),
    } as any;

    eventProducer = {
      publish: jest.fn(),
    } as any;

    redisClient = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      incr: jest.fn(),
      expire: jest.fn(),
    } as any;

    analyticsService = new AnalyticsService(
      analyticsRepository,
      eventProducer,
      redisClient
    );
  });

  describe('trackProductView', () => {
    it('should track product view successfully', async () => {
      const viewEvent: ProductViewEvent = {
        productId: 'prod-123',
        userId: 'user-456',
        sessionId: 'session-789',
        category: 'KITCHEN',
        timestamp: new Date(),
        source: 'SEARCH',
        referrer: 'https://example.com',
        deviceType: 'DESKTOP',
        userAgent: 'Mozilla/5.0',
      };

      const trackedEvent = {
        id: 'event-123',
        ...viewEvent,
        createdAt: new Date(),
      };

      analyticsRepository.trackProductView.mockResolvedValue(trackedEvent);
      redisClient.incr.mockResolvedValue(1);

      const result = await analyticsService.trackProductView(viewEvent);

      expect(result).toEqual(trackedEvent);
      expect(analyticsRepository.trackProductView).toHaveBeenCalledWith(viewEvent);
      expect(redisClient.incr).toHaveBeenCalledWith(`product:${viewEvent.productId}:views`);
      expect(eventProducer.publish).toHaveBeenCalledWith(
        'product.view.tracked',
        expect.objectContaining({
          eventId: trackedEvent.id,
          productId: viewEvent.productId,
        })
      );
    });

    it('should throw ValidationError for invalid product view data', async () => {
      const invalidEvent = {
        productId: '',
        userId: 'user-456',
        sessionId: 'session-789',
      } as ProductViewEvent;

      await expect(
        analyticsService.trackProductView(invalidEvent)
      ).rejects.toThrow(ValidationError);
    });

    it('should handle repository errors gracefully', async () => {
      const viewEvent: ProductViewEvent = {
        productId: 'prod-123',
        userId: 'user-456',
        sessionId: 'session-789',
        category: 'KITCHEN',
        timestamp: new Date(),
        source: 'DIRECT',
        deviceType: 'MOBILE',
        userAgent: 'Mobile/Safari',
      };

      analyticsRepository.trackProductView.mockRejectedValue(
        new Error('Database error')
      );

      await expect(
        analyticsService.trackProductView(viewEvent)
      ).rejects.toThrow('Database error');
    });

    it('should cache view count after tracking', async () => {
      const viewEvent: ProductViewEvent = {
        productId: 'prod-123',
        userId: 'user-456',
        sessionId: 'session-789',
        category: 'BEDROOM',
        timestamp: new Date(),
        source: 'FILTER',
        deviceType: 'TABLET',
        userAgent: 'iPad/Safari',
      };

      const trackedEvent = {
        id: 'event-123',
        ...viewEvent,
        createdAt: new Date(),
      };

      analyticsRepository.trackProductView.mockResolvedValue(trackedEvent);
      redisClient.incr.mockResolvedValue(42);

      await analyticsService.trackProductView(viewEvent);

      expect(redisClient.incr).toHaveBeenCalledWith(`product:${viewEvent.productId}:views`);
      expect(redisClient.expire).toHaveBeenCalledWith(
        `product:${viewEvent.productId}:views`,
        3600
      );
    });
  });

  describe('trackProductSearch', () => {
    it('should track product search successfully', async () => {
      const searchEvent: ProductSearchEvent = {
        searchTerm: 'modern kitchen',
        userId: 'user-456',
        sessionId: 'session-789',
        resultsCount: 15,
        timestamp: new Date(),
        filters: {
          category: 'KITCHEN',
          colours: ['white', 'grey'],
          priceRange: { min: 1000, max: 5000 },
        },
      };

      const trackedEvent = {
        id: 'search-123',
        ...searchEvent,
        createdAt: new Date(),
      };

      analyticsRepository.trackProductSearch.mockResolvedValue(trackedEvent);

      const result = await analyticsService.trackProductSearch(searchEvent);

      expect(result).toEqual(trackedEvent);
      expect(analyticsRepository.trackProductSearch).toHaveBeenCalledWith(searchEvent);
      expect(eventProducer.publish).toHaveBeenCalledWith(
        'product.search.tracked',
        expect.objectContaining({
          eventId: trackedEvent.id,
          searchTerm: searchEvent.searchTerm,
        })
      );
    });

    it('should track empty search results', async () => {
      const searchEvent: ProductSearchEvent = {
        searchTerm: 'nonexistent product',
        userId: 'user-456',
        sessionId: 'session-789',
        resultsCount: 0,
        timestamp: new Date(),
        filters: {},
      };

      const trackedEvent = {
        id: 'search-123',
        ...searchEvent,
        createdAt: new Date(),
      };

      analyticsRepository.trackProductSearch.mockResolvedValue(trackedEvent);

      const result = await analyticsService.trackProductSearch(searchEvent);

      expect(result).toEqual(trackedEvent);
      expect(result.resultsCount).toBe(0);
    });

    it('should throw ValidationError for invalid search term', async () => {
      const invalidEvent = {
        searchTerm: '',
        userId: 'user-456',
        sessionId: 'session-789',
        resultsCount: 0,
        timestamp: new Date(),
      } as ProductSearchEvent;

      await expect(
        analyticsService.trackProductSearch(invalidEvent)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('trackProductFilter', () => {
    it('should track product filter usage successfully', async () => {
      const filterEvent: ProductFilterEvent = {
        userId: 'user-456',
        sessionId: 'session-789',
        filterType: 'COLOUR',
        filterValue: 'white',
        resultsCount: 25,
        timestamp: new Date(),
        appliedFilters: {
          colours: ['white'],
          category: 'KITCHEN',
        },
      };

      const trackedEvent = {
        id: 'filter-123',
        ...filterEvent,
        createdAt: new Date(),
      };

      analyticsRepository.trackProductFilter.mockResolvedValue(trackedEvent);

      const result = await analyticsService.trackProductFilter(filterEvent);

      expect(result).toEqual(trackedEvent);
      expect(analyticsRepository.trackProductFilter).toHaveBeenCalledWith(filterEvent);
      expect(eventProducer.publish).toHaveBeenCalledWith(
        'product.filter.tracked',
        expect.objectContaining({
          eventId: trackedEvent.id,
          filterType: filterEvent.filterType,
        })
      );
    });

    it('should track multiple filter applications', async () => {
      const filterEvent: ProductFilterEvent = {
        userId: 'user-456',
        sessionId: 'session-789',
        filterType: 'MULTI',
        filterValue: 'combined',
        resultsCount: 10,
        timestamp: new Date(),
        appliedFilters: {
          colours: ['white', 'grey'],
          category: 'BEDROOM',
          style: 'MODERN',
          priceRange: { min: 2000, max: 4000 },
        },
      };

      const trackedEvent = {
        id: 'filter-123',
        ...filterEvent,
        createdAt: new Date(),
      };

      analyticsRepository.trackProductFilter.mockResolvedValue(trackedEvent);

      const result = await analyticsService.trackProductFilter(filterEvent);

      expect(result).toEqual(trackedEvent);
      expect(result.appliedFilters).toHaveProperty('colours');
      expect(result.appliedFilters).toHaveProperty('category');
      expect(result.appliedFilters).toHaveProperty('style');
    });
  });

  describe('getProductViewCount', () => {
    it('should return cached view count if available', async () => {
      const productId = 'prod-123';
      const cachedCount = '150';

      redisClient.get.mockResolvedValue(cachedCount);

      const result = await analyticsService.getProductViewCount(productId);

      expect(result).toBe(150);
      expect(redisClient.get).toHaveBeenCalledWith(`product:${productId}:views`);
      expect(analyticsRepository.getProductViewCount).not.toHaveBeenCalled();
    });

    it('should fetch from repository if cache miss', async () => {
      const productId = 'prod-123';
      const dbCount = 200;

      redisClient.get.mockResolvedValue(null);
      analyticsRepository.getProductViewCount.mockResolvedValue(dbCount);

      const result = await analyticsService.getProductViewCount(productId);

      expect(result).toBe(200);
      expect(redisClient.get).toHaveBeenCalledWith(`product:${productId}:views`);
      expect(analyticsRepository.getProductViewCount).toHaveBeenCalledWith(productId);
      expect(redisClient.set).toHaveBeenCalledWith(
        `product:${productId}:views`,
        '200',
        3600
      );
    });

    it('should return 0 for products with no views', async () => {
      const productId = 'prod-new';

      redisClient.get.mockResolvedValue(null);
      analyticsRepository.getProductViewCount.mockResolvedValue(0);

      const result = await analyticsService.getProductViewCount(productId);

      expect(result).toBe(0);
    });
  });

  describe('getProductAnalytics', () => {
    it('should return comprehensive product analytics', async () => {
      const productId = 'prod-123';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const analytics: ProductAnalytics = {
        productId,
        totalViews: 500,
        uniqueViews: 350,
        averageTimeOnPage: 120,
        bounceRate: 0.35,
        conversionRate: 0.05,
        addToCartRate: 0.15,
        popularColours: [
          { colour: 'white', count: 200 },
          { colour: 'grey', count: 150 },
        ],
        viewsBySource: {
          SEARCH: 200,
          DIRECT: 150,
          FILTER: 100,
          SOCIAL: 50,
        },
        viewsByDevice: {
          DESKTOP: 300,
          MOBILE: 150,
          TABLET: 50,
        },
        period: { startDate, endDate },
      };

      analyticsRepository.getProductAnalytics.mockResolvedValue(analytics);

      const result = await analyticsService.getProductAnalytics(
        productId,
        startDate,
        endDate
      );

      expect(result).toEqual(analytics);
      expect(analyticsRepository.getProductAnalytics).toHaveBeenCalledWith(
        productId,
        startDate,
        endDate
      );
    });

    it('should throw NotFoundError for non-existent product', async () => {
      const productId = 'prod-nonexistent';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      analyticsRepository.getProductAnalytics.mockRejectedValue(
        new NotFoundError('Product not found')
      );

      await expect(
        analyticsService.getProductAnalytics(productId, startDate, endDate)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getCategoryAnalytics', () => {
    it('should return category analytics for KITCHEN', async () => {
      const category = 'KITCHEN';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const analytics: CategoryAnalytics = {
        category,
        totalViews: 2500,
        uniqueViews: 1800,
        totalProducts: 45,
        averageProductViews: 55.5,
        topProducts: [
          { productId: 'prod-1', name: 'Modern Kitchen White', views: 500 },
          { productId: 'prod-2', name: 'Contemporary Kitchen Grey', views: 450 },
        ],
        popularColours: [
          { colour: 'white', count: 800 },
          { colour: 'grey', count: 600 },
        ],
        conversionRate: 0.06,
        period: { startDate, endDate },
      };

      analyticsRepository.getCategoryAnalytics.mockResolvedValue(analytics);

      const result = await analyticsService.getCategoryAnalytics(
        category,
        startDate,
        endDate
      );

      expect(result).toEqual(analytics);
      expect(result.category).toBe('KITCHEN');
      expect(result.topProducts).toHaveLength(2);
    });

    it('should return category analytics for BEDROOM', async () => {
      const category = 'BEDROOM';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const analytics: CategoryAnalytics = {
        category,
        totalViews: 1800,
        uniqueViews: 1200,
        totalProducts: 35,
        averageProductViews: 51.4,
        topProducts: [
          { productId: 'prod-3', name: 'Elegant Bedroom Oak', views: 400 },
        ],
        popularColours: [
          { colour: 'oak', count: 500 },
        ],
        conversionRate: 0.04,
        period: { startDate, endDate },
      };

      analyticsRepository.getCategoryAnalytics.mockResolvedValue(analytics);

      const result = await analyticsService.getCategoryAnalytics(
        category,
        startDate,
        endDate
      );

      expect(result).toEqual(analytics);
      expect(result.category).toBe('BEDROOM');
    });
  });

  describe('getTopViewedProducts', () => {
    it('should return top viewed products with default limit', async () => {
      const limit = 10;
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const topProducts = [
        { productId: 'prod-1', name: 'Modern Kitchen White', views: 500, category: 'KITCHEN' },
        { productId: 'prod-2', name: 'Contemporary Bedroom Grey', views: 450, category: 'BEDROOM' },
        { productId: 'prod-3', name: 'Classic Kitchen Oak', views: 400, category: 'KITCHEN' },
      ];

      analyticsRepository.getTopViewedProducts.mockResolvedValue(topProducts);

      const result = await analyticsService.getTopViewedProducts(
        limit,
        startDate,
        endDate
      );

      expect(result).toEqual(topProducts);
      expect(result).toHaveLength(3);
      expect(result[0].views).toBeGreaterThanOrEqual(result[1].views);
      expect(analyticsRepository.getTopViewedProducts).toHaveBeenCalledWith(
        limit,
        startDate,
        endDate
      );
    });

    it('should filter top products by category', async () => {
      const limit = 5;
      const category = 'KITCHEN';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const topProducts = [
        { productId: 'prod-1', name: 'Modern Kitchen White', views: 500, category: 'KITCHEN' },
        { productId: 'prod-3', name: 'Classic Kitchen Oak', views: 400, category: 'KITCHEN' },
      ];

      analyticsRepository.getTopViewedProducts.mockResolvedValue(topProducts);

      const result = await analyticsService.getTopViewedProducts(
        limit,
        startDate,
        endDate,
        category
      );

      expect(result).toEqual(topProducts);
      expect(result.every(p => p.category === 'KITCHEN')).toBe(true);
    });
  });

  describe('getTopSearchedTerms', () => {
    it('should return top searched terms', async () => {
      const limit = 10;
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const topTerms = [
        { term: 'modern kitchen', count: 250, averageResults: 15 },
        { term: 'white kitchen', count: 200, averageResults: 20 },
        { term: 'bedroom oak', count: 150, averageResults: 12 },
      ];

      analyticsRepository.getTopSearchedTerms.mockResolvedValue(topTerms);

      const result = await analyticsService.getTopSearchedTerms(
        limit,
        startDate,
        endDate
      );

      expect(result).toEqual(topTerms);
      expect(result).toHaveLength(3);
      expect(result[0].count).toBeGreaterThanOrEqual(result[1].count);
    });

    it('should return empty array when no searches exist', async () => {
      const limit = 10;
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      analyticsRepository.getTopSearchedTerms.mockResolvedValue([]);

      const result = await analyticsService.getTopSearchedTerms(
        limit,
        startDate,
        endDate
      );

      expect(result).toEqual([]);
    });
  });

  describe('getPopularFilters', () => {
    it('should return popular filter combinations', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const popularFilters = [
        {
          filterType: 'COLOUR',
          filterValue: 'white',
          count: 500,
          averageResults: 18,
        },
        {
          filterType: 'CATEGORY',
          filterValue: 'KITCHEN',
          count: 450,
          averageResults: 25,
        },
        {
          filterType: 'STYLE',
          filterValue: 'MODERN',
          count: 350,
          averageResults: 15,
        },
      ];

      analyticsRepository.getPopularFilters.mockResolvedValue(popularFilters);

      const result = await analyticsService.getPopularFilters(startDate, endDate);

      expect(result).toEqual(popularFilters);
      expect(result[0].count).toBeGreaterThanOrEqual(result[1].count);
    });
  });

  describe('getConversionMetrics', () => {
    it('should return conversion metrics for products', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const metrics = {
        totalViews: 5000,
        totalBookings: 250,
        totalBrochureRequests: 150,
        conversionRate: 0.05,
        brochureRequestRate: 0.03,
        averageViewsToBooking: 20,
        period: { startDate, endDate },
      };

      analyticsRepository.getConversionMetrics.mockResolvedValue(metrics);

      const result = await analyticsService.getConversionMetrics(
        startDate,
        endDate
      );

      expect(result).toEqual(metrics);
      expect(result.conversionRate).toBe(0.05);
      expect(result.brochureRequestRate).toBe(0.03);
    });
  });

  describe('getBounceRate', () => {
    it('should calculate bounce rate correctly', async () => {
      const productId = 'prod-123';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      analyticsRepository.getBounceRate.mockResolvedValue(0.42);

      const result = await analyticsService.getBounceRate(
        productId,
        startDate,
        endDate
      );

      expect(result).toBe(0.42);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    });
  });

  describe('exportAnalyticsData', () => {
    it('should export analytics data in specified format', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const format = 'CSV';

      const exportData = {
        format,
        data: 'product_id,views,bookings\nprod-1,500,25\nprod-2,450,20',
        generatedAt: new Date(),
      };

      analyticsRepository.exportAnalyticsData.mockResolvedValue(exportData);

      const result = await analyticsService.exportAnalyticsData(
        startDate,
        endDate,
        format
      );

      expect(result).toEqual(exportData);
      expect(result.format).toBe('CSV');
      expect(analyticsRepository.exportAnalyticsData).toHaveBeenCalledWith(
        startDate,
        endDate,
        format
      );
    });

    it('should export analytics data in JSON format', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const format = 'JSON';

      const exportData = {
        format,
        data: JSON.stringify([
          { productId: 'prod-1', views: 500, bookings: 25 },
          { productId: 'prod-2', views: 450, bookings: 20 },
        ]),
        generatedAt: new Date(),
      };

      analyticsRepository.exportAnalyticsData.mockResolvedValue(exportData);

      const result = await analyticsService.exportAnalyticsData(
        startDate,
        endDate,
        format
      );

      expect(result).toEqual(exportData);
      expect(result.format).toBe('JSON');
    });
  });

  describe('getUserJourney', () => {
    it('should track complete user journey', async () => {
      const sessionId = 'session-789';

      const journey = {
        sessionId,
        userId: 'user-456',
        startTime: new Date('2024-01-15T10:00:00Z'),
        endTime: new Date('2024-01-15T10:15:00Z'),
        duration: 900,
        events: [
          { type: 'PAGE_VIEW', timestamp: new Date('2024-01-15T10:00:00Z'), data: { page: 'home' } },
          { type: 'SEARCH', timestamp: new Date('2024-01-15T10:02:00Z'), data: { term: 'modern kitchen' } },
          { type: 'PRODUCT_VIEW', timestamp: new Date('2024-01-15T10:05:00Z'), data: { productId: 'prod-123' } },
          { type: 'FILTER_APPLY', timestamp: new Date('2024-01-15T10:08:00Z'), data: { filter: 'colour:white' } },
          { type: 'BOOKING_STARTED', timestamp: new Date('2024-01-15T10:12:00Z'), data: { type: 'consultation' } },
        ],
        conversionEvent: 'BOOKING_STARTED',
      };

      analyticsRepository.getUserJourney.mockResolvedValue(journey);

      const result = await analyticsService.getUserJourney(sessionId);

      expect(result).toEqual(journey);
      expect(result.events).toHaveLength(5);
      expect(result.conversionEvent).toBe('BOOKING_STARTED');
    });
  });

  describe('getFunnelAnalytics', () => {
    it('should return funnel drop-off analytics', async () => {
      const funnelType = 'BOOKING';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const funnelData = {
        funnelType,
        steps: [
          { step: 'PRODUCT_VIEW', count: 1000, percentage: 100, dropOff: 0 },
          { step: 'BOOKING_TYPE_SELECT', count: 400, percentage: 40, dropOff: 60 },
          { step: 'DETAILS_ENTERED', count: 300, percentage: 30, dropOff: 10 },
          { step: 'SLOT_SELECTED', count: 250, percentage: 25, dropOff: 5 },
          { step: 'BOOKING_COMPLETED', count: 200, percentage: 20, dropOff: 5 },
        ],
        overallConversionRate: 0.20,
        period: { startDate, endDate },
      };

      analyticsRepository.getFunnelAnalytics.mockResolvedValue(funnelData);

      const result = await analyticsService.getFunnelAnalytics(
        funnelType,
        startDate,
        endDate
      );

      expect(result).toEqual(funnelData);
      expect(result.steps).toHaveLength(5);
      expect(result.overallConversionRate).toBe(0.20);
    });

    it('should calculate brochure request funnel', async () => {
      const funnelType = 'BROCHURE_REQUEST';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const funnelData = {
        funnelType,
        steps: [
          { step: 'PRODUCT_VIEW', count: 1000, percentage: 100, dropOff: 0 },
          { step: 'BROCHURE_BUTTON_CLICK', count: 200, percentage: 20, dropOff: 80 },
          { step: 'FORM_STARTED', count: 150, percentage: 15, dropOff: 5 },
          { step: 'FORM_COMPLETED', count: 120, percentage: 12, dropOff: 3 },
        ],
        overallConversionRate: 0.12,
        period: { startDate, endDate },
      };

      analyticsRepository.getFunnelAnalytics.mockResolvedValue(funnelData);

      const result = await analyticsService.getFunnelAnalytics(
        funnelType,
        startDate,
        endDate
      );

      expect(result).toEqual(funnelData);
      expect(result.overallConversionRate).toBe(0.12);
    });
  });
});