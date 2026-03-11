import type { PaginationParams } from "./api.types";

export type ProductCategory = "kitchen" | "bedroom";

export type ProductFinish =
  | "gloss"
  | "matt"
  | "satin"
  | "handleless"
  | "shaker"
  | "in-frame";

export type ProductStyle =
  | "contemporary"
  | "traditional"
  | "modern"
  | "classic"
  | "rustic";

export type ProductStyleOption = {
  id: string;
  name: string;
  description?: string | null;
  image?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProductFinishOption = {
  id: string;
  name: string;
  description?: string | null;
  image?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Colour = {
  id: string;
  name: string;
  hexCode: string;
  createdAt: string;
  updatedAt: string;
};

export type Size = {
  id: string;
  title: string;
  description?: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
};

export type Category = {
  id: string;
  name: string;
  type: ProductCategory;
  createdAt: string;
  updatedAt: string;
};

export type Product = {
  id: string;
  title: string;
  description: string;
  category: ProductCategory;
  rangeName: string;
  images: string[];
  price?: number;
  packageId?: string | null;
  finishId?: string | null;
  styleId?: string | null;
  package?: Package | null;
  packageTitle?: string | null;
  finish?: string | null;
  style?: string | null;
  colours: Colour[];
  sizes: Size[];
  category_ref?: Category;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

export type InventoryItem = {
  id: string;
  productId: string;
  product?: Pick<Product, "id" | "title" | "category">;
  sku: string;
  quantity: number;
  lowStockThreshold?: number;
  isLowStock?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PricingRule = {
  id: string;
  productId: string;
  product?: Pick<Product, "id" | "title">;
  label: string;
  price: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Sale = {
  id: string;
  title: string;
  description?: string;
  image?: string;
  termsAndConditions?: string;
  productIds: string[];
  products?: Pick<Product, "id" | "title" | "category">[];
  categories: ProductCategory[];
  isActive: boolean;
  startsAt?: string;
  endsAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type Package = {
  id: string;
  title: string;
  description?: string;
  image?: string;
  category: ProductCategory;
  price?: number;
  features: string[];
  isActive: boolean;
  productsCount?: number;
  products?: Pick<Product, "id" | "title" | "category" | "price" | "isPublished">[];
  createdAt: string;
  updatedAt: string;
};

export type Showroom = {
  id: string;
  name: string;
  address: string;
  image?: string;
  email: string;
  phone: string;
  openingHours: string;
  mapLink: string;
  createdAt: string;
  updatedAt: string;
};

export type HomeSlide = {
  id: string;
  title: string;
  description?: string;
  image: string;
  buttonName: string;
  buttonLink?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateProductPayload = {
  title: string;
  description: string;
  category: ProductCategory;
  rangeName: string;
  images?: string[];
  price?: number;
  packageId?: string;
  finishId?: string;
  styleId?: string;
  finish?: ProductFinish;
  style?: ProductStyle;
  colourIds: string[];
  sizeIds?: string[];
  isPublished?: boolean;
};

export type UpdateProductPayload = Partial<CreateProductPayload>;

export type CreatePackagePayload = {
  title: string;
  description?: string;
  image?: string;
  category: ProductCategory;
  price?: number;
  features?: string[];
  isActive?: boolean;
};

export type UpdatePackagePayload = Partial<CreatePackagePayload>;

export type CreateColourPayload = {
  name: string;
  hexCode: string;
};

export type CreateSizePayload = {
  title: string;
  description?: string;
  image?: string;
};

export type CreateCategoryPayload = {
  name: string;
  type: ProductCategory;
};

export type CreateSalePayload = {
  title: string;
  description?: string;
  image?: string;
  termsAndConditions?: string;
  productIds?: string[];
  categories?: ProductCategory[];
  isActive?: boolean;
  startsAt?: string;
  endsAt?: string;
};

export type CreateShowroomPayload = {
  name: string;
  address: string;
  image?: string;
  email: string;
  phone: string;
  openingHours: string;
  mapLink: string;
};

export type ProductFilterParams = PaginationParams & {
  search?: string;
  category?: ProductCategory;
  colourId?: string;
  style?: string;
  finish?: string;
  styleId?: string;
  finishId?: string;
  rangeId?: string;
  isPublished?: boolean;
};

export type InventoryFilterParams = PaginationParams & {
  search?: string;
  isLowStock?: boolean;
  productId?: string;
};

export type StockAdjustment = {
  quantity: number;
  reason: string;
};