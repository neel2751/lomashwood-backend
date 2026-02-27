import { RoleService } from '../../src/app/roles/role.service';
import { RoleRepository } from '../../src/app/roles/role.repository';
import * as Errors from '../../src/shared/errors';
import { CreateRoleDTO, UpdateRoleDTO } from '../../src/app/roles/role.types';

const AppError: any =
  (Errors as any).AppError ??
  (Errors as any).default ??
  class AppError extends Error {};

jest.mock('../../src/app/roles/role.repository');

const mockPrisma: any = {};

const mockEventProducer: any = { produce: jest.fn(), emit: jest.fn() };

function makePaginated(roles: any[], page = 1, limit = 10) {
  const totalPages = roles.length === 0 ? 0 : Math.ceil(roles.length / limit);
  return {
    data: roles,
    roles,
    items: roles,
    total: roles.length,
    page,
    limit,
    totalPages,
  } as any;
}

describe('RoleService', () => {
  let roleService: RoleService;
  let roleRepository: jest.Mocked<RoleRepository>;

  beforeEach(() => {
    roleRepository = new RoleRepository(mockPrisma) as jest.Mocked<RoleRepository>;

    roleService = new RoleService(roleRepository, mockEventProducer);

    jest.clearAllMocks();
  });

  describe('createRole', () => {
    const createRoleDto: CreateRoleDTO = {
      name: 'ADMIN',
      description: 'Administrator role',
      permissions: ['read:all', 'write:all'],
    };

    it('should create a role successfully', async () => {
      const expectedRole = {
        id: '1',
        name: 'ADMIN',
        description: 'Administrator role',
        permissions: ['read:all', 'write:all'],
        isActive: true,
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      roleRepository.findByName.mockResolvedValue(null);
      roleRepository.create.mockResolvedValue(expectedRole);

      const result = await roleService.createRole(createRoleDto);

      expect(roleRepository.findByName).toHaveBeenCalledWith('ADMIN');
      expect(roleRepository.create).toHaveBeenCalledWith(createRoleDto);
      expect(result).toEqual(expectedRole);
    });

    it('should throw error if role already exists', async () => {
      const existingRole = {
        id: '1',
        name: 'ADMIN',
        description: 'Administrator role',
        permissions: ['read:all'],
        isActive: true,
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      roleRepository.findByName.mockResolvedValue(existingRole);

      await expect(roleService.createRole(createRoleDto)).rejects.toThrow(
        AppError
      );
      await expect(roleService.createRole(createRoleDto)).rejects.toThrow(
        'Role with name ADMIN already exists'
      );

      expect(roleRepository.findByName).toHaveBeenCalledWith('ADMIN');
      expect(roleRepository.create).not.toHaveBeenCalled();
    });

    it('should handle repository errors', async () => {
      const dbError = new Error('Database connection failed');
      roleRepository.findByName.mockRejectedValue(dbError);

      await expect(roleService.createRole(createRoleDto)).rejects.toThrow(
        'Database connection failed'
      );
    });
  });

  describe('getRoleById', () => {
    it('should return role when found', async () => {
      const expectedRole = {
        id: '1',
        name: 'ADMIN',
        description: 'Administrator role',
        permissions: ['read:all', 'write:all'],
        isActive: true,
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      roleRepository.findById.mockResolvedValue(expectedRole);

      const result = await roleService.getRoleById('1');

      expect(roleRepository.findById).toHaveBeenCalledWith('1');
      expect(result).toEqual(expectedRole);
    });

    it('should throw error when role not found', async () => {
      roleRepository.findById.mockResolvedValue(null);

      await expect(roleService.getRoleById('999')).rejects.toThrow(AppError);
      await expect(roleService.getRoleById('999')).rejects.toThrow(
        'Role not found'
      );

      expect(roleRepository.findById).toHaveBeenCalledWith('999');
    });
  });

  describe('getRoleByName', () => {
    it('should return role when found', async () => {
      const expectedRole = {
        id: '1',
        name: 'ADMIN',
        description: 'Administrator role',
        permissions: ['read:all', 'write:all'],
        isActive: true,
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      roleRepository.findByName.mockResolvedValue(expectedRole);

      const result = await roleService.getRoleByName('ADMIN');

      expect(roleRepository.findByName).toHaveBeenCalledWith('ADMIN');
      expect(result).toEqual(expectedRole);
    });

    it('should throw error when role not found', async () => {
      roleRepository.findByName.mockResolvedValue(null);

      await expect(roleService.getRoleByName('UNKNOWN')).rejects.toThrow(
        AppError
      );
      await expect(roleService.getRoleByName('UNKNOWN')).rejects.toThrow(
        'Role not found'
      );

      expect(roleRepository.findByName).toHaveBeenCalledWith('UNKNOWN');
    });
  });

  describe('getAllRoles', () => {
    it('should return all roles with pagination', async () => {
      const roles = [
        {
          id: '1',
          name: 'ADMIN',
          description: 'Administrator',
          permissions: ['read:all'],
          isActive: true,
          isSystem: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          name: 'USER',
          description: 'Regular user',
          permissions: ['read:own'],
          isActive: true,
          isSystem: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const paginatedResult = makePaginated(roles);
      roleRepository.findAll.mockResolvedValue(paginatedResult);

      const result = await roleService.getAllRoles({ page: 1, limit: 10 });

      expect(roleRepository.findAll).toHaveBeenCalledWith({ page: 1, limit: 10 });
      expect(result).toEqual(paginatedResult);
    });

    it('should handle empty result set', async () => {
      const emptyResult = makePaginated([]);
      roleRepository.findAll.mockResolvedValue(emptyResult);

      const result = await roleService.getAllRoles({ page: 1, limit: 10 });

      expect(result).toEqual(emptyResult);

      const collection: any[] =
        (result as any).data ??
        (result as any).roles ??
        (result as any).items ??
        [];
      expect(collection).toHaveLength(0);
    });
  });

  describe('updateRole', () => {
    const updateRoleDto: UpdateRoleDTO = {
      description: 'Updated description',
      permissions: ['read:all', 'write:all', 'delete:all'],
    };

    it('should update role successfully', async () => {
      const existingRole = {
        id: '1',
        name: 'ADMIN',
        description: 'Old description',
        permissions: ['read:all'],
        isActive: true,
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedRole = {
        ...existingRole,
        description: 'Updated description',
        permissions: ['read:all', 'write:all', 'delete:all'],
        updatedAt: new Date(),
      };

      roleRepository.findById.mockResolvedValue(existingRole);
      roleRepository.update.mockResolvedValue(updatedRole);

      const result = await roleService.updateRole('1', updateRoleDto);

      expect(roleRepository.findById).toHaveBeenCalledWith('1');
      expect(roleRepository.update).toHaveBeenCalledWith('1', updateRoleDto);
      expect(result).toEqual(updatedRole);
    });

    it('should throw error when role not found', async () => {
      roleRepository.findById.mockResolvedValue(null);

      await expect(roleService.updateRole('999', updateRoleDto)).rejects.toThrow(
        AppError
      );
      await expect(roleService.updateRole('999', updateRoleDto)).rejects.toThrow(
        'Role not found'
      );

      expect(roleRepository.update).not.toHaveBeenCalled();
    });

    it('should handle partial updates', async () => {
      const existingRole = {
        id: '1',
        name: 'ADMIN',
        description: 'Old description',
        permissions: ['read:all'],
        isActive: true,
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const partialUpdate = { description: 'New description' };

      const updatedRole = {
        ...existingRole,
        description: 'New description',
        updatedAt: new Date(),
      };

      roleRepository.findById.mockResolvedValue(existingRole);
      roleRepository.update.mockResolvedValue(updatedRole);

      const result = await roleService.updateRole('1', partialUpdate);

      expect(roleRepository.update).toHaveBeenCalledWith('1', partialUpdate);
      expect(result.description).toBe('New description');
    });
  });

  describe('deleteRole', () => {
    it('should delete role successfully', async () => {
      const existingRole = {
        id: '1',
        name: 'CUSTOM_ROLE',
        description: 'Custom role',
        permissions: ['read:own'],
        isActive: true,
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      roleRepository.findById.mockResolvedValue(existingRole);
      roleRepository.countUsersByRole.mockResolvedValue(0);
      roleRepository.delete.mockResolvedValue(undefined);

      await roleService.deleteRole('1');

      expect(roleRepository.findById).toHaveBeenCalledWith('1');
      expect(roleRepository.countUsersByRole).toHaveBeenCalledWith('1');
      expect(roleRepository.delete).toHaveBeenCalledWith('1');
    });

    it('should throw error when role not found', async () => {
      roleRepository.findById.mockResolvedValue(null);

      await expect(roleService.deleteRole('999')).rejects.toThrow(AppError);
      await expect(roleService.deleteRole('999')).rejects.toThrow(
        'Role not found'
      );

      expect(roleRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw error when role is assigned to users', async () => {
      const existingRole = {
        id: '1',
        name: 'ADMIN',
        description: 'Administrator',
        permissions: ['read:all'],
        isActive: true,
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      roleRepository.findById.mockResolvedValue(existingRole);
      roleRepository.countUsersByRole.mockResolvedValue(5);

      await expect(roleService.deleteRole('1')).rejects.toThrow(AppError);
      await expect(roleService.deleteRole('1')).rejects.toThrow(
        'Cannot delete role with assigned users'
      );

      expect(roleRepository.delete).not.toHaveBeenCalled();
    });

    it('should prevent deletion of system roles', async () => {
      const systemRole = {
        id: '1',
        name: 'ADMIN',
        description: 'System administrator',
        permissions: ['read:all', 'write:all'],
        isActive: true,
        isSystem: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      roleRepository.findById.mockResolvedValue(systemRole);

      await expect(roleService.deleteRole('1')).rejects.toThrow(AppError);
      await expect(roleService.deleteRole('1')).rejects.toThrow(
        'Cannot delete system role'
      );

      expect(roleRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('assignPermissions', () => {
    it('should assign permissions to role', async () => {
      const existingRole = {
        id: '1',
        name: 'CUSTOM_ROLE',
        description: 'Custom role',
        permissions: ['read:own'],
        isActive: true,
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const newPermissions = ['write:own', 'delete:own'];

      const updatedRole = {
        ...existingRole,
        permissions: ['read:own', 'write:own', 'delete:own'],
        updatedAt: new Date(),
      };

      roleRepository.findById.mockResolvedValue(existingRole);
      roleRepository.update.mockResolvedValue(updatedRole);

      const result = await roleService.assignPermissions('1', newPermissions);

      expect(roleRepository.findById).toHaveBeenCalledWith('1');
      expect(roleRepository.update).toHaveBeenCalledWith('1', {
        permissions: ['read:own', 'write:own', 'delete:own'],
      });
      expect(result.permissions).toContain('write:own');
      expect(result.permissions).toContain('delete:own');
    });

    it('should remove duplicate permissions', async () => {
      const existingRole = {
        id: '1',
        name: 'CUSTOM_ROLE',
        description: 'Custom role',
        permissions: ['read:own'],
        isActive: true,
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const newPermissions = ['read:own', 'write:own'];

      const updatedRole = {
        ...existingRole,
        permissions: ['read:own', 'write:own'],
        updatedAt: new Date(),
      };

      roleRepository.findById.mockResolvedValue(existingRole);
      roleRepository.update.mockResolvedValue(updatedRole);

      const result = await roleService.assignPermissions('1', newPermissions);

      expect(result.permissions).toHaveLength(2);
      expect(result.permissions.filter((p: string) => p === 'read:own')).toHaveLength(1);
    });
  });

  describe('removePermissions', () => {
    it('should remove permissions from role', async () => {
      const existingRole = {
        id: '1',
        name: 'CUSTOM_ROLE',
        description: 'Custom role',
        permissions: ['read:own', 'write:own', 'delete:own'],
        isActive: true,
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const permissionsToRemove = ['write:own', 'delete:own'];

      const updatedRole = {
        ...existingRole,
        permissions: ['read:own'],
        updatedAt: new Date(),
      };

      roleRepository.findById.mockResolvedValue(existingRole);
      roleRepository.update.mockResolvedValue(updatedRole);

      const result = await roleService.removePermissions('1', permissionsToRemove);

      expect(roleRepository.findById).toHaveBeenCalledWith('1');
      expect(roleRepository.update).toHaveBeenCalledWith('1', {
        permissions: ['read:own'],
      });
      expect(result.permissions).not.toContain('write:own');
      expect(result.permissions).not.toContain('delete:own');
    });

    it('should handle removal of non-existent permissions', async () => {
      const existingRole = {
        id: '1',
        name: 'CUSTOM_ROLE',
        description: 'Custom role',
        permissions: ['read:own'],
        isActive: true,
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const permissionsToRemove = ['write:own', 'delete:own'];

      const updatedRole = {
        ...existingRole,
        updatedAt: new Date(),
      };

      roleRepository.findById.mockResolvedValue(existingRole);
      roleRepository.update.mockResolvedValue(updatedRole);

      const result = await roleService.removePermissions('1', permissionsToRemove);

      expect(result.permissions).toEqual(['read:own']);
    });
  });

  describe('checkPermission', () => {
    it('should return true if role has permission', async () => {
      const role = {
        id: '1',
        name: 'ADMIN',
        description: 'Administrator',
        permissions: ['read:all', 'write:all'],
        isActive: true,
        isSystem: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      roleRepository.findById.mockResolvedValue(role);

      const result = await roleService.checkPermission('1', 'read:all');

      expect(result).toBe(true);
    });

    it('should return false if role does not have permission', async () => {
      const role = {
        id: '1',
        name: 'USER',
        description: 'Regular user',
        permissions: ['read:own'],
        isActive: true,
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      roleRepository.findById.mockResolvedValue(role);

      const result = await roleService.checkPermission('1', 'write:all');

      expect(result).toBe(false);
    });

    it('should throw error if role not found', async () => {
      roleRepository.findById.mockResolvedValue(null);

      await expect(roleService.checkPermission('999', 'read:all')).rejects.toThrow(
        AppError
      );
    });
  });
});