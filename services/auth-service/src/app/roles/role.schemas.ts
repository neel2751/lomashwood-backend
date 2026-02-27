import { z } from 'zod';

export const createRoleSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).trim(),
    description: z.string().max(500).trim().optional(),
    permissions: z.array(z.string().min(1).max(100)).optional().default([]),
    isSystem: z.boolean().optional().default(false),
    isActive: z.boolean().optional().default(true),
  }),
});

export const updateRoleSchema = z.object({
  params: z.object({
    id: z.string().uuid({
      message: 'Role ID must be a valid UUID',
    }),
  }),
  body: z.object({
    name: z.string().min(2).max(100).trim().optional(),
    description: z.string().max(500).trim().optional(),
    permissions: z.array(z.string().min(1).max(100)).optional(),
    isActive: z.boolean().optional(),
  }).strict(),
});

export const getRoleByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid({
      message: 'Role ID must be a valid UUID',
    }),
  }),
});

export const getRoleByNameSchema = z.object({
  params: z.object({
    name: z.string().min(1, {
      message: 'Role name is required',
    }),
  }),
});

export const deleteRoleSchema = z.object({
  params: z.object({
    id: z.string().uuid({
      message: 'Role ID must be a valid UUID',
    }),
  }),
});

export const getAllRolesSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    isActive: z.enum(['true', 'false']).optional().transform(val => val === 'true'),
    isSystem: z.enum(['true', 'false']).optional().transform(val => val === 'true'),
    sortBy: z.enum(['name', 'createdAt', 'updatedAt']).optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
    search: z.string().optional(),
  }).optional(),
});

export const assignPermissionsSchema = z.object({
  params: z.object({
    id: z.string().uuid({
      message: 'Role ID must be a valid UUID',
    }),
  }),
  body: z.object({
    permissions: z.array(z.string().min(1).max(100)).min(1, {
      message: 'At least one permission is required',
    }),
  }),
});

export const removePermissionsSchema = z.object({
  params: z.object({
    id: z.string().uuid({
      message: 'Role ID must be a valid UUID',
    }),
  }),
  body: z.object({
    permissions: z.array(z.string().min(1).max(100)).min(1, {
      message: 'At least one permission is required',
    }),
  }),
});

export const getRolePermissionsSchema = z.object({
  params: z.object({
    id: z.string().uuid({
      message: 'Role ID must be a valid UUID',
    }),
  }),
});

export const checkPermissionSchema = z.object({
  params: z.object({
    id: z.string().uuid({
      message: 'Role ID must be a valid UUID',
    }),
  }),
  query: z.object({
    permission: z.string().min(1, {
      message: 'Permission is required',
    }),
  }),
});

export const getUsersByRoleSchema = z.object({
  params: z.object({
    id: z.string().uuid({
      message: 'Role ID must be a valid UUID',
    }),
  }),
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
  }).optional(),
});

export const getRoleStatsSchema = z.object({
  params: z.object({
    id: z.string().uuid({
      message: 'Role ID must be a valid UUID',
    }),
  }),
});

export const activateRoleSchema = z.object({
  params: z.object({
    id: z.string().uuid({
      message: 'Role ID must be a valid UUID',
    }),
  }),
});

export const deactivateRoleSchema = z.object({
  params: z.object({
    id: z.string().uuid({
      message: 'Role ID must be a valid UUID',
    }),
  }),
});

export const cloneRoleSchema = z.object({
  params: z.object({
    id: z.string().uuid({
      message: 'Role ID must be a valid UUID',
    }),
  }),
  body: z.object({
    name: z.string().min(2).max(100).trim(),
    description: z.string().max(500).trim().optional(),
  }),
});

export const bulkAssignRoleSchema = z.object({
  body: z.object({
    roleId: z.string().uuid({
      message: 'Role ID must be a valid UUID',
    }),
    userIds: z.array(z.string().uuid()).min(1, {
      message: 'At least one user ID is required',
    }).max(1000, {
      message: 'Cannot assign role to more than 1000 users at once',
    }),
  }),
});

export const exportRolesSchema = z.object({
  query: z.object({
    format: z.enum(['json', 'csv']).optional().default('json'),
  }).optional(),
});

export const roleResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  permissions: z.array(z.string()),
  isSystem: z.boolean(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().optional(),
});

export const roleListResponseSchema = z.object({
  roles: z.array(roleResponseSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),
});

export const roleStatsResponseSchema = z.object({
  roleId: z.string().uuid(),
  roleName: z.string(),
  userCount: z.number().int().nonnegative(),
  permissionCount: z.number().int().nonnegative(),
  isActive: z.boolean(),
  isSystem: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const bulkAssignResultSchema = z.object({
  assignedCount: z.number().int().nonnegative(),
  failedCount: z.number().int().nonnegative(),
  failedUsers: z.array(z.object({
    userId: z.string().uuid(),
    error: z.string(),
  })),
});

export const permissionCheckResponseSchema = z.object({
  roleId: z.string().uuid(),
  permission: z.string(),
  hasPermission: z.boolean(),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>['body'];
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>['body'];
export type GetAllRolesQuery = z.infer<typeof getAllRolesSchema>['query'];
export type AssignPermissionsInput = z.infer<typeof assignPermissionsSchema>['body'];
export type RemovePermissionsInput = z.infer<typeof removePermissionsSchema>['body'];
export type CheckPermissionQuery = z.infer<typeof checkPermissionSchema>['query'];
export type GetUsersByRoleQuery = z.infer<typeof getUsersByRoleSchema>['query'];
export type CloneRoleInput = z.infer<typeof cloneRoleSchema>['body'];
export type BulkAssignRoleInput = z.infer<typeof bulkAssignRoleSchema>['body'];
export type ExportRolesQuery = z.infer<typeof exportRolesSchema>['query'];
export type RoleResponse = z.infer<typeof roleResponseSchema>;
export type RoleListResponse = z.infer<typeof roleListResponseSchema>;
export type RoleStatsResponse = z.infer<typeof roleStatsResponseSchema>;
export type BulkAssignResult = z.infer<typeof bulkAssignResultSchema>;
export type PermissionCheckResponse = z.infer<typeof permissionCheckResponseSchema>;

export const roleSchemas = {
  create: createRoleSchema,
  update: updateRoleSchema,
  getById: getRoleByIdSchema,
  getByName: getRoleByNameSchema,
  delete: deleteRoleSchema,
  getAll: getAllRolesSchema,
  assignPermissions: assignPermissionsSchema,
  removePermissions: removePermissionsSchema,
  getPermissions: getRolePermissionsSchema,
  checkPermission: checkPermissionSchema,
  getUsersByRole: getUsersByRoleSchema,
  getStats: getRoleStatsSchema,
  activate: activateRoleSchema,
  deactivate: deactivateRoleSchema,
  clone: cloneRoleSchema,
  bulkAssign: bulkAssignRoleSchema,
  export: exportRolesSchema,
  response: roleResponseSchema,
  listResponse: roleListResponseSchema,
  statsResponse: roleStatsResponseSchema,
  bulkAssignResult: bulkAssignResultSchema,
  permissionCheckResponse: permissionCheckResponseSchema,
};

export default roleSchemas;