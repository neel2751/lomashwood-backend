import { SupportTicket, TicketMessage } from '@prisma/client';
import { SupportTicketDto, TicketMessageDto } from './support.types';

export function toSupportTicketDto(ticket: SupportTicket): SupportTicketDto {
  return {
    id: ticket.id,
    profileId: ticket.profileId,
    ticketRef: ticket.ticketRef,
    subject: ticket.subject,
    description: ticket.description,
    status: ticket.status,
    priority: ticket.priority,
    category: ticket.category,
    assignedTo: ticket.assignedTo,
    resolvedAt: ticket.resolvedAt ? ticket.resolvedAt.toISOString() : null,
    closedAt: ticket.closedAt ? ticket.closedAt.toISOString() : null,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
  };
}

export function toTicketMessageDto(message: TicketMessage): TicketMessageDto {
  return {
    id: message.id,
    ticketId: message.ticketId,
    senderId: message.senderId,
    senderType: message.senderType,
    body: message.body,
    createdAt: message.createdAt.toISOString(),
  };
}