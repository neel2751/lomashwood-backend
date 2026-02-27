import request from 'supertest';
import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { app } from '../../src/app';
import { prisma } from '../../src/infrastructure/db/prisma.client';
import { redis } from '../../src/infrastructure/cache/redis.client';

describe('Admin Flow E2E Tests', () => {
  let testApp: Express;
  let adminToken: string;
  let adminUserId: string;
  let userToken: string;
  let normalUserId: string;
  let testProductId: string;
  let testCategoryId: string;
  let testColourId: string;
  let testOrderId: string;
  let testSaleId: string;
  let testShowroomId: string;
  let testBlogId: string;

  beforeAll(async () => {
    testApp = app;
    await prisma.$connect();
    await redis.connect();

    const adminRegister = await request(testApp)
      .post('/api/v1/auth/register')
      .send({
        email: 'admin@lomashwood.com',
        password: 'AdminSecure123!',
        firstName: 'Admin',
        lastName: 'User',
        phone: '+447700900300',
        role: 'ADMIN',
      });

    adminUserId = adminRegister.body.data.user.id;

    const adminLogin = await request(testApp)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@lomashwood.com',
        password: 'AdminSecure123!',
      });

    adminToken = adminLogin.body.data.accessToken;

    const userRegister = await request(testApp)
      .post('/api/v1/auth/register')
      .send({
        email: 'normal.user@example.com',
        password: 'UserSecure123!',
        firstName: 'Normal',
        lastName: 'User',
        phone: '+447700900301',
      });

    normalUserId = userRegister.body.data.user.id;

    const userLogin = await request(testApp)
      .post('/api/v1/auth/login')
      .send({
        email: 'normal.user@example.com',
        password: 'UserSecure123!',
      });

    userToken = userLogin.body.data.accessToken;
  });

  afterAll(async () => {
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.colour.deleteMany({});
    await prisma.sale.deleteMany({});
    await prisma.showroom.deleteMany({});
    await prisma.blog.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        id: { in: [adminUserId, normalUserId] },
      },
    });

    await prisma.$disconnect();
    await redis.disconnect();
  });

  describe('Admin Authentication and Authorization', () => {
    it('should verify admin has required permissions', async () => {
      const response = await request(testApp)
        .get('/api/v1/admin/permissions')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.permissions).toContain('MANAGE_PRODUCTS');
      expect(response.body.data.permissions).toContain('MANAGE_ORDERS');
      expect(response.body.data.permissions).toContain('MANAGE_USERS');
      expect(response.body.data.permissions).toContain('VIEW_ANALYTICS');
    });

    it('should deny access to normal users for admin routes', async () => {
      const response = await request(testApp)
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should require authentication for admin routes', async () => {
      const response = await request(testApp)
        .get('/api/v1/admin/dashboard')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('Admin Dashboard', () => {
    it('should retrieve admin dashboard statistics', async () => {
      const response = await request(testApp)
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.dashboard).toMatchObject({
        totalOrders: expect.any(Number),
        totalRevenue: expect.any(Number),
        totalCustomers: expect.any(Number),
        pendingOrders: expect.any(Number),
        totalProducts: expect.any(Number),
        lowStockProducts: expect.any(Number),
        activeAppointments: expect.any(Number),
        recentOrders: expect.any(Array),
      });
    });

    it('should retrieve dashboard statistics for date range', async () => {
      const response = await request(testApp)
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          startDate: '2026-01-01',
          endDate: '2026-12-31',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.dashboard).toBeDefined();
    });

    it('should retrieve sales trends', async () => {
      const response = await request(testApp)
        .get('/api/v1/admin/analytics/sales-trends')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          period: 'month',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.trends)).toBe(true);
    });

    it('should retrieve top performing products', async () => {
      const response = await request(testApp)
        .get('/api/v1/admin/analytics/top-products')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          limit: 10,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.products)).toBe(true);
    });
  });

  describe('Product Management', () => {
    it('should create new category', async () => {
      const response = await request(testApp)
        .post('/api/v1/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Contemporary Kitchens',
          slug: 'contemporary-kitchens',
          description: 'Modern contemporary kitchen designs',
          type: 'KITCHEN',
          isActive: true,
          sortOrder: 1,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.category).toMatchObject({
        name: 'Contemporary Kitchens',
        slug: 'contemporary-kitchens',
        type: 'KITCHEN',
      });

      testCategoryId = response.body.data.category.id;
    });

    it('should update category', async () => {
      const response = await request(testApp)
        .patch(`/api/v1/admin/categories/${testCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          description: 'Updated contemporary kitchen designs',
          sortOrder: 2,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.category.description).toBe('Updated contemporary kitchen designs');
      expect(response.body.data.category.sortOrder).toBe(2);
    });

    it('should create new colour', async () => {
      const response = await request(testApp)
        .post('/api/v1/admin/colours')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Midnight Blue',
          slug: 'midnight-blue',
          hexCode: '#191970',
          isActive: true,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.colour).toMatchObject({
        name: 'Midnight Blue',
        hexCode: '#191970',
      });

      testColourId = response.body.data.colour.id;
    });

    it('should create new product', async () => {
      const response = await request(testApp)
        .post('/api/v1/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Elegance White Kitchen',
          slug: 'elegance-white-kitchen',
          description: 'Elegant white kitchen with marble countertops',
          categoryId: testCategoryId,
          rangeName: 'Elegance Collection',
          basePrice: 12000.00,
          images: JSON.stringify([
            'https://example.com/elegance-1.jpg',
            'https://example.com/elegance-2.jpg',
          ]),
          isActive: true,
          isFeatured: true,
          stockStatus: 'IN_STOCK',
          sku: 'ELE-WHT-001',
          colourIds: [testColourId],
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.product).toMatchObject({
        title: 'Elegance White Kitchen',
        basePrice: 12000.00,
        stockStatus: 'IN_STOCK',
      });

      testProductId = response.body.data.product.id;
    });

    it('should update product', async () => {
      const response = await request(testApp)
        .patch(`/api/v1/admin/products/${testProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          basePrice: 13000.00,
          isFeatured: false,
          stockStatus: 'LOW_STOCK',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.product.basePrice).toBe(13000.00);
      expect(response.body.data.product.isFeatured).toBe(false);
      expect(response.body.data.product.stockStatus).toBe('LOW_STOCK');
    });

    it('should bulk update products', async () => {
      const response = await request(testApp)
        .patch('/api/v1/admin/products/bulk-update')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          productIds: [testProductId],
          updates: {
            isActive: true,
            isFeatured: true,
          },
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.updated).toBe(1);
    });

    it('should delete product', async () => {
      const tempProduct = await prisma.product.create({
        data: {
          title: 'Temp Product',
          slug: 'temp-product',
          description: 'Temporary product for deletion',
          categoryId: testCategoryId,
          basePrice: 5000.00,
          isActive: true,
          stockStatus: 'IN_STOCK',
        },
      });

      const response = await request(testApp)
        .delete(`/api/v1/admin/products/${tempProduct.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      const deleted = await prisma.product.findUnique({
        where: { id: tempProduct.id },
      });

      expect(deleted).toBeNull();
    });

    it('should retrieve all products with filters', async () => {
      const response = await request(testApp)
        .get('/api/v1/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          categoryId: testCategoryId,
          stockStatus: 'LOW_STOCK',
          page: 1,
          limit: 10,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.products)).toBe(true);
    });

    it('should search products by keyword', async () => {
      const response = await request(testApp)
        .get('/api/v1/admin/products/search')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          q: 'Elegance',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            title: expect.stringContaining('Elegance'),
          }),
        ])
      );
    });

    it('should export products to CSV', async () => {
      const response = await request(testApp)
        .get('/api/v1/admin/products/export')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          format: 'csv',
        })
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain('attachment');
    });
  });

  describe('Order Management', () => {
    beforeAll(async () => {
      const address = await prisma.address.create({
        data: {
          userId: normalUserId,
          type: 'SHIPPING',
          firstName: 'Normal',
          lastName: 'User',
          addressLine1: '123 Test Street',
          city: 'London',
          postcode: 'SW1A 1AA',
          country: 'United Kingdom',
          phone: '+447700900301',
          isDefault: true,
        },
      });

      const order = await prisma.order.create({
        data: {
          userId: normalUserId,
          orderNumber: `LW-${Date.now()}`,
          status: 'PENDING',
          paymentStatus: 'PENDING',
          shippingAddressId: address.id,
          billingAddressId: address.id,
          subtotal: 12000.00,
          taxAmount: 2400.00,
          shippingCost: 0.00,
          totalAmount: 14400.00,
          items: {
            create: [
              {
                productId: testProductId,
                quantity: 1,
                unitPrice: 12000.00,
                totalPrice: 12000.00,
              },
            ],
          },
        },
      });

      testOrderId = order.id;
    });

    it('should retrieve all orders', async () => {
      const response = await request(testApp)
        .get('/api/v1/admin/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          page: 1,
          limit: 10,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.orders)).toBe(true);
    });

    it('should filter orders by status', async () => {
      const response = await request(testApp)
        .get('/api/v1/admin/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          status: 'PENDING',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(
        response.body.data.orders.every((o: any) => o.status === 'PENDING')
      ).toBe(true);
    });

    it('should filter orders by payment status', async () => {
      const response = await request(testApp)
        .get('/api/v1/admin/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          paymentStatus: 'PENDING',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(
        response.body.data.orders.every((o: any) => o.paymentStatus === 'PENDING')
      ).toBe(true);
    });

    it('should retrieve specific order details', async () => {
      const response = await request(testApp)
        .get(`/api/v1/admin/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.order).toMatchObject({
        id: testOrderId,
        status: 'PENDING',
        items: expect.any(Array),
        user: expect.objectContaining({
          email: 'normal.user@example.com',
        }),
      });
    });

    it('should update order status', async () => {
      const response = await request(testApp)
        .patch(`/api/v1/admin/orders/${testOrderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'PROCESSING',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.order.status).toBe('PROCESSING');
    });

    it('should add tracking information', async () => {
      const response = await request(testApp)
        .patch(`/api/v1/admin/orders/${testOrderId}/tracking`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          trackingNumber: 'TRK123456789',
          carrier: 'Royal Mail',
          trackingUrl: 'https://track.royalmail.com/TRK123456789',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.order.trackingNumber).toBe('TRK123456789');
    });

    it('should add internal notes to order', async () => {
      const response = await request(testApp)
        .post(`/api/v1/admin/orders/${testOrderId}/notes`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          note: 'Customer requested express delivery',
          isInternal: true,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.note.content).toBe('Customer requested express delivery');
    });

    it('should export orders to Excel', async () => {
      const response = await request(testApp)
        .get('/api/v1/admin/orders/export')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          format: 'xlsx',
          startDate: '2026-01-01',
          endDate: '2026-12-31',
        })
        .expect(200);

      expect(response.headers['content-type']).toContain('application/vnd.openxmlformats');
    });

    it('should cancel order', async () => {
      const response = await request(testApp)
        .patch(`/api/v1/admin/orders/${testOrderId}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          cancellationReason: 'Admin cancellation - customer request',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.order.status).toBe('CANCELLED');
    });
  });

  describe('User Management', () => {
    it('should retrieve all users', async () => {
      const response = await request(testApp)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          page: 1,
          limit: 10,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.users)).toBe(true);
    });

    it('should search users by email', async () => {
      const response = await request(testApp)
        .get('/api/v1/admin/users/search')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          q: 'normal.user@example.com',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            email: 'normal.user@example.com',
          }),
        ])
      );
    });

    it('should retrieve user details', async () => {
      const response = await request(testApp)
        .get(`/api/v1/admin/users/${normalUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toMatchObject({
        id: normalUserId,
        email: 'normal.user@example.com',
        firstName: 'Normal',
        lastName: 'User',
      });
    });

    it('should update user role', async () => {
      const response = await request(testApp)
        .patch(`/api/v1/admin/users/${normalUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: 'MANAGER',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe('MANAGER');
    });

    it('should deactivate user account', async () => {
      const response = await request(testApp)
        .patch(`/api/v1/admin/users/${normalUserId}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Suspicious activity',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.isActive).toBe(false);
    });

    it('should reactivate user account', async () => {
      const response = await request(testApp)
        .patch(`/api/v1/admin/users/${normalUserId}/reactivate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.isActive).toBe(true);
    });

    it('should retrieve user activity logs', async () => {
      const response = await request(testApp)
        .get(`/api/v1/admin/users/${normalUserId}/activity`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.activities)).toBe(true);
    });

    it('should delete user account', async () => {
      const tempUser = await prisma.user.create({
        data: {
          email: 'temp.delete@example.com',
          password: 'TempPass123!',
          firstName: 'Temp',
          lastName: 'Delete',
        },
      });

      const response = await request(testApp)
        .delete(`/api/v1/admin/users/${tempUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      const deleted = await prisma.user.findUnique({
        where: { id: tempUser.id },
      });

      expect(deleted).toBeNull();
    });
  });

  describe('Sales and Promotions Management', () => {
    it('should create new sale', async () => {
      const response = await request(testApp)
        .post('/api/v1/admin/sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Summer Sale 2026',
          slug: 'summer-sale-2026',
          description: 'Amazing summer discounts on all kitchens',
          image: 'https://example.com/summer-sale.jpg',
          discountType: 'PERCENTAGE',
          discountValue: 15.00,
          startDate: '2026-06-01',
          endDate: '2026-08-31',
          isActive: true,
          terms: 'Terms and conditions apply',
          productIds: [testProductId],
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sale).toMatchObject({
        title: 'Summer Sale 2026',
        discountType: 'PERCENTAGE',
        discountValue: 15.00,
      });

      testSaleId = response.body.data.sale.id;
    });

    it('should update sale', async () => {
      const response = await request(testApp)
        .patch(`/api/v1/admin/sales/${testSaleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          discountValue: 20.00,
          isActive: false,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sale.discountValue).toBe(20.00);
      expect(response.body.data.sale.isActive).toBe(false);
    });

    it('should retrieve all sales', async () => {
      const response = await request(testApp)
        .get('/api/v1/admin/sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.sales)).toBe(true);
    });

    it('should delete sale', async () => {
      const response = await request(testApp)
        .delete(`/api/v1/admin/sales/${testSaleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should create coupon code', async () => {
      const response = await request(testApp)
        .post('/api/v1/admin/coupons')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'WELCOME10',
          description: 'Welcome discount for new customers',
          discountType: 'PERCENTAGE',
          discountValue: 10.00,
          minimumOrderAmount: 5000.00,
          validFrom: '2026-01-01',
          validUntil: '2026-12-31',
          usageLimit: 100,
          isActive: true,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.coupon.code).toBe('WELCOME10');
    });
  });

  describe('Showroom Management', () => {
    it('should create new showroom', async () => {
      const response = await request(testApp)
        .post('/api/v1/admin/showrooms')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Lomash Wood Manchester',
          address: '45 Market Street',
          city: 'Manchester',
          county: 'Greater Manchester',
          postcode: 'M1 1WR',
          email: 'manchester@lomashwood.com',
          phone: '+441612345678',
          openingHours: JSON.stringify({
            monday: '09:00-18:00',
            tuesday: '09:00-18:00',
            wednesday: '09:00-18:00',
            thursday: '09:00-18:00',
            friday: '09:00-18:00',
            saturday: '10:00-17:00',
            sunday: 'Closed',
          }),
          mapLink: 'https://maps.google.com/?q=45+Market+Street+Manchester',
          image: 'https://example.com/manchester-showroom.jpg',
          isActive: true,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.showroom).toMatchObject({
        name: 'Lomash Wood Manchester',
        city: 'Manchester',
        postcode: 'M1 1WR',
      });

      testShowroomId = response.body.data.showroom.id;
    });

    it('should update showroom', async () => {
      const response = await request(testApp)
        .patch(`/api/v1/admin/showrooms/${testShowroomId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          phone: '+441612345679',
          email: 'manchester.new@lomashwood.com',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.showroom.phone).toBe('+441612345679');
      expect(response.body.data.showroom.email).toBe('manchester.new@lomashwood.com');
    });

    it('should retrieve all showrooms', async () => {
      const response = await request(testApp)
        .get('/api/v1/admin/showrooms')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.showrooms)).toBe(true);
    });

    it('should delete showroom', async () => {
      const response = await request(testApp)
        .delete(`/api/v1/admin/showrooms/${testShowroomId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Content Management', () => {
    it('should create blog post', async () => {
      const response = await request(testApp)
        .post('/api/v1/admin/blogs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Top 10 Kitchen Design Trends 2026',
          slug: 'top-10-kitchen-design-trends-2026',
          excerpt: 'Discover the latest kitchen design trends',
          content: 'Full blog post content here...',
          featuredImage: 'https://example.com/blog-featured.jpg',
          author: adminUserId,
          isPublished: true,
          publishedAt: new Date().toISOString(),
          seoTitle: 'Top 10 Kitchen Design Trends 2026',
          seoDescription: 'Latest kitchen design trends for 2026',
          seoKeywords: 'kitchen, design, trends, 2026',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.blog).toMatchObject({
        title: 'Top 10 Kitchen Design Trends 2026',
        slug: 'top-10-kitchen-design-trends-2026',
        isPublished: true,
      });

      testBlogId = response.body.data.blog.id;
    });

    it('should update blog post', async () => {
      const response = await request(testApp)
        .patch(`/api/v1/admin/blogs/${testBlogId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Top 15 Kitchen Design Trends 2026',
          content: 'Updated blog post content...',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.blog.title).toBe('Top 15 Kitchen Design Trends 2026');
    });

    it('should unpublish blog post', async () => {
      const response = await request(testApp)
        .patch(`/api/v1/admin/blogs/${testBlogId}/unpublish`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.blog.isPublished).toBe(false);
    });

    it('should delete blog post', async () => {
      const response = await request(testApp)
        .delete(`/api/v1/admin/blogs/${testBlogId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should manage media wall content', async () => {
      const response = await request(testApp)
        .post('/api/v1/admin/media-wall')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Luxury Media Wall Installation',
          description: 'Custom media wall with ambient lighting',
          images: JSON.stringify([
            'https://example.com/media-wall-1.jpg',
            'https://example.com/media-wall-2.jpg',
          ]),
          backgroundImage: 'https://example.com/media-wall-bg.jpg',
          isActive: true,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.mediaWall.title).toBe('Luxury Media Wall Installation');
    });

    it('should manage finance content', async () => {
      const response = await request(testApp)
        .post('/api/v1/admin/finance')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Flexible Payment Options',
          description: '0% APR finance available',
          content: 'Detailed finance options content...',
          isActive: true,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.finance.title).toBe('Flexible Payment Options');
    });
  });

  describe('Appointment Management', () => {
    it('should retrieve all appointments', async () => {
      const response = await request(testApp)
        .get('/api/v1/admin/appointments')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          page: 1,
          limit: 10,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.appointments)).toBe(true);
    });

    it('should filter appointments by type', async () => {
      const response = await request(testApp)
        .get('/api/v1/admin/appointments')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          appointmentType: 'SHOWROOM',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(
        response.body.data.appointments.every(
          (a: any) => a.appointmentType === 'SHOWROOM'
        )
      ).toBe(true);
    });

    it('should filter appointments by date range', async () => {
      const response = await request(testApp)
        .get('/api/v1/admin/appointments')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          startDate: '2026-01-01',
          endDate: '2026-12-31',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.appointments)).toBe(true);
    });

    it('should export appointments to CSV', async () => {
      const response = await request(testApp)
        .get('/api/v1/admin/appointments/export')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          format: 'csv',
        })
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
    });
  });

  describe('Analytics and Reports', () => {
    it('should retrieve revenue analytics', async () => {
      const response = await request(testApp)
        .get('/api/v1/admin/analytics/revenue')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          startDate: '2026-01-01',
          endDate: '2026-12-31',
          groupBy: 'month',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.revenue)).toBe(true);
    });

    it('should retrieve customer analytics', async () => {
      const response = await request(testApp)
        .get('/api/v1/admin/analytics/customers')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.analytics).toMatchObject({
        totalCustomers: expect.any(Number),
        newCustomers: expect.any(Number),
        returningCustomers: expect.any(Number),
        customerLifetimeValue: expect.any(Number),
      });
    });

    it('should retrieve product performance', async () => {
      const response = await request(testApp)
        .get('/api/v1/admin/analytics/product-performance')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.products)).toBe(true);
    });

    it('should generate custom report', async () => {
      const response = await request(testApp)
        .post('/api/v1/admin/reports/generate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reportType: 'SALES_SUMMARY',
          startDate: '2026-01-01',
          endDate: '2026-12-31',
          groupBy: 'month',
          includeCharts: true,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.report).toBeDefined();
    });
  });

  describe('System Settings', () => {
    it('should retrieve system settings', async () => {
      const response = await request(testApp)
        .get('/api/v1/admin/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.settings).toBeDefined();
    });

    it('should update system settings', async () => {
      const response = await request(testApp)
        .patch('/api/v1/admin/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          siteName: 'Lomash Wood Updated',
          maintenanceMode: false,
          allowRegistration: true,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.settings.siteName).toBe('Lomash Wood Updated');
    });

    it('should retrieve audit logs', async () => {
      const response = await request(testApp)
        .get('/api/v1/admin/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          page: 1,
          limit: 50,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.logs)).toBe(true);
    });

    it('should filter audit logs by action', async () => {
      const response = await request(testApp)
        .get('/api/v1/admin/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          action: 'UPDATE_PRODUCT',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(
        response.body.data.logs.every((l: any) => l.action === 'UPDATE_PRODUCT')
      ).toBe(true);
    });
  });

  describe('Bulk Operations', () => {
    it('should bulk delete products', async () => {
      const product1 = await prisma.product.create({
        data: {
          title: 'Bulk Delete 1',
          slug: 'bulk-delete-1',
          description: 'Test',
          categoryId: testCategoryId,
          basePrice: 1000.00,
          isActive: true,
          stockStatus: 'IN_STOCK',
        },
      });

      const product2 = await prisma.product.create({
        data: {
          title: 'Bulk Delete 2',
          slug: 'bulk-delete-2',
          description: 'Test',
          categoryId: testCategoryId,
          basePrice: 1000.00,
          isActive: true,
          stockStatus: 'IN_STOCK',
        },
      });

      const response = await request(testApp)
        .post('/api/v1/admin/products/bulk-delete')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          productIds: [product1.id, product2.id],
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.deleted).toBe(2);
    });

    it('should bulk update order status', async () => {
      const response = await request(testApp)
        .patch('/api/v1/admin/orders/bulk-update-status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          orderIds: [testOrderId],
          status: 'SHIPPED',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.updated).toBeGreaterThan(0);
    });
  });
});