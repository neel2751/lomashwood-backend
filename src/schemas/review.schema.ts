import { z } from "zod";

export const reviewModerationSchema = z.object({
  status: z.enum(["approved", "rejected", "pending"]),
  moderationNote: z.string().optional(),
});

export const reviewSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  productId: z.string().optional(),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Review body is required"),
  images: z.array(z.string().url()).optional(),
  video: z.string().url("Invalid video URL").optional(),
});

export type ReviewModerationFormValues = z.infer<typeof reviewModerationSchema>;
export type ReviewFormValues = z.infer<typeof reviewSchema>;