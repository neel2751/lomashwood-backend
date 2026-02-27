import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { AnalyticsController } from '../../src/app/analytics/analytics.controller';
import { AnalyticsService } from '../../src/app/analytics/analytics.service';
import { 
  ProductViewEvent, 
  ProductSearchEvent, 
  ProductFilterEvent,
  ProductAnalytics,
  CategoryAnalytics 
} from '../../src/app/analytics/analytics.types';
import { ValidationError, NotFoundError } from '../../src/shared/errors';

describe('AnalyticsController', () => {
  let analyticsController: AnalyticsController;
  let analyticsService: jest.Mocked<AnalyticsService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    analyticsService = {
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

    analyticsController = new AnalyticsController(analyticsService);

    mockRequest = {
      body: {},
      params: {},
      query: {},
      headers: {},
      ip: '192.168.1.1',
      get: jest.fn(),
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('trackProductView', () => {
    it('should track product view successfully', async () => {
      const viewData = {
        productId: 'prod-123',
        userId: 'user-456',
        sessionId: 'session-789',
        category: 'KITCHEN',
        source: 'SEARCH',
        deviceType: 'DESKTOP',
      };

      const trackedEvent = {
        id: 'event-123',
        ...viewData,
        timestamp: new Date(),
        userAgent: 'Mozilla/5.0',
        referrer: 'https://example.com',
        createdAt: new Date(),
      };

      mockRequest.body = viewData;
      mockRequest.headers = {
        'user-agent': 'Mozilla/5.0',
        'referer': 'https://example.com',
      };

      analyticsService.trackProductView.mockResolvedValue(trackedEvent);

      await analyticsController.trackProductView(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(analyticsService.trackProductView).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: viewData.productId,
          userId: viewData.userId,
          sessionId: viewData.sessionId,
          category: viewData.category,
          source: viewData.source,
          deviceType: viewData.deviceType,
          userAgent: 'Mozilla/5.0',
          referrer: 'https://example.com',
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: trackedEvent,
        message: 'Product view tracked successfully',
      });
    });

    it('should track product view from mobile device', async () => {
      const viewData = {
        productId: 'prod-456',
        userId: 'user-789',
        sessionId: 'session-012',
        category: 'BEDROOM',
        source: 'DIRECT',
        deviceType: 'MOBILE',
      };

      const trackedEvent = {
        id: 'event-456',
        ...viewData,
        timestamp: new Date(),
        userAgent: 'Mobile Safari',
        createdAt: new Date(),
      };

      mockRequest.body = viewData;
      mockRequest.headers = {
        'user-agent': 'Mobile Safari',
      };

      analyticsService.trackProductView.mockResolvedValue(trackedEvent);

      await analyticsController.trackProductView(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(analyticsService.trackProductView).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });

    it('should track product view from filter page', async () => {
      const viewData = {
        productId: 'prod-789',
        userId: 'user-123',
        sessionId: 'session-456',
        category: 'KITCHEN',
        source: 'FILTER',
        deviceType: 'TABLET',
      };

      const trackedEvent = {
        id: 'event-789',
        ...viewData,
        timestamp: new Date(),
        userAgent: 'iPad Safari',
        referrer: 'https://lomashwood.com/kitchens',
        createdAt: new Date(),
      };

      mockRequest.body = viewData;
      mockRequest.headers = {
        'user-agent': 'iPad Safari',
        'referer': 'https://lomashwood.com/kitchens',
      };

      analyticsService.trackProductView.mockResolvedValue(trackedEvent);

      await analyticsController.trackProductView(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(trackedEvent.source).toBe('FILTER');
      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });

    it('should handle validation errors', async () => {
      const invalidData = {
        productId: '',
        userId: 'user-456',
      };

      mockRequest.body = invalidData;

      analyticsService.trackProductView.mockRejectedValue(
        new ValidationError('Product ID is required')
      );

      await analyticsController.trackProductView(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Product ID is required',
        })
      );
    });

    it('should handle missing user-agent header gracefully', async () => {
      const viewData = {
        productId: 'prod-123',
        userId: 'user-456',
        sessionId: 'session-789',
        category: 'KITCHEN',
        source: 'SEARCH',
        deviceType: 'DESKTOP',
      };

      mockRequest.body = viewData;
      mockRequest.headers = {};

      const trackedEvent = {
        id: 'event-123',
        ...viewData,
        timestamp: new Date(),
        userAgent: 'Unknown',
        createdAt: new Date(),
      };

      analyticsService.trackProductView.mockResolvedValue(trackedEvent);

      await analyticsController.trackProductView(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });
  });

  describe('trackProductSearch', () => {
    it('should track product search successfully', async () => {
      const searchData = {
        searchTerm: 'modern kitchen',
        userId: 'user-456',
        sessionId: 'session-789',
        resultsCount: 15,
        filters: {
          category: 'KITCHEN',
          colours: ['white', 'grey'],
          priceRange: { min: 1000, max: 5000 },
        },
      };

      const trackedSearch = {
        id: 'search-123',
        ...searchData,
        timestamp: new Date(),
        createdAt: new Date(),
      };

      mockRequest.body = searchData;

      analyticsService.trackProductSearch.mockResolvedValue(trackedSearch);

      await analyticsController.trackProductSearch(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(analyticsService.trackProductSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          searchTerm: searchData.searchTerm,
          userId: searchData.userId,
          sessionId: searchData.sessionId,
          resultsCount: searchData.resultsCount,
          filters: searchData.filters,
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: trackedSearch,
        message: 'Product search tracked successfully',
      });
    });

    it('should track empty search results', async () => {
      const searchData = {
        searchTerm: 'nonexistent product',
        userId: 'user-456',
        sessionId: 'session-789',
        resultsCount: 0,
        filters: {},
      };

      const trackedSearch = {
        id: 'search-456',
        ...searchData,
        timestamp: new Date(),
        createdAt: new Date(),
      };

      mockRequest.body = searchData;

      analyticsService.trackProductSearch.mockResolvedValue(trackedSearch);

      await analyticsController.trackProductSearch(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(trackedSearch.resultsCount).toBe(0);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });

    it('should track bedroom search with filters', async () => {
      const searchData = {
        searchTerm: 'oak bedroom',
        userId: 'user-789',
        sessionId: 'session-012',
        resultsCount: 8,
        filters: {
          category: 'BEDROOM',
          colours: ['oak', 'walnut'],
          style: 'TRADITIONAL',
        },
      };

      const trackedSearch = {
        id: 'search-789',
        ...searchData,
        timestamp: new Date(),
        createdAt: new Date(),
      };

      mockRequest.body = searchData;

      analyticsService.trackProductSearch.mockResolvedValue(trackedSearch);

      await analyticsController.trackProductSearch(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(trackedSearch.filters.category).toBe('BEDROOM');
      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });

    it('should handle validation errors for invalid search term', async () => {
      const invalidData = {
        searchTerm: '',
        userId: 'user-456',
        sessionId: 'session-789',
        resultsCount: 0,
      };

      mockRequest.body = invalidData;

      analyticsService.trackProductSearch.mockRejectedValue(
        new ValidationError('Search term is required')
      );

      await analyticsController.trackProductSearch(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Search term is required',
        })
      );
    });
  });

  describe('trackProductFilter', () => {
    it('should track product filter successfully', async () => {
      const filterData = {
        userId: 'user-456',
        sessionId: 'session-789',
        filterType: 'COLOUR',
        filterValue: 'white',
        resultsCount: 25,
        appliedFilters: {
          colours: ['white'],
          category: 'KITCHEN',
        },
      };

      const trackedFilter = {
        id: 'filter-123',
        ...filterData,
        timestamp: new Date(),
        createdAt: new Date(),
      };

      mockRequest.body = filterData;

      analyticsService.trackProductFilter.mockResolvedValue(trackedFilter);

      await analyticsController.trackProductFilter(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(analyticsService.trackProductFilter).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: filterData.userId,
          sessionId: filterData.sessionId,
          filterType: filterData.filterType,
          filterValue: filterData.filterValue,
          resultsCount: filterData.resultsCount,
          appliedFilters: filterData.appliedFilters,
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: trackedFilter,
        message: 'Product filter tracked successfully',
      });
    });

    it('should track style filter', async () => {
      const filterData = {
        userId: 'user-456',
        sessionId: 'session-789',
        filterType: 'STYLE',
        filterValue: 'MODERN',
        resultsCount: 18,
        appliedFilters: {
          style: 'MODERN',
          category: 'KITCHEN',
        },
      };

      const trackedFilter = {
        id: 'filter-456',
        ...filterData,
        timestamp: new Date(),
        createdAt: new Date(),
      };

      mockRequest.body = filterData;

      analyticsService.trackProductFilter.mockResolvedValue(trackedFilter);

      await analyticsController.trackProductFilter(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(trackedFilter.filterType).toBe('STYLE');
      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });

    it('should track multiple filters combined', async () => {
      const filterData = {
        userId: 'user-789',
        sessionId: 'session-012',
        filterType: 'MULTI',
        filterValue: 'combined',
        resultsCount: 5,
        appliedFilters: {
          colours: ['white', 'grey'],
          style: 'CONTEMPORARY',
          finish: 'GLOSS',
          category: 'BEDROOM',
          priceRange: { min: 2000, max: 4000 },
        },
      };

      const trackedFilter = {
        id: 'filter-789',
        ...filterData,
        timestamp: new Date(),
        createdAt: new Date(),
      };

      mockRequest.body = filterData;

      analyticsService.trackProductFilter.mockResolvedValue(trackedFilter);

      await analyticsController.trackProductFilter(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(trackedFilter.appliedFilters.colours).toHaveLength(2);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });
  });

  describe('getProductViewCount', () => {
    it('should return product view count successfully', async () => {
      const productId = 'prod-123';
      mockRequest.params = { productId };

      analyticsService.getProductViewCount.mockResolvedValue(150);

      await analyticsController.getProductViewCount(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(analyticsService.getProductViewCount).toHaveBeenCalledWith(productId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          productId,
          viewCount: 150,
        },
      });
    });

    it('should return 0 for products with no views', async () => {
      const productId = 'prod-new';
      mockRequest.params = { productId };

      analyticsService.getProductViewCount.mockResolvedValue(0);

      await analyticsController.getProductViewCount(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          productId,
          viewCount: 0,
        },
      });
    });

    it('should handle missing product ID', async () => {
      mockRequest.params = {};

      await analyticsController.getProductViewCount(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Product ID'),
        })
      );
    });
  });

  describe('getProductAnalytics', () => {
    it('should return comprehensive product analytics', async () => {
      const productId = 'prod-123';
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';

      mockRequest.params = { productId };
      mockRequest.query = { startDate, endDate };

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
        period: {
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        },
      };

      analyticsService.getProductAnalytics.mockResolvedValue(analytics);

      await analyticsController.getProductAnalytics(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(analyticsService.getProductAnalytics).toHaveBeenCalledWith(
        productId,
        new Date(startDate),
        new Date(endDate)
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: analytics,
      });
    });

    it('should use default date range if not provided', async () => {
      const productId = 'prod-123';
      mockRequest.params = { productId };
      mockRequest.query = {};

      const analytics: ProductAnalytics = {
        productId,
        totalViews: 100,
        uniqueViews: 80,
        averageTimeOnPage: 90,
        bounceRate: 0.40,
        conversionRate: 0.03,
        addToCartRate: 0.10,
        popularColours: [],
        viewsBySource: {},
        viewsByDevice: {},
        period: {
          startDate: expect.any(Date),
          endDate: expect.any(Date),
        },
      };

      analyticsService.getProductAnalytics.mockResolvedValue(analytics);

      await analyticsController.getProductAnalytics(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(analyticsService.getProductAnalytics).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should handle NotFoundError for non-existent product', async () => {
      const productId = 'prod-nonexistent';
      mockRequest.params = { productId };
      mockRequest.query = { startDate: '2024-01-01', endDate: '2024-01-31' };

      analyticsService.getProductAnalytics.mockRejectedValue(
        new NotFoundError('Product not found')
      );

      await analyticsController.getProductAnalytics(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Product not found',
        })
      );
    });
  });

  describe('getCategoryAnalytics', () => {
    it('should return analytics for KITCHEN category', async () => {
      const category = 'KITCHEN';
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';

      mockRequest.params = { category };
      mockRequest.query = { startDate, endDate };

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
        period: {
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        },
      };

      analyticsService.getCategoryAnalytics.mockResolvedValue(analytics);

      await analyticsController.getCategoryAnalytics(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(analyticsService.getCategoryAnalytics).toHaveBeenCalledWith(
        category,
        new Date(startDate),
        new Date(endDate)
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: analytics,
      });
    });

    it('should return analytics for BEDROOM category', async () => {
      const category = 'BEDROOM';
      mockRequest.params = { category };
      mockRequest.query = { startDate: '2024-01-01', endDate: '2024-01-31' };

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
        period: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
        },
      };

      analyticsService.getCategoryAnalytics.mockResolvedValue(analytics);

      await analyticsController.getCategoryAnalytics(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(analytics.category).toBe('BEDROOM');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should handle invalid category', async () => {
      const category = 'INVALID';
      mockRequest.params = { category };
      mockRequest.query = {};

      analyticsService.getCategoryAnalytics.mockRejectedValue(
        new ValidationError('Invalid category')
      );

      await analyticsController.getCategoryAnalytics(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid category',
        })
      );
    });
  });

  describe('getTopViewedProducts', () => {
    it('should return top viewed products with default limit', async () => {
      mockRequest.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };

      const topProducts = [
        { productId: 'prod-1', name: 'Modern Kitchen White', views: 500, category: 'KITCHEN' },
        { productId: 'prod-2', name: 'Contemporary Bedroom Grey', views: 450, category: 'BEDROOM' },
        { productId: 'prod-3', name: 'Classic Kitchen Oak', views: 400, category: 'KITCHEN' },
      ];

      analyticsService.getTopViewedProducts.mockResolvedValue(topProducts);

      await analyticsController.getTopViewedProducts(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(analyticsService.getTopViewedProducts).toHaveBeenCalledWith(
        10, // default limit
        new Date('2024-01-01'),
        new Date('2024-01-31'),
        undefined
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: topProducts,
        meta: {
          limit: 10,
          count: 3,
        },
      });
    });

    it('should filter by category', async () => {
      mockRequest.query = {
        limit: '5',
        category: 'KITCHEN',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };

      const topProducts = [
        { productId: 'prod-1', name: 'Modern Kitchen White', views: 500, category: 'KITCHEN' },
        { productId: 'prod-3', name: 'Classic Kitchen Oak', views: 400, category: 'KITCHEN' },
      ];

      analyticsService.getTopViewedProducts.mockResolvedValue(topProducts);

      await analyticsController.getTopViewedProducts(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(analyticsService.getTopViewedProducts).toHaveBeenCalledWith(
        5,
        new Date('2024-01-01'),
        new Date('2024-01-31'),
        'KITCHEN'
      );
      expect(topProducts.every(p => p.category === 'KITCHEN')).toBe(true);
    });

    it('should respect custom limit', async () => {
      mockRequest.query = {
        limit: '3',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };

      const topProducts = [
        { productId: 'prod-1', name: 'Product 1', views: 500, category: 'KITCHEN' },
        { productId: 'prod-2', name: 'Product 2', views: 450, category: 'BEDROOM' },
        { productId: 'prod-3', name: 'Product 3', views: 400, category: 'KITCHEN' },
      ];

      analyticsService.getTopViewedProducts.mockResolvedValue(topProducts);

      await analyticsController.getTopViewedProducts(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(analyticsService.getTopViewedProducts).toHaveBeenCalledWith(
        3,
        expect.any(Date),
        expect.any(Date),
        undefined
      );
    });
  });

  describe('getTopSearchedTerms', () => {
    it('should return top searched terms', async () => {
      mockRequest.query = {
        limit: '10',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };

      const topTerms = [
        { term: 'modern kitchen', count: 250, averageResults: 15 },
        { term: 'white kitchen', count: 200, averageResults: 20 },
        { term: 'bedroom oak', count: 150, averageResults: 12 },
      ];

      analyticsService.getTopSearchedTerms.mockResolvedValue(topTerms);

      await analyticsController.getTopSearchedTerms(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(analyticsService.getTopSearchedTerms).toHaveBeenCalledWith(
        10,
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: topTerms,
        meta: {
          limit: 10,
          count: 3,
        },
      });
    });

    it('should return empty array when no searches exist', async () => {
      mockRequest.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };

      analyticsService.getTopSearchedTerms.mockResolvedValue([]);

      await analyticsController.getTopSearchedTerms(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: [],
        meta: {
          limit: 10,
          count: 0,
        },
      });
    });
  });

  describe('getPopularFilters', () => {
    it('should return popular filter combinations', async () => {
      mockRequest.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };

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

      analyticsService.getPopularFilters.mockResolvedValue(popularFilters);

      await analyticsController.getPopularFilters(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(analyticsService.getPopularFilters).toHaveBeenCalledWith(
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: popularFilters,
      });
    });
  });

  describe('getConversionMetrics', () => {
    it('should return conversion metrics', async () => {
      mockRequest.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };

      const metrics = {
        totalViews: 5000,
        totalBookings: 250,
        totalBrochureRequests: 150,
        conversionRate: 0.05,
        brochureRequestRate: 0.03,
        averageViewsToBooking: 20,
        period: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
        },
      };

      analyticsService.getConversionMetrics.mockResolvedValue(metrics);

      await analyticsController.getConversionMetrics(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(analyticsService.getConversionMetrics).toHaveBeenCalledWith(
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: metrics,
      });
    });
  });

  describe('getBounceRate', () => {
    it('should return bounce rate for a product', async () => {
      const productId = 'prod-123';
      mockRequest.params = { productId };
      mockRequest.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };

      analyticsService.getBounceRate.mockResolvedValue(0.42);

      await analyticsController.getBounceRate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(analyticsService.getBounceRate).toHaveBeenCalledWith(
        productId,
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          productId,
          bounceRate: 0.42,
        },
      });
    });
  });

  describe('getUserJourney', () => {
    it('should return complete user journey', async () => {
      const sessionId = 'session-789';
      mockRequest.params = { sessionId };

      const journey = {
        sessionId,
        userId: 'user-456',
        startTime: new Date('2024-01-15T10:00:00Z'),
        endTime: new Date('2024-01-15T10:15:00Z'),
        duration: 900,
        events: [
          { type: 'PAGE_VIEW', timestamp: new Date(), data: { page: 'home' } },
          { type: 'SEARCH', timestamp: new Date(), data: { term: 'modern kitchen' } },
          { type: 'PRODUCT_VIEW', timestamp: new Date(), data: { productId: 'prod-123' } },
          { type: 'BOOKING_STARTED', timestamp: new Date(), data: { type: 'consultation' } },
        ],
        conversionEvent: 'BOOKING_STARTED',
      };

      analyticsService.getUserJourney.mockResolvedValue(journey);

      await analyticsController.getUserJourney(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(analyticsService.getUserJourney).toHaveBeenCalledWith(sessionId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: journey,
      });
    });
  });

  describe('getFunnelAnalytics', () => {
    it('should return booking funnel analytics', async () => {
      const funnelType = 'BOOKING';
      mockRequest.params = { funnelType };
      mockRequest.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };

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
        period: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
        },
      };

      analyticsService.getFunnelAnalytics.mockResolvedValue(funnelData);

      await analyticsController.getFunnelAnalytics(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(analyticsService.getFunnelAnalytics).toHaveBeenCalledWith(
        funnelType,
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: funnelData,
      });
    });

    it('should return brochure request funnel analytics', async () => {
      const funnelType = 'BROCHURE_REQUEST';
      mockRequest.params = { funnelType };
      mockRequest.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };

      const funnelData = {
        funnelType,
        steps: [
          { step: 'PRODUCT_VIEW', count: 1000, percentage: 100, dropOff: 0 },
          { step: 'BROCHURE_BUTTON_CLICK', count: 200, percentage: 20, dropOff: 80 },
          { step: 'FORM_STARTED', count: 150, percentage: 15, dropOff: 5 },
          { step: 'FORM_COMPLETED', count: 120, percentage: 12, dropOff: 3 },
        ],
        overallConversionRate: 0.12,
        period: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
        },
      };

      analyticsService.getFunnelAnalytics.mockResolvedValue(funnelData);

      await analyticsController.getFunnelAnalytics(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(funnelData.funnelType).toBe('BROCHURE_REQUEST');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });

  describe('exportAnalyticsData', () => {
    it('should export analytics data in CSV format', async () => {
      mockRequest.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        format: 'CSV',
      };

      const exportData = {
        format: 'CSV',
        data: 'product_id,views,bookings\nprod-1,500,25\nprod-2,450,20',
        generatedAt: new Date(),
      };

      analyticsService.exportAnalyticsData.mockResolvedValue(exportData);

      await analyticsController.exportAnalyticsData(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(analyticsService.exportAnalyticsData).toHaveBeenCalledWith(
        new Date('2024-01-01'),
        new Date('2024-01-31'),
        'CSV'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'text/csv'
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringContaining('attachment')
      );
    });

    it('should export analytics data in JSON format', async () => {
      mockRequest.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        format: 'JSON',
      };

      const exportData = {
        format: 'JSON',
        data: JSON.stringify([
          { productId: 'prod-1', views: 500, bookings: 25 },
          { productId: 'prod-2', views: 450, bookings: 20 },
        ]),
        generatedAt: new Date(),
      };

      analyticsService.exportAnalyticsData.mockResolvedValue(exportData);

      await analyticsController.exportAnalyticsData(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/json'
      );
    });
  });

  describe('deleteAnalyticsData', () => {
    it('should delete analytics data before specified date', async () => {
      mockRequest.query = {
        beforeDate: '2024-01-01',
      };

      const deleteResult = {
        deletedViews: 100,
        deletedSearches: 50,
        deletedFilters: 75,
        deletedEvents: 200,
      };

      analyticsService.deleteAnalyticsData.mockResolvedValue(deleteResult);

      await analyticsController.deleteAnalyticsData(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(analyticsService.deleteAnalyticsData).toHaveBeenCalledWith(
        new Date('2024-01-01')
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: deleteResult,
        message: 'Analytics data deleted successfully',
      });
    });

    it('should handle missing beforeDate parameter', async () => {
      mockRequest.query = {};

      await analyticsController.deleteAnalyticsData(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('beforeDate'),
        })
      );
    });
  });
});