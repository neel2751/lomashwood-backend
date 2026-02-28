import { z } from "zod";

export const landingPageSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  headline: z.string().min(1, "Headline is required"),
  subheadline: z.string().optional(),
  content: z.string().min(1, "Content is required"),
  heroImage: z.string().url("Invalid image URL").optional(),
  ctaLabel: z.string().optional(),
  ctaHref: z.string().optional(),
  isPublished: z.boolean().default(false),
});

export type LandingPageFormValues = z.infer<typeof landingPageSchema>;