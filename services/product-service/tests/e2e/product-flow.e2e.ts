import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../src/app';
import { hashPassword } from '../../src/infrastructure/auth/password';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

describe('Product Flow E2E Tests', () => {
  const baseUrl = '/api/v1/products';
  
  let adminToken: string;
  let customerToken: string;
  let categoryId: string;
  let productId: string;
  let colourIds: string[] = [];
  let sizeIds: string[] = [];

  const adminUser = {
    email: 'admin@lomashwood.com',
    password: 'Admin@123456',
    firstName: 'Admin',
    lastName: 'User',
    phone: '+919876543210',
    role: 'ADMIN',
  };

  const customerUser = {
    email: 'customer@lomashwood.com',
    password: 'Customer@123456',
    firstName: 'Customer',
    lastName: 'User',
    phone: '+919876543211',
    role: 'CUSTOMER',
  };

  beforeAll(async () => {
    await cleanupTestData();
    await setupTestUsers();
    await setupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  async function cleanupTestData() {
    await prisma.productImage.deleteMany();
    await prisma.productColour.deleteMany();
    await prisma.productSize.deleteMany();
    await prisma.inventoryLog.deleteMany();
    await prisma.inventory.deleteMany();
    await prisma.priceHistory.deleteMany();
    await prisma.product.deleteMany();
    await prisma.size.deleteMany();
    await prisma.colour.deleteMany();
    await prisma.category.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [adminUser.email, customerUser.email],
        },
      },
    });
  }

  async function setupTestUsers() {
    const hashedAdminPassword = await hashPassword(adminUser.password);
    const hashedCustomerPassword = await hashPassword(customerUser.password);

    await prisma.user.createMany({
      data: [
        {
          ...adminUser,
          password: hashedAdminPassword,
          isEmailVerified: true,
        },
        {
          ...customerUser,
          password: hashedCustomerPassword,
          isEmailVerified: true,
        },
      ],
    });

    const adminLoginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: adminUser.email,
        password: adminUser.password,
      });

    adminToken = adminLoginResponse.body.data.accessToken;

    const customerLoginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: customerUser.email,
        password: customerUser.password,
      });

    customerToken = customerLoginResponse.body.data.accessToken;
  }

  async function setupTestData() {
    const category = await prisma.category.create({
      data: {
        name: 'Kitchen',
        slug: 'kitchen',
        description: 'Premium kitchen designs',
        isActive: true,
      },
    });
    categoryId = category.id;

    const colours = await prisma.colour.createMany({
      data: [
        { name: 'White', hexCode: '#FFFFFF', isActive: true },
        { name: 'Black', hexCode: '#000000', isActive: true },
        { name: 'Grey', hexCode: '#808080', isActive: true },
      ],
    });

    const createdColours = await prisma.colour.findMany({
      where: { hexCode: { in: ['#FFFFFF', '#000000', '#808080'] } },
    });
    colourIds = createdColours.map(c => c.id);

    const sizes = await prisma.size.createMany({
      data: [
        { name: 'Small', code: 'S', dimensions: '100x200', isActive: true },
        { name: 'Medium', code: 'M', dimensions: '150x250', isActive: true },
        { name: 'Large', code: 'L', dimensions: '200x300', isActive: true },
      ],
    });

    const createdSizes = await prisma.size.findMany({
      where: { code: { in: ['S', 'M', 'L'] } },
    });
    sizeIds = createdSizes.map(s => s.id);
  }

  describe('Category Management', () => {
    it('should get all categories', async () => {
      const response = await request(app)
        .get('/api/v1/categories')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          categories: expect.arrayContaining([
            expect.objectContaining({
              id: categoryId,
              name: 'Kitchen',
              slug: 'kitchen',
            }),
          ]),
        },
      });
    });

    it('should create a new category as admin', async () => {
      const response = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Bedroom',
          slug: 'bedroom',
          description: 'Luxury bedroom designs',
          isActive: true,
        })
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          category: expect.objectContaining({
            name: 'Bedroom',
            slug: 'bedroom',
          }),
        },
      });
    });

    it('should fail to create category without admin role', async () => {
      await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          name: 'Test Category',
          slug: 'test-category',
        })
        .expect(403);
    });

    it('should fail to create duplicate category slug', async () => {
      const response = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Kitchen 2',
          slug: 'kitchen',
          description: 'Duplicate slug',
        })
        .expect(409);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'DUPLICATE_ENTRY',
        },
      });
    });
  });

  describe('Colour Management', () => {
    it('should get all colours', async () => {
      const response = await request(app)
        .get('/api/v1/colours')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          colours: expect.arrayContaining([
            expect.objectContaining({
              name: 'White',
              hexCode: '#FFFFFF',
            }),
          ]),
        },
      });
    });

    it('should create a new colour as admin', async () => {
      const response = await request(app)
        .post('/api/v1/colours')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Red',
          hexCode: '#FF0000',
          isActive: true,
        })
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          colour: expect.objectContaining({
            name: 'Red',
            hexCode: '#FF0000',
          }),
        },
      });
    });

    it('should fail to create colour with invalid hex code', async () => {
      const response = await request(app)
        .post('/api/v1/colours')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Invalid',
          hexCode: 'notahex',
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
        },
      });
    });
  });

  describe('Size Management', () => {
    it('should get all sizes', async () => {
      const response = await request(app)
        .get('/api/v1/sizes')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          sizes: expect.arrayContaining([
            expect.objectContaining({
              name: 'Small',
              code: 'S',
            }),
          ]),
        },
      });
    });

    it('should create a new size as admin', async () => {
      const response = await request(app)
        .post('/api/v1/sizes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Extra Large',
          code: 'XL',
          dimensions: '250x350',
          isActive: true,
        })
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          size: expect.objectContaining({
            name: 'Extra Large',
            code: 'XL',
          }),
        },
      });
    });
  });

  describe('Product Creation and Management', () => {
    it('should create a new product with images as admin', async () => {
      const response = await request(app)
        .post(baseUrl)
        .set('Authorization', `Bearer ${adminToken}`)
        .field('title', 'Luna White Kitchen')
        .field('description', 'Modern white kitchen with sleek design')
        .field('categoryId', categoryId)
        .field('rangeName', 'Luna Collection')
        .field('price', '25000')
        .field('isActive', 'true')
        .field('colours', JSON.stringify(colourIds.slice(0, 2)))
        .field('sizes', JSON.stringify(sizeIds.slice(0, 2)))
        .attach('images', Buffer.from('fake-image-1'), 'kitchen-1.jpg')
        .attach('images', Buffer.from('fake-image-2'), 'kitchen-2.jpg')
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          product: expect.objectContaining({
            id: expect.any(String),
            title: 'Luna White Kitchen',
            description: 'Modern white kitchen with sleek design',
            price: '25000',
            categoryId: categoryId,
            rangeName: 'Luna Collection',
          }),
        },
      });

      productId = response.body.data.product.id;
    });

    it('should fail to create product without required fields', async () => {
      const response = await request(app)
        .post(baseUrl)
        .set('Authorization', `Bearer ${adminToken}`)
        .field('title', 'Incomplete Product')
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
        },
      });
    });

    it('should fail to create product without admin role', async () => {
      await request(app)
        .post(baseUrl)
        .set('Authorization', `Bearer ${customerToken}`)
        .field('title', 'Unauthorized Product')
        .field('categoryId', categoryId)
        .expect(403);
    });

    it('should get product by id', async () => {
      const response = await request(app)
        .get(`${baseUrl}/${productId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          product: expect.objectContaining({
            id: productId,
            title: 'Luna White Kitchen',
            category: expect.objectContaining({
              name: 'Kitchen',
            }),
            colours: expect.arrayContaining([
              expect.objectContaining({
                colour: expect.objectContaining({
                  name: expect.any(String),
                }),
              }),
            ]),
            sizes: expect.arrayContaining([
              expect.objectContaining({
                size: expect.objectContaining({
                  name: expect.any(String),
                }),
              }),
            ]),
          }),
        },
      });
    });

    it('should return 404 for non-existent product', async () => {
      await request(app)
        .get(`${baseUrl}/non-existent-id`)
        .expect(404);
    });

    it('should update product as admin', async () => {
      const response = await request(app)
        .patch(`${baseUrl}/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Luna White Kitchen - Updated',
          price: '27000',
          description: 'Updated modern white kitchen',
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          product: expect.objectContaining({
            id: productId,
            title: 'Luna White Kitchen - Updated',
            price: '27000',
          }),
        },
      });
    });

    it('should fail to update product without admin role', async () => {
      await request(app)
        .patch(`${baseUrl}/${productId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          title: 'Unauthorized Update',
        })
        .expect(403);
    });

    it('should soft delete product as admin', async () => {
      const response = await request(app)
        .delete(`${baseUrl}/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('deleted'),
      });

      const deletedProduct = await prisma.product.findUnique({
        where: { id: productId },
      });

      expect(deletedProduct?.deletedAt).not.toBeNull();
    });
  });

  describe('Product Listing and Filtering', () => {
    beforeAll(async () => {
      await prisma.product.updateMany({
        where: { deletedAt: { not: null } },
        data: { deletedAt: null },
      });

      await prisma.product.createMany({
        data: [
          {
            title: 'Modern Grey Kitchen',
            slug: 'modern-grey-kitchen',
            description: 'Sleek grey kitchen design',
            categoryId: categoryId,
            rangeName: 'Modern Collection',
            price: 30000,
            isActive: true,
          },
          {
            title: 'Classic White Kitchen',
            slug: 'classic-white-kitchen',
            description: 'Traditional white kitchen',
            categoryId: categoryId,
            rangeName: 'Classic Collection',
            price: 22000,
            isActive: true,
          },
          {
            title: 'Luxury Black Kitchen',
            slug: 'luxury-black-kitchen',
            description: 'Premium black kitchen',
            categoryId: categoryId,
            rangeName: 'Luxury Collection',
            price: 45000,
            isActive: true,
          },
        ],
      });
    });

    it('should get all products with pagination', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          products: expect.any(Array),
          pagination: {
            page: 1,
            limit: 10,
            total: expect.any(Number),
            totalPages: expect.any(Number),
          },
        },
      });

      expect(response.body.data.products.length).toBeGreaterThan(0);
    });

    it('should filter products by category', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ categoryId: categoryId })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products.every(
        (p: any) => p.categoryId === categoryId
      )).toBe(true);
    });

    it('should filter products by price range', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ minPrice: 20000, maxPrice: 30000 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products.every(
        (p: any) => parseInt(p.price) >= 20000 && parseInt(p.price) <= 30000
      )).toBe(true);
    });

    it('should sort products by price ascending', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ sortBy: 'price', sortOrder: 'asc' })
        .expect(200);

      expect(response.body.success).toBe(true);
      
      const prices = response.body.data.products.map((p: any) => parseInt(p.price));
      const sortedPrices = [...prices].sort((a, b) => a - b);
      
      expect(prices).toEqual(sortedPrices);
    });

    it('should sort products by price descending', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ sortBy: 'price', sortOrder: 'desc' })
        .expect(200);

      expect(response.body.success).toBe(true);
      
      const prices = response.body.data.products.map((p: any) => parseInt(p.price));
      const sortedPrices = [...prices].sort((a, b) => b - a);
      
      expect(prices).toEqual(sortedPrices);
    });

    it('should search products by title', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ search: 'white' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products.every(
        (p: any) => p.title.toLowerCase().includes('white')
      )).toBe(true);
    });

    it('should filter products by range name', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ rangeName: 'Modern Collection' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products.every(
        (p: any) => p.rangeName === 'Modern Collection'
      )).toBe(true);
    });

    it('should implement infinite scroll with cursor pagination', async () => {
      const firstPage = await request(app)
        .get(baseUrl)
        .query({ limit: 2 })
        .expect(200);

      expect(firstPage.body.data.products).toHaveLength(2);
      
      const cursor = firstPage.body.data.pagination.nextCursor;

      if (cursor) {
        const secondPage = await request(app)
          .get(baseUrl)
          .query({ limit: 2, cursor })
          .expect(200);

        expect(secondPage.body.data.products).toBeDefined();
        
        const firstPageIds = firstPage.body.data.products.map((p: any) => p.id);
        const secondPageIds = secondPage.body.data.products.map((p: any) => p.id);
        
        expect(firstPageIds.some((id: string) => secondPageIds.includes(id))).toBe(false);
      }
    });

    it('should combine multiple filters', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({
          categoryId: categoryId,
          minPrice: 20000,
          maxPrice: 35000,
          sortBy: 'price',
          sortOrder: 'asc',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products.every(
        (p: any) => 
          p.categoryId === categoryId &&
          parseInt(p.price) >= 20000 &&
          parseInt(p.price) <= 35000
      )).toBe(true);
    });
  });

  describe('Product Inventory Management', () => {
    let inventoryProductId: string;

    beforeAll(async () => {
      const product = await prisma.product.create({
        data: {
          title: 'Inventory Test Kitchen',
          slug: 'inventory-test-kitchen',
          description: 'Test product for inventory',
          categoryId: categoryId,
          rangeName: 'Test Collection',
          price: 20000,
          isActive: true,
        },
      });

      inventoryProductId = product.id;
    });

    it('should create inventory for product as admin', async () => {
      const response = await request(app)
        .post(`${baseUrl}/${inventoryProductId}/inventory`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          quantity: 100,
          lowStockThreshold: 10,
          location: 'Warehouse A',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          inventory: expect.objectContaining({
            productId: inventoryProductId,
            quantity: 100,
            lowStockThreshold: 10,
          }),
        },
      });
    });

    it('should get inventory for product', async () => {
      const response = await request(app)
        .get(`${baseUrl}/${inventoryProductId}/inventory`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          inventory: expect.objectContaining({
            productId: inventoryProductId,
            quantity: 100,
          }),
        },
      });
    });

    it('should update inventory quantity as admin', async () => {
      const response = await request(app)
        .patch(`${baseUrl}/${inventoryProductId}/inventory`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          quantity: 150,
          reason: 'Stock replenishment',
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          inventory: expect.objectContaining({
            quantity: 150,
          }),
        },
      });
    });

    it('should track inventory history', async () => {
      const response = await request(app)
        .get(`${baseUrl}/${inventoryProductId}/inventory/history`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          logs: expect.arrayContaining([
            expect.objectContaining({
              productId: inventoryProductId,
              quantityChange: expect.any(Number),
              reason: expect.any(String),
            }),
          ]),
        },
      });
    });

    it('should fail to create inventory without admin role', async () => {
      await request(app)
        .post(`${baseUrl}/${inventoryProductId}/inventory`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          quantity: 50,
        })
        .expect(403);
    });
  });

  describe('Product Price Management', () => {
    it('should track price history when price changes', async () => {
      const product = await prisma.product.create({
        data: {
          title: 'Price Test Kitchen',
          slug: 'price-test-kitchen',
          description: 'Test product for pricing',
          categoryId: categoryId,
          rangeName: 'Test Collection',
          price: 30000,
          isActive: true,
        },
      });

      await request(app)
        .patch(`${baseUrl}/${product.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          price: 32000,
        })
        .expect(200);

      const priceHistory = await prisma.priceHistory.findMany({
        where: { productId: product.id },
        orderBy: { createdAt: 'desc' },
      });

      expect(priceHistory.length).toBeGreaterThan(0);
      expect(priceHistory.some(p => p.price === 30000)).toBe(true);
    });

    it('should get price history for product', async () => {
      const products = await prisma.product.findMany({ take: 1 });
      const testProductId = products[0].id;

      const response = await request(app)
        .get(`${baseUrl}/${testProductId}/price-history`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          history: expect.any(Array),
        },
      });
    });
  });

  describe('Product Analytics', () => {
    it('should get product analytics as admin', async () => {
      const response = await request(app)
        .get(`${baseUrl}/admin/analytics`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          totalProducts: expect.any(Number),
          activeProducts: expect.any(Number),
          totalValue: expect.any(Number),
          byCategory: expect.any(Array),
        },
      });
    });

    it('should fail to access analytics without admin role', async () => {
      await request(app)
        .get(`${baseUrl}/admin/analytics`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });
  });
});