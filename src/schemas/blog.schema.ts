import { z } from "zod";

export const blogSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  excerpt: z.string().min(1, "Excerpt is required"),
  content: z.string().min(1, "Content is required"),
  coverImage: z.string().url("Invalid image URL"),
  tags: z.array(z.string()).optional(),
  isPublished: z.boolean().default(false),
  publishedAt: z.string().optional(),
});

export type BlogFormValues = z.infer<typeof blogSchema>;