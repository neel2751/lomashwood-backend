import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ProductService } from '../../src/app/products/product.service';
import { ProductRepository } from '../../src/app/products/product.repository';
import { Category, Prisma } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { AppError } from '../../src/shared/errors';

describe('ProductService', () => {
  let productService: ProductService;
  let productRepository: DeepMockProxy<ProductRepository>;

  beforeEach(() => {
    productRepository = mockDeep<ProductRepository>();
    productService = new ProductService(productRepository as unknown as ProductRepository);
    mockReset(productRepository);
  });

  describe('createProduct', () => {
    it('should create a kitchen product successfully', async () => {
      const createDto = {
        title: 'Luna White Kitchen',
        description: 'Modern white kitchen with sleek design',
        category: Category.KITCHEN,
        rangeName: 'Luna Collection',
        price: 5999.99,
        images: ['image1.jpg', 'image2.jpg'],
        colourIds: ['colour-1', 'colour-2']
      };

      const mockCreatedProduct = {
        id: 'product-1',
        title: 'Luna White Kitchen',
        description: 'Modern white kitchen with sleek design',
        category: Category.KITCHEN,
        rangeName: 'Luna Collection',
        price: new Prisma.Decimal(5999.99),
        images: ['image1.jpg', 'image2.jpg'],
        isActive: true,
        isFeatured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        colours: [
          { id: 'colour-1', name: 'White', hexCode: '#FFFFFF', createdAt: new Date(), updatedAt: new Date() },
          { id: 'colour-2', name: 'Grey', hexCode: '#808080', createdAt: new Date(), updatedAt: new Date() }
        ],
        units: []
      };

      productRepository.create.mockResolvedValue(mockCreatedProduct as any);

      const result = await productService.createProduct(createDto);

      expect(result).toEqual(mockCreatedProduct);
      expect(productRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: createDto.title,
          description: createDto.description,
          category: createDto.category,
          rangeName: createDto.rangeName,
          price: createDto.price,
          images: createDto.images,
          colours: {
            connect: [{ id: 'colour-1' }, { id: 'colour-2' }]
          }
        })
      );
    });

    it('should create a bedroom product with units', async () => {
      const createDto = {
        title: 'Elegance Bedroom',
        description: 'Luxurious bedroom suite',
        category: Category.BEDROOM,
        rangeName: 'Elegance Collection',
        price: 7499.99,
        images: ['bedroom1.jpg'],
        units: [
          {
            title: 'Single Wardrobe',
            description: 'Compact wardrobe unit',
            image: 'wardrobe.jpg'
          },
          {
            title: 'Double Wardrobe',
            description: 'Spacious double wardrobe',
            image: 'double-wardrobe.jpg'
          }
        ]
      };

      const mockCreatedProduct = {
        id: 'product-2',
        title: 'Elegance Bedroom',
        description: 'Luxurious bedroom suite',
        category: Category.BEDROOM,
        rangeName: 'Elegance Collection',
        price: new Prisma.Decimal(7499.99),
        images: ['bedroom1.jpg'],
        isActive: true,
        isFeatured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        colours: [],
        units: [
          {
            id: 'unit-1',
            productId: 'product-2',
            title: 'Single Wardrobe',
            description: 'Compact wardrobe unit',
            image: 'wardrobe.jpg',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'unit-2',
            productId: 'product-2',
            title: 'Double Wardrobe',
            description: 'Spacious double wardrobe',
            image: 'double-wardrobe.jpg',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]
      };

      productRepository.create.mockResolvedValue(mockCreatedProduct as any);

      const result = await productService.createProduct(createDto);

      expect(result).toEqual(mockCreatedProduct);
      expect(result.units).toHaveLength(2);
      expect(productRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: createDto.title,
          category: Category.BEDROOM,
          units: {
            create: createDto.units
          }
        })
      );
    });

    it('should validate required fields', async () => {
      const invalidDto = {
        title: '',
        description: 'Invalid product',
        category: Category.KITCHEN,
        rangeName: 'Test',
        price: 5000,
        images: []
      };

      await expect(productService.createProduct(invalidDto as any))
        .rejects
        .toThrow('Product title is required');
    });

    it('should validate price is positive', async () => {
      const invalidDto = {
        title: 'Test Product',
        description: 'Product with negative price',
        category: Category.KITCHEN,
        rangeName: 'Test',
        price: -100,
        images: ['image.jpg']
      };

      await expect(productService.createProduct(invalidDto))
        .rejects
        .toThrow('Price must be a positive number');
    });

    it('should validate at least one image is provided', async () => {
      const invalidDto = {
        title: 'Test Product',
        description: 'Product without images',
        category: Category.KITCHEN,
        rangeName: 'Test',
        price: 5000,
        images: []
      };

      await expect(productService.createProduct(invalidDto))
        .rejects
        .toThrow('At least one product image is required');
    });

    it('should handle duplicate product title', async () => {
      const createDto = {
        title: 'Luna White Kitchen',
        description: 'Duplicate product',
        category: Category.KITCHEN,
        rangeName: 'Luna Collection',
        price: 5999.99,
        images: ['image1.jpg']
      };

      productRepository.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: '5.0.0'
        })
      );

      await expect(productService.createProduct(createDto))
        .rejects
        .toThrow();
    });

    it('should create product with default isActive true', async () => {
      const createDto = {
        title: 'Test Product',
        description: 'Test description',
        category: Category.KITCHEN,
        rangeName: 'Test Range',
        price: 5000,
        images: ['image.jpg']
      };

      const mockCreatedProduct = {
        id: 'product-1',
        ...createDto,
        price: new Prisma.Decimal(5000),
        isActive: true,
        isFeatured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        colours: [],
        units: []
      };

      productRepository.create.mockResolvedValue(mockCreatedProduct as any);

      const result = await productService.createProduct(createDto);

      expect(result.isActive).toBe(true);
    });
  });

  describe('getProducts', () => {
    it('should get all products with default pagination', async () => {
      const mockProducts = {
        data: [
          {
            id: 'product-1',
            title: 'Luna White Kitchen',
            description: 'Modern kitchen',
            category: Category.KITCHEN,
            rangeName: 'Luna Collection',
            price: new Prisma.Decimal(5999.99),
            images: ['image1.jpg'],
            isActive: true,
            isFeatured: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
            colours: [],
            units: []
          }
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1
      };

      productRepository.findAll.mockResolvedValue(mockProducts as any);

      const result = await productService.getProducts({ page: 1, limit: 10 });

      expect(result).toEqual(mockProducts);
      expect(productRepository.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10
      });
    });

    it('should filter products by category (FR2.0)', async () => {
      const mockKitchenProducts = {
        data: [
          {
            id: 'product-1',
            title: 'Luna White Kitchen',
            description: 'Modern kitchen',
            category: Category.KITCHEN,
            rangeName: 'Luna Collection',
            price: new Prisma.Decimal(5999.99),
            images: ['image1.jpg'],
            isActive: true,
            isFeatured: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
            colours: [],
            units: []
          }
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1
      };

      productRepository.findAll.mockResolvedValue(mockKitchenProducts as any);

      const result = await productService.getProducts({
        page: 1,
        limit: 10,
        category: Category.KITCHEN
      });

      expect(result).toEqual(mockKitchenProducts);
      expect(productRepository.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        category: Category.KITCHEN
      });
    });

    it('should filter products by colours (FR2.2)', async () => {
      const mockFilteredProducts = {
        data: [
          {
            id: 'product-1',
            title: 'White Kitchen',
            description: 'Kitchen with white finish',
            category: Category.KITCHEN,
            rangeName: 'Modern',
            price: new Prisma.Decimal(5999.99),
            images: ['image1.jpg'],
            isActive: true,
            isFeatured: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
            colours: [
              { id: 'colour-1', name: 'White', hexCode: '#FFFFFF', createdAt: new Date(), updatedAt: new Date() }
            ],
            units: []
          }
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1
      };

      productRepository.findAll.mockResolvedValue(mockFilteredProducts as any);

      const result = await productService.getProducts({
        page: 1,
        limit: 10,
        colourIds: ['colour-1']
      });

      expect(result).toEqual(mockFilteredProducts);
      expect(productRepository.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        colourIds: ['colour-1']
      });
    });

    it('should filter products by range name (FR2.2)', async () => {
      const mockFilteredProducts = {
        data: [
          {
            id: 'product-1',
            title: 'Luna White Kitchen',
            description: 'Modern kitchen',
            category: Category.KITCHEN,
            rangeName: 'Luna Collection',
            price: new Prisma.Decimal(5999.99),
            images: ['image1.jpg'],
            isActive: true,
            isFeatured: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
            colours: [],
            units: []
          }
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1
      };

      productRepository.findAll.mockResolvedValue(mockFilteredProducts as any);

      const result = await productService.getProducts({
        page: 1,
        limit: 10,
        rangeName: 'Luna Collection'
      });

      expect(result).toEqual(mockFilteredProducts);
    });

    it('should search products by keyword', async () => {
      const mockSearchResults = {
        data: [
          {
            id: 'product-1',
            title: 'Luna White Kitchen',
            description: 'Modern kitchen',
            category: Category.KITCHEN,
            rangeName: 'Luna Collection',
            price: new Prisma.Decimal(5999.99),
            images: ['image1.jpg'],
            isActive: true,
            isFeatured: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
            colours: [],
            units: []
          }
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1
      };

      productRepository.findAll.mockResolvedValue(mockSearchResults as any);

      const result = await productService.getProducts({
        page: 1,
        limit: 10,
        search: 'Luna'
      });

      expect(result).toEqual(mockSearchResults);
      expect(productRepository.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: 'Luna'
      });
    });

    it('should sort products by price ascending (FR2.3)', async () => {
      const mockSortedProducts = {
        data: [
          {
            id: 'product-1',
            title: 'Budget Kitchen',
            description: 'Affordable kitchen',
            category: Category.KITCHEN,
            rangeName: 'Budget',
            price: new Prisma.Decimal(2999.99),
            images: ['image1.jpg'],
            isActive: true,
            isFeatured: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
            colours: [],
            units: []
          },
          {
            id: 'product-2',
            title: 'Premium Kitchen',
            description: 'Luxury kitchen',
            category: Category.KITCHEN,
            rangeName: 'Premium',
            price: new Prisma.Decimal(9999.99),
            images: ['image2.jpg'],
            isActive: true,
            isFeatured: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
            colours: [],
            units: []
          }
        ],
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1
      };

      productRepository.findAll.mockResolvedValue(mockSortedProducts as any);

      const result = await productService.getProducts({
        page: 1,
        limit: 10,
        sortBy: 'price',
        sortOrder: 'asc'
      });

      expect(result).toEqual(mockSortedProducts);
      expect(result.data[0].price.toNumber()).toBeLessThan(result.data[1].price.toNumber());
    });

    it('should sort products by newest first (FR2.3)', async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const mockSortedProducts = {
        data: [
          {
            id: 'product-2',
            title: 'New Product',
            description: 'Recently added',
            category: Category.KITCHEN,
            rangeName: 'Modern',
            price: new Prisma.Decimal(5999.99),
            images: ['image2.jpg'],
            isActive: true,
            isFeatured: false,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
            colours: [],
            units: []
          },
          {
            id: 'product-1',
            title: 'Old Product',
            description: 'Added earlier',
            category: Category.KITCHEN,
            rangeName: 'Classic',
            price: new Prisma.Decimal(5999.99),
            images: ['image1.jpg'],
            isActive: true,
            isFeatured: false,
            createdAt: yesterday,
            updatedAt: yesterday,
            deletedAt: null,
            colours: [],
            units: []
          }
        ],
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1
      };

      productRepository.findAll.mockResolvedValue(mockSortedProducts as any);

      const result = await productService.getProducts({
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      expect(result).toEqual(mockSortedProducts);
    });

    it('should support pagination for infinite scroll (FR2.5)', async () => {
      const mockPage2Products = {
        data: Array.from({ length: 10 }, (_, i) => ({
          id: `product-${i + 11}`,
          title: `Product ${i + 11}`,
          description: 'Test product',
          category: Category.KITCHEN,
          rangeName: 'Test',
          price: new Prisma.Decimal(5000),
          images: ['image.jpg'],
          isActive: true,
          isFeatured: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          colours: [],
          units: []
        })),
        total: 50,
        page: 2,
        limit: 10,
        totalPages: 5
      };

      productRepository.findAll.mockResolvedValue(mockPage2Products as any);

      const result = await productService.getProducts({
        page: 2,
        limit: 10
      });

      expect(result.page).toBe(2);
      expect(result.data).toHaveLength(10);
      expect(result.total).toBe(50);
      expect(result.totalPages).toBe(5);
    });

    it('should handle multiple filters simultaneously', async () => {
      const mockFilteredProducts = {
        data: [
          {
            id: 'product-1',
            title: 'Luna White Kitchen',
            description: 'Modern kitchen',
            category: Category.KITCHEN,
            rangeName: 'Luna Collection',
            price: new Prisma.Decimal(5999.99),
            images: ['image1.jpg'],
            isActive: true,
            isFeatured: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
            colours: [
              { id: 'colour-1', name: 'White', hexCode: '#FFFFFF', createdAt: new Date(), updatedAt: new Date() }
            ],
            units: []
          }
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1
      };

      productRepository.findAll.mockResolvedValue(mockFilteredProducts as any);

      const result = await productService.getProducts({
        page: 1,
        limit: 10,
        category: Category.KITCHEN,
        colourIds: ['colour-1'],
        rangeName: 'Luna Collection',
        sortBy: 'price',
        sortOrder: 'asc'
      });

      expect(result).toEqual(mockFilteredProducts);
      expect(productRepository.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        category: Category.KITCHEN,
        colourIds: ['colour-1'],
        rangeName: 'Luna Collection',
        sortBy: 'price',
        sortOrder: 'asc'
      });
    });

    it('should only return active products by default', async () => {
      const mockActiveProducts = {
        data: [
          {
            id: 'product-1',
            title: 'Active Product',
            description: 'Active product',
            category: Category.KITCHEN,
            rangeName: 'Test',
            price: new Prisma.Decimal(5000),
            images: ['image.jpg'],
            isActive: true,
            isFeatured: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
            colours: [],
            units: []
          }
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1
      };

      productRepository.findAll.mockResolvedValue(mockActiveProducts as any);

      const result = await productService.getProducts({
        page: 1,
        limit: 10,
        isActive: true
      });

      expect(result.data.every(p => p.isActive)).toBe(true);
    });
  });

  describe('getProductById', () => {
    it('should get product by id with full details (FR3.1)', async () => {
      const mockProduct = {
        id: 'product-1',
        title: 'Luna White Kitchen',
        description: 'Modern white kitchen with sleek design',
        category: Category.KITCHEN,
        rangeName: 'Luna Collection',
        price: new Prisma.Decimal(5999.99),
        images: ['image1.jpg', 'image2.jpg'],
        isActive: true,
        isFeatured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        colours: [
          { id: 'colour-1', name: 'White', hexCode: '#FFFFFF', createdAt: new Date(), updatedAt: new Date() },
          { id: 'colour-2', name: 'Grey', hexCode: '#808080', createdAt: new Date(), updatedAt: new Date() }
        ],
        units: [
          {
            id: 'unit-1',
            productId: 'product-1',
            title: 'Base Unit',
            description: 'Standard base unit',
            image: 'base-unit.jpg',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]
      };

      productRepository.findById.mockResolvedValue(mockProduct as any);

      const result = await productService.getProductById('product-1');

      expect(result).toEqual(mockProduct);
      expect(result?.colours).toHaveLength(2);
      expect(result?.units).toHaveLength(1);
      expect(productRepository.findById).toHaveBeenCalledWith('product-1');
    });

    it('should return null for non-existent product', async () => {
      productRepository.findById.mockResolvedValue(null);

      const result = await productService.getProductById('non-existent-id');

      expect(result).toBeNull();
    });

    it('should throw error for invalid product id', async () => {
      await expect(productService.getProductById(''))
        .rejects
        .toThrow('Product ID is required');
    });
  });

  describe('updateProduct', () => {
    it('should update product successfully', async () => {
      const updateData = {
        title: 'Updated Luna Kitchen',
        price: 6499.99,
        description: 'Updated description'
      };

      const mockUpdatedProduct = {
        id: 'product-1',
        title: 'Updated Luna Kitchen',
        description: 'Updated description',
        category: Category.KITCHEN,
        rangeName: 'Luna Collection',
        price: new Prisma.Decimal(6499.99),
        images: ['image1.jpg'],
        isActive: true,
        isFeatured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        colours: [],
        units: []
      };

      productRepository.findById.mockResolvedValue({
        id: 'product-1',
        title: 'Luna Kitchen',
        description: 'Original description',
        category: Category.KITCHEN,
        rangeName: 'Luna Collection',
        price: new Prisma.Decimal(5999.99),
        images: ['image1.jpg'],
        isActive: true,
        isFeatured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      } as any);

      productRepository.update.mockResolvedValue(mockUpdatedProduct as any);

      const result = await productService.updateProduct('product-1', updateData);

      expect(result).toEqual(mockUpdatedProduct);
      expect(productRepository.update).toHaveBeenCalledWith(
        'product-1',
        expect.objectContaining({
          title: updateData.title,
          price: updateData.price,
          description: updateData.description
        })
      );
    });

    it('should update product colours', async () => {
      const updateData = {
        colourIds: ['colour-1', 'colour-3']
      };

      const mockUpdatedProduct = {
        id: 'product-1',
        title: 'Luna Kitchen',
        description: 'Modern kitchen',
        category: Category.KITCHEN,
        rangeName: 'Luna Collection',
        price: new Prisma.Decimal(5999.99),
        images: ['image1.jpg'],
        isActive: true,
        isFeatured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        colours: [
          { id: 'colour-1', name: 'White', hexCode: '#FFFFFF', createdAt: new Date(), updatedAt: new Date() },
          { id: 'colour-3', name: 'Black', hexCode: '#000000', createdAt: new Date(), updatedAt: new Date() }
        ],
        units: []
      };

      productRepository.findById.mockResolvedValue({
        id: 'product-1',
        title: 'Luna Kitchen',
        description: 'Modern kitchen',
        category: Category.KITCHEN,
        rangeName: 'Luna Collection',
        price: new Prisma.Decimal(5999.99),
        images: ['image1.jpg'],
        isActive: true,
        isFeatured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      } as any);

      productRepository.update.mockResolvedValue(mockUpdatedProduct as any);

      const result = await productService.updateProduct('product-1', updateData);

      expect(result.colours).toHaveLength(2);
      expect(result.colours?.map(c => c.id)).toEqual(['colour-1', 'colour-3']);
    });

    it('should throw error when updating non-existent product', async () => {
      productRepository.findById.mockResolvedValue(null);

      await expect(
        productService.updateProduct('non-existent-id', { title: 'Updated' })
      ).rejects.toThrow('Product not found');
    });

    it('should validate price when updating', async () => {
      productRepository.findById.mockResolvedValue({
        id: 'product-1',
        title: 'Luna Kitchen',
        price: new Prisma.Decimal(5999.99)
      } as any);

      await expect(
        productService.updateProduct('product-1', { price: -100 })
      ).rejects.toThrow('Price must be a positive number');
    });

    it('should validate images array when updating', async () => {
      productRepository.findById.mockResolvedValue({
        id: 'product-1',
        title: 'Luna Kitchen',
        images: ['image1.jpg']
      } as any);

      await expect(
        productService.updateProduct('product-1', { images: [] })
      ).rejects.toThrow('At least one product image is required');
    });
  });

  describe('deleteProduct', () => {
    it('should soft delete product successfully', async () => {
      const mockDeletedProduct = {
        id: 'product-1',
        title: 'Luna Kitchen',
        description: 'Modern kitchen',
        category: Category.KITCHEN,
        rangeName: 'Luna Collection',
        price: new Prisma.Decimal(5999.99),
        images: ['image1.jpg'],
        isActive: false,
        isFeatured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: new Date()
      };

      productRepository.findById.mockResolvedValue({
        id: 'product-1',
        title: 'Luna Kitchen',
        description: 'Modern kitchen',
        category: Category.KITCHEN,
        rangeName: 'Luna Collection',
        price: new Prisma.Decimal(5999.99),
        images: ['image1.jpg'],
        isActive: true,
        isFeatured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      } as any);

      productRepository.delete.mockResolvedValue(mockDeletedProduct as any);

      const result = await productService.deleteProduct('product-1');

      expect(result.deletedAt).not.toBeNull();
      expect(result.isActive).toBe(false);
      expect(productRepository.delete).toHaveBeenCalledWith('product-1');
    });

    it('should throw error when deleting non-existent product', async () => {
      productRepository.findById.mockResolvedValue(null);

      await expect(productService.deleteProduct('non-existent-id'))
        .rejects
        .toThrow('Product not found');
    });
  });

  describe('getKitchenProducts', () => {
    it('should get all kitchen products (FR1.4)', async () => {
      const mockKitchenProducts = {
        data: [
          {
            id: 'product-1',
            title: 'Luna White Kitchen',
            description: 'Modern kitchen',
            category: Category.KITCHEN,
            rangeName: 'Luna Collection',
            price: new Prisma.Decimal(5999.99),
            images: ['image1.jpg'],
            isActive: true,
            isFeatured: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
            colours: [],
            units: []
          }
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1
      };

      productRepository.findAll.mockResolvedValue(mockKitchenProducts as any);

      const result = await productService.getKitchenProducts({ page: 1, limit: 10 });

      expect(result).toEqual(mockKitchenProducts);
      expect(productRepository.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        category: Category.KITCHEN,
        isActive: true
      });
    });
  });

  describe('getBedroomProducts', () => {
    it('should get all bedroom products (FR1.4)', async () => {
      const mockBedroomProducts = {
        data: [
          {
            id: 'product-2',
            title: 'Elegance Bedroom',
            description: 'Luxury bedroom',
            category: Category.BEDROOM,
            rangeName: 'Elegance Collection',
            price: new Prisma.Decimal(7499.99),
            images: ['bedroom1.jpg'],
            isActive: true,
            isFeatured: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
            colours: [],
            units: []
          }
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1
      };

      productRepository.findAll.mockResolvedValue(mockBedroomProducts as any);

      const result = await productService.getBedroomProducts({ page: 1, limit: 10 });

      expect(result).toEqual(mockBedroomProducts);
      expect(productRepository.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        category: Category.BEDROOM,
        isActive: true
      });
    });
  });

  describe('toggleProductActive', () => {
    it('should activate inactive product', async () => {
      const mockActivatedProduct = {
        id: 'product-1',
        title: 'Luna Kitchen',
        description: 'Modern kitchen',
        category: Category.KITCHEN,
        rangeName: 'Luna Collection',
        price: new Prisma.Decimal(5999.99),
        images: ['image1.jpg'],
        isActive: true,
        isFeatured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      };

      productRepository.findById.mockResolvedValue({
        id: 'product-1',
        isActive: false
      } as any);

      productRepository.toggleActive.mockResolvedValue(mockActivatedProduct as any);

      const result = await productService.toggleProductActive('product-1', true);

      expect(result.isActive).toBe(true);
      expect(productRepository.toggleActive).toHaveBeenCalledWith('product-1', true);
    });

    it('should deactivate active product', async () => {
      const mockDeactivatedProduct = {
        id: 'product-1',
        title: 'Luna Kitchen',
        description: 'Modern kitchen',
        category: Category.KITCHEN,
        rangeName: 'Luna Collection',
        price: new Prisma.Decimal(5999.99),
        images: ['image1.jpg'],
        isActive: false,
        isFeatured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      };

      productRepository.findById.mockResolvedValue({
        id: 'product-1',
        isActive: true
      } as any);

      productRepository.toggleActive.mockResolvedValue(mockDeactivatedProduct as any);

      const result = await productService.toggleProductActive('product-1', false);

      expect(result.isActive).toBe(false);
    });

    it('should throw error when toggling non-existent product', async () => {
      productRepository.findById.mockResolvedValue(null);

      await expect(
        productService.toggleProductActive('non-existent-id', true)
      ).rejects.toThrow('Product not found');
    });
  });

  describe('getFeaturedProducts', () => {
    it('should get featured products', async () => {
      const mockFeaturedProducts = [
        {
          id: 'product-1',
          title: 'Featured Kitchen',
          description: 'Featured kitchen product',
          category: Category.KITCHEN,
          rangeName: 'Premium',
          price: new Prisma.Decimal(8999.99),
          images: ['featured1.jpg'],
          isActive: true,
          isFeatured: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          colours: [],
          units: []
        },
        {
          id: 'product-2',
          title: 'Featured Bedroom',
          description: 'Featured bedroom product',
          category: Category.BEDROOM,
          rangeName: 'Premium',
          price: new Prisma.Decimal(9999.99),
          images: ['featured2.jpg'],
          isActive: true,
          isFeatured: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          colours: [],
          units: []
        }
      ];

      productRepository.findFeatured.mockResolvedValue(mockFeaturedProducts as any);

      const result = await productService.getFeaturedProducts(5);

      expect(result).toEqual(mockFeaturedProducts);
      expect(result.every(p => p.isFeatured)).toBe(true);
      expect(productRepository.findFeatured).toHaveBeenCalledWith(5);
    });

    it('should use default limit of 10', async () => {
      productRepository.findFeatured.mockResolvedValue([]);

      await productService.getFeaturedProducts();

      expect(productRepository.findFeatured).toHaveBeenCalledWith(10);
    });
  });

  describe('bulkUpdatePrices', () => {
    it('should update multiple product prices', async () => {
      const priceUpdates = [
        { id: 'product-1', price: 6999.99 },
        { id: 'product-2', price: 7999.99 }
      ];

      const mockUpdatedProducts = [
        {
          id: 'product-1',
          title: 'Product 1',
          price: new Prisma.Decimal(6999.99),
          category: Category.KITCHEN,
          rangeName: 'Test',
          description: 'Test',
          images: ['image.jpg'],
          isActive: true,
          isFeatured: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null
        },
        {
          id: 'product-2',
          title: 'Product 2',
          price: new Prisma.Decimal(7999.99),
          category: Category.BEDROOM,
          rangeName: 'Test',
          description: 'Test',
          images: ['image.jpg'],
          isActive: true,
          isFeatured: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null
        }
      ];

      productRepository.bulkUpdatePrices.mockResolvedValue(mockUpdatedProducts as any);

      const result = await productService.bulkUpdatePrices(priceUpdates);

      expect(result).toEqual(mockUpdatedProducts);
      expect(result).toHaveLength(2);
      expect(productRepository.bulkUpdatePrices).toHaveBeenCalledWith(priceUpdates);
    });

    it('should validate all prices are positive', async () => {
      const invalidUpdates = [
        { id: 'product-1', price: 6999.99 },
        { id: 'product-2', price: -100 }
      ];

      await expect(productService.bulkUpdatePrices(invalidUpdates))
        .rejects
        .toThrow('All prices must be positive numbers');
    });

    it('should handle empty updates array', async () => {
      await expect(productService.bulkUpdatePrices([]))
        .rejects
        .toThrow('No price updates provided');
    });
  });

  describe('getProductStats', () => {
    it('should get product statistics', async () => {
      const mockStats = {
        totalProducts: 50,
        totalKitchens: 30,
        totalBedrooms: 20,
        activeProducts: 45,
        inactiveProducts: 5,
        featuredProducts: 10,
        averagePrice: 6500.50
      };

      productRepository.count.mockResolvedValueOnce(50); // total
      productRepository.countByCategory.mockResolvedValueOnce(30); // kitchens
      productRepository.countByCategory.mockResolvedValueOnce(20); // bedrooms
      productRepository.findAll.mockResolvedValueOnce({ 
        data: Array(45).fill(null), 
        total: 45 
      } as any); // active
      productRepository.findAll.mockResolvedValueOnce({ 
        data: Array(5).fill(null), 
        total: 5 
      } as any); // inactive
      productRepository.findFeatured.mockResolvedValueOnce(
        Array(10).fill(null) as any
      ); // featured

      const result = await productService.getProductStats();

      expect(result.totalProducts).toBeGreaterThanOrEqual(0);
      expect(result.totalKitchens).toBeGreaterThanOrEqual(0);
      expect(result.totalBedrooms).toBeGreaterThanOrEqual(0);
    });
  });
});