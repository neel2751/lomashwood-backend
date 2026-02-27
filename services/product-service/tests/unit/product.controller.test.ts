import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { ProductController } from '../../src/app/products/product.controller';
import { ProductService } from '../../src/app/products/product.service';
import { Category } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

describe('ProductController', () => {
  let productController: ProductController;
  let productService: DeepMockProxy<ProductService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    productService = mockDeep<ProductService>();
    productController = new ProductController(productService as unknown as ProductService);
    
    mockRequest = {
      body: {},
      params: {},
      query: {},
      user: undefined
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };

    mockNext = jest.fn();

    mockReset(productService);
  });

  describe('createProduct', () => {
    it('should create a kitchen product successfully', async () => {
      const createProductDto = {
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
        price: 5999.99,
        images: ['image1.jpg', 'image2.jpg'],
        isActive: true,
        isFeatured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        colours: [
          { id: 'colour-1', name: 'White', hexCode: '#FFFFFF' },
          { id: 'colour-2', name: 'Grey', hexCode: '#808080' }
        ],
        units: []
      };

      mockRequest.body = createProductDto;
      productService.createProduct.mockResolvedValue(mockCreatedProduct as any);

      await productController.createProduct(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(productService.createProduct).toHaveBeenCalledWith(createProductDto);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Product created successfully',
        data: mockCreatedProduct
      });
    });

    it('should create a bedroom product with units', async () => {
      const createProductDto = {
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
          }
        ]
      };

      const mockCreatedProduct = {
        id: 'product-2',
        title: 'Elegance Bedroom',
        description: 'Luxurious bedroom suite',
        category: Category.BEDROOM,
        rangeName: 'Elegance Collection',
        price: 7499.99,
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
          }
        ]
      };

      mockRequest.body = createProductDto;
      productService.createProduct.mockResolvedValue(mockCreatedProduct as any);

      await productController.createProduct(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Product created successfully',
        data: mockCreatedProduct
      });
    });

    it('should handle validation errors', async () => {
      const invalidDto = {
        title: '',
        description: 'Invalid product'
      };

      mockRequest.body = invalidDto;
      const validationError = new Error('Validation failed: title is required');
      productService.createProduct.mockRejectedValue(validationError);

      await productController.createProduct(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });

    it('should handle duplicate product errors', async () => {
      const createProductDto = {
        title: 'Luna White Kitchen',
        description: 'Duplicate product',
        category: Category.KITCHEN,
        rangeName: 'Luna Collection',
        price: 5999.99,
        images: ['image1.jpg']
      };

      mockRequest.body = createProductDto;
      const duplicateError = new Error('Product with this title already exists');
      productService.createProduct.mockRejectedValue(duplicateError);

      await productController.createProduct(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(duplicateError);
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
            price: 5999.99,
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

      mockRequest.query = {};
      productService.getProducts.mockResolvedValue(mockProducts as any);

      await productController.getProducts(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(productService.getProducts).toHaveBeenCalledWith({
        page: 1,
        limit: 10
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Products retrieved successfully',
        data: mockProducts.data,
        pagination: {
          total: mockProducts.total,
          page: mockProducts.page,
          limit: mockProducts.limit,
          totalPages: mockProducts.totalPages
        }
      });
    });

    it('should filter products by category (Kitchen)', async () => {
      const mockKitchenProducts = {
        data: [
          {
            id: 'product-1',
            title: 'Luna White Kitchen',
            description: 'Modern kitchen',
            category: Category.KITCHEN,
            rangeName: 'Luna Collection',
            price: 5999.99,
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

      mockRequest.query = { category: 'KITCHEN' };
      productService.getProducts.mockResolvedValue(mockKitchenProducts as any);

      await productController.getProducts(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(productService.getProducts).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        category: Category.KITCHEN
      });
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Products retrieved successfully',
        data: mockKitchenProducts.data,
        pagination: expect.any(Object)
      });
    });

    it('should filter products by category (Bedroom)', async () => {
      const mockBedroomProducts = {
        data: [
          {
            id: 'product-2',
            title: 'Elegance Bedroom',
            description: 'Luxury bedroom',
            category: Category.BEDROOM,
            rangeName: 'Elegance Collection',
            price: 7499.99,
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

      mockRequest.query = { category: 'BEDROOM' };
      productService.getProducts.mockResolvedValue(mockBedroomProducts as any);

      await productController.getProducts(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(productService.getProducts).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        category: Category.BEDROOM
      });
    });

    it('should filter products by colours (FR2.2 - Filter Component)', async () => {
      const mockFilteredProducts = {
        data: [
          {
            id: 'product-1',
            title: 'White Kitchen',
            description: 'Kitchen with white finish',
            category: Category.KITCHEN,
            rangeName: 'Modern',
            price: 5999.99,
            images: ['image1.jpg'],
            isActive: true,
            isFeatured: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
            colours: [{ id: 'colour-1', name: 'White', hexCode: '#FFFFFF' }],
            units: []
          }
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1
      };

      mockRequest.query = { colourIds: 'colour-1,colour-2' };
      productService.getProducts.mockResolvedValue(mockFilteredProducts as any);

      await productController.getProducts(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(productService.getProducts).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        colourIds: ['colour-1', 'colour-2']
      });
    });

    it('should filter products by range name (FR2.2 - Filter Component)', async () => {
      const mockFilteredProducts = {
        data: [
          {
            id: 'product-1',
            title: 'Luna White Kitchen',
            description: 'Modern kitchen',
            category: Category.KITCHEN,
            rangeName: 'Luna Collection',
            price: 5999.99,
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

      mockRequest.query = { rangeName: 'Luna Collection' };
      productService.getProducts.mockResolvedValue(mockFilteredProducts as any);

      await productController.getProducts(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(productService.getProducts).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        rangeName: 'Luna Collection'
      });
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
            price: 5999.99,
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

      mockRequest.query = { search: 'Luna' };
      productService.getProducts.mockResolvedValue(mockSearchResults as any);

      await productController.getProducts(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(productService.getProducts).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: 'Luna'
      });
    });

    it('should sort products by price (FR2.3 - Sort by mechanism)', async () => {
      const mockSortedProducts = {
        data: [
          {
            id: 'product-1',
            title: 'Budget Kitchen',
            description: 'Affordable kitchen',
            category: Category.KITCHEN,
            rangeName: 'Budget',
            price: 2999.99,
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
            price: 9999.99,
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

      mockRequest.query = { sortBy: 'price', sortOrder: 'asc' };
      productService.getProducts.mockResolvedValue(mockSortedProducts as any);

      await productController.getProducts(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(productService.getProducts).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        sortBy: 'price',
        sortOrder: 'asc'
      });
    });

    it('should support pagination for infinite scroll (FR2.5)', async () => {
      const mockPaginatedProducts = {
        data: Array.from({ length: 10 }, (_, i) => ({
          id: `product-${i + 1}`,
          title: `Product ${i + 1}`,
          description: 'Test product',
          category: Category.KITCHEN,
          rangeName: 'Test',
          price: 5000,
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

      mockRequest.query = { page: '2', limit: '10' };
      productService.getProducts.mockResolvedValue(mockPaginatedProducts as any);

      await productController.getProducts(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(productService.getProducts).toHaveBeenCalledWith({
        page: 2,
        limit: 10
      });
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Products retrieved successfully',
        data: mockPaginatedProducts.data,
        pagination: {
          total: 50,
          page: 2,
          limit: 10,
          totalPages: 5
        }
      });
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
            price: 5999.99,
            images: ['image1.jpg'],
            isActive: true,
            isFeatured: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
            colours: [{ id: 'colour-1', name: 'White', hexCode: '#FFFFFF' }],
            units: []
          }
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1
      };

      mockRequest.query = {
        category: 'KITCHEN',
        colourIds: 'colour-1',
        rangeName: 'Luna Collection',
        sortBy: 'price',
        sortOrder: 'asc'
      };

      productService.getProducts.mockResolvedValue(mockFilteredProducts as any);

      await productController.getProducts(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(productService.getProducts).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        category: Category.KITCHEN,
        colourIds: ['colour-1'],
        rangeName: 'Luna Collection',
        sortBy: 'price',
        sortOrder: 'asc'
      });
    });

    it('should handle errors gracefully', async () => {
      mockRequest.query = {};
      const error = new Error('Database connection failed');
      productService.getProducts.mockRejectedValue(error);

      await productController.getProducts(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
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
        price: 5999.99,
        images: ['image1.jpg', 'image2.jpg'],
        isActive: true,
        isFeatured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        colours: [
          { id: 'colour-1', name: 'White', hexCode: '#FFFFFF' },
          { id: 'colour-2', name: 'Grey', hexCode: '#808080' }
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

      mockRequest.params = { id: 'product-1' };
      productService.getProductById.mockResolvedValue(mockProduct as any);

      await productController.getProductById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(productService.getProductById).toHaveBeenCalledWith('product-1');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Product retrieved successfully',
        data: mockProduct
      });
    });

    it('should return 404 when product not found', async () => {
      mockRequest.params = { id: 'non-existent-id' };
      productService.getProductById.mockResolvedValue(null);

      await productController.getProductById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Product not found'
      });
    });

    it('should handle errors', async () => {
      mockRequest.params = { id: 'product-1' };
      const error = new Error('Database error');
      productService.getProductById.mockRejectedValue(error);

      await productController.getProductById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
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
        price: 6499.99,
        images: ['image1.jpg'],
        isActive: true,
        isFeatured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        colours: [],
        units: []
      };

      mockRequest.params = { id: 'product-1' };
      mockRequest.body = updateData;
      productService.updateProduct.mockResolvedValue(mockUpdatedProduct as any);

      await productController.updateProduct(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(productService.updateProduct).toHaveBeenCalledWith('product-1', updateData);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Product updated successfully',
        data: mockUpdatedProduct
      });
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
        price: 5999.99,
        images: ['image1.jpg'],
        isActive: true,
        isFeatured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        colours: [
          { id: 'colour-1', name: 'White', hexCode: '#FFFFFF' },
          { id: 'colour-3', name: 'Black', hexCode: '#000000' }
        ],
        units: []
      };

      mockRequest.params = { id: 'product-1' };
      mockRequest.body = updateData;
      productService.updateProduct.mockResolvedValue(mockUpdatedProduct as any);

      await productController.updateProduct(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Product updated successfully',
        data: mockUpdatedProduct
      });
    });

    it('should return 404 when updating non-existent product', async () => {
      mockRequest.params = { id: 'non-existent-id' };
      mockRequest.body = { title: 'Updated Title' };
      
      const notFoundError = new Error('Product not found');
      productService.updateProduct.mockRejectedValue(notFoundError);

      await productController.updateProduct(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(notFoundError);
    });

    it('should handle validation errors', async () => {
      const invalidData = {
        price: -100
      };

      mockRequest.params = { id: 'product-1' };
      mockRequest.body = invalidData;
      
      const validationError = new Error('Price must be positive');
      productService.updateProduct.mockRejectedValue(validationError);

      await productController.updateProduct(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(validationError);
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
        price: 5999.99,
        images: ['image1.jpg'],
        isActive: false,
        isFeatured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: new Date()
      };

      mockRequest.params = { id: 'product-1' };
      productService.deleteProduct.mockResolvedValue(mockDeletedProduct as any);

      await productController.deleteProduct(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(productService.deleteProduct).toHaveBeenCalledWith('product-1');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Product deleted successfully',
        data: mockDeletedProduct
      });
    });

    it('should return 404 when deleting non-existent product', async () => {
      mockRequest.params = { id: 'non-existent-id' };
      
      const notFoundError = new Error('Product not found');
      productService.deleteProduct.mockRejectedValue(notFoundError);

      await productController.deleteProduct(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(notFoundError);
    });
  });

  describe('getKitchenProducts', () => {
    it('should get all kitchen products (FR1.4 - Explore Kitchen)', async () => {
      const mockKitchenProducts = {
        data: [
          {
            id: 'product-1',
            title: 'Luna White Kitchen',
            description: 'Modern kitchen',
            category: Category.KITCHEN,
            rangeName: 'Luna Collection',
            price: 5999.99,
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

      mockRequest.query = {};
      productService.getKitchenProducts.mockResolvedValue(mockKitchenProducts as any);

      await productController.getKitchenProducts(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(productService.getKitchenProducts).toHaveBeenCalledWith({
        page: 1,
        limit: 10
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Kitchen products retrieved successfully',
        data: mockKitchenProducts.data,
        pagination: expect.any(Object)
      });
    });
  });

  describe('getBedroomProducts', () => {
    it('should get all bedroom products (FR1.4 - Explore Bedroom)', async () => {
      const mockBedroomProducts = {
        data: [
          {
            id: 'product-2',
            title: 'Elegance Bedroom',
            description: 'Luxury bedroom',
            category: Category.BEDROOM,
            rangeName: 'Elegance Collection',
            price: 7499.99,
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

      mockRequest.query = {};
      productService.getBedroomProducts.mockResolvedValue(mockBedroomProducts as any);

      await productController.getBedroomProducts(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(productService.getBedroomProducts).toHaveBeenCalledWith({
        page: 1,
        limit: 10
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Bedroom products retrieved successfully',
        data: mockBedroomProducts.data,
        pagination: expect.any(Object)
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
        price: 5999.99,
        images: ['image1.jpg'],
        isActive: true,
        isFeatured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      };

      mockRequest.params = { id: 'product-1' };
      mockRequest.body = { isActive: true };
      productService.toggleProductActive.mockResolvedValue(mockActivatedProduct as any);

      await productController.toggleProductActive(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(productService.toggleProductActive).toHaveBeenCalledWith('product-1', true);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Product status updated successfully',
        data: mockActivatedProduct
      });
    });

    it('should deactivate active product', async () => {
      const mockDeactivatedProduct = {
        id: 'product-1',
        title: 'Luna Kitchen',
        description: 'Modern kitchen',
        category: Category.KITCHEN,
        rangeName: 'Luna Collection',
        price: 5999.99,
        images: ['image1.jpg'],
        isActive: false,
        isFeatured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      };

      mockRequest.params = { id: 'product-1' };
      mockRequest.body = { isActive: false };
      productService.toggleProductActive.mockResolvedValue(mockDeactivatedProduct as any);

      await productController.toggleProductActive(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(productService.toggleProductActive).toHaveBeenCalledWith('product-1', false);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Product status updated successfully',
        data: mockDeactivatedProduct
      });
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
          price: 8999.99,
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

      mockRequest.query = { limit: '5' };
      productService.getFeaturedProducts.mockResolvedValue(mockFeaturedProducts as any);

      await productController.getFeaturedProducts(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(productService.getFeaturedProducts).toHaveBeenCalledWith(5);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Featured products retrieved successfully',
        data: mockFeaturedProducts
      });
    });

    it('should use default limit when not provided', async () => {
      const mockFeaturedProducts = [];

      mockRequest.query = {};
      productService.getFeaturedProducts.mockResolvedValue(mockFeaturedProducts as any);

      await productController.getFeaturedProducts(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(productService.getFeaturedProducts).toHaveBeenCalledWith(10);
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
          price: 6999.99
        },
        {
          id: 'product-2',
          title: 'Product 2',
          price: 7999.99
        }
      ];

      mockRequest.body = { updates: priceUpdates };
      productService.bulkUpdatePrices.mockResolvedValue(mockUpdatedProducts as any);

      await productController.bulkUpdatePrices(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(productService.bulkUpdatePrices).toHaveBeenCalledWith(priceUpdates);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Product prices updated successfully',
        data: mockUpdatedProducts
      });
    });

    it('should handle validation errors for bulk updates', async () => {
      const invalidUpdates = [
        { id: 'product-1', price: -100 }
      ];

      mockRequest.body = { updates: invalidUpdates };
      const validationError = new Error('Price must be positive');
      productService.bulkUpdatePrices.mockRejectedValue(validationError);

      await productController.bulkUpdatePrices(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(validationError);
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

      productService.getProductStats.mockResolvedValue(mockStats as any);

      await productController.getProductStats(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(productService.getProductStats).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Product statistics retrieved successfully',
        data: mockStats
      });
    });

    it('should handle errors when getting stats', async () => {
      const error = new Error('Statistics calculation failed');
      productService.getProductStats.mockRejectedValue(error);

      await productController.getProductStats(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});