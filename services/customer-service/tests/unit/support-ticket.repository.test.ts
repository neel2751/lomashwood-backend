import { SupportTicketRepository } from '../../src/app/support/support.repository';
import { PrismaClient } from '@prisma/client';

jest.mock('@prisma/client', () => {
  const mockPrisma = {
    supportTicket: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    ticketMessage: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mockPrisma) };
});

describe('SupportTicketRepository', () => {
  let repository: SupportTicketRepository;
  let prisma: PrismaClient;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = new PrismaClient();
    repository = new SupportTicketRepository(prisma);
  });

  describe('findById', () => {
    it('should find ticket by id with messages', async () => {
      const ticket = {
        id: 'tkt-1',
        customerId: 'cust-1',
        subject: 'Damaged cabinet',
        status: 'OPEN',
        priority: 'HIGH',
        messages: [],
        customer: { id: 'cust-1', firstName: 'Jane' },
        createdAt: new Date(),
      };
      (prisma.supportTicket.findUnique as jest.Mock).mockResolvedValue(ticket);

      const result = await repository.findById('tkt-1');

      expect(result).toEqual(ticket);
      expect(prisma.supportTicket.findUnique).toHaveBeenCalledWith({
        where: { id: 'tkt-1' },
        include: { messages: { orderBy: { createdAt: 'asc' } }, customer: true },
      });
    });

    it('should return null when ticket not found', async () => {
      (prisma.supportTicket.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByCustomerId', () => {
    it('should return paginated tickets for a customer', async () => {
      const tickets = [
        { id: 'tkt-1', customerId: 'cust-1', subject: 'Issue 1', status: 'OPEN' },
        { id: 'tkt-2', customerId: 'cust-1', subject: 'Issue 2', status: 'CLOSED' },
      ];
      (prisma.supportTicket.findMany as jest.Mock).mockResolvedValue(tickets);
      (prisma.supportTicket.count as jest.Mock).mockResolvedValue(2);

      const result = await repository.findByCustomerId('cust-1', { page: 1, limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(prisma.supportTicket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { customerId: 'cust-1' },
          skip: 0,
          take: 10,
          orderBy: { createdAt: 'desc' },
        })
      );
    });

    it('should calculate correct skip for page 2', async () => {
      (prisma.supportTicket.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.supportTicket.count as jest.Mock).mockResolvedValue(15);

      await repository.findByCustomerId('cust-1', { page: 2, limit: 10 });

      expect(prisma.supportTicket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 })
      );
    });
  });

  describe('create', () => {
    it('should create a new support ticket', async () => {
      const input = { customerId: 'cust-1', subject: 'Broken hinge', description: 'Cabinet door hinge broke', category: 'WARRANTY', status: 'OPEN', priority: 'MEDIUM' };
      const created = { id: 'tkt-new', ...input, createdAt: new Date() };
      (prisma.supportTicket.create as jest.Mock).mockResolvedValue(created);

      const result = await repository.create(input);

      expect(result).toEqual(created);
      expect(prisma.supportTicket.create).toHaveBeenCalledWith({ data: input });
    });
  });

  describe('update', () => {
    it('should update ticket fields', async () => {
      const updated = { id: 'tkt-1', priority: 'HIGH', status: 'IN_PROGRESS' };
      (prisma.supportTicket.update as jest.Mock).mockResolvedValue(updated);

      const result = await repository.update('tkt-1', { priority: 'HIGH', status: 'IN_PROGRESS' });

      expect(result).toEqual(updated);
      expect(prisma.supportTicket.update).toHaveBeenCalledWith({
        where: { id: 'tkt-1' },
        data: { priority: 'HIGH', status: 'IN_PROGRESS' },
      });
    });
  });

  describe('close', () => {
    it('should set status to CLOSED and record closedAt', async () => {
      const closed = { id: 'tkt-1', status: 'CLOSED', closedAt: expect.any(Date) };
      (prisma.supportTicket.update as jest.Mock).mockResolvedValue(closed);

      const result = await repository.close('tkt-1');

      expect(result.status).toBe('CLOSED');
      expect(prisma.supportTicket.update).toHaveBeenCalledWith({
        where: { id: 'tkt-1' },
        data: { status: 'CLOSED', closedAt: expect.any(Date) },
      });
    });
  });

  describe('addMessage', () => {
    it('should create a ticket message', async () => {
      const message = { id: 'msg-1', ticketId: 'tkt-1', senderId: 'cust-1', body: 'Still waiting', createdAt: new Date() };
      (prisma.ticketMessage.create as jest.Mock).mockResolvedValue(message);

      const result = await repository.addMessage('tkt-1', 'cust-1', 'Still waiting');

      expect(result).toEqual(message);
      expect(prisma.ticketMessage.create).toHaveBeenCalledWith({
        data: { ticketId: 'tkt-1', senderId: 'cust-1', body: 'Still waiting' },
      });
    });
  });

  describe('getMessages', () => {
    it('should return messages for a ticket ordered by createdAt asc', async () => {
      const messages = [
        { id: 'msg-1', ticketId: 'tkt-1', senderId: 'cust-1', body: 'First message', createdAt: new Date('2025-01-01') },
        { id: 'msg-2', ticketId: 'tkt-1', senderId: 'agent-1', body: 'Reply', createdAt: new Date('2025-01-02') },
      ];
      (prisma.ticketMessage.findMany as jest.Mock).mockResolvedValue(messages);

      const result = await repository.getMessages('tkt-1');

      expect(result).toHaveLength(2);
      expect(prisma.ticketMessage.findMany).toHaveBeenCalledWith({
        where: { ticketId: 'tkt-1' },
        orderBy: { createdAt: 'asc' },
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated tickets for admin with no filter', async () => {
      const tickets = [
        { id: 'tkt-1', status: 'OPEN' },
        { id: 'tkt-2', status: 'CLOSED' },
      ];
      (prisma.supportTicket.findMany as jest.Mock).mockResolvedValue(tickets);
      (prisma.supportTicket.count as jest.Mock).mockResolvedValue(2);

      const result = await repository.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });
  });
});