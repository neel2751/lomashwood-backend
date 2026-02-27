// ─── Local type definitions (replace with your role.types imports once confirmed) ───

interface Role {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface RoleResponseDTO {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface RoleWithPermissionsDTO extends RoleResponseDTO {
  permissions: PermissionDTO[];
}

interface RoleListItemDTO {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  isSystem: boolean;
}

interface PermissionDTO {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateRoleDTO {
  name: string;
  description?: string;
  isActive?: boolean;
  isSystem?: boolean;
  permissions?: string[]; // was permissionIds — fixed per error
}

interface UpdateRoleDTO {
  name?: string;
  description?: string;
  isActive?: boolean;
  permissionIds?: string[];
}

// ─── Mapper ───────────────────────────────────────────────────────────────────

export class RoleMapper {

  static toResponseDTO(role: Role): RoleResponseDTO {
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      isActive: role.isActive,
      isSystem: role.isSystem,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }

  static toRoleWithPermissionsDTO(
    role: Role & { permissions?: Permission[] }
  ): RoleWithPermissionsDTO {
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      isActive: role.isActive,
      isSystem: role.isSystem,
      permissions: role.permissions
        ? role.permissions.map((p: Permission) => this.toPermissionDTO(p))
        : [],
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }

  static toPermissionDTO(permission: Permission): PermissionDTO {
    return {
      id: permission.id,
      name: permission.name,
      resource: permission.resource,
      action: permission.action,
      description: permission.description,
      createdAt: permission.createdAt,
      updatedAt: permission.updatedAt,
    };
  }

  static toListItemDTO(role: Role): RoleListItemDTO {
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      isActive: role.isActive,
      isSystem: role.isSystem,
    };
  }

  static toCreateInput(dto: CreateRoleDTO): {
    name: string;
    description: string | null;
    isActive: boolean;
    isSystem: boolean;
    permissions?: {
      connect: { id: string }[];
    };
  } {
    return {
      name: dto.name,
      description: dto.description || null,
      isActive: dto.isActive ?? true,
      isSystem: dto.isSystem ?? false,
      // Fixed: using dto.permissions instead of dto.permissionIds
      ...(dto.permissions && dto.permissions.length > 0
        ? {
            permissions: {
              connect: dto.permissions.map((id: string) => ({ id })),
            },
          }
        : {}),
    };
  }

  static toUpdateInput(dto: UpdateRoleDTO): {
    name?: string;
    description?: string | null;
    isActive?: boolean;
    permissions?: {
      set: { id: string }[];
    };
  } {
    const updateData: {
      name?: string;
      description?: string | null;
      isActive?: boolean;
      permissions?: { set: { id: string }[] };
    } = {};

    if (dto.name !== undefined) {
      updateData.name = dto.name;
    }

    if (dto.description !== undefined) {
      updateData.description = dto.description || null;
    }

    if (dto.isActive !== undefined) {
      updateData.isActive = dto.isActive;
    }

    if (dto.permissionIds !== undefined) {
      updateData.permissions = {
        set: dto.permissionIds.map((id: string) => ({ id })),
      };
    }

    return updateData;
  }

  static toResponseDTOArray(roles: Role[]): RoleResponseDTO[] {
    return roles.map((role) => this.toResponseDTO(role));
  }

  static toListItemDTOArray(roles: Role[]): RoleListItemDTO[] {
    return roles.map((role) => this.toListItemDTO(role));
  }

  static toRoleWithPermissionsDTOArray(
    roles: (Role & { permissions?: Permission[] })[]
  ): RoleWithPermissionsDTO[] {
    return roles.map((role) => this.toRoleWithPermissionsDTO(role));
  }

  static toPermissionDTOArray(permissions: Permission[]): PermissionDTO[] {
    return permissions.map((permission: Permission) => this.toPermissionDTO(permission));
  }

  static extractPermissionIds(permissions: Permission[]): string[] {
    return permissions.map((permission: Permission) => permission.id);
  }

  static hasPermission(
    role: Role & { permissions?: Permission[] },
    resource: string,
    action: string
  ): boolean {
    if (!role.permissions) {
      return false;
    }
    return role.permissions.some(
      (permission: Permission) =>
        permission.resource === resource && permission.action === action
    );
  }

  static groupPermissionsByResource(
    permissions: Permission[]
  ): Record<string, PermissionDTO[]> {
    return permissions.reduce(
      (acc: Record<string, PermissionDTO[]>, permission: Permission) => {
        const resource = permission.resource;
        if (!acc[resource]) {
          acc[resource] = [];
        }
        acc[resource].push(this.toPermissionDTO(permission));
        return acc;
      },
      {} as Record<string, PermissionDTO[]>
    );
  }

  static sanitizeForPublic(role: Role): Omit<RoleResponseDTO, 'isSystem'> {
    const dto = this.toResponseDTO(role);
    const { isSystem, ...publicData } = dto;
    return publicData;
  }

  static toRoleWithUserCount(
    role: Role & { _count?: { users: number } }
  ): RoleResponseDTO & { userCount: number } {
    return {
      ...this.toResponseDTO(role),
      userCount: role._count?.users ?? 0,
    };
  }

  static canModify(role: Role): boolean {
    return !role.isSystem;
  }

  static canDelete(role: Role & { _count?: { users: number } }): boolean {
    return !role.isSystem && (role._count?.users ?? 0) === 0;
  }

  static cloneRoleData(
    role: Role & { permissions?: Permission[] }
  ): RoleWithPermissionsDTO {
    return JSON.parse(
      JSON.stringify(this.toRoleWithPermissionsDTO(role))
    ) as RoleWithPermissionsDTO;
  }

  static mergePermissionIds(
    existingIds: string[],
    newIds: string[]
  ): string[] {
    const mergedSet = new Set([...existingIds, ...newIds]);
    return Array.from(mergedSet);
  }

  static removePermissionIds(
    existingIds: string[],
    idsToRemove: string[]
  ): string[] {
    const removeSet = new Set(idsToRemove);
    return existingIds.filter((id: string) => !removeSet.has(id));
  }

  static toAuditLog(role: Role): {
    roleId: string;
    roleName: string;
    isSystem: boolean;
  } {
    return {
      roleId: role.id,
      roleName: role.name,
      isSystem: role.isSystem,
    };
  }

  static detectChanges(
    oldRole: Role,
    newRole: Partial<UpdateRoleDTO>
  ): Partial<UpdateRoleDTO> {
    const changes: Partial<UpdateRoleDTO> = {};

    if (newRole.name !== undefined && newRole.name !== oldRole.name) {
      changes.name = newRole.name;
    }

    if (
      newRole.description !== undefined &&
      newRole.description !== oldRole.description
    ) {
      changes.description = newRole.description;
    }

    if (
      newRole.isActive !== undefined &&
      newRole.isActive !== oldRole.isActive
    ) {
      changes.isActive = newRole.isActive;
    }

    if (newRole.permissionIds !== undefined) {
      changes.permissionIds = newRole.permissionIds;
    }

    return changes;
  }

  static toRoleSummary(
    role: Role & { _count?: { users: number } }
  ): {
    id: string;
    name: string;
    userCount: number;
    isActive: boolean;
  } {
    return {
      id: role.id,
      name: role.name,
      userCount: role._count?.users ?? 0,
      isActive: role.isActive,
    };
  }
}