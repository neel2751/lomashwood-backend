import { z } from 'zod';
import { AuthSchemas } from './auth.schemas';


export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  role: UserRole;
  status: UserStatus;
  lastLoginAt: Date | null;
  lastLoginIp: string | null;
  passwordChangedAt: Date | null;
  twoFactorEnabled: boolean;
  twoFactorSecret: string | null;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

// User Role Enum
export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
  CONSULTANT = 'CONSULTANT',
  SALES_MANAGER = 'SALES_MANAGER',
  CONTENT_MANAGER = 'CONTENT_MANAGER',
}

// User Status Enum
export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  LOCKED = 'LOCKED',
}

// Session Type
export interface Session {
  id: string;
  userId: string;
  token: string;
  refreshToken: string;
  userAgent: string | null;
  ipAddress: string | null;
  device: string | null;
  location: string | null;
  expiresAt: Date;
  lastActivityAt: Date;
  isValid: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Password Reset Token Type
export interface PasswordResetToken {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  isUsed: boolean;
  usedAt: Date | null;
  createdAt: Date;
}

// Email Verification Token Type
export interface EmailVerificationToken {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  isUsed: boolean;
  usedAt: Date | null;
  createdAt: Date;
}

// OTP Type
export interface OTP {
  id: string;
  userId: string;
  code: string;
  type: OTPType;
  expiresAt: Date;
  isUsed: boolean;
  usedAt: Date | null;
  attempts: number;
  createdAt: Date;
}

// OTP Type Enum
export enum OTPType {
  TWO_FACTOR = 'TWO_FACTOR',
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
  PHONE_VERIFICATION = 'PHONE_VERIFICATION',
  PASSWORD_RESET = 'PASSWORD_RESET',
}

// ============================================================================
// REQUEST TYPES
// ============================================================================

// Register Request
export type RegisterRequest = z.infer<typeof AuthSchemas.Register>;

// Login Request
export type LoginRequest = z.infer<typeof AuthSchemas.Login>;

// Verify Email Request
export type VerifyEmailRequest = z.infer<typeof AuthSchemas.VerifyEmail>;

// Resend Verification Request
export type ResendVerificationRequest = z.infer<typeof AuthSchemas.ResendVerification>;

// Forgot Password Request
export type ForgotPasswordRequest = z.infer<typeof AuthSchemas.ForgotPassword>;

// Reset Password Request
export type ResetPasswordRequest = z.infer<typeof AuthSchemas.ResetPassword>;

// Change Password Request
export type ChangePasswordRequest = z.infer<typeof AuthSchemas.ChangePassword>;

// Refresh Token Request
export type RefreshTokenRequest = z.infer<typeof AuthSchemas.RefreshToken>;

// Update Profile Request
export type UpdateProfileRequest = z.infer<typeof AuthSchemas.UpdateProfile>;

// Two Factor Setup Request (maps to EnableTwoFactor in schemas)
export type TwoFactorSetupRequest = z.infer<typeof AuthSchemas.EnableTwoFactor>;

// Two Factor Verify Request
export type TwoFactorVerifyRequest = z.infer<typeof AuthSchemas.VerifyTwoFactor>;

// Social Auth Request
export type SocialAuthRequest = z.infer<typeof AuthSchemas.SocialAuth>;

// Delete Account Request
export type DeleteAccountRequest = z.infer<typeof AuthSchemas.DeleteAccount>;

// ============================================================================
// RESPONSE TYPES
// ============================================================================

// Auth Response (with tokens)
export interface AuthResponse {
  user: UserResponse;
  tokens: TokenPair;
  session: SessionResponse;
}

// User Response (safe user data without sensitive fields)
export interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  role: UserRole;
  status: UserStatus;
  twoFactorEnabled: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Token Pair
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

// Session Response
export interface SessionResponse {
  id: string;
  userId: string;
  userAgent: string | null;
  ipAddress: string | null;
  device: string | null;
  location: string | null;
  expiresAt: Date;
  lastActivityAt: Date;
  createdAt: Date;
}

// Verify Email Response
export interface VerifyEmailResponse {
  success: boolean;
  message: string;
  user: UserResponse;
}

// Forgot Password Response
export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

// Reset Password Response
export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

// Change Password Response
export interface ChangePasswordResponse {
  success: boolean;
  message: string;
}

// Refresh Token Response
export interface RefreshTokenResponse {
  tokens: TokenPair;
  session: SessionResponse;
}

// Logout Response
export interface LogoutResponse {
  success: boolean;
  message: string;
}

// Two Factor Setup Response
export interface TwoFactorSetupResponse {
  success: boolean;
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

// Two Factor Verify Response
export interface TwoFactorVerifyResponse {
  success: boolean;
  message: string;
}

// Two Factor Disable Response
export interface TwoFactorDisableResponse {
  success: boolean;
  message: string;
}

// Me Response
export interface MeResponse {
  user: UserResponse;
  sessions: SessionResponse[];
}

// ============================================================================
// JWT PAYLOAD TYPES
// ============================================================================

// JWT Access Token Payload
export interface JWTAccessPayload {
  sub: string; // user id
  email: string;
  role: UserRole;
  sessionId: string;
  type: 'access';
  iat: number;
  exp: number;
}

// JWT Refresh Token Payload
export interface JWTRefreshPayload {
  sub: string; // user id
  sessionId: string;
  type: 'refresh';
  iat: number;
  exp: number;
}

// JWT Verification Token Payload
export interface JWTVerificationPayload {
  sub: string; // user id
  email: string;
  type: 'email_verification' | 'password_reset';
  iat: number;
  exp: number;
}

// ============================================================================
// SERVICE TYPES
// ============================================================================

// Register Service Input
export interface RegisterServiceInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: UserRole;
  ipAddress?: string;
  userAgent?: string;
}

// Login Service Input
export interface LoginServiceInput {
  email: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
  device?: string;
  location?: string;
}

// Verify Email Service Input
export interface VerifyEmailServiceInput {
  token: string;
}

// Forgot Password Service Input
export interface ForgotPasswordServiceInput {
  email: string;
}

// Reset Password Service Input
export interface ResetPasswordServiceInput {
  token: string;
  newPassword: string;
}

// Change Password Service Input
export interface ChangePasswordServiceInput {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

// Refresh Token Service Input
export interface RefreshTokenServiceInput {
  refreshToken: string;
  ipAddress?: string;
  userAgent?: string;
}

// Logout Service Input
export interface LogoutServiceInput {
  userId: string;
  sessionId?: string;
  allSessions?: boolean;
}

// Two Factor Setup Service Input
export interface TwoFactorSetupServiceInput {
  userId: string;
}

// Two Factor Verify Service Input
export interface TwoFactorVerifyServiceInput {
  userId: string;
  code: string;
}

// Two Factor Disable Service Input
export interface TwoFactorDisableServiceInput {
  userId: string;
  password: string;
}

// ============================================================================
// INTERNAL TYPES
// ============================================================================

// Password Hash Result
export interface PasswordHashResult {
  hash: string;
  salt: string;
}

// Password Validation Result
export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

// Token Generation Options
export interface TokenGenerationOptions {
  userId: string;
  email: string;
  role: UserRole;
  sessionId: string;
  expiresIn?: number;
}

// Session Creation Options
export interface SessionCreationOptions {
  userId: string;
  ipAddress?: string;
  userAgent?: string;
  device?: string;
  location?: string;
  expiresIn?: number;
}

// User Creation Options
export interface UserCreationOptions {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: UserRole;
  status?: UserStatus;
  emailVerified?: boolean;
  metadata?: Record<string, unknown>;
}

// User Update Options
export interface UserUpdateOptions {
  firstName?: string;
  lastName?: string;
  phone?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  role?: UserRole;
  status?: UserStatus;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
  lastLoginAt?: Date;
  lastLoginIp?: string;
  passwordChangedAt?: Date;
  failedLoginAttempts?: number;
  lockedUntil?: Date;
  metadata?: Record<string, unknown>;
}

// Account Lock Options
export interface AccountLockOptions {
  userId: string;
  lockDuration: number; // in minutes
  reason?: string;
}

// ============================================================================
// FILTER & QUERY TYPES
// ============================================================================

// User Filter
export interface UserFilter {
  id?: string;
  email?: string;
  role?: UserRole;
  status?: UserStatus;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  twoFactorEnabled?: boolean;
  search?: string;
  createdFrom?: Date;
  createdTo?: Date;
}

// Session Filter
export interface SessionFilter {
  userId?: string;
  isValid?: boolean;
  ipAddress?: string;
  device?: string;
  expiresAfter?: Date;
  expiresBefore?: Date;
}

// Pagination Options
export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Paginated Response
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ============================================================================
// EVENT TYPES
// ============================================================================

// User Event Types
export enum UserEventType {
  USER_REGISTERED = 'USER_REGISTERED',
  USER_LOGGED_IN = 'USER_LOGGED_IN',
  USER_LOGGED_OUT = 'USER_LOGGED_OUT',
  USER_EMAIL_VERIFIED = 'USER_EMAIL_VERIFIED',
  USER_PASSWORD_CHANGED = 'USER_PASSWORD_CHANGED',
  USER_PASSWORD_RESET = 'USER_PASSWORD_RESET',
  USER_TWO_FACTOR_ENABLED = 'USER_TWO_FACTOR_ENABLED',
  USER_TWO_FACTOR_DISABLED = 'USER_TWO_FACTOR_DISABLED',
  USER_ACCOUNT_LOCKED = 'USER_ACCOUNT_LOCKED',
  USER_ACCOUNT_UNLOCKED = 'USER_ACCOUNT_UNLOCKED',
  USER_DELETED = 'USER_DELETED',
}

// User Event Payload
export interface UserEventPayload {
  eventType: UserEventType;
  userId: string;
  email: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

// Auth Error Codes
export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_SUSPENDED = 'ACCOUNT_SUSPENDED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  EXPIRED_TOKEN = 'EXPIRED_TOKEN',
  TOKEN_NOT_FOUND = 'TOKEN_NOT_FOUND',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  SESSION_INVALID = 'SESSION_INVALID',
  WEAK_PASSWORD = 'WEAK_PASSWORD',
  PASSWORD_MISMATCH = 'PASSWORD_MISMATCH',
  TOO_MANY_ATTEMPTS = 'TOO_MANY_ATTEMPTS',
  TWO_FACTOR_REQUIRED = 'TWO_FACTOR_REQUIRED',
  INVALID_TWO_FACTOR_CODE = 'INVALID_TWO_FACTOR_CODE',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
}

// Auth Error
export interface AuthError {
  code: AuthErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Token Expiry Times (in seconds)
export const TOKEN_EXPIRY = {
  ACCESS_TOKEN: 15 * 60, // 15 minutes
  REFRESH_TOKEN: 7 * 24 * 60 * 60, // 7 days
  EMAIL_VERIFICATION: 24 * 60 * 60, // 24 hours
  PASSWORD_RESET: 60 * 60, // 1 hour
  TWO_FACTOR_CODE: 5 * 60, // 5 minutes
} as const;

// Account Lock Configuration
export const ACCOUNT_LOCK = {
  MAX_FAILED_ATTEMPTS: 5,
  LOCK_DURATION: 30, // minutes
} as const;

// Password Requirements
export const PASSWORD_REQUIREMENTS = {
  MIN_LENGTH: 8,
  MAX_LENGTH: 128,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBER: true,
  REQUIRE_SPECIAL_CHAR: true,
} as const;

// ============================================================================
// TYPE GUARDS
// ============================================================================

// Check if user is admin
export function isAdmin(user: User | UserResponse): boolean {
  return user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;
}

// Check if user is customer
export function isCustomer(user: User | UserResponse): boolean {
  return user.role === UserRole.CUSTOMER;
}

// Check if user is consultant
export function isConsultant(user: User | UserResponse): boolean {
  return user.role === UserRole.CONSULTANT;
}

// Check if user is active
export function isActiveUser(user: User | UserResponse): boolean {
  return user.status === UserStatus.ACTIVE;
}

// Check if user is locked
export function isLockedUser(user: User): boolean {
  return user.status === UserStatus.LOCKED || (user.lockedUntil !== null && user.lockedUntil > new Date());
}

// Check if user has verified email
export function hasVerifiedEmail(user: User | UserResponse): boolean {
  return user.emailVerified;
}

// Check if token is expired
export function isTokenExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}