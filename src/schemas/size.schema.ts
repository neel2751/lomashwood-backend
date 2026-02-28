import { z } from "zod";

export const sizeSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  image: z.string().url("Invalid image URL").optional(),
  productId: z.string().min(1, "Product is required"),
});

export type SizeFormValues = z.infer<typeof sizeSchema>;