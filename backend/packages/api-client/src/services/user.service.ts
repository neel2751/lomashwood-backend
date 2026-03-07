import { HttpClient } from '../utils/http';
import {
  PaginatedResponse,
} from '../types/api.types';
import {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UserFilters,
} from '../types/user.types';

export class UserService {
  constructor(private apiClient: HttpClient) {}

  // User Management
  async getUsers(params?: UserFilters & {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<User[]>> {
    return this.apiClient.get<PaginatedResponse<User[]>>('/users', { params });
  }

  async getUser(userId: string): Promise<User> {
    return this.apiClient.get<User>(`/users/${userId}`);
  }

  async getUserByEmail(email: string): Promise<User> {
    return this.apiClient.get<User>(`/users/email/${email}`);
  }

  async createUser(userData: CreateUserRequest): Promise<User> {
    return this.apiClient.post<User>('/users', userData);
  }

  async updateUser(userId: string, updateData: UpdateUserRequest): Promise<User> {
    return this.apiClient.put<User>(`/users/${userId}`, updateData);
  }

  async deleteUser(userId: string): Promise<void> {
    return this.apiClient.delete<void>(`/users/${userId}`);
  }

  async deactivateUser(userId: string, reason?: string): Promise<User> {
    return this.apiClient.post<User>(`/users/${userId}/deactivate`, { reason });
  }

  async activateUser(userId: string): Promise<User> {
    return this.apiClient.post<User>(`/users/${userId}/activate`);
  }

  // User Profile
  async getUserProfile(userId: string): Promise<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    avatar?: string;
    bio?: string;
    timezone: string;
    language: string;
    preferences: {
      theme: 'LIGHT' | 'DARK' | 'AUTO';
      notifications: {
        email: boolean;
        sms: boolean;
        push: boolean;
      };
      privacy: {
        showEmail: boolean;
        showPhone: boolean;
        showProfile: boolean;
      };
    };
    address?: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    socialLinks?: {
      linkedin?: string;
      twitter?: string;
      facebook?: string;
      instagram?: string;
    };
    verification: {
      email: boolean;
      phone: boolean;
      identity: boolean;
    };
    security: {
      twoFactorEnabled: boolean;
      lastPasswordChange?: string;
      loginAttempts: number;
      lastLogin?: string;
    };
    createdAt: string;
    updatedAt: string;
  }> {
    return this.apiClient.get<any>(`/users/${userId}/profile`);
  }

  async updateUserProfile(userId: string, profileData: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatar?: File;
    bio?: string;
    timezone?: string;
    language?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    socialLinks?: {
      linkedin?: string;
      twitter?: string;
      facebook?: string;
      instagram?: string;
    };
  }): Promise<any> {
    const formData = new FormData();

    Object.entries(profileData).forEach(([key, value]) => {
      if (value instanceof File) {
        formData.append(key, value);
      } else if (typeof value === 'object' && value !== null) {
        formData.append(key, JSON.stringify(value));
      } else if (value !== undefined) {
        formData.append(key, value);
      }
    });

    return this.apiClient.upload<any>(`/users/${userId}/profile`, formData);
  }

  async updateUserPreferences(userId: string, preferences: {
    theme?: 'LIGHT' | 'DARK' | 'AUTO';
    notifications?: {
      email?: boolean;
      sms?: boolean;
      push?: boolean;
    };
    privacy?: {
      showEmail?: boolean;
      showPhone?: boolean;
      showProfile?: boolean;
    };
  }): Promise<any> {
    return this.apiClient.put<any>(`/users/${userId}/preferences`, { preferences });
  }

  // User Security
  async changeUserPassword(userId: string, passwordData: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<void> {
    return this.apiClient.post<void>(`/users/${userId}/change-password`, passwordData);
  }

  async resetUserPassword(userId: string, resetData: {
    sendEmail?: boolean;
    temporaryPassword?: string;
    requirePasswordChange?: boolean;
  }): Promise<{
    passwordReset: boolean;
    temporaryPassword?: string;
    emailSent?: boolean;
    expiresAt?: string;
  }> {
    return this.apiClient.post<any>(`/users/${userId}/reset-password`, resetData);
  }

  async enableUserTwoFactor(userId: string): Promise<{
    secret: string;
    qrCode: string;
    backupCodes: string[];
  }> {
    return this.apiClient.post<any>(`/users/${userId}/2fa/enable`);
  }

  async verifyUserTwoFactor(userId: string, verificationData: {
    token: string;
    backupCode?: string;
  }): Promise<{
    verified: boolean;
    backupCodes?: string[];
  }> {
    return this.apiClient.post<any>(`/users/${userId}/2fa/verify`, verificationData);
  }

  async disableUserTwoFactor(userId: string, verificationData: {
    password: string;
    token?: string;
  }): Promise<void> {
    return this.apiClient.post<void>(`/users/${userId}/2fa/disable`, verificationData);
  }

  // User Verification
  async verifyUserEmail(userId: string, token: string): Promise<{
    verified: boolean;
    message: string;
  }> {
    return this.apiClient.post<any>(`/users/${userId}/verify-email`, { token });
  }

  async resendUserEmailVerification(userId: string): Promise<{
    sent: boolean;
    expiresAt?: string;
  }> {
    return this.apiClient.post<any>(`/users/${userId}/resend-verification`);
  }

  async verifyUserPhone(userId: string, verificationData: {
    code: string;
  }): Promise<{
    verified: boolean;
    message: string;
  }> {
    return this.apiClient.post<any>(`/users/${userId}/verify-phone`, verificationData);
  }

  async sendUserPhoneVerification(userId: string): Promise<{
    sent: boolean;
    expiresAt?: string;
  }> {
    return this.apiClient.post<any>(`/users/${userId}/send-phone-verification`);
  }

  // User Roles
  async getUserRoles(userId: string): Promise<Array<{
    id: string;
    roleId: string;
    roleName: string;
    grantedAt: string;
    grantedBy: string;
    expiresAt?: string;
    isActive: boolean;
  }>> {
    return this.apiClient.get<any[]>(`/users/${userId}/roles`);
  }

  async assignUserRole(userId: string, roleId: string, options?: {
    expiresAt?: string;
    reason?: string;
  }): Promise<void> {
    return this.apiClient.post<void>(`/users/${userId}/roles/${roleId}`, options);
  }

  async removeUserRole(userId: string, roleId: string): Promise<void> {
    return this.apiClient.delete<void>(`/users/${userId}/roles/${roleId}`);
  }

  async updateUserRole(userId: string, roleId: string, updateData: {
    expiresAt?: string;
    reason?: string;
  }): Promise<any> {
    return this.apiClient.put<any>(`/users/${userId}/roles/${roleId}`, updateData);
  }

  // User Sessions
  async getUserSessions(userId: string): Promise<Array<{
    id: string;
    userId: string;
    device: string;
    browser: string;
    os: string;
    ipAddress: string;
    location?: string;
    userAgent: string;
    isActive: boolean;
    lastActivity: string;
    createdAt: string;
    expiresAt?: string;
  }>> {
    return this.apiClient.get<any[]>(`/users/${userId}/sessions`);
  }

  async revokeUserSession(userId: string, sessionId: string): Promise<void> {
    return this.apiClient.delete<void>(`/users/${userId}/sessions/${sessionId}`);
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    return this.apiClient.post<void>(`/users/${userId}/sessions/revoke-all`);
  }

  // User Activity
  async getUserActivity(userId: string, params?: {
    page?: number;
    limit?: number;
    type?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResponse<Array<{
    id: string;
    userId: string;
    type: string;
    action: string;
    description?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: any;
    timestamp: string;
  }>>> {
    return this.apiClient.get<PaginatedResponse<any[]>>(`/users/${userId}/activity`, { params });
  }

  async getUserLoginHistory(userId: string, params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResponse<Array<{
    id: string;
    userId: string;
    loginTime: string;
    logoutTime?: string;
    ipAddress: string;
    device: string;
    browser: string;
    os: string;
    location?: string;
    userAgent: string;
    successful: boolean;
    failureReason?: string;
  }>>> {
    return this.apiClient.get<PaginatedResponse<any[]>>(`/users/${userId}/login-history`, { params });
  }

  // User Analytics
  async getUserAnalytics(userId: string, params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{
    userId: string;
    overview: {
      totalLogins: number;
      successfulLogins: number;
      failedLogins: number;
      averageSessionDuration: number;
      lastLogin: string;
      accountAge: number;
    };
    activity: {
      dailyStats: Array<{
        date: string;
        logins: number;
        sessionDuration: number;
        actions: number;
      }>;
      topActions: Array<{
        action: string;
        count: number;
        lastPerformed: string;
      }>;
      deviceUsage: Array<{
        device: string;
        count: number;
        percentage: number;
      }>;
      locationUsage: Array<{
        location: string;
        count: number;
        percentage: number;
      }>;
    };
    security: {
      loginAttempts: number;
      failedAttempts: number;
      passwordChanges: number;
      twoFactorUsage: number;
      securityEvents: Array<{
        type: string;
        count: number;
        lastOccurred: string;
      }>;
    };
    engagement: {
      totalActions: number;
      averageActionsPerSession: number;
      mostActiveDay: string;
      peakHours: Array<{
        hour: number;
        activity: number;
      }>;
    };
  }> {
    return this.apiClient.get<any>(`/users/${userId}/analytics`, { params });
  }

  // User Search
  async searchUsers(query: string, params?: {
    page?: number;
    limit?: number;
    role?: string;
    status?: string;
  }): Promise<PaginatedResponse<User[]>> {
    return this.apiClient.get<PaginatedResponse<User[]>>('/users/search', {
      params: { q: query, ...params },
    });
  }

  // User Bulk Operations
  async bulkCreateUsers(usersData: CreateUserRequest[]): Promise<{
    created: User[];
    errors: Array<{
      index: number;
      error: string;
      data: any;
    }>;
  }> {
    return this.apiClient.post<any>('/users/bulk-create', { users: usersData });
  }

  async bulkUpdateUsers(updates: Array<{
    userId: string;
    updateData: UpdateUserRequest;
  }>): Promise<{
    updated: Array<{
      userId: string;
      success: boolean;
      error?: string;
    }>;
  }> {
    return this.apiClient.put<any>('/users/bulk-update', { updates });
  }

  async bulkDeleteUsers(userIds: string[]): Promise<{
    deleted: string[];
    errors: Array<{
      userId: string;
      error: string;
    }>;
  }> {
    return this.apiClient.post<any>('/users/bulk-delete', { userIds });
  }

  async bulkAssignRoles(assignments: Array<{
    userId: string;
    roleId: string;
    expiresAt?: string;
  }>): Promise<{
    assigned: Array<{
      userId: string;
      roleId: string;
      success: boolean;
      error?: string;
    }>;
  }> {
    return this.apiClient.post<any>('/users/bulk-assign-roles', { assignments });
  }

  // User Import/Export
  async exportUsers(params?: {
    format?: 'CSV' | 'EXCEL' | 'JSON';
    userIds?: string[];
    includeProfile?: boolean;
    includeRoles?: boolean;
    includeActivity?: boolean;
  }): Promise<Blob> {
    return this.apiClient.getBlob('/users/export', params);
  }

  async importUsers(file: File, options?: {
    overwrite?: boolean;
    createMissing?: boolean;
    validateEmails?: boolean;
    assignRoles?: boolean;
    sendWelcomeEmail?: boolean;
  }): Promise<{
    imported: number;
    updated: number;
    skipped: number;
    errors: Array<{
      row: number;
      error: string;
      data: any;
    }>;
  }> {
    const formData = new FormData();
    formData.append('file', file);

    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        formData.append(key, value.toString());
      });
    }

    return this.apiClient.upload<any>('/users/import', formData);
  }

  // User Validation
  async validateUser(userData: CreateUserRequest): Promise<{
    valid: boolean;
    errors?: Array<{
      field: string;
      message: string;
      type: 'ERROR' | 'WARNING';
    }>;
    warnings?: Array<{
      field: string;
      message: string;
      type: 'ERROR' | 'WARNING';
    }>;
    suggestions?: Array<{
      field: string;
      message: string;
      improvement: string;
    }>;
    duplicates?: Array<{
      field: string;
      value: string;
      existingUserId?: string;
    }>;
  }> {
    return this.apiClient.post<any>('/users/validate', userData);
  }

  // User Settings
  async getUserSettings(): Promise<{
    general: {
      defaultLanguage: string;
      defaultTimezone: string;
      allowUserRegistration: boolean;
      requireEmailVerification: boolean;
      requirePhoneVerification: boolean;
      enableTwoFactor: boolean;
    };
    security: {
      passwordPolicy: {
        minLength: number;
        requireUppercase: boolean;
        requireLowercase: boolean;
        requireNumbers: boolean;
        requireSpecialChars: boolean;
        preventReuse: number;
      };
      sessionTimeout: number;
      maxLoginAttempts: number;
      lockoutDuration: number;
    };
    profile: {
      allowAvatarUpload: boolean;
      maxAvatarSize: number;
      allowedAvatarTypes: string[];
      requiredFields: string[];
      optionalFields: string[];
    };
    notifications: {
      enableWelcomeEmail: boolean;
      enableEmailVerification: boolean;
      enablePasswordResetEmail: boolean;
      enableAccountLockoutEmail: boolean;
    };
  }> {
    return this.apiClient.get<any>('/users/settings');
  }

  async updateUserSettings(settings: {
    general?: {
      defaultLanguage?: string;
      defaultTimezone?: string;
      allowUserRegistration?: boolean;
      requireEmailVerification?: boolean;
      requirePhoneVerification?: boolean;
      enableTwoFactor?: boolean;
    };
    security?: {
      passwordPolicy?: {
        minLength?: number;
        requireUppercase?: boolean;
        requireLowercase?: boolean;
        requireNumbers?: boolean;
        requireSpecialChars?: boolean;
        preventReuse?: number;
      };
      sessionTimeout?: number;
      maxLoginAttempts?: number;
      lockoutDuration?: number;
    };
    profile?: {
      allowAvatarUpload?: boolean;
      maxAvatarSize?: number;
      allowedAvatarTypes?: string[];
      requiredFields?: string[];
      optionalFields?: string[];
    };
    notifications?: {
      enableWelcomeEmail?: boolean;
      enableEmailVerification?: boolean;
      enablePasswordResetEmail?: boolean;
      enableAccountLockoutEmail?: boolean;
    };
  }): Promise<any> {
    return this.apiClient.put<any>('/users/settings', settings);
  }
}