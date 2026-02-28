import { z } from "zod";

export const productSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  category: z.enum(["kitchen", "bedroom"], { required_error: "Category is required" }),
  rangeName: z.string().min(1, "Range name is required"),
  price: z.coerce.number().min(0, "Price must be a positive number"),
  images: z.array(z.string().url("Invalid image URL")).min(1, "At least one image is required"),
  colourIds: z.array(z.string()).min(1, "At least one colour is required"),
  sizeIds: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
});

export type ProductFormValues = z.infer<typeof productSchema>;