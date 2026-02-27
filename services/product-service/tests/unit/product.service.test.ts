

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { commonFixture } from '../fixtures/common.fixture';
import { productsFixture } from '../fixtures/products.fixture';

describe('Product Service - Unit Tests', () => {
  let productService: any;
  let mockProductRepository: any;
  let mockCategoryRepository: any;
  let mockColourRepository: any;
  let mockInventoryRepository: any;
  let mockEventProducer: any;
  let mockCacheClient: any;

  beforeEach(() => {
    mockProductRepository = {
      findById: jest.fn(),
      findBySlug: jest.fn(),
      findAll: jest.fn(),
      findByCategory: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      softDelete: jest.fn(),
      restore: jest.fn(),
      count: jest.fn(),
      search: jest.fn(),
      findFeatured: jest.fn(),
      findByColour: jest.fn(),
      findByPriceRange: jest.fn(),
    };

    mockCategoryRepository = {
      findById: jest.fn(),
      findBySlug: jest.fn(),
      findAll: jest.fn(),
    };

    mockColourRepository = {
      findById: jest.fn(),
      findByIds: jest.fn(),
      findAll: jest.fn(),
    };

    mockInventoryRepository = {
      findByProductId: jest.fn(),
      updateStock: jest.fn(),
      checkAvailability: jest.fn(),
    };

    mockEventProducer = {
      publish: jest.fn(),
    };

    mockCacheClient = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      flush: jest.fn(),
    };

    productService = {
      findById: async (id: string) => {
        const cacheKey = `product:${id}`;
        const cached = await mockCacheClient.get(cacheKey);
        if (cached) return cached;

        const product = await mockProductRepository.findById(id);
        if (!product) return null;

        await mockCacheClient.set(cacheKey, product, 3600);
        return product;
      },

      findBySlug: async (slug: string) => {
        const cacheKey = `product:slug:${slug}`;
        const cached = await mockCacheClient.get(cacheKey);
        if (cached) return cached;

        const product = await mockProductRepository.findBySlug(slug);
        if (!product) return null;

        await mockCacheClient.set(cacheKey, product, 3600);
        return product;
      },

      findAll: async (params: any) => {
        const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = params;
        const skip = (page - 1) * limit;

        const [products, total] = await Promise.all([
          mockProductRepository.findAll({ skip, take: limit, sortBy, sortOrder }),
          mockProductRepository.count(),
        ]);

        return {
          data: products,
          meta: commonFixture.generatePaginationMeta({ page, limit, total }),
        };
      },

      findByCategory: async (category: string, params: any) => {
        const { page = 1, limit = 10 } = params;
        const skip = (page - 1) * limit;

        const [products, total] = await Promise.all([
          mockProductRepository.findByCategory(category, { skip, take: limit }),
          mockProductRepository.count(),
        ]);

        return {
          data: products,
          meta: commonFixture.generatePaginationMeta({ page, limit, total }),
        };
      },

      create: async (data: any) => {
        if (data.colourIds && data.colourIds.length > 0) {
          const colours = await mockColourRepository.findByIds(data.colourIds);
          if (colours.length !== data.colourIds.length) {
            throw new Error('Some colours not found');
          }
        }

        const product = await mockProductRepository.create(data);

        await mockEventProducer.publish('product.created', {
          productId: product.id,
          category: product.category,
          timestamp: new Date(),
        });

        await mockCacheClient.del('products:*');

        return product;
      },

      update: async (id: string, data: any) => {
        const existing = await mockProductRepository.findById(id);
        if (!existing) {
          throw new Error('Product not found');
        }

        if (data.colourIds && data.colourIds.length > 0) {
          const colours = await mockColourRepository.findByIds(data.colourIds);
          if (colours.length !== data.colourIds.length) {
            throw new Error('Some colours not found');
          }
        }

        const updated = await mockProductRepository.update(id, data);

        await mockEventProducer.publish('product.updated', {
          productId: updated.id,
          changes: data,
          timestamp: new Date(),
        });

        await mockCacheClient.del(`product:${id}`);
        await mockCacheClient.del(`product:slug:${updated.slug}`);

        return updated;
      },

      delete: async (id: string) => {
        const product = await mockProductRepository.findById(id);
        if (!product) {
          throw new Error('Product not found');
        }

        await mockProductRepository.delete(id);

        await mockEventProducer.publish('product.deleted', {
          productId: id,
          timestamp: new Date(),
        });

        await mockCacheClient.del(`product:${id}`);
        await mockCacheClient.del(`product:slug:${product.slug}`);

        return { success: true };
      },

      softDelete: async (id: string, deletedBy: string) => {
        const product = await mockProductRepository.findById(id);
        if (!product) {
          throw new Error('Product not found');
        }

        const deleted = await mockProductRepository.softDelete(id, deletedBy);

        await mockEventProducer.publish('product.soft_deleted', {
          productId: id,
          deletedBy,
          timestamp: new Date(),
        });

        await mockCacheClient.del(`product:${id}`);

        return deleted;
      },

      restore: async (id: string) => {
        const restored = await mockProductRepository.restore(id);
        if (!restored) {
          throw new Error('Product not found or not deleted');
        }

        await mockEventProducer.publish('product.restored', {
          productId: id,
          timestamp: new Date(),
        });

        await mockCacheClient.del(`product:${id}`);

        return restored;
      },

      search: async (query: string, params: any) => {
        const { page = 1, limit = 10 } = params;
        const skip = (page - 1) * limit;

        const products = await mockProductRepository.search(query, { skip, take: limit });
        const total = products.length;

        return {
          data: products,
          meta: commonFixture.generatePaginationMeta({ page, limit, total }),
        };
      },

      findFeatured: async (params: any) => {
        const { page = 1, limit = 10 } = params;
        const skip = (page - 1) * limit;

        const products = await mockProductRepository.findFeatured({ skip, take: limit });

        return {
          data: products,
          meta: commonFixture.generatePaginationMeta({ page, limit, total: products.length }),
        };
      },

      filterProducts: async (filters: any, params: any) => {
        const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = params;
        const skip = (page - 1) * limit;

        let products = await mockProductRepository.findAll({ skip, take: limit, sortBy, sortOrder });

        if (filters.category) {
          products = products.filter((p: any) => p.category === filters.category);
        }

        if (filters.style) {
          products = products.filter((p: any) => p.style === filters.style);
        }

        if (filters.finish) {
          products = products.filter((p: any) => p.finish === filters.finish);
        }

        if (filters.rangeName) {
          products = products.filter((p: any) => p.rangeName === filters.rangeName);
        }

        if (filters.minPrice !== undefined) {
          products = products.filter((p: any) => p.price >= filters.minPrice);
        }

        if (filters.maxPrice !== undefined) {
          products = products.filter((p: any) => p.price <= filters.maxPrice);
        }

        if (filters.colourIds && filters.colourIds.length > 0) {
          products = products.filter((p: any) =>
            p.colours?.some((c: any) => filters.colourIds.includes(c.id))
          );
        }

        if (filters.inStock) {
          products = products.filter((p: any) => p.stock > 0);
        }

        return {
          data: products,
          meta: commonFixture.generatePaginationMeta({ page, limit, total: products.length }),
        };
      },

      updateInventory: async (productId: string, quantity: number) => {
        const product = await mockProductRepository.findById(productId);
        if (!product) {
          throw new Error('Product not found');
        }

        const inventory = await mockInventoryRepository.updateStock(productId, quantity);

        await mockEventProducer.publish('inventory.updated', {
          productId,
          quantity,
          timestamp: new Date(),
        });

        await mockCacheClient.del(`product:${productId}`);

        return inventory;
      },

      checkAvailability: async (productId: string, quantity: number) => {
        const inventory = await mockInventoryRepository.findByProductId(productId);
        if (!inventory) {
          return false;
        }

        return inventory.quantity >= quantity;
      },
    };

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('findById', () => {
    it('should find product by id successfully', async () => {
      const productId = commonFixture.generateId();
      const mockProduct = productsFixture.generateProduct({ id: productId });

      mockCacheClient.get.mockResolvedValue(null);
      mockProductRepository.findById.mockResolvedValue(mockProduct);
      mockCacheClient.set.mockResolvedValue(true);

      const result = await productService.findById(productId);

      expect(result).toEqual(mockProduct);
      expect(mockProductRepository.findById).toHaveBeenCalledWith(productId);
      expect(mockCacheClient.set).toHaveBeenCalledWith(
        `product:${productId}`,
        mockProduct,
        3600
      );
    });

    it('should return cached product if available', async () => {
      const productId = commonFixture.generateId();
      const mockProduct = productsFixture.generateProduct({ id: productId });

      mockCacheClient.get.mockResolvedValue(mockProduct);

      const result = await productService.findById(productId);

      expect(result).toEqual(mockProduct);
      expect(mockCacheClient.get).toHaveBeenCalledWith(`product:${productId}`);
      expect(mockProductRepository.findById).not.toHaveBeenCalled();
    });

    it('should return null when product not found', async () => {
      const productId = commonFixture.generateId();

      mockCacheClient.get.mockResolvedValue(null);
      mockProductRepository.findById.mockResolvedValue(null);

      const result = await productService.findById(productId);

      expect(result).toBeNull();
    });

    it('should handle repository errors', async () => {
      const productId = commonFixture.generateId();

      mockCacheClient.get.mockResolvedValue(null);
      mockProductRepository.findById.mockRejectedValue(new Error('Database error'));

      await expect(productService.findById(productId)).rejects.toThrow('Database error');
    });
  });

  describe('findBySlug', () => {
    it('should find product by slug successfully', async () => {
      const slug = 'test-product-slug';
      const mockProduct = productsFixture.generateProduct({ slug });

      mockCacheClient.get.mockResolvedValue(null);
      mockProductRepository.findBySlug.mockResolvedValue(mockProduct);
      mockCacheClient.set.mockResolvedValue(true);

      const result = await productService.findBySlug(slug);

      expect(result).toEqual(mockProduct);
      expect(mockProductRepository.findBySlug).toHaveBeenCalledWith(slug);
      expect(mockCacheClient.set).toHaveBeenCalledWith(
        `product:slug:${slug}`,
        mockProduct,
        3600
      );
    });

    it('should return cached product by slug', async () => {
      const slug = 'test-product-slug';
      const mockProduct = productsFixture.generateProduct({ slug });

      mockCacheClient.get.mockResolvedValue(mockProduct);

      const result = await productService.findBySlug(slug);

      expect(result).toEqual(mockProduct);
      expect(mockProductRepository.findBySlug).not.toHaveBeenCalled();
    });

    it('should return null when slug not found', async () => {
      const slug = 'non-existent-slug';

      mockCacheClient.get.mockResolvedValue(null);
      mockProductRepository.findBySlug.mockResolvedValue(null);

      const result = await productService.findBySlug(slug);

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return paginated products', async () => {
      const mockProducts = productsFixture.generateProducts(10);
      const params = { page: 1, limit: 10 };

      mockProductRepository.findAll.mockResolvedValue(mockProducts);
      mockProductRepository.count.mockResolvedValue(25);

      const result = await productService.findAll(params);

      expect(result.data).toEqual(mockProducts);
      expect(result.meta).toHaveProperty('page', 1);
      expect(result.meta).toHaveProperty('limit', 10);
      expect(result.meta).toHaveProperty('total', 25);
      expect(result.meta).toHaveProperty('totalPages', 3);
    });

    it('should handle empty results', async () => {
      mockProductRepository.findAll.mockResolvedValue([]);
      mockProductRepository.count.mockResolvedValue(0);

      const result = await productService.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
    });

    it('should apply sorting parameters', async () => {
      const mockProducts = productsFixture.generateProducts(5);
      const params = { page: 1, limit: 10, sortBy: 'price', sortOrder: 'asc' };

      mockProductRepository.findAll.mockResolvedValue(mockProducts);
      mockProductRepository.count.mockResolvedValue(5);

      await productService.findAll(params);

      expect(mockProductRepository.findAll).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        sortBy: 'price',
        sortOrder: 'asc',
      });
    });

    it('should use default pagination values', async () => {
      const mockProducts = productsFixture.generateProducts(10);

      mockProductRepository.findAll.mockResolvedValue(mockProducts);
      mockProductRepository.count.mockResolvedValue(10);

      const result = await productService.findAll({});

      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
    });
  });

  describe('findByCategory', () => {
    it('should find products by KITCHEN category', async () => {
      const mockProducts = productsFixture.generateProductsByCategory('KITCHEN', 5);

      mockProductRepository.findByCategory.mockResolvedValue(mockProducts);
      mockProductRepository.count.mockResolvedValue(5);

      const result = await productService.findByCategory('KITCHEN', { page: 1, limit: 10 });

      expect(result.data).toEqual(mockProducts);
      expect(mockProductRepository.findByCategory).toHaveBeenCalledWith('KITCHEN', {
        skip: 0,
        take: 10,
      });
    });

    it('should find products by BEDROOM category', async () => {
      const mockProducts = productsFixture.generateProductsByCategory('BEDROOM', 3);

      mockProductRepository.findByCategory.mockResolvedValue(mockProducts);
      mockProductRepository.count.mockResolvedValue(3);

      const result = await productService.findByCategory('BEDROOM', { page: 1, limit: 10 });

      expect(result.data).toEqual(mockProducts);
    });

    it('should return empty array for category with no products', async () => {
      mockProductRepository.findByCategory.mockResolvedValue([]);
      mockProductRepository.count.mockResolvedValue(0);

      const result = await productService.findByCategory('KITCHEN', { page: 1, limit: 10 });

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
    });
  });

  describe('create', () => {
    it('should create product successfully', async () => {
      const productData = {
        title: 'New Kitchen Product',
        description: 'Test description',
        category: 'KITCHEN',
        price: 1500,
        colourIds: [commonFixture.generateId()],
      };

      const mockColours = [{ id: productData.colourIds[0], name: 'White', hexCode: '#FFFFFF' }];
      const mockProduct = productsFixture.generateProduct(productData);

      mockColourRepository.findByIds.mockResolvedValue(mockColours);
      mockProductRepository.create.mockResolvedValue(mockProduct);
      mockEventProducer.publish.mockResolvedValue(true);
      mockCacheClient.del.mockResolvedValue(true);

      const result = await productService.create(productData);

      expect(result).toEqual(mockProduct);
      expect(mockColourRepository.findByIds).toHaveBeenCalledWith(productData.colourIds);
      expect(mockProductRepository.create).toHaveBeenCalledWith(productData);
      expect(mockEventProducer.publish).toHaveBeenCalledWith('product.created', expect.any(Object));
      expect(mockCacheClient.del).toHaveBeenCalledWith('products:*');
    });

    it('should create product without colours', async () => {
      const productData = {
        title: 'New Product',
        description: 'Test description',
        category: 'BEDROOM',
        price: 2000,
      };

      const mockProduct = productsFixture.generateProduct(productData);

      mockProductRepository.create.mockResolvedValue(mockProduct);
      mockEventProducer.publish.mockResolvedValue(true);
      mockCacheClient.del.mockResolvedValue(true);

      const result = await productService.create(productData);

      expect(result).toEqual(mockProduct);
      expect(mockColourRepository.findByIds).not.toHaveBeenCalled();
    });

    it('should throw error when colours not found', async () => {
      const productData = {
        title: 'New Product',
        category: 'KITCHEN',
        price: 1500,
        colourIds: [commonFixture.generateId(), commonFixture.generateId()],
      };

      mockColourRepository.findByIds.mockResolvedValue([]);

      await expect(productService.create(productData)).rejects.toThrow('Some colours not found');
    });

    it('should publish event after creation', async () => {
      const productData = {
        title: 'New Product',
        category: 'KITCHEN',
        price: 1500,
      };

      const mockProduct = productsFixture.generateProduct(productData);

      mockProductRepository.create.mockResolvedValue(mockProduct);
      mockEventProducer.publish.mockResolvedValue(true);

      await productService.create(productData);

      expect(mockEventProducer.publish).toHaveBeenCalledWith('product.created', {
        productId: mockProduct.id,
        category: mockProduct.category,
        timestamp: expect.any(Date),
      });
    });

    it('should invalidate cache after creation', async () => {
      const productData = {
        title: 'New Product',
        category: 'KITCHEN',
        price: 1500,
      };

      const mockProduct = productsFixture.generateProduct(productData);

      mockProductRepository.create.mockResolvedValue(mockProduct);
      mockEventProducer.publish.mockResolvedValue(true);
      mockCacheClient.del.mockResolvedValue(true);

      await productService.create(productData);

      expect(mockCacheClient.del).toHaveBeenCalledWith('products:*');
    });
  });

  describe('update', () => {
    it('should update product successfully', async () => {
      const productId = commonFixture.generateId();
      const existingProduct = productsFixture.generateProduct({ id: productId });
      const updateData = {
        title: 'Updated Title',
        price: 2500,
      };
      const updatedProduct = { ...existingProduct, ...updateData };

      mockProductRepository.findById.mockResolvedValue(existingProduct);
      mockProductRepository.update.mockResolvedValue(updatedProduct);
      mockEventProducer.publish.mockResolvedValue(true);
      mockCacheClient.del.mockResolvedValue(true);

      const result = await productService.update(productId, updateData);

      expect(result).toEqual(updatedProduct);
      expect(mockProductRepository.update).toHaveBeenCalledWith(productId, updateData);
    });

    it('should throw error when product not found', async () => {
      const productId = commonFixture.generateId();
      const updateData = { title: 'Updated Title' };

      mockProductRepository.findById.mockResolvedValue(null);

      await expect(productService.update(productId, updateData)).rejects.toThrow('Product not found');
    });

    it('should validate colours on update', async () => {
      const productId = commonFixture.generateId();
      const existingProduct = productsFixture.generateProduct({ id: productId });
      const colourIds = [commonFixture.generateId()];
      const updateData = { colourIds };
      const mockColours = [{ id: colourIds[0], name: 'Black', hexCode: '#000000' }];

      mockProductRepository.findById.mockResolvedValue(existingProduct);
      mockColourRepository.findByIds.mockResolvedValue(mockColours);
      mockProductRepository.update.mockResolvedValue({ ...existingProduct, ...updateData });
      mockEventProducer.publish.mockResolvedValue(true);
      mockCacheClient.del.mockResolvedValue(true);

      await productService.update(productId, updateData);

      expect(mockColourRepository.findByIds).toHaveBeenCalledWith(colourIds);
    });

    it('should publish update event', async () => {
      const productId = commonFixture.generateId();
      const existingProduct = productsFixture.generateProduct({ id: productId });
      const updateData = { title: 'Updated Title' };

      mockProductRepository.findById.mockResolvedValue(existingProduct);
      mockProductRepository.update.mockResolvedValue({ ...existingProduct, ...updateData });
      mockEventProducer.publish.mockResolvedValue(true);
      mockCacheClient.del.mockResolvedValue(true);

      await productService.update(productId, updateData);

      expect(mockEventProducer.publish).toHaveBeenCalledWith('product.updated', {
        productId,
        changes: updateData,
        timestamp: expect.any(Date),
      });
    });

    it('should invalidate cache after update', async () => {
      const productId = commonFixture.generateId();
      const slug = 'test-slug';
      const existingProduct = productsFixture.generateProduct({ id: productId, slug });
      const updateData = { title: 'Updated Title' };

      mockProductRepository.findById.mockResolvedValue(existingProduct);
      mockProductRepository.update.mockResolvedValue({ ...existingProduct, ...updateData });
      mockEventProducer.publish.mockResolvedValue(true);
      mockCacheClient.del.mockResolvedValue(true);

      await productService.update(productId, updateData);

      expect(mockCacheClient.del).toHaveBeenCalledWith(`product:${productId}`);
      expect(mockCacheClient.del).toHaveBeenCalledWith(`product:slug:${slug}`);
    });
  });

  describe('delete', () => {
    it('should delete product successfully', async () => {
      const productId = commonFixture.generateId();
      const mockProduct = productsFixture.generateProduct({ id: productId });

      mockProductRepository.findById.mockResolvedValue(mockProduct);
      mockProductRepository.delete.mockResolvedValue(undefined);
      mockEventProducer.publish.mockResolvedValue(true);
      mockCacheClient.del.mockResolvedValue(true);

      const result = await productService.delete(productId);

      expect(result).toEqual({ success: true });
      expect(mockProductRepository.delete).toHaveBeenCalledWith(productId);
    });

    it('should throw error when product not found', async () => {
      const productId = commonFixture.generateId();

      mockProductRepository.findById.mockResolvedValue(null);

      await expect(productService.delete(productId)).rejects.toThrow('Product not found');
    });

    it('should publish delete event', async () => {
      const productId = commonFixture.generateId();
      const mockProduct = productsFixture.generateProduct({ id: productId });

      mockProductRepository.findById.mockResolvedValue(mockProduct);
      mockProductRepository.delete.mockResolvedValue(undefined);
      mockEventProducer.publish.mockResolvedValue(true);
      mockCacheClient.del.mockResolvedValue(true);

      await productService.delete(productId);

      expect(mockEventProducer.publish).toHaveBeenCalledWith('product.deleted', {
        productId,
        timestamp: expect.any(Date),
      });
    });

    it('should invalidate cache after deletion', async () => {
      const productId = commonFixture.generateId();
      const slug = 'test-product';
      const mockProduct = productsFixture.generateProduct({ id: productId, slug });

      mockProductRepository.findById.mockResolvedValue(mockProduct);
      mockProductRepository.delete.mockResolvedValue(undefined);
      mockEventProducer.publish.mockResolvedValue(true);
      mockCacheClient.del.mockResolvedValue(true);

      await productService.delete(productId);

      expect(mockCacheClient.del).toHaveBeenCalledWith(`product:${productId}`);
      expect(mockCacheClient.del).toHaveBeenCalledWith(`product:slug:${slug}`);
    });
  });

  describe('softDelete', () => {
    it('should soft delete product successfully', async () => {
      const productId = commonFixture.generateId();
      const deletedBy = commonFixture.generateId();
      const mockProduct = productsFixture.generateProduct({ id: productId });
      const deletedProduct = { ...mockProduct, deletedAt: new Date(), deletedBy };

      mockProductRepository.findById.mockResolvedValue(mockProduct);
      mockProductRepository.softDelete.mockResolvedValue(deletedProduct);
      mockEventProducer.publish.mockResolvedValue(true);
      mockCacheClient.del.mockResolvedValue(true);

      const result = await productService.softDelete(productId, deletedBy);

      expect(result).toEqual(deletedProduct);
      expect(mockProductRepository.softDelete).toHaveBeenCalledWith(productId, deletedBy);
    });

    it('should throw error when product not found for soft delete', async () => {
      const productId = commonFixture.generateId();
      const deletedBy = commonFixture.generateId();

      mockProductRepository.findById.mockResolvedValue(null);

      await expect(productService.softDelete(productId, deletedBy)).rejects.toThrow('Product not found');
    });

    it('should publish soft delete event', async () => {
      const productId = commonFixture.generateId();
      const deletedBy = commonFixture.generateId();
      const mockProduct = productsFixture.generateProduct({ id: productId });

      mockProductRepository.findById.mockResolvedValue(mockProduct);
      mockProductRepository.softDelete.mockResolvedValue({ ...mockProduct, deletedAt: new Date() });
      mockEventProducer.publish.mockResolvedValue(true);
      mockCacheClient.del.mockResolvedValue(true);

      await productService.softDelete(productId, deletedBy);

      expect(mockEventProducer.publish).toHaveBeenCalledWith('product.soft_deleted', {
        productId,
        deletedBy,
        timestamp: expect.any(Date),
      });
    });
  });

  describe('restore', () => {
    it('should restore soft deleted product', async () => {
      const productId = commonFixture.generateId();
      const mockProduct = productsFixture.generateProduct({ id: productId, deletedAt: null });

      mockProductRepository.restore.mockResolvedValue(mockProduct);
      mockEventProducer.publish.mockResolvedValue(true);
      mockCacheClient.del.mockResolvedValue(true);

      const result = await productService.restore(productId);

      expect(result).toEqual(mockProduct);
      expect(mockProductRepository.restore).toHaveBeenCalledWith(productId);
    });

    it('should throw error when product cannot be restored', async () => {
      const productId = commonFixture.generateId();

      mockProductRepository.restore.mockResolvedValue(null);

      await expect(productService.restore(productId)).rejects.toThrow('Product not found or not deleted');
    });

    it('should publish restore event', async () => {
      const productId = commonFixture.generateId();
      const mockProduct = productsFixture.generateProduct({ id: productId });

      mockProductRepository.restore.mockResolvedValue(mockProduct);
      mockEventProducer.publish.mockResolvedValue(true);
      mockCacheClient.del.mockResolvedValue(true);

      await productService.restore(productId);

      expect(mockEventProducer.publish).toHaveBeenCalledWith('product.restored', {
        productId,
        timestamp: expect.any(Date),
      });
    });
  });

  describe('search', () => {
    it('should search products by query', async () => {
      const query = 'kitchen';
      const mockProducts = productsFixture.generateProducts(5);

      mockProductRepository.search.mockResolvedValue(mockProducts);

      const result = await productService.search(query, { page: 1, limit: 10 });

      expect(result.data).toEqual(mockProducts);
      expect(mockProductRepository.search).toHaveBeenCalledWith(query, { skip: 0, take: 10 });
    });

    it('should return empty results for no matches', async () => {
      const query = 'nonexistent';

      mockProductRepository.search.mockResolvedValue([]);

      const result = await productService.search(query, { page: 1, limit: 10 });

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
    });
  });

  describe('filterProducts', () => {
    it('should filter by category', async () => {
      const mockProducts = productsFixture.generateProductsByCategory('KITCHEN', 10);

      mockProductRepository.findAll.mockResolvedValue(mockProducts);

      const result = await productService.filterProducts(
        { category: 'KITCHEN' },
        { page: 1, limit: 10 }
      );

      expect(result.data.every((p: any) => p.category === 'KITCHEN')).toBe(true);
    });

    it('should filter by price range', async () => {
      const mockProducts = productsFixture.generateProducts(10);

      mockProductRepository.findAll.mockResolvedValue(mockProducts);

      const result = await productService.filterProducts(
        { minPrice: 1000, maxPrice: 5000 },
        { page: 1, limit: 10 }
      );

      expect(result.data.every((p: any) => p.price >= 1000 && p.price <= 5000)).toBe(true);
    });

    it('should filter by multiple criteria', async () => {
      const mockProducts = productsFixture.generateProductsByCategory('BEDROOM', 10);

      mockProductRepository.findAll.mockResolvedValue(mockProducts);

      const result = await productService.filterProducts(
        {
          category: 'BEDROOM',
          style: 'Modern',
          minPrice: 1000,
        },
        { page: 1, limit: 10 }
      );

      expect(result.data.every((p: any) => p.category === 'BEDROOM')).toBe(true);
    });

    it('should filter by in stock status', async () => {
      const mockProducts = productsFixture.generateProducts(10);

      mockProductRepository.findAll.mockResolvedValue(mockProducts);

      const result = await productService.filterProducts(
        { inStock: true },
        { page: 1, limit: 10 }
      );

      expect(result.data.every((p: any) => p.stock > 0)).toBe(true);
    });
  });

  describe('updateInventory', () => {
    it('should update product inventory', async () => {
      const productId = commonFixture.generateId();
      const quantity = 50;
      const mockProduct = productsFixture.generateProduct({ id: productId });
      const mockInventory = { productId, quantity, updatedAt: new Date() };

      mockProductRepository.findById.mockResolvedValue(mockProduct);
      mockInventoryRepository.updateStock.mockResolvedValue(mockInventory);
      mockEventProducer.publish.mockResolvedValue(true);
      mockCacheClient.del.mockResolvedValue(true);

      const result = await productService.updateInventory(productId, quantity);

      expect(result).toEqual(mockInventory);
      expect(mockInventoryRepository.updateStock).toHaveBeenCalledWith(productId, quantity);
    });

    it('should throw error when updating inventory for non-existent product', async () => {
      const productId = commonFixture.generateId();

      mockProductRepository.findById.mockResolvedValue(null);

      await expect(productService.updateInventory(productId, 50)).rejects.toThrow('Product not found');
    });

    it('should publish inventory update event', async () => {
      const productId = commonFixture.generateId();
      const quantity = 30;
      const mockProduct = productsFixture.generateProduct({ id: productId });
      const mockInventory = { productId, quantity };

      mockProductRepository.findById.mockResolvedValue(mockProduct);
      mockInventoryRepository.updateStock.mockResolvedValue(mockInventory);
      mockEventProducer.publish.mockResolvedValue(true);
      mockCacheClient.del.mockResolvedValue(true);

      await productService.updateInventory(productId, quantity);

      expect(mockEventProducer.publish).toHaveBeenCalledWith('inventory.updated', {
        productId,
        quantity,
        timestamp: expect.any(Date),
      });
    });
  });

  describe('checkAvailability', () => {
    it('should return true when sufficient stock available', async () => {
      const productId = commonFixture.generateId();
      const mockInventory = { productId, quantity: 100 };

      mockInventoryRepository.findByProductId.mockResolvedValue(mockInventory);

      const result = await productService.checkAvailability(productId, 50);

      expect(result).toBe(true);
    });

    it('should return false when insufficient stock', async () => {
      const productId = commonFixture.generateId();
      const mockInventory = { productId, quantity: 10 };

      mockInventoryRepository.findByProductId.mockResolvedValue(mockInventory);

      const result = await productService.checkAvailability(productId, 50);

      expect(result).toBe(false);
    });

    it('should return false when no inventory found', async () => {
      const productId = commonFixture.generateId();

      mockInventoryRepository.findByProductId.mockResolvedValue(null);

      const result = await productService.checkAvailability(productId, 50);

      expect(result).toBe(false);
    });

    it('should return true when exact quantity available', async () => {
      const productId = commonFixture.generateId();
      const mockInventory = { productId, quantity: 50 };

      mockInventoryRepository.findByProductId.mockResolvedValue(mockInventory);

      const result = await productService.checkAvailability(productId, 50);

      expect(result).toBe(true);
    });
  });
});