import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RoleService } from '../../src/app/roles/role.service';
import { RoleRepository } from '../../src/app/roles/role.repository';
import { HTTP_STATUS } from '../../src/shared/constants';

vi.mock('../../src/app/roles/role.repository');

const mockRoleRepository = vi.mocked(RoleRepository, true);




const mockRole = {
  id: 'role-uuid-001',
  name: 'CUSTOMER',
  description: 'Default customer role',
  permissions: ['product:read', 'order:create', 'booking:create'],
  isSystem: false,
  isActive: true,
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
  updatedAt: new Date('2025-01-01T00:00:00.000Z'),
  deletedAt: null,
};

const mockAdminRole = {
  id: 'role-uuid-002',
  name: 'ADMIN',
  description: 'Administrator role',
  permissions: ['*'],
  isSystem: true,
  isActive: true,
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
  updatedAt: new Date('2025-01-01T00:00:00.000Z'),
  deletedAt: null,
};

const mockCreateRoleDto = {
  name: 'CONSULTANT',
  description: 'Interior design consultant role',
  
  permissions: ['product:read'],
};

const mockUpdateRoleDto = {
  
  description: 'Updated description',
  permissions: ['product:read'],
};




const toPaginated = (roles: typeof mockRole[]) => ({
  roles,
  pagination: {
    page: 1,
    limit: 10,
    total: roles.length,
    totalPages: Math.ceil(roles.length / 10) || 0,
  },
});




const mockEventProducer = {
  publish: vi.fn().mockResolvedValue(undefined),
};

describe('RoleService', () => {
  let roleService: RoleService;
  let repoInstance: {
    findAll: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    findByName: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    countUsersByRole: ReturnType<typeof vi.fn>;
    findUsersByRole: ReturnType<typeof vi.fn>;
    findSystemRoles: ReturnType<typeof vi.fn>;
    findCustomRoles: ReturnType<typeof vi.fn>;
    bulkAssignRole: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    repoInstance = {
      findAll: vi.fn(),
      findById: vi.fn(),
      findByName: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      countUsersByRole: vi.fn(),
      findUsersByRole: vi.fn(),
      findSystemRoles: vi.fn(),
      findCustomRoles: vi.fn(),
      bulkAssignRole: vi.fn(),
    };

    mockRoleRepository.mockImplementation(() => repoInstance as any);

    
    roleService = new RoleService(repoInstance as any, mockEventProducer);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  

  describe('getAllRoles()', () => {
    it('should return a paginated list of all roles', async () => {
      repoInstance.findAll.mockResolvedValue(toPaginated([mockRole, mockAdminRole]));

      const result = await roleService.getAllRoles();

      expect(repoInstance.findAll).toHaveBeenCalledOnce();
      
      expect(result.roles).toHaveLength(2);
      expect(result.roles[0]!.name).toBe('CUSTOMER');
      expect(result.roles[1]!.name).toBe('ADMIN');
    });

    it('should return empty roles array when no roles exist', async () => {
      repoInstance.findAll.mockResolvedValue(toPaginated([]));

      const result = await roleService.getAllRoles();

      expect(result.roles).toEqual([]);
    });

    it('should throw if repository throws', async () => {
      repoInstance.findAll.mockRejectedValue(new Error('DB connection error'));

      await expect(roleService.getAllRoles()).rejects.toThrow('DB connection error');
    });

    it('should throw BAD_REQUEST when limit exceeds 100', async () => {
      await expect(roleService.getAllRoles({ limit: 101 })).rejects.toMatchObject({
        statusCode: HTTP_STATUS.BAD_REQUEST,
      });
    });
  });

  

  describe('getRoleById()', () => {
    it('should return the role when found', async () => {
      repoInstance.findById.mockResolvedValue(mockRole);

      const result = await roleService.getRoleById('role-uuid-001');

      expect(repoInstance.findById).toHaveBeenCalledWith('role-uuid-001');
      expect(result.id).toBe('role-uuid-001');
      expect(result.name).toBe('CUSTOMER');
    });

    it('should throw NOT_FOUND when role does not exist', async () => {
      repoInstance.findById.mockResolvedValue(null);

      await expect(roleService.getRoleById('nonexistent-id')).rejects.toMatchObject({
        statusCode: HTTP_STATUS.NOT_FOUND,
      });
    });
  });

  

  describe('getRoleByName()', () => {
    it('should return the role when found by name', async () => {
      repoInstance.findByName.mockResolvedValue(mockRole);

      const result = await roleService.getRoleByName('CUSTOMER');

      expect(repoInstance.findByName).toHaveBeenCalledWith('CUSTOMER');
      expect(result.name).toBe('CUSTOMER');
    });

    it('should throw NOT_FOUND when role name does not exist', async () => {
      repoInstance.findByName.mockResolvedValue(null);

      await expect(roleService.getRoleByName('GHOST_ROLE')).rejects.toMatchObject({
        statusCode: HTTP_STATUS.NOT_FOUND,
      });
    });
  });

  

  describe('createRole()', () => {
    it('should create and return a new role', async () => {
      repoInstance.findByName.mockResolvedValue(null);
      repoInstance.create.mockResolvedValue({
        id: 'role-uuid-003',
        ...mockCreateRoleDto,
        isSystem: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      const result = await roleService.createRole(mockCreateRoleDto);

      expect(repoInstance.findByName).toHaveBeenCalledWith('CONSULTANT');
      expect(repoInstance.create).toHaveBeenCalledOnce();
      expect(result.name).toBe('CONSULTANT');
    });

    it('should throw CONFLICT if role name already exists', async () => {
      repoInstance.findByName.mockResolvedValue(mockRole);

      await expect(
        roleService.createRole({ ...mockCreateRoleDto, name: 'CUSTOMER' }),
      ).rejects.toMatchObject({ statusCode: HTTP_STATUS.CONFLICT });

      expect(repoInstance.create).not.toHaveBeenCalled();
    });

    it('should throw BAD_REQUEST for invalid permissions', async () => {
      repoInstance.findByName.mockResolvedValue(null);

      
      
      await expect(
        roleService.createRole({ ...mockCreateRoleDto, permissions: ['invalid:permission'] }),
      ).rejects.toMatchObject({ statusCode: HTTP_STATUS.BAD_REQUEST });
    });
  });

  

  describe('updateRole()', () => {
    it('should update and return the updated role', async () => {
      repoInstance.findById.mockResolvedValue(mockRole);
      repoInstance.update.mockResolvedValue({
        ...mockRole,
        ...mockUpdateRoleDto,
        updatedAt: new Date(),
      });

      const result = await roleService.updateRole('role-uuid-001', mockUpdateRoleDto);

      expect(repoInstance.findById).toHaveBeenCalledWith('role-uuid-001');
      expect(repoInstance.update).toHaveBeenCalledWith('role-uuid-001', mockUpdateRoleDto);
      expect(result.description).toBe('Updated description');
    });

    it('should throw NOT_FOUND when role does not exist', async () => {
      repoInstance.findById.mockResolvedValue(null);

      await expect(roleService.updateRole('bad-id', mockUpdateRoleDto)).rejects.toMatchObject({
        statusCode: HTTP_STATUS.NOT_FOUND,
      });

      expect(repoInstance.update).not.toHaveBeenCalled();
    });

    it('should throw FORBIDDEN when trying to rename a system role', async () => {
      repoInstance.findById.mockResolvedValue(mockAdminRole);

      
      await expect(
        roleService.updateRole('role-uuid-002', { name: 'NEW_ADMIN' }),
      ).rejects.toMatchObject({ statusCode: HTTP_STATUS.FORBIDDEN });

      expect(repoInstance.update).not.toHaveBeenCalled();
    });
  });

  

  describe('deleteRole()', () => {
    it('should delete a non-system role with no assigned users', async () => {
      repoInstance.findById.mockResolvedValue(mockRole);
      
      repoInstance.countUsersByRole.mockResolvedValue(0);
      repoInstance.delete.mockResolvedValue(undefined);

      await expect(roleService.deleteRole('role-uuid-001')).resolves.toBeUndefined();

      expect(repoInstance.delete).toHaveBeenCalledWith('role-uuid-001');
    });

    it('should throw NOT_FOUND when role does not exist', async () => {
      repoInstance.findById.mockResolvedValue(null);

      await expect(roleService.deleteRole('nonexistent-id')).rejects.toMatchObject({
        statusCode: HTTP_STATUS.NOT_FOUND,
      });

      expect(repoInstance.delete).not.toHaveBeenCalled();
    });

    it('should throw FORBIDDEN when trying to delete a system role', async () => {
      repoInstance.findById.mockResolvedValue(mockAdminRole);

      await expect(roleService.deleteRole('role-uuid-002')).rejects.toMatchObject({
        statusCode: HTTP_STATUS.FORBIDDEN,
      });

      expect(repoInstance.delete).not.toHaveBeenCalled();
    });

    it('should throw CONFLICT when role is assigned to users', async () => {
      repoInstance.findById.mockResolvedValue(mockRole);
      repoInstance.countUsersByRole.mockResolvedValue(3);

      await expect(roleService.deleteRole('role-uuid-001')).rejects.toMatchObject({
        statusCode: HTTP_STATUS.CONFLICT,
      });

      expect(repoInstance.delete).not.toHaveBeenCalled();
    });
  });

  

  describe('getUsersByRole()', () => {
    
    

    it('should return users assigned to a role', async () => {
      repoInstance.findById.mockResolvedValue(mockRole);
      repoInstance.findUsersByRole.mockResolvedValue({
        users: [{ id: 'user-uuid-001', email: 'user@example.com' }],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      });

      const result = await roleService.getUsersByRole('role-uuid-001');

      expect(repoInstance.findUsersByRole).toHaveBeenCalledWith('role-uuid-001', {
        page: 1,
        limit: 10,
      });
      expect(result.users).toHaveLength(1);
      expect(result.users[0].email).toBe('user@example.com');
    });

    it('should throw NOT_FOUND when role does not exist', async () => {
      repoInstance.findById.mockResolvedValue(null);

      await expect(roleService.getUsersByRole('bad-role-id')).rejects.toMatchObject({
        statusCode: HTTP_STATUS.NOT_FOUND,
      });

      expect(repoInstance.findUsersByRole).not.toHaveBeenCalled();
    });

    it('should return empty users array when no users are assigned', async () => {
      repoInstance.findById.mockResolvedValue(mockRole);
      repoInstance.findUsersByRole.mockResolvedValue({
        users: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });

      const result = await roleService.getUsersByRole('role-uuid-001');

      expect(result.users).toEqual([]);
    });
  });

  

  describe('bulkAssignRole()', () => {
    it('should bulk assign a role to multiple users successfully', async () => {
      repoInstance.findById.mockResolvedValue(mockRole);
      repoInstance.bulkAssignRole.mockResolvedValue({
        assignedCount: 2,
        failedCount: 0,
        failedUsers: [],
      });

      const result = await roleService.bulkAssignRole('role-uuid-001', [
        'user-uuid-001',
        'user-uuid-002',
      ]);

      expect(repoInstance.bulkAssignRole).toHaveBeenCalledWith('role-uuid-001', [
        'user-uuid-001',
        'user-uuid-002',
      ]);
      expect(result.assignedCount).toBe(2);
      expect(result.failedCount).toBe(0);
    });

    it('should throw NOT_FOUND when role does not exist', async () => {
      repoInstance.findById.mockResolvedValue(null);

      await expect(
        roleService.bulkAssignRole('bad-role-id', ['user-uuid-001']),
      ).rejects.toMatchObject({ statusCode: HTTP_STATUS.NOT_FOUND });

      expect(repoInstance.bulkAssignRole).not.toHaveBeenCalled();
    });

    it('should throw BAD_REQUEST when no user IDs are provided', async () => {
      repoInstance.findById.mockResolvedValue(mockRole);

      await expect(roleService.bulkAssignRole('role-uuid-001', [])).rejects.toMatchObject({
        statusCode: HTTP_STATUS.BAD_REQUEST,
      });
    });
  });
});