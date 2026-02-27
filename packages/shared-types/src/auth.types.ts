export type UserRole = 'ADMIN' | 'EDITOR' | 'STAFF' | 'USER' | 'GUEST';

export type AuthProvider = 'EMAIL' | 'GOOGLE' | 'FACEBOOK';

export type TokenType = 'ACCESS' | 'REFRESH' | 'RESET_PASSWORD' | 'EMAIL_VERIFY' | 'INVITE';

export type SessionStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED';

export type AccountStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION' | 'DELETED';

export interface JwtPayload {
  readonly sub: string;
  readonly role: UserRole;
  readonly sessionId: string;
  readonly iat: number;
  readonly exp: number;
  readonly iss: string;
  readonly aud: string;
}

export interface AuthUser {
  readonly id: string;
  readonly email: string;
  readonly role: UserRole;
  readonly status: AccountStatus;
  readonly sessionId: string;
  readonly firstName: string | null;
  readonly lastName: string | null;
  readonly emailVerified: boolean;
}

export interface RegisterPayload {
  readonly email: string;
  readonly password: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly phone?: string | undefined;
  readonly role?: UserRole | undefined;
}

export interface LoginPayload {
  readonly email: string;
  readonly password: string;
  readonly rememberMe?: boolean | undefined;
}

export interface AuthTokenPair {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresIn: number;
  readonly tokenType: 'Bearer';
}

export interface RefreshTokenPayload {
  readonly refreshToken: string;
}

export interface PasswordResetRequestPayload {
  readonly email: string;
}

export interface PasswordResetConfirmPayload {
  readonly token: string;
  readonly newPassword: string;
}

export interface ChangePasswordPayload {
  readonly currentPassword: string;
  readonly newPassword: string;
}

export interface Session {
  readonly id: string;
  readonly userId: string;
  readonly status: SessionStatus;
  readonly userAgent: string | null;
  readonly ipAddress: string | null;
  readonly lastActiveAt: Date;
  readonly expiresAt: Date;
  readonly createdAt: Date;
}

export interface Role {
  readonly id: string;
  readonly name: UserRole;
  readonly permissions: readonly string[];
  readonly description: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface OtpPayload {
  readonly userId: string;
  readonly code: string;
  readonly type: TokenType;
  readonly expiresAt: Date;
}

export interface TokenBlacklistEntry {
  readonly jti: string;
  readonly expiresAt: Date;
  readonly revokedAt: Date;
  readonly reason: string | null;
}

export interface AuthEventPayload {
  readonly userId: string;
  readonly email: string;
  readonly role: UserRole;
  readonly sessionId: string;
  readonly ipAddress: string | null;
  readonly userAgent: string | null;
  readonly timestamp: Date;
}

export interface PasswordResetEventPayload {
  readonly userId: string;
  readonly email: string;
  readonly token: string;
  readonly expiresAt: Date;
  readonly requestedAt: Date;
}

export interface RoleUpdatedEventPayload {
  readonly userId: string;
  readonly previousRole: UserRole;
  readonly newRole: UserRole;
  readonly updatedBy: string;
  readonly updatedAt: Date;
}