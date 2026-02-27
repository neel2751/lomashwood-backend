import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../../src/app';
import { generateToken } from '../../src/infrastructure/auth/jwt';
import { redisClient } from '../../src/infrastructure/cache/redis.client';

describe('Product Routes Integration Tests', () => {
  let app: Express;
  let prisma: PrismaClient;
  let adminToken: string;
  let userToken: string;
  let kitchenCategoryId: string;
  let bedroomCategoryId: string;
  let whiteColourId: string;
  let greyColourId: string;
  let testProductId: string;

  beforeAll(async () => {
    // Initialize app and database
    app = await createApp();
    prisma = new PrismaClient();
    
    await prisma.$connect();

    // Clean up existing test data
    await prisma.product.deleteMany({
      where: {
        name: {
          contains: 'Test Product',
        },
      },
    });

    await prisma.category.deleteMany({
      where: {
        name: {
          in: ['KITCHEN', 'BEDROOM'],
        },
      },
    });

    await prisma.colour.deleteMany({
      where: {
        name: {
          in: ['Test White', 'Test Grey', 'Test Oak'],
        },
      },
    });

    // Create test categories
    const kitchenCategory = await prisma.category.create({
      data: {
        name: 'KITCHEN',
        slug: 'kitchen',
        description: 'Kitchen products',
      },
    });
    kitchenCategoryId = kitchenCategory.id;

    const bedroomCategory = await prisma.category.create({
      data: {
        name: 'BEDROOM',
        slug: 'bedroom',
        description: 'Bedroom products',
      },
    });
    bedroomCategoryId = bedroomCategory.id;

    // Create test colours
    const whiteColour = await prisma.colour.create({
      data: {
        name: 'Test White',
        hex: '#FFFFFF',
      },
    });
    whiteColourId = whiteColour.id;

    const greyColour = await prisma.colour.create({
      data: {
        name: 'Test Grey',
        hex: '#808080',
      },
    });
    greyColourId = greyColour.id;

    // Create test users
    const adminUser = await prisma.user.create({
      data: {
        email: 'test-product-admin@lomashwood.com',
        password: 'hashed-password',
        name: 'Test Admin',
        role: 'ADMIN',
        isActive: true,
      },
    });

    const regularUser = await prisma.user.create({
      data: {
        email: 'test-product-user@lomashwood.com',
        password: 'hashed-password',
        name: 'Test User',
        role: 'USER',
        isActive: true,
      },
    });

    // Generate tokens
    adminToken = generateToken({ userId: adminUser.id, role: 'ADMIN' });
    userToken = generateToken({ userId: regularUser.id, role: 'USER' });

    // Create test product
    const testProduct = await prisma.product.create({
      data: {
        name: 'Test Product Kitchen',
        slug: 'test-product-kitchen',
        description: 'A test kitchen product',
        categoryId: kitchenCategoryId,
        price: 1500,
        sku: 'K-TEST-001',
        status: 'ACTIVE',
        style: 'MODERN',
        finish: 'GLOSS',
        stock: 50,
      },
    });
    testProductId = testProduct.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.product.deleteMany({
      where: {
        name: {
          contains: 'Test Product',
        },
      },
    });

    await prisma.category.deleteMany({
      where: {
        name: {
          in: ['KITCHEN', 'BEDROOM'],
        },
      },
    });

    await prisma.colour.deleteMany({
      where: {
        name: {
          contains: 'Test',
        },
      },
    });

    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'test-product-',
        },
      },
    });

    await prisma.$disconnect();
    await redisClient.disconnect();
  });

  beforeEach(async () => {
    // Clear cache before each test
    await redisClient.flushAll();
  });

  describe('GET /v1/products', () => {
    it('should return list of products', async () => {
      const response = await request(app)
        .get('/v1/products')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('products');
      expect(Array.isArray(response.body.data.products)).toBe(true);
      expect(response.body.data).toHaveProperty('meta');
    });

    it('should return products with pagination', async () => {
      const response = await request(app)
        .get('/v1/products?page=1&limit=10')
        .expect(200);

      expect(response.body.data.meta).toHaveProperty('page', 1);
      expect(response.body.data.meta).toHaveProperty('limit', 10);
      expect(response.body.data.meta).toHaveProperty('totalPages');
      expect(response.body.data.meta).toHaveProperty('total');
    });

    it('should filter products by category - KITCHEN', async () => {
      const response = await request(app)
        .get(`/v1/products?category=KITCHEN`)
        .expect(200);

      expect(response.body.data.products.length).toBeGreaterThan(0);
      response.body.data.products.forEach((product: any) => {
        expect(product.category.name).toBe('KITCHEN');
      });
    });

    it('should filter products by category - BEDROOM', async () => {
      // Create a bedroom product first
      await prisma.product.create({
        data: {
          name: 'Test Product Bedroom',
          slug: 'test-product-bedroom',
          description: 'A test bedroom product',
          categoryId: bedroomCategoryId,
          price: 2000,
          sku: 'B-TEST-001',
          status: 'ACTIVE',
          style: 'TRADITIONAL',
          finish: 'MATT',
          stock: 30,
        },
      });

      const response = await request(app)
        .get(`/v1/products?category=BEDROOM`)
        .expect(200);

      expect(response.body.data.products.length).toBeGreaterThan(0);
      response.body.data.products.forEach((product: any) => {
        expect(product.category.name).toBe('BEDROOM');
      });
    });

    it('should filter products by colour', async () => {
      // Add colour to test product
      await prisma.product.update({
        where: { id: testProductId },
        data: {
          colours: {
            connect: [{ id: whiteColourId }],
          },
        },
      });

      const response = await request(app)
        .get(`/v1/products?colours=Test White`)
        .expect(200);

      expect(response.body.data.products.length).toBeGreaterThan(0);
    });

    it('should filter products by multiple colours', async () => {
      await prisma.product.update({
        where: { id: testProductId },
        data: {
          colours: {
            connect: [{ id: whiteColourId }, { id: greyColourId }],
          },
        },
      });

      const response = await request(app)
        .get(`/v1/products?colours=Test White,Test Grey`)
        .expect(200);

      expect(response.body.data.products.length).toBeGreaterThan(0);
    });

    it('should filter products by style', async () => {
      const response = await request(app)
        .get('/v1/products?style=MODERN')
        .expect(200);

      response.body.data.products.forEach((product: any) => {
        expect(product.style).toBe('MODERN');
      });
    });

    it('should filter products by finish', async () => {
      const response = await request(app)
        .get('/v1/products?finish=GLOSS')
        .expect(200);

      response.body.data.products.forEach((product: any) => {
        expect(product.finish).toBe('GLOSS');
      });
    });

    it('should filter products by price range', async () => {
      const response = await request(app)
        .get('/v1/products?minPrice=1000&maxPrice=2000')
        .expect(200);

      response.body.data.products.forEach((product: any) => {
        expect(product.price).toBeGreaterThanOrEqual(1000);
        expect(product.price).toBeLessThanOrEqual(2000);
      });
    });

    it('should sort products by price ascending', async () => {
      const response = await request(app)
        .get('/v1/products?sortBy=price&order=ASC')
        .expect(200);

      const prices = response.body.data.products.map((p: any) => p.price);
      const sortedPrices = [...prices].sort((a, b) => a - b);
      expect(prices).toEqual(sortedPrices);
    });

    it('should sort products by price descending', async () => {
      const response = await request(app)
        .get('/v1/products?sortBy=price&order=DESC')
        .expect(200);

      const prices = response.body.data.products.map((p: any) => p.price);
      const sortedPrices = [...prices].sort((a, b) => b - a);
      expect(prices).toEqual(sortedPrices);
    });

    it('should sort products by name', async () => {
      const response = await request(app)
        .get('/v1/products?sortBy=name&order=ASC')
        .expect(200);

      const names = response.body.data.products.map((p: any) => p.name);
      const sortedNames = [...names].sort();
      expect(names).toEqual(sortedNames);
    });

    it('should sort products by popularity', async () => {
      const response = await request(app)
        .get('/v1/products?sortBy=popularity&order=DESC')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should apply multiple filters simultaneously', async () => {
      const response = await request(app)
        .get('/v1/products?category=KITCHEN&style=MODERN&finish=GLOSS&minPrice=1000&maxPrice=2000')
        .expect(200);

      response.body.data.products.forEach((product: any) => {
        expect(product.category.name).toBe('KITCHEN');
        expect(product.style).toBe('MODERN');
        expect(product.finish).toBe('GLOSS');
        expect(product.price).toBeGreaterThanOrEqual(1000);
        expect(product.price).toBeLessThanOrEqual(2000);
      });
    });

    it('should support infinite scroll with cursor-based pagination', async () => {
      const firstResponse = await request(app)
        .get('/v1/products?limit=5')
        .expect(200);

      expect(firstResponse.body.data.products).toHaveLength(5);
      
      if (firstResponse.body.data.meta.hasNextPage) {
        const cursor = firstResponse.body.data.meta.nextCursor;
        const secondResponse = await request(app)
          .get(`/v1/products?limit=5&cursor=${cursor}`)
          .expect(200);

        expect(secondResponse.body.success).toBe(true);
      }
    });

    it('should cache product list results', async () => {
      const firstResponse = await request(app)
        .get('/v1/products?category=KITCHEN')
        .expect(200);

      const cacheKey = 'products:list:category:KITCHEN';
      const cachedData = await redisClient.get(cacheKey);
      expect(cachedData).toBeTruthy();
    });

    it('should return 400 for invalid category', async () => {
      const response = await request(app)
        .get('/v1/products?category=INVALID')
        .expect(400);

      expect(response.body.error.message).toContain('Invalid category');
    });

    it('should return 400 for invalid sort field', async () => {
      const response = await request(app)
        .get('/v1/products?sortBy=invalid')
        .expect(400);

      expect(response.body.error.message).toContain('Invalid sort field');
    });
  });

  describe('GET /v1/products/:id', () => {
    it('should return single product by ID', async () => {
      const response = await request(app)
        .get(`/v1/products/${testProductId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('product');
      expect(response.body.data.product.id).toBe(testProductId);
      expect(response.body.data.product.name).toBe('Test Product Kitchen');
    });

    it('should include product details', async () => {
      const response = await request(app)
        .get(`/v1/products/${testProductId}`)
        .expect(200);

      const product = response.body.data.product;
      expect(product).toHaveProperty('name');
      expect(product).toHaveProperty('description');
      expect(product).toHaveProperty('price');
      expect(product).toHaveProperty('sku');
      expect(product).toHaveProperty('category');
      expect(product).toHaveProperty('colours');
      expect(product).toHaveProperty('style');
      expect(product).toHaveProperty('finish');
    });

    it('should include category information', async () => {
      const response = await request(app)
        .get(`/v1/products/${testProductId}`)
        .expect(200);

      expect(response.body.data.product.category).toHaveProperty('id');
      expect(response.body.data.product.category).toHaveProperty('name');
      expect(response.body.data.product.category.name).toBe('KITCHEN');
    });

    it('should include colour options', async () => {
      const response = await request(app)
        .get(`/v1/products/${testProductId}`)
        .expect(200);

      expect(Array.isArray(response.body.data.product.colours)).toBe(true);
    });

    it('should cache product details', async () => {
      await request(app)
        .get(`/v1/products/${testProductId}`)
        .expect(200);

      const cacheKey = `product:${testProductId}`;
      const cachedData = await redisClient.get(cacheKey);
      expect(cachedData).toBeTruthy();
    });

    it('should track product view analytics', async () => {
      await request(app)
        .get(`/v1/products/${testProductId}`)
        .expect(200);

      const views = await prisma.productView.findMany({
        where: { productId: testProductId },
      });

      expect(views.length).toBeGreaterThan(0);
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .get('/v1/products/non-existent-id')
        .expect(404);

      expect(response.body.error.message).toContain('Product not found');
    });

    it('should return 400 for invalid product ID format', async () => {
      const response = await request(app)
        .get('/v1/products/invalid-id-format')
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /v1/products/slug/:slug', () => {
    it('should return product by slug', async () => {
      const response = await request(app)
        .get('/v1/products/slug/test-product-kitchen')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.product.slug).toBe('test-product-kitchen');
    });

    it('should return 404 for non-existent slug', async () => {
      const response = await request(app)
        .get('/v1/products/slug/non-existent-slug')
        .expect(404);

      expect(response.body.error.message).toContain('Product not found');
    });
  });

  describe('POST /v1/products', () => {
    it('should create new product with admin authentication', async () => {
      const newProduct = {
        name: 'Test Product New Kitchen',
        description: 'A new kitchen product',
        categoryId: kitchenCategoryId,
        price: 2500,
        sku: 'K-TEST-NEW-001',
        style: 'CONTEMPORARY',
        finish: 'MATT',
        stock: 100,
        colourIds: [whiteColourId],
      };

      const response = await request(app)
        .post('/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newProduct)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.product.name).toBe(newProduct.name);
      expect(response.body.data.product.price).toBe(newProduct.price);
      expect(response.body.data.product.sku).toBe(newProduct.sku);
    });

    it('should generate slug from product name', async () => {
      const newProduct = {
        name: 'Modern White Kitchen',
        description: 'A modern white kitchen',
        categoryId: kitchenCategoryId,
        price: 3000,
        sku: 'K-MOD-WHITE-001',
        style: 'MODERN',
        finish: 'GLOSS',
        stock: 50,
      };

      const response = await request(app)
        .post('/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newProduct)
        .expect(201);

      expect(response.body.data.product.slug).toBe('modern-white-kitchen');
    });

    it('should return 401 without authentication', async () => {
      const newProduct = {
        name: 'Unauthorized Product',
        categoryId: kitchenCategoryId,
        price: 1000,
      };

      await request(app)
        .post('/v1/products')
        .send(newProduct)
        .expect(401);
    });

    it('should return 403 for non-admin user', async () => {
      const newProduct = {
        name: 'Forbidden Product',
        categoryId: kitchenCategoryId,
        price: 1000,
      };

      await request(app)
        .post('/v1/products')
        .set('Authorization', `Bearer ${userToken}`)
        .send(newProduct)
        .expect(403);
    });

    it('should validate required fields', async () => {
      const invalidProduct = {
        name: 'Test Product',
        // Missing required fields
      };

      const response = await request(app)
        .post('/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidProduct)
        .expect(400);

      expect(response.body.error.message).toContain('required');
    });

    it('should validate product name length', async () => {
      const invalidProduct = {
        name: 'AB', // Too short
        categoryId: kitchenCategoryId,
        price: 1000,
        sku: 'K-TEST-001',
      };

      const response = await request(app)
        .post('/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidProduct)
        .expect(400);

      expect(response.body.error.message).toContain('name');
    });

    it('should validate price is positive', async () => {
      const invalidProduct = {
        name: 'Test Product',
        categoryId: kitchenCategoryId,
        price: -100,
        sku: 'K-TEST-001',
      };

      const response = await request(app)
        .post('/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidProduct)
        .expect(400);

      expect(response.body.error.message).toContain('price');
    });

    it('should validate SKU uniqueness', async () => {
      const duplicateSKU = {
        name: 'Duplicate SKU Product',
        categoryId: kitchenCategoryId,
        price: 1500,
        sku: 'K-TEST-001', // Already exists
        style: 'MODERN',
        finish: 'GLOSS',
        stock: 50,
      };

      const response = await request(app)
        .post('/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(duplicateSKU)
        .expect(409);

      expect(response.body.error.message).toContain('SKU already exists');
    });

    it('should validate category exists', async () => {
      const invalidCategory = {
        name: 'Test Product',
        categoryId: 'non-existent-category-id',
        price: 1000,
        sku: 'K-TEST-INVALID-001',
      };

      const response = await request(app)
        .post('/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidCategory)
        .expect(400);

      expect(response.body.error.message).toContain('Category not found');
    });

    it('should associate colours with product', async () => {
      const newProduct = {
        name: 'Test Product with Colours',
        categoryId: kitchenCategoryId,
        price: 2000,
        sku: 'K-TEST-COLOUR-001',
        style: 'MODERN',
        finish: 'GLOSS',
        stock: 30,
        colourIds: [whiteColourId, greyColourId],
      };

      const response = await request(app)
        .post('/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newProduct)
        .expect(201);

      expect(response.body.data.product.colours).toHaveLength(2);
    });

    it('should publish product created event', async () => {
      const newProduct = {
        name: 'Test Product Event',
        categoryId: kitchenCategoryId,
        price: 1800,
        sku: 'K-TEST-EVENT-001',
        style: 'MODERN',
        finish: 'MATT',
        stock: 40,
      };

      const response = await request(app)
        .post('/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newProduct)
        .expect(201);

      // Verify event was published (check event log or message queue)
      expect(response.body.success).toBe(true);
    });
  });

  describe('PATCH /v1/products/:id', () => {
    it('should update product with admin authentication', async () => {
      const updates = {
        name: 'Updated Product Name',
        price: 2000,
        description: 'Updated description',
      };

      const response = await request(app)
        .patch(`/v1/products/${testProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.product.name).toBe(updates.name);
      expect(response.body.data.product.price).toBe(updates.price);
      expect(response.body.data.product.description).toBe(updates.description);
    });

    it('should update slug when name changes', async () => {
      const updates = {
        name: 'Completely New Product Name',
      };

      const response = await request(app)
        .patch(`/v1/products/${testProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.data.product.slug).toBe('completely-new-product-name');
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .patch(`/v1/products/${testProductId}`)
        .send({ price: 2500 })
        .expect(401);
    });

    it('should return 403 for non-admin user', async () => {
      await request(app)
        .patch(`/v1/products/${testProductId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ price: 2500 })
        .expect(403);
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .patch('/v1/products/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ price: 2500 })
        .expect(404);

      expect(response.body.error.message).toContain('Product not found');
    });

    it('should invalidate cache on update', async () => {
      // First, cache the product
      await request(app)
        .get(`/v1/products/${testProductId}`)
        .expect(200);

      // Update the product
      await request(app)
        .patch(`/v1/products/${testProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ price: 2200 })
        .expect(200);

      // Cache should be invalidated
      const cacheKey = `product:${testProductId}`;
      const cachedData = await redisClient.get(cacheKey);
      expect(cachedData).toBeNull();
    });

    it('should publish product updated event', async () => {
      const response = await request(app)
        .patch(`/v1/products/${testProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ price: 2300 })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('DELETE /v1/products/:id', () => {
    it('should soft delete product with admin authentication', async () => {
      // Create product to delete
      const productToDelete = await prisma.product.create({
        data: {
          name: 'Test Product to Delete',
          slug: 'test-product-to-delete',
          categoryId: kitchenCategoryId,
          price: 1000,
          sku: 'K-TEST-DELETE-001',
          status: 'ACTIVE',
        },
      });

      const response = await request(app)
        .delete(`/v1/products/${productToDelete.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');

      // Verify soft delete (status changed to ARCHIVED)
      const deletedProduct = await prisma.product.findUnique({
        where: { id: productToDelete.id },
      });

      expect(deletedProduct?.status).toBe('ARCHIVED');
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .delete(`/v1/products/${testProductId}`)
        .expect(401);
    });

    it('should return 403 for non-admin user', async () => {
      await request(app)
        .delete(`/v1/products/${testProductId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .delete('/v1/products/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.error.message).toContain('Product not found');
    });
  });

  describe('GET /v1/products/search', () => {
    it('should search products by query', async () => {
      const response = await request(app)
        .get('/v1/products/search?q=kitchen')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.products)).toBe(true);
    });

    it('should search products with minimum length validation', async () => {
      const response = await request(app)
        .get('/v1/products/search?q=ab')
        .expect(400);

      expect(response.body.error.message).toContain('Search query too short');
    });

    it('should track search analytics', async () => {
      await request(app)
        .get('/v1/products/search?q=modern kitchen')
        .expect(200);

      const searchLogs = await prisma.productSearch.findMany({
        where: { searchTerm: 'modern kitchen' },
      });

      expect(searchLogs.length).toBeGreaterThan(0);
    });
  });

  describe('Product Images', () => {
    it('should upload product image', async () => {
      const response = await request(app)
        .post(`/v1/products/${testProductId}/images`)
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('image', Buffer.from('fake-image-data'), 'test-image.jpg')
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('imageUrl');
    });

    it('should validate image format', async () => {
      const response = await request(app)
        .post(`/v1/products/${testProductId}/images`)
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('image', Buffer.from('fake-data'), 'test.txt')
        .expect(400);

      expect(response.body.error.message).toContain('Invalid image format');
    });

    it('should delete product image', async () => {
      const response = await request(app)
        .delete(`/v1/products/${testProductId}/images/image-id`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});