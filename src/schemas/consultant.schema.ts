import { z } from "zod";

export const consultantSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  bio: z.string().optional(),
  image: z.string().url("Invalid image URL").optional(),
  specialisms: z.array(z.enum(["kitchen", "bedroom"])).min(1, "At least one specialism is required"),
  isActive: z.boolean().default(true),
});

export type ConsultantFormValues = z.infer<typeof consultantSchema>;