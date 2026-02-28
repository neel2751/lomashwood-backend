import { z } from "zod";

export const mediaSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  backgroundImage: z.string().url("Invalid background image URL").optional(),
  items: z.array(
    z.object({
      type: z.enum(["image", "video"]),
      url: z.string().url("Invalid media URL"),
      caption: z.string().optional(),
    })
  ).min(1, "At least one media item is required"),
  isActive: z.boolean().default(true),
});

export type MediaFormValues = z.infer<typeof mediaSchema>;