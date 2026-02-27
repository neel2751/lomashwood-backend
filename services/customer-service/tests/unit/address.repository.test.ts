import { AddressRepository } from '../../src/app/profiles/profile.repository';
import { PrismaClient } from '@prisma/client';

jest.mock('@prisma/client', () => {
  const mockPrisma = {
    address: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  return { PrismaClient: jest.fn(() => mockPrisma) };
});

describe('AddressRepository', () => {
  let repository: AddressRepository;
  let prisma: PrismaClient;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = new PrismaClient();
    repository = new AddressRepository(prisma);
  });

  describe('findById', () => {
    it('should find address by id', async () => {
      const address = {
        id: 'addr-1',
        customerId: 'cust-1',
        line1: '10 Downing Street',
        line2: null,
        city: 'London',
        county: 'Greater London',
        postcode: 'SW1A 2AA',
        country: 'GB',
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (prisma.address.findUnique as jest.Mock).mockResolvedValue(address);

      const result = await repository.findById('addr-1');

      expect(result).toEqual(address);
      expect(prisma.address.findUnique).toHaveBeenCalledWith({
        where: { id: 'addr-1' },
      });
    });

    it('should return null when address not found', async () => {
      (prisma.address.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByCustomerId', () => {
    it('should find all addresses for customer ordered by default first', async () => {
      const addresses = [
        { id: 'addr-1', customerId: 'cust-1', isDefault: true, line1: '10 Downing Street' },
        { id: 'addr-2', customerId: 'cust-1', isDefault: false, line1: '221B Baker Street' },
      ];
      (prisma.address.findMany as jest.Mock).mockResolvedValue(addresses);

      const result = await repository.findByCustomerId('cust-1');

      expect(result).toHaveLength(2);
      expect(prisma.address.findMany).toHaveBeenCalledWith({
        where: { customerId: 'cust-1' },
        orderBy: { isDefault: 'desc' },
      });
    });

    it('should return empty array when no addresses found', async () => {
      (prisma.address.findMany as jest.Mock).mockResolvedValue([]);

      const result = await repository.findByCustomerId('cust-no-addr');

      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('should create an address record', async () => {
      const input = {
        customerId: 'cust-1',
        line1: '1 New Street',
        line2: null,
        city: 'Manchester',
        county: 'Greater Manchester',
        postcode: 'M1 1AA',
        country: 'GB',
        isDefault: false,
      };
      const created = { id: 'addr-3', ...input, createdAt: new Date(), updatedAt: new Date() };
      (prisma.address.create as jest.Mock).mockResolvedValue(created);

      const result = await repository.create(input);

      expect(result).toEqual(created);
      expect(prisma.address.create).toHaveBeenCalledWith({ data: input });
    });
  });

  describe('update', () => {
    it('should update an address record', async () => {
      const updateData = { line1: '11 Downing Street' };
      const updated = {
        id: 'addr-1',
        customerId: 'cust-1',
        line1: '11 Downing Street',
        city: 'London',
        postcode: 'SW1A 2AA',
        country: 'GB',
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (prisma.address.update as jest.Mock).mockResolvedValue(updated);

      const result = await repository.update('addr-1', updateData);

      expect(result).toEqual(updated);
      expect(prisma.address.update).toHaveBeenCalledWith({
        where: { id: 'addr-1' },
        data: updateData,
      });
    });
  });

  describe('delete', () => {
    it('should delete an address record', async () => {
      const deleted = { id: 'addr-1' };
      (prisma.address.delete as jest.Mock).mockResolvedValue(deleted);

      const result = await repository.delete('addr-1');

      expect(result).toEqual(deleted);
      expect(prisma.address.delete).toHaveBeenCalledWith({
        where: { id: 'addr-1' },
      });
    });
  });

  describe('setDefault', () => {
    it('should unset all defaults then set new default in transaction', async () => {
      const updatedAddress = {
        id: 'addr-2',
        customerId: 'cust-1',
        isDefault: true,
        line1: '221B Baker Street',
      };

      (prisma.$transaction as jest.Mock).mockImplementation(async (fn: Function) => {
        await fn(prisma);
        return updatedAddress;
      });
      (prisma.address.updateMany as jest.Mock).mockResolvedValue({ count: 2 });
      (prisma.address.update as jest.Mock).mockResolvedValue(updatedAddress);

      const result = await repository.setDefault('cust-1', 'addr-2');

      expect(result).toEqual(updatedAddress);
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('count', () => {
    it('should count addresses for a customer', async () => {
      (prisma.address.count as jest.Mock).mockResolvedValue(3);

      const result = await repository.count('cust-1');

      expect(result).toBe(3);
      expect(prisma.address.count).toHaveBeenCalledWith({
        where: { customerId: 'cust-1' },
      });
    });
  });
});