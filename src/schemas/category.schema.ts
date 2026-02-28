import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["kitchen", "bedroom"], { required_error: "Type is required" }),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;