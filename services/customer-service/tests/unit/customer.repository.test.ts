import { CustomerRepository } from '../../src/app/profiles/profile.repository';
import { PrismaClient } from '@prisma/client';

jest.mock('@prisma/client', () => {
  const mockPrisma = {
    customerProfile: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mockPrisma) };
});

describe('CustomerRepository', () => {
  let repository: CustomerRepository;
  let prisma: PrismaClient;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = new PrismaClient();
    repository = new CustomerRepository(prisma);
  });

  describe('findById', () => {
    it('should find customer by id', async () => {
      const customer = {
        id: 'cust-1',
        userId: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+441234567890',
        postcode: 'SW1A 1AA',
        address: '10 Downing Street',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (prisma.customerProfile.findUnique as jest.Mock).mockResolvedValue(customer);

      const result = await repository.findById('cust-1');

      expect(result).toEqual(customer);
      expect(prisma.customerProfile.findUnique).toHaveBeenCalledWith({
        where: { id: 'cust-1' },
      });
    });

    it('should return null when not found', async () => {
      (prisma.customerProfile.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should find customer by userId', async () => {
      const customer = {
        id: 'cust-1',
        userId: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+441234567890',
        postcode: 'SW1A 1AA',
        address: '10 Downing Street',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (prisma.customerProfile.findUnique as jest.Mock).mockResolvedValue(customer);

      const result = await repository.findByUserId('user-1');

      expect(result).toEqual(customer);
      expect(prisma.customerProfile.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
    });

    it('should return null when no profile for userId', async () => {
      (prisma.customerProfile.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repository.findByUserId('user-no-profile');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a customer profile', async () => {
      const input = {
        userId: 'user-2',
        firstName: 'Alice',
        lastName: 'Johnson',
        phone: '+441234567892',
        postcode: 'W1A 1AA',
        address: '1 Oxford Street',
      };
      const created = { id: 'cust-2', ...input, createdAt: new Date(), updatedAt: new Date() };
      (prisma.customerProfile.create as jest.Mock).mockResolvedValue(created);

      const result = await repository.create(input);

      expect(result).toEqual(created);
      expect(prisma.customerProfile.create).toHaveBeenCalledWith({ data: input });
    });
  });

  describe('update', () => {
    it('should update a customer profile', async () => {
      const updateData = { phone: '+449999999999' };
      const updated = {
        id: 'cust-1',
        userId: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+449999999999',
        postcode: 'SW1A 1AA',
        address: '10 Downing Street',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (prisma.customerProfile.update as jest.Mock).mockResolvedValue(updated);

      const result = await repository.update('cust-1', updateData);

      expect(result).toEqual(updated);
      expect(prisma.customerProfile.update).toHaveBeenCalledWith({
        where: { id: 'cust-1' },
        data: updateData,
      });
    });
  });

  describe('delete', () => {
    it('should delete a customer profile', async () => {
      const deleted = { id: 'cust-1' };
      (prisma.customerProfile.delete as jest.Mock).mockResolvedValue(deleted);

      const result = await repository.delete('cust-1');

      expect(result).toEqual(deleted);
      expect(prisma.customerProfile.delete).toHaveBeenCalledWith({
        where: { id: 'cust-1' },
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated customers', async () => {
      const customers = [
        { id: 'cust-1', userId: 'user-1', firstName: 'John', lastName: 'Doe' },
        { id: 'cust-2', userId: 'user-2', firstName: 'Jane', lastName: 'Smith' },
      ];
      (prisma.customerProfile.findMany as jest.Mock).mockResolvedValue(customers);
      (prisma.customerProfile.count as jest.Mock).mockResolvedValue(2);

      const result = await repository.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(prisma.customerProfile.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should apply correct offset for page 2', async () => {
      (prisma.customerProfile.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.customerProfile.count as jest.Mock).mockResolvedValue(0);

      await repository.findAll({ page: 2, limit: 10 });

      expect(prisma.customerProfile.findMany).toHaveBeenCalledWith({
        skip: 10,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });
  });
});