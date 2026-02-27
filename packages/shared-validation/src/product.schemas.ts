import { z } from "zod";

export const CategoryEnum = z.enum(["KITCHEN", "BEDROOM"]);

export const ColourSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  hexCode: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .trim(),
});

export const ColourUpdateSchema = ColourSchema.partial();

export const SizeUnitSchema = z.object({
  image: z.string().url().optional(),
  title: z.string().min(1).max(200).trim(),
  description: z.string().max(1000).optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  depth: z.number().positive().optional(),
  unit: z.enum(["MM", "CM", "INCH"]).optional().default("MM"),
});

export const ProductSchema = z.object({
  title: z.string().min(2).max(255).trim(),
  description: z.string().min(10).max(5000).trim(),
  category: CategoryEnum,
  rangeName: z.string().min(1).max(200).trim(),
  style: z.string().max(100).optional(),
  finish: z.string().max(100).optional(),
  price: z.number().positive().optional().nullable(),
  images: z.array(z.string().url()).min(1).max(20),
  colourIds: z.array(z.string().uuid()).min(1),
  sizes: z.array(SizeUnitSchema).optional().default([]),
  isActive: z.boolean().optional().default(true),
  isFeatured: z.boolean().optional().default(false),
  metaTitle: z.string().max(160).optional(),
  metaDescription: z.string().max(320).optional(),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(255)
    .optional(),
});

export const ProductUpdateSchema = ProductSchema.partial().omit({ slug: true });

export const ProductFilterSchema = z.object({
  category: CategoryEnum.optional(),
  colourIds: z.array(z.string().uuid()).optional(),
  style: z.string().optional(),
  finish: z.string().optional(),
  rangeName: z.string().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  isActive: z.coerce.boolean().optional(),
  isFeatured: z.coerce.boolean().optional(),
  search: z.string().max(255).optional(),
  sortBy: z
    .enum(["price_asc", "price_desc", "newest", "popularity", "name_asc"])
    .optional()
    .default("newest"),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const SaleSchema = z.object({
  title: z.string().min(2).max(255).trim(),
  description: z.string().max(2000).trim(),
  image: z.string().url(),
  termsAndConditions: z.string().max(5000).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  isActive: z.boolean().optional().default(true),
  productIds: z.array(z.string().uuid()).optional().default([]),
  categories: z.array(CategoryEnum).optional().default([]),
});

export const SaleUpdateSchema = SaleSchema.partial();

export const PackageSchema = z.object({
  title: z.string().min(2).max(255).trim(),
  description: z.string().max(2000).trim(),
  image: z.string().url(),
  price: z.number().positive().optional().nullable(),
  category: CategoryEnum,
  isActive: z.boolean().optional().default(true),
  productIds: z.array(z.string().uuid()).optional().default([]),
});

export const PackageUpdateSchema = PackageSchema.partial();

export const InventoryUpdateSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(0),
  lowStockThreshold: z.number().int().min(0).optional(),
});

export type ColourInput = z.infer<typeof ColourSchema>;
export type ColourUpdateInput = z.infer<typeof ColourUpdateSchema>;
export type SizeUnitInput = z.infer<typeof SizeUnitSchema>;
export type ProductInput = z.infer<typeof ProductSchema>;
export type ProductUpdateInput = z.infer<typeof ProductUpdateSchema>;
export type ProductFilterInput = z.infer<typeof ProductFilterSchema>;
export type SaleInput = z.infer<typeof SaleSchema>;
export type SaleUpdateInput = z.infer<typeof SaleUpdateSchema>;
export type PackageInput = z.infer<typeof PackageSchema>;
export type PackageUpdateInput = z.infer<typeof PackageUpdateSchema>;
export type InventoryUpdateInput = z.infer<typeof InventoryUpdateSchema>;
export type CategoryEnumType = z.infer<typeof CategoryEnum>;