import request from 'supertest';
import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { app } from '../../src/app';
import { prisma } from '../../src/infrastructure/db/prisma.client';
import { redis } from '../../src/infrastructure/cache/redis.client';

describe('Smoke Tests - Critical System Functionality', () => {
  let testApp: Express;
  let authToken: string;
  let adminToken: string;
  let testUserId: string;
  let testProductId: string;
  let testCategoryId: string;
  let testOrderId: string;
  let testBookingId: string;

  beforeAll(async () => {
    testApp = app;
    await prisma.$connect();
    await redis.connect();

    const userRegister = await request(testApp)
      .post('/api/v1/auth/register')
      .send({
        email: 'smoke.test@example.com',
        password: 'SmokeTest123!',
        firstName: 'Smoke',
        lastName: 'Test',
        phone: '+447700900500',
      });

    testUserId = userRegister.body.data.user.id;

    const userLogin = await request(testApp)
      .post('/api/v1/auth/login')
      .send({
        email: 'smoke.test@example.com',
        password: 'SmokeTest123!',
      });

    authToken = userLogin.body.data.accessToken;

    const adminRegister = await request(testApp)
      .post('/api/v1/auth/register')
      .send({
        email: 'admin.smoke@lomashwood.com',
        password: 'AdminSmoke123!',
        firstName: 'Admin',
        lastName: 'Smoke',
        phone: '+447700900501',
        role: 'ADMIN',
      });

    const adminLogin = await request(testApp)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin.smoke@lomashwood.com',
        password: 'AdminSmoke123!',
      });

    adminToken = adminLogin.body.data.accessToken;

    const category = await prisma.category.create({
      data: {
        name: 'Smoke Test Category',
        slug: 'smoke-test-category',
        type: 'KITCHEN',
        isActive: true,
      },
    });

    testCategoryId = category.id;

    const product = await prisma.product.create({
      data: {
        title: 'Smoke Test Product',
        slug: 'smoke-test-product',
        description: 'Product for smoke testing',
        categoryId: testCategoryId,
        basePrice: 10000.00,
        isActive: true,
        stockStatus: 'IN_STOCK',
        sku: 'SMOKE-001',
      },
    });

    testProductId = product.id;
  });

  afterAll(async () => {
    await prisma.booking.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['smoke.test@example.com', 'admin.smoke@lomashwood.com'],
        },
      },
    });

    await prisma.$disconnect();
    await redis.disconnect();
  });

  describe('Health Checks', () => {
    it('should verify API Gateway is healthy', async () => {
      const response = await request(testApp)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.timestamp).toBeDefined();
    });

    it('should verify database connection', async () => {
      const response = await request(testApp)
        .get('/health/database')
        .expect(200);

      expect(response.body.database).toBe('connected');
    });

    it('should verify Redis connection', async () => {
      const response = await request(testApp)
        .get('/health/redis')
        .expect(200);

      expect(response.body.redis).toBe('connected');
    });

    it('should verify all services are reachable', async () => {
      const response = await request(testApp)
        .get('/health/services')
        .expect(200);

      expect(response.body.services).toMatchObject({
        authService: 'healthy',
        productService: 'healthy',
        orderService: 'healthy',
        appointmentService: 'healthy',
        notificationService: 'healthy',
      });
    });
  });

  describe('Authentication Service', () => {
    it('should register new user', async () => {
      const response = await request(testApp)
        .post('/api/v1/auth/register')
        .send({
          email: `smoke.${Date.now()}@example.com`,
          password: 'TestPass123!',
          firstName: 'Test',
          lastName: 'User',
          phone: '+447700900502',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBeDefined();
    });

    it('should login existing user', async () => {
      const response = await request(testApp)
        .post('/api/v1/auth/login')
        .send({
          email: 'smoke.test@example.com',
          password: 'SmokeTest123!',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
    });

    it('should retrieve current user profile', async () => {
      const response = await request(testApp)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('smoke.test@example.com');
    });

    it('should logout user', async () => {
      const response = await request(testApp)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Product Service', () => {
    it('should retrieve all products', async () => {
      const response = await request(testApp)
        .get('/api/v1/products')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.products)).toBe(true);
    });

    it('should retrieve specific product', async () => {
      const response = await request(testApp)
        .get(`/api/v1/products/${testProductId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.product.id).toBe(testProductId);
    });

    it('should filter products by category', async () => {
      const response = await request(testApp)
        .get('/api/v1/products')
        .query({
          categoryId: testCategoryId,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.products)).toBe(true);
    });

    it('should retrieve all categories', async () => {
      const response = await request(testApp)
        .get('/api/v1/categories')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.categories)).toBe(true);
    });

    it('should retrieve all colours', async () => {
      const response = await request(testApp)
        .get('/api/v1/colours')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.colours)).toBe(true);
    });

    it('should search products', async () => {
      const response = await request(testApp)
        .get('/api/v1/products/search')
        .query({
          q: 'Smoke',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.products)).toBe(true);
    });
  });

  describe('Cart and Checkout', () => {
    it('should add product to cart', async () => {
      const response = await request(testApp)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProductId,
          quantity: 1,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cartItem.productId).toBe(testProductId);
    });

    it('should retrieve current cart', async () => {
      const response = await request(testApp)
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cart).toBeDefined();
    });

    it('should update cart item quantity', async () => {
      const response = await request(testApp)
        .patch(`/api/v1/cart/items/${testProductId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          quantity: 2,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cartItem.quantity).toBe(2);
    });

    it('should remove item from cart', async () => {
      const response = await request(testApp)
        .delete(`/api/v1/cart/items/${testProductId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Order Service', () => {
    beforeAll(async () => {
      const address = await prisma.address.create({
        data: {
          userId: testUserId,
          type: 'SHIPPING',
          firstName: 'Smoke',
          lastName: 'Test',
          addressLine1: '123 Smoke Street',
          city: 'London',
          postcode: 'SW1A 1AA',
          country: 'United Kingdom',
          phone: '+447700900500',
          isDefault: true,
        },
      });

      await request(testApp)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProductId,
          quantity: 1,
        });

      const order = await request(testApp)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          shippingAddressId: address.id,
          billingAddressId: address.id,
          paymentMethod: 'card',
        });

      testOrderId = order.body.data.order.id;
    });

    it('should retrieve user orders', async () => {
      const response = await request(testApp)
        .get('/api/v1/orders/my-orders')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.orders)).toBe(true);
    });

    it('should retrieve specific order', async () => {
      const response = await request(testApp)
        .get(`/api/v1/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.order.id).toBe(testOrderId);
    });
  });

  describe('Payment Service', () => {
    it('should create payment intent', async () => {
      const response = await request(testApp)
        .post('/api/v1/payments/create-intent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          orderId: testOrderId,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.paymentIntent).toBeDefined();
      expect(response.body.data.paymentIntent.clientSecret).toBeDefined();
    });

    it('should retrieve payment methods', async () => {
      const response = await request(testApp)
        .get('/api/v1/payments/payment-methods')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.paymentMethods)).toBe(true);
    });
  });

  describe('Appointment Service', () => {
    it('should retrieve appointment types', async () => {
      const response = await request(testApp)
        .get('/api/v1/bookings/appointment-types')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.appointmentTypes)).toBe(true);
    });

    it('should retrieve available time slots', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateString = tomorrow.toISOString().split('T')[0];

      const response = await request(testApp)
        .get('/api/v1/availability/slots')
        .query({
          date: dateString,
          appointmentType: 'ONLINE',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.slots)).toBe(true);
    });

    it('should create booking', async () => {
      const consultant = await prisma.consultant.create({
        data: {
          firstName: 'Smoke',
          lastName: 'Consultant',
          email: 'smoke.consultant@lomashwood.com',
          phone: '+447700900503',
          specialization: 'KITCHEN',
          isActive: true,
        },
      });

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(15, 0, 0, 0);

      const timeSlot = await prisma.timeSlot.create({
        data: {
          consultantId: consultant.id,
          startTime: tomorrow,
          endTime: new Date(tomorrow.getTime() + 60 * 60 * 1000),
          isAvailable: true,
          appointmentType: 'ONLINE',
        },
      });

      const response = await request(testApp)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          appointmentType: 'ONLINE',
          isKitchen: true,
          isBedroom: false,
          customerDetails: {
            firstName: 'Smoke',
            lastName: 'Test',
            phone: '+447700900500',
            email: 'smoke.test@example.com',
            postcode: 'SW1A 1AA',
            address: '123 Smoke Street',
          },
          timeSlotId: timeSlot.id,
          consultantId: consultant.id,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.booking).toBeDefined();

      testBookingId = response.body.data.booking.id;
    });

    it('should retrieve user bookings', async () => {
      const response = await request(testApp)
        .get('/api/v1/bookings/my-bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.bookings)).toBe(true);
    });
  });

  describe('Showroom Service', () => {
    it('should retrieve all showrooms', async () => {
      const response = await request(testApp)
        .get('/api/v1/showrooms')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.showrooms)).toBe(true);
    });

    it('should search showrooms by location', async () => {
      const response = await request(testApp)
        .get('/api/v1/showrooms/search')
        .query({
          postcode: 'SW1A',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.showrooms)).toBe(true);
    });
  });

  describe('Content Service', () => {
    it('should retrieve blog posts', async () => {
      const response = await request(testApp)
        .get('/api/v1/blogs')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.blogs)).toBe(true);
    });

    it('should retrieve finance content', async () => {
      const response = await request(testApp)
        .get('/api/v1/finance')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should retrieve media wall content', async () => {
      const response = await request(testApp)
        .get('/api/v1/media-wall')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Customer Service', () => {
    it('should retrieve user profile', async () => {
      const response = await request(testApp)
        .get('/api/v1/customers/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.profile).toBeDefined();
    });

    it('should update user profile', async () => {
      const response = await request(testApp)
        .patch('/api/v1/customers/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'Updated',
          lastName: 'Name',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.profile.firstName).toBe('Updated');
    });

    it('should retrieve addresses', async () => {
      const response = await request(testApp)
        .get('/api/v1/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.addresses)).toBe(true);
    });

    it('should retrieve wishlist', async () => {
      const response = await request(testApp)
        .get('/api/v1/wishlist')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.items)).toBe(true);
    });

    it('should add product to wishlist', async () => {
      const response = await request(testApp)
        .post('/api/v1/wishlist/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProductId,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.item.productId).toBe(testProductId);
    });
  });

  describe('Notification Service', () => {
    it('should retrieve notification preferences', async () => {
      const response = await request(testApp)
        .get('/api/v1/notifications/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.preferences).toBeDefined();
    });

    it('should update notification preferences', async () => {
      const response = await request(testApp)
        .patch('/api/v1/notifications/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          emailNotifications: true,
          smsNotifications: false,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.preferences.emailNotifications).toBe(true);
    });

    it('should retrieve notification history', async () => {
      const response = await request(testApp)
        .get('/api/v1/notifications/history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.notifications)).toBe(true);
    });
  });

  describe('Forms and Requests', () => {
    it('should submit brochure request', async () => {
      const response = await request(testApp)
        .post('/api/v1/brochures')
        .send({
          name: 'Smoke Test',
          email: 'smoke.test@example.com',
          phone: '+447700900500',
          postcode: 'SW1A 1AA',
          address: '123 Smoke Street',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.request).toBeDefined();
    });

    it('should submit business inquiry', async () => {
      const response = await request(testApp)
        .post('/api/v1/business')
        .send({
          name: 'Smoke Business',
          email: 'business@example.com',
          phone: '+447700900504',
          businessType: 'PARTNERSHIP',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.inquiry).toBeDefined();
    });

    it('should submit contact form', async () => {
      const response = await request(testApp)
        .post('/api/v1/contact')
        .send({
          name: 'Smoke Contact',
          email: 'contact@example.com',
          phone: '+447700900505',
          subject: 'Test Inquiry',
          message: 'This is a smoke test message',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.contact).toBeDefined();
    });

    it('should subscribe to newsletter', async () => {
      const response = await request(testApp)
        .post('/api/v1/newsletter/subscribe')
        .send({
          email: 'newsletter@example.com',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.subscription).toBeDefined();
    });
  });

  describe('Admin Service', () => {
    it('should retrieve admin dashboard', async () => {
      const response = await request(testApp)
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.dashboard).toBeDefined();
    });

    it('should retrieve all orders (admin)', async () => {
      const response = await request(testApp)
        .get('/api/v1/admin/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.orders)).toBe(true);
    });

    it('should retrieve all bookings (admin)', async () => {
      const response = await request(testApp)
        .get('/api/v1/admin/appointments')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.appointments)).toBe(true);
    });

    it('should retrieve all users (admin)', async () => {
      const response = await request(testApp)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.users)).toBe(true);
    });

    it('should retrieve analytics (admin)', async () => {
      const response = await request(testApp)
        .get('/api/v1/admin/analytics/revenue')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.revenue).toBeDefined();
    });
  });

  describe('Search and Filtering', () => {
    it('should perform global search', async () => {
      const response = await request(testApp)
        .get('/api/v1/search')
        .query({
          q: 'kitchen',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.results).toBeDefined();
    });

    it('should filter products by price range', async () => {
      const response = await request(testApp)
        .get('/api/v1/products')
        .query({
          minPrice: 5000,
          maxPrice: 15000,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.products)).toBe(true);
    });

    it('should sort products', async () => {
      const response = await request(testApp)
        .get('/api/v1/products')
        .query({
          sortBy: 'price',
          order: 'asc',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.products)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for non-existent resources', async () => {
      const response = await request(testApp)
        .get('/api/v1/products/00000000-0000-0000-0000-000000000000')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should handle validation errors', async () => {
      const response = await request(testApp)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: '123',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle unauthorized access', async () => {
      const response = await request(testApp)
        .get('/api/v1/orders/my-orders')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should handle forbidden access', async () => {
      const response = await request(testApp)
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('Performance', () => {
    it('should respond to product listing within acceptable time', async () => {
      const startTime = Date.now();

      await request(testApp)
        .get('/api/v1/products')
        .expect(200);

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(1000);
    });

    it('should handle concurrent requests', async () => {
      const requests = Array(10)
        .fill(null)
        .map(() =>
          request(testApp)
            .get('/api/v1/products')
            .expect(200)
        );

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on public endpoints', async () => {
      const requests = 50;
      const responses = [];

      for (let i = 0; i < requests; i++) {
        const response = await request(testApp).get('/api/v1/products');
        responses.push(response);
      }

      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('CORS', () => {
    it('should include CORS headers', async () => {
      const response = await request(testApp)
        .get('/api/v1/products')
        .set('Origin', 'https://lomashwood.com')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should handle preflight requests', async () => {
      const response = await request(testApp)
        .options('/api/v1/products')
        .set('Origin', 'https://lomashwood.com')
        .set('Access-Control-Request-Method', 'GET')
        .expect(204);

      expect(response.headers['access-control-allow-methods']).toBeDefined();
    });
  });

  describe('Pagination', () => {
    it('should paginate product results', async () => {
      const response = await request(testApp)
        .get('/api/v1/products')
        .query({
          page: 1,
          limit: 10,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: expect.any(Number),
        totalPages: expect.any(Number),
      });
    });

    it('should paginate order results', async () => {
      const response = await request(testApp)
        .get('/api/v1/orders/my-orders')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          page: 1,
          limit: 5,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination).toBeDefined();
    });
  });

  describe('Caching', () => {
    it('should cache product listings', async () => {
      const firstResponse = await request(testApp)
        .get('/api/v1/products')
        .expect(200);

      const secondResponse = await request(testApp)
        .get('/api/v1/products')
        .expect(200);

      expect(firstResponse.body).toEqual(secondResponse.body);
      expect(secondResponse.headers['x-cache']).toBeDefined();
    });
  });

  describe('API Versioning', () => {
    it('should support API version in URL', async () => {
      const response = await request(testApp)
        .get('/api/v1/products')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return version in response headers', async () => {
      const response = await request(testApp)
        .get('/api/v1/products')
        .expect(200);

      expect(response.headers['x-api-version']).toBe('1.0.0');
    });
  });

  describe('Request Logging', () => {
    it('should include request ID in response', async () => {
      const response = await request(testApp)
        .get('/api/v1/products')
        .expect(200);

      expect(response.headers['x-request-id']).toBeDefined();
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(testApp)
        .get('/api/v1/products')
        .expect(200);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['strict-transport-security']).toBeDefined();
    });
  });

  describe('Data Consistency', () => {
    it('should maintain data consistency across services', async () => {
      const orderResponse = await request(testApp)
        .get(`/api/v1/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const order = orderResponse.body.data.order;

      const productResponse = await request(testApp)
        .get(`/api/v1/products/${testProductId}`)
        .expect(200);

      const product = productResponse.body.data.product;

      const orderItem = order.items[0];
      expect(orderItem.productId).toBe(product.id);
    });
  });

  describe('Graceful Degradation', () => {
    it('should handle Redis unavailability gracefully', async () => {
      await redis.disconnect();

      const response = await request(testApp)
        .get('/api/v1/products')
        .expect(200);

      expect(response.body.success).toBe(true);

      await redis.connect();
    });
  });

  describe('System Metrics', () => {
    it('should expose metrics endpoint', async () => {
      const response = await request(testApp)
        .get('/metrics')
        .expect(200);

      expect(response.text).toContain('http_request_duration');
    });
  });
});