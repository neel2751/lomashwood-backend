import type { PaginationParams } from "./api.types";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  roleId: string;
  role: Role;
  avatar?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type Role = {
  id: string;
  name: string;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
};

export type Permission = {
  id: string;
  key: string;
  label: string;
  group: string;
};

export type Session = {
  id: string;
  userId: string;
  ip: string;
  userAgent: string;
  createdAt: string;
  expiresAt: string;
  isCurrentSession?: boolean;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

export type LoginCredentials = {
  email: string;
  password: string;
};

export type LoginResponse = AuthTokens & {
  user: AdminUser;
};

export type ResetPasswordPayload = {
  token: string;
  password: string;
  confirmPassword: string;
};

export type ForgotPasswordPayload = {
  email: string;
};

export type CreateUserPayload = {
  name: string;
  email: string;
  password: string;
  roleId: string;
  isActive?: boolean;
};

export type UpdateUserPayload = Partial<Omit<CreateUserPayload, "password">> & {
  avatar?: string;
};

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type CreateRolePayload = {
  name: string;
  permissions: string[];
};

export type UpdateRolePayload = Partial<CreateRolePayload>;

export type UserFilterParams = PaginationParams & {
  search?: string;
  roleId?: string;
  isActive?: boolean;
};

export type PermissionsMap = Record<string, string[]>;