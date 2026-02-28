import { z } from "zod";

export const cmsPageSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  content: z.string().min(1, "Content is required"),
  pageType: z.enum([
    "finance",
    "about_us",
    "our_process",
    "why_choose_us",
    "contact_us",
    "career",
    "faqs",
    "newsletter",
    "custom",
  ]),
  isPublished: z.boolean().default(false),
});

export type CmsPageFormValues = z.infer<typeof cmsPageSchema>;