import { z } from 'zod';

// Category schema
export const CategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().optional(),
  image: z.string().optional(),
  isActive: z.boolean(),
  sortOrder: z.number(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Category = z.infer<typeof CategorySchema>;

export const CreateCategorySchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  image: z.string().optional(),
  sortOrder: z.number().optional(),
});

export type CreateCategoryRequest = z.infer<typeof CreateCategorySchema>;

export const UpdateCategorySchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

export type UpdateCategoryRequest = z.infer<typeof UpdateCategorySchema>;

// Colour schema
export const ColourSchema = z.object({
  id: z.string(),
  name: z.string(),
  hexCode: z.string(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Colour = z.infer<typeof ColourSchema>;

export const CreateColourSchema = z.object({
  name: z.string(),
  hexCode: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color format'),
});

export type CreateColourRequest = z.infer<typeof CreateColourSchema>;

export const UpdateColourSchema = z.object({
  name: z.string().optional(),
  hexCode: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color format').optional(),
  isActive: z.boolean().optional(),
});

export type UpdateColourRequest = z.infer<typeof UpdateColourSchema>;

// Size schema
export const SizeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  image: z.string().optional(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Size = z.infer<typeof SizeSchema>;

export const CreateSizeSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  image: z.string().optional(),
});

export type CreateSizeRequest = z.infer<typeof CreateSizeSchema>;

export const UpdateSizeSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type UpdateSizeRequest = z.infer<typeof UpdateSizeSchema>;

// Product schema
export const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  shortDescription: z.string().optional(),
  images: z.array(z.string()),
  price: z.number(),
  originalPrice: z.number().optional(),
  onSale: z.boolean(),
  discount: z.number().optional(),
  category: CategorySchema,
  colours: z.array(ColourSchema),
  sizes: z.array(SizeSchema),
  styles: z.array(z.string()),
  finishes: z.array(z.string()),
  range: z.string(),
  inStock: z.boolean(),
  featured: z.boolean(),
  rating: z.number().optional(),
  reviewCount: z.number().optional(),
  popularity: z.number().optional(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Product = z.infer<typeof ProductSchema>;

export const CreateProductSchema = z.object({
  name: z.string(),
  description: z.string(),
  shortDescription: z.string().optional(),
  images: z.array(z.string()),
  price: z.number(),
  originalPrice: z.number().optional(),
  categoryId: z.string(),
  colourIds: z.array(z.string()),
  sizeIds: z.array(z.string()),
  styles: z.array(z.string()),
  finishes: z.array(z.string()),
  range: z.string(),
  inStock: z.boolean().default(true),
  featured: z.boolean().default(false),
});

export type CreateProductRequest = z.infer<typeof CreateProductSchema>;

export const UpdateProductSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  images: z.array(z.string()).optional(),
  price: z.number().optional(),
  originalPrice: z.number().optional(),
  categoryId: z.string().optional(),
  colourIds: z.array(z.string()).optional(),
  sizeIds: z.array(z.string()).optional(),
  styles: z.array(z.string()).optional(),
  finishes: z.array(z.string()).optional(),
  range: z.string().optional(),
  inStock: z.boolean().optional(),
  featured: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export type UpdateProductRequest = z.infer<typeof UpdateProductSchema>;

export const FilterProductSchema = z.object({
  category: z.string().optional(),
  colours: z.array(z.string()).optional(),
  styles: z.array(z.string()).optional(),
  finishes: z.array(z.string()).optional(),
  range: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  search: z.string().optional(),
  inStock: z.boolean().optional(),
  featured: z.boolean().optional(),
  onSale: z.boolean().optional(),
  sort: z.enum(['price-asc', 'price-desc', 'popularity', 'newest', 'name']).optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
});

export type FilterProductRequest = z.infer<typeof FilterProductSchema>;

// Inventory schema
export const InventorySchema = z.object({
  id: z.string(),
  productId: z.string(),
  sizeId: z.string(),
  colourId: z.string(),
  quantity: z.number(),
  reservedQuantity: z.number(),
  availableQuantity: z.number(),
  lowStockThreshold: z.number(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Inventory = z.infer<typeof InventorySchema>;

export const CreateInventorySchema = z.object({
  productId: z.string(),
  sizeId: z.string(),
  colourId: z.string(),
  quantity: z.number(),
  lowStockThreshold: z.number().default(10),
});

export type CreateInventoryRequest = z.infer<typeof CreateInventorySchema>;

export const UpdateInventorySchema = z.object({
  quantity: z.number().optional(),
  lowStockThreshold: z.number().optional(),
  isActive: z.boolean().optional(),
});

export type UpdateInventoryRequest = z.infer<typeof UpdateInventorySchema>;

// Pricing schema
export const PricingSchema = z.object({
  id: z.string(),
  productId: z.string(),
  sizeId: z.string(),
  colourId: z.string(),
  basePrice: z.number(),
  salePrice: z.number().optional(),
  saleStart: z.string().datetime().optional(),
  saleEnd: z.string().datetime().optional(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Pricing = z.infer<typeof PricingSchema>;

export const CreatePricingSchema = z.object({
  productId: z.string(),
  sizeId: z.string(),
  colourId: z.string(),
  basePrice: z.number(),
  salePrice: z.number().optional(),
  saleStart: z.string().datetime().optional(),
  saleEnd: z.string().datetime().optional(),
});

export type CreatePricingRequest = z.infer<typeof CreatePricingSchema>;

export const UpdatePricingSchema = z.object({
  basePrice: z.number().optional(),
  salePrice: z.number().optional(),
  saleStart: z.string().datetime().optional(),
  saleEnd: z.string().datetime().optional(),
  isActive: z.boolean().optional(),
});

export type UpdatePricingRequest = z.infer<typeof UpdatePricingSchema>;
