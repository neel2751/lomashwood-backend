import request from 'supertest';
import { Application } from 'express';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../../src/app';
import { 
  createTestProduct, 
  createTestCategory, 
  createTestColour,
  createTestUser,
  createTestSale,
  clearDatabase 
} from '../fixtures';

describe('Analytics Routes Integration Tests - Product Service', () => {
  let app: Application;
  let prisma: PrismaClient;
  let authToken: string;
  let adminToken: string;
  let kitchenProductId: string;
  let bedroomProductId: string;
  let kitchenCategoryId: string;
  let bedroomCategoryId: string;
  let testUserId: string;

  beforeAll(async () => {
    // Initialize app and database
    app = await createApp();
    prisma = new PrismaClient();
    
    // Clear database
    await clearDatabase(prisma);
    
    // Create test user and get auth token
    const user = await createTestUser(prisma, {
      email: 'customer@test.com',
      role: 'CUSTOMER'
    });
    testUserId = user.id;
    
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'customer@test.com',
        password: 'Test123!@#'
      });
    
    authToken = loginResponse.body.data.token;
    
    // Create admin user
    const admin = await createTestUser(prisma, {
      email: 'admin@test.com',
      role: 'ADMIN'
    });
    
    const adminLoginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'Admin123!@#'
      });
    
    adminToken = adminLoginResponse.body.data.token;
    
    // Create test categories
    const kitchenCategory = await createTestCategory(prisma, {
      name: 'Kitchen',
      slug: 'kitchen'
    });
    kitchenCategoryId = kitchenCategory.id;
    
    const bedroomCategory = await createTestCategory(prisma, {
      name: 'Bedroom',
      slug: 'bedroom'
    });
    bedroomCategoryId = bedroomCategory.id;
    
    // Create test colours
    const whiteColour = await createTestColour(prisma, {
      name: 'White',
      hexCode: '#FFFFFF'
    });
    
    const greyColour = await createTestColour(prisma, {
      name: 'Grey',
      hexCode: '#808080'
    });
    
    // Create test products
    const kitchenProduct = await createTestProduct(prisma, {
      title: 'Luna White Kitchen',
      categoryId: kitchenCategory.id,
      price: 5999.99,
      stock: 10,
      colourIds: [whiteColour.id]
    });
    kitchenProductId = kitchenProduct.id;
    
    const bedroomProduct = await createTestProduct(prisma, {
      title: 'Modern Grey Bedroom',
      categoryId: bedroomCategory.id,
      price: 3999.99,
      stock: 5,
      colourIds: [greyColour.id]
    });
    bedroomProductId = bedroomProduct.id;
    
    // Create test sale
    await createTestSale(prisma, {
      title: 'Summer Sale',
      description: '20% off all kitchens',
      discountPercentage: 20,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      productIds: [kitchenProductId]
    });
  });

  afterAll(async () => {
    await clearDatabase(prisma);
    await prisma.$disconnect();
  });

  describe('POST /api/v1/products/:id/track-view', () => {
    it('should track product view event', async () => {
      const response = await request(app)
        .post(`/api/v1/products/${kitchenProductId}/track-view`)
        .send({
          sessionId: 'session-123',
          source: 'SEARCH',
          referrer: '/products/kitchen'
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('tracked', true);
      expect(response.body.data).toHaveProperty('eventId');
      expect(response.body.data).toHaveProperty('productId', kitchenProductId);
    });

    it('should track authenticated user views', async () => {
      const response = await request(app)
        .post(`/api/v1/products/${kitchenProductId}/track-view`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sessionId: 'session-123',
          source: 'DIRECT'
        })
        .expect(201);

      expect(response.body.data).toHaveProperty('userId', testUserId);
      expect(response.body.data).toHaveProperty('authenticated', true);
    });

    it('should track anonymous user views', async () => {
      const response = await request(app)
        .post(`/api/v1/products/${kitchenProductId}/track-view`)
        .send({
          sessionId: 'session-456',
          fingerprint: 'fingerprint-abc123'
        })
        .expect(201);

      expect(response.body.data).toHaveProperty('authenticated', false);
      expect(response.body.data).toHaveProperty('anonymous', true);
    });

    it('should capture device and browser information', async () => {
      const response = await request(app)
        .post(`/api/v1/products/${kitchenProductId}/track-view`)
        .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
        .send({
          sessionId: 'session-789',
          device: {
            type: 'desktop',
            os: 'Windows',
            browser: 'Chrome'
          }
        })
        .expect(201);

      expect(response.body.data).toHaveProperty('deviceInfo');
      expect(response.body.data.deviceInfo).toHaveProperty('type', 'desktop');
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .post(`/api/v1/products/${fakeId}/track-view`)
        .send({
          sessionId: 'session-123'
        })
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/v1/products/track-search', () => {
    it('should track product search event', async () => {
      const response = await request(app)
        .post('/api/v1/products/track-search')
        .send({
          query: 'white kitchen',
          filters: {
            category: 'Kitchen',
            priceRange: '5000-7000',
            colours: ['White']
          },
          resultsCount: 15,
          sessionId: 'session-123'
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('tracked', true);
      expect(response.body.data).toHaveProperty('searchId');
      expect(response.body.data).toHaveProperty('query', 'white kitchen');
    });

    it('should track search with no results', async () => {
      const response = await request(app)
        .post('/api/v1/products/track-search')
        .send({
          query: 'nonexistent product xyz',
          resultsCount: 0,
          sessionId: 'session-123'
        })
        .expect(201);

      expect(response.body.data).toHaveProperty('noResults', true);
      expect(response.body.data).toHaveProperty('resultsCount', 0);
    });

    it('should track filter usage', async () => {
      const response = await request(app)
        .post('/api/v1/products/track-search')
        .send({
          query: 'kitchen',
          filters: {
            colours: ['White', 'Grey'],
            style: 'Modern',
            finish: 'Gloss',
            priceRange: '5000-10000'
          },
          resultsCount: 8,
          sessionId: 'session-123'
        })
        .expect(201);

      expect(response.body.data).toHaveProperty('filtersUsed');
      expect(response.body.data.filtersUsed).toEqual(
        expect.arrayContaining(['colours', 'style', 'finish', 'priceRange'])
      );
    });

    it('should track sort options', async () => {
      const response = await request(app)
        .post('/api/v1/products/track-search')
        .send({
          query: 'bedroom',
          sortBy: 'PRICE_LOW_TO_HIGH',
          resultsCount: 12,
          sessionId: 'session-123'
        })
        .expect(201);

      expect(response.body.data).toHaveProperty('sortBy', 'PRICE_LOW_TO_HIGH');
    });
  });

  describe('POST /api/v1/products/:id/track-click', () => {
    it('should track product click from search results', async () => {
      const response = await request(app)
        .post(`/api/v1/products/${kitchenProductId}/track-click`)
        .send({
          sessionId: 'session-123',
          source: 'SEARCH_RESULTS',
          position: 3,
          searchQuery: 'white kitchen'
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('tracked', true);
      expect(response.body.data).toHaveProperty('productId', kitchenProductId);
      expect(response.body.data).toHaveProperty('clickPosition', 3);
    });

    it('should track product click from recommendations', async () => {
      const response = await request(app)
        .post(`/api/v1/products/${bedroomProductId}/track-click`)
        .send({
          sessionId: 'session-123',
          source: 'RECOMMENDATIONS',
          referrerProductId: kitchenProductId
        })
        .expect(201);

      expect(response.body.data).toHaveProperty('source', 'RECOMMENDATIONS');
      expect(response.body.data).toHaveProperty('referrerProductId', kitchenProductId);
    });

    it('should track click from different sources', async () => {
      const sources = [
        'SEARCH_RESULTS',
        'CATEGORY_PAGE',
        'HOMEPAGE',
        'RECOMMENDATIONS',
        'RELATED_PRODUCTS',
        'SALE_PAGE'
      ];

      for (const source of sources) {
        const response = await request(app)
          .post(`/api/v1/products/${kitchenProductId}/track-click`)
          .send({
            sessionId: `session-${source}`,
            source
          })
          .expect(201);

        expect(response.body.data.source).toBe(source);
      }
    });
  });

  describe('POST /api/v1/products/:id/track-add-to-cart', () => {
    it('should track add to cart event', async () => {
      const response = await request(app)
        .post(`/api/v1/products/${kitchenProductId}/track-add-to-cart`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          quantity: 1,
          colourId: (await prisma.colour.findFirst()).id,
          sessionId: 'session-123'
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('tracked', true);
      expect(response.body.data).toHaveProperty('productId', kitchenProductId);
      expect(response.body.data).toHaveProperty('quantity', 1);
    });

    it('should track cart value', async () => {
      const response = await request(app)
        .post(`/api/v1/products/${kitchenProductId}/track-add-to-cart`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          quantity: 2,
          colourId: (await prisma.colour.findFirst()).id,
          sessionId: 'session-123'
        })
        .expect(201);

      expect(response.body.data).toHaveProperty('totalValue');
      expect(response.body.data.totalValue).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/products/:id/analytics', () => {
    beforeEach(async () => {
      // Generate some analytics data
      await request(app)
        .post(`/api/v1/products/${kitchenProductId}/track-view`)
        .send({ sessionId: 'session-1' });
      
      await request(app)
        .post(`/api/v1/products/${kitchenProductId}/track-view`)
        .send({ sessionId: 'session-2' });
      
      await request(app)
        .post(`/api/v1/products/${kitchenProductId}/track-click`)
        .send({ sessionId: 'session-1', source: 'SEARCH_RESULTS' });
    });

    it('should get product analytics for admin', async () => {
      const response = await request(app)
        .get(`/api/v1/products/${kitchenProductId}/analytics`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('productId', kitchenProductId);
      expect(response.body.data).toHaveProperty('views');
      expect(response.body.data).toHaveProperty('clicks');
      expect(response.body.data).toHaveProperty('clickThroughRate');
      expect(response.body.data).toHaveProperty('conversionRate');
    });

    it('should include time series data', async () => {
      const response = await request(app)
        .get(`/api/v1/products/${kitchenProductId}/analytics`)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ includeTimeSeries: true })
        .expect(200);

      expect(response.body.data).toHaveProperty('timeSeries');
      expect(response.body.data.timeSeries).toBeInstanceOf(Array);
    });

    it('should support date range filtering', async () => {
      const response = await request(app)
        .get(`/api/v1/products/${kitchenProductId}/analytics`)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          startDate: '2026-01-01',
          endDate: '2026-12-31'
        })
        .expect(200);

      expect(response.body.data).toHaveProperty('dateRange');
      expect(response.body.data.dateRange).toHaveProperty('start', '2026-01-01');
      expect(response.body.data.dateRange).toHaveProperty('end', '2026-12-31');
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get(`/api/v1/products/${kitchenProductId}/analytics`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('admin');
    });
  });

  describe('GET /api/v1/products/popular', () => {
    it('should get most popular products', async () => {
      const response = await request(app)
        .get('/api/v1/products/popular')
        .query({ limit: 10 })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('products');
      expect(response.body.data.products).toBeInstanceOf(Array);
      expect(response.body.data.products.length).toBeLessThanOrEqual(10);
    });

    it('should rank products by view count', async () => {
      const response = await request(app)
        .get('/api/v1/products/popular')
        .query({ rankBy: 'VIEWS' })
        .expect(200);

      const products = response.body.data.products;
      for (let i = 0; i < products.length - 1; i++) {
        expect(products[i].views).toBeGreaterThanOrEqual(products[i + 1].views);
      }
    });

    it('should rank products by conversion rate', async () => {
      const response = await request(app)
        .get('/api/v1/products/popular')
        .query({ rankBy: 'CONVERSION_RATE' })
        .expect(200);

      expect(response.body.data.products[0]).toHaveProperty('conversionRate');
    });

    it('should filter popular products by category', async () => {
      const response = await request(app)
        .get('/api/v1/products/popular')
        .query({ 
          categoryId: kitchenCategoryId,
          limit: 5
        })
        .expect(200);

      expect(response.body.data.products.every(
        p => p.categoryId === kitchenCategoryId
      )).toBe(true);
    });

    it('should support time period filtering', async () => {
      const response = await request(app)
        .get('/api/v1/products/popular')
        .query({ 
          period: 'LAST_30_DAYS',
          limit: 10
        })
        .expect(200);

      expect(response.body.data).toHaveProperty('period', 'LAST_30_DAYS');
    });
  });

  describe('GET /api/v1/products/trending', () => {
    it('should get trending products', async () => {
      const response = await request(app)
        .get('/api/v1/products/trending')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('products');
      expect(response.body.data.products).toBeInstanceOf(Array);
    });

    it('should calculate trend score based on velocity', async () => {
      const response = await request(app)
        .get('/api/v1/products/trending')
        .expect(200);

      expect(response.body.data.products[0]).toHaveProperty('trendScore');
      expect(response.body.data.products[0]).toHaveProperty('viewVelocity');
    });

    it('should compare current vs previous period', async () => {
      const response = await request(app)
        .get('/api/v1/products/trending')
        .query({ includeComparison: true })
        .expect(200);

      expect(response.body.data.products[0]).toHaveProperty('growthPercentage');
    });
  });

  describe('GET /api/v1/products/categories/:categoryId/analytics', () => {
    it('should get category analytics for admin', async () => {
      const response = await request(app)
        .get(`/api/v1/products/categories/${kitchenCategoryId}/analytics`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('categoryId', kitchenCategoryId);
      expect(response.body.data).toHaveProperty('totalProducts');
      expect(response.body.data).toHaveProperty('totalViews');
      expect(response.body.data).toHaveProperty('averagePrice');
      expect(response.body.data).toHaveProperty('topProducts');
    });

    it('should include colour distribution', async () => {
      const response = await request(app)
        .get(`/api/v1/products/categories/${kitchenCategoryId}/analytics`)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ includeColourDistribution: true })
        .expect(200);

      expect(response.body.data).toHaveProperty('colourDistribution');
      expect(response.body.data.colourDistribution).toBeInstanceOf(Array);
    });

    it('should include price range distribution', async () => {
      const response = await request(app)
        .get(`/api/v1/products/categories/${kitchenCategoryId}/analytics`)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ includePriceDistribution: true })
        .expect(200);

      expect(response.body.data).toHaveProperty('priceDistribution');
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get(`/api/v1/products/categories/${kitchenCategoryId}/analytics`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/v1/products/search-analytics', () => {
    beforeEach(async () => {
      // Generate search analytics data
      await request(app)
        .post('/api/v1/products/track-search')
        .send({
          query: 'white kitchen',
          resultsCount: 15,
          sessionId: 'session-1'
        });
      
      await request(app)
        .post('/api/v1/products/track-search')
        .send({
          query: 'modern bedroom',
          resultsCount: 8,
          sessionId: 'session-2'
        });
    });

    it('should get search analytics for admin', async () => {
      const response = await request(app)
        .get('/api/v1/products/search-analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('totalSearches');
      expect(response.body.data).toHaveProperty('uniqueQueries');
      expect(response.body.data).toHaveProperty('topSearches');
      expect(response.body.data).toHaveProperty('noResultsQueries');
    });

    it('should show most popular search terms', async () => {
      const response = await request(app)
        .get('/api/v1/products/search-analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.topSearches).toBeInstanceOf(Array);
      expect(response.body.data.topSearches[0]).toHaveProperty('query');
      expect(response.body.data.topSearches[0]).toHaveProperty('count');
    });

    it('should identify searches with no results', async () => {
      // Create a no-results search
      await request(app)
        .post('/api/v1/products/track-search')
        .send({
          query: 'nonexistent product',
          resultsCount: 0,
          sessionId: 'session-3'
        });

      const response = await request(app)
        .get('/api/v1/products/search-analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('noResultsQueries');
      expect(response.body.data.noResultsQueries).toBeInstanceOf(Array);
    });

    it('should analyze filter usage patterns', async () => {
      const response = await request(app)
        .get('/api/v1/products/search-analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ includeFilters: true })
        .expect(200);

      expect(response.body.data).toHaveProperty('filterUsage');
      expect(response.body.data.filterUsage).toHaveProperty('colours');
      expect(response.body.data.filterUsage).toHaveProperty('priceRanges');
      expect(response.body.data.filterUsage).toHaveProperty('styles');
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get('/api/v1/products/search-analytics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/v1/products/conversion-funnel', () => {
    it('should get conversion funnel data for admin', async () => {
      const response = await request(app)
        .get('/api/v1/products/conversion-funnel')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('funnel');
      expect(response.body.data.funnel).toHaveProperty('productView');
      expect(response.body.data.funnel).toHaveProperty('addToCart');
      expect(response.body.data.funnel).toHaveProperty('checkout');
      expect(response.body.data.funnel).toHaveProperty('purchase');
    });

    it('should calculate drop-off rates at each stage', async () => {
      const response = await request(app)
        .get('/api/v1/products/conversion-funnel')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('dropOffRates');
      expect(response.body.data.dropOffRates).toHaveProperty('viewToCart');
      expect(response.body.data.dropOffRates).toHaveProperty('cartToCheckout');
      expect(response.body.data.dropOffRates).toHaveProperty('checkoutToPurchase');
    });

    it('should support filtering by product', async () => {
      const response = await request(app)
        .get('/api/v1/products/conversion-funnel')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ productId: kitchenProductId })
        .expect(200);

      expect(response.body.data).toHaveProperty('productId', kitchenProductId);
    });

    it('should support filtering by category', async () => {
      const response = await request(app)
        .get('/api/v1/products/conversion-funnel')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ categoryId: kitchenCategoryId })
        .expect(200);

      expect(response.body.data).toHaveProperty('categoryId', kitchenCategoryId);
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get('/api/v1/products/conversion-funnel')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/v1/products/colour-analytics', () => {
    it('should get colour preference analytics for admin', async () => {
      const response = await request(app)
        .get('/api/v1/products/colour-analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('colours');
      expect(response.body.data.colours).toBeInstanceOf(Array);
    });

    it('should rank colours by popularity', async () => {
      const response = await request(app)
        .get('/api/v1/products/colour-analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.colours[0]).toHaveProperty('name');
      expect(response.body.data.colours[0]).toHaveProperty('views');
      expect(response.body.data.colours[0]).toHaveProperty('conversions');
    });

    it('should show colour preferences by category', async () => {
      const response = await request(app)
        .get('/api/v1/products/colour-analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ groupByCategory: true })
        .expect(200);

      expect(response.body.data).toHaveProperty('byCategory');
      expect(response.body.data.byCategory).toBeInstanceOf(Array);
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get('/api/v1/products/colour-analytics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/v1/products/revenue-analytics', () => {
    it('should get revenue analytics by product for admin', async () => {
      const response = await request(app)
        .get('/api/v1/products/revenue-analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('totalRevenue');
      expect(response.body.data).toHaveProperty('topRevenueProducts');
      expect(response.body.data).toHaveProperty('averageOrderValue');
    });

    it('should break down revenue by category', async () => {
      const response = await request(app)
        .get('/api/v1/products/revenue-analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ groupByCategory: true })
        .expect(200);

      expect(response.body.data).toHaveProperty('byCategory');
      expect(response.body.data.byCategory).toBeInstanceOf(Array);
    });

    it('should show revenue trends over time', async () => {
      const response = await request(app)
        .get('/api/v1/products/revenue-analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ includeTimeSeries: true })
        .expect(200);

      expect(response.body.data).toHaveProperty('timeSeries');
    });

    it('should compare periods', async () => {
      const response = await request(app)
        .get('/api/v1/products/revenue-analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ 
          comparePeriods: true,
          currentPeriod: 'LAST_30_DAYS',
          previousPeriod: 'PREVIOUS_30_DAYS'
        })
        .expect(200);

      expect(response.body.data).toHaveProperty('comparison');
      expect(response.body.data.comparison).toHaveProperty('growth');
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get('/api/v1/products/revenue-analytics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/v1/products/:id/related-products-performance', () => {
    it('should get related products performance for admin', async () => {
      const response = await request(app)
        .get(`/api/v1/products/${kitchenProductId}/related-products-performance`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('productId', kitchenProductId);
      expect(response.body.data).toHaveProperty('frequentlyViewedWith');
      expect(response.body.data).toHaveProperty('frequentlyBoughtWith');
    });

    it('should calculate co-view rates', async () => {
      const response = await request(app)
        .get(`/api/v1/products/${kitchenProductId}/related-products-performance`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.frequentlyViewedWith[0]).toHaveProperty('productId');
      expect(response.body.data.frequentlyViewedWith[0]).toHaveProperty('coViewRate');
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get(`/api/v1/products/${kitchenProductId}/related-products-performance`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/v1/products/analytics/export', () => {
    it('should export analytics data for admin', async () => {
      const response = await request(app)
        .post('/api/v1/products/analytics/export')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          format: 'CSV',
          startDate: '2026-01-01',
          endDate: '2026-12-31',
          metrics: ['VIEWS', 'CLICKS', 'CONVERSIONS']
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('exportId');
      expect(response.body.data).toHaveProperty('downloadUrl');
    });

    it('should support multiple export formats', async () => {
      const formats = ['CSV', 'XLSX', 'JSON'];
      
      for (const format of formats) {
        const response = await request(app)
          .post('/api/v1/products/analytics/export')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            format,
            metrics: ['VIEWS']
          })
          .expect(200);

        expect(response.body.data).toHaveProperty('format', format);
      }
    });

    it('should allow filtering by category', async () => {
      const response = await request(app)
        .post('/api/v1/products/analytics/export')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          format: 'CSV',
          categoryId: kitchenCategoryId,
          metrics: ['VIEWS', 'REVENUE']
        })
        .expect(200);

      expect(response.body.data).toHaveProperty('filters');
      expect(response.body.data.filters).toHaveProperty('categoryId', kitchenCategoryId);
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .post('/api/v1/products/analytics/export')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          format: 'CSV',
          metrics: ['VIEWS']
        })
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/v1/products/user-session/:sessionId', () => {
    let sessionId: string;

    beforeEach(async () => {
      sessionId = `session-${Date.now()}`;
      
      // Create session with multiple events
      await request(app)
        .post(`/api/v1/products/${kitchenProductId}/track-view`)
        .send({ sessionId });
      
      await request(app)
        .post(`/api/v1/products/${bedroomProductId}/track-view`)
        .send({ sessionId });
      
      await request(app)
        .post('/api/v1/products/track-search')
        .send({
          query: 'kitchen',
          resultsCount: 10,
          sessionId
        });
    });

    it('should get user session analytics for admin', async () => {
      const response = await request(app)
        .get(`/api/v1/products/user-session/${sessionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('sessionId', sessionId);
      expect(response.body.data).toHaveProperty('events');
      expect(response.body.data.events).toBeInstanceOf(Array);
      expect(response.body.data.events.length).toBeGreaterThanOrEqual(3);
    });

    it('should order events chronologically', async () => {
      const response = await request(app)
        .get(`/api/v1/products/user-session/${sessionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const events = response.body.data.events;
      for (let i = 0; i < events.length - 1; i++) {
        expect(new Date(events[i].timestamp).getTime())
          .toBeLessThanOrEqual(new Date(events[i + 1].timestamp).getTime());
      }
    });

    it('should include session metadata', async () => {
      const response = await request(app)
        .get(`/api/v1/products/user-session/${sessionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('duration');
      expect(response.body.data).toHaveProperty('eventCount');
      expect(response.body.data).toHaveProperty('productsViewed');
    });

    it('should return 404 for non-existent session', async () => {
      const response = await request(app)
        .get('/api/v1/products/user-session/nonexistent-session')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get(`/api/v1/products/user-session/${sessionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on tracking endpoints', async () => {
      const requests = [];
      
      // Make multiple rapid tracking requests
      for (let i = 0; i < 200; i++) {
        requests.push(
          request(app)
            .post(`/api/v1/products/${kitchenProductId}/track-view`)
            .send({
              sessionId: `session-${i}`
            })
        );
      }

      const responses = await Promise.all(requests);
      const rateLimited = responses.some(r => r.status === 429);
      
      expect(rateLimited).toBe(true);
    });

    it('should not rate limit authenticated users as strictly', async () => {
      const requests = [];
      
      // Make multiple requests with auth token
      for (let i = 0; i < 100; i++) {
        requests.push(
          request(app)
            .post(`/api/v1/products/${kitchenProductId}/track-view`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              sessionId: `session-auth-${i}`
            })
        );
      }

      const responses = await Promise.all(requests);
      const successCount = responses.filter(r => r.status === 201).length;
      
      expect(successCount).toBeGreaterThan(50); // More lenient for authenticated
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      await prisma.$disconnect();

      const response = await request(app)
        .get('/api/v1/products/popular')
        .expect(500);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('database');

      await prisma.$connect();
    });

    it('should return proper error format for validation errors', async () => {
      const response = await request(app)
        .post(`/api/v1/products/${kitchenProductId}/track-view`)
        .send({
          sessionId: '', // Empty session ID
          source: 'INVALID_SOURCE'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('validationErrors');
    });

    it('should handle malformed tracking data', async () => {
      const response = await request(app)
        .post('/api/v1/products/track-search')
        .send({
          query: 'x'.repeat(1000), // Extremely long query
          filters: 'not-an-object'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('Privacy & GDPR Compliance', () => {
    it('should anonymize user data in analytics', async () => {
      const response = await request(app)
        .get(`/api/v1/products/${kitchenProductId}/analytics`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // User-specific data should be aggregated, not individual
      expect(response.body.data).not.toHaveProperty('userEmails');
      expect(response.body.data).not.toHaveProperty('userIds');
    });

    it('should support opt-out of analytics tracking', async () => {
      const response = await request(app)
        .post(`/api/v1/products/${kitchenProductId}/track-view`)
        .send({
          sessionId: 'session-opted-out',
          doNotTrack: true
        })
        .expect(200);

      expect(response.body.data).toHaveProperty('tracked', false);
      expect(response.body.data).toHaveProperty('reason', 'USER_OPT_OUT');
    });
  });

  describe('Performance', () => {
    it('should handle bulk tracking efficiently', async () => {
      const startTime = Date.now();
      
      const requests = [];
      for (let i = 0; i < 50; i++) {
        requests.push(
          request(app)
            .post(`/api/v1/products/${kitchenProductId}/track-view`)
            .send({
              sessionId: `perf-test-${i}`
            })
        );
      }
      
      await Promise.all(requests);
      const endTime = Date.now();
      
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(10000); // Should complete in under 10 seconds
    });
  });
});