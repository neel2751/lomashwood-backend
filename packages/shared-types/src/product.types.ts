export type ProductCategory = 'KITCHEN' | 'BEDROOM';

export type ProductStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' | 'DRAFT';

export type ProductFinish = 'GLOSS' | 'MATT' | 'WOOD_EFFECT' | 'HANDLELESS' | 'TEXTURED' | 'PAINTED' | 'OTHER';

export type ProductStyle = 'MODERN' | 'TRADITIONAL' | 'SHAKER' | 'CONTEMPORARY' | 'HANDLELESS' | 'COUNTRY' | 'MINIMALIST' | 'CLASSIC' | 'OTHER';

export type PricingType = 'FIXED' | 'PER_UNIT' | 'RANGE' | 'ON_REQUEST';

export type InventoryStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'DISCONTINUED' | 'PRE_ORDER';

export type SaleType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'BUY_X_GET_Y' | 'PACKAGE';

export interface Colour {
  readonly id: string;
  readonly name: string;
  readonly hexCode: string;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface ProductSize {
  readonly id: string;
  readonly productId: string;
  readonly title: string;
  readonly description: string | null;
  readonly imageUrl: string | null;
  readonly width: number | null;
  readonly height: number | null;
  readonly depth: number | null;
  readonly unit: string;
  readonly sku: string | null;
  readonly position: number;
}

export interface ProductImage {
  readonly id: string;
  readonly productId: string;
  readonly url: string;
  readonly altText: string | null;
  readonly isPrimary: boolean;
  readonly position: number;
}

export interface ProductPricing {
  readonly id: string;
  readonly productId: string;
  readonly type: PricingType;
  readonly basePrice: number | null;
  readonly minPrice: number | null;
  readonly maxPrice: number | null;
  readonly currency: string;
  readonly vatIncluded: boolean;
  readonly vatRate: number;
  readonly displayText: string | null;
  readonly updatedAt: Date;
}

export interface ProductInventory {
  readonly id: string;
  readonly productId: string;
  readonly status: InventoryStatus;
  readonly quantity: number | null;
  readonly lowStockThreshold: number | null;
  readonly leadTimeDays: number | null;
  readonly updatedAt: Date;
}

export interface Category {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly type: ProductCategory;
  readonly description: string | null;
  readonly imageUrl: string | null;
  readonly parentId: string | null;
  readonly position: number;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface Product {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly description: string;
  readonly category: ProductCategory;
  readonly categoryId: string;
  readonly rangeName: string | null;
  readonly style: ProductStyle | null;
  readonly finish: ProductFinish | null;
  readonly status: ProductStatus;
  readonly isFeatured: boolean;
  readonly images: readonly ProductImage[];
  readonly colours: readonly Colour[];
  readonly sizes: readonly ProductSize[];
  readonly pricing: ProductPricing | null;
  readonly inventory: ProductInventory | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;
}

export interface ProductSummary {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly category: ProductCategory;
  readonly rangeName: string | null;
  readonly style: ProductStyle | null;
  readonly finish: ProductFinish | null;
  readonly status: ProductStatus;
  readonly primaryImageUrl: string | null;
  readonly basePrice: number | null;
  readonly currency: string;
  readonly inventoryStatus: InventoryStatus | null;
  readonly createdAt: Date;
}

export interface Sale {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly imageUrl: string | null;
  readonly type: SaleType;
  readonly discountValue: number | null;
  readonly discountPercentage: number | null;
  readonly termsAndConditions: string | null;
  readonly appliesTo: readonly ProductCategory[];
  readonly productIds: readonly string[];
  readonly isActive: boolean;
  readonly validFrom: Date;
  readonly validTo: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface Package {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly imageUrl: string | null;
  readonly category: ProductCategory;
  readonly basePrice: number | null;
  readonly currency: string;
  readonly includes: readonly string[];
  readonly isActive: boolean;
  readonly position: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface ProductFilterOptions {
  readonly category?: ProductCategory | undefined;
  readonly colours?: readonly string[] | undefined;
  readonly styles?: readonly ProductStyle[] | undefined;
  readonly finishes?: readonly ProductFinish[] | undefined;
  readonly rangeNames?: readonly string[] | undefined;
  readonly minPrice?: number | undefined;
  readonly maxPrice?: number | undefined;
  readonly status?: ProductStatus | undefined;
  readonly search?: string | undefined;
}

export type ProductSortField = 'price' | 'popularity' | 'newest' | 'title';

export interface ProductSortOptions {
  readonly field: ProductSortField;
  readonly direction: 'asc' | 'desc';
}

export interface ProductCreatedEventPayload {
  readonly productId: string;
  readonly title: string;
  readonly category: ProductCategory;
  readonly slug: string;
  readonly createdAt: Date;
}

export interface ProductUpdatedEventPayload {
  readonly productId: string;
  readonly updatedFields: readonly string[];
  readonly updatedAt: Date;
}

export interface InventoryUpdatedEventPayload {
  readonly productId: string;
  readonly previousStatus: InventoryStatus;
  readonly newStatus: InventoryStatus;
  readonly quantity: number | null;
  readonly updatedAt: Date;
}

export interface PriceChangedEventPayload {
  readonly productId: string;
  readonly previousPrice: number | null;
  readonly newPrice: number | null;
  readonly currency: string;
  readonly changedAt: Date;
}