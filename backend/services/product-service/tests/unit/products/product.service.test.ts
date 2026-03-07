import { ProductService } from '../../src/products/product.service';
import { ApiResponse } from '../../../../../packages/api-client/src/types/api.types';

describe('ProductService', () => {
  let productService: ProductService;

  beforeEach(() => {
    productService = new ProductService();
  });

  describe('getProducts', () => {
    it('should return paginated products', async () => {
      const params = {
        page: 1,
        limit: 10,
        filters: {},
      };

      const result = await productService.getProducts(params);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.pagination).toBeDefined();
      expect(result.pagination?.page).toBe(1);
      expect(result.pagination?.limit).toBe(10);
    });

    it('should filter products by category', async () => {
      const params = {
        page: 1,
        limit: 10,
        filters: {
          category: 'KITCHEN',
        },
      };

      const result = await productService.getProducts(params);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      // All products should be from KITCHEN category
      result.data?.forEach(product => {
        expect(product.category).toBe('KITCHEN');
      });
    });

    it('should search products by name', async () => {
      const params = {
        page: 1,
        limit: 10,
        filters: {
          search: 'Modern',
        },
      };

      const result = await productService.getProducts(params);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe('getProduct', () => {
    it('should return a product by ID', async () => {
      // First get all products to find a valid ID
      const productsResult = await productService.getProducts({
        page: 1,
        limit: 1,
        filters: {},
      });

      if (productsResult.success && productsResult.data && productsResult.data.length > 0) {
        const productId = productsResult.data[0].id;
        const result = await productService.getProduct(productId);

        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data?.id).toBe(productId);
      }
    });

    it('should return error for non-existent product', async () => {
      const result = await productService.getProduct('non-existent-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('PRODUCT_NOT_FOUND');
    });
  });

  describe('createProduct', () => {
    it('should create a new product', async () => {
      const productData = {
        name: 'Test Product',
        description: 'A test product',
        price: 999.99,
        category: 'KITCHEN',
        images: ['/images/test.jpg'],
        specifications: {
          material: 'Oak',
          dimensions: '200x100x60cm',
        },
      };

      const result = await productService.createProduct(productData);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.name).toBe(productData.name);
      expect(result.data?.price).toBe(productData.price);
    });
  });

  describe('updateProduct', () => {
    it('should update an existing product', async () => {
      // First create a product
      const createResult = await productService.createProduct({
        name: 'Original Product',
        description: 'Original description',
        price: 999.99,
        category: 'KITCHEN',
        images: ['/images/original.jpg'],
      });

      if (createResult.success && createResult.data) {
        const updateData = {
          name: 'Updated Product',
          price: 1299.99,
        };

        const result = await productService.updateProduct(createResult.data.id, updateData);

        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data?.name).toBe(updateData.name);
        expect(result.data?.price).toBe(updateData.price);
      }
    });
  });

  describe('deleteProduct', () => {
    it('should delete an existing product', async () => {
      // First create a product
      const createResult = await productService.createProduct({
        name: 'Product to Delete',
        description: 'This product will be deleted',
        price: 999.99,
        category: 'KITCHEN',
        images: ['/images/delete.jpg'],
      });

      if (createResult.success && createResult.data) {
        const result = await productService.deleteProduct(createResult.data.id);

        expect(result.success).toBe(true);
        expect(result.message).toBe('Product deleted successfully');
      }
    });
  });
});
