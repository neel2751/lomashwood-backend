import { HttpClient } from '../utils/http';
import { PaginatedResponse } from '../types/api.types';


export interface Role {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  level?: number;
  permissions?: string[];
  userCount?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
  parentId?: string;
  permissions?: string[];
  isActive?: boolean;
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  parentId?: string;
  permissions?: string[];
  isActive?: boolean;
}

export interface RoleFilters {
  search?: string;
  isActive?: boolean;
  group?: string;
  resource?: string;
  dateFrom?: string;
  dateTo?: string;
}

export class RoleService {
  constructor(private HttpClient: HttpClient) {}

  
  async getRoles(params?: RoleFilters & {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<Role>> {
    return this.HttpClient.get<PaginatedResponse<Role>>('/roles', { params });
  }

  async getRole(roleId: string): Promise<Role> {
    return this.HttpClient.get<Role>(`/roles/${roleId}`);
  }

  async getRoleByName(name: string): Promise<Role> {
    return this.HttpClient.get<Role>(`/roles/name/${name}`);
  }

  async createRole(roleData: CreateRoleRequest): Promise<Role> {
    return this.HttpClient.post<Role>('/roles', roleData);
  }

  async updateRole(roleId: string, updateData: UpdateRoleRequest): Promise<Role> {
    return this.HttpClient.put<Role>(`/roles/${roleId}`, updateData);
  }

  async deleteRole(roleId: string): Promise<void> {
    return this.HttpClient.delete<void>(`/roles/${roleId}`);
  }

  
  async getRolePermissions(roleId: string): Promise<Array<{
    id: string;
    roleId: string;
    permissionId: string;
    permissionName: string;
    permissionGroup: string;
    granted: boolean;
    grantedAt?: string;
    grantedBy?: string;
  }>> {
    return this.HttpClient.get<any[]>(`/roles/${roleId}/permissions`);
  }

  async grantRolePermission(roleId: string, permissionId: string): Promise<void> {
    return this.HttpClient.post<void>(`/roles/${roleId}/permissions/${permissionId}/grant`);
  }

  async revokeRolePermission(roleId: string, permissionId: string): Promise<void> {
    return this.HttpClient.post<void>(`/roles/${roleId}/permissions/${permissionId}/revoke`);
  }

  async bulkUpdateRolePermissions(roleId: string, permissions: {
    grant: string[];
    revoke: string[];
  }): Promise<{
    granted: string[];
    revoked: string[];
    errors: Array<{ permissionId: string; error: string }>;
  }> {
    return this.HttpClient.put<any>(`/roles/${roleId}/permissions/bulk`, { permissions });
  }

  
  async getPermissions(params?: {
    page?: number;
    limit?: number;
    group?: string;
    active?: boolean;
  }): Promise<PaginatedResponse<{
    id: string;
    name: string;
    description?: string;
    group: string;
    resource: string;
    action: string;
    isActive: boolean;
    createdAt: string;
  }>> {
    return this.HttpClient.get<PaginatedResponse<any>>('/permissions', { params });
  }

  async getPermission(permissionId: string): Promise<{
    id: string;
    name: string;
    description?: string;
    group: string;
    resource: string;
    action: string;
    isActive: boolean;
    createdAt: string;
  }> {
    return this.HttpClient.get<any>(`/permissions/${permissionId}`);
  }

  async createPermission(permissionData: {
    name: string;
    description?: string;
    group: string;
    resource: string;
    action: string;
    isActive?: boolean;
  }): Promise<any> {
    return this.HttpClient.post<any>('/permissions', permissionData);
  }

  async updatePermission(permissionId: string, updateData: {
    name?: string;
    description?: string;
    group?: string;
    resource?: string;
    action?: string;
    isActive?: boolean;
  }): Promise<any> {
    return this.HttpClient.put<any>(`/permissions/${permissionId}`, updateData);
  }

  async deletePermission(permissionId: string): Promise<void> {
    return this.HttpClient.delete<void>(`/permissions/${permissionId}`);
  }

  
  async getPermissionGroups(): Promise<Array<{
    name: string;
    description?: string;
    permissions: Array<{ id: string; name: string; resource: string; action: string }>;
    isActive: boolean;
  }>> {
    return this.HttpClient.get<any[]>('/permissions/groups');
  }

  async getPermissionGroup(groupName: string): Promise<{
    name: string;
    description?: string;
    permissions: Array<{ id: string; name: string; resource: string; action: string }>;
    isActive: boolean;
  }> {
    return this.HttpClient.get<any>(`/permissions/groups/${groupName}`);
  }

  
  async getUserRoles(userId: string): Promise<Array<{
    id: string;
    userId: string;
    roleId: string;
    roleName: string;
    grantedAt: string;
    grantedBy: string;
    expiresAt?: string;
    isActive: boolean;
  }>> {
    return this.HttpClient.get<any[]>(`/users/${userId}/roles`);
  }

  async assignUserRole(userId: string, roleId: string, options?: {
    expiresAt?: string;
    reason?: string;
  }): Promise<void> {
    return this.HttpClient.post<void>(`/users/${userId}/roles/${roleId}`, options);
  }

  async removeUserRole(userId: string, roleId: string): Promise<void> {
    return this.HttpClient.delete<void>(`/users/${userId}/roles/${roleId}`);
  }

  async updateUserRole(userId: string, roleId: string, updateData: {
    expiresAt?: string;
    reason?: string;
  }): Promise<any> {
    return this.HttpClient.put<any>(`/users/${userId}/roles/${roleId}`, updateData);
  }

  async bulkAssignUserRoles(userId: string, roleIds: string[], options?: {
    expiresAt?: string;
    reason?: string;
  }): Promise<{
    assigned: string[];
    errors: Array<{ roleId: string; error: string }>;
  }> {
    return this.HttpClient.post<any>(`/users/${userId}/roles/bulk`, { roleIds, ...options });
  }

  
  async getRoleUsers(roleId: string, params?: {
    page?: number;
    limit?: number;
    active?: boolean;
  }): Promise<PaginatedResponse<{
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    grantedAt: string;
    grantedBy: string;
    expiresAt?: string;
    isActive: boolean;
  }>> {
    return this.HttpClient.get<PaginatedResponse<any>>(`/roles/${roleId}/users`, { params });
  }

  
  async getRoleHierarchy(): Promise<Array<{
    id: string;
    name: string;
    description?: string;
    parentId?: string;
    parentName?: string;
    level: number;
    children: Array<{ id: string; name: string; description?: string; level: number }>;
    permissions: Array<{ id: string; name: string; group: string; resource: string; action: string }>;
    userCount: number;
    isActive: boolean;
  }>> {
    return this.HttpClient.get<any[]>('/roles/hierarchy');
  }

  async createRoleHierarchy(hierarchyData: {
    roles: Array<{
      id: string;
      name: string;
      description?: string;
      parentId?: string;
      permissions?: string[];
    }>;
  }): Promise<{
    created: string[];
    updated: string[];
    errors: Array<{ role: string; error: string }>;
  }> {
    return this.HttpClient.post<any>('/roles/hierarchy', hierarchyData);
  }

  
  async getRoleTemplates(params?: {
    page?: number;
    limit?: number;
    category?: string;
  }): Promise<PaginatedResponse<{
    id: string;
    name: string;
    description?: string;
    category: string;
    permissions: Array<{ id: string; name: string; group: string; resource: string; action: string }>;
    uses: number;
    isActive: boolean;
    createdAt: string;
  }>> {
    return this.HttpClient.get<PaginatedResponse<any>>('/roles/templates', { params });
  }

  async createRoleFromTemplate(templateId: string, roleData: {
    name: string;
    description?: string;
  }): Promise<Role> {
    return this.HttpClient.post<Role>(`/roles/templates/${templateId}/create`, roleData);
  }

  
  async getRoleAnalytics(params?: {
    startDate?: string;
    endDate?: string;
    roleId?: string;
  }): Promise<{
    overview: {
      totalRoles: number;
      activeRoles: number;
      totalUsers: number;
      usersWithRoles: number;
      averageRolesPerUser: number;
    };
    roles: Array<{
      roleId: string;
      roleName: string;
      userCount: number;
      permissionCount: number;
      activeUsers: number;
      averageAssignmentDuration: number;
    }>;
    permissions: Array<{
      permissionId: string;
      permissionName: string;
      group: string;
      roleCount: number;
      userCount: number;
    }>;
    trends: Array<{
      date: string;
      rolesCreated: number;
      rolesDeleted: number;
      assignments: number;
      unassignments: number;
    }>;
    usage: {
      mostUsedRoles: Array<{ roleId: string; roleName: string; usage: number }>;
      leastUsedRoles: Array<{ roleId: string; roleName: string; usage: number }>;
      unusedRoles: Array<{ roleId: string; roleName: string }>;
    };
  }> {
    return this.HttpClient.get<any>('/roles/analytics', { params });
  }

  async getRoleDetailedAnalytics(roleId: string, params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{
    roleId: string;
    roleName: string;
    overview: {
      totalUsers: number;
      activeUsers: number;
      permissionCount: number;
      averageAssignmentDuration: number;
    };
    users: Array<{
      userId: string;
      userName: string;
      userEmail: string;
      grantedAt: string;
      lastActive?: string;
      isActive: boolean;
    }>;
    permissions: Array<{
      permissionId: string;
      permissionName: string;
      group: string;
      resource: string;
      action: string;
    }>;
    activity: Array<{ date: string; assignments: number; unassignments: number }>;
    usage: {
      loginActivity: Array<{ date: string; activeUsers: number; totalLogins: number }>;
      featureUsage: Array<{ feature: string; usage: number; uniqueUsers: number }>;
    };
  }> {
    return this.HttpClient.get<any>(`/roles/${roleId}/analytics`, { params });
  }

  
  async searchRoles(query: string, params?: {
    page?: number;
    limit?: number;
    group?: string;
    resource?: string;
  }): Promise<PaginatedResponse<Role>> {
    return this.HttpClient.get<PaginatedResponse<Role>>('/roles/search', {
      params: { q: query, ...params },
    });
  }

  
  async validateRole(roleData: CreateRoleRequest): Promise<{
    valid: boolean;
    errors?: Array<{ field: string; message: string; type: 'ERROR' | 'WARNING' }>;
    warnings?: Array<{ field: string; message: string; type: 'ERROR' | 'WARNING' }>;
    suggestions?: Array<{ field: string; message: string; improvement: string }>;
    conflicts?: Array<{
      type: 'DUPLICATE_NAME' | 'PERMISSION_CONFLICT' | 'HIERARCHY_CONFLICT';
      message: string;
      conflictingId?: string;
    }>;
  }> {
    return this.HttpClient.post<any>('/roles/validate', roleData);
  }

  
  async exportRoles(params?: {
    format?: 'JSON' | 'CSV' | 'EXCEL';
    roleIds?: string[];
    includePermissions?: boolean;
    includeUsers?: boolean;
  }): Promise<Blob> {
    
    return this.HttpClient.getBlob('/roles/export', params);
  }

  async importRoles(file: File, options?: {
    overwrite?: boolean;
    createMissing?: boolean;
    validatePermissions?: boolean;
    assignUsers?: boolean;
  }): Promise<{
    imported: number;
    updated: number;
    skipped: number;
    errors: Array<{ row: number; error: string; data: any }>;
  }> {
    const formData = new FormData();
    formData.append('file', file);

    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        formData.append(key, value.toString());
      });
    }

    
    return this.HttpClient.upload<any>('/roles/import', formData);
  }

  
  async getRoleSettings(): Promise<{
    general: {
      maxRolesPerUser: number;
      defaultRoleExpiry: number;
      allowRoleHierarchy: boolean;
      requireRoleApproval: boolean;
    };
    permissions: {
      allowCustomPermissions: boolean;
      permissionGroups: string[];
      defaultPermissions: string[];
    };
    security: {
      enableRoleAudit: boolean;
      auditRetentionDays: number;
      requireReasonForChanges: boolean;
    };
    notifications: {
      enableRoleChangeNotifications: boolean;
      notifyOnRoleAssignment: boolean;
      notifyOnRoleRemoval: boolean;
      defaultRecipients: string[];
    };
  }> {
    return this.HttpClient.get<any>('/roles/settings');
  }

  async updateRoleSettings(settings: {
    general?: {
      maxRolesPerUser?: number;
      defaultRoleExpiry?: number;
      allowRoleHierarchy?: boolean;
      requireRoleApproval?: boolean;
    };
    permissions?: {
      allowCustomPermissions?: boolean;
      permissionGroups?: string[];
      defaultPermissions?: string[];
    };
    security?: {
      enableRoleAudit?: boolean;
      auditRetentionDays?: number;
      requireReasonForChanges?: boolean;
    };
    notifications?: {
      enableRoleChangeNotifications?: boolean;
      notifyOnRoleAssignment?: boolean;
      notifyOnRoleRemoval?: boolean;
      defaultRecipients?: string[];
    };
  }): Promise<any> {
    return this.HttpClient.put<any>('/roles/settings', settings);
  }

  
  async getRoleAudit(params?: {
    page?: number;
    limit?: number;
    roleId?: string;
    userId?: string;
    action?: 'CREATE' | 'UPDATE' | 'DELETE' | 'ASSIGN' | 'UNASSIGN';
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResponse<{
    id: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'ASSIGN' | 'UNASSIGN';
    entityType: 'ROLE' | 'PERMISSION' | 'USER_ROLE';
    entityId: string;
    entityName?: string;
    userId: string;
    userName: string;
    changes?: Record<string, any>;
    reason?: string;
    ipAddress?: string;
    userAgent?: string;
    timestamp: string;
  }>> {
    return this.HttpClient.get<PaginatedResponse<any>>('/roles/audit', { params });
  }

  async getRoleAuditDetails(auditId: string): Promise<{
    id: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'ASSIGN' | 'UNASSIGN';
    entityType: 'ROLE' | 'PERMISSION' | 'USER_ROLE';
    entityId: string;
    entityName?: string;
    userId: string;
    userName: string;
    changes?: Record<string, any>;
    reason?: string;
    ipAddress?: string;
    userAgent?: string;
    timestamp: string;
    metadata?: {
      previousState?: any;
      newState?: any;
      affectedUsers?: Array<{ userId: string; userName: string }>;
    };
  }> {
    return this.HttpClient.get<any>(`/roles/audit/${auditId}`);
  }
}