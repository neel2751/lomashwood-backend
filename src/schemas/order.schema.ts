import { z } from "zod";

export const orderStatusSchema = z.enum([
  "pending",
  "confirmed",
  "processing",
  "dispatched",
  "delivered",
  "cancelled",
]);

export const updateOrderSchema = z.object({
  status: orderStatusSchema,
  notes: z.string().optional(),
});

export type UpdateOrderFormValues = z.infer<typeof updateOrderSchema>;