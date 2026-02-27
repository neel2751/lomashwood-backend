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

describe('Notification Routes Integration Tests - Product Service', () => {
  let app: Application;
  let prisma: PrismaClient;
  let authToken: string;
  let adminToken: string;
  let kitchenProductId: string;
  let bedroomProductId: string;
  let testUserId: string;
  let testSaleId: string;

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
    
    const bedroomCategory = await createTestCategory(prisma, {
      name: 'Bedroom',
      slug: 'bedroom'
    });
    
    // Create test colours
    const whiteColour = await createTestColour(prisma, {
      name: 'White',
      hexCode: '#FFFFFF'
    });
    
    // Create test products
    const kitchenProduct = await createTestProduct(prisma, {
      title: 'Luna White Kitchen',
      categoryId: kitchenCategory.id,
      price: 5999.99,
      stock: 0, // Out of stock for back-in-stock notifications
      colourIds: [whiteColour.id]
    });
    kitchenProductId = kitchenProduct.id;
    
    const bedroomProduct = await createTestProduct(prisma, {
      title: 'Modern Grey Bedroom',
      categoryId: bedroomCategory.id,
      price: 3999.99,
      stock: 5,
      colourIds: [whiteColour.id]
    });
    bedroomProductId = bedroomProduct.id;
    
    // Create test sale
    const sale = await createTestSale(prisma, {
      title: 'Summer Sale',
      description: '20% off all kitchens',
      discountPercentage: 20,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      productIds: [kitchenProductId]
    });
    testSaleId = sale.id;
  });

  afterAll(async () => {
    await clearDatabase(prisma);
    await prisma.$disconnect();
  });

  describe('POST /api/v1/products/:id/notify-back-in-stock', () => {
    it('should subscribe to back-in-stock notifications', async () => {
      const response = await request(app)
        .post(`/api/v1/products/${kitchenProductId}/notify-back-in-stock`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'customer@test.com',
          phone: '+44 7700 900123'
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('subscriptionId');
      expect(response.body.data).toHaveProperty('productId', kitchenProductId);
      expect(response.body.data).toHaveProperty('notificationType', 'BACK_IN_STOCK');
      expect(response.body.data).toHaveProperty('status', 'ACTIVE');
    });

    it('should allow unauthenticated users to subscribe with email', async () => {
      const response = await request(app)
        .post(`/api/v1/products/${kitchenProductId}/notify-back-in-stock`)
        .send({
          email: 'guest@test.com'
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('subscriptionId');
    });

    it('should prevent duplicate subscriptions', async () => {
      // First subscription
      await request(app)
        .post(`/api/v1/products/${kitchenProductId}/notify-back-in-stock`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'customer@test.com'
        });

      // Attempt duplicate
      const response = await request(app)
        .post(`/api/v1/products/${kitchenProductId}/notify-back-in-stock`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'customer@test.com'
        })
        .expect(409);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('already subscribed');
    });

    it('should return 400 if product is in stock', async () => {
      const response = await request(app)
        .post(`/api/v1/products/${bedroomProductId}/notify-back-in-stock`)
        .send({
          email: 'customer@test.com'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('in stock');
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post(`/api/v1/products/${kitchenProductId}/notify-back-in-stock`)
        .send({
          email: 'invalid-email'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('validationErrors');
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .post(`/api/v1/products/${fakeId}/notify-back-in-stock`)
        .send({
          email: 'customer@test.com'
        })
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/v1/products/:id/notify-price-drop', () => {
    it('should subscribe to price drop notifications', async () => {
      const response = await request(app)
        .post(`/api/v1/products/${bedroomProductId}/notify-price-drop`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'customer@test.com',
          targetPrice: 3500.00
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('subscriptionId');
      expect(response.body.data).toHaveProperty('productId', bedroomProductId);
      expect(response.body.data).toHaveProperty('notificationType', 'PRICE_DROP');
      expect(response.body.data).toHaveProperty('targetPrice', 3500.00);
    });

    it('should notify immediately if current price is already below target', async () => {
      const response = await request(app)
        .post(`/api/v1/products/${bedroomProductId}/notify-price-drop`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'customer@test.com',
          targetPrice: 5000.00
        })
        .expect(201);

      expect(response.body.data).toHaveProperty('immediateNotification', true);
      expect(response.body.data).toHaveProperty('currentPrice', 3999.99);
    });

    it('should validate target price is positive', async () => {
      const response = await request(app)
        .post(`/api/v1/products/${bedroomProductId}/notify-price-drop`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'customer@test.com',
          targetPrice: -100
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('target price');
    });
  });

  describe('POST /api/v1/products/categories/:categoryId/notify-new-products', () => {
    it('should subscribe to new product notifications for category', async () => {
      const kitchenCategory = await prisma.category.findFirst({
        where: { name: 'Kitchen' }
      });

      const response = await request(app)
        .post(`/api/v1/products/categories/${kitchenCategory.id}/notify-new-products`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'customer@test.com',
          frequency: 'WEEKLY'
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('subscriptionId');
      expect(response.body.data).toHaveProperty('categoryId', kitchenCategory.id);
      expect(response.body.data).toHaveProperty('notificationType', 'NEW_PRODUCTS');
      expect(response.body.data).toHaveProperty('frequency', 'WEEKLY');
    });

    it('should support multiple frequency options', async () => {
      const bedroomCategory = await prisma.category.findFirst({
        where: { name: 'Bedroom' }
      });

      const frequencies = ['IMMEDIATE', 'DAILY', 'WEEKLY', 'MONTHLY'];
      
      for (const frequency of frequencies) {
        const response = await request(app)
          .post(`/api/v1/products/categories/${bedroomCategory.id}/notify-new-products`)
          .send({
            email: `test-${frequency.toLowerCase()}@test.com`,
            frequency
          })
          .expect(201);

        expect(response.body.data.frequency).toBe(frequency);
      }
    });

    it('should return 404 for non-existent category', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .post(`/api/v1/products/categories/${fakeId}/notify-new-products`)
        .send({
          email: 'customer@test.com'
        })
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/v1/products/sales/:saleId/notify', () => {
    it('should subscribe to sale notifications', async () => {
      const response = await request(app)
        .post(`/api/v1/products/sales/${testSaleId}/notify`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'customer@test.com',
          notifyBeforeExpiry: true
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('subscriptionId');
      expect(response.body.data).toHaveProperty('saleId', testSaleId);
      expect(response.body.data).toHaveProperty('notificationType', 'SALE_ALERT');
    });

    it('should send reminder before sale ends', async () => {
      const response = await request(app)
        .post(`/api/v1/products/sales/${testSaleId}/notify`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'customer@test.com',
          notifyBeforeExpiry: true,
          reminderDays: 3
        })
        .expect(201);

      expect(response.body.data).toHaveProperty('reminderScheduled', true);
      expect(response.body.data).toHaveProperty('reminderDate');
    });
  });

  describe('GET /api/v1/products/my-notification-subscriptions', () => {
    beforeEach(async () => {
      // Create some subscriptions
      await request(app)
        .post(`/api/v1/products/${kitchenProductId}/notify-back-in-stock`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'customer@test.com'
        });

      await request(app)
        .post(`/api/v1/products/${bedroomProductId}/notify-price-drop`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'customer@test.com',
          targetPrice: 3500.00
        });
    });

    it('should get all notification subscriptions for user', async () => {
      const response = await request(app)
        .get('/api/v1/products/my-notification-subscriptions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('subscriptions');
      expect(response.body.data.subscriptions).toBeInstanceOf(Array);
      expect(response.body.data.subscriptions.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter subscriptions by type', async () => {
      const response = await request(app)
        .get('/api/v1/products/my-notification-subscriptions')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ type: 'BACK_IN_STOCK' })
        .expect(200);

      expect(response.body.data.subscriptions.every(
        sub => sub.notificationType === 'BACK_IN_STOCK'
      )).toBe(true);
    });

    it('should filter subscriptions by status', async () => {
      const response = await request(app)
        .get('/api/v1/products/my-notification-subscriptions')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ status: 'ACTIVE' })
        .expect(200);

      expect(response.body.data.subscriptions.every(
        sub => sub.status === 'ACTIVE'
      )).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/v1/products/my-notification-subscriptions')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('limit', 10);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/products/my-notification-subscriptions')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/v1/products/notification-subscriptions/:id', () => {
    let subscriptionId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post(`/api/v1/products/${kitchenProductId}/notify-back-in-stock`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'customer@test.com'
        });
      
      subscriptionId = response.body.data.subscriptionId;
    });

    it('should get subscription details', async () => {
      const response = await request(app)
        .get(`/api/v1/products/notification-subscriptions/${subscriptionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id', subscriptionId);
      expect(response.body.data).toHaveProperty('product');
      expect(response.body.data.product).toHaveProperty('id', kitchenProductId);
      expect(response.body.data).toHaveProperty('notificationType');
      expect(response.body.data).toHaveProperty('status');
    });

    it('should return 404 for non-existent subscription', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/v1/products/notification-subscriptions/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should return 403 when accessing another users subscription', async () => {
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
        .get(`/api/v1/products/notification-subscriptions/${subscriptionId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should allow admin to view any subscription', async () => {
      const response = await request(app)
        .get(`/api/v1/products/notification-subscriptions/${subscriptionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('PATCH /api/v1/products/notification-subscriptions/:id', () => {
    let subscriptionId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post(`/api/v1/products/${bedroomProductId}/notify-price-drop`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'customer@test.com',
          targetPrice: 3500.00
        });
      
      subscriptionId = response.body.data.subscriptionId;
    });

    it('should update subscription details', async () => {
      const response = await request(app)
        .patch(`/api/v1/products/notification-subscriptions/${subscriptionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          targetPrice: 3000.00,
          email: 'updated@test.com'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('targetPrice', 3000.00);
      expect(response.body.data).toHaveProperty('email', 'updated@test.com');
    });

    it('should pause subscription', async () => {
      const response = await request(app)
        .patch(`/api/v1/products/notification-subscriptions/${subscriptionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'PAUSED'
        })
        .expect(200);

      expect(response.body.data).toHaveProperty('status', 'PAUSED');
    });

    it('should resume paused subscription', async () => {
      // First pause
      await request(app)
        .patch(`/api/v1/products/notification-subscriptions/${subscriptionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'PAUSED'
        });

      // Then resume
      const response = await request(app)
        .patch(`/api/v1/products/notification-subscriptions/${subscriptionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'ACTIVE'
        })
        .expect(200);

      expect(response.body.data).toHaveProperty('status', 'ACTIVE');
    });

    it('should return 403 when updating another users subscription', async () => {
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
        .patch(`/api/v1/products/notification-subscriptions/${subscriptionId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          targetPrice: 2000.00
        })
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('DELETE /api/v1/products/notification-subscriptions/:id', () => {
    let subscriptionId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post(`/api/v1/products/${kitchenProductId}/notify-back-in-stock`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'customer@test.com'
        });
      
      subscriptionId = response.body.data.subscriptionId;
    });

    it('should unsubscribe from notifications', async () => {
      const response = await request(app)
        .delete(`/api/v1/products/notification-subscriptions/${subscriptionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('unsubscribed', true);
    });

    it('should support unsubscribe via email token', async () => {
      // Get unsubscribe token (normally sent in email)
      const subscriptionDetails = await request(app)
        .get(`/api/v1/products/notification-subscriptions/${subscriptionId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      const unsubscribeToken = subscriptionDetails.body.data.unsubscribeToken;

      const response = await request(app)
        .delete(`/api/v1/products/notification-subscriptions/${subscriptionId}`)
        .query({ token: unsubscribeToken })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    it('should return 403 when deleting another users subscription', async () => {
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
        .delete(`/api/v1/products/notification-subscriptions/${subscriptionId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/v1/products/:id/trigger-notifications', () => {
    it('should trigger back-in-stock notifications when product restocked', async () => {
      // Create subscriptions first
      await request(app)
        .post(`/api/v1/products/${kitchenProductId}/notify-back-in-stock`)
        .send({
          email: 'subscriber1@test.com'
        });

      await request(app)
        .post(`/api/v1/products/${kitchenProductId}/notify-back-in-stock`)
        .send({
          email: 'subscriber2@test.com'
        });

      // Admin updates stock
      const response = await request(app)
        .post(`/api/v1/products/${kitchenProductId}/trigger-notifications`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          notificationType: 'BACK_IN_STOCK',
          newStock: 10
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('notificationsSent');
      expect(response.body.data.notificationsSent).toBeGreaterThanOrEqual(2);
      expect(response.body.data).toHaveProperty('subscribers');
    });

    it('should trigger price drop notifications', async () => {
      // Create subscription
      await request(app)
        .post(`/api/v1/products/${bedroomProductId}/notify-price-drop`)
        .send({
          email: 'pricewatcher@test.com',
          targetPrice: 3500.00
        });

      // Admin triggers price drop
      const response = await request(app)
        .post(`/api/v1/products/${bedroomProductId}/trigger-notifications`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          notificationType: 'PRICE_DROP',
          newPrice: 3200.00
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('notificationsSent');
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .post(`/api/v1/products/${kitchenProductId}/trigger-notifications`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          notificationType: 'BACK_IN_STOCK',
          newStock: 10
        })
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('admin');
    });
  });

  describe('GET /api/v1/products/notification-statistics', () => {
    it('should get notification statistics for admin', async () => {
      const response = await request(app)
        .get('/api/v1/products/notification-statistics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('totalSubscriptions');
      expect(response.body.data).toHaveProperty('activeSubscriptions');
      expect(response.body.data).toHaveProperty('byType');
      expect(response.body.data).toHaveProperty('notificationsSent');
      expect(response.body.data).toHaveProperty('averageResponseTime');
    });

    it('should break down statistics by notification type', async () => {
      const response = await request(app)
        .get('/api/v1/products/notification-statistics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.byType).toHaveProperty('BACK_IN_STOCK');
      expect(response.body.data.byType).toHaveProperty('PRICE_DROP');
      expect(response.body.data.byType).toHaveProperty('NEW_PRODUCTS');
    });

    it('should support date range filtering', async () => {
      const response = await request(app)
        .get('/api/v1/products/notification-statistics')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          startDate: '2026-01-01',
          endDate: '2026-12-31'
        })
        .expect(200);

      expect(response.body.data).toHaveProperty('dateRange');
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get('/api/v1/products/notification-statistics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/v1/products/:id/notification-subscribers', () => {
    beforeEach(async () => {
      // Create multiple subscriptions
      await request(app)
        .post(`/api/v1/products/${kitchenProductId}/notify-back-in-stock`)
        .send({
          email: 'sub1@test.com'
        });

      await request(app)
        .post(`/api/v1/products/${kitchenProductId}/notify-back-in-stock`)
        .send({
          email: 'sub2@test.com'
        });
    });

    it('should get list of subscribers for product', async () => {
      const response = await request(app)
        .get(`/api/v1/products/${kitchenProductId}/notification-subscribers`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('productId', kitchenProductId);
      expect(response.body.data).toHaveProperty('subscribers');
      expect(response.body.data.subscribers).toBeInstanceOf(Array);
      expect(response.body.data.subscribers.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter subscribers by notification type', async () => {
      const response = await request(app)
        .get(`/api/v1/products/${kitchenProductId}/notification-subscribers`)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ type: 'BACK_IN_STOCK' })
        .expect(200);

      expect(response.body.data.subscribers.every(
        sub => sub.notificationType === 'BACK_IN_STOCK'
      )).toBe(true);
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get(`/api/v1/products/${kitchenProductId}/notification-subscribers`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/v1/products/bulk-notification-subscribe', () => {
    it('should subscribe to notifications for multiple products', async () => {
      const response = await request(app)
        .post('/api/v1/products/bulk-notification-subscribe')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          subscriptions: [
            {
              productId: kitchenProductId,
              notificationType: 'BACK_IN_STOCK',
              email: 'customer@test.com'
            },
            {
              productId: bedroomProductId,
              notificationType: 'PRICE_DROP',
              targetPrice: 3000.00,
              email: 'customer@test.com'
            }
          ]
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('subscribed');
      expect(response.body.data.subscribed).toBeInstanceOf(Array);
      expect(response.body.data.subscribed.length).toBe(2);
    });

    it('should handle partial failures gracefully', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      
      const response = await request(app)
        .post('/api/v1/products/bulk-notification-subscribe')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          subscriptions: [
            {
              productId: kitchenProductId,
              notificationType: 'BACK_IN_STOCK',
              email: 'customer@test.com'
            },
            {
              productId: fakeId,
              notificationType: 'BACK_IN_STOCK',
              email: 'customer@test.com'
            }
          ]
        })
        .expect(207); // Multi-status

      expect(response.body.data).toHaveProperty('succeeded');
      expect(response.body.data).toHaveProperty('failed');
      expect(response.body.data.succeeded.length).toBe(1);
      expect(response.body.data.failed.length).toBe(1);
    });
  });

  describe('POST /api/v1/products/test-notification', () => {
    it('should send test notification for admin', async () => {
      const response = await request(app)
        .post('/api/v1/products/test-notification')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          notificationType: 'BACK_IN_STOCK',
          productId: kitchenProductId,
          recipient: 'admin@test.com'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('sent', true);
      expect(response.body.data).toHaveProperty('provider');
      expect(response.body.data).toHaveProperty('messageId');
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .post('/api/v1/products/test-notification')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          notificationType: 'BACK_IN_STOCK',
          productId: kitchenProductId,
          recipient: 'customer@test.com'
        })
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on subscription endpoints', async () => {
      const requests = [];
      
      // Make multiple rapid requests
      for (let i = 0; i < 50; i++) {
        requests.push(
          request(app)
            .post(`/api/v1/products/${kitchenProductId}/notify-back-in-stock`)
            .send({
              email: `test${i}@test.com`
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
        .get('/api/v1/products/my-notification-subscriptions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('database');

      await prisma.$connect();
    });

    it('should return proper error format for validation errors', async () => {
      const response = await request(app)
        .post(`/api/v1/products/${kitchenProductId}/notify-back-in-stock`)
        .send({
          email: 'invalid-email',
          phone: 'not-a-phone'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('validationErrors');
    });

    it('should handle notification service failures', async () => {
      const response = await request(app)
        .post(`/api/v1/products/${kitchenProductId}/trigger-notifications`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          notificationType: 'BACK_IN_STOCK',
          newStock: 10,
          forceNotificationError: true // Test flag
        })
        .expect(500);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('notification');
    });
  });

  describe('Security & Privacy', () => {
    it('should not expose email addresses in subscriber lists', async () => {
      // Create subscription
      await request(app)
        .post(`/api/v1/products/${kitchenProductId}/notify-back-in-stock`)
        .send({
          email: 'private@test.com'
        });

      const response = await request(app)
        .get(`/api/v1/products/${kitchenProductId}/notification-subscribers`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      response.body.data.subscribers.forEach(sub => {
        // Email should be masked or hashed in non-detailed views
        if (!sub.detailed) {
          expect(sub.email).toMatch(/\*+@/);
        }
      });
    });

    it('should validate unsubscribe tokens', async () => {
      const response = await request(app)
        .delete(`/api/v1/products/notification-subscriptions/${kitchenProductId}`)
        .query({ token: 'invalid-token' })
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('token');
    });
  });
});