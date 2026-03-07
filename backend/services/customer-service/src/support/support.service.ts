import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupportTicket } from './entities/support-ticket.entity';
import { TicketMessage } from './entities/ticket-message.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';

@Injectable()
export class SupportService {
  constructor(
    @InjectRepository(SupportTicket)
    private supportTicketRepository: Repository<SupportTicket>,
    @InjectRepository(TicketMessage)
    private ticketMessageRepository: Repository<TicketMessage>,
  ) {}

  async findAll(params: {
    page: number;
    limit: number;
    status?: string;
    priority?: string;
    customerId?: string;
    assignedTo?: string;
  }): Promise<{ tickets: SupportTicket[]; total: number; page: number; limit: number }> {
    const { page, limit, status, priority, customerId, assignedTo } = params;
    const skip = (page - 1) * limit;

    const query = this.supportTicketRepository.createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.customer', 'customer')
      .leftJoinAndSelect('ticket.assignedTo', 'assignedTo')
      .leftJoinAndSelect('ticket.messages', 'messages');

    if (status) {
      query.andWhere('ticket.status = :status', { status });
    }

    if (priority) {
      query.andWhere('ticket.priority = :priority', { priority });
    }

    if (customerId) {
      query.andWhere('ticket.customerId = :customerId', { customerId });
    }

    if (assignedTo) {
      query.andWhere('ticket.assignedToId = :assignedTo', { assignedTo });
    }

    const [tickets, total] = await query
      .orderBy('ticket.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      tickets,
      total,
      page,
      limit,
    };
  }

  async findById(id: string, user?: any): Promise<SupportTicket | null> {
    const query = this.supportTicketRepository.createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.customer', 'customer')
      .leftJoinAndSelect('ticket.assignedTo', 'assignedTo')
      .leftJoinAndSelect('ticket.messages', 'messages')
      .leftJoinAndSelect('messages.author', 'messageAuthor')
      .where('ticket.id = :id', { id });

    // Apply user access control
    if (user?.role !== 'ADMIN' && user?.role !== 'STAFF') {
      query.andWhere('ticket.customerId = :customerId', { customerId: user?.id });
    }

    return query.getOne();
  }

  async create(createTicketDto: CreateTicketDto, user?: any): Promise<SupportTicket> {
    const ticket = this.supportTicketRepository.create({
      ...createTicketDto,
      customerId: user?.id || createTicketDto.customerId,
      status: 'OPEN',
      ticketNumber: await this.generateTicketNumber(),
    });

    const savedTicket = await this.supportTicketRepository.save(ticket);

    // Add initial message if provided
    if (createTicketDto.message) {
      await this.addMessage(savedTicket.id, {
        content: createTicketDto.message,
        isInternal: false,
      }, user);
    }

    return this.findById(savedTicket.id);
  }

  async update(id: string, updateTicketDto: UpdateTicketDto, user?: any): Promise<SupportTicket | null> {
    const ticket = await this.findById(id, user);
    if (!ticket) {
      return null;
    }

    // Check if user can update this ticket
    if (user?.role !== 'ADMIN' && user?.role !== 'STAFF' && ticket.customerId !== user?.id) {
      return null;
    }

    await this.supportTicketRepository.update(id, {
      ...updateTicketDto,
      updatedAt: new Date(),
    });

    return this.findById(id, user);
  }

  async addMessage(ticketId: string, messageData: {
    content: string;
    attachments?: string[];
    isInternal?: boolean;
  }, user?: any): Promise<TicketMessage | null> {
    const ticket = await this.supportTicketRepository.findOne({ where: { id: ticketId } });
    if (!ticket) {
      return null;
    }

    const message = this.ticketMessageRepository.create({
      ticketId,
      content: messageData.content,
      attachments: messageData.attachments || [],
      isInternal: messageData.isInternal || false,
      authorId: user?.id,
      authorType: user?.role === 'ADMIN' || user?.role === 'STAFF' ? 'STAFF' : 'CUSTOMER',
    });

    const savedMessage = await this.ticketMessageRepository.save(message);

    // Update ticket's last activity
    await this.supportTicketRepository.update(ticketId, {
      lastActivityAt: new Date(),
      updatedAt: new Date(),
    });

    return savedMessage;
  }

  async getMessages(ticketId: string, user?: any): Promise<TicketMessage[] | null> {
    const ticket = await this.findById(ticketId, user);
    if (!ticket) {
      return null;
    }

    return this.ticketMessageRepository.createQueryBuilder('message')
      .leftJoinAndSelect('message.author', 'author')
      .where('message.ticketId = :ticketId', { ticketId })
      .orderBy('message.createdAt', 'ASC')
      .getMany();
  }

  async assign(ticketId: string, assignedToId: string, notes?: string): Promise<SupportTicket | null> {
    const ticket = await this.supportTicketRepository.findOne({ where: { id: ticketId } });
    if (!ticket) {
      return null;
    }

    await this.supportTicketRepository.update(ticketId, {
      assignedToId,
      status: 'ASSIGNED',
      assignedAt: new Date(),
      assignmentNotes: notes,
      updatedAt: new Date(),
    });

    // Add internal message about assignment
    await this.addMessage(ticketId, {
      content: `Ticket assigned to support agent. ${notes ? `Notes: ${notes}` : ''}`,
      isInternal: true,
    });

    return this.findById(ticketId);
  }

