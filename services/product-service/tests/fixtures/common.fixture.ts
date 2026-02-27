
import { faker } from '@faker-js/faker';

export const commonFixture = {

  generateId: (): string => {
    return faker.string.uuid();
  },

 
  generatePastDate: (): Date => {
    return faker.date.past();
  },

 
  generateFutureDate: (): Date => {
    return faker.date.future();
  },

  generateRecentDate: (): Date => {
    return faker.date.recent();
  },


  generatePaginationMeta: (params?: {
    page?: number;
    limit?: number;
    total?: number;
  }) => {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;
    const total = params?.total ?? faker.number.int({ min: 0, max: 100 });
    const totalPages = Math.ceil(total / limit);

    return {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  },


  generateImageUrl: (): string => {
    return faker.image.url();
  },

  generateImageUrls: (count: number = 3): string[] => {
    return Array.from({ length: count }, () => faker.image.url());
  },


  generateHexColor: (): string => {
    return faker.color.rgb({ format: 'hex', casing: 'upper' });
  },


  generatePrice: (params?: { min?: number; max?: number }): number => {
    return parseFloat(
      faker.commerce.price({
        min: params?.min ?? 100,
        max: params?.max ?? 10000,
        dec: 2,
      })
    );
  },


  generatePercentage: (params?: { min?: number; max?: number }): number => {
    return faker.number.int({
      min: params?.min ?? 0,
      max: params?.max ?? 100,
    });
  },


  generateSlug: (text?: string): string => {
    const baseText = text ?? faker.commerce.productName();
    return baseText
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  },

  generateCategory: (): 'KITCHEN' | 'BEDROOM' => {
    return faker.helpers.arrayElement(['KITCHEN', 'BEDROOM']);
  },


  generateStyle: (): string => {
    return faker.helpers.arrayElement([
      'Modern',
      'Traditional',
      'Contemporary',
      'Shaker',
      'Handleless',
      'Classic',
      'Country',
      'Minimalist',
    ]);
  },

 
  generateFinish: (): string => {
    return faker.helpers.arrayElement([
      'Gloss',
      'Matt',
      'Satin',
      'Wood Grain',
      'Textured',
      'Metallic',
    ]);
  },

 
  generateRangeName: (): string => {
    return faker.helpers.arrayElement([
      'Luna Collection',
      'Aurora Series',
      'Nova Range',
      'Stellar Collection',
      'Eclipse Series',
      'Horizon Range',
      'Zenith Collection',
      'Apex Series',
    ]);
  },


  generateSku: (): string => {
    const prefix = faker.helpers.arrayElement(['KIT', 'BED']);
    const number = faker.string.numeric(6);
    return `${prefix}-${number}`;
  },


  generateStockQuantity: (params?: { min?: number; max?: number }): number => {
    return faker.number.int({
      min: params?.min ?? 0,
      max: params?.max ?? 1000,
    });
  },


  generateDimensions: () => {
    return {
      width: faker.number.int({ min: 100, max: 3000 }),
      height: faker.number.int({ min: 100, max: 3000 }),
      depth: faker.number.int({ min: 100, max: 800 }),
      unit: 'mm',
    };
  },


  generateWeight: (params?: { min?: number; max?: number }): number => {
    return faker.number.float({
      min: params?.min ?? 1,
      max: params?.max ?? 100,
      fractionDigits: 2,
    });
  },


  generateBoolean: (): boolean => {
    return faker.datatype.boolean();
  },

 
  generateSortOrder: (): number => {
    return faker.number.int({ min: 0, max: 1000 });
  },


  generateStatus: (): 'ACTIVE' | 'INACTIVE' | 'DRAFT' | 'ARCHIVED' => {
    return faker.helpers.arrayElement(['ACTIVE', 'INACTIVE', 'DRAFT', 'ARCHIVED']);
  },

 
  generateVisibility: (): 'PUBLIC' | 'PRIVATE' | 'HIDDEN' => {
    return faker.helpers.arrayElement(['PUBLIC', 'PRIVATE', 'HIDDEN']);
  },


  generateTags: (count: number = 3): string[] => {
    return Array.from({ length: count }, () => faker.commerce.productAdjective());
  },

  
  generateMetadata: (): Record<string, any> => {
    return {
      seo: {
        title: faker.lorem.sentence(),
        description: faker.lorem.paragraph(),
        keywords: faker.lorem.words(5).split(' '),
      },
      featured: faker.datatype.boolean(),
      trending: faker.datatype.boolean(),
      bestseller: faker.datatype.boolean(),
    };
  },


  generateAuditFields: () => {
    const createdAt = faker.date.past();
    const updatedAt = faker.date.between({ from: createdAt, to: new Date() });

    return {
      createdAt,
      updatedAt,
      createdBy: faker.string.uuid(),
      updatedBy: faker.string.uuid(),
    };
  },


  generateSoftDeleteFields: (isDeleted: boolean = false) => {
    return {
      deletedAt: isDeleted ? faker.date.recent() : null,
      deletedBy: isDeleted ? faker.string.uuid() : null,
    };
  },

  generateArray: <T>(generator: () => T, count?: number): T[] => {
    const length = count ?? faker.number.int({ min: 1, max: 10 });
    return Array.from({ length }, generator);
  },


  generateEmail: (): string => {
    return faker.internet.email();
  },

 
  generatePhone: (): string => {
    return faker.phone.number('+44 ## #### ####');
  },

 
  generatePostcode: (): string => {
    return faker.location.zipCode('??## #??');
  },

  
  generateAddress: () => {
    return {
      line1: faker.location.streetAddress(),
      line2: faker.location.secondaryAddress(),
      city: faker.location.city(),
      county: faker.location.county(),
      postcode: commonFixture.generatePostcode(),
      country: 'United Kingdom',
    };
  },

 
  generateCoordinates: () => {
    return {
      latitude: parseFloat(faker.location.latitude()),
      longitude: parseFloat(faker.location.longitude()),
    };
  },

 
  generateErrorResponse: (params?: {
    statusCode?: number;
    message?: string;
    code?: string;
  }) => {
    return {
      statusCode: params?.statusCode ?? 500,
      message: params?.message ?? faker.lorem.sentence(),
      code: params?.code ?? 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
      path: faker.internet.url(),
    };
  },

 
  generateSuccessResponse: <T>(data: T) => {
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  },


  generatePaginatedResponse: <T>(data: T[], params?: {
    page?: number;
    limit?: number;
    total?: number;
  }) => {
    const meta = commonFixture.generatePaginationMeta(params);
    return {
      success: true,
      data,
      meta,
      timestamp: new Date().toISOString(),
    };
  },


  pickRandom: <T>(items: T[], count?: number): T[] => {
    const pickCount = count ?? faker.number.int({ min: 1, max: items.length });
    return faker.helpers.arrayElements(items, pickCount);
  },

  generateSearchQuery: (): string => {
    return faker.commerce.productName();
  },

 
  generateFilterParams: () => {
    return {
      category: commonFixture.generateCategory(),
      style: commonFixture.generateStyle(),
      finish: commonFixture.generateFinish(),
      minPrice: commonFixture.generatePrice({ min: 100, max: 500 }),
      maxPrice: commonFixture.generatePrice({ min: 5000, max: 10000 }),
      inStock: commonFixture.generateBoolean(),
    };
  },


  generateSortParams: () => {
    return {
      sortBy: faker.helpers.arrayElement(['price', 'createdAt', 'name', 'popularity']),
      sortOrder: faker.helpers.arrayElement(['asc', 'desc']),
    };
  },
};


export const testHelpers = {
 
  wait: (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },


  cleanup: async (cleanupFn: () => Promise<void>): Promise<void> => {
    try {
      await cleanupFn();
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  },

 
  assertArrayContains: <T>(array: T[], item: T): boolean => {
    return array.includes(item);
  },


  assertObjectMatchesPartial: (obj: any, partial: any): boolean => {
    return Object.keys(partial).every((key) => obj[key] === partial[key]);
  },
};

export default commonFixture;