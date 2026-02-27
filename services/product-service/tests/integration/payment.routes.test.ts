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
  createTestPackage,
  clearDatabase 
} from '../fixtures';

describe('Payment Routes Integration Tests - Product Service', () => {
  let app: Application;
  let prisma: PrismaClient;
  let authToken: string;
  let adminToken: string;
  let kitchenProductId: string;
  let bedroomProductId: string;
  let testUserId: string;
  let testSaleId: string;
  let testPackageId: string;

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
      stock: 10,
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
    
    // Create test package
    const packageData = await createTestPackage(prisma, {
      title: 'Complete Kitchen Package',
      description: 'Everything you need',
      price: 8999.99,
      productIds: [kitchenProductId]
    });
    testPackageId = packageData.id;
  });

  afterAll(async () => {
    await clearDatabase(prisma);
    await prisma.$disconnect();
  });

  describe('GET /api/v1/products/:id/payment-details', () => {
    it('should get product payment details including pricing', async () => {
      const response = await request(app)
        .get(`/api/v1/products/${kitchenProductId}/payment-details`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('productId', kitchenProductId);
      expect(response.body.data).toHaveProperty('title', 'Luna White Kitchen');
      expect(response.body.data).toHaveProperty('basePrice', 5999.99);
      expect(response.body.data).toHaveProperty('currency', 'GBP');
      expect(response.body.data).toHaveProperty('taxRate');
      expect(response.body.data).toHaveProperty('availableForPurchase', true);
    });

    it('should include sale pricing if active', async () => {
      const response = await request(app)
        .get(`/api/v1/products/${kitchenProductId}/payment-details`)
        .expect(200);

      expect(response.body.data).toHaveProperty('salePrice');
      expect(response.body.data).toHaveProperty('originalPrice', 5999.99);
      expect(response.body.data).toHaveProperty('discountPercentage', 20);
      expect(response.body.data.salePrice).toBeLessThan(response.body.data.originalPrice);
    });

    it('should include payment options', async () => {
      const response = await request(app)
        .get(`/api/v1/products/${kitchenProductId}/payment-details`)
        .expect(200);

      expect(response.body.data).toHaveProperty('paymentOptions');
      expect(response.body.data.paymentOptions).toHaveProperty('card', true);
      expect(response.body.data.paymentOptions).toHaveProperty('finance');
      expect(response.body.data.paymentOptions).toHaveProperty('bankTransfer');
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/v1/products/${fakeId}/payment-details`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('Product not found');
    });
  });

  describe('POST /api/v1/products/calculate-payment', () => {
    it('should calculate payment amount for single product', async () => {
      const response = await request(app)
        .post('/api/v1/products/calculate-payment')
        .send({
          items: [
            {
              productId: kitchenProductId,
              quantity: 1,
              colourId: (await prisma.colour.findFirst()).id
            }
          ]
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('subtotal');
      expect(response.body.data).toHaveProperty('tax');
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('currency', 'GBP');
      expect(response.body.data).toHaveProperty('items');
      expect(response.body.data.items).toBeInstanceOf(Array);
    });

    it('should calculate payment for multiple products', async () => {
      const colourId = (await prisma.colour.findFirst()).id;
      
      const response = await request(app)
        .post('/api/v1/products/calculate-payment')
        .send({
          items: [
            {
              productId: kitchenProductId,
              quantity: 1,
              colourId
            },
            {
              productId: bedroomProductId,
              quantity: 2,
              colourId
            }
          ]
        })
        .expect(200);

      expect(response.body.data.items).toHaveLength(2);
      expect(response.body.data.subtotal).toBeGreaterThan(0);
    });

    it('should apply sale discounts in calculation', async () => {
      const colourId = (await prisma.colour.findFirst()).id;
      
      const response = await request(app)
        .post('/api/v1/products/calculate-payment')
        .send({
          items: [
            {
              productId: kitchenProductId,
              quantity: 1,
              colourId
            }
          ]
        })
        .expect(200);

      expect(response.body.data).toHaveProperty('discounts');
      expect(response.body.data.discounts).toBeInstanceOf(Array);
      expect(response.body.data.discounts.length).toBeGreaterThan(0);
      expect(response.body.data.discounts[0]).toHaveProperty('type', 'SALE');
      expect(response.body.data.discounts[0]).toHaveProperty('amount');
    });

    it('should apply coupon code if provided', async () => {
      const colourId = (await prisma.colour.findFirst()).id;
      
      const response = await request(app)
        .post('/api/v1/products/calculate-payment')
        .send({
          items: [
            {
              productId: kitchenProductId,
              quantity: 1,
              colourId
            }
          ],
          couponCode: 'WELCOME10'
        })
        .expect(200);

      expect(response.body.data).toHaveProperty('couponApplied');
      if (response.body.data.couponApplied) {
        expect(response.body.data.discounts.some(d => d.type === 'COUPON')).toBe(true);
      }
    });

    it('should include delivery charges', async () => {
      const colourId = (await prisma.colour.findFirst()).id;
      
      const response = await request(app)
        .post('/api/v1/products/calculate-payment')
        .send({
          items: [
            {
              productId: kitchenProductId,
              quantity: 1,
              colourId
            }
          ],
          deliveryPostcode: 'SW1A 1AA'
        })
        .expect(200);

      expect(response.body.data).toHaveProperty('delivery');
      expect(response.body.data.delivery).toHaveProperty('cost');
      expect(response.body.data.delivery).toHaveProperty('estimatedDays');
    });

    it('should return 400 for invalid items', async () => {
      const response = await request(app)
        .post('/api/v1/products/calculate-payment')
        .send({
          items: []
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('at least one item');
    });

    it('should return 400 for invalid quantity', async () => {
      const colourId = (await prisma.colour.findFirst()).id;
      
      const response = await request(app)
        .post('/api/v1/products/calculate-payment')
        .send({
          items: [
            {
              productId: kitchenProductId,
              quantity: -1,
              colourId
            }
          ]
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('quantity');
    });
  });

  describe('POST /api/v1/products/validate-payment-products', () => {
    it('should validate products for payment processing', async () => {
      const colourId = (await prisma.colour.findFirst()).id;
      
      const response = await request(app)
        .post('/api/v1/products/validate-payment-products')
        .send({
          items: [
            {
              productId: kitchenProductId,
              quantity: 1,
              colourId
            }
          ]
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('valid', true);
      expect(response.body.data).toHaveProperty('items');
      expect(response.body.data.items[0]).toHaveProperty('valid', true);
      expect(response.body.data.items[0]).toHaveProperty('available', true);
    });

    it('should detect out of stock products', async () => {
      const colourId = (await prisma.colour.findFirst()).id;
      
      const response = await request(app)
        .post('/api/v1/products/validate-payment-products')
        .send({
          items: [
            {
              productId: kitchenProductId,
              quantity: 100, // More than available stock
              colourId
            }
          ]
        })
        .expect(200);

      expect(response.body.data).toHaveProperty('valid', false);
      expect(response.body.data.items[0]).toHaveProperty('valid', false);
      expect(response.body.data.items[0]).toHaveProperty('reason', 'INSUFFICIENT_STOCK');
      expect(response.body.data.items[0]).toHaveProperty('availableStock');
    });

    it('should detect discontinued products', async () => {
      // Mark product as discontinued
      await prisma.product.update({
        where: { id: kitchenProductId },
        data: { status: 'DISCONTINUED' }
      });

      const colourId = (await prisma.colour.findFirst()).id;
      
      const response = await request(app)
        .post('/api/v1/products/validate-payment-products')
        .send({
          items: [
            {
              productId: kitchenProductId,
              quantity: 1,
              colourId
            }
          ]
        })
        .expect(200);

      expect(response.body.data).toHaveProperty('valid', false);
      expect(response.body.data.items[0]).toHaveProperty('reason', 'PRODUCT_DISCONTINUED');

      // Restore product status
      await prisma.product.update({
        where: { id: kitchenProductId },
        data: { status: 'ACTIVE' }
      });
    });

    it('should validate colour availability for product', async () => {
      const invalidColourId = '00000000-0000-0000-0000-000000000000';
      
      const response = await request(app)
        .post('/api/v1/products/validate-payment-products')
        .send({
          items: [
            {
              productId: kitchenProductId,
              quantity: 1,
              colourId: invalidColourId
            }
          ]
        })
        .expect(200);

      expect(response.body.data).toHaveProperty('valid', false);
      expect(response.body.data.items[0]).toHaveProperty('reason', 'INVALID_COLOUR');
    });
  });

  describe('POST /api/v1/products/prepare-payment-intent', () => {
    it('should prepare payment intent data for Stripe', async () => {
      const colourId = (await prisma.colour.findFirst()).id;
      
      const response = await request(app)
        .post('/api/v1/products/prepare-payment-intent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [
            {
              productId: kitchenProductId,
              quantity: 1,
              colourId
            }
          ]
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('amount');
      expect(response.body.data).toHaveProperty('currency', 'GBP');
      expect(response.body.data).toHaveProperty('metadata');
      expect(response.body.data.metadata).toHaveProperty('userId', testUserId);
      expect(response.body.data.metadata).toHaveProperty('items');
    });

    it('should include product metadata in payment intent', async () => {
      const colourId = (await prisma.colour.findFirst()).id;
      
      const response = await request(app)
        .post('/api/v1/products/prepare-payment-intent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [
            {
              productId: kitchenProductId,
              quantity: 1,
              colourId
            }
          ]
        })
        .expect(200);

      expect(response.body.data.metadata.items).toBeDefined();
      const parsedItems = JSON.parse(response.body.data.metadata.items);
      expect(parsedItems).toBeInstanceOf(Array);
      expect(parsedItems[0]).toHaveProperty('productId', kitchenProductId);
      expect(parsedItems[0]).toHaveProperty('productTitle', 'Luna White Kitchen');
      expect(parsedItems[0]).toHaveProperty('quantity', 1);
    });

    it('should return 401 without authentication', async () => {
      const colourId = (await prisma.colour.findFirst()).id;
      
      const response = await request(app)
        .post('/api/v1/products/prepare-payment-intent')
        .send({
          items: [
            {
              productId: kitchenProductId,
              quantity: 1,
              colourId
            }
          ]
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should validate products before preparing payment intent', async () => {
      const colourId = (await prisma.colour.findFirst()).id;
      
      const response = await request(app)
        .post('/api/v1/products/prepare-payment-intent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [
            {
              productId: kitchenProductId,
              quantity: 1000,
              colourId
            }
          ]
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('stock');
    });
  });

  describe('GET /api/v1/products/packages/:id/payment-details', () => {
    it('should get package payment details', async () => {
      const response = await request(app)
        .get(`/api/v1/products/packages/${testPackageId}/payment-details`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('packageId', testPackageId);
      expect(response.body.data).toHaveProperty('title', 'Complete Kitchen Package');
      expect(response.body.data).toHaveProperty('price', 8999.99);
      expect(response.body.data).toHaveProperty('includedProducts');
      expect(response.body.data.includedProducts).toBeInstanceOf(Array);
    });

    it('should include individual product pricing in package', async () => {
      const response = await request(app)
        .get(`/api/v1/products/packages/${testPackageId}/payment-details`)
        .expect(200);

      expect(response.body.data).toHaveProperty('breakdown');
      expect(response.body.data.breakdown).toHaveProperty('totalProductValue');
      expect(response.body.data.breakdown).toHaveProperty('packagePrice', 8999.99);
      expect(response.body.data.breakdown).toHaveProperty('savings');
    });

    it('should return 404 for non-existent package', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/v1/products/packages/${fakeId}/payment-details`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/v1/products/apply-finance', () => {
    it('should calculate finance options for product', async () => {
      const response = await request(app)
        .post('/api/v1/products/apply-finance')
        .send({
          productId: kitchenProductId,
          quantity: 1,
          depositPercentage: 10,
          term: 36 // months
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('productPrice');
      expect(response.body.data).toHaveProperty('deposit');
      expect(response.body.data).toHaveProperty('amountFinanced');
      expect(response.body.data).toHaveProperty('monthlyPayment');
      expect(response.body.data).toHaveProperty('totalRepayable');
      expect(response.body.data).toHaveProperty('apr');
    });

    it('should provide multiple finance options', async () => {
      const response = await request(app)
        .post('/api/v1/products/apply-finance')
        .send({
          productId: kitchenProductId,
          quantity: 1,
          includeOptions: true
        })
        .expect(200);

      expect(response.body.data).toHaveProperty('options');
      expect(response.body.data.options).toBeInstanceOf(Array);
      expect(response.body.data.options.length).toBeGreaterThan(0);
      expect(response.body.data.options[0]).toHaveProperty('term');
      expect(response.body.data.options[0]).toHaveProperty('monthlyPayment');
      expect(response.body.data.options[0]).toHaveProperty('apr');
    });

    it('should validate minimum product price for finance', async () => {
      // Create cheap product
      const category = await prisma.category.findFirst();
      const colour = await prisma.colour.findFirst();
      const cheapProduct = await createTestProduct(prisma, {
        title: 'Cheap Item',
        categoryId: category.id,
        price: 100, // Too cheap for finance
        stock: 10,
        colourIds: [colour.id]
      });

      const response = await request(app)
        .post('/api/v1/products/apply-finance')
        .send({
          productId: cheapProduct.id,
          quantity: 1,
          term: 36
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('minimum');
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .post('/api/v1/products/apply-finance')
        .send({
          productId: fakeId,
          quantity: 1,
          term: 36
        })
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/v1/products/:id/price-history', () => {
    it('should get product price history for admin', async () => {
      const response = await request(app)
        .get(`/api/v1/products/${kitchenProductId}/price-history`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('productId', kitchenProductId);
      expect(response.body.data).toHaveProperty('currentPrice', 5999.99);
      expect(response.body.data).toHaveProperty('history');
      expect(response.body.data.history).toBeInstanceOf(Array);
    });

    it('should include sale periods in price history', async () => {
      const response = await request(app)
        .get(`/api/v1/products/${kitchenProductId}/price-history`)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ includeSales: true })
        .expect(200);

      expect(response.body.data).toHaveProperty('salesHistory');
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get(`/api/v1/products/${kitchenProductId}/price-history`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('admin');
    });
  });

  describe('POST /api/v1/products/verify-payment-webhook', () => {
    it('should verify product data from payment webhook', async () => {
      const response = await request(app)
        .post('/api/v1/products/verify-payment-webhook')
        .send({
          productIds: [kitchenProductId],
          quantities: [1],
          expectedTotal: 4799.99 // After 20% sale discount
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('verified', true);
      expect(response.body.data).toHaveProperty('calculatedTotal');
    });

    it('should detect price mismatches', async () => {
      const response = await request(app)
        .post('/api/v1/products/verify-payment-webhook')
        .send({
          productIds: [kitchenProductId],
          quantities: [1],
          expectedTotal: 1000.00 // Wrong amount
        })
        .expect(200);

      expect(response.body.data).toHaveProperty('verified', false);
      expect(response.body.data).toHaveProperty('reason', 'AMOUNT_MISMATCH');
      expect(response.body.data).toHaveProperty('expectedTotal', 1000.00);
      expect(response.body.data).toHaveProperty('calculatedTotal');
    });

    it('should handle product availability changes', async () => {
      // Mark product as out of stock
      await prisma.product.update({
        where: { id: kitchenProductId },
        data: { stock: 0 }
      });

      const response = await request(app)
        .post('/api/v1/products/verify-payment-webhook')
        .send({
          productIds: [kitchenProductId],
          quantities: [1],
          expectedTotal: 4799.99
        })
        .expect(200);

      expect(response.body.data).toHaveProperty('verified', false);
      expect(response.body.data).toHaveProperty('reason', 'PRODUCT_UNAVAILABLE');

      // Restore stock
      await prisma.product.update({
        where: { id: kitchenProductId },
        data: { stock: 10 }
      });
    });
  });

  describe('POST /api/v1/products/post-payment-actions', () => {
    it('should handle post-payment product updates', async () => {
      const response = await request(app)
        .post('/api/v1/products/post-payment-actions')
        .send({
          paymentId: 'pi_test_123456789',
          items: [
            {
              productId: kitchenProductId,
              quantity: 2
            }
          ],
          action: 'RESERVE_STOCK'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('stockReserved', true);
      expect(response.body.data).toHaveProperty('reservations');
    });

    it('should decrement stock after successful payment', async () => {
      const initialStock = (await prisma.product.findUnique({
        where: { id: kitchenProductId }
      })).stock;

      await request(app)
        .post('/api/v1/products/post-payment-actions')
        .send({
          paymentId: 'pi_test_123456790',
          items: [
            {
              productId: kitchenProductId,
              quantity: 1
            }
          ],
          action: 'DECREMENT_STOCK'
        })
        .expect(200);

      const updatedStock = (await prisma.product.findUnique({
        where: { id: kitchenProductId }
      })).stock;

      expect(updatedStock).toBe(initialStock - 1);

      // Restore stock
      await prisma.product.update({
        where: { id: kitchenProductId },
        data: { stock: initialStock }
      });
    });

    it('should handle inventory notifications', async () => {
      const response = await request(app)
        .post('/api/v1/products/post-payment-actions')
        .send({
          paymentId: 'pi_test_123456791',
          items: [
            {
              productId: kitchenProductId,
              quantity: 8 // Will bring stock below threshold
            }
          ],
          action: 'DECREMENT_STOCK'
        })
        .expect(200);

      expect(response.body.data).toHaveProperty('lowStockWarnings');
      if (response.body.data.lowStockWarnings) {
        expect(response.body.data.lowStockWarnings).toBeInstanceOf(Array);
      }
    });
  });

  describe('GET /api/v1/products/payment-analytics', () => {
    it('should get payment analytics for admin', async () => {
      const response = await request(app)
        .get('/api/v1/products/payment-analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          startDate: '2026-01-01',
          endDate: '2026-12-31'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('totalRevenue');
      expect(response.body.data).toHaveProperty('productsSold');
      expect(response.body.data).toHaveProperty('topProducts');
      expect(response.body.data).toHaveProperty('averageOrderValue');
    });

    it('should break down analytics by category', async () => {
      const response = await request(app)
        .get('/api/v1/products/payment-analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          groupBy: 'category'
        })
        .expect(200);

      expect(response.body.data).toHaveProperty('byCategory');
      expect(response.body.data.byCategory).toBeInstanceOf(Array);
    });

    it('should include finance analytics', async () => {
      const response = await request(app)
        .get('/api/v1/products/payment-analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          includeFinance: true
        })
        .expect(200);

      expect(response.body.data).toHaveProperty('financeAnalytics');
      expect(response.body.data.financeAnalytics).toHaveProperty('totalFinanced');
      expect(response.body.data.financeAnalytics).toHaveProperty('financeRate');
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get('/api/v1/products/payment-analytics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on payment calculation endpoints', async () => {
      const requests = [];
      const colourId = (await prisma.colour.findFirst()).id;
      
      // Make multiple rapid requests
      for (let i = 0; i < 100; i++) {
        requests.push(
          request(app)
            .post('/api/v1/products/calculate-payment')
            .send({
              items: [
                {
                  productId: kitchenProductId,
                  quantity: 1,
                  colourId
                }
              ]
            })
        );
      }

      const responses = await Promise.all(requests);
      const rateLimited = responses.some(r => r.status === 429);
      
      expect(rateLimited).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      await prisma.$disconnect();

      const response = await request(app)
        .get(`/api/v1/products/${kitchenProductId}/payment-details`)
        .expect(500);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('database');

      await prisma.$connect();
    });

    it('should return proper error format for validation errors', async () => {
      const response = await request(app)
        .post('/api/v1/products/calculate-payment')
        .send({
          items: [
            {
              productId: 'invalid-uuid',
              quantity: 'not-a-number'
            }
          ]
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('validationErrors');
    });

    it('should handle Stripe API errors gracefully', async () => {
      const colourId = (await prisma.colour.findFirst()).id;
      
      // Simulate Stripe error by using invalid data
      const response = await request(app)
        .post('/api/v1/products/prepare-payment-intent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [
            {
              productId: kitchenProductId,
              quantity: 1,
              colourId
            }
          ],
          forceStripeError: true // Test flag
        })
        .expect(500);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toBeDefined();
    });
  });

  describe('Security', () => {
    it('should sanitize product data in payment metadata', async () => {
      const colourId = (await prisma.colour.findFirst()).id;
      
      const response = await request(app)
        .post('/api/v1/products/prepare-payment-intent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [
            {
              productId: kitchenProductId,
              quantity: 1,
              colourId,
              maliciousData: '<script>alert("xss")</script>'
            }
          ]
        })
        .expect(200);

      const metadata = response.body.data.metadata;
      expect(JSON.stringify(metadata)).not.toContain('<script>');
    });

    it('should prevent price manipulation attempts', async () => {
      const colourId = (await prisma.colour.findFirst()).id;
      
      const response = await request(app)
        .post('/api/v1/products/calculate-payment')
        .send({
          items: [
            {
              productId: kitchenProductId,
              quantity: 1,
              colourId,
              customPrice: 1.00 // Attempt to manipulate price
            }
          ]
        })
        .expect(200);

      // Should use actual product price, not custom price
      expect(response.body.data.items[0].unitPrice).toBe(4799.99); // With sale discount
    });
  });
});