  async close(ticketId: string, closeData: {
    resolution?: string;
    satisfaction?: number;
    notes?: string;
  }, user?: any): Promise<SupportTicket | null> {
    const ticket = await this.findById(ticketId, user);
    if (!ticket) {
      return null;
    }

    await this.supportTicketRepository.update(ticketId, {
      status: 'CLOSED',
      resolution: closeData.resolution,
      customerSatisfaction: closeData.satisfaction,
      closedAt: new Date(),
      closedBy: user?.id,
      closingNotes: closeData.notes,
      updatedAt: new Date(),
    });

    // Add final message if provided
    if (closeData.notes) {
      await this.addMessage(ticketId, {
        content: closeData.notes,
        isInternal: false,
      }, user);
    }

    return this.findById(ticketId, user);
  }

  async reopen(ticketId: string, reason?: string, user?: any): Promise<SupportTicket | null> {
    const ticket = await this.supportTicketRepository.findOne({ where: { id: ticketId } });
    if (!ticket) {
      return null;
    }

    await this.supportTicketRepository.update(ticketId, {
      status: 'REOPENED',
      reopenedAt: new Date(),
      reopenedBy: user?.id,
      reopenReason: reason,
      updatedAt: new Date(),
    });

    // Add message about reopening
    await this.addMessage(ticketId, {
      content: `Ticket reopened. ${reason ? `Reason: ${reason}` : ''}`,
      isInternal: false,
    }, user);

    return this.findById(ticketId, user);
  }

  async findByCustomer(customerId: string, params: {
    page: number;
    limit: number;
    status?: string;
  }, user?: any): Promise<{ tickets: SupportTicket[]; total: number; page: number; limit: number }> {
    const { page, limit, status } = params;
    const skip = (page - 1) * limit;

    // Apply user access control
    const targetCustomerId = (user?.role !== 'ADMIN' && user?.role !== 'STAFF') ? user?.id : customerId;

    const query = this.supportTicketRepository.createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.assignedTo', 'assignedTo')
      .where('ticket.customerId = :customerId', { customerId: targetCustomerId });

    if (status) {
      query.andWhere('ticket.status = :status', { status });
    }

    const [tickets, total] = await query
      .orderBy('ticket.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      tickets,
      total,
      page,
      limit,
    };
  }

  async getStats(
    startDate?: Date,
    endDate?: Date,
    assignedTo?: string
  ): Promise<{
    totalTickets: number;
    openTickets: number;
    closedTickets: number;
    averageResolutionTime: number;
    customerSatisfaction: number;
    priorityBreakdown: Record<string, number>;
    categoryBreakdown: Record<string, number>;
  }> {
    const query = this.supportTicketRepository.createQueryBuilder('ticket');

    if (startDate) {
      query.andWhere('ticket.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('ticket.createdAt <= :endDate', { endDate });
    }

    if (assignedTo) {
      query.andWhere('ticket.assignedToId = :assignedTo', { assignedTo });
    }

    const tickets = await query.getMany();

    const totalTickets = tickets.length;
    const openTickets = tickets.filter(t => ['OPEN', 'ASSIGNED', 'IN_PROGRESS'].includes(t.status)).length;
    const closedTickets = tickets.filter(t => t.status === 'CLOSED').length;

    const averageResolutionTime = closedTickets > 0
      ? tickets
          .filter(t => t.status === 'CLOSED' && t.closedAt)
          .reduce((sum, ticket) => {
            const resolutionTime = ticket.closedAt!.getTime() - ticket.createdAt.getTime();
            return sum + resolutionTime;
          }, 0) / closedTickets
      : 0;

    const customerSatisfaction = tickets
      .filter(t => t.customerSatisfaction !== null)
      .reduce((sum, ticket) => sum + ticket.customerSatisfaction!, 0) / 
      tickets.filter(t => t.customerSatisfaction !== null).length || 0;

    const priorityBreakdown = tickets.reduce((acc, ticket) => {
      acc[ticket.priority] = (acc[ticket.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const categoryBreakdown = tickets.reduce((acc, ticket) => {
      acc[ticket.category] = (acc[ticket.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalTickets,
      openTickets,
      closedTickets,
      averageResolutionTime,
      customerSatisfaction,
      priorityBreakdown,
      categoryBreakdown,
    };
  }

  async getCategories(): Promise<string[]> {
    // This would typically come from a database table or configuration
    return [
      'Technical Support',
      'Billing & Payments',
      'Product Information',
      'Shipping & Delivery',
      'Returns & Refunds',
      'Account Issues',
      'General Inquiry',
      'Feedback & Suggestions',
    ];
  }

  async bulkUpdate(ticketIds: string[], updateData: UpdateTicketDto): Promise<{ updated: number; failed: number }> {
    let updated = 0;
    let failed = 0;

    for (const ticketId of ticketIds) {
      const ticket = await this.supportTicketRepository.findOne({ where: { id: ticketId } });
      if (ticket) {
        await this.supportTicketRepository.update(ticketId, {
          ...updateData,
          updatedAt: new Date(),
        });
        updated++;
      } else {
        failed++;
      }
    }

    return { updated, failed };
  }

  private async generateTicketNumber(): Promise<string> {
    const prefix = 'TKT';
    const date = new Date();
    const dateStr = date.getFullYear().toString() + (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}${dateStr}${random}`;
  }
}
