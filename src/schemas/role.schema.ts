import { z } from "zod";

export const roleSchema = z.object({
  name: z.string().min(1, "Role name is required"),
  description: z.string().optional(),
  permissions: z.array(z.string()).min(1, "At least one permission is required"),
});

export type RoleFormValues = z.infer<typeof roleSchema>;