import { faker } from '@faker-js/faker';
import { 
  Product, 
  ProductImage, 
  ProductColour, 
  ProductSize,
  Colour,
  Size,
  Category,
  ProductInventory,
  ProductPricing,
  CreateProductDTO,
  CreateColourDTO,
  CreateSizeDTO,
  CreateCategoryDTO,
  ProductCategory,
  PriceType,
  InventoryChangeType
} from '../shared/types';

export class ProductFactory {
  static create(overrides?: Partial<Product>): Product {
    const category: ProductCategory = faker.helpers.arrayElement(['KITCHEN', 'BEDROOM']);
    
    return {
      id: faker.string.uuid(),
      category,
      title: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      rangeName: faker.helpers.arrayElement(['Modern', 'Classic', 'Contemporary', 'Traditional']),
      images: this.createImages(faker.number.int({ min: 1, max: 5 })),
      colours: this.createProductColours(faker.number.int({ min: 1, max: 3 })),
      sizes: this.createProductSizes(faker.number.int({ min: 0, max: 3 })),
      price: parseFloat(faker.commerce.price({ min: 500, max: 50000 })),
      isActive: true,
      createdBy: faker.string.uuid(),
      updatedBy: faker.string.uuid(),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides
    };
  }

  static createMany(count: number, overrides?: Partial<Product>): Product[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  static createKitchen(overrides?: Partial<Product>): Product {
    return this.create({ category: 'KITCHEN', ...overrides });
  }

  static createBedroom(overrides?: Partial<Product>): Product {
    return this.create({ category: 'BEDROOM', ...overrides });
  }

  static createImages(count: number): ProductImage[] {
    return Array.from({ length: count }, (_, index) => ({
      id: faker.string.uuid(),
      url: faker.image.url(),
      alt: faker.lorem.words(3),
      order: index,
      createdAt: faker.date.past()
    }));
  }

  static createProductColours(count: number): ProductColour[] {
    return Array.from({ length: count }, () => ({
      id: faker.string.uuid(),
      name: faker.color.human(),
      hexCode: faker.color.rgb({ format: 'hex', prefix: '#' })
    }));
  }

  static createProductSizes(count: number): ProductSize[] {
    return Array.from({ length: count }, () => ({
      id: faker.string.uuid(),
      title: faker.helpers.arrayElement(['Small', 'Medium', 'Large', 'Extra Large']),
      description: faker.lorem.sentence(),
      imageUrl: faker.image.url()
    }));
  }

  static createDTO(overrides?: Partial<CreateProductDTO>): CreateProductDTO {
    return {
      category: faker.helpers.arrayElement(['KITCHEN', 'BEDROOM']),
      title: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      rangeName: faker.helpers.arrayElement(['Modern', 'Classic', 'Contemporary']),
      images: Array.from({ length: 3 }, (_, index) => ({
        url: faker.image.url(),
        alt: faker.lorem.words(3),
        order: index
      })),
      colourIds: Array.from({ length: 2 }, () => faker.string.uuid()),
      sizeIds: Array.from({ length: 2 }, () => faker.string.uuid()),
      price: parseFloat(faker.commerce.price({ min: 500, max: 50000 })),
      isActive: true,
      ...overrides
    };
  }
}

export class ColourFactory {
  static create(overrides?: Partial<Colour>): Colour {
    return {
      id: faker.string.uuid(),
      name: faker.color.human(),
      hexCode: faker.color.rgb({ format: 'hex', prefix: '#' }),
      isActive: true,
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides
    };
  }

  static createMany(count: number, overrides?: Partial<Colour>): Colour[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  static createDTO(overrides?: Partial<CreateColourDTO>): CreateColourDTO {
    return {
      name: faker.color.human(),
      hexCode: faker.color.rgb({ format: 'hex', prefix: '#' }),
      isActive: true,
      ...overrides
    };
  }

  static createWithName(name: string): Colour {
    return this.create({ name });
  }
}

export class SizeFactory {
  static create(overrides?: Partial<Size>): Size {
    return {
      id: faker.string.uuid(),
      title: faker.helpers.arrayElement(['Small', 'Medium', 'Large', 'Extra Large', 'Custom']),
      description: faker.lorem.sentence(),
      imageUrl: faker.image.url(),
      isActive: true,
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides
    };
  }

  static createMany(count: number, overrides?: Partial<Size>): Size[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  static createDTO(overrides?: Partial<CreateSizeDTO>): CreateSizeDTO {
    return {
      title: faker.helpers.arrayElement(['Small', 'Medium', 'Large']),
      description: faker.lorem.sentence(),
      imageUrl: faker.image.url(),
      isActive: true,
      ...overrides
    };
  }
}

export class CategoryFactory {
  static create(overrides?: Partial<Category>): Category {
    const name = faker.commerce.department();
    
    return {
      id: faker.string.uuid(),
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      description: faker.lorem.paragraph(),
      isActive: true,
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides
    };
  }

  static createMany(count: number, overrides?: Partial<Category>): Category[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  static createDTO(overrides?: Partial<CreateCategoryDTO>): CreateCategoryDTO {
    const name = faker.commerce.department();
    
    return {
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      description: faker.lorem.paragraph(),
      isActive: true,
      ...overrides
    };
  }
}

export class InventoryFactory {
  static create(overrides?: Partial<ProductInventory>): ProductInventory {
    const quantity = faker.number.int({ min: 0, max: 500 });
    const lowStockThreshold = 10;
    
    return {
      id: faker.string.uuid(),
      productId: faker.string.uuid(),
      sizeId: faker.helpers.maybe(() => faker.string.uuid(), { probability: 0.5 }),
      colourId: faker.helpers.maybe(() => faker.string.uuid(), { probability: 0.5 }),
      quantity,
      isInStock: quantity > 0,
      lowStockThreshold,
      isLowStock: quantity > 0 && quantity <= lowStockThreshold,
      location: faker.location.city(),
      lastRestockedAt: faker.date.recent(),
      updatedAt: faker.date.recent(),
      ...overrides
    };
  }

  static createMany(count: number, overrides?: Partial<ProductInventory>): ProductInventory[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  static createInStock(overrides?: Partial<ProductInventory>): ProductInventory {
    return this.create({
      quantity: faker.number.int({ min: 50, max: 500 }),
      isInStock: true,
      ...overrides
    });
  }

  static createOutOfStock(overrides?: Partial<ProductInventory>): ProductInventory {
    return this.create({
      quantity: 0,
      isInStock: false,
      isLowStock: false,
      ...overrides
    });
  }

  static createLowStock(overrides?: Partial<ProductInventory>): ProductInventory {
    return this.create({
      quantity: faker.number.int({ min: 1, max: 10 }),
      isInStock: true,
      isLowStock: true,
      ...overrides
    });
  }
}

export class PricingFactory {
  static create(overrides?: Partial<ProductPricing>): ProductPricing {
    return {
      id: faker.string.uuid(),
      productId: faker.string.uuid(),
      price: parseFloat(faker.commerce.price({ min: 500, max: 50000 })),
      currency: 'GBP',
      priceType: faker.helpers.arrayElement<PriceType>(['BASE', 'SALE', 'PROMOTIONAL', 'SEASONAL', 'CLEARANCE']),
      effectiveFrom: faker.date.past(),
      effectiveUntil: faker.helpers.maybe(() => faker.date.future(), { probability: 0.5 }),
      isActive: true,
      sizeId: faker.helpers.maybe(() => faker.string.uuid(), { probability: 0.3 }),
      colourId: faker.helpers.maybe(() => faker.string.uuid(), { probability: 0.3 }),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides
    };
  }

  static createMany(count: number, overrides?: Partial<ProductPricing>): ProductPricing[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  static createBasePrice(overrides?: Partial<ProductPricing>): ProductPricing {
    return this.create({
      priceType: 'BASE',
      isActive: true,
      effectiveUntil: undefined,
      ...overrides
    });
  }

  static createSalePrice(overrides?: Partial<ProductPricing>): ProductPricing {
    return this.create({
      priceType: 'SALE',
      isActive: true,
      ...overrides
    });
  }

  static createPromotionalPrice(overrides?: Partial<ProductPricing>): ProductPricing {
    return this.create({
      priceType: 'PROMOTIONAL',
      isActive: true,
      effectiveUntil: faker.date.soon({ days: 30 }),
      ...overrides
    });
  }
}

export class TestDataFactory {
  static createCompleteProduct(): {
    product: Product;
    inventory: ProductInventory;
    pricing: ProductPricing;
  } {
    const productId = faker.string.uuid();
    
    return {
      product: ProductFactory.create({ id: productId }),
      inventory: InventoryFactory.createInStock({ productId }),
      pricing: PricingFactory.createBasePrice({ productId })
    };
  }

  static createProductWithVariants(): {
    product: Product;
    sizes: Size[];
    colours: Colour[];
    inventories: ProductInventory[];
    pricings: ProductPricing[];
  } {
    const productId = faker.string.uuid();
    const sizes = SizeFactory.createMany(3);
    const colours = ColourFactory.createMany(3);
    
    const inventories = sizes.flatMap(size =>
      colours.map(colour =>
        InventoryFactory.create({
          productId,
          sizeId: size.id,
          colourId: colour.id
        })
      )
    );
    
    const pricings = sizes.flatMap(size =>
      colours.map(colour =>
        PricingFactory.createBasePrice({
          productId,
          sizeId: size.id,
          colourId: colour.id
        })
      )
    );
    
    return {
      product: ProductFactory.create({ id: productId, sizes, colours }),
      sizes,
      colours,
      inventories,
      pricings
    };
  }

  static createUserId(): string {
    return faker.string.uuid();
  }

  static createCorrelationId(): string {
    return `corr-${faker.string.uuid()}`;
  }

  static createTimestamp(): string {
    return faker.date.recent().toISOString();
  }
}

export const factories = {
  product: ProductFactory,
  colour: ColourFactory,
  size: SizeFactory,
  category: CategoryFactory,
  inventory: InventoryFactory,
  pricing: PricingFactory,
  testData: TestDataFactory
};