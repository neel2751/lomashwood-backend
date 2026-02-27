import { ProfileRepository } from '../../src/app/profiles/profile.repository';
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

describe('ProfileRepository', () => {
  let repository: ProfileRepository;
  let prisma: PrismaClient;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = new PrismaClient();
    repository = new ProfileRepository(prisma);
  });

  describe('findById', () => {
    it('should find profile by id including user relation', async () => {
      const profile = {
        id: 'profile-1',
        userId: 'user-1',
        bio: 'Interior design enthusiast',
        avatarUrl: null,
        user: { id: 'user-1', email: 'john@example.com' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (prisma.customerProfile.findUnique as jest.Mock).mockResolvedValue(profile);

      const result = await repository.findById('profile-1');

      expect(result).toEqual(profile);
      expect(prisma.customerProfile.findUnique).toHaveBeenCalledWith({
        where: { id: 'profile-1' },
        include: { user: true },
      });
    });

    it('should return null when profile not found', async () => {
      (prisma.customerProfile.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should find profile by userId', async () => {
      const profile = {
        id: 'profile-1',
        userId: 'user-1',
        bio: 'Loves minimalist design',
        avatarUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (prisma.customerProfile.findUnique as jest.Mock).mockResolvedValue(profile);

      const result = await repository.findByUserId('user-1');

      expect(result).toEqual(profile);
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
    it('should create a profile record', async () => {
      const input = { userId: 'user-2', bio: 'New bio', avatarUrl: null };
      const created = { id: 'profile-2', ...input, createdAt: new Date(), updatedAt: new Date() };
      (prisma.customerProfile.create as jest.Mock).mockResolvedValue(created);

      const result = await repository.create(input);

      expect(result).toEqual(created);
      expect(prisma.customerProfile.create).toHaveBeenCalledWith({ data: input });
    });
  });

  describe('update', () => {
    it('should update a profile record', async () => {
      const updateData = { bio: 'Updated bio' };
      const updated = {
        id: 'profile-1',
        userId: 'user-1',
        bio: 'Updated bio',
        avatarUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (prisma.customerProfile.update as jest.Mock).mockResolvedValue(updated);

      const result = await repository.update('profile-1', updateData);

      expect(result).toEqual(updated);
      expect(prisma.customerProfile.update).toHaveBeenCalledWith({
        where: { id: 'profile-1' },
        data: updateData,
      });
    });
  });

  describe('delete', () => {
    it('should delete a profile record', async () => {
      const deleted = { id: 'profile-1' };
      (prisma.customerProfile.delete as jest.Mock).mockResolvedValue(deleted);

      const result = await repository.delete('profile-1');

      expect(result).toEqual(deleted);
      expect(prisma.customerProfile.delete).toHaveBeenCalledWith({
        where: { id: 'profile-1' },
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated results with total count', async () => {
      const profiles = [
        { id: 'profile-1', userId: 'user-1', bio: 'Bio 1' },
        { id: 'profile-2', userId: 'user-2', bio: 'Bio 2' },
      ];
      (prisma.customerProfile.findMany as jest.Mock).mockResolvedValue(profiles);
      (prisma.customerProfile.count as jest.Mock).mockResolvedValue(2);

      const result = await repository.findAll({ page: 1, limit: 10 });

      expect(result).toEqual({ data: profiles, total: 2, page: 1, limit: 10 });
      expect(prisma.customerProfile.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: true },
      });
    });

    it('should calculate correct skip for page 3', async () => {
      (prisma.customerProfile.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.customerProfile.count as jest.Mock).mockResolvedValue(0);

      await repository.findAll({ page: 3, limit: 5 });

      expect(prisma.customerProfile.findMany).toHaveBeenCalledWith({
        skip: 10,
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: true },
      });
    });

    it('should return empty data array when no profiles exist', async () => {
      (prisma.customerProfile.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.customerProfile.count as jest.Mock).mockResolvedValue(0);

      const result = await repository.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });
});