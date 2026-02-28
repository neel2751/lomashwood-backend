import { z } from "zod";

export const seoSchema = z.object({
  pageId: z.string().min(1, "Page is required"),
  metaTitle: z.string().min(1, "Meta title is required").max(60, "Meta title must be under 60 characters"),
  metaDescription: z.string().min(1, "Meta description is required").max(160, "Meta description must be under 160 characters"),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().url("Invalid OG image URL").optional(),
  canonicalUrl: z.string().url("Invalid canonical URL").optional(),
  noIndex: z.boolean().default(false),
  noFollow: z.boolean().default(false),
});

export type SeoFormValues = z.infer<typeof seoSchema>;