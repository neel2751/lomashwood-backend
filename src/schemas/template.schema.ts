import { z } from "zod";

export const templateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  channel: z.enum(["email", "sms", "push"]),
  subject: z.string().optional(),
  body: z.string().min(1, "Template body is required"),
  variables: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
});

export type TemplateFormValues = z.infer<typeof templateSchema>;