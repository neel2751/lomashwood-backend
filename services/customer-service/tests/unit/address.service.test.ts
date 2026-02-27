import { AddressService } from '../../src/app/profiles/profile.service';
import { AddressRepository } from '../../src/app/profiles/profile.repository';
import { AppError } from '../../src/shared/errors';

jest.mock('../../src/app/profiles/profile.repository');

const mockRepository = {
  findById: jest.fn(),
  findByCustomerId: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  setDefault: jest.fn(),
};

describe('AddressService', () => {
  let service: AddressService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AddressService(mockRepository as unknown as AddressRepository);
  });

  describe('getById', () => {
    it('should return address when found', async () => {
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
      mockRepository.findById.mockResolvedValue(address);

      const result = await service.getById('addr-1');

      expect(result).toEqual(address);
      expect(mockRepository.findById).toHaveBeenCalledWith('addr-1');
    });

    it('should throw AppError 404 when address not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.getById('nonexistent')).rejects.toThrow(AppError);
      await expect(service.getById('nonexistent')).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('getByCustomerId', () => {
    it('should return all addresses for a customer', async () => {
      const addresses = [
        {
          id: 'addr-1',
          customerId: 'cust-1',
          line1: '10 Downing Street',
          city: 'London',
          postcode: 'SW1A 2AA',
          country: 'GB',
          isDefault: true,
        },
        {
          id: 'addr-2',
          customerId: 'cust-1',
          line1: '221B Baker Street',
          city: 'London',
          postcode: 'NW1 6XE',
          country: 'GB',
          isDefault: false,
        },
      ];
      mockRepository.findByCustomerId.mockResolvedValue(addresses);

      const result = await service.getByCustomerId('cust-1');

      expect(result).toHaveLength(2);
      expect(result[0].isDefault).toBe(true);
      expect(mockRepository.findByCustomerId).toHaveBeenCalledWith('cust-1');
    });

    it('should return empty array when customer has no addresses', async () => {
      mockRepository.findByCustomerId.mockResolvedValue([]);

      const result = await service.getByCustomerId('cust-no-address');

      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('should create address successfully', async () => {
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
      mockRepository.create.mockResolvedValue(created);

      const result = await service.create(input);

      expect(result).toEqual(created);
      expect(mockRepository.create).toHaveBeenCalledWith(input);
    });

    it('should auto-set first address as default', async () => {
      mockRepository.findByCustomerId.mockResolvedValue([]);
      const input = {
        customerId: 'cust-new',
        line1: '1 First Street',
        city: 'Birmingham',
        postcode: 'B1 1AA',
        country: 'GB',
        isDefault: false,
      };
      const created = { id: 'addr-new', ...input, isDefault: true, createdAt: new Date(), updatedAt: new Date() };
      mockRepository.create.mockResolvedValue(created);

      const result = await service.create(input);

      expect(result.isDefault).toBe(true);
    });
  });

  describe('update', () => {
    it('should update address successfully', async () => {
      const existing = {
        id: 'addr-1',
        customerId: 'cust-1',
        line1: '10 Downing Street',
        city: 'London',
        postcode: 'SW1A 2AA',
        country: 'GB',
        isDefault: true,
      };
      const updateData = { line1: '11 Downing Street' };
      const updated = { ...existing, ...updateData };

      mockRepository.findById.mockResolvedValue(existing);
      mockRepository.update.mockResolvedValue(updated);

      const result = await service.update('addr-1', updateData);

      expect(result.line1).toBe('11 Downing Street');
      expect(mockRepository.update).toHaveBeenCalledWith('addr-1', updateData);
    });

    it('should throw AppError 404 when address not found for update', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.update('nonexistent', { line1: 'Test' })).rejects.toThrow(AppError);
    });
  });

  describe('delete', () => {
    it('should delete address successfully', async () => {
      mockRepository.findById.mockResolvedValue({ id: 'addr-1', isDefault: false });
      mockRepository.delete.mockResolvedValue({ id: 'addr-1' });

      await service.delete('addr-1');

      expect(mockRepository.delete).toHaveBeenCalledWith('addr-1');
    });

    it('should throw AppError when trying to delete default address directly', async () => {
      mockRepository.findById.mockResolvedValue({ id: 'addr-1', isDefault: true, customerId: 'cust-1' });
      mockRepository.findByCustomerId.mockResolvedValue([
        { id: 'addr-1', isDefault: true },
        { id: 'addr-2', isDefault: false },
      ]);

      await expect(service.delete('addr-1')).rejects.toThrow(AppError);
    });

    it('should throw AppError 404 when address not found for deletion', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.delete('nonexistent')).rejects.toThrow(AppError);
    });
  });

  describe('setDefault', () => {
    it('should set address as default', async () => {
      const address = {
        id: 'addr-2',
        customerId: 'cust-1',
        line1: '221B Baker Street',
        isDefault: false,
      };
      mockRepository.findById.mockResolvedValue(address);
      mockRepository.setDefault.mockResolvedValue({ ...address, isDefault: true });

      const result = await service.setDefault('cust-1', 'addr-2');

      expect(result.isDefault).toBe(true);
      expect(mockRepository.setDefault).toHaveBeenCalledWith('cust-1', 'addr-2');
    });

    it('should throw AppError when address does not belong to customer', async () => {
      mockRepository.findById.mockResolvedValue({ id: 'addr-2', customerId: 'cust-other' });

      await expect(service.setDefault('cust-1', 'addr-2')).rejects.toThrow(AppError);
    });
  });
});