import { RoleRepository } from './role.repository';
import {
  Role as RoleEntity,
  CreateRoleDTO,
  UpdateRoleDTO,
  RoleListQuery,
  PaginatedRoleResponse,
  RoleError,
  RoleErrorType,
  RoleStats,
  BulkAssignResult,
} from './role.types';
import {
  ROLE_PERMISSIONS,
} from './role.constants';

const ROLE_EVENT_TOPICS = {
  ROLE_CREATED:         'role.created',
  ROLE_UPDATED:         'role.updated',
  ROLE_DELETED:         'role.deleted',
  ROLE_ACTIVATED:       'role.activated',
  ROLE_DEACTIVATED:     'role.deactivated',
  ROLE_BULK_ASSIGNED:   'role.bulk_assigned',
  PERMISSIONS_ASSIGNED: 'role.permissions_assigned',
  PERMISSIONS_REMOVED:  'role.permissions_removed',
} as const;

const HTTP_STATUS = {
  OK:         200,
  BAD_REQUEST:400,
  FORBIDDEN:  403,
  NOT_FOUND:  404,
  CONFLICT:   409,
} as const;

const PAGINATION = {
  DEFAULT_PAGE:  1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT:     100,
} as const;

const MESSAGES = {
  ERROR: {
    ROLE_NOT_FOUND:           'Role not found',
    ROLE_ALREADY_EXISTS:      'Role already exists',
    ROLE_IN_USE:              'Role is currently assigned to users and cannot be deleted',
    SYSTEM_ROLE_IMMUTABLE:    'System roles cannot be modified',
    SYSTEM_ROLE_CANNOT_DELETE:'System roles cannot be deleted',
    ROLE_ALREADY_ACTIVE:      'Role is already active',
    ROLE_ALREADY_INACTIVE:    'Role is already inactive',
    NO_USERS_PROVIDED:        'No user IDs provided',
    INVALID_PERMISSION:       'One or more permissions are invalid',
  },
} as const;

const AVAILABLE_PERMISSIONS: string[] = Array.from(
  new Set((Object.values(ROLE_PERMISSIONS) as string[][]).flat())
);

interface EventProducer {
  publish(topic: string, payload: Record<string, unknown>): Promise<void>;
}

export class RoleService {
  constructor(
    private readonly roleRepository: RoleRepository,
    private readonly eventProducer: EventProducer
  ) {}

  public async createRole(createRoleDTO: CreateRoleDTO): Promise<RoleEntity> {
    const existingRole = await this.roleRepository.findByName(createRoleDTO.name);

    if (existingRole) {
      throw new RoleError(
        RoleErrorType.ROLE_ALREADY_EXISTS,
        MESSAGES.ERROR.ROLE_ALREADY_EXISTS,
        HTTP_STATUS.CONFLICT
      );
    }

    if (createRoleDTO.permissions && createRoleDTO.permissions.length > 0) {
      this.validatePermissions(createRoleDTO.permissions);
    }

    const role = await this.roleRepository.create(createRoleDTO);

    await this.eventProducer.publish(ROLE_EVENT_TOPICS.ROLE_CREATED, {
      roleId: role.id,
      roleName: role.name,
      permissions: role.permissions,
      createdAt: role.createdAt,
    });

    return role;
  }

  public async getRoleById(id: string): Promise<RoleEntity> {
    const role = await this.roleRepository.findById(id);

    if (!role) {
      throw new RoleError(
        RoleErrorType.ROLE_NOT_FOUND,
        MESSAGES.ERROR.ROLE_NOT_FOUND,
        HTTP_STATUS.NOT_FOUND
      );
    }

    return role;
  }

  public async getRoleByName(name: string): Promise<RoleEntity> {
    const role = await this.roleRepository.findByName(name);

    if (!role) {
      throw new RoleError(
        RoleErrorType.ROLE_NOT_FOUND,
        MESSAGES.ERROR.ROLE_NOT_FOUND,
        HTTP_STATUS.NOT_FOUND
      );
    }

    return role;
  }

  public async getAllRoles(query?: RoleListQuery): Promise<PaginatedRoleResponse> {
    const limit = query?.limit || PAGINATION.DEFAULT_LIMIT;

    if (limit > PAGINATION.MAX_LIMIT) {
      throw new RoleError(
        RoleErrorType.INVALID_ROLE_DATA,
        `Limit cannot exceed ${PAGINATION.MAX_LIMIT}`,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    return await this.roleRepository.findAll(query);
  }

  public async updateRole(id: string, updateRoleDTO: UpdateRoleDTO): Promise<RoleEntity> {
    const existingRole = await this.getRoleById(id);

    if (existingRole.isSystem && updateRoleDTO.name) {
      throw new RoleError(
        RoleErrorType.SYSTEM_ROLE_IMMUTABLE,
        MESSAGES.ERROR.SYSTEM_ROLE_IMMUTABLE,
        HTTP_STATUS.FORBIDDEN
      );
    }

    if (updateRoleDTO.name && updateRoleDTO.name !== existingRole.name) {
      const roleWithSameName = await this.roleRepository.findByName(updateRoleDTO.name);
      if (roleWithSameName) {
        throw new RoleError(
          RoleErrorType.ROLE_ALREADY_EXISTS,
          MESSAGES.ERROR.ROLE_ALREADY_EXISTS,
          HTTP_STATUS.CONFLICT
        );
      }
    }

    if (updateRoleDTO.permissions) {
      this.validatePermissions(updateRoleDTO.permissions);
    }

    const updatedRole = await this.roleRepository.update(id, updateRoleDTO);

    await this.eventProducer.publish(ROLE_EVENT_TOPICS.ROLE_UPDATED, {
      roleId: updatedRole.id,
      roleName: updatedRole.name,
      changes: updateRoleDTO,
      updatedAt: updatedRole.updatedAt,
    });

    return updatedRole;
  }

  public async deleteRole(id: string): Promise<void> {
    const role = await this.getRoleById(id);

    if (role.isSystem) {
      throw new RoleError(
        RoleErrorType.SYSTEM_ROLE_IMMUTABLE,
        MESSAGES.ERROR.SYSTEM_ROLE_CANNOT_DELETE,
        HTTP_STATUS.FORBIDDEN
      );
    }

    const userCount = await this.roleRepository.countUsersByRole(id);
    if (userCount > 0) {
      throw new RoleError(
        RoleErrorType.ROLE_IN_USE,
        MESSAGES.ERROR.ROLE_IN_USE,
        HTTP_STATUS.CONFLICT
      );
    }

    await this.roleRepository.delete(id);

    await this.eventProducer.publish(ROLE_EVENT_TOPICS.ROLE_DELETED, {
      roleId: id,
      roleName: role.name,
      deletedAt: new Date(),
    });
  }

  public async assignPermissions(id: string, permissions: string[]): Promise<RoleEntity> {
    const role = await this.getRoleById(id);

    if (role.isSystem) {
      throw new RoleError(
        RoleErrorType.SYSTEM_ROLE_IMMUTABLE,
        MESSAGES.ERROR.SYSTEM_ROLE_IMMUTABLE,
        HTTP_STATUS.FORBIDDEN
      );
    }

    this.validatePermissions(permissions);

    const currentPermissions = role.permissions || [];
    const newPermissions = Array.from(new Set([...currentPermissions, ...permissions]));

    const updatedRole = await this.roleRepository.update(id, { permissions: newPermissions });

    await this.eventProducer.publish(ROLE_EVENT_TOPICS.PERMISSIONS_ASSIGNED, {
      roleId: id,
      roleName: role.name,
      addedPermissions: permissions,
      totalPermissions: newPermissions.length,
    });

    return updatedRole;
  }

  public async removePermissions(id: string, permissions: string[]): Promise<RoleEntity> {
    const role = await this.getRoleById(id);

    if (role.isSystem) {
      throw new RoleError(
        RoleErrorType.SYSTEM_ROLE_IMMUTABLE,
        MESSAGES.ERROR.SYSTEM_ROLE_IMMUTABLE,
        HTTP_STATUS.FORBIDDEN
      );
    }

    const currentPermissions = role.permissions || [];
    const newPermissions = currentPermissions.filter(
      (permission) => !permissions.includes(permission)
    );

    const updatedRole = await this.roleRepository.update(id, { permissions: newPermissions });

    await this.eventProducer.publish(ROLE_EVENT_TOPICS.PERMISSIONS_REMOVED, {
      roleId: id,
      roleName: role.name,
      removedPermissions: permissions,
      totalPermissions: newPermissions.length,
    });

    return updatedRole;
  }

  public async getRolePermissions(id: string): Promise<string[]> {
    const role = await this.getRoleById(id);
    return role.permissions || [];
  }

  public async checkPermission(id: string, permission: string): Promise<boolean> {
    const role = await this.getRoleById(id);
    return (role.permissions || []).includes(permission);
  }

  public async getUsersByRole(
    id: string,
    query?: { page?: number; limit?: number }
  ): Promise<{
    users: any[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    await this.getRoleById(id);

    const page  = query?.page  || PAGINATION.DEFAULT_PAGE;
    const limit = query?.limit || PAGINATION.DEFAULT_LIMIT;

    return await this.roleRepository.findUsersByRole(id, { page, limit });
  }

  public async getRoleStats(id: string): Promise<RoleStats> {
    await this.getRoleById(id);

    const userCount = await this.roleRepository.countUsersByRole(id);
    const role      = await this.roleRepository.findById(id);

    return {
      roleId:          id,
      roleName:        role!.name,
      userCount,
      permissionCount: (role!.permissions || []).length,
      isActive:        role!.isActive,
      isSystem:        role!.isSystem,
      createdAt:       role!.createdAt,
      updatedAt:       role!.updatedAt,
    };
  }

  public async activateRole(id: string): Promise<RoleEntity> {
    const role = await this.getRoleById(id);

    if (role.isActive) {
      throw new RoleError(
        RoleErrorType.INVALID_ROLE_DATA,
        MESSAGES.ERROR.ROLE_ALREADY_ACTIVE,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    const updatedRole = await this.roleRepository.update(id, { isActive: true });

    await this.eventProducer.publish(ROLE_EVENT_TOPICS.ROLE_ACTIVATED, {
      roleId: id,
      roleName: role.name,
      activatedAt: new Date(),
    });

    return updatedRole;
  }

  public async deactivateRole(id: string): Promise<RoleEntity> {
    const role = await this.getRoleById(id);

    if (role.isSystem) {
      throw new RoleError(
        RoleErrorType.SYSTEM_ROLE_IMMUTABLE,
        MESSAGES.ERROR.SYSTEM_ROLE_IMMUTABLE,
        HTTP_STATUS.FORBIDDEN
      );
    }

    if (!role.isActive) {
      throw new RoleError(
        RoleErrorType.INVALID_ROLE_DATA,
        MESSAGES.ERROR.ROLE_ALREADY_INACTIVE,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    const updatedRole = await this.roleRepository.update(id, { isActive: false });

    await this.eventProducer.publish(ROLE_EVENT_TOPICS.ROLE_DEACTIVATED, {
      roleId: id,
      roleName: role.name,
      deactivatedAt: new Date(),
    });

    return updatedRole;
  }

  public async cloneRole(id: string, newName: string, description?: string): Promise<RoleEntity> {
    const sourceRole = await this.getRoleById(id);

    const existingRole = await this.roleRepository.findByName(newName);
    if (existingRole) {
      throw new RoleError(
        RoleErrorType.ROLE_ALREADY_EXISTS,
        MESSAGES.ERROR.ROLE_ALREADY_EXISTS,
        HTTP_STATUS.CONFLICT
      );
    }

    const createRoleDTO: CreateRoleDTO = {
      name:        newName,
      description: description || `Cloned from ${sourceRole.name}`,
      permissions: sourceRole.permissions || [],
      isSystem:    false,
      isActive:    true,
    };

    return await this.createRole(createRoleDTO);
  }

  public async getSystemRoles(): Promise<RoleEntity[]> {
    return await this.roleRepository.findSystemRoles();
  }

  public async getCustomRoles(): Promise<RoleEntity[]> {
    return await this.roleRepository.findCustomRoles();
  }

  public async getAllPermissions(): Promise<string[]> {
    return AVAILABLE_PERMISSIONS;
  }

  public async bulkAssignRole(roleId: string, userIds: string[]): Promise<BulkAssignResult> {
    await this.getRoleById(roleId);

    if (!userIds || userIds.length === 0) {
      throw new RoleError(
        RoleErrorType.INVALID_ROLE_DATA,
        MESSAGES.ERROR.NO_USERS_PROVIDED,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    const result = await this.roleRepository.bulkAssignRole(roleId, userIds);

    await this.eventProducer.publish(ROLE_EVENT_TOPICS.ROLE_BULK_ASSIGNED, {
      roleId,
      userIds,
      assignedCount: result.assignedCount,
      failedCount:   result.failedCount,
    });

    return result;
  }

  public async exportRoles(format: string = 'json'): Promise<string> {
    const roles = await this.roleRepository.findAll({});

    if (format === 'csv') {
      return this.convertToCSV(roles.roles);
    }

    return JSON.stringify(roles.roles, null, 2);
  }

  private validatePermissions(permissions: string[]): void {
    const invalidPermissions = permissions.filter(
      (permission) => !AVAILABLE_PERMISSIONS.includes(permission)
    );

    if (invalidPermissions.length > 0) {
      throw new RoleError(
        RoleErrorType.INVALID_PERMISSION,
        `Invalid permissions: ${invalidPermissions.join(', ')}`,
        HTTP_STATUS.BAD_REQUEST
      );
    }
  }

  private convertToCSV(roles: RoleEntity[]): string {
    const headers = ['ID', 'Name', 'Description', 'Permissions', 'Is System', 'Is Active', 'Created At'];
    const rows = roles.map((role) => [
      role.id,
      role.name,
      role.description || '',
      (role.permissions || []).join(';'),
      role.isSystem.toString(),
      role.isActive.toString(),
      role.createdAt.toISOString(),
    ]);

    return [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');
  }
}

export default RoleService;