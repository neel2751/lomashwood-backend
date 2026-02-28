import { z } from "zod";

export const supportTicketStatusSchema = z.enum([
  "open",
  "in_progress",
  "resolved",
  "closed",
]);

export const updateSupportTicketSchema = z.object({
  status: supportTicketStatusSchema,
  assignedTo: z.string().optional(),
  resolutionNote: z.string().optional(),
});

export type UpdateSupportTicketFormValues = z.infer<typeof updateSupportTicketSchema>;