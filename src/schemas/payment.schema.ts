import { z } from "zod";

export const paymentStatusSchema = z.enum([
  "pending",
  "paid",
  "failed",
  "refunded",
  "partially_refunded",
]);

export const updatePaymentSchema = z.object({
  status: paymentStatusSchema,
  notes: z.string().optional(),
});

export type UpdatePaymentFormValues = z.infer<typeof updatePaymentSchema>;