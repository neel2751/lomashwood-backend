

const ROLE_CONSTANTS = {
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
  },
  SORTING: {
    DEFAULT_SORT_BY: 'createdAt',
    DEFAULT_SORT_ORDER: 'desc' as const,
  },
};



interface Role {
  id: string;
  name: string;
  description?: string | null;
  permissions: string[];
  isActive: boolean;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

interface CreateRoleDTO {
  name: string;
  description?: string | null;
  permissions?: string[];
  isSystem?: boolean;
  isActive?: boolean;
}

interface UpdateRoleDTO {
  name?: string;
  description?: string | null;
  permissions?: string[];
  isActive?: boolean;
}

interface RoleListQuery {
  page?: number;
  limit?: number;
  isActive?: boolean;
  isSystem?: boolean;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface PaginatedRoleResponse {
  roles: Role[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface BulkAssignResult {
  assignedCount: number;
  failedCount: number;
  failedUsers: Array<{ userId: string; error: string }>;
}



interface PrismaClient {
  role: {
    create: (args: any) => Promise<Role>;
    findUnique: (args: any) => Promise<Role | null>;
    findMany: (args?: any) => Promise<Role[]>;
    update: (args: any) => Promise<Role>;
    delete: (args: any) => Promise<Role>;
    count: (args?: any) => Promise<number>;
    createMany: (args: any) => Promise<{ count: number }>;
    updateMany: (args: any) => Promise<{ count: number }>;
    deleteMany: (args: any) => Promise<{ count: number }>;
  };
  user: {
    findMany: (args?: any) => Promise<any[]>;
    count: (args?: any) => Promise<number>;
    update: (args: any) => Promise<any>;
  };
}



export class RoleRepository {
  constructor(private readonly prisma: PrismaClient) {}

  public async create(data: CreateRoleDTO): Promise<Role> {
    return await this.prisma.role.create({
      data: {
        name: data.name,
        description: data.description,
        permissions: data.permissions || [],
        isSystem: data.isSystem || false,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });
  }

  public async findById(id: string): Promise<Role | null> {
    return await this.prisma.role.findUnique({
      where: { id },
    });
  }

  public async findByName(name: string): Promise<Role | null> {
    return await this.prisma.role.findUnique({
      where: { name },
    });
  }

  public async findAll(query?: RoleListQuery): Promise<PaginatedRoleResponse> {
    const page = query?.page || ROLE_CONSTANTS.PAGINATION.DEFAULT_PAGE;
    const limit = query?.limit || ROLE_CONSTANTS.PAGINATION.DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const where: Record<string, any> = {};

    if (query?.isActive !== undefined) {
      where['isActive'] = query.isActive;
    }

    if (query?.isSystem !== undefined) {
      where['isSystem'] = query.isSystem;
    }

    if (query?.search) {
      where['OR'] = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const sortBy = query?.sortBy || ROLE_CONSTANTS.SORTING.DEFAULT_SORT_BY;
    const sortOrder = query?.sortOrder || ROLE_CONSTANTS.SORTING.DEFAULT_SORT_ORDER;

    const [roles, total] = await Promise.all([
      this.prisma.role.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.role.count({ where }),
    ]);

    return {
      roles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  public async update(id: string, data: UpdateRoleDTO): Promise<Role> {
    return await this.prisma.role.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        permissions: data.permissions,
        isActive: data.isActive,
        updatedAt: new Date(),
      },
    });
  }

  public async delete(id: string): Promise<void> {
    await this.prisma.role.delete({
      where: { id },
    });
  }

  public async findUsersByRole(
    roleId: string,
    query?: { page?: number; limit?: number }
  ): Promise<{
    users: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const page = query?.page || ROLE_CONSTANTS.PAGINATION.DEFAULT_PAGE;
    const limit = query?.limit || ROLE_CONSTANTS.PAGINATION.DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: { roleId },
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.user.count({ where: { roleId } }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  public async countUsersByRole(roleId: string): Promise<number> {
    return await this.prisma.user.count({
      where: { roleId },
    });
  }

  public async findSystemRoles(): Promise<Role[]> {
    return await this.prisma.role.findMany({
      where: { isSystem: true },
      orderBy: { name: 'asc' },
    });
  }

  public async findCustomRoles(): Promise<Role[]> {
    return await this.prisma.role.findMany({
      where: { isSystem: false },
      orderBy: { createdAt: 'desc' },
    });
  }

  public async bulkAssignRole(
    roleId: string,
    userIds: string[]
  ): Promise<BulkAssignResult> {
    let assignedCount = 0;
    let failedCount = 0;
    const failedUsers: Array<{ userId: string; error: string }> = [];

    for (const userId of userIds) {
      try {
        await this.prisma.user.update({
          where: { id: userId },
          data: { roleId },
        });
        assignedCount++;
      } catch (error) {
        failedCount++;
        failedUsers.push({
          userId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return { assignedCount, failedCount, failedUsers };
  }

  public async findByIds(ids: string[]): Promise<Role[]> {
    return await this.prisma.role.findMany({
      where: { id: { in: ids } },
    });
  }

  public async existsByName(name: string, excludeId?: string): Promise<boolean> {
    const where: Record<string, any> = { name };

    if (excludeId) {
      where['id'] = { not: excludeId };
    }

    const count = await this.prisma.role.count({ where });
    return count > 0;
  }

  public async countActiveRoles(): Promise<number> {
    return await this.prisma.role.count({ where: { isActive: true } });
  }

  public async countSystemRoles(): Promise<number> {
    return await this.prisma.role.count({ where: { isSystem: true } });
  }

  public async countCustomRoles(): Promise<number> {
    return await this.prisma.role.count({ where: { isSystem: false } });
  }

  public async findActiveRoles(): Promise<Role[]> {
    return await this.prisma.role.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  public async findInactiveRoles(): Promise<Role[]> {
    return await this.prisma.role.findMany({
      where: { isActive: false },
      orderBy: { name: 'asc' },
    });
  }

  public async findRolesWithPermission(permission: string): Promise<Role[]> {
    return await this.prisma.role.findMany({
      where: { permissions: { has: permission } },
    });
  }

  public async updatePermissions(id: string, permissions: string[]): Promise<Role> {
    return await this.prisma.role.update({
      where: { id },
      data: { permissions, updatedAt: new Date() },
    });
  }

  public async addPermission(id: string, permission: string): Promise<Role> {
    const role = await this.findById(id);
    if (!role) {
      throw new Error('Role not found');
    }

    const currentPermissions = role.permissions || [];
    if (!currentPermissions.includes(permission)) {
      currentPermissions.push(permission);
    }

    return await this.updatePermissions(id, currentPermissions);
  }

  public async removePermission(id: string, permission: string): Promise<Role> {
    const role = await this.findById(id);
    if (!role) {
      throw new Error('Role not found');
    }

    const updatedPermissions = (role.permissions || []).filter(
      (p: string) => p !== permission
    );

    return await this.updatePermissions(id, updatedPermissions);
  }

  public async hasPermission(id: string, permission: string): Promise<boolean> {
    const role = await this.findById(id);
    if (!role) return false;
    return (role.permissions || []).includes(permission);
  }

  public async softDelete(id: string): Promise<Role> {
    return await this.prisma.role.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  public async restore(id: string): Promise<Role> {
    return await this.prisma.role.update({
      where: { id },
      data: { deletedAt: null, isActive: true },
    });
  }

  public async findDeleted(): Promise<Role[]> {
    return await this.prisma.role.findMany({
      where: { deletedAt: { not: null } },
      orderBy: { deletedAt: 'desc' },
    });
  }

  public async permanentDelete(id: string): Promise<void> {
    await this.prisma.role.delete({ where: { id } });
  }

  public async search(searchTerm: string, limit: number = 10): Promise<Role[]> {
    return await this.prisma.role.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: { name: 'asc' },
    });
  }

  public async getStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    system: number;
    custom: number;
  }> {
    const [total, active, inactive, system, custom] = await Promise.all([
      this.prisma.role.count(),
      this.prisma.role.count({ where: { isActive: true } }),
      this.prisma.role.count({ where: { isActive: false } }),
      this.prisma.role.count({ where: { isSystem: true } }),
      this.prisma.role.count({ where: { isSystem: false } }),
    ]);

    return { total, active, inactive, system, custom };
  }

  public async batchCreate(roles: CreateRoleDTO[]): Promise<number> {
    const result = await this.prisma.role.createMany({
      data: roles.map((role) => ({
        name: role.name,
        description: role.description,
        permissions: role.permissions || [],
        isSystem: role.isSystem || false,
        isActive: role.isActive !== undefined ? role.isActive : true,
      })),
      skipDuplicates: true,
    });

    return result.count;
  }

  public async batchUpdate(
    ids: string[],
    data: Partial<UpdateRoleDTO>
  ): Promise<number> {
    const result = await this.prisma.role.updateMany({
      where: { id: { in: ids } },
      data: { ...data, updatedAt: new Date() },
    });

    return result.count;
  }

  public async batchDelete(ids: string[]): Promise<number> {
    const result = await this.prisma.role.deleteMany({
      where: { id: { in: ids } },
    });

    return result.count;
  }
}

export default RoleRepository;