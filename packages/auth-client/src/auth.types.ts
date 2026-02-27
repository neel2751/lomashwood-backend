export type UserRole = "ADMIN" | "STAFF" | "CUSTOMER";

export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION";

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatar: string | null;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  createdAt: string;
  ipAddress: string | null;
  userAgent: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: "Bearer";
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RefreshTokenPayload {
  refreshToken: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface VerifyEmailPayload {
  token: string;
}

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  avatar?: string | null;
}

export interface AuthResponse {
  user: AuthUser;
  tokens: AuthTokens;
  session: AuthSession;
}

export interface LoginResponse extends AuthResponse {}

export interface RegisterResponse {
  user: AuthUser;
  message: string;
}

export interface RefreshTokenResponse {
  tokens: AuthTokens;
}

export interface LogoutResponse {
  message: string;
}

export interface MeResponse {
  user: AuthUser;
  session: AuthSession;
}

export interface VerifyEmailResponse {
  message: string;
  user: AuthUser;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export interface ChangePasswordResponse {
  message: string;
}

export interface UpdateProfileResponse {
  user: AuthUser;
}

export interface AuthClientConfig {
  baseUrl: string;
  timeout?: number;
  withCredentials?: boolean;
  onTokenRefresh?: (tokens: AuthTokens) => void;
  onUnauthorized?: () => void;
  getAccessToken?: () => string | null;
  getRefreshToken?: () => string | null;
  setTokens?: (tokens: AuthTokens) => void;
  clearTokens?: () => void;
}

export interface SessionValidationResult {
  valid: boolean;
  user?: AuthUser;
  session?: AuthSession;
  reason?: string;
}

export interface RolePermission {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AssignRolePayload {
  userId: string;
  roleId: string;
}