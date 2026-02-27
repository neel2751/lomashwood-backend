import { Request } from 'express';
import { Role, Permission, UserStatus, TokenType, LoginMethod, OAuthProvider } from './constants';

export interface User {
  id: string;
  email: string;
  password?: string;
  name: string;
  phone?: string;
  role: Role;
  status: UserStatus;
  emailVerified: boolean;
  emailVerifiedAt?: Date;
  lastLoginAt?: Date;
  lastLoginIp?: string;
  failedLoginAttempts: number;
  lockedUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  refreshToken?: string;
  deviceId?: string;
  userAgent?: string;
  ipAddress?: string;
  expiresAt: Date;
  lastActivityAt: Date;
  createdAt: Date;
  isActive: boolean;
}

export interface RoleEntity {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: Role;
  sessionId?: string;
  type: TokenType;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  userId: string;
  sessionId: string;
  tokenVersion: number;
}

export interface PasswordResetToken {
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  usedAt?: Date;
}

export interface EmailVerificationToken {
  userId: string;
  token: string;
  email: string;
  expiresAt: Date;
  createdAt: Date;
  verifiedAt?: Date;
}

export interface OTPRecord {
  id: string;
  userId: string;
  otp: string;
  purpose: 'login' | 'verification' | 'password_reset';
  expiresAt: Date;
  attempts: number;
  verifiedAt?: Date;
  createdAt: Date;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  permissions: Permission[];
  sessionId: string;
  emailVerified: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  deviceId?: string;
  rememberMe?: boolean;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
  phone?: string;
  acceptTerms: boolean;
}

export interface OAuthCredentials {
  provider: OAuthProvider;
  accessToken: string;
  idToken?: string;
  deviceId?: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  metadata?: Record<string, unknown>;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: Role;
    emailVerified: boolean;
  };
  tokens: AuthTokens;
  session: {
    id: string;
    expiresAt: Date;
  };
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
  session?: Session;
  deviceId?: string;
  ipAddress?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  changes?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failure';
  errorMessage?: string;
  createdAt: Date;
}

export interface RateLimitInfo {
  key: string;
  attempts: number;
  resetAt: Date;
  blockedUntil?: Date;
}

export interface SessionInfo {
  id: string;
  deviceId?: string;
  userAgent?: string;
  ipAddress?: string;
  lastActivityAt: Date;
  expiresAt: Date;
  isCurrent: boolean;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  allowedLoginMethods: LoginMethod[];
  sessionTimeout: number;
  maxActiveSessions: number;
  requireEmailVerification: boolean;
  passwordExpiryDays?: number;
}

export interface UserPreferences {
  userId: string;
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private';
    showEmail: boolean;
    showPhone: boolean;
  };
}

export interface DeviceInfo {
  deviceId: string;
  deviceName?: string;
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  os?: string;
  browser?: string;
  lastUsedAt: Date;
  trusted: boolean;
}

export interface LoginHistory {
  id: string;
  userId: string;
  loginMethod: LoginMethod;
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
  status: 'success' | 'failure';
  failureReason?: string;
  createdAt: Date;
}

export interface PermissionCheck {
  resource: string;
  action: string;
  userId: string;
  role: Role;
}

export interface RolePermissions {
  role: Role;
  permissions: Permission[];
  inheritedFrom?: Role[];
}

export interface JWTVerifyResult {
  valid: boolean;
  payload?: TokenPayload;
  error?: string;
  expired?: boolean;
}

export interface CacheOptions {
  ttl?: number;
  key: string;
  namespace?: string;
}

export interface ServiceHealth {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  details?: {
    database?: boolean;
    cache?: boolean;
    messaging?: boolean;
  };
  uptime?: number;
  version?: string;
}

export interface ErrorDetails {
  code: string;
  message: string;
  field?: string;
  value?: unknown;
  constraint?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors?: ErrorDetails[];
}

export interface RepositoryOptions {
  transaction?: unknown;
  skipCache?: boolean;
}

export interface QueryFilters {
  search?: string;
  status?: UserStatus;
  role?: Role;
  emailVerified?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface BulkOperationResult {
  success: number;
  failed: number;
  total: number;
  errors?: Array<{
    id: string;
    error: string;
  }>;
}

export type CreateUserDTO = Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>;
export type UpdateUserDTO = Partial<Omit<User, 'id' | 'email' | 'createdAt' | 'updatedAt' | 'deletedAt'>>;
export type CreateSessionDTO = Omit<Session, 'id' | 'createdAt'>;
export type CreateRoleDTO = Omit<RoleEntity, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateRoleDTO = Partial<Omit<RoleEntity, 'id' | 'name' | 'createdAt' | 'updatedAt'>>;