export enum RoleType {
  ADMIN = 'admin',
  USER = 'user',
  CUSTOMER = 'customer',
  MANAGER = 'manager',
  STAFF = 'staff',
  CONSULTANT = 'consultant',
  GUEST = 'guest',
}

export enum PermissionCategory {
  USERS = 'users',
  ROLES = 'roles',
  PRODUCTS = 'products',
  ORDERS = 'orders',
  APPOINTMENTS = 'appointments',
  CONTENT = 'content',
  ANALYTICS = 'analytics',
  SETTINGS = 'settings',
}

export enum PermissionAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  MANAGE = 'manage',
  EXPORT = 'export',
  IMPORT = 'import',
  ASSIGN = 'assign',
}

export interface Role {
  id: string;
  name: string;
  description?: string | null;
  permissions: string[];
  isSystem: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface CreateRoleDTO {
  name: string;
  description?: string;
  permissions?: string[];
  isSystem?: boolean;
  isActive?: boolean;
}

export interface UpdateRoleDTO {
  name?: string;
  description?: string;
  permissions?: string[];
  isActive?: boolean;
}

export interface RoleWithUsers extends Role {
  users: Array<{
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
  }>;
  userCount: number;
}

export interface RoleListQuery {
  page?: number;
  limit?: number;
  isActive?: boolean;
  isSystem?: boolean;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface PaginatedRoleResponse {
  roles: Role[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface RoleDTO {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  isSystem: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoleResponse {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RoleListResponse {
  roles: RoleResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AssignPermissionsDTO {
  permissions: string[];
}

export interface RemovePermissionsDTO {
  permissions: string[];
}

export interface RoleStats {
  roleId: string;
  roleName: string;
  userCount: number;
  permissionCount: number;
  isActive: boolean;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BulkAssignResult {
  assignedCount: number;
  failedCount: number;
  failedUsers: Array<{
    userId: string;
    error: string;
  }>;
}

export interface RolePermission {
  category: PermissionCategory;
  action: PermissionAction;
  resource?: string;
  fullPermission: string;
}

export interface RoleHierarchy {
  role: Role;
  parent?: Role | null;
  children: Role[];
  level: number;
}

export interface IRoleRepository {
  create(data: CreateRoleDTO): Promise<Role>;
  findById(id: string): Promise<Role | null>;
  findByName(name: string): Promise<Role | null>;
  findAll(query?: RoleListQuery): Promise<PaginatedRoleResponse>;
  update(id: string, data: UpdateRoleDTO): Promise<Role>;
  delete(id: string): Promise<void>;
  findUsersByRole(roleId: string, query?: { page?: number; limit?: number }): Promise<{
    users: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>;
  countUsersByRole(roleId: string): Promise<number>;
  findSystemRoles(): Promise<Role[]>;
  findCustomRoles(): Promise<Role[]>;
  bulkAssignRole(roleId: string, userIds: string[]): Promise<BulkAssignResult>;
  findByIds(ids: string[]): Promise<Role[]>;
  existsByName(name: string, excludeId?: string): Promise<boolean>;
  countActiveRoles(): Promise<number>;
  countSystemRoles(): Promise<number>;
  countCustomRoles(): Promise<number>;
  findActiveRoles(): Promise<Role[]>;
  findInactiveRoles(): Promise<Role[]>;
  findRolesWithPermission(permission: string): Promise<Role[]>;
  updatePermissions(id: string, permissions: string[]): Promise<Role>;
  addPermission(id: string, permission: string): Promise<Role>;
  removePermission(id: string, permission: string): Promise<Role>;
  hasPermission(id: string, permission: string): Promise<boolean>;
}

export interface IRoleService {
  createRole(data: CreateRoleDTO): Promise<Role>;
  getRoleById(id: string): Promise<Role>;
  getRoleByName(name: string): Promise<Role>;
  getAllRoles(query?: RoleListQuery): Promise<PaginatedRoleResponse>;
  updateRole(id: string, data: UpdateRoleDTO): Promise<Role>;
  deleteRole(id: string): Promise<void>;
  assignPermissions(id: string, permissions: string[]): Promise<Role>;
  removePermissions(id: string, permissions: string[]): Promise<Role>;
  getRolePermissions(id: string): Promise<string[]>;
  checkPermission(id: string, permission: string): Promise<boolean>;
  getUsersByRole(id: string, query?: { page?: number; limit?: number }): Promise<{
    users: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>;
  getRoleStats(id: string): Promise<RoleStats>;
  activateRole(id: string): Promise<Role>;
  deactivateRole(id: string): Promise<Role>;
  cloneRole(id: string, newName: string, description?: string): Promise<Role>;
  getSystemRoles(): Promise<Role[]>;
  getCustomRoles(): Promise<Role[]>;
  getAllPermissions(): Promise<string[]>;
  bulkAssignRole(roleId: string, userIds: string[]): Promise<BulkAssignResult>;
  exportRoles(format?: string): Promise<string>;
}

export interface IRoleMapper {
  toDTO(role: Role): RoleDTO;
  toEntity(dto: CreateRoleDTO): Partial<Role>;
  toResponse(role: Role): RoleResponse;
  toListResponse(roles: Role[], pagination: any): RoleListResponse;
}

export enum RoleErrorType {
  ROLE_NOT_FOUND = 'ROLE_NOT_FOUND',
  ROLE_ALREADY_EXISTS = 'ROLE_ALREADY_EXISTS',
  INVALID_ROLE_DATA = 'INVALID_ROLE_DATA',
  INVALID_PERMISSION = 'INVALID_PERMISSION',
  SYSTEM_ROLE_IMMUTABLE = 'SYSTEM_ROLE_IMMUTABLE',
  ROLE_IN_USE = 'ROLE_IN_USE',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  ROLE_CREATE_FAILED = 'ROLE_CREATE_FAILED',
  ROLE_UPDATE_FAILED = 'ROLE_UPDATE_FAILED',
  ROLE_DELETE_FAILED = 'ROLE_DELETE_FAILED',
}

export class RoleError extends Error {
  constructor(
    public type: RoleErrorType,
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'RoleError';
    Object.setPrototypeOf(this, RoleError.prototype);
  }
}

export interface RoleConfig {
  maxCustomRoles: number;
  maxPermissionsPerRole: number;
  allowRoleCloning: boolean;
  systemRolesEditable: boolean;
  defaultRole: string;
  requireUniqueNames: boolean;
}

export enum RoleEventType {
  ROLE_CREATED = 'role.created',
  ROLE_UPDATED = 'role.updated',
  ROLE_DELETED = 'role.deleted',
  PERMISSIONS_ASSIGNED = 'role.permissions.assigned',
  PERMISSIONS_REMOVED = 'role.permissions.removed',
  ROLE_ACTIVATED = 'role.activated',
  ROLE_DEACTIVATED = 'role.deactivated',
  ROLE_BULK_ASSIGNED = 'role.bulk_assigned',
}

export interface RoleEventPayload {
  type: RoleEventType;
  roleId: string;
  roleName: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface RoleAudit {
  id: string;
  roleId: string;
  action: string;
  performedBy: string;
  changes?: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
}

export interface RoleExportData {
  role: Role;
  users: Array<{
    id: string;
    email: string;
    fullName: string;
  }>;
  stats: RoleStats;
  exportedAt: Date;
}

export interface RoleImportData {
  name: string;
  description?: string;
  permissions: string[];
  isActive: boolean;
}

export interface RoleValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
  }>;
}

export interface RolePermissionMatrix {
  [roleId: string]: {
    roleName: string;
    permissions: {
      [category: string]: string[];
    };
  };
}

export interface UserRoleAssignment {
  userId: string;
  roleId: string;
  assignedBy: string;
  assignedAt: Date;
  expiresAt?: Date | null;
}

export interface RoleFilter {
  isActive?: boolean;
  isSystem?: boolean;
  hasPermission?: string;
  nameContains?: string;
  createdAfter?: Date;
  createdBefore?: Date;
}

export const isValidRole = (role: any): role is Role => {
  return (
    role &&
    typeof role.id === 'string' &&
    typeof role.name === 'string' &&
    Array.isArray(role.permissions) &&
    typeof role.isSystem === 'boolean' &&
    typeof role.isActive === 'boolean'
  );
};

export const isSystemRole = (role: Role): boolean => {
  return role.isSystem === true;
};

export const isActiveRole = (role: Role): boolean => {
  return role.isActive === true;
};

export const hasPermission = (role: Role, permission: string): boolean => {
  return (role.permissions || []).includes(permission);
};

export const formatPermission = (
  category: PermissionCategory,
  action: PermissionAction,
  resource?: string
): string => {
  if (resource) {
    return `${category}.${resource}.${action}`;
  }
  return `${category}.${action}`;
};

export const parsePermission = (permission: string): RolePermission | null => {
  const parts = permission.split('.');
  
  if (parts.length < 2 || parts.length > 3) {
    return null;
  }

  const category = parts[0] as PermissionCategory;
  const action = parts[parts.length - 1] as PermissionAction;
  const resource = parts.length === 3 ? parts[1] : undefined;

  return {
    category,
    action,
    resource,
    fullPermission: permission,
  };
};