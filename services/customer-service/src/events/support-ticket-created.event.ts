import { eventProducer } from '../infrastructure/messaging/event-producer';
import { CUSTOMER_EVENT_TOPICS } from '../infrastructure/messaging/event-topics';
import { SupportTicketCreatedPayload } from '../infrastructure/messaging/event-metadata';
import { deleteCacheByPattern } from '../infrastructure/cache/redis.client';
import { REDIS_KEYS } from '../infrastructure/cache/redis.keys';
import { logger } from '../config/logger';

export interface SupportTicketCreatedEventOptions {
  correlationId?: string;
  userId?: string;
}

export async function publishSupportTicketCreatedEvent(
  ticket: {
    id: string;
    ticketRef: string;
    customerId: string;
    category: string;
    priority: string;
    subject: string;
  },
  options: SupportTicketCreatedEventOptions = {},
): Promise<void> {
  const payload: SupportTicketCreatedPayload = {
    ticketId: ticket.id,
    ticketRef: ticket.ticketRef,
    customerId: ticket.customerId,
    category: ticket.category,
    priority: ticket.priority,
    subject: ticket.subject,
    createdAt: new Date().toISOString(),
  };

  try {
    await Promise.all([
      eventProducer.publish(
        CUSTOMER_EVENT_TOPICS.SUPPORT_TICKET_CREATED,
        payload,
        {
          customerId: ticket.customerId,
          correlationId: options.correlationId,
          userId: options.userId,
        },
      ),
      invalidateTicketCache(ticket.customerId),
    ]);

    logger.debug(
      { ticketId: ticket.id, ticketRef: ticket.ticketRef, customerId: ticket.customerId },
      'support-ticket-created event published',
    );
  } catch (error) {
    logger.error(
      { ticketId: ticket.id, error: (error as Error).message },
      'Failed to publish support-ticket-created event',
    );
    throw error;
  }
}

export async function publishSupportTicketUpdatedEvent(
  ticket: {
    id: string;
    ticketRef: string;
    customerId: string;
    status: string;
    agentId?: string;
  },
  options: SupportTicketCreatedEventOptions = {},
): Promise<void> {
  const payload = {
    ticketId: ticket.id,
    ticketRef: ticket.ticketRef,
    customerId: ticket.customerId,
    status: ticket.status,
    agentId: ticket.agentId,
    updatedAt: new Date().toISOString(),
  };

  try {
    await Promise.all([
      eventProducer.publish(
        CUSTOMER_EVENT_TOPICS.SUPPORT_TICKET_UPDATED,
        payload,
        {
          customerId: ticket.customerId,
          correlationId: options.correlationId,
          userId: options.userId,
        },
      ),
      invalidateTicketCache(ticket.customerId),
    ]);

    logger.debug(
      { ticketId: ticket.id, status: ticket.status },
      'support-ticket-updated event published',
    );
  } catch (error) {
    logger.error(
      { ticketId: ticket.id, error: (error as Error).message },
      'Failed to publish support-ticket-updated event',
    );
    throw error;
  }
}

async function invalidateTicketCache(customerId: string): Promise<void> {
  await deleteCacheByPattern(REDIS_KEYS.supportTicket.pattern(customerId));
}