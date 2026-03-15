import { z } from "zod";

export const heroSlideSchema = z.object({
  type: z.enum(["image", "video"]),
  src: z.string().url("Invalid media URL"),
  title: z.string().min(1, "Title is required"),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  ctaText: z.string().optional(),
  ctaLink: z.string().optional(),
  secondaryCtaText: z.string().optional(),
  secondaryCtaLink: z.string().optional(),
  overlayOpacity: z.number().min(0).max(1).default(0.4),
  order: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const heroSlideUpdateSchema = heroSlideSchema.partial();

export type HeroSlideFormValues = z.infer<typeof heroSlideSchema>;
export type HeroSlideUpdateValues = z.infer<typeof heroSlideUpdateSchema>;
