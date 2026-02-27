import { SupportTicketStatus } from '@prisma/client';
import { SupportRepository } from './support.repository';
import { ProfileRepository } from '../profiles/profile.repository';
import { toSupportTicketDto, toTicketMessageDto } from './support.mapper';
import { SupportTicketDto, TicketMessageDto, CreateTicketInput, UpdateTicketInput } from './support.types';
import { NotFoundError, ForbiddenError } from '../../shared/errors';
import { publishEvent } from '../../infrastructure/messaging/event-producer';
import { CUSTOMER_TOPICS } from '../../infrastructure/messaging/event-topics';
import { createEventMetadata } from '../../infrastructure/messaging/event-metadata';
import { PaginationOptions, PaginatedResult } from '../../shared/types';
import { buildPaginationMeta, generateTicketRef } from '../../shared/utils';

export class SupportService {
  constructor(
    private readonly supportRepo: SupportRepository,
    private readonly profileRepo: ProfileRepository,
  ) {}

  async createTicket(userId: string, input: CreateTicketInput): Promise<SupportTicketDto> {
    const profile = await this.profileRepo.findByUserId(userId);
    if (!profile) throw new NotFoundError('Profile');

    const ticketRef = generateTicketRef();
    const ticket = await this.supportRepo.create(profile.id, ticketRef, input);
    const dto = toSupportTicketDto(ticket);

    await publishEvent(CUSTOMER_TOPICS.SUPPORT_TICKET_CREATED, ticket.id, {
      ...createEventMetadata(CUSTOMER_TOPICS.SUPPORT_TICKET_CREATED),
      ticketId: ticket.id,
      ticketRef,
      profileId: profile.id,
      subject: input.subject,
    });

    return dto;
  }

  async getMyTickets(userId: string, options: PaginationOptions): Promise<PaginatedResult<SupportTicketDto>> {
    const profile = await this.profileRepo.findByUserId(userId);
    if (!profile) throw new NotFoundError('Profile');

    const { tickets, total } = await this.supportRepo.findByProfileId(profile.id, options);
    return buildPaginationMeta(tickets.map(toSupportTicketDto), total, options);
  }

  async getTicketById(userId: string, ticketId: string, isAdmin: boolean): Promise<SupportTicketDto> {
    const ticket = await this.supportRepo.findById(ticketId);
    if (!ticket) throw new NotFoundError('Ticket');

    if (!isAdmin) {
      const profile = await this.profileRepo.findByUserId(userId);
      if (!profile || ticket.profileId !== profile.id) throw new ForbiddenError();
    }

    return toSupportTicketDto(ticket);
  }

  async getAllTickets(status: SupportTicketStatus | undefined, options: PaginationOptions): Promise<PaginatedResult<SupportTicketDto>> {
    const { tickets, total } = await this.supportRepo.findAll(status, options);
    return buildPaginationMeta(tickets.map(toSupportTicketDto), total, options);
  }

  async updateTicket(ticketId: string, input: UpdateTicketInput): Promise<SupportTicketDto> {
    const ticket = await this.supportRepo.findById(ticketId);
    if (!ticket) throw new NotFoundError('Ticket');

    const updateData: Parameters<SupportRepository['update']>[1] = { ...input };

    if (input.status === SupportTicketStatus.RESOLVED) {
      updateData.resolvedAt = new Date();
    }
    if (input.status === SupportTicketStatus.CLOSED) {
      updateData.closedAt = new Date();
    }

    const updated = await this.supportRepo.update(ticketId, updateData);

    if (input.status === SupportTicketStatus.RESOLVED) {
      await publishEvent(CUSTOMER_TOPICS.SUPPORT_TICKET_RESOLVED, ticketId, {
        ...createEventMetadata(CUSTOMER_TOPICS.SUPPORT_TICKET_RESOLVED),
        ticketId,
        profileId: ticket.profileId,
      });
    }

    return toSupportTicketDto(updated);
  }

  async addMessage(userId: string, ticketId: string, body: string, isAdmin: boolean): Promise<TicketMessageDto> {
    const ticket = await this.supportRepo.findById(ticketId);
    if (!ticket) throw new NotFoundError('Ticket');

    if (!isAdmin) {
      const profile = await this.profileRepo.findByUserId(userId);
      if (!profile || ticket.profileId !== profile.id) throw new ForbiddenError();
    }

    const message = await this.supportRepo.addMessage(ticketId, {
      body,
      senderId: userId,
      senderType: isAdmin ? 'admin' : 'customer',
    });

    return toTicketMessageDto(message);
  }

  async getMessages(userId: string, ticketId: string, isAdmin: boolean): Promise<TicketMessageDto[]> {
    const ticket = await this.supportRepo.findById(ticketId);
    if (!ticket) throw new NotFoundError('Ticket');

    if (!isAdmin) {
      const profile = await this.profileRepo.findByUserId(userId);
      if (!profile || ticket.profileId !== profile.id) throw new ForbiddenError();
    }

    const messages = await this.supportRepo.getMessages(ticketId);
    return messages.map(toTicketMessageDto);
  }
}