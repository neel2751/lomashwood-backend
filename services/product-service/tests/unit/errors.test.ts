import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  BaseError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  BadRequestError,
  InternalServerError,
  ServiceUnavailableError,
  DatabaseError,
  ExternalServiceError,
  RateLimitError,
  PaymentError,
  FileUploadError,
  AuthenticationError,
  TokenExpiredError,
  InvalidTokenError,
  ProductNotFoundError,
  CategoryNotFoundError,
  ColourNotFoundError,
  InventoryError,
  PricingError,
  OutOfStockError,
  InvalidQuantityError,
  DuplicateProductError,
  InvalidFilterError,
  InvalidSortError,
  PaginationError,
  ImageUploadError,
  InvalidImageFormatError,
  ImageSizeExceededError,
  SearchError,
  CacheError,
  EventPublishError,
  ErrorCodes,
  HttpStatusCodes,
  isOperationalError,
  formatErrorResponse,
  logError,
} from '../../src/shared/errors';

describe('Error Classes - Base Error', () => {
  describe('BaseError', () => {
    it('should create base error with message', () => {
      const error = new BaseError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('BaseError');
      expect(error).toBeInstanceOf(Error);
    });

    it('should have default status code 500', () => {
      const error = new BaseError('Test error');
      expect(error.statusCode).toBe(500);
    });

    it('should capture stack trace', () => {
      const error = new BaseError('Test error');
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('BaseError');
    });

    it('should mark as operational by default', () => {
      const error = new BaseError('Test error');
      expect(error.isOperational).toBe(true);
    });

    it('should accept custom error code', () => {
      const error = new BaseError('Test error', 'CUSTOM_ERROR');
      expect(error.code).toBe('CUSTOM_ERROR');
    });

    it('should accept metadata', () => {
      const metadata = { field: 'email', value: 'invalid' };
      const error = new BaseError('Test error', 'ERROR', metadata);
      expect(error.metadata).toEqual(metadata);
    });
  });
});

describe('Error Classes - Client Errors (4xx)', () => {
  describe('ValidationError', () => {
    it('should create validation error with 400 status', () => {
      const error = new ValidationError('Invalid input');
      expect(error.message).toBe('Invalid input');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('ValidationError');
      expect(error.code).toBe(ErrorCodes.VALIDATION_ERROR);
    });

    it('should accept validation errors array', () => {
      const validationErrors = [
        { field: 'email', message: 'Invalid email format' },
        { field: 'phone', message: 'Invalid phone number' },
      ];
      const error = new ValidationError('Validation failed', validationErrors);
      expect(error.metadata).toEqual(validationErrors);
    });

    it('should be operational error', () => {
      const error = new ValidationError('Invalid input');
      expect(error.isOperational).toBe(true);
    });
  });

  describe('NotFoundError', () => {
    it('should create not found error with 404 status', () => {
      const error = new NotFoundError('Product not found');
      expect(error.message).toBe('Product not found');
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe('NotFoundError');
      expect(error.code).toBe(ErrorCodes.NOT_FOUND);
    });

    it('should accept resource type metadata', () => {
      const error = new NotFoundError('Product not found', { 
        resource: 'Product', 
        id: 'prod-123' 
      });
      expect(error.metadata.resource).toBe('Product');
      expect(error.metadata.id).toBe('prod-123');
    });
  });

  describe('UnauthorizedError', () => {
    it('should create unauthorized error with 401 status', () => {
      const error = new UnauthorizedError('Authentication required');
      expect(error.message).toBe('Authentication required');
      expect(error.statusCode).toBe(401);
      expect(error.name).toBe('UnauthorizedError');
      expect(error.code).toBe(ErrorCodes.UNAUTHORIZED);
    });

    it('should accept authentication scheme metadata', () => {
      const error = new UnauthorizedError('Invalid token', { scheme: 'Bearer' });
      expect(error.metadata.scheme).toBe('Bearer');
    });
  });

  describe('ForbiddenError', () => {
    it('should create forbidden error with 403 status', () => {
      const error = new ForbiddenError('Access denied');
      expect(error.message).toBe('Access denied');
      expect(error.statusCode).toBe(403);
      expect(error.name).toBe('ForbiddenError');
      expect(error.code).toBe(ErrorCodes.FORBIDDEN);
    });

    it('should accept permission metadata', () => {
      const error = new ForbiddenError('Insufficient permissions', {
        required: 'admin',
        current: 'user',
      });
      expect(error.metadata.required).toBe('admin');
      expect(error.metadata.current).toBe('user');
    });
  });

  describe('ConflictError', () => {
    it('should create conflict error with 409 status', () => {
      const error = new ConflictError('Product already exists');
      expect(error.message).toBe('Product already exists');
      expect(error.statusCode).toBe(409);
      expect(error.name).toBe('ConflictError');
      expect(error.code).toBe(ErrorCodes.CONFLICT);
    });

    it('should accept conflicting resource metadata', () => {
      const error = new ConflictError('Duplicate SKU', {
        field: 'sku',
        value: 'K-MOD-WHITE-001',
      });
      expect(error.metadata.field).toBe('sku');
      expect(error.metadata.value).toBe('K-MOD-WHITE-001');
    });
  });

  describe('BadRequestError', () => {
    it('should create bad request error with 400 status', () => {
      const error = new BadRequestError('Invalid request');
      expect(error.message).toBe('Invalid request');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('BadRequestError');
      expect(error.code).toBe(ErrorCodes.BAD_REQUEST);
    });
  });

  describe('RateLimitError', () => {
    it('should create rate limit error with 429 status', () => {
      const error = new RateLimitError('Too many requests');
      expect(error.message).toBe('Too many requests');
      expect(error.statusCode).toBe(429);
      expect(error.name).toBe('RateLimitError');
      expect(error.code).toBe(ErrorCodes.RATE_LIMIT_EXCEEDED);
    });

    it('should accept rate limit metadata', () => {
      const error = new RateLimitError('Rate limit exceeded', {
        limit: 100,
        window: '1h',
        retryAfter: 3600,
      });
      expect(error.metadata.limit).toBe(100);
      expect(error.metadata.window).toBe('1h');
      expect(error.metadata.retryAfter).toBe(3600);
    });
  });
});

describe('Error Classes - Server Errors (5xx)', () => {
  describe('InternalServerError', () => {
    it('should create internal server error with 500 status', () => {
      const error = new InternalServerError('Internal server error');
      expect(error.message).toBe('Internal server error');
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe('InternalServerError');
      expect(error.code).toBe(ErrorCodes.INTERNAL_SERVER_ERROR);
    });

    it('should mark as non-operational', () => {
      const error = new InternalServerError('Server error');
      expect(error.isOperational).toBe(false);
    });
  });

  describe('ServiceUnavailableError', () => {
    it('should create service unavailable error with 503 status', () => {
      const error = new ServiceUnavailableError('Service temporarily unavailable');
      expect(error.message).toBe('Service temporarily unavailable');
      expect(error.statusCode).toBe(503);
      expect(error.name).toBe('ServiceUnavailableError');
      expect(error.code).toBe(ErrorCodes.SERVICE_UNAVAILABLE);
    });

    it('should accept retry after metadata', () => {
      const error = new ServiceUnavailableError('Maintenance mode', {
        retryAfter: 7200,
      });
      expect(error.metadata.retryAfter).toBe(7200);
    });
  });

  describe('DatabaseError', () => {
    it('should create database error with 500 status', () => {
      const error = new DatabaseError('Database connection failed');
      expect(error.message).toBe('Database connection failed');
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe('DatabaseError');
      expect(error.code).toBe(ErrorCodes.DATABASE_ERROR);
    });

    it('should accept database error details', () => {
      const error = new DatabaseError('Query failed', {
        query: 'SELECT * FROM products',
        error: 'Connection timeout',
      });
      expect(error.metadata.query).toBe('SELECT * FROM products');
      expect(error.metadata.error).toBe('Connection timeout');
    });

    it('should mark as non-operational', () => {
      const error = new DatabaseError('Database error');
      expect(error.isOperational).toBe(false);
    });
  });

  describe('ExternalServiceError', () => {
    it('should create external service error with 502 status', () => {
      const error = new ExternalServiceError('Payment gateway error');
      expect(error.message).toBe('Payment gateway error');
      expect(error.statusCode).toBe(502);
      expect(error.name).toBe('ExternalServiceError');
      expect(error.code).toBe(ErrorCodes.EXTERNAL_SERVICE_ERROR);
    });

    it('should accept service details', () => {
      const error = new ExternalServiceError('Stripe API error', {
        service: 'Stripe',
        endpoint: '/v1/charges',
        statusCode: 500,
      });
      expect(error.metadata.service).toBe('Stripe');
      expect(error.metadata.endpoint).toBe('/v1/charges');
    });
  });
});

describe('Error Classes - Authentication Errors', () => {
  describe('AuthenticationError', () => {
    it('should create authentication error with 401 status', () => {
      const error = new AuthenticationError('Invalid credentials');
      expect(error.message).toBe('Invalid credentials');
      expect(error.statusCode).toBe(401);
      expect(error.name).toBe('AuthenticationError');
      expect(error.code).toBe(ErrorCodes.AUTHENTICATION_FAILED);
    });
  });

  describe('TokenExpiredError', () => {
    it('should create token expired error with 401 status', () => {
      const error = new TokenExpiredError('Token has expired');
      expect(error.message).toBe('Token has expired');
      expect(error.statusCode).toBe(401);
      expect(error.name).toBe('TokenExpiredError');
      expect(error.code).toBe(ErrorCodes.TOKEN_EXPIRED);
    });

    it('should accept expiry metadata', () => {
      const expiredAt = new Date('2024-01-15T10:00:00Z');
      const error = new TokenExpiredError('Token expired', {
        expiredAt,
        tokenType: 'access',
      });
      expect(error.metadata.expiredAt).toEqual(expiredAt);
      expect(error.metadata.tokenType).toBe('access');
    });
  });

  describe('InvalidTokenError', () => {
    it('should create invalid token error with 401 status', () => {
      const error = new InvalidTokenError('Invalid token format');
      expect(error.message).toBe('Invalid token format');
      expect(error.statusCode).toBe(401);
      expect(error.name).toBe('InvalidTokenError');
      expect(error.code).toBe(ErrorCodes.INVALID_TOKEN);
    });
  });
});

describe('Error Classes - Product Specific Errors', () => {
  describe('ProductNotFoundError', () => {
    it('should create product not found error', () => {
      const error = new ProductNotFoundError('prod-123');
      expect(error.message).toBe('Product not found: prod-123');
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe('ProductNotFoundError');
      expect(error.code).toBe(ErrorCodes.PRODUCT_NOT_FOUND);
    });

    it('should include product ID in metadata', () => {
      const error = new ProductNotFoundError('prod-456');
      expect(error.metadata.productId).toBe('prod-456');
    });
  });

  describe('CategoryNotFoundError', () => {
    it('should create category not found error', () => {
      const error = new CategoryNotFoundError('KITCHEN');
      expect(error.message).toBe('Category not found: KITCHEN');
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe('CategoryNotFoundError');
      expect(error.code).toBe(ErrorCodes.CATEGORY_NOT_FOUND);
    });

    it('should include category in metadata', () => {
      const error = new CategoryNotFoundError('BEDROOM');
      expect(error.metadata.category).toBe('BEDROOM');
    });
  });

  describe('ColourNotFoundError', () => {
    it('should create colour not found error', () => {
      const error = new ColourNotFoundError('white');
      expect(error.message).toBe('Colour not found: white');
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe('ColourNotFoundError');
      expect(error.code).toBe(ErrorCodes.COLOUR_NOT_FOUND);
    });

    it('should include colour in metadata', () => {
      const error = new ColourNotFoundError('oak');
      expect(error.metadata.colour).toBe('oak');
    });
  });

  describe('OutOfStockError', () => {
    it('should create out of stock error', () => {
      const error = new OutOfStockError('prod-123');
      expect(error.message).toBe('Product out of stock: prod-123');
      expect(error.statusCode).toBe(409);
      expect(error.name).toBe('OutOfStockError');
      expect(error.code).toBe(ErrorCodes.OUT_OF_STOCK);
    });

    it('should accept stock level metadata', () => {
      const error = new OutOfStockError('prod-123', {
        availableStock: 0,
        requestedQuantity: 5,
      });
      expect(error.metadata.availableStock).toBe(0);
      expect(error.metadata.requestedQuantity).toBe(5);
    });
  });

  describe('InvalidQuantityError', () => {
    it('should create invalid quantity error', () => {
      const error = new InvalidQuantityError('Quantity must be positive');
      expect(error.message).toBe('Quantity must be positive');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('InvalidQuantityError');
      expect(error.code).toBe(ErrorCodes.INVALID_QUANTITY);
    });

    it('should accept quantity constraints', () => {
      const error = new InvalidQuantityError('Quantity exceeds limit', {
        min: 1,
        max: 10,
        provided: 15,
      });
      expect(error.metadata.min).toBe(1);
      expect(error.metadata.max).toBe(10);
      expect(error.metadata.provided).toBe(15);
    });
  });

  describe('DuplicateProductError', () => {
    it('should create duplicate product error', () => {
      const error = new DuplicateProductError('K-MOD-WHITE-001');
      expect(error.message).toBe('Product already exists: K-MOD-WHITE-001');
      expect(error.statusCode).toBe(409);
      expect(error.name).toBe('DuplicateProductError');
      expect(error.code).toBe(ErrorCodes.DUPLICATE_PRODUCT);
    });

    it('should include SKU in metadata', () => {
      const error = new DuplicateProductError('B-OAK-TRAD-001');
      expect(error.metadata.sku).toBe('B-OAK-TRAD-001');
    });
  });

  describe('InventoryError', () => {
    it('should create inventory error', () => {
      const error = new InventoryError('Insufficient stock');
      expect(error.message).toBe('Insufficient stock');
      expect(error.statusCode).toBe(409);
      expect(error.name).toBe('InventoryError');
      expect(error.code).toBe(ErrorCodes.INVENTORY_ERROR);
    });
  });

  describe('PricingError', () => {
    it('should create pricing error', () => {
      const error = new PricingError('Invalid price calculation');
      expect(error.message).toBe('Invalid price calculation');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('PricingError');
      expect(error.code).toBe(ErrorCodes.PRICING_ERROR);
    });

    it('should accept pricing details', () => {
      const error = new PricingError('Discount exceeds price', {
        price: 100,
        discount: 150,
      });
      expect(error.metadata.price).toBe(100);
      expect(error.metadata.discount).toBe(150);
    });
  });
});

describe('Error Classes - Filter and Search Errors', () => {
  describe('InvalidFilterError', () => {
    it('should create invalid filter error', () => {
      const error = new InvalidFilterError('Invalid filter criteria');
      expect(error.message).toBe('Invalid filter criteria');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('InvalidFilterError');
      expect(error.code).toBe(ErrorCodes.INVALID_FILTER);
    });

    it('should accept filter details', () => {
      const error = new InvalidFilterError('Invalid colour filter', {
        filter: 'colour',
        value: 'invalid-colour',
      });
      expect(error.metadata.filter).toBe('colour');
      expect(error.metadata.value).toBe('invalid-colour');
    });
  });

  describe('InvalidSortError', () => {
    it('should create invalid sort error', () => {
      const error = new InvalidSortError('Invalid sort field');
      expect(error.message).toBe('Invalid sort field');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('InvalidSortError');
      expect(error.code).toBe(ErrorCodes.INVALID_SORT);
    });

    it('should accept sort details', () => {
      const error = new InvalidSortError('Field not sortable', {
        field: 'description',
        allowedFields: ['price', 'name', 'createdAt'],
      });
      expect(error.metadata.field).toBe('description');
      expect(error.metadata.allowedFields).toContain('price');
    });
  });

  describe('PaginationError', () => {
    it('should create pagination error', () => {
      const error = new PaginationError('Invalid page number');
      expect(error.message).toBe('Invalid page number');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('PaginationError');
      expect(error.code).toBe(ErrorCodes.PAGINATION_ERROR);
    });

    it('should accept pagination constraints', () => {
      const error = new PaginationError('Page exceeds maximum', {
        page: 1000,
        maxPage: 100,
      });
      expect(error.metadata.page).toBe(1000);
      expect(error.metadata.maxPage).toBe(100);
    });
  });

  describe('SearchError', () => {
    it('should create search error', () => {
      const error = new SearchError('Search query too short');
      expect(error.message).toBe('Search query too short');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('SearchError');
      expect(error.code).toBe(ErrorCodes.SEARCH_ERROR);
    });

    it('should accept search details', () => {
      const error = new SearchError('Invalid search term', {
        term: 'x',
        minLength: 3,
      });
      expect(error.metadata.term).toBe('x');
      expect(error.metadata.minLength).toBe(3);
    });
  });
});

describe('Error Classes - File Upload Errors', () => {
  describe('FileUploadError', () => {
    it('should create file upload error', () => {
      const error = new FileUploadError('File upload failed');
      expect(error.message).toBe('File upload failed');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('FileUploadError');
      expect(error.code).toBe(ErrorCodes.FILE_UPLOAD_ERROR);
    });
  });

  describe('ImageUploadError', () => {
    it('should create image upload error', () => {
      const error = new ImageUploadError('Image upload failed');
      expect(error.message).toBe('Image upload failed');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('ImageUploadError');
      expect(error.code).toBe(ErrorCodes.IMAGE_UPLOAD_ERROR);
    });
  });

  describe('InvalidImageFormatError', () => {
    it('should create invalid image format error', () => {
      const error = new InvalidImageFormatError('image.txt');
      expect(error.message).toBe('Invalid image format: image.txt');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('InvalidImageFormatError');
      expect(error.code).toBe(ErrorCodes.INVALID_IMAGE_FORMAT);
    });

    it('should accept format details', () => {
      const error = new InvalidImageFormatError('file.pdf', {
        provided: 'pdf',
        allowed: ['jpg', 'png', 'webp'],
      });
      expect(error.metadata.provided).toBe('pdf');
      expect(error.metadata.allowed).toContain('jpg');
    });
  });

  describe('ImageSizeExceededError', () => {
    it('should create image size exceeded error', () => {
      const error = new ImageSizeExceededError(10485760, 5242880);
      expect(error.message).toContain('10485760');
      expect(error.message).toContain('5242880');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('ImageSizeExceededError');
      expect(error.code).toBe(ErrorCodes.IMAGE_SIZE_EXCEEDED);
    });

    it('should include size details in metadata', () => {
      const error = new ImageSizeExceededError(10485760, 5242880);
      expect(error.metadata.actualSize).toBe(10485760);
      expect(error.metadata.maxSize).toBe(5242880);
    });
  });
});

describe('Error Classes - Payment Errors', () => {
  describe('PaymentError', () => {
    it('should create payment error', () => {
      const error = new PaymentError('Payment processing failed');
      expect(error.message).toBe('Payment processing failed');
      expect(error.statusCode).toBe(402);
      expect(error.name).toBe('PaymentError');
      expect(error.code).toBe(ErrorCodes.PAYMENT_ERROR);
    });

    it('should accept payment details', () => {
      const error = new PaymentError('Card declined', {
        paymentMethod: 'card',
        provider: 'Stripe',
        reason: 'insufficient_funds',
      });
      expect(error.metadata.paymentMethod).toBe('card');
      expect(error.metadata.provider).toBe('Stripe');
      expect(error.metadata.reason).toBe('insufficient_funds');
    });
  });
});

describe('Error Classes - Infrastructure Errors', () => {
  describe('CacheError', () => {
    it('should create cache error', () => {
      const error = new CacheError('Redis connection failed');
      expect(error.message).toBe('Redis connection failed');
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe('CacheError');
      expect(error.code).toBe(ErrorCodes.CACHE_ERROR);
    });

    it('should accept cache details', () => {
      const error = new CacheError('Cache write failed', {
        operation: 'SET',
        key: 'product:prod-123',
      });
      expect(error.metadata.operation).toBe('SET');
      expect(error.metadata.key).toBe('product:prod-123');
    });
  });

  describe('EventPublishError', () => {
    it('should create event publish error', () => {
      const error = new EventPublishError('Failed to publish event');
      expect(error.message).toBe('Failed to publish event');
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe('EventPublishError');
      expect(error.code).toBe(ErrorCodes.EVENT_PUBLISH_ERROR);
    });

    it('should accept event details', () => {
      const error = new EventPublishError('Event publish timeout', {
        topic: 'product.created',
        eventId: 'evt-123',
      });
      expect(error.metadata.topic).toBe('product.created');
      expect(error.metadata.eventId).toBe('evt-123');
    });
  });
});

describe('Error Utilities', () => {
  describe('isOperationalError', () => {
    it('should identify operational errors', () => {
      const validationError = new ValidationError('Invalid input');
      const notFoundError = new NotFoundError('Not found');
      
      expect(isOperationalError(validationError)).toBe(true);
      expect(isOperationalError(notFoundError)).toBe(true);
    });

    it('should identify non-operational errors', () => {
      const serverError = new InternalServerError('Server error');
      const dbError = new DatabaseError('DB error');
      
      expect(isOperationalError(serverError)).toBe(false);
      expect(isOperationalError(dbError)).toBe(false);
    });

    it('should handle regular errors', () => {
      const regularError = new Error('Regular error');
      expect(isOperationalError(regularError)).toBe(false);
    });
  });

  describe('formatErrorResponse', () => {
    it('should format error response with all fields', () => {
      const error = new ValidationError('Invalid email', {
        field: 'email',
        value: 'invalid',
      });
      
      const response = formatErrorResponse(error);
      
      expect(response).toHaveProperty('success', false);
      expect(response).toHaveProperty('error');
      expect(response.error).toHaveProperty('message', 'Invalid email');
      expect(response.error).toHaveProperty('code', ErrorCodes.VALIDATION_ERROR);
      expect(response.error).toHaveProperty('statusCode', 400);
    });

    it('should include metadata if present', () => {
      const error = new ProductNotFoundError('prod-123');
      const response = formatErrorResponse(error);
      
      expect(response.error).toHaveProperty('metadata');
      expect(response.error.metadata).toHaveProperty('productId', 'prod-123');
    });

    it('should exclude stack in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const error = new ValidationError('Invalid input');
      const response = formatErrorResponse(error);
      
      expect(response.error).not.toHaveProperty('stack');
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should include stack in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const error = new ValidationError('Invalid input');
      const response = formatErrorResponse(error);
      
      expect(response.error).toHaveProperty('stack');
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should handle non-BaseError instances', () => {
      const error = new Error('Regular error');
      const response = formatErrorResponse(error);
      
      expect(response.error.message).toBe('Regular error');
      expect(response.error.statusCode).toBe(500);
      expect(response.error.code).toBe('INTERNAL_SERVER_ERROR');
    });
  });

  describe('logError', () => {
    it('should log error with context', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const error = new ValidationError('Invalid input');
      const context = { userId: 'user-123', action: 'create-product' };
      
      logError(error, context);
      
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should include error details in log', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const error = new ProductNotFoundError('prod-123');
      logError(error);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('ProductNotFoundError')
      );
      
      consoleSpy.mockRestore();
    });

    it('should handle errors without stack trace', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const error = { message: 'Error without stack' } as Error;
      
      expect(() => logError(error)).not.toThrow();
      
      consoleSpy.mockRestore();
    });
  });
});

describe('Error Constants', () => {
  describe('ErrorCodes', () => {
    it('should have validation error code', () => {
      expect(ErrorCodes.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
    });

    it('should have product-specific error codes', () => {
      expect(ErrorCodes.PRODUCT_NOT_FOUND).toBe('PRODUCT_NOT_FOUND');
      expect(ErrorCodes.CATEGORY_NOT_FOUND).toBe('CATEGORY_NOT_FOUND');
      expect(ErrorCodes.COLOUR_NOT_FOUND).toBe('COLOUR_NOT_FOUND');
      expect(ErrorCodes.OUT_OF_STOCK).toBe('OUT_OF_STOCK');
    });

    it('should have authentication error codes', () => {
      expect(ErrorCodes.UNAUTHORIZED).toBe('UNAUTHORIZED');
      expect(ErrorCodes.TOKEN_EXPIRED).toBe('TOKEN_EXPIRED');
      expect(ErrorCodes.INVALID_TOKEN).toBe('INVALID_TOKEN');
    });

    it('should have infrastructure error codes', () => {
      expect(ErrorCodes.DATABASE_ERROR).toBe('DATABASE_ERROR');
      expect(ErrorCodes.CACHE_ERROR).toBe('CACHE_ERROR');
      expect(ErrorCodes.EVENT_PUBLISH_ERROR).toBe('EVENT_PUBLISH_ERROR');
    });
  });

  describe('HttpStatusCodes', () => {
    it('should have client error status codes', () => {
      expect(HttpStatusCodes.BAD_REQUEST).toBe(400);
      expect(HttpStatusCodes.UNAUTHORIZED).toBe(401);
      expect(HttpStatusCodes.FORBIDDEN).toBe(403);
      expect(HttpStatusCodes.NOT_FOUND).toBe(404);
      expect(HttpStatusCodes.CONFLICT).toBe(409);
      expect(HttpStatusCodes.TOO_MANY_REQUESTS).toBe(429);
    });

    it('should have server error status codes', () => {
      expect(HttpStatusCodes.INTERNAL_SERVER_ERROR).toBe(500);
      expect(HttpStatusCodes.BAD_GATEWAY).toBe(502);
      expect(HttpStatusCodes.SERVICE_UNAVAILABLE).toBe(503);
    });

    it('should have success status codes', () => {
      expect(HttpStatusCodes.OK).toBe(200);
      expect(HttpStatusCodes.CREATED).toBe(201);
      expect(HttpStatusCodes.NO_CONTENT).toBe(204);
    });
  });
});

describe('Error Inheritance', () => {
  it('should maintain proper inheritance chain', () => {
    const error = new ValidationError('Test');
    
    expect(error).toBeInstanceOf(ValidationError);
    expect(error).toBeInstanceOf(BaseError);
    expect(error).toBeInstanceOf(Error);
  });

  it('should have correct constructor names', () => {
    expect(new ValidationError('test').constructor.name).toBe('ValidationError');
    expect(new NotFoundError('test').constructor.name).toBe('NotFoundError');
    expect(new ProductNotFoundError('id').constructor.name).toBe('ProductNotFoundError');
  });
});

describe('Error Serialization', () => {
  it('should serialize to JSON correctly', () => {
    const error = new ValidationError('Invalid input', {
      field: 'email',
    });
    
    const json = JSON.stringify(error);
    const parsed = JSON.parse(json);
    
    expect(parsed).toHaveProperty('message');
    expect(parsed).toHaveProperty('name');
  });

  it('should preserve metadata in serialization', () => {
    const error = new ProductNotFoundError('prod-123');
    const formatted = formatErrorResponse(error);
    
    const json = JSON.stringify(formatted);
    const parsed = JSON.parse(json);
    
    expect(parsed.error.metadata.productId).toBe('prod-123');
  });
});