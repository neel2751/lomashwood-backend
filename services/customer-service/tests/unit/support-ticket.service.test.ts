import { SupportTicketService } from '../../src/app/support/support.service';
import { SupportTicketRepository } from '../../src/app/support/support.repository';
import { AppError } from '../../src/shared/errors';

jest.mock('../../src/app/support/support.repository');

const mockRepository = {
  findById: jest.fn(),
  findByCustomerId: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  addMessage: jest.fn(),
  getMessages: jest.fn(),
  findAll: jest.fn(),
  close: jest.fn(),
};

describe('SupportTicketService', () => {
  let service: SupportTicketService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SupportTicketService(mockRepository as unknown as SupportTicketRepository);
  });

  describe('getById', () => {
    it('should return ticket when found', async () => {
      const ticket = { id: 'tkt-1', customerId: 'cust-1', subject: 'Delivery issue', status: 'OPEN', priority: 'MEDIUM', createdAt: new Date() };
      mockRepository.findById.mockResolvedValue(ticket);

      const result = await service.getById('tkt-1');

      expect(result).toEqual(ticket);
      expect(mockRepository.findById).toHaveBeenCalledWith('tkt-1');
    });

    it('should throw AppError 404 when ticket not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.getById('nonexistent')).rejects.toThrow(AppError);
      await expect(service.getById('nonexistent')).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('getByCustomerId', () => {
    it('should return all tickets for a customer', async () => {
      const tickets = [
        { id: 'tkt-1', customerId: 'cust-1', subject: 'Issue 1', status: 'OPEN' },
        { id: 'tkt-2', customerId: 'cust-1', subject: 'Issue 2', status: 'CLOSED' },
      ];
      mockRepository.findByCustomerId.mockResolvedValue({ data: tickets, total: 2, page: 1, limit: 10 });

      const result = await service.getByCustomerId('cust-1', { page: 1, limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });
  });

  describe('create', () => {
    it('should create a support ticket', async () => {
      const input = { customerId: 'cust-1', subject: 'Kitchen door broken', description: 'The hinge snapped', category: 'WARRANTY' };
      const created = { id: 'tkt-new', ...input, status: 'OPEN', priority: 'MEDIUM', createdAt: new Date() };
      mockRepository.create.mockResolvedValue(created);

      const result = await service.create(input);

      expect(result).toEqual(created);
      expect(result.status).toBe('OPEN');
      expect(mockRepository.create).toHaveBeenCalledWith({ ...input, status: 'OPEN', priority: 'MEDIUM' });
    });
  });

  describe('addMessage', () => {
    it('should add message to open ticket', async () => {
      const ticket = { id: 'tkt-1', customerId: 'cust-1', status: 'OPEN' };
      const message = { id: 'msg-1', ticketId: 'tkt-1', senderId: 'cust-1', body: 'Still waiting for response', createdAt: new Date() };

      mockRepository.findById.mockResolvedValue(ticket);
      mockRepository.addMessage.mockResolvedValue(message);

      const result = await service.addMessage('tkt-1', 'cust-1', 'Still waiting for response');

      expect(result).toEqual(message);
      expect(mockRepository.addMessage).toHaveBeenCalledWith('tkt-1', 'cust-1', 'Still waiting for response');
    });

    it('should throw AppError when adding to closed ticket', async () => {
      mockRepository.findById.mockResolvedValue({ id: 'tkt-1', status: 'CLOSED' });

      await expect(service.addMessage('tkt-1', 'cust-1', 'Hello')).rejects.toThrow(AppError);
      await expect(service.addMessage('tkt-1', 'cust-1', 'Hello')).rejects.toMatchObject({ statusCode: 400 });
    });

    it('should throw AppError 403 when non-owner tries to message', async () => {
      mockRepository.findById.mockResolvedValue({ id: 'tkt-1', customerId: 'cust-other', status: 'OPEN' });

      await expect(service.addMessage('tkt-1', 'cust-intruder', 'Test')).rejects.toThrow(AppError);
      await expect(service.addMessage('tkt-1', 'cust-intruder', 'Test')).rejects.toMatchObject({ statusCode: 403 });
    });
  });

  describe('close', () => {
    it('should close an open ticket', async () => {
      const ticket = { id: 'tkt-1', customerId: 'cust-1', status: 'OPEN' };
      const closed = { ...ticket, status: 'CLOSED', closedAt: new Date() };

      mockRepository.findById.mockResolvedValue(ticket);
      mockRepository.close.mockResolvedValue(closed);

      const result = await service.close('tkt-1', 'cust-1', false);

      expect(result.status).toBe('CLOSED');
      expect(mockRepository.close).toHaveBeenCalledWith('tkt-1');
    });

    it('should allow admin to close any ticket', async () => {
      const ticket = { id: 'tkt-1', customerId: 'cust-other', status: 'OPEN' };
      const closed = { ...ticket, status: 'CLOSED' };

      mockRepository.findById.mockResolvedValue(ticket);
      mockRepository.close.mockResolvedValue(closed);

      const result = await service.close('tkt-1', 'admin-1', true);

      expect(result.status).toBe('CLOSED');
    });

    it('should throw AppError 403 when non-owner non-admin tries to close', async () => {
      mockRepository.findById.mockResolvedValue({ id: 'tkt-1', customerId: 'cust-other', status: 'OPEN' });

      await expect(service.close('tkt-1', 'cust-1', false)).rejects.toThrow(AppError);
    });

    it('should throw AppError when ticket is already closed', async () => {
      mockRepository.findById.mockResolvedValue({ id: 'tkt-1', customerId: 'cust-1', status: 'CLOSED' });

      await expect(service.close('tkt-1', 'cust-1', false)).rejects.toThrow(AppError);
    });
  });

  describe('updatePriority', () => {
    it('should update ticket priority (admin only)', async () => {
      const ticket = { id: 'tkt-1', status: 'OPEN', priority: 'LOW' };
      const updated = { ...ticket, priority: 'HIGH' };

      mockRepository.findById.mockResolvedValue(ticket);
      mockRepository.update.mockResolvedValue(updated);

      const result = await service.updatePriority('tkt-1', 'HIGH');

      expect(result.priority).toBe('HIGH');
      expect(mockRepository.update).toHaveBeenCalledWith('tkt-1', { priority: 'HIGH' });
    });
  });

  describe('getAll', () => {
    it('should return paginated tickets for admin', async () => {
      mockRepository.findAll.mockResolvedValue({ data: [], total: 0, page: 1, limit: 10 });

      const result = await service.getAll({ page: 1, limit: 10 });

      expect(result.data).toEqual([]);
      expect(mockRepository.findAll).toHaveBeenCalledWith({ page: 1, limit: 10 });
    });
  });
});