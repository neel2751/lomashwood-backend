import { z } from 'zod';
import { SupportTicketStatus, SupportTicketPriority } from '@prisma/client';

export const createTicketSchema = z.object({
  subject: z.string().min(5).max(200),
  description: z.string().min(10).max(5000),
  category: z.string().max(100).optional(),
  priority: z.nativeEnum(SupportTicketPriority).optional().default(SupportTicketPriority.MEDIUM),
});

export const updateTicketSchema = z.object({
  status: z.nativeEnum(SupportTicketStatus).optional(),
  priority: z.nativeEnum(SupportTicketPriority).optional(),
  assignedTo: z.string().optional(),
});

export const addMessageSchema = z.object({
  body: z.string().min(1).max(5000),
});

export type CreateTicketSchema = z.infer<typeof createTicketSchema>;
export type UpdateTicketSchema = z.infer<typeof updateTicketSchema>;
export type AddMessageSchema = z.infer<typeof addMessageSchema>;