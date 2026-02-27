import { CustomerService } from '../../src/app/profiles/profile.service';
import { CustomerRepository } from '../../src/app/profiles/profile.repository';
import { AppError } from '../../src/shared/errors';

jest.mock('../../src/app/profiles/profile.repository');

const mockRepository = {
  findById: jest.fn(),
  findByUserId: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findAll: jest.fn(),
};

describe('CustomerService', () => {
  let service: CustomerService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CustomerService(mockRepository as unknown as CustomerRepository);
  });

  describe('getById', () => {
    it('should return customer when found', async () => {
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
      mockRepository.findById.mockResolvedValue(customer);

      const result = await service.getById('cust-1');

      expect(result).toEqual(customer);
      expect(mockRepository.findById).toHaveBeenCalledWith('cust-1');
    });

    it('should throw AppError when customer not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.getById('nonexistent')).rejects.toThrow(AppError);
    });
  });

  describe('getByUserId', () => {
    it('should return customer profile for a user', async () => {
      const profile = {
        id: 'cust-1',
        userId: 'user-1',
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+441234567891',
        postcode: 'EC1A 1BB',
        address: '1 London Bridge',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockRepository.findByUserId.mockResolvedValue(profile);

      const result = await service.getByUserId('user-1');

      expect(result).toEqual(profile);
      expect(mockRepository.findByUserId).toHaveBeenCalledWith('user-1');
    });

    it('should return null when no profile exists for user', async () => {
      mockRepository.findByUserId.mockResolvedValue(null);

      const result = await service.getByUserId('user-no-profile');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new customer profile', async () => {
      const input = {
        userId: 'user-2',
        firstName: 'Alice',
        lastName: 'Johnson',
        phone: '+441234567892',
        postcode: 'W1A 1AA',
        address: '1 Oxford Street',
      };
      const created = { id: 'cust-2', ...input, createdAt: new Date(), updatedAt: new Date() };
      mockRepository.create.mockResolvedValue(created);

      const result = await service.create(input);

      expect(result).toEqual(created);
      expect(mockRepository.create).toHaveBeenCalledWith(input);
    });

    it('should throw AppError if profile already exists for userId', async () => {
      mockRepository.findByUserId.mockResolvedValue({ id: 'existing' });

      await expect(
        service.create({
          userId: 'user-existing',
          firstName: 'Test',
          lastName: 'User',
          phone: '+441111111111',
          postcode: 'XX1 1XX',
          address: 'Test Address',
        })
      ).rejects.toThrow(AppError);
    });
  });

  describe('update', () => {
    it('should update existing customer profile', async () => {
      const existing = {
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
      const updated = { ...existing, phone: '+449999999999' };
      mockRepository.findById.mockResolvedValue(existing);
      mockRepository.update.mockResolvedValue(updated);

      const result = await service.update('cust-1', { phone: '+449999999999' });

      expect(result).toEqual(updated);
      expect(mockRepository.update).toHaveBeenCalledWith('cust-1', { phone: '+449999999999' });
    });

    it('should throw AppError when customer not found for update', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.update('nonexistent', { phone: '+449999999999' })).rejects.toThrow(AppError);
    });
  });

  describe('delete', () => {
    it('should delete customer profile', async () => {
      mockRepository.findById.mockResolvedValue({ id: 'cust-1' });
      mockRepository.delete.mockResolvedValue({ id: 'cust-1' });

      await service.delete('cust-1');

      expect(mockRepository.delete).toHaveBeenCalledWith('cust-1');
    });

    it('should throw AppError when customer not found for deletion', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.delete('nonexistent')).rejects.toThrow(AppError);
    });
  });

  describe('getAll', () => {
    it('should return paginated list of customers', async () => {
      const customers = [
        { id: 'cust-1', userId: 'user-1', firstName: 'John', lastName: 'Doe' },
        { id: 'cust-2', userId: 'user-2', firstName: 'Jane', lastName: 'Smith' },
      ];
      mockRepository.findAll.mockResolvedValue({ data: customers, total: 2, page: 1, limit: 10 });

      const result = await service.getAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });
  });
});