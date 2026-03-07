import { HttpClient } from '../utils/http';
import {
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  AuthResponse,
  RefreshTokenRequest,
  User,
  Role,
  CreateRoleRequest,
  UpdateRoleRequest,
  Session,
} from '../types/auth.types';
import { PaginatedResponse } from '../types/api.types';

export class AuthService {
  private client: HttpClient;

  constructor(httpClient?: HttpClient) {
    this.client = httpClient || new HttpClient(process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || 'http://localhost:3001');
  }

  // Authentication endpoints
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    return this.client.post<AuthResponse>('/auth/login', credentials);
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    return this.client.post<AuthResponse>('/auth/register', userData);
  }

  async logout(): Promise<void> {
    return this.client.post<void>('/auth/logout');
  }

  async refreshToken(request: RefreshTokenRequest): Promise<AuthResponse> {
    return this.client.post<AuthResponse>('/auth/refresh', request);
  }

  async forgotPassword(request: ForgotPasswordRequest): Promise<void> {
    return this.client.post<void>('/auth/forgot-password', request);
  }

  async resetPassword(request: ResetPasswordRequest): Promise<void> {
    return this.client.post<void>('/auth/reset-password', request);
  }

  async changePassword(request: ChangePasswordRequest): Promise<void> {
    return this.client.post<void>('/auth/change-password', request);
  }

  async verifyEmail(token: string): Promise<void> {
    return this.client.post<void>('/auth/verify-email', { token });
  }

  async resendVerificationEmail(): Promise<void> {
    return this.client.post<void>('/auth/resend-verification');
  }

  // User management endpoints
  async getCurrentUser(): Promise<User> {
    return this.client.get<User>('/users/me');
  }

  async updateProfile(userData: Partial<User>): Promise<User> {
    return this.client.put<User>('/auth/profile', userData);
  }

  async getProfile(): Promise<User> {
    return this.client.get<User>('/auth/profile');
  }

  async uploadAvatar(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('avatar', file);
    return this.client.upload<{ url: string }>('/users/me/avatar', formData);
  }

  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    isActive?: boolean;
  }): Promise<PaginatedResponse<User>> {
    return this.client.get<PaginatedResponse<User>>('/users', params);
  }

  async getUserById(id: string): Promise<User> {
    return this.client.get<User>(`/users/${id}`);
  }

  async createUser(userData: RegisterRequest & { role?: string }): Promise<User> {
    return this.client.post<User>('/users', userData);
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    return this.client.put<User>(`/users/${id}`, userData);
  }

  async deleteUser(id: string): Promise<void> {
    return this.client.delete<void>(`/users/${id}`);
  }

  async toggleUserStatus(id: string): Promise<User> {
    return this.client.patch<User>(`/users/${id}/toggle-status`);
  }

  // Role management endpoints
  async getRoles(): Promise<Role[]> {
    return this.client.get<Role[]>('/roles');
  }

  async getRoleById(id: string): Promise<Role> {
    return this.client.get<Role>(`/roles/${id}`);
  }

  async createRole(roleData: CreateRoleRequest): Promise<Role> {
    return this.client.post<Role>('/roles', roleData);
  }

  async updateRole(id: string, roleData: UpdateRoleRequest): Promise<Role> {
    return this.client.put<Role>(`/roles/${id}`, roleData);
  }

  async deleteRole(id: string): Promise<void> {
    return this.client.delete<void>(`/roles/${id}`);
  }

  // Session management endpoints
  async getSessions(): Promise<Session[]> {
    return this.client.get<Session[]>('/sessions');
  }

  async revokeSession(sessionId: string): Promise<void> {
    return this.client.delete<void>(`/sessions/${sessionId}`);
  }

  async revokeAllSessions(): Promise<void> {
    return this.client.delete<void>('/sessions');
  }

  // Permission checking
  async hasPermission(permission: string): Promise<{ hasPermission: boolean }> {
    return this.client.get<{ hasPermission: boolean }>(`/auth/permissions/${permission}`);
  }

  async getPermissions(): Promise<string[]> {
    return this.client.get<string[]>('/auth/permissions');
  }

  // Additional helper methods
  async resendVerification(data: { email?: string }): Promise<void> {
    return this.client.post<void>('/auth/resend-verification', data);
  }

  async validateToken(data: { token: string }): Promise<{ valid: boolean; user?: User }> {
    return this.client.post<any>('/auth/validate-token', data);
  }
}

export const authService = new AuthService();
