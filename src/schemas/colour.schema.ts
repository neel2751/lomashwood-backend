import { z } from "zod";

export const colourSchema = z.object({
  name: z.string().min(1, "Colour name is required"),
  hexCode: z
    .string()
    .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, "Invalid hex code"),
  isActive: z.boolean().default(true),
});

export type ColourFormValues = z.infer<typeof colourSchema>;