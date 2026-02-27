import { SupportTicketStatus, SupportTicketPriority } from '@prisma/client';

export interface SupportTicketDto {
  id: string;
  profileId: string;
  ticketRef: string;
  subject: string;
  description: string;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  category: string | null;
  assignedTo: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TicketMessageDto {
  id: string;
  ticketId: string;
  senderId: string;
  senderType: string;
  body: string;
  createdAt: string;
}

export interface CreateTicketInput {
  subject: string;
  description: string;
  category?: string;
  priority?: SupportTicketPriority;
}

export interface UpdateTicketInput {
  status?: SupportTicketStatus;
  priority?: SupportTicketPriority;
  assignedTo?: string;
}

export interface AddMessageInput {
  body: string;
  senderId: string;
  senderType: string;
}