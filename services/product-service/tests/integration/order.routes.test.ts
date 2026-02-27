import request from 'supertest';
import { Application } from 'express';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../../src/app';
import { 
  createTestProduct, 
  createTestCategory, 
  createTestColour,
  createTestUser,
  clearDatabase 
} from '../fixtures';

describe('Order Routes Integration Tests - Product Service', () => {
  let app: Application;
  let prisma: PrismaClient;
  let authToken: string;
  let adminToken: string;
  let testProductId: string;
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
    
    // Create test product data
    const category = await createTestCategory(prisma, {
      name: 'Kitchen',
      slug: 'kitchen'
    });
    
    const colour = await createTestColour(prisma, {
      name: 'White',
      hexCode: '#FFFFFF'
    });
    
    const product = await createTestProduct(prisma, {
      title: 'Luna White Kitchen',
      categoryId: category.id,
      price: 5999.99,
      stock: 10,
      colourIds: [colour.id]
    });
    
    testProductId = product.id;
  });

  afterAll(async () => {
    await clearDatabase(prisma);
    await prisma.$disconnect();
  });

  describe('GET /api/v1/products/:id/order-availability', () => {
    it('should check product availability for order', async () => {
      const response = await request(app)
        .get(`/api/v1/products/${testProductId}/order-availability`)
        .query({ quantity: 2 })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('available', true);
      expect(response.body.data).toHaveProperty('stock', 10);
      expect(response.body.data).toHaveProperty('productId', testProductId);
    });

    it('should return false when quantity exceeds stock', async () => {
      const response = await request(app)
        .get(`/api/v1/products/${testProductId}/order-availability`)
        .query({ quantity: 20 })
        .expect(200);

      expect(response.body.data).toHaveProperty('available', false);
      expect(response.body.data).toHaveProperty('availableStock', 10);
      expect(response.body.data).toHaveProperty('requestedQuantity', 20);
    });

    it('should return 400 for invalid quantity', async () => {
      const response = await request(app)
        .get(`/api/v1/products/${testProductId}/order-availability`)
        .query({ quantity: -1 })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/v1/products/${fakeId}/order-availability`)
        .query({ quantity: 1 })
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('message', 'Product not found');
    });
  });

  describe('POST /api/v1/products/bulk-availability', () => {
    it('should check availability for multiple products', async () => {
      const response = await request(app)
        .post('/api/v1/products/bulk-availability')
        .send({
          items: [
            { productId: testProductId, quantity: 2 }
          ]
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('allAvailable', true);
      expect(response.body.data.items).toBeInstanceOf(Array);
      expect(response.body.data.items[0]).toHaveProperty('productId', testProductId);
      expect(response.body.data.items[0]).toHaveProperty('available', true);
    });

    it('should handle mixed availability scenarios', async () => {
      const response = await request(app)
        .post('/api/v1/products/bulk-availability')
        .send({
          items: [
            { productId: testProductId, quantity: 2 },
            { productId: testProductId, quantity: 20 }
          ]
        })
        .expect(200);

      expect(response.body.data).toHaveProperty('allAvailable', false);
      expect(response.body.data.items).toHaveLength(2);
      expect(response.body.data.items[0].available).toBe(true);
      expect(response.body.data.items[1].available).toBe(false);
    });

    it('should return 400 for invalid request body', async () => {
      const response = await request(app)
        .post('/api/v1/products/bulk-availability')
        .send({
          items: 'invalid'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should return 400 for empty items array', async () => {
      const response = await request(app)
        .post('/api/v1/products/bulk-availability')
        .send({
          items: []
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('at least one item');
    });
  });

  describe('POST /api/v1/products/reserve-stock', () => {
    it('should reserve stock for authenticated user', async () => {
      const response = await request(app)
        .post('/api/v1/products/reserve-stock')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProductId,
          quantity: 2,
          reservationDuration: 900 // 15 minutes
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('reservationId');
      expect(response.body.data).toHaveProperty('productId', testProductId);
      expect(response.body.data).toHaveProperty('quantity', 2);
      expect(response.body.data).toHaveProperty('expiresAt');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/products/reserve-stock')
        .send({
          productId: testProductId,
          quantity: 2
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should return 400 when quantity exceeds available stock', async () => {
      const response = await request(app)
        .post('/api/v1/products/reserve-stock')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProductId,
          quantity: 100
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('Insufficient stock');
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .post('/api/v1/products/reserve-stock')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: fakeId,
          quantity: 1
        })
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('DELETE /api/v1/products/release-stock/:reservationId', () => {
    let reservationId: string;

    beforeEach(async () => {
      // Create a reservation first
      const response = await request(app)
        .post('/api/v1/products/reserve-stock')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProductId,
          quantity: 1
        });
      
      reservationId = response.body.data.reservationId;
    });

    it('should release reserved stock', async () => {
      const response = await request(app)
        .delete(`/api/v1/products/release-stock/${reservationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('released', true);
    });

    it('should return 404 for non-existent reservation', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .delete(`/api/v1/products/release-stock/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .delete(`/api/v1/products/release-stock/${reservationId}`)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should return 403 when trying to release another users reservation', async () => {
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
        .delete(`/api/v1/products/release-stock/${reservationId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('authorized');
    });
  });

  describe('POST /api/v1/products/:id/validate-order', () => {
    it('should validate product for order placement', async () => {
      const response = await request(app)
        .post(`/api/v1/products/${testProductId}/validate-order`)
        .send({
          quantity: 2,
          colourId: (await prisma.colour.findFirst()).id
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('valid', true);
      expect(response.body.data).toHaveProperty('productId', testProductId);
      expect(response.body.data).toHaveProperty('price');
    });

    it('should return validation errors for invalid quantity', async () => {
      const response = await request(app)
        .post(`/api/v1/products/${testProductId}/validate-order`)
        .send({
          quantity: 0,
          colourId: (await prisma.colour.findFirst()).id
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('quantity');
    });

    it('should return validation errors for discontinued products', async () => {
      // Mark product as discontinued
      await prisma.product.update({
        where: { id: testProductId },
        data: { status: 'DISCONTINUED' }
      });

      const response = await request(app)
        .post(`/api/v1/products/${testProductId}/validate-order`)
        .send({
          quantity: 1,
          colourId: (await prisma.colour.findFirst()).id
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('discontinued');

      // Restore product status
      await prisma.product.update({
        where: { id: testProductId },
        data: { status: 'ACTIVE' }
      });
    });

    it('should return validation errors for invalid colour', async () => {
      const fakeColourId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .post(`/api/v1/products/${testProductId}/validate-order`)
        .send({
          quantity: 1,
          colourId: fakeColourId
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('colour');
    });
  });

  describe('GET /api/v1/products/:id/pricing', () => {
    it('should get product pricing for order calculation', async () => {
      const response = await request(app)
        .get(`/api/v1/products/${testProductId}/pricing`)
        .query({ quantity: 2 })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('basePrice');
      expect(response.body.data).toHaveProperty('quantity', 2);
      expect(response.body.data).toHaveProperty('subtotal');
      expect(response.body.data).toHaveProperty('discounts');
    });

    it('should apply volume discounts when applicable', async () => {
      const response = await request(app)
        .get(`/api/v1/products/${testProductId}/pricing`)
        .query({ quantity: 5 })
        .expect(200);

      expect(response.body.data).toHaveProperty('volumeDiscount');
      if (response.body.data.volumeDiscount) {
        expect(response.body.data.volumeDiscount).toHaveProperty('percentage');
        expect(response.body.data.volumeDiscount).toHaveProperty('amount');
      }
    });

    it('should include active sale prices', async () => {
      // Create a sale
      await prisma.sale.create({
        data: {
          title: 'Test Sale',
          description: 'Test Description',
          discountPercentage: 10,
          startDate: new Date(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          products: {
            connect: { id: testProductId }
          }
        }
      });

      const response = await request(app)
        .get(`/api/v1/products/${testProductId}/pricing`)
        .query({ quantity: 1 })
        .expect(200);

      expect(response.body.data).toHaveProperty('salePrice');
      expect(response.body.data).toHaveProperty('regularPrice');
      expect(response.body.data.salePrice).toBeLessThan(response.body.data.regularPrice);
    });
  });

  describe('POST /api/v1/products/calculate-order-total', () => {
    it('should calculate total for multiple products', async () => {
      const response = await request(app)
        .post('/api/v1/products/calculate-order-total')
        .send({
          items: [
            { productId: testProductId, quantity: 2 }
          ]
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('subtotal');
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('items');
      expect(response.body.data.items).toBeInstanceOf(Array);
    });

    it('should apply discount codes when provided', async () => {
      const response = await request(app)
        .post('/api/v1/products/calculate-order-total')
        .send({
          items: [
            { productId: testProductId, quantity: 2 }
          ],
          discountCode: 'SUMMER10'
        })
        .expect(200);

      expect(response.body.data).toHaveProperty('discountApplied');
      expect(response.body.data).toHaveProperty('discountAmount');
    });

    it('should return detailed breakdown', async () => {
      const response = await request(app)
        .post('/api/v1/products/calculate-order-total')
        .send({
          items: [
            { productId: testProductId, quantity: 2 }
          ],
          includeBreakdown: true
        })
        .expect(200);

      expect(response.body.data).toHaveProperty('breakdown');
      expect(response.body.data.breakdown).toHaveProperty('subtotal');
      expect(response.body.data.breakdown).toHaveProperty('discounts');
      expect(response.body.data.breakdown).toHaveProperty('taxes');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on availability check endpoints', async () => {
      const requests = [];
      
      // Make multiple rapid requests
      for (let i = 0; i < 100; i++) {
        requests.push(
          request(app)
            .get(`/api/v1/products/${testProductId}/order-availability`)
            .query({ quantity: 1 })
        );
      }

      const responses = await Promise.all(requests);
      const rateLimited = responses.some(r => r.status === 429);
      
      expect(rateLimited).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // Simulate database disconnect
      await prisma.$disconnect();

      const response = await request(app)
        .get(`/api/v1/products/${testProductId}/order-availability`)
        .query({ quantity: 1 })
        .expect(500);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('database');

      // Reconnect
      await prisma.$connect();
    });

    it('should return proper error format for validation errors', async () => {
      const response = await request(app)
        .post('/api/v1/products/bulk-availability')
        .send({
          items: [
            { productId: 'invalid-id', quantity: -1 }
          ]
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error).toHaveProperty('code');
    });
  });
});