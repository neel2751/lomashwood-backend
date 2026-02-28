import { z } from "zod";

export const loyaltyAdjustSchema = z.object({
  points: z.coerce.number().int(),
  reason: z.string().min(1, "Reason is required"),
  type: z.enum(["credit", "debit"]),
});

export type LoyaltyAdjustFormValues = z.infer<typeof loyaltyAdjustSchema>;