import { z } from "zod";

export const pricingSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  basePrice: z.coerce.number().min(0, "Base price must be a positive number"),
  salePrice: z.coerce.number().min(0, "Sale price must be a positive number").optional(),
  currency: z.string().default("GBP"),
  isActive: z.boolean().default(true),
  validFrom: z.string().optional(),
  validTo: z.string().optional(),
});

export type PricingFormValues = z.infer<typeof pricingSchema>;