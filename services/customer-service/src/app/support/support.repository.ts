import { SupportTicket, TicketMessage, SupportTicketStatus, Prisma } from '@prisma/client';
import { prismaClient } from '../../infrastructure/db/prisma.client';
import { CreateTicketInput, UpdateTicketInput, AddMessageInput } from './support.types';
import { PaginationOptions } from '../../shared/types';
import { getPrismaSkipTake } from '../../shared/pagination';

export class SupportRepository {
  async create(profileId: string, ticketRef: string, input: CreateTicketInput): Promise<SupportTicket> {
    return prismaClient.supportTicket.create({
      data: { profileId, ticketRef, ...input },
    });
  }

  async findById(id: string): Promise<SupportTicket | null> {
    return prismaClient.supportTicket.findFirst({ where: { id, deletedAt: null } });
  }

  async findByRef(ticketRef: string): Promise<SupportTicket | null> {
    return prismaClient.supportTicket.findFirst({ where: { ticketRef, deletedAt: null } });
  }

  async findByProfileId(profileId: string, options: PaginationOptions): Promise<{ tickets: SupportTicket[]; total: number }> {
    const where: Prisma.SupportTicketWhereInput = { profileId, deletedAt: null };
    const [tickets, total] = await prismaClient.$transaction([
      prismaClient.supportTicket.findMany({ where, ...getPrismaSkipTake(options), orderBy: { createdAt: 'desc' } }),
      prismaClient.supportTicket.count({ where }),
    ]);
    return { tickets, total };
  }

  async findAll(status: SupportTicketStatus | undefined, options: PaginationOptions): Promise<{ tickets: SupportTicket[]; total: number }> {
    const where: Prisma.SupportTicketWhereInput = { deletedAt: null, ...(status ? { status } : {}) };
    const [tickets, total] = await prismaClient.$transaction([
      prismaClient.supportTicket.findMany({ where, ...getPrismaSkipTake(options), orderBy: { createdAt: 'desc' } }),
      prismaClient.supportTicket.count({ where }),
    ]);
    return { tickets, total };
  }

  async update(id: string, input: UpdateTicketInput & { resolvedAt?: Date; closedAt?: Date }): Promise<SupportTicket> {
    return prismaClient.supportTicket.update({ where: { id }, data: input });
  }

  async softDelete(id: string): Promise<void> {
    await prismaClient.supportTicket.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async addMessage(ticketId: string, input: AddMessageInput): Promise<TicketMessage> {
    return prismaClient.ticketMessage.create({ data: { ticketId, ...input } });
  }

  async getMessages(ticketId: string): Promise<TicketMessage[]> {
    return prismaClient.ticketMessage.findMany({ where: { ticketId }, orderBy: { createdAt: 'asc' } });
  }
}