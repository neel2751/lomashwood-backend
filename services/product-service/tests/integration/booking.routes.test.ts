import request from 'supertest';
import { Application } from 'express';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../../src/app';
import { 
  createTestProduct, 
  createTestCategory, 
  createTestColour,
  createTestUser,
  createTestShowroom,
  clearDatabase 
} from '../fixtures';

describe('Booking Routes Integration Tests - Product Service', () => {
  let app: Application;
  let prisma: PrismaClient;
  let authToken: string;
  let adminToken: string;
  let kitchenProductId: string;
  let bedroomProductId: string;
  let kitchenCategoryId: string;
  let bedroomCategoryId: string;
  let testUserId: string;
  let testShowroomId: string;

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
    
    // Create test showroom
    const showroom = await createTestShowroom(prisma, {
      name: 'London Showroom',
      address: '123 High Street, London, UK',
      email: 'london@lomashwood.com',
      phone: '+44 20 1234 5678'
    });
    testShowroomId = showroom.id;
  });

  afterAll(async () => {
    await clearDatabase(prisma);
    await prisma.$disconnect();
  });

  describe('GET /api/v1/products/categories/:categoryId/booking-info', () => {
    it('should get booking information for kitchen category', async () => {
      const response = await request(app)
        .get(`/api/v1/products/categories/${kitchenCategoryId}/booking-info`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('categoryId', kitchenCategoryId);
      expect(response.body.data).toHaveProperty('categoryName', 'Kitchen');
      expect(response.body.data).toHaveProperty('availableForBooking', true);
      expect(response.body.data).toHaveProperty('bookingTypes');
      expect(response.body.data.bookingTypes).toEqual(
        expect.arrayContaining(['HOME_MEASUREMENT', 'ONLINE', 'SHOWROOM'])
      );
    });

    it('should get booking information for bedroom category', async () => {
      const response = await request(app)
        .get(`/api/v1/products/categories/${bedroomCategoryId}/booking-info`)
        .expect(200);

      expect(response.body.data).toHaveProperty('categoryId', bedroomCategoryId);
      expect(response.body.data).toHaveProperty('categoryName', 'Bedroom');
    });

    it('should return 404 for non-existent category', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/v1/products/categories/${fakeId}/booking-info`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('Category not found');
    });
  });

  describe('GET /api/v1/products/:id/booking-details', () => {
    it('should get product-specific booking details', async () => {
      const response = await request(app)
        .get(`/api/v1/products/${kitchenProductId}/booking-details`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('productId', kitchenProductId);
      expect(response.body.data).toHaveProperty('productTitle', 'Luna White Kitchen');
      expect(response.body.data).toHaveProperty('category', 'Kitchen');
      expect(response.body.data).toHaveProperty('availableForConsultation', true);
      expect(response.body.data).toHaveProperty('estimatedMeasurementTime');
      expect(response.body.data).toHaveProperty('consultationTypes');
    });

    it('should include available colours in booking details', async () => {
      const response = await request(app)
        .get(`/api/v1/products/${kitchenProductId}/booking-details`)
        .expect(200);

      expect(response.body.data).toHaveProperty('availableColours');
      expect(response.body.data.availableColours).toBeInstanceOf(Array);
      expect(response.body.data.availableColours.length).toBeGreaterThan(0);
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/v1/products/${fakeId}/booking-details`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/v1/products/validate-booking-products', () => {
    it('should validate products for booking consultation', async () => {
      const response = await request(app)
        .post('/api/v1/products/validate-booking-products')
        .send({
          productIds: [kitchenProductId],
          bookingType: 'HOME_MEASUREMENT'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('valid', true);
      expect(response.body.data).toHaveProperty('products');
      expect(response.body.data.products).toBeInstanceOf(Array);
    });

    it('should validate mixed category booking (kitchen and bedroom)', async () => {
      const response = await request(app)
        .post('/api/v1/products/validate-booking-products')
        .send({
          productIds: [kitchenProductId, bedroomProductId],
          bookingType: 'HOME_MEASUREMENT'
        })
        .expect(200);

      expect(response.body.data).toHaveProperty('valid', true);
      expect(response.body.data).toHaveProperty('categories');
      expect(response.body.data.categories).toEqual(
        expect.arrayContaining(['Kitchen', 'Bedroom'])
      );
      expect(response.body.data).toHaveProperty('requiresMultipleConsultants', true);
    });

    it('should return validation errors for invalid booking type', async () => {
      const response = await request(app)
        .post('/api/v1/products/validate-booking-products')
        .send({
          productIds: [kitchenProductId],
          bookingType: 'INVALID_TYPE'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('booking type');
    });

    it('should return validation errors for empty product list', async () => {
      const response = await request(app)
        .post('/api/v1/products/validate-booking-products')
        .send({
          productIds: [],
          bookingType: 'HOME_MEASUREMENT'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('at least one product');
    });

    it('should handle non-existent products gracefully', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .post('/api/v1/products/validate-booking-products')
        .send({
          productIds: [kitchenProductId, fakeId],
          bookingType: 'HOME_MEASUREMENT'
        })
        .expect(200);

      expect(response.body.data).toHaveProperty('valid', false);
      expect(response.body.data).toHaveProperty('invalidProducts');
      expect(response.body.data.invalidProducts).toContain(fakeId);
    });
  });

  describe('POST /api/v1/products/:id/request-consultation', () => {
    it('should create consultation request for authenticated user', async () => {
      const response = await request(app)
        .post(`/api/v1/products/${kitchenProductId}/request-consultation`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          consultationType: 'HOME_MEASUREMENT',
          preferredDate: '2026-03-15',
          preferredTime: '14:00',
          postcode: 'SW1A 1AA',
          address: '10 Downing Street, London',
          additionalProducts: [],
          notes: 'Please call before arriving'
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('consultationRequestId');
      expect(response.body.data).toHaveProperty('productId', kitchenProductId);
      expect(response.body.data).toHaveProperty('status', 'PENDING');
      expect(response.body.data).toHaveProperty('category', 'Kitchen');
    });

    it('should handle consultation request for multiple products', async () => {
      const response = await request(app)
        .post(`/api/v1/products/${kitchenProductId}/request-consultation`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          consultationType: 'HOME_MEASUREMENT',
          preferredDate: '2026-03-15',
          preferredTime: '14:00',
          postcode: 'SW1A 1AA',
          address: '10 Downing Street, London',
          additionalProducts: [bedroomProductId],
          notes: 'Interested in both kitchen and bedroom'
        })
        .expect(201);

      expect(response.body.data).toHaveProperty('categories');
      expect(response.body.data.categories).toEqual(
        expect.arrayContaining(['Kitchen', 'Bedroom'])
      );
      expect(response.body.data).toHaveProperty('multiCategoryBooking', true);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post(`/api/v1/products/${kitchenProductId}/request-consultation`)
        .send({
          consultationType: 'HOME_MEASUREMENT',
          preferredDate: '2026-03-15',
          preferredTime: '14:00',
          postcode: 'SW1A 1AA',
          address: '10 Downing Street, London'
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post(`/api/v1/products/${kitchenProductId}/request-consultation`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          consultationType: 'HOME_MEASUREMENT'
          // Missing required fields
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('validationErrors');
    });

    it('should handle online consultation without address', async () => {
      const response = await request(app)
        .post(`/api/v1/products/${kitchenProductId}/request-consultation`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          consultationType: 'ONLINE',
          preferredDate: '2026-03-15',
          preferredTime: '14:00',
          email: 'customer@test.com',
          phone: '+44 7700 900123'
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.consultationType).toBe('ONLINE');
    });

    it('should handle showroom consultation with showroom selection', async () => {
      const response = await request(app)
        .post(`/api/v1/products/${kitchenProductId}/request-consultation`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          consultationType: 'SHOWROOM',
          showroomId: testShowroomId,
          preferredDate: '2026-03-15',
          preferredTime: '14:00'
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('showroomId', testShowroomId);
    });
  });

  describe('GET /api/v1/products/my-consultation-requests', () => {
    beforeEach(async () => {
      // Create some consultation requests
      await request(app)
        .post(`/api/v1/products/${kitchenProductId}/request-consultation`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          consultationType: 'HOME_MEASUREMENT',
          preferredDate: '2026-03-15',
          preferredTime: '14:00',
          postcode: 'SW1A 1AA',
          address: '10 Downing Street, London'
        });
    });

    it('should get consultation requests for authenticated user', async () => {
      const response = await request(app)
        .get('/api/v1/products/my-consultation-requests')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('requests');
      expect(response.body.data.requests).toBeInstanceOf(Array);
      expect(response.body.data.requests.length).toBeGreaterThan(0);
    });

    it('should filter consultation requests by status', async () => {
      const response = await request(app)
        .get('/api/v1/products/my-consultation-requests')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ status: 'PENDING' })
        .expect(200);

      expect(response.body.data.requests.every(
        req => req.status === 'PENDING'
      )).toBe(true);
    });

    it('should filter consultation requests by category', async () => {
      const response = await request(app)
        .get('/api/v1/products/my-consultation-requests')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ category: 'Kitchen' })
        .expect(200);

      expect(response.body.data.requests.every(
        req => req.categories.includes('Kitchen')
      )).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/v1/products/my-consultation-requests')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('limit', 10);
      expect(response.body.data.pagination).toHaveProperty('total');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/products/my-consultation-requests')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/v1/products/consultation-requests/:id', () => {
    let consultationRequestId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post(`/api/v1/products/${kitchenProductId}/request-consultation`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          consultationType: 'HOME_MEASUREMENT',
          preferredDate: '2026-03-15',
          preferredTime: '14:00',
          postcode: 'SW1A 1AA',
          address: '10 Downing Street, London'
        });
      
      consultationRequestId = response.body.data.consultationRequestId;
    });

    it('should get consultation request details', async () => {
      const response = await request(app)
        .get(`/api/v1/products/consultation-requests/${consultationRequestId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id', consultationRequestId);
      expect(response.body.data).toHaveProperty('products');
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('consultationType');
    });

    it('should include product details in consultation request', async () => {
      const response = await request(app)
        .get(`/api/v1/products/consultation-requests/${consultationRequestId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.products).toBeInstanceOf(Array);
      expect(response.body.data.products[0]).toHaveProperty('id', kitchenProductId);
      expect(response.body.data.products[0]).toHaveProperty('title');
      expect(response.body.data.products[0]).toHaveProperty('category');
    });

    it('should return 404 for non-existent consultation request', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/v1/products/consultation-requests/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should return 403 when accessing another users consultation request', async () => {
      // Create another user
      const otherUser = await createTestUser(prisma, {
        email: 'other@test.com',
        role: 'CUSTOMER'
      });
      
      const otherLoginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'other@test.com',
          password: 'Test123!@#'
        });
      
      const otherToken = otherLoginResponse.body.data.token;

      const response = await request(app)
        .get(`/api/v1/products/consultation-requests/${consultationRequestId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('authorized');
    });

    it('should allow admin to view any consultation request', async () => {
      const response = await request(app)
        .get(`/api/v1/products/consultation-requests/${consultationRequestId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id', consultationRequestId);
    });
  });

  describe('PATCH /api/v1/products/consultation-requests/:id', () => {
    let consultationRequestId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post(`/api/v1/products/${kitchenProductId}/request-consultation`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          consultationType: 'HOME_MEASUREMENT',
          preferredDate: '2026-03-15',
          preferredTime: '14:00',
          postcode: 'SW1A 1AA',
          address: '10 Downing Street, London'
        });
      
      consultationRequestId = response.body.data.consultationRequestId;
    });

    it('should allow user to update their consultation request', async () => {
      const response = await request(app)
        .patch(`/api/v1/products/consultation-requests/${consultationRequestId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          preferredDate: '2026-03-20',
          preferredTime: '10:00',
          notes: 'Updated notes'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('preferredDate', '2026-03-20');
      expect(response.body.data).toHaveProperty('preferredTime', '10:00');
    });

    it('should not allow updating confirmed consultations', async () => {
      // First confirm the consultation (admin action)
      await request(app)
        .patch(`/api/v1/products/consultation-requests/${consultationRequestId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'CONFIRMED'
        });

      const response = await request(app)
        .patch(`/api/v1/products/consultation-requests/${consultationRequestId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          preferredDate: '2026-03-25'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('cannot be modified');
    });

    it('should return 403 when updating another users consultation', async () => {
      const otherUser = await createTestUser(prisma, {
        email: 'other2@test.com',
        role: 'CUSTOMER'
      });
      
      const otherLoginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'other2@test.com',
          password: 'Test123!@#'
        });
      
      const otherToken = otherLoginResponse.body.data.token;

      const response = await request(app)
        .patch(`/api/v1/products/consultation-requests/${consultationRequestId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          notes: 'Trying to update'
        })
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('DELETE /api/v1/products/consultation-requests/:id', () => {
    let consultationRequestId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post(`/api/v1/products/${kitchenProductId}/request-consultation`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          consultationType: 'HOME_MEASUREMENT',
          preferredDate: '2026-03-15',
          preferredTime: '14:00',
          postcode: 'SW1A 1AA',
          address: '10 Downing Street, London'
        });
      
      consultationRequestId = response.body.data.consultationRequestId;
    });

    it('should allow user to cancel their consultation request', async () => {
      const response = await request(app)
        .delete(`/api/v1/products/consultation-requests/${consultationRequestId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('status', 'CANCELLED');
    });

    it('should not allow deleting confirmed consultations', async () => {
      // First confirm the consultation
      await request(app)
        .patch(`/api/v1/products/consultation-requests/${consultationRequestId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'CONFIRMED'
        });

      const response = await request(app)
        .delete(`/api/v1/products/consultation-requests/${consultationRequestId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('cannot be cancelled');
    });

    it('should return 403 when deleting another users consultation', async () => {
      const otherUser = await createTestUser(prisma, {
        email: 'other3@test.com',
        role: 'CUSTOMER'
      });
      
      const otherLoginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'other3@test.com',
          password: 'Test123!@#'
        });
      
      const otherToken = otherLoginResponse.body.data.token;

      const response = await request(app)
        .delete(`/api/v1/products/consultation-requests/${consultationRequestId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/v1/products/categories/booking-statistics', () => {
    it('should get booking statistics by category for admin', async () => {
      const response = await request(app)
        .get('/api/v1/products/categories/booking-statistics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('statistics');
      expect(response.body.data.statistics).toBeInstanceOf(Array);
    });

    it('should include breakdown by booking type', async () => {
      const response = await request(app)
        .get('/api/v1/products/categories/booking-statistics')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ includeBookingTypes: true })
        .expect(200);

      expect(response.body.data.statistics[0]).toHaveProperty('byBookingType');
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get('/api/v1/products/categories/booking-statistics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('admin');
    });
  });

  describe('Email Notifications', () => {
    it('should send acknowledgement email after consultation request', async () => {
      const response = await request(app)
        .post(`/api/v1/products/${kitchenProductId}/request-consultation`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          consultationType: 'HOME_MEASUREMENT',
          preferredDate: '2026-03-15',
          preferredTime: '14:00',
          postcode: 'SW1A 1AA',
          address: '10 Downing Street, London',
          email: 'customer@test.com'
        })
        .expect(201);

      expect(response.body.data).toHaveProperty('emailSent', true);
    });

    it('should send notification email for multi-category booking', async () => {
      const response = await request(app)
        .post(`/api/v1/products/${kitchenProductId}/request-consultation`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          consultationType: 'HOME_MEASUREMENT',
          preferredDate: '2026-03-15',
          preferredTime: '14:00',
          postcode: 'SW1A 1AA',
          address: '10 Downing Street, London',
          additionalProducts: [bedroomProductId],
          email: 'customer@test.com'
        })
        .expect(201);

      expect(response.body.data).toHaveProperty('multiCategoryBooking', true);
      expect(response.body.data).toHaveProperty('notificationsSent');
      expect(response.body.data.notificationsSent).toHaveProperty('customer', true);
      expect(response.body.data.notificationsSent).toHaveProperty('admin', true);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on consultation request endpoints', async () => {
      const requests = [];
      
      // Make multiple rapid requests
      for (let i = 0; i < 50; i++) {
        requests.push(
          request(app)
            .post(`/api/v1/products/${kitchenProductId}/request-consultation`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              consultationType: 'HOME_MEASUREMENT',
              preferredDate: '2026-03-15',
              preferredTime: '14:00',
              postcode: 'SW1A 1AA',
              address: '10 Downing Street, London'
            })
        );
      }

      const responses = await Promise.all(requests);
      const rateLimited = responses.some(r => r.status === 429);
      
      expect(rateLimited).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      await prisma.$disconnect();

      const response = await request(app)
        .get(`/api/v1/products/${kitchenProductId}/booking-details`)
        .expect(500);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('database');

      await prisma.$connect();
    });

    it('should return proper error format for validation errors', async () => {
      const response = await request(app)
        .post(`/api/v1/products/${kitchenProductId}/request-consultation`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          consultationType: 'INVALID',
          preferredDate: 'invalid-date'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('validationErrors');
    });
  });
});