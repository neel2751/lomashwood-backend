import { z } from "zod";

export const inventorySchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.coerce.number().int().min(0, "Quantity must be zero or more"),
  lowStockThreshold: z.coerce.number().int().min(0, "Threshold must be zero or more"),
});

export type InventoryFormValues = z.infer<typeof inventorySchema>;