import { ProfileService } from '../../src/app/profiles/profile.service';
import { ProfileRepository } from '../../src/app/profiles/profile.repository';
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

describe('ProfileService', () => {
  let service: ProfileService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ProfileService(mockRepository as unknown as ProfileRepository);
  });

  describe('getById', () => {
    it('should return profile when found', async () => {
      const profile = {
        id: 'profile-1',
        userId: 'user-1',
        bio: 'Interior design enthusiast',
        avatarUrl: 'https://cdn.lomashwood.com/avatars/user-1.jpg',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockRepository.findById.mockResolvedValue(profile);

      const result = await service.getById('profile-1');

      expect(result).toEqual(profile);
      expect(mockRepository.findById).toHaveBeenCalledWith('profile-1');
    });

    it('should throw AppError with 404 when profile not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.getById('nonexistent')).rejects.toThrow(AppError);
      await expect(service.getById('nonexistent')).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('getByUserId', () => {
    it('should return profile for a given userId', async () => {
      const profile = {
        id: 'profile-1',
        userId: 'user-1',
        bio: 'Loves minimalist design',
        avatarUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockRepository.findByUserId.mockResolvedValue(profile);

      const result = await service.getByUserId('user-1');

      expect(result).toEqual(profile);
      expect(mockRepository.findByUserId).toHaveBeenCalledWith('user-1');
    });

    it('should return null if no profile exists for userId', async () => {
      mockRepository.findByUserId.mockResolvedValue(null);

      const result = await service.getByUserId('user-no-profile');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create profile successfully', async () => {
      const input = {
        userId: 'user-2',
        bio: 'New customer',
        avatarUrl: null,
      };
      const created = { id: 'profile-2', ...input, createdAt: new Date(), updatedAt: new Date() };
      mockRepository.findByUserId.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(created);

      const result = await service.create(input);

      expect(result).toEqual(created);
      expect(mockRepository.create).toHaveBeenCalledWith(input);
    });

    it('should throw AppError with 409 if profile already exists', async () => {
      mockRepository.findByUserId.mockResolvedValue({ id: 'existing-profile' });

      await expect(
        service.create({ userId: 'user-existing', bio: null, avatarUrl: null })
      ).rejects.toThrow(AppError);
      await expect(
        service.create({ userId: 'user-existing', bio: null, avatarUrl: null })
      ).rejects.toMatchObject({ statusCode: 409 });
    });
  });

  describe('update', () => {
    it('should update profile successfully', async () => {
      const existing = {
        id: 'profile-1',
        userId: 'user-1',
        bio: 'Old bio',
        avatarUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const updateData = { bio: 'Updated bio' };
      const updated = { ...existing, ...updateData };

      mockRepository.findById.mockResolvedValue(existing);
      mockRepository.update.mockResolvedValue(updated);

      const result = await service.update('profile-1', updateData);

      expect(result).toEqual(updated);
      expect(mockRepository.update).toHaveBeenCalledWith('profile-1', updateData);
    });

    it('should throw AppError with 404 when profile not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.update('nonexistent', { bio: 'test' })).rejects.toThrow(AppError);
      await expect(service.update('nonexistent', { bio: 'test' })).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('updateAvatar', () => {
    it('should update avatar URL successfully', async () => {
      const existing = { id: 'profile-1', userId: 'user-1', bio: 'Bio', avatarUrl: null };
      const updated = { ...existing, avatarUrl: 'https://cdn.lomashwood.com/avatars/new.jpg' };

      mockRepository.findById.mockResolvedValue(existing);
      mockRepository.update.mockResolvedValue(updated);

      const result = await service.update('profile-1', { avatarUrl: 'https://cdn.lomashwood.com/avatars/new.jpg' });

      expect(result.avatarUrl).toBe('https://cdn.lomashwood.com/avatars/new.jpg');
    });
  });

  describe('delete', () => {
    it('should delete profile successfully', async () => {
      mockRepository.findById.mockResolvedValue({ id: 'profile-1' });
      mockRepository.delete.mockResolvedValue({ id: 'profile-1' });

      await service.delete('profile-1');

      expect(mockRepository.delete).toHaveBeenCalledWith('profile-1');
    });

    it('should throw AppError with 404 when profile not found for deletion', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.delete('nonexistent')).rejects.toThrow(AppError);
      await expect(service.delete('nonexistent')).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('getAll', () => {
    it('should return paginated profiles', async () => {
      const profiles = [
        { id: 'profile-1', userId: 'user-1', bio: 'Bio 1' },
        { id: 'profile-2', userId: 'user-2', bio: 'Bio 2' },
      ];
      mockRepository.findAll.mockResolvedValue({ data: profiles, total: 2, page: 1, limit: 10 });

      const result = await service.getAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
    });

    it('should default to page 1 and limit 10', async () => {
      mockRepository.findAll.mockResolvedValue({ data: [], total: 0, page: 1, limit: 10 });

      await service.getAll({ page: 1, limit: 10 });

      expect(mockRepository.findAll).toHaveBeenCalledWith({ page: 1, limit: 10 });
    });
  });
});