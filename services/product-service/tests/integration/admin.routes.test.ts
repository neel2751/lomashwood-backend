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
  createTestSize,
  clearDatabase 
} from '../fixtures';

describe('Admin Routes Integration Tests - Product Service', () => {
  let app: Application;
  let prisma: PrismaClient;
  let authToken: string;
  let adminToken: string;
  let kitchenProductId: string;
  let bedroomProductId: string;
  let kitchenCategoryId: string;
  let bedroomCategoryId: string;
  let whiteColourId: string;
  let testUserId: string;
  let adminUserId: string;

  beforeAll(async () => {
    // Initialize app and database
    app = await createApp();
    prisma = new PrismaClient();
    
    // Clear database
    await clearDatabase(prisma);
    
    // Create test customer user
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
    adminUserId = admin.id;
    
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
    whiteColourId = whiteColour.id;
    
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
  });

  afterAll(async () => {
    await clearDatabase(prisma);
    await prisma.$disconnect();
  });

  describe('POST /api/v1/admin/products', () => {
    it('should create a new product as admin', async () => {
      const response = await request(app)
        .post('/api/v1/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Premium Oak Kitchen',
          description: 'Luxury kitchen with premium oak finishes',
          categoryId: kitchenCategoryId,
          price: 8999.99,
          stock: 15,
          sku: 'KITCHEN-OAK-001',
          colourIds: [whiteColourId],
          images: [
            'https://example.com/kitchen-oak-1.jpg',
            'https://example.com/kitchen-oak-2.jpg'
          ],
          specifications: {
            material: 'Oak',
            finish: 'Matte',
            warranty: '10 years'
          }
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('title', 'Premium Oak Kitchen');
      expect(response.body.data).toHaveProperty('price', 8999.99);
      expect(response.body.data).toHaveProperty('status', 'ACTIVE');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Invalid Product'
          // Missing required fields
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('validationErrors');
    });

    it('should validate unique SKU', async () => {
      // Create first product with SKU
      await request(app)
        .post('/api/v1/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'First Product',
          description: 'Test',
          categoryId: kitchenCategoryId,
          price: 1000,
          stock: 10,
          sku: 'DUPLICATE-SKU'
        });

      // Attempt duplicate SKU
      const response = await request(app)
        .post('/api/v1/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Second Product',
          description: 'Test',
          categoryId: kitchenCategoryId,
          price: 2000,
          stock: 5,
          sku: 'DUPLICATE-SKU'
        })
        .expect(409);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('SKU');
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .post('/api/v1/admin/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Unauthorized Product',
          categoryId: kitchenCategoryId,
          price: 1000,
          stock: 10
        })
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('admin');
    });

    it('should support creating product with multiple colours', async () => {
      const greyColour = await createTestColour(prisma, {
        name: 'Grey',
        hexCode: '#808080'
      });

      const response = await request(app)
        .post('/api/v1/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Multi-Colour Kitchen',
          description: 'Available in multiple colours',
          categoryId: kitchenCategoryId,
          price: 6999.99,
          stock: 20,
          colourIds: [whiteColourId, greyColour.id]
        })
        .expect(201);

      expect(response.body.data.colours).toHaveLength(2);
    });

    it('should support creating product with sizes', async () => {
      const smallSize = await createTestSize(prisma, {
        name: 'Small',
        dimensions: '200x100x80'
      });

      const response = await request(app)
        .post('/api/v1/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Sized Kitchen',
          description: 'Available in multiple sizes',
          categoryId: kitchenCategoryId,
          price: 5999.99,
          stock: 10,
          sizeIds: [smallSize.id]
        })
        .expect(201);

      expect(response.body.data.sizes).toBeDefined();
    });
  });

  describe('PATCH /api/v1/admin/products/:id', () => {
    it('should update product as admin', async () => {
      const response = await request(app)
        .patch(`/api/v1/admin/products/${kitchenProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Luna White Kitchen - Updated',
          price: 6499.99,
          stock: 15
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('title', 'Luna White Kitchen - Updated');
      expect(response.body.data).toHaveProperty('price', 6499.99);
    });

    it('should update product status', async () => {
      const response = await request(app)
        .patch(`/api/v1/admin/products/${kitchenProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'DISCONTINUED'
        })
        .expect(200);

      expect(response.body.data).toHaveProperty('status', 'DISCONTINUED');
    });

    it('should update product images', async () => {
      const response = await request(app)
        .patch(`/api/v1/admin/products/${kitchenProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          images: [
            'https://example.com/new-image-1.jpg',
            'https://example.com/new-image-2.jpg',
            'https://example.com/new-image-3.jpg'
          ]
        })
        .expect(200);

      expect(response.body.data.images).toHaveLength(3);
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .patch(`/api/v1/admin/products/${kitchenProductId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          price: 1000
        })
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .patch(`/api/v1/admin/products/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          price: 1000
        })
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('DELETE /api/v1/admin/products/:id', () => {
    it('should soft delete product as admin', async () => {
      const product = await createTestProduct(prisma, {
        title: 'Product to Delete',
        categoryId: kitchenCategoryId,
        price: 1000,
        stock: 10,
        colourIds: [whiteColourId]
      });

      const response = await request(app)
        .delete(`/api/v1/admin/products/${product.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('deleted', true);

      // Verify soft delete
      const deletedProduct = await prisma.product.findUnique({
        where: { id: product.id }
      });
      expect(deletedProduct.deletedAt).not.toBeNull();
    });

    it('should support hard delete with query parameter', async () => {
      const product = await createTestProduct(prisma, {
        title: 'Product to Hard Delete',
        categoryId: kitchenCategoryId,
        price: 1000,
        stock: 10,
        colourIds: [whiteColourId]
      });

      const response = await request(app)
        .delete(`/api/v1/admin/products/${product.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ hard: true })
        .expect(200);

      expect(response.body.data).toHaveProperty('hardDeleted', true);

      // Verify hard delete
      const deletedProduct = await prisma.product.findUnique({
        where: { id: product.id }
      });
      expect(deletedProduct).toBeNull();
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .delete(`/api/v1/admin/products/${kitchenProductId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/v1/admin/categories', () => {
    it('should create category as admin', async () => {
      const response = await request(app)
        .post('/api/v1/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Living Room',
          slug: 'living-room',
          description: 'Living room furniture and designs',
          image: 'https://example.com/living-room.jpg'
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('name', 'Living Room');
      expect(response.body.data).toHaveProperty('slug', 'living-room');
    });

    it('should auto-generate slug if not provided', async () => {
      const response = await request(app)
        .post('/api/v1/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Dining Room'
        })
        .expect(201);

      expect(response.body.data).toHaveProperty('slug', 'dining-room');
    });

    it('should validate unique slug', async () => {
      const response = await request(app)
        .post('/api/v1/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Another Kitchen',
          slug: 'kitchen' // Already exists
        })
        .expect(409);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .post('/api/v1/admin/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Unauthorized Category'
        })
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('PATCH /api/v1/admin/categories/:id', () => {
    it('should update category as admin', async () => {
      const response = await request(app)
        .patch(`/api/v1/admin/categories/${kitchenCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          description: 'Updated kitchen category description',
          image: 'https://example.com/kitchen-updated.jpg'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('description', 'Updated kitchen category description');
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .patch(`/api/v1/admin/categories/${kitchenCategoryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Unauthorized Update'
        })
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/v1/admin/colours', () => {
    it('should create colour as admin', async () => {
      const response = await request(app)
        .post('/api/v1/admin/colours')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Midnight Black',
          hexCode: '#000000'
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('name', 'Midnight Black');
      expect(response.body.data).toHaveProperty('hexCode', '#000000');
    });

    it('should validate hex code format', async () => {
      const response = await request(app)
        .post('/api/v1/admin/colours')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Invalid Colour',
          hexCode: 'not-a-hex'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('hex');
    });

    it('should validate unique colour name', async () => {
      const response = await request(app)
        .post('/api/v1/admin/colours')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'White', // Already exists
          hexCode: '#FFFFFE'
        })
        .expect(409);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .post('/api/v1/admin/colours')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Red',
          hexCode: '#FF0000'
        })
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/v1/admin/sales', () => {
    it('should create sale as admin', async () => {
      const response = await request(app)
        .post('/api/v1/admin/sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Spring Sale',
          description: '25% off all kitchens',
          discountPercentage: 25,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          image: 'https://example.com/spring-sale.jpg',
          productIds: [kitchenProductId],
          categoryIds: [kitchenCategoryId]
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('title', 'Spring Sale');
      expect(response.body.data).toHaveProperty('discountPercentage', 25);
    });

    it('should validate date range', async () => {
      const response = await request(app)
        .post('/api/v1/admin/sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Invalid Sale',
          description: 'Test',
          discountPercentage: 10,
          startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString() // End before start
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('date');
    });

    it('should validate discount percentage range', async () => {
      const response = await request(app)
        .post('/api/v1/admin/sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Invalid Discount',
          description: 'Test',
          discountPercentage: 150, // Invalid percentage
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .post('/api/v1/admin/sales')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Unauthorized Sale',
          discountPercentage: 10
        })
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/v1/admin/packages', () => {
    it('should create package as admin', async () => {
      const response = await request(app)
        .post('/api/v1/admin/packages')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Complete Home Package',
          description: 'Kitchen and Bedroom bundle',
          price: 12999.99,
          image: 'https://example.com/package.jpg',
          productIds: [kitchenProductId, bedroomProductId],
          savings: 2000.00
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('title', 'Complete Home Package');
      expect(response.body.data).toHaveProperty('price', 12999.99);
    });

    it('should require at least two products for package', async () => {
      const response = await request(app)
        .post('/api/v1/admin/packages')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Invalid Package',
          description: 'Only one product',
          price: 5000,
          productIds: [kitchenProductId] // Only one product
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('at least two');
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .post('/api/v1/admin/packages')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Unauthorized Package',
          price: 10000
        })
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/v1/admin/products/bulk-update', () => {
    it('should bulk update product prices', async () => {
      const response = await request(app)
        .post('/api/v1/admin/products/bulk-update')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          productIds: [kitchenProductId, bedroomProductId],
          updates: {
            price: {
              operation: 'INCREASE_PERCENTAGE',
              value: 10
            }
          }
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('updated');
      expect(response.body.data.updated).toBeGreaterThanOrEqual(2);
    });

    it('should bulk update product status', async () => {
      const response = await request(app)
        .post('/api/v1/admin/products/bulk-update')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          productIds: [kitchenProductId],
          updates: {
            status: 'DRAFT'
          }
        })
        .expect(200);

      expect(response.body.data).toHaveProperty('updated', 1);
    });

    it('should bulk update product stock', async () => {
      const response = await request(app)
        .post('/api/v1/admin/products/bulk-update')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          productIds: [kitchenProductId, bedroomProductId],
          updates: {
            stock: {
              operation: 'INCREMENT',
              value: 5
            }
          }
        })
        .expect(200);

      expect(response.body.data).toHaveProperty('updated');
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .post('/api/v1/admin/products/bulk-update')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productIds: [kitchenProductId],
          updates: { status: 'DRAFT' }
        })
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/v1/admin/products/bulk-delete', () => {
    it('should bulk delete products', async () => {
      const product1 = await createTestProduct(prisma, {
        title: 'Bulk Delete 1',
        categoryId: kitchenCategoryId,
        price: 1000,
        stock: 10,
        colourIds: [whiteColourId]
      });

      const product2 = await createTestProduct(prisma, {
        title: 'Bulk Delete 2',
        categoryId: kitchenCategoryId,
        price: 1000,
        stock: 10,
        colourIds: [whiteColourId]
      });

      const response = await request(app)
        .post('/api/v1/admin/products/bulk-delete')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          productIds: [product1.id, product2.id]
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('deleted', 2);
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .post('/api/v1/admin/products/bulk-delete')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productIds: [kitchenProductId]
        })
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/v1/admin/products/import', () => {
    it('should import products from CSV', async () => {
      const csvData = `title,description,category,price,stock,sku
"Import Product 1","Description 1","Kitchen",1999.99,10,IMPORT-001
"Import Product 2","Description 2","Bedroom",2999.99,5,IMPORT-002`;

      const response = await request(app)
        .post('/api/v1/admin/products/import')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', Buffer.from(csvData), 'products.csv')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('imported');
      expect(response.body.data).toHaveProperty('failed');
      expect(response.body.data.imported).toBeGreaterThan(0);
    });

    it('should return validation errors for invalid CSV data', async () => {
      const invalidCsv = `title,description,category,price,stock
"Invalid Product","Description","InvalidCategory",-100,abc`;

      const response = await request(app)
        .post('/api/v1/admin/products/import')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', Buffer.from(invalidCsv), 'invalid.csv')
        .expect(200);

      expect(response.body.data).toHaveProperty('failed');
      expect(response.body.data.failed).toBeGreaterThan(0);
      expect(response.body.data).toHaveProperty('errors');
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .post('/api/v1/admin/products/import')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('test'), 'products.csv')
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/v1/admin/products/export', () => {
    it('should export products to CSV', async () => {
      const response = await request(app)
        .get('/api/v1/admin/products/export')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ format: 'CSV' })
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain('attachment');
    });

    it('should export products to Excel', async () => {
      const response = await request(app)
        .get('/api/v1/admin/products/export')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ format: 'XLSX' })
        .expect(200);

      expect(response.headers['content-type']).toContain('spreadsheet');
    });

    it('should support filtering products for export', async () => {
      const response = await request(app)
        .get('/api/v1/admin/products/export')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          format: 'CSV',
          categoryId: kitchenCategoryId,
          status: 'ACTIVE'
        })
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get('/api/v1/admin/products/export')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/v1/admin/products/inventory-report', () => {
    it('should get inventory report', async () => {
      const response = await request(app)
        .get('/api/v1/admin/products/inventory-report')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('totalProducts');
      expect(response.body.data).toHaveProperty('totalValue');
      expect(response.body.data).toHaveProperty('lowStockProducts');
      expect(response.body.data).toHaveProperty('outOfStockProducts');
    });

    it('should identify low stock products', async () => {
      const response = await request(app)
        .get('/api/v1/admin/products/inventory-report')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ lowStockThreshold: 10 })
        .expect(200);

      expect(response.body.data).toHaveProperty('lowStockProducts');
      expect(response.body.data.lowStockProducts).toBeInstanceOf(Array);
    });

    it('should group inventory by category', async () => {
      const response = await request(app)
        .get('/api/v1/admin/products/inventory-report')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ groupByCategory: true })
        .expect(200);

      expect(response.body.data).toHaveProperty('byCategory');
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get('/api/v1/admin/products/inventory-report')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/v1/admin/reviews/pending', () => {
    it('should get pending reviews for moderation', async () => {
      const response = await request(app)
        .get('/api/v1/admin/reviews/pending')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('reviews');
      expect(response.body.data.reviews).toBeInstanceOf(Array);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/v1/admin/reviews/pending')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 20 })
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get('/api/v1/admin/reviews/pending')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('PATCH /api/v1/admin/reviews/:reviewId/approve', () => {
    let reviewId: string;

    beforeEach(async () => {
      const review = await prisma.review.create({
        data: {
          productId: kitchenProductId,
          userId: testUserId,
          rating: 5,
          title: 'Pending Review',
          comment: 'This review is pending approval from admin',
          status: 'PENDING'
        }
      });
      reviewId = review.id;
    });

    it('should approve review', async () => {
      const response = await request(app)
        .patch(`/api/v1/admin/reviews/${reviewId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('status', 'APPROVED');
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .patch(`/api/v1/admin/reviews/${reviewId}/approve`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('PATCH /api/v1/admin/reviews/:reviewId/reject', () => {
    let reviewId: string;

    beforeEach(async () => {
      const review = await prisma.review.create({
        data: {
          productId: kitchenProductId,
          userId: testUserId,
          rating: 1,
          title: 'Inappropriate Review',
          comment: 'This review contains inappropriate content',
          status: 'PENDING'
        }
      });
      reviewId = review.id;
    });

    it('should reject review with reason', async () => {
      const response = await request(app)
        .patch(`/api/v1/admin/reviews/${reviewId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Contains inappropriate content'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('status', 'REJECTED');
      expect(response.body.data).toHaveProperty('rejectionReason');
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .patch(`/api/v1/admin/reviews/${reviewId}/reject`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reason: 'Test'
        })
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/v1/admin/dashboard/stats', () => {
    it('should get admin dashboard statistics', async () => {
      const response = await request(app)
        .get('/api/v1/admin/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('products');
      expect(response.body.data).toHaveProperty('categories');
      expect(response.body.data).toHaveProperty('reviews');
      expect(response.body.data).toHaveProperty('sales');
      expect(response.body.data).toHaveProperty('inventory');
    });

    it('should include recent activity', async () => {
      const response = await request(app)
        .get('/api/v1/admin/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ includeActivity: true })
        .expect(200);

      expect(response.body.data).toHaveProperty('recentActivity');
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get('/api/v1/admin/dashboard/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/v1/admin/products/:id/duplicate', () => {
    it('should duplicate product as admin', async () => {
      const response = await request(app)
        .post(`/api/v1/admin/products/${kitchenProductId}/duplicate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Luna White Kitchen - Copy'
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.id).not.toBe(kitchenProductId);
      expect(response.body.data).toHaveProperty('title', 'Luna White Kitchen - Copy');
    });

    it('should generate unique SKU for duplicate', async () => {
      const response = await request(app)
        .post(`/api/v1/admin/products/${kitchenProductId}/duplicate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(201);

      expect(response.body.data.sku).not.toBe(
        (await prisma.product.findUnique({ where: { id: kitchenProductId } })).sku
      );
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .post(`/api/v1/admin/products/${kitchenProductId}/duplicate`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      await prisma.$disconnect();

      const response = await request(app)
        .get('/api/v1/admin/products/inventory-report')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(500);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('database');

      await prisma.$connect();
    });

    it('should validate admin permissions on all routes', async () => {
      const adminRoutes = [
        { method: 'post', path: '/api/v1/admin/products' },
        { method: 'patch', path: `/api/v1/admin/products/${kitchenProductId}` },
        { method: 'delete', path: `/api/v1/admin/products/${kitchenProductId}` },
        { method: 'post', path: '/api/v1/admin/categories' },
        { method: 'post', path: '/api/v1/admin/colours' },
        { method: 'post', path: '/api/v1/admin/sales' }
      ];

      for (const route of adminRoutes) {
        const response = await request(app)
          [route.method](route.path)
          .set('Authorization', `Bearer ${authToken}`)
          .send({}) // Send minimal data
          .expect(403);

        expect(response.body.error.message).toContain('admin');
      }
    });
  });

  describe('Audit Logging', () => {
    it('should log product creation', async () => {
      const response = await request(app)
        .post('/api/v1/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Audit Test Product',
          description: 'Test',
          categoryId: kitchenCategoryId,
          price: 1000,
          stock: 10
        })
        .expect(201);

      // Verify audit log was created
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          entityType: 'PRODUCT',
          entityId: response.body.data.id,
          action: 'CREATE'
        }
      });

      expect(auditLog).not.toBeNull();
      expect(auditLog.userId).toBe(adminUserId);
    });

    it('should log product updates', async () => {
      await request(app)
        .patch(`/api/v1/admin/products/${kitchenProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          price: 7999.99
        });

      const auditLog = await prisma.auditLog.findFirst({
        where: {
          entityType: 'PRODUCT',
          entityId: kitchenProductId,
          action: 'UPDATE'
        },
        orderBy: { createdAt: 'desc' }
      });

      expect(auditLog).not.toBeNull();
      expect(auditLog.changes).toHaveProperty('price');
    });
  });
});