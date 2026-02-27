import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { PrismaClient, Category, Prisma } from '@prisma/client';
import { ProductRepository } from '../../src/app/products/product.repository';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

describe('ProductRepository', () => {
  let prisma: DeepMockProxy<PrismaClient>;
  let productRepository: ProductRepository;

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    productRepository = new ProductRepository(prisma as unknown as PrismaClient);
    mockReset(prisma);
  });

  describe('create', () => {
    it('should create a product with valid data', async () => {
      const createData: Prisma.ProductCreateInput = {
        title: 'Luna White Kitchen',
        description: 'Modern white kitchen with sleek design',
        category: Category.KITCHEN,
        rangeName: 'Luna Collection',
        price: 5999.99,
        images: ['image1.jpg', 'image2.jpg'],
        colours: {
          connect: [{ id: 'colour-1' }, { id: 'colour-2' }]
        }
      };

      const mockProduct = {
        id: 'product-1',
        title: 'Luna White Kitchen',
        description: 'Modern white kitchen with sleek design',
        category: Category.KITCHEN,
        rangeName: 'Luna Collection',
        price: new Prisma.Decimal(5999.99),
        images: ['image1.jpg', 'image2.jpg'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      };

      prisma.product.create.mockResolvedValue(mockProduct as any);

      const result = await productRepository.create(createData);

      expect(result).toEqual(mockProduct);
      expect(prisma.product.create).toHaveBeenCalledWith({
        data: createData,
        include: {
          colours: true,
          units: true
        }
      });
      expect(prisma.product.create).toHaveBeenCalledTimes(1);
    });

    it('should create a bedroom product with units', async () => {
      const createData: Prisma.ProductCreateInput = {
        title: 'Elegance Bedroom',
        description: 'Luxurious bedroom suite',
        category: Category.BEDROOM,
        rangeName: 'Elegance Collection',
        price: 7499.99,
        images: ['bedroom1.jpg'],
        units: {
          create: [
            {
              title: 'Single Wardrobe',
              description: 'Compact wardrobe unit',
              image: 'wardrobe.jpg'
            }
          ]
        }
      };

      const mockProduct = {
        id: 'product-2',
        title: 'Elegance Bedroom',
        description: 'Luxurious bedroom suite',
        category: Category.BEDROOM,
        rangeName: 'Elegance Collection',
        price: new Prisma.Decimal(7499.99),
        images: ['bedroom1.jpg'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        units: [
          {
            id: 'unit-1',
            productId: 'product-2',
            title: 'Single Wardrobe',
            description: 'Compact wardrobe unit',
            image: 'wardrobe.jpg',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]
      };

      prisma.product.create.mockResolvedValue(mockProduct as any);

      const result = await productRepository.create(createData);

      expect(result).toEqual(mockProduct);
      expect(result.units).toHaveLength(1);
    });

    it('should throw error when creating product with duplicate title', async () => {
      const createData: Prisma.ProductCreateInput = {
        title: 'Luna White Kitchen',
        description: 'Duplicate product',
        category: Category.KITCHEN,
        rangeName: 'Luna Collection',
        price: 5999.99,
        images: ['image1.jpg']
      };

      prisma.product.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: '5.0.0'
        })
      );

      await expect(productRepository.create(createData)).rejects.toThrow();
    });
  });

  describe('findById', () => {
    it('should find product by id with relations', async () => {
      const mockProduct = {
        id: 'product-1',
        title: 'Luna White Kitchen',
        description: 'Modern white kitchen',
        category: Category.KITCHEN,
        rangeName: 'Luna Collection',
        price: new Prisma.Decimal(5999.99),
        images: ['image1.jpg'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        colours: [
          {
            id: 'colour-1',
            name: 'White',
            hexCode: '#FFFFFF',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        units: []
      };

      prisma.product.findUnique.mockResolvedValue(mockProduct as any);

      const result = await productRepository.findById('product-1');

      expect(result).toEqual(mockProduct);
      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: 'product-1' },
        include: {
          colours: true,
          units: true
        }
      });
    });

    it('should return null for non-existent product', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      const result = await productRepository.findById('non-existent-id');

      expect(result).toBeNull();
    });

    it('should not return soft-deleted products', async () => {
      const mockDeletedProduct = {
        id: 'product-1',
        title: 'Deleted Product',
        description: 'This is deleted',
        category: Category.KITCHEN,
        rangeName: 'Test',
        price: new Prisma.Decimal(1000),
        images: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: new Date()
      };

      prisma.product.findUnique.mockResolvedValue(mockDeletedProduct as any);

      const result = await productRepository.findById('product-1', { includeDeleted: false });

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should find all products with pagination', async () => {
      const mockProducts = [
        {
          id: 'product-1',
          title: 'Luna White Kitchen',
          description: 'Modern kitchen',
          category: Category.KITCHEN,
          rangeName: 'Luna Collection',
          price: new Prisma.Decimal(5999.99),
          images: ['image1.jpg'],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          colours: [],
          units: []
        },
        {
          id: 'product-2',
          title: 'Elegance Bedroom',
          description: 'Luxury bedroom',
          category: Category.BEDROOM,
          rangeName: 'Elegance Collection',
          price: new Prisma.Decimal(7499.99),
          images: ['bedroom1.jpg'],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          colours: [],
          units: []
        }
      ];

      prisma.product.findMany.mockResolvedValue(mockProducts as any);
      prisma.product.count.mockResolvedValue(2);

      const result = await productRepository.findAll({
        page: 1,
        limit: 10
      });

      expect(result.data).toEqual(mockProducts);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        include: {
          colours: true,
          units: true
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' }
      });
    });

    it('should filter products by category', async () => {
      const mockKitchenProducts = [
        {
          id: 'product-1',
          title: 'Luna White Kitchen',
          description: 'Modern kitchen',
          category: Category.KITCHEN,
          rangeName: 'Luna Collection',
          price: new Prisma.Decimal(5999.99),
          images: ['image1.jpg'],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          colours: [],
          units: []
        }
      ];

      prisma.product.findMany.mockResolvedValue(mockKitchenProducts as any);
      prisma.product.count.mockResolvedValue(1);

      const result = await productRepository.findAll({
        page: 1,
        limit: 10,
        category: Category.KITCHEN
      });

      expect(result.data).toEqual(mockKitchenProducts);
      expect(result.total).toBe(1);
      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: {
          deletedAt: null,
          category: Category.KITCHEN
        },
        include: {
          colours: true,
          units: true
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' }
      });
    });

    it('should filter products by colour', async () => {
      const mockProducts = [
        {
          id: 'product-1',
          title: 'White Kitchen',
          description: 'Kitchen with white finish',
          category: Category.KITCHEN,
          rangeName: 'Modern',
          price: new Prisma.Decimal(5999.99),
          images: ['image1.jpg'],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          colours: [{ id: 'colour-1', name: 'White', hexCode: '#FFFFFF' }],
          units: []
        }
      ];

      prisma.product.findMany.mockResolvedValue(mockProducts as any);
      prisma.product.count.mockResolvedValue(1);

      const result = await productRepository.findAll({
        page: 1,
        limit: 10,
        colourIds: ['colour-1']
      });

      expect(result.data).toEqual(mockProducts);
      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: {
          deletedAt: null,
          colours: {
            some: {
              id: {
                in: ['colour-1']
              }
            }
          }
        },
        include: {
          colours: true,
          units: true
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' }
      });
    });

    it('should filter products by range name', async () => {
      const mockProducts = [
        {
          id: 'product-1',
          title: 'Luna White Kitchen',
          description: 'Modern kitchen',
          category: Category.KITCHEN,
          rangeName: 'Luna Collection',
          price: new Prisma.Decimal(5999.99),
          images: ['image1.jpg'],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          colours: [],
          units: []
        }
      ];

      prisma.product.findMany.mockResolvedValue(mockProducts as any);
      prisma.product.count.mockResolvedValue(1);

      const result = await productRepository.findAll({
        page: 1,
        limit: 10,
        rangeName: 'Luna Collection'
      });

      expect(result.data).toEqual(mockProducts);
      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: {
          deletedAt: null,
          rangeName: 'Luna Collection'
        },
        include: {
          colours: true,
          units: true
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' }
      });
    });

    it('should search products by title', async () => {
      const mockProducts = [
        {
          id: 'product-1',
          title: 'Luna White Kitchen',
          description: 'Modern kitchen',
          category: Category.KITCHEN,
          rangeName: 'Luna Collection',
          price: new Prisma.Decimal(5999.99),
          images: ['image1.jpg'],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          colours: [],
          units: []
        }
      ];

      prisma.product.findMany.mockResolvedValue(mockProducts as any);
      prisma.product.count.mockResolvedValue(1);

      const result = await productRepository.findAll({
        page: 1,
        limit: 10,
        search: 'Luna'
      });

      expect(result.data).toEqual(mockProducts);
      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: {
          deletedAt: null,
          OR: [
            { title: { contains: 'Luna', mode: 'insensitive' } },
            { description: { contains: 'Luna', mode: 'insensitive' } },
            { rangeName: { contains: 'Luna', mode: 'insensitive' } }
          ]
        },
        include: {
          colours: true,
          units: true
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' }
      });
    });

    it('should sort products by price ascending', async () => {
      const mockProducts = [
        {
          id: 'product-1',
          title: 'Budget Kitchen',
          description: 'Affordable kitchen',
          category: Category.KITCHEN,
          rangeName: 'Budget',
          price: new Prisma.Decimal(2999.99),
          images: ['image1.jpg'],
          isActive: true,
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
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          colours: [],
          units: []
        }
      ];

      prisma.product.findMany.mockResolvedValue(mockProducts as any);
      prisma.product.count.mockResolvedValue(2);

      const result = await productRepository.findAll({
        page: 1,
        limit: 10,
        sortBy: 'price',
        sortOrder: 'asc'
      });

      expect(result.data).toEqual(mockProducts);
      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        include: {
          colours: true,
          units: true
        },
        skip: 0,
        take: 10,
        orderBy: { price: 'asc' }
      });
    });

    it('should handle pagination correctly', async () => {
      const mockProducts = Array.from({ length: 5 }, (_, i) => ({
        id: `product-${i + 11}`,
        title: `Product ${i + 11}`,
        description: 'Test product',
        category: Category.KITCHEN,
        rangeName: 'Test',
        price: new Prisma.Decimal(5000),
        images: ['image.jpg'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        colours: [],
        units: []
      }));

      prisma.product.findMany.mockResolvedValue(mockProducts as any);
      prisma.product.count.mockResolvedValue(25);

      const result = await productRepository.findAll({
        page: 3,
        limit: 5
      });

      expect(result.data).toEqual(mockProducts);
      expect(result.total).toBe(25);
      expect(result.page).toBe(3);
      expect(result.limit).toBe(5);
      expect(result.totalPages).toBe(5);
      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        include: {
          colours: true,
          units: true
        },
        skip: 10,
        take: 5,
        orderBy: { createdAt: 'desc' }
      });
    });

    it('should filter only active products when specified', async () => {
      const mockActiveProducts = [
        {
          id: 'product-1',
          title: 'Active Product',
          description: 'Active product',
          category: Category.KITCHEN,
          rangeName: 'Test',
          price: new Prisma.Decimal(5000),
          images: ['image.jpg'],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          colours: [],
          units: []
        }
      ];

      prisma.product.findMany.mockResolvedValue(mockActiveProducts as any);
      prisma.product.count.mockResolvedValue(1);

      const result = await productRepository.findAll({
        page: 1,
        limit: 10,
        isActive: true
      });

      expect(result.data).toEqual(mockActiveProducts);
      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: {
          deletedAt: null,
          isActive: true
        },
        include: {
          colours: true,
          units: true
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' }
      });
    });
  });

  describe('update', () => {
    it('should update product successfully', async () => {
      const updateData: Prisma.ProductUpdateInput = {
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
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      };

      prisma.product.update.mockResolvedValue(mockUpdatedProduct as any);

      const result = await productRepository.update('product-1', updateData);

      expect(result).toEqual(mockUpdatedProduct);
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'product-1' },
        data: updateData,
        include: {
          colours: true,
          units: true
        }
      });
    });

    it('should update product colours', async () => {
      const updateData: Prisma.ProductUpdateInput = {
        colours: {
          set: [{ id: 'colour-1' }, { id: 'colour-2' }]
        }
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
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        colours: [
          { id: 'colour-1', name: 'White', hexCode: '#FFFFFF' },
          { id: 'colour-2', name: 'Grey', hexCode: '#808080' }
        ]
      };

      prisma.product.update.mockResolvedValue(mockUpdatedProduct as any);

      const result = await productRepository.update('product-1', updateData);

      expect(result.colours).toHaveLength(2);
    });

    it('should throw error when updating non-existent product', async () => {
      const updateData: Prisma.ProductUpdateInput = {
        title: 'Updated Product'
      };

      prisma.product.update.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Record not found', {
          code: 'P2025',
          clientVersion: '5.0.0'
        })
      );

      await expect(
        productRepository.update('non-existent-id', updateData)
      ).rejects.toThrow();
    });
  });

  describe('delete (soft delete)', () => {
    it('should soft delete product successfully', async () => {
      const mockDeletedProduct = {
        id: 'product-1',
        title: 'Luna Kitchen',
        description: 'Modern kitchen',
        category: Category.KITCHEN,
        rangeName: 'Luna Collection',
        price: new Prisma.Decimal(5999.99),
        images: ['image1.jpg'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: new Date()
      };

      prisma.product.update.mockResolvedValue(mockDeletedProduct as any);

      const result = await productRepository.delete('product-1');

      expect(result.deletedAt).not.toBeNull();
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'product-1' },
        data: {
          deletedAt: expect.any(Date),
          isActive: false
        }
      });
    });

    it('should throw error when deleting non-existent product', async () => {
      prisma.product.update.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Record not found', {
          code: 'P2025',
          clientVersion: '5.0.0'
        })
      );

      await expect(productRepository.delete('non-existent-id')).rejects.toThrow();
    });
  });

  describe('hardDelete', () => {
    it('should permanently delete product', async () => {
      const mockDeletedProduct = {
        id: 'product-1',
        title: 'Luna Kitchen',
        description: 'Modern kitchen',
        category: Category.KITCHEN,
        rangeName: 'Luna Collection',
        price: new Prisma.Decimal(5999.99),
        images: ['image1.jpg'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      };

      prisma.product.delete.mockResolvedValue(mockDeletedProduct as any);

      const result = await productRepository.hardDelete('product-1');

      expect(result).toEqual(mockDeletedProduct);
      expect(prisma.product.delete).toHaveBeenCalledWith({
        where: { id: 'product-1' }
      });
    });
  });

  describe('findByCategory', () => {
    it('should find all kitchen products', async () => {
      const mockKitchenProducts = [
        {
          id: 'product-1',
          title: 'Luna Kitchen',
          description: 'Modern kitchen',
          category: Category.KITCHEN,
          rangeName: 'Luna Collection',
          price: new Prisma.Decimal(5999.99),
          images: ['image1.jpg'],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          colours: [],
          units: []
        }
      ];

      prisma.product.findMany.mockResolvedValue(mockKitchenProducts as any);

      const result = await productRepository.findByCategory(Category.KITCHEN);

      expect(result).toEqual(mockKitchenProducts);
      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: {
          category: Category.KITCHEN,
          deletedAt: null,
          isActive: true
        },
        include: {
          colours: true,
          units: true
        }
      });
    });

    it('should find all bedroom products', async () => {
      const mockBedroomProducts = [
        {
          id: 'product-2',
          title: 'Elegance Bedroom',
          description: 'Luxury bedroom',
          category: Category.BEDROOM,
          rangeName: 'Elegance Collection',
          price: new Prisma.Decimal(7499.99),
          images: ['bedroom1.jpg'],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          colours: [],
          units: []
        }
      ];

      prisma.product.findMany.mockResolvedValue(mockBedroomProducts as any);

      const result = await productRepository.findByCategory(Category.BEDROOM);

      expect(result).toEqual(mockBedroomProducts);
    });
  });

  describe('countByCategory', () => {
    it('should count kitchen products', async () => {
      prisma.product.count.mockResolvedValue(15);

      const result = await productRepository.countByCategory(Category.KITCHEN);

      expect(result).toBe(15);
      expect(prisma.product.count).toHaveBeenCalledWith({
        where: {
          category: Category.KITCHEN,
          deletedAt: null,
          isActive: true
        }
      });
    });

    it('should count bedroom products', async () => {
      prisma.product.count.mockResolvedValue(8);

      const result = await productRepository.countByCategory(Category.BEDROOM);

      expect(result).toBe(8);
    });
  });

  describe('toggleActive', () => {
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
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      };

      prisma.product.update.mockResolvedValue(mockActivatedProduct as any);

      const result = await productRepository.toggleActive('product-1', true);

      expect(result.isActive).toBe(true);
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'product-1' },
        data: { isActive: true }
      });
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
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      };

      prisma.product.update.mockResolvedValue(mockDeactivatedProduct as any);

      const result = await productRepository.toggleActive('product-1', false);

      expect(result.isActive).toBe(false);
    });
  });

  describe('findFeatured', () => {
    it('should find featured products', async () => {
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
        }
      ];

      prisma.product.findMany.mockResolvedValue(mockFeaturedProducts as any);

      const result = await productRepository.findFeatured(5);

      expect(result).toEqual(mockFeaturedProducts);
      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: {
          isFeatured: true,
          isActive: true,
          deletedAt: null
        },
        include: {
          colours: true,
          units: true
        },
        take: 5,
        orderBy: { createdAt: 'desc' }
      });
    });
  });

  describe('bulkUpdatePrices', () => {
    it('should update multiple product prices', async () => {
      const priceUpdates = [
        { id: 'product-1', price: 6999.99 },
        { id: 'product-2', price: 7999.99 }
      ];

      prisma.$transaction.mockResolvedValue([
        {
          id: 'product-1',
          price: new Prisma.Decimal(6999.99)
        },
        {
          id: 'product-2',
          price: new Prisma.Decimal(7999.99)
        }
      ] as any);

      const result = await productRepository.bulkUpdatePrices(priceUpdates);

      expect(result).toHaveLength(2);
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });
});