import { Request, Response, NextFunction } from 'express';
import { ProfileController } from '../../src/app/profiles/profile.controller';
import { CustomerService } from '../../src/app/profiles/profile.service';
import { AppError } from '../../src/shared/errors';

jest.mock('../../src/app/profiles/profile.service');

const mockService = {
  getById: jest.fn(),
  getByUserId: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  getAll: jest.fn(),
};

const mockRequest = (overrides: Partial<Request> = {}): Partial<Request> => ({
  params: {},
  body: {},
  query: {},
  user: { id: 'user-1', role: 'CUSTOMER' } as any,
  ...overrides,
});

const mockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext: NextFunction = jest.fn();

describe('ProfileController', () => {
  let controller: ProfileController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new ProfileController(mockService as unknown as CustomerService);
  });

  describe('getProfile', () => {
    it('should return 200 with customer profile', async () => {
      const profile = {
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
      mockService.getByUserId.mockResolvedValue(profile);

      const req = mockRequest({ user: { id: 'user-1' } as any });
      const res = mockResponse();

      await controller.getProfile(req as Request, res as Response, mockNext);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: profile });
    });

    it('should call next with error when service throws', async () => {
      mockService.getByUserId.mockRejectedValue(new AppError('Not found', 404));

      const req = mockRequest({ user: { id: 'user-1' } as any });
      const res = mockResponse();

      await controller.getProfile(req as Request, res as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('createProfile', () => {
    it('should return 201 with created profile', async () => {
      const body = {
        firstName: 'Alice',
        lastName: 'Johnson',
        phone: '+441234567892',
        postcode: 'W1A 1AA',
        address: '1 Oxford Street',
      };
      const created = { id: 'cust-2', userId: 'user-2', ...body, createdAt: new Date(), updatedAt: new Date() };
      mockService.create.mockResolvedValue(created);

      const req = mockRequest({ body, user: { id: 'user-2' } as any });
      const res = mockResponse();

      await controller.createProfile(req as Request, res as Response, mockNext);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: created });
    });

    it('should call next with error on duplicate profile', async () => {
      mockService.create.mockRejectedValue(new AppError('Profile already exists', 409));

      const req = mockRequest({ body: {}, user: { id: 'user-existing' } as any });
      const res = mockResponse();

      await controller.createProfile(req as Request, res as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('updateProfile', () => {
    it('should return 200 with updated profile', async () => {
      const body = { phone: '+449999999999' };
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
      mockService.getByUserId.mockResolvedValue({ id: 'cust-1' });
      mockService.update.mockResolvedValue(updated);

      const req = mockRequest({ body, user: { id: 'user-1' } as any });
      const res = mockResponse();

      await controller.updateProfile(req as Request, res as Response, mockNext);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: updated });
    });

    it('should call next with error when profile not found', async () => {
      mockService.getByUserId.mockResolvedValue(null);

      const req = mockRequest({ body: { phone: '+449999999999' }, user: { id: 'ghost' } as any });
      const res = mockResponse();

      await controller.updateProfile(req as Request, res as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('deleteProfile', () => {
    it('should return 204 on successful deletion', async () => {
      mockService.getByUserId.mockResolvedValue({ id: 'cust-1' });
      mockService.delete.mockResolvedValue(undefined);

      const req = mockRequest({ user: { id: 'user-1' } as any });
      const res = mockResponse();

      await controller.deleteProfile(req as Request, res as Response, mockNext);

      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.json).toHaveBeenCalled();
    });

    it('should call next with error when profile not found', async () => {
      mockService.getByUserId.mockResolvedValue(null);

      const req = mockRequest({ user: { id: 'ghost' } as any });
      const res = mockResponse();

      await controller.deleteProfile(req as Request, res as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('listCustomers (admin)', () => {
    it('should return 200 with paginated customer list', async () => {
      const paginatedResult = {
        data: [
          { id: 'cust-1', userId: 'user-1', firstName: 'John', lastName: 'Doe' },
          { id: 'cust-2', userId: 'user-2', firstName: 'Jane', lastName: 'Smith' },
        ],
        total: 2,
        page: 1,
        limit: 10,
      };
      mockService.getAll.mockResolvedValue(paginatedResult);

      const req = mockRequest({ query: { page: '1', limit: '10' }, user: { id: 'admin-1', role: 'ADMIN' } as any });
      const res = mockResponse();

      await controller.listCustomers(req as Request, res as Response, mockNext);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: paginatedResult });
    });

    it('should use default pagination when not specified', async () => {
      mockService.getAll.mockResolvedValue({ data: [], total: 0, page: 1, limit: 10 });

      const req = mockRequest({ query: {}, user: { id: 'admin-1', role: 'ADMIN' } as any });
      const res = mockResponse();

      await controller.listCustomers(req as Request, res as Response, mockNext);

      expect(mockService.getAll).toHaveBeenCalledWith({ page: 1, limit: 10 });
    });
  });
});