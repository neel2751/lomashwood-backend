import { z } from "zod";

export const refundSchema = z.object({
  orderId: z.string().min(1, "Order is required"),
  amount: z.coerce.number().min(0.01, "Refund amount must be greater than zero"),
  reason: z.string().min(1, "Reason is required"),
  notes: z.string().optional(),
});

export type RefundFormValues = z.infer<typeof refundSchema>;