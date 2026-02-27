import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { AnalyticsRepository } from '../../src/app/analytics/analytics.repository';
import { PrismaClient } from '@prisma/client';
import { 
  ProductViewEvent, 
  ProductSearchEvent, 
  ProductFilterEvent,
  ProductAnalytics,
  CategoryAnalytics,
  TopProduct,
  SearchTerm,
  FilterUsage,
  ConversionMetrics,
  UserJourney,
  FunnelAnalytics
} from '../../src/app/analytics/analytics.types';
import { NotFoundError } from '../../src/shared/errors';

describe('AnalyticsRepository', () => {
  let analyticsRepository: AnalyticsRepository;
  let prisma: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    prisma = {
      productView: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
        aggregate: jest.fn(),
      },
      productSearch: {
        create: jest.fn(),
        findMany: jest.fn(),
        groupBy: jest.fn(),
        aggregate: jest.fn(),
      },
      productFilter: {
        create: jest.fn(),
        findMany: jest.fn(),
        groupBy: jest.fn(),
        aggregate: jest.fn(),
      },
      analyticsEvent: {
        create: jest.fn(),
        findMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      session: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        aggregate: jest.fn(),
      },
      booking: {
        count: jest.fn(),
        findMany: jest.fn(),
      },
      brochureRequest: {
        count: jest.fn(),
        findMany: jest.fn(),
      },
      product: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      $transaction: jest.fn(),
    } as any;

    analyticsRepository = new AnalyticsRepository(prisma);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('trackProductView', () => {
    it('should create product view record successfully', async () => {
      const viewEvent: ProductViewEvent = {
        productId: 'prod-123',
        userId: 'user-456',
        sessionId: 'session-789',
        category: 'KITCHEN',
        timestamp: new Date('2024-01-15T10:00:00Z'),
        source: 'SEARCH',
        referrer: 'https://example.com',
        deviceType: 'DESKTOP',
        userAgent: 'Mozilla/5.0',
      };

      const createdView = {
        id: 'view-123',
        ...viewEvent,
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-01-15T10:00:00Z'),
      };

      (prisma.productView.create as jest.Mock).mockResolvedValue(createdView);

      const result = await analyticsRepository.trackProductView(viewEvent);

      expect(result).toEqual(createdView);
      expect(prisma.productView.create).toHaveBeenCalledWith({
        data: {
          productId: viewEvent.productId,
          userId: viewEvent.userId,
          sessionId: viewEvent.sessionId,
          category: viewEvent.category,
          timestamp: viewEvent.timestamp,
          source: viewEvent.source,
          referrer: viewEvent.referrer,
          deviceType: viewEvent.deviceType,
          userAgent: viewEvent.userAgent,
        },
      });
    });

    it('should track product view with mobile device', async () => {
      const viewEvent: ProductViewEvent = {
        productId: 'prod-456',
        userId: 'user-789',
        sessionId: 'session-012',
        category: 'BEDROOM',
        timestamp: new Date(),
        source: 'DIRECT',
        deviceType: 'MOBILE',
        userAgent: 'Mobile Safari',
      };

      const createdView = {
        id: 'view-456',
        ...viewEvent,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.productView.create as jest.Mock).mockResolvedValue(createdView);

      const result = await analyticsRepository.trackProductView(viewEvent);

      expect(result.deviceType).toBe('MOBILE');
      expect(result.category).toBe('BEDROOM');
    });

    it('should track product view from filter page', async () => {
      const viewEvent: ProductViewEvent = {
        productId: 'prod-789',
        userId: 'user-123',
        sessionId: 'session-456',
        category: 'KITCHEN',
        timestamp: new Date(),
        source: 'FILTER',
        deviceType: 'TABLET',
        userAgent: 'iPad Safari',
      };

      const createdView = {
        id: 'view-789',
        ...viewEvent,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.productView.create as jest.Mock).mockResolvedValue(createdView);

      const result = await analyticsRepository.trackProductView(viewEvent);

      expect(result.source).toBe('FILTER');
      expect(result.deviceType).toBe('TABLET');
    });

    it('should handle database errors gracefully', async () => {
      const viewEvent: ProductViewEvent = {
        productId: 'prod-123',
        userId: 'user-456',
        sessionId: 'session-789',
        category: 'KITCHEN',
        timestamp: new Date(),
        source: 'SEARCH',
        deviceType: 'DESKTOP',
        userAgent: 'Chrome',
      };

      (prisma.productView.create as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(
        analyticsRepository.trackProductView(viewEvent)
      ).rejects.toThrow('Database connection failed');
    });
  });

  describe('trackProductSearch', () => {
    it('should create product search record successfully', async () => {
      const searchEvent: ProductSearchEvent = {
        searchTerm: 'modern kitchen',
        userId: 'user-456',
        sessionId: 'session-789',
        resultsCount: 15,
        timestamp: new Date('2024-01-15T10:00:00Z'),
        filters: {
          category: 'KITCHEN',
          colours: ['white', 'grey'],
          priceRange: { min: 1000, max: 5000 },
        },
      };

      const createdSearch = {
        id: 'search-123',
        ...searchEvent,
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-01-15T10:00:00Z'),
      };

      (prisma.productSearch.create as jest.Mock).mockResolvedValue(createdSearch);

      const result = await analyticsRepository.trackProductSearch(searchEvent);

      expect(result).toEqual(createdSearch);
      expect(prisma.productSearch.create).toHaveBeenCalledWith({
        data: {
          searchTerm: searchEvent.searchTerm,
          userId: searchEvent.userId,
          sessionId: searchEvent.sessionId,
          resultsCount: searchEvent.resultsCount,
          timestamp: searchEvent.timestamp,
          filters: searchEvent.filters,
        },
      });
    });

    it('should track search with zero results', async () => {
      const searchEvent: ProductSearchEvent = {
        searchTerm: 'nonexistent product',
        userId: 'user-456',
        sessionId: 'session-789',
        resultsCount: 0,
        timestamp: new Date(),
        filters: {},
      };

      const createdSearch = {
        id: 'search-456',
        ...searchEvent,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.productSearch.create as jest.Mock).mockResolvedValue(createdSearch);

      const result = await analyticsRepository.trackProductSearch(searchEvent);

      expect(result.resultsCount).toBe(0);
      expect(result.searchTerm).toBe('nonexistent product');
    });

    it('should track search with bedroom filters', async () => {
      const searchEvent: ProductSearchEvent = {
        searchTerm: 'oak bedroom',
        userId: 'user-789',
        sessionId: 'session-012',
        resultsCount: 8,
        timestamp: new Date(),
        filters: {
          category: 'BEDROOM',
          colours: ['oak', 'walnut'],
          style: 'TRADITIONAL',
        },
      };

      const createdSearch = {
        id: 'search-789',
        ...searchEvent,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.productSearch.create as jest.Mock).mockResolvedValue(createdSearch);

      const result = await analyticsRepository.trackProductSearch(searchEvent);

      expect(result.filters.category).toBe('BEDROOM');
      expect(result.filters.colours).toContain('oak');
    });
  });

  describe('trackProductFilter', () => {
    it('should create product filter record successfully', async () => {
      const filterEvent: ProductFilterEvent = {
        userId: 'user-456',
        sessionId: 'session-789',
        filterType: 'COLOUR',
        filterValue: 'white',
        resultsCount: 25,
        timestamp: new Date('2024-01-15T10:00:00Z'),
        appliedFilters: {
          colours: ['white'],
          category: 'KITCHEN',
        },
      };

      const createdFilter = {
        id: 'filter-123',
        ...filterEvent,
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-01-15T10:00:00Z'),
      };

      (prisma.productFilter.create as jest.Mock).mockResolvedValue(createdFilter);

      const result = await analyticsRepository.trackProductFilter(filterEvent);

      expect(result).toEqual(createdFilter);
      expect(prisma.productFilter.create).toHaveBeenCalledWith({
        data: {
          userId: filterEvent.userId,
          sessionId: filterEvent.sessionId,
          filterType: filterEvent.filterType,
          filterValue: filterEvent.filterValue,
          resultsCount: filterEvent.resultsCount,
          timestamp: filterEvent.timestamp,
          appliedFilters: filterEvent.appliedFilters,
        },
      });
    });

    it('should track style filter application', async () => {
      const filterEvent: ProductFilterEvent = {
        userId: 'user-456',
        sessionId: 'session-789',
        filterType: 'STYLE',
        filterValue: 'MODERN',
        resultsCount: 18,
        timestamp: new Date(),
        appliedFilters: {
          style: 'MODERN',
          category: 'KITCHEN',
        },
      };

      const createdFilter = {
        id: 'filter-456',
        ...filterEvent,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.productFilter.create as jest.Mock).mockResolvedValue(createdFilter);

      const result = await analyticsRepository.trackProductFilter(filterEvent);

      expect(result.filterType).toBe('STYLE');
      expect(result.filterValue).toBe('MODERN');
    });

    it('should track multiple filters combined', async () => {
      const filterEvent: ProductFilterEvent = {
        userId: 'user-789',
        sessionId: 'session-012',
        filterType: 'MULTI',
        filterValue: 'combined',
        resultsCount: 5,
        timestamp: new Date(),
        appliedFilters: {
          colours: ['white', 'grey'],
          style: 'CONTEMPORARY',
          finish: 'GLOSS',
          category: 'BEDROOM',
          priceRange: { min: 2000, max: 4000 },
        },
      };

      const createdFilter = {
        id: 'filter-789',
        ...filterEvent,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.productFilter.create as jest.Mock).mockResolvedValue(createdFilter);

      const result = await analyticsRepository.trackProductFilter(filterEvent);

      expect(result.appliedFilters.colours).toHaveLength(2);
      expect(result.appliedFilters.style).toBe('CONTEMPORARY');
      expect(result.appliedFilters.finish).toBe('GLOSS');
    });
  });

  describe('getProductViewCount', () => {
    it('should return total view count for a product', async () => {
      const productId = 'prod-123';

      (prisma.productView.count as jest.Mock).mockResolvedValue(150);

      const result = await analyticsRepository.getProductViewCount(productId);

      expect(result).toBe(150);
      expect(prisma.productView.count).toHaveBeenCalledWith({
        where: { productId },
      });
    });

    it('should return 0 for products with no views', async () => {
      const productId = 'prod-new';

      (prisma.productView.count as jest.Mock).mockResolvedValue(0);

      const result = await analyticsRepository.getProductViewCount(productId);

      expect(result).toBe(0);
    });

    it('should count views within date range', async () => {
      const productId = 'prod-123';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      (prisma.productView.count as jest.Mock).mockResolvedValue(75);

      const result = await analyticsRepository.getProductViewCount(
        productId,
        startDate,
        endDate
      );

      expect(result).toBe(75);
      expect(prisma.productView.count).toHaveBeenCalledWith({
        where: {
          productId,
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
      });
    });
  });

  describe('getProductAnalytics', () => {
    it('should return comprehensive product analytics', async () => {
      const productId = 'prod-123';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const viewsData = [
        { id: '1', productId, userId: 'user-1', sessionId: 'session-1', source: 'SEARCH', deviceType: 'DESKTOP' },
        { id: '2', productId, userId: 'user-2', sessionId: 'session-2', source: 'DIRECT', deviceType: 'MOBILE' },
        { id: '3', productId, userId: 'user-1', sessionId: 'session-3', source: 'FILTER', deviceType: 'DESKTOP' },
      ];

      (prisma.productView.findMany as jest.Mock).mockResolvedValue(viewsData);
      (prisma.productView.count as jest.Mock).mockResolvedValue(3);
      (prisma.productView.groupBy as jest.Mock).mockResolvedValue([
        { userId: 'user-1', _count: { userId: 2 } },
        { userId: 'user-2', _count: { userId: 1 } },
      ]);

      const result = await analyticsRepository.getProductAnalytics(
        productId,
        startDate,
        endDate
      );

      expect(result.productId).toBe(productId);
      expect(result.totalViews).toBe(3);
      expect(result.uniqueViews).toBe(2);
      expect(result.period).toEqual({ startDate, endDate });
    });

    it('should calculate view sources correctly', async () => {
      const productId = 'prod-123';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const viewsData = [
        { source: 'SEARCH', deviceType: 'DESKTOP' },
        { source: 'SEARCH', deviceType: 'MOBILE' },
        { source: 'DIRECT', deviceType: 'DESKTOP' },
        { source: 'FILTER', deviceType: 'TABLET' },
        { source: 'FILTER', deviceType: 'MOBILE' },
      ];

      (prisma.productView.findMany as jest.Mock).mockResolvedValue(viewsData);
      (prisma.productView.count as jest.Mock).mockResolvedValue(5);
      (prisma.productView.groupBy as jest.Mock).mockResolvedValue([]);

      const result = await analyticsRepository.getProductAnalytics(
        productId,
        startDate,
        endDate
      );

      expect(result.viewsBySource.SEARCH).toBe(2);
      expect(result.viewsBySource.DIRECT).toBe(1);
      expect(result.viewsBySource.FILTER).toBe(2);
    });

    it('should calculate device distribution', async () => {
      const productId = 'prod-123';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const viewsData = [
        { source: 'SEARCH', deviceType: 'DESKTOP' },
        { source: 'DIRECT', deviceType: 'DESKTOP' },
        { source: 'FILTER', deviceType: 'MOBILE' },
        { source: 'SEARCH', deviceType: 'MOBILE' },
        { source: 'DIRECT', deviceType: 'TABLET' },
      ];

      (prisma.productView.findMany as jest.Mock).mockResolvedValue(viewsData);
      (prisma.productView.count as jest.Mock).mockResolvedValue(5);
      (prisma.productView.groupBy as jest.Mock).mockResolvedValue([]);

      const result = await analyticsRepository.getProductAnalytics(
        productId,
        startDate,
        endDate
      );

      expect(result.viewsByDevice.DESKTOP).toBe(2);
      expect(result.viewsByDevice.MOBILE).toBe(2);
      expect(result.viewsByDevice.TABLET).toBe(1);
    });

    it('should throw NotFoundError for non-existent product', async () => {
      const productId = 'prod-nonexistent';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      (prisma.product.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        analyticsRepository.getProductAnalytics(productId, startDate, endDate)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getCategoryAnalytics', () => {
    it('should return analytics for KITCHEN category', async () => {
      const category = 'KITCHEN';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const productsData = [
        { id: 'prod-1', category: 'KITCHEN', name: 'Modern Kitchen White' },
        { id: 'prod-2', category: 'KITCHEN', name: 'Contemporary Kitchen Grey' },
        { id: 'prod-3', category: 'KITCHEN', name: 'Classic Kitchen Oak' },
      ];

      (prisma.product.findMany as jest.Mock).mockResolvedValue(productsData);
      (prisma.productView.count as jest.Mock).mockResolvedValue(2500);
      (prisma.productView.groupBy as jest.Mock)
        .mockResolvedValueOnce([
          { userId: 'user-1', _count: { userId: 1 } },
          { userId: 'user-2', _count: { userId: 1 } },
        ])
        .mockResolvedValueOnce([
          { productId: 'prod-1', _count: { productId: 500 } },
          { productId: 'prod-2', _count: { productId: 450 } },
        ]);

      const result = await analyticsRepository.getCategoryAnalytics(
        category,
        startDate,
        endDate
      );

      expect(result.category).toBe('KITCHEN');
      expect(result.totalProducts).toBe(3);
      expect(result.totalViews).toBe(2500);
      expect(result.uniqueViews).toBe(2);
    });

    it('should return analytics for BEDROOM category', async () => {
      const category = 'BEDROOM';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const productsData = [
        { id: 'prod-4', category: 'BEDROOM', name: 'Elegant Bedroom Oak' },
        { id: 'prod-5', category: 'BEDROOM', name: 'Modern Bedroom White' },
      ];

      (prisma.product.findMany as jest.Mock).mockResolvedValue(productsData);
      (prisma.productView.count as jest.Mock).mockResolvedValue(1800);
      (prisma.productView.groupBy as jest.Mock)
        .mockResolvedValueOnce([
          { userId: 'user-3', _count: { userId: 1 } },
        ])
        .mockResolvedValueOnce([
          { productId: 'prod-4', _count: { productId: 1000 } },
        ]);

      const result = await analyticsRepository.getCategoryAnalytics(
        category,
        startDate,
        endDate
      );

      expect(result.category).toBe('BEDROOM');
      expect(result.totalProducts).toBe(2);
      expect(result.totalViews).toBe(1800);
    });

    it('should calculate average product views', async () => {
      const category = 'KITCHEN';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const productsData = Array(10).fill(null).map((_, i) => ({
        id: `prod-${i}`,
        category: 'KITCHEN',
        name: `Kitchen ${i}`,
      }));

      (prisma.product.findMany as jest.Mock).mockResolvedValue(productsData);
      (prisma.productView.count as jest.Mock).mockResolvedValue(1000);
      (prisma.productView.groupBy as jest.Mock).mockResolvedValue([]);

      const result = await analyticsRepository.getCategoryAnalytics(
        category,
        startDate,
        endDate
      );

      expect(result.averageProductViews).toBe(100); // 1000 / 10
    });
  });

  describe('getTopViewedProducts', () => {
    it('should return top viewed products with default limit', async () => {
      const limit = 10;
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const groupedData = [
        { productId: 'prod-1', _count: { productId: 500 } },
        { productId: 'prod-2', _count: { productId: 450 } },
        { productId: 'prod-3', _count: { productId: 400 } },
      ];

      const productsData = [
        { id: 'prod-1', name: 'Modern Kitchen White', category: 'KITCHEN' },
        { id: 'prod-2', name: 'Contemporary Bedroom Grey', category: 'BEDROOM' },
        { id: 'prod-3', name: 'Classic Kitchen Oak', category: 'KITCHEN' },
      ];

      (prisma.productView.groupBy as jest.Mock).mockResolvedValue(groupedData);
      (prisma.product.findMany as jest.Mock).mockResolvedValue(productsData);

      const result = await analyticsRepository.getTopViewedProducts(
        limit,
        startDate,
        endDate
      );

      expect(result).toHaveLength(3);
      expect(result[0].views).toBe(500);
      expect(result[0].productId).toBe('prod-1');
      expect(result[1].views).toBe(450);
    });

    it('should filter by category', async () => {
      const limit = 5;
      const category = 'KITCHEN';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const groupedData = [
        { productId: 'prod-1', _count: { productId: 500 } },
        { productId: 'prod-3', _count: { productId: 400 } },
      ];

      const productsData = [
        { id: 'prod-1', name: 'Modern Kitchen White', category: 'KITCHEN' },
        { id: 'prod-3', name: 'Classic Kitchen Oak', category: 'KITCHEN' },
      ];

      (prisma.productView.groupBy as jest.Mock).mockResolvedValue(groupedData);
      (prisma.product.findMany as jest.Mock).mockResolvedValue(productsData);

      const result = await analyticsRepository.getTopViewedProducts(
        limit,
        startDate,
        endDate,
        category
      );

      expect(result).toHaveLength(2);
      expect(result.every(p => p.category === 'KITCHEN')).toBe(true);
    });

    it('should respect limit parameter', async () => {
      const limit = 3;
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const groupedData = Array(10).fill(null).map((_, i) => ({
        productId: `prod-${i}`,
        _count: { productId: 100 - i },
      }));

      const productsData = Array(10).fill(null).map((_, i) => ({
        id: `prod-${i}`,
        name: `Product ${i}`,
        category: 'KITCHEN',
      }));

      (prisma.productView.groupBy as jest.Mock).mockResolvedValue(groupedData.slice(0, 3));
      (prisma.product.findMany as jest.Mock).mockResolvedValue(productsData.slice(0, 3));

      const result = await analyticsRepository.getTopViewedProducts(
        limit,
        startDate,
        endDate
      );

      expect(result).toHaveLength(3);
    });
  });

  describe('getTopSearchedTerms', () => {
    it('should return top searched terms', async () => {
      const limit = 10;
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const groupedData = [
        { searchTerm: 'modern kitchen', _count: { searchTerm: 250 }, _avg: { resultsCount: 15 } },
        { searchTerm: 'white kitchen', _count: { searchTerm: 200 }, _avg: { resultsCount: 20 } },
        { searchTerm: 'bedroom oak', _count: { searchTerm: 150 }, _avg: { resultsCount: 12 } },
      ];

      (prisma.productSearch.groupBy as jest.Mock).mockResolvedValue(groupedData);

      const result = await analyticsRepository.getTopSearchedTerms(
        limit,
        startDate,
        endDate
      );

      expect(result).toHaveLength(3);
      expect(result[0].term).toBe('modern kitchen');
      expect(result[0].count).toBe(250);
      expect(result[0].averageResults).toBe(15);
    });

    it('should return empty array when no searches exist', async () => {
      const limit = 10;
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      (prisma.productSearch.groupBy as jest.Mock).mockResolvedValue([]);

      const result = await analyticsRepository.getTopSearchedTerms(
        limit,
        startDate,
        endDate
      );

      expect(result).toEqual([]);
    });

    it('should order by count descending', async () => {
      const limit = 5;
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const groupedData = [
        { searchTerm: 'term1', _count: { searchTerm: 300 }, _avg: { resultsCount: 10 } },
        { searchTerm: 'term2', _count: { searchTerm: 250 }, _avg: { resultsCount: 15 } },
        { searchTerm: 'term3', _count: { searchTerm: 200 }, _avg: { resultsCount: 8 } },
      ];

      (prisma.productSearch.groupBy as jest.Mock).mockResolvedValue(groupedData);

      const result = await analyticsRepository.getTopSearchedTerms(
        limit,
        startDate,
        endDate
      );

      expect(result[0].count).toBeGreaterThanOrEqual(result[1].count);
      expect(result[1].count).toBeGreaterThanOrEqual(result[2].count);
    });
  });

  describe('getPopularFilters', () => {
    it('should return popular filter combinations', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const groupedData = [
        { filterType: 'COLOUR', filterValue: 'white', _count: { filterType: 500 }, _avg: { resultsCount: 18 } },
        { filterType: 'CATEGORY', filterValue: 'KITCHEN', _count: { filterType: 450 }, _avg: { resultsCount: 25 } },
        { filterType: 'STYLE', filterValue: 'MODERN', _count: { filterType: 350 }, _avg: { resultsCount: 15 } },
      ];

      (prisma.productFilter.groupBy as jest.Mock).mockResolvedValue(groupedData);

      const result = await analyticsRepository.getPopularFilters(startDate, endDate);

      expect(result).toHaveLength(3);
      expect(result[0].filterType).toBe('COLOUR');
      expect(result[0].filterValue).toBe('white');
      expect(result[0].count).toBe(500);
    });

    it('should include average results for each filter', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const groupedData = [
        { filterType: 'COLOUR', filterValue: 'grey', _count: { filterType: 300 }, _avg: { resultsCount: 22.5 } },
      ];

      (prisma.productFilter.groupBy as jest.Mock).mockResolvedValue(groupedData);

      const result = await analyticsRepository.getPopularFilters(startDate, endDate);

      expect(result[0].averageResults).toBe(22.5);
    });
  });

  describe('getConversionMetrics', () => {
    it('should calculate conversion metrics correctly', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      (prisma.productView.count as jest.Mock).mockResolvedValue(5000);
      (prisma.booking.count as jest.Mock).mockResolvedValue(250);
      (prisma.brochureRequest.count as jest.Mock).mockResolvedValue(150);

      const result = await analyticsRepository.getConversionMetrics(
        startDate,
        endDate
      );

      expect(result.totalViews).toBe(5000);
      expect(result.totalBookings).toBe(250);
      expect(result.totalBrochureRequests).toBe(150);
      expect(result.conversionRate).toBe(0.05); // 250/5000
      expect(result.brochureRequestRate).toBe(0.03); // 150/5000
    });

    it('should handle zero views gracefully', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      (prisma.productView.count as jest.Mock).mockResolvedValue(0);
      (prisma.booking.count as jest.Mock).mockResolvedValue(0);
      (prisma.brochureRequest.count as jest.Mock).mockResolvedValue(0);

      const result = await analyticsRepository.getConversionMetrics(
        startDate,
        endDate
      );

      expect(result.conversionRate).toBe(0);
      expect(result.brochureRequestRate).toBe(0);
    });

    it('should calculate average views to booking', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      (prisma.productView.count as jest.Mock).mockResolvedValue(4000);
      (prisma.booking.count as jest.Mock).mockResolvedValue(200);
      (prisma.brochureRequest.count as jest.Mock).mockResolvedValue(100);

      const result = await analyticsRepository.getConversionMetrics(
        startDate,
        endDate
      );

      expect(result.averageViewsToBooking).toBe(20); // 4000/200
    });
  });

  describe('getBounceRate', () => {
    it('should calculate bounce rate for a product', async () => {
      const productId = 'prod-123';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const sessionsData = [
        { id: 'session-1', duration: 10 },
        { id: 'session-2', duration: 120 },
        { id: 'session-3', duration: 5 },
        { id: 'session-4', duration: 180 },
        { id: 'session-5', duration: 8 },
      ];

      (prisma.session.findMany as jest.Mock).mockResolvedValue(sessionsData);

      const result = await analyticsRepository.getBounceRate(
        productId,
        startDate,
        endDate
      );

      // 3 out of 5 sessions are bounces (duration < 30 seconds)
      expect(result).toBe(0.6);
    });

    it('should return 0 when no sessions exist', async () => {
      const productId = 'prod-new';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      (prisma.session.findMany as jest.Mock).mockResolvedValue([]);

      const result = await analyticsRepository.getBounceRate(
        productId,
        startDate,
        endDate
      );

      expect(result).toBe(0);
    });
  });

  describe('getUserJourney', () => {
    it('should return complete user journey', async () => {
      const sessionId = 'session-789';

      const eventsData = [
        { type: 'PAGE_VIEW', timestamp: new Date('2024-01-15T10:00:00Z'), data: { page: 'home' } },
        { type: 'SEARCH', timestamp: new Date('2024-01-15T10:02:00Z'), data: { term: 'modern kitchen' } },
        { type: 'PRODUCT_VIEW', timestamp: new Date('2024-01-15T10:05:00Z'), data: { productId: 'prod-123' } },
        { type: 'BOOKING_STARTED', timestamp: new Date('2024-01-15T10:12:00Z'), data: { type: 'consultation' } },
      ];

      const sessionData = {
        id: sessionId,
        userId: 'user-456',
        startTime: new Date('2024-01-15T10:00:00Z'),
        endTime: new Date('2024-01-15T10:15:00Z'),
      };

      (prisma.analyticsEvent.findMany as jest.Mock).mockResolvedValue(eventsData);
      (prisma.session.findUnique as jest.Mock).mockResolvedValue(sessionData);

      const result = await analyticsRepository.getUserJourney(sessionId);

      expect(result.sessionId).toBe(sessionId);
      expect(result.events).toHaveLength(4);
      expect(result.conversionEvent).toBe('BOOKING_STARTED');
    });
  });

  describe('getFunnelAnalytics', () => {
    it('should return booking funnel analytics', async () => {
      const funnelType = 'BOOKING';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const funnelData = [
        { step: 'PRODUCT_VIEW', count: 1000 },
        { step: 'BOOKING_TYPE_SELECT', count: 400 },
        { step: 'DETAILS_ENTERED', count: 300 },
        { step: 'SLOT_SELECTED', count: 250 },
        { step: 'BOOKING_COMPLETED', count: 200 },
      ];

      (prisma.analyticsEvent.groupBy as jest.Mock).mockResolvedValue(funnelData);

      const result = await analyticsRepository.getFunnelAnalytics(
        funnelType,
        startDate,
        endDate
      );

      expect(result.funnelType).toBe('BOOKING');
      expect(result.steps).toHaveLength(5);
      expect(result.overallConversionRate).toBe(0.20); // 200/1000
    });

    it('should calculate drop-off percentages', async () => {
      const funnelType = 'BROCHURE_REQUEST';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const funnelData = [
        { step: 'PRODUCT_VIEW', count: 1000 },
        { step: 'BROCHURE_BUTTON_CLICK', count: 200 },
        { step: 'FORM_STARTED', count: 150 },
        { step: 'FORM_COMPLETED', count: 120 },
      ];

      (prisma.analyticsEvent.groupBy as jest.Mock).mockResolvedValue(funnelData);

      const result = await analyticsRepository.getFunnelAnalytics(
        funnelType,
        startDate,
        endDate
      );

      expect(result.steps[0].dropOff).toBe(0); // First step has no drop-off
      expect(result.steps[1].dropOff).toBe(80); // 800/1000 = 80%
      expect(result.steps[2].dropOff).toBe(5); // 50/1000 = 5%
    });
  });

  describe('deleteAnalyticsData', () => {
    it('should delete analytics data before specified date', async () => {
      const beforeDate = new Date('2024-01-01');

      (prisma.productView.deleteMany as jest.Mock).mockResolvedValue({ count: 100 });
      (prisma.productSearch.deleteMany as jest.Mock).mockResolvedValue({ count: 50 });
      (prisma.productFilter.deleteMany as jest.Mock).mockResolvedValue({ count: 75 });
      (prisma.analyticsEvent.deleteMany as jest.Mock).mockResolvedValue({ count: 200 });

      const result = await analyticsRepository.deleteAnalyticsData(beforeDate);

      expect(result.deletedViews).toBe(100);
      expect(result.deletedSearches).toBe(50);
      expect(result.deletedFilters).toBe(75);
      expect(result.deletedEvents).toBe(200);
    });
  });

  describe('exportAnalyticsData', () => {
    it('should export analytics data in CSV format', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const format = 'CSV';

      const viewsData = [
        { productId: 'prod-1', userId: 'user-1', timestamp: new Date() },
        { productId: 'prod-2', userId: 'user-2', timestamp: new Date() },
      ];

      (prisma.productView.findMany as jest.Mock).mockResolvedValue(viewsData);

      const result = await analyticsRepository.exportAnalyticsData(
        startDate,
        endDate,
        format
      );

      expect(result.format).toBe('CSV');
      expect(result.data).toBeTruthy();
      expect(result.generatedAt).toBeInstanceOf(Date);
    });

    it('should export analytics data in JSON format', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const format = 'JSON';

      const viewsData = [
        { productId: 'prod-1', userId: 'user-1', timestamp: new Date() },
      ];

      (prisma.productView.findMany as jest.Mock).mockResolvedValue(viewsData);

      const result = await analyticsRepository.exportAnalyticsData(
        startDate,
        endDate,
        format
      );

      expect(result.format).toBe('JSON');
      expect(result.data).toBeTruthy();
    });
  });
});