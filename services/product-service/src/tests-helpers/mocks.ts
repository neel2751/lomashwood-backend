import { ProductRepository } from '../app/products/product.repository';
import { CategoryRepository } from '../app/categories/category.repository';
import { ColourRepository } from '../app/colours/colour.repository';
import { SizeRepository } from '../app/sizes/size.repository';
import { InventoryRepository } from '../app/inventory/inventory.repository';
import { PricingRepository } from '../app/pricing/pricing.repository';
import { PrismaClient } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import { factories } from './factories';

export class MockPrismaClient {
  product = {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    upsert: jest.fn(),
    deleteMany: jest.fn(),
    updateMany: jest.fn()
  };

  colour = {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    upsert: jest.fn()
  };

  size = {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    upsert: jest.fn()
  };

  category = {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    upsert: jest.fn()
  };

  inventory = {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    upsert: jest.fn()
  };

  pricing = {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    upsert: jest.fn()
  };

  $transaction = jest.fn((callback) => callback(this));
  $connect = jest.fn();
  $disconnect = jest.fn();
  $executeRaw = jest.fn();
  $queryRaw = jest.fn();
}

export class MockProductRepository implements Partial<ProductRepository> {
  findById = jest.fn();
  findAll = jest.fn();
  create = jest.fn();
  update = jest.fn();
  delete = jest.fn();
  count = jest.fn();
  findByCategory = jest.fn();
  findByColourIds = jest.fn();
  findBySizeIds = jest.fn();
  findByPriceRange = jest.fn();
  search = jest.fn();
  exists = jest.fn();
}

export class MockCategoryRepository implements Partial<CategoryRepository> {
  findById = jest.fn();
  findAll = jest.fn();
  create = jest.fn();
  update = jest.fn();
  delete = jest.fn();
  findBySlug = jest.fn();
  exists = jest.fn();
}

export class MockColourRepository implements Partial<ColourRepository> {
  findById = jest.fn();
  findAll = jest.fn();
  create = jest.fn();
  update = jest.fn();
  delete = jest.fn();
  findByName = jest.fn();
  findByIds = jest.fn();
  exists = jest.fn();
}

export class MockSizeRepository implements Partial<SizeRepository> {
  findById = jest.fn();
  findAll = jest.fn();
  create = jest.fn();
  update = jest.fn();
  delete = jest.fn();
  findByIds = jest.fn();
  exists = jest.fn();
}

export class MockInventoryRepository implements Partial<InventoryRepository> {
  findById = jest.fn();
  findAll = jest.fn();
  create = jest.fn();
  update = jest.fn();
  delete = jest.fn();
  findByProductId = jest.fn();
  updateQuantity = jest.fn();
  checkAvailability = jest.fn();
  getLowStockItems = jest.fn();
  getOutOfStockItems = jest.fn();
}

export class MockPricingRepository implements Partial<PricingRepository> {
  findById = jest.fn();
  findAll = jest.fn();
  create = jest.fn();
  update = jest.fn();
  delete = jest.fn();
  findByProductId = jest.fn();
  findActivePrice = jest.fn();
  findByPriceType = jest.fn();
  updatePriceRange = jest.fn();
}

export class MockRedisClient {
  get = jest.fn();
  set = jest.fn();
  del = jest.fn();
  exists = jest.fn();
  expire = jest.fn();
  ttl = jest.fn();
  keys = jest.fn();
  flushall = jest.fn();
  connect = jest.fn();
  disconnect = jest.fn();
  quit = jest.fn();
  ping = jest.fn();
}

export class MockEventProducer {
  publish = jest.fn();
  publishBatch = jest.fn();
  connect = jest.fn();
  disconnect = jest.fn();
}

export class MockLogger {
  info = jest.fn();
  error = jest.fn();
  warn = jest.fn();
  debug = jest.fn();
  verbose = jest.fn();
  http = jest.fn();
}

export const createMockRequest = (overrides?: Partial<Request>): Partial<Request> => {
  return {
    params: {},
    query: {},
    body: {},
    headers: {},
    method: 'GET',
    url: '/test',
    path: '/test',
    ip: '127.0.0.1',
    get: jest.fn(),
    ...overrides
  };
};

export const createMockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    sendStatus: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    locals: {}
  };
  return res;
};

export const createMockNext = (): NextFunction => {
  return jest.fn();
};

export const mockSuccessResponse = <T>(data: T) => {
  return {
    success: true,
    data
  };
};

export const mockErrorResponse = (code: string, message: string, statusCode: number = 500) => {
  return {
    success: false,
    error: {
      code,
      message,
      statusCode,
      timestamp: new Date().toISOString()
    }
  };
};

export const mockPaginatedResponse = <T>(
  data: T[],
  page: number = 1,
  limit: number = 20,
  total: number = data.length
) => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    data,
    meta: {
      currentPage: page,
      itemsPerPage: limit,
      totalItems: total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    }
  };
};

export class MockAuthMiddleware {
  authenticate = jest.fn((req, res, next) => {
    req.user = { id: factories.testData.createUserId(), role: 'USER' };
    next();
  });

  authorize = jest.fn((roles: string[]) => (req, res, next) => {
    next();
  });
}

export class MockValidationMiddleware {
  validate = jest.fn((schema) => (req, res, next) => {
    next();
  });
}

export class MockRateLimitMiddleware {
  rateLimit = jest.fn((req, res, next) => {
    next();
  });
}

export const mockProduct = () => factories.product.create();
export const mockProducts = (count: number = 5) => factories.product.createMany(count);
export const mockColour = () => factories.colour.create();
export const mockColours = (count: number = 5) => factories.colour.createMany(count);
export const mockSize = () => factories.size.create();
export const mockSizes = (count: number = 5) => factories.size.createMany(count);
export const mockCategory = () => factories.category.create();
export const mockCategories = (count: number = 5) => factories.category.createMany(count);
export const mockInventory = () => factories.inventory.create();
export const mockInventories = (count: number = 5) => factories.inventory.createMany(count);
export const mockPricing = () => factories.pricing.create();
export const mockPricings = (count: number = 5) => factories.pricing.createMany(count);

export const resetAllMocks = () => {
  jest.clearAllMocks();
  jest.resetAllMocks();
};

export const setupMockDate = (dateString: string = '2024-01-01T00:00:00.000Z') => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(dateString));
};

export const teardownMockDate = () => {
  jest.useRealTimers();
};

export const mockAsync = <T>(value: T, delay: number = 0): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), delay);
  });
};

export const mockAsyncError = (error: Error, delay: number = 0): Promise<never> => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(error), delay);
  });
};

export const waitFor = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const mockEnv = (envVars: Record<string, string>) => {
  const originalEnv = { ...process.env };
  Object.assign(process.env, envVars);
  
  return () => {
    process.env = originalEnv;
  };
};

export const mocks = {
  prisma: MockPrismaClient,
  repositories: {
    product: MockProductRepository,
    category: MockCategoryRepository,
    colour: MockColourRepository,
    size: MockSizeRepository,
    inventory: MockInventoryRepository,
    pricing: MockPricingRepository
  },
  redis: MockRedisClient,
  eventProducer: MockEventProducer,
  logger: MockLogger,
  middleware: {
    auth: MockAuthMiddleware,
    validation: MockValidationMiddleware,
    rateLimit: MockRateLimitMiddleware
  },
  express: {
    request: createMockRequest,
    response: createMockResponse,
    next: createMockNext
  },
  responses: {
    success: mockSuccessResponse,
    error: mockErrorResponse,
    paginated: mockPaginatedResponse
  },
  data: {
    product: mockProduct,
    products: mockProducts,
    colour: mockColour,
    colours: mockColours,
    size: mockSize,
    sizes: mockSizes,
    category: mockCategory,
    categories: mockCategories,
    inventory: mockInventory,
    inventories: mockInventories,
    pricing: mockPricing,
    pricings: mockPricings
  }
};