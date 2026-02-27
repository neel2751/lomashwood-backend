import {
  User,
  Session,
  UserResponse,
  SessionResponse,
  AuthResponse,
  TokenPair,
  MeResponse,
  VerifyEmailResponse,
  ForgotPasswordResponse,
  ResetPasswordResponse,
  ChangePasswordResponse,
  RefreshTokenResponse,
  LogoutResponse,
  TwoFactorSetupResponse,
  TwoFactorVerifyResponse,
  TwoFactorDisableResponse,
  PaginatedResponse,
} from './auth.types';


export function toUserResponse(user: User): UserResponse {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    emailVerified: user.emailVerified,
    phoneVerified: user.phoneVerified,
    role: user.role,
    status: user.status,
    twoFactorEnabled: user.twoFactorEnabled,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}


export function toUserResponseArray(users: User[]): UserResponse[] {
  return users.map(toUserResponse);
}


export function toSessionResponse(session: Session): SessionResponse {
  return {
    id: session.id,
    userId: session.userId,
    userAgent: session.userAgent,
    ipAddress: session.ipAddress,
    device: session.device,
    location: session.location,
    expiresAt: session.expiresAt,
    lastActivityAt: session.lastActivityAt,
    createdAt: session.createdAt,
  };
}


export function toSessionResponseArray(sessions: Session[]): SessionResponse[] {
  return sessions.map(toSessionResponse);
}

export function toTokenPair(
  accessToken: string,
  refreshToken: string,
  expiresIn: number
): TokenPair {
  return {
    accessToken,
    refreshToken,
    expiresIn,
    tokenType: 'Bearer',
  };
}


export function toAuthResponse(
  user: User,
  session: Session,
  accessToken: string,
  refreshToken: string,
  expiresIn: number
): AuthResponse {
  return {
    user: toUserResponse(user),
    tokens: toTokenPair(accessToken, refreshToken, expiresIn),
    session: toSessionResponse(session),
  };
}

export function toVerifyEmailResponse(user: User): VerifyEmailResponse {
  return {
    success: true,
    message: 'Email verified successfully',
    user: toUserResponse(user),
  };
}


export function toForgotPasswordResponse(
  email: string
): ForgotPasswordResponse {
  return {
    success: true,
    message: `Password reset instructions have been sent to ${email}`,
  };
}


export function toResetPasswordResponse(): ResetPasswordResponse {
  return {
    success: true,
    message: 'Password has been reset successfully',
  };
}


export function toChangePasswordResponse(): ChangePasswordResponse {
  return {
    success: true,
    message: 'Password has been changed successfully',
  };
}


export function toRefreshTokenResponse(
  session: Session,
  accessToken: string,
  refreshToken: string,
  expiresIn: number
): RefreshTokenResponse {
  return {
    tokens: toTokenPair(accessToken, refreshToken, expiresIn),
    session: toSessionResponse(session),
  };
}


export function toLogoutResponse(allSessions: boolean = false): LogoutResponse {
  return {
    success: true,
    message: allSessions
      ? 'All sessions have been logged out successfully'
      : 'Logged out successfully',
  };
}


export function toTwoFactorSetupResponse(
  secret: string,
  qrCode: string,
  backupCodes: string[]
): TwoFactorSetupResponse {
  return {
    success: true,
    secret,
    qrCode,
    backupCodes,
  };
}


export function toTwoFactorVerifyResponse(): TwoFactorVerifyResponse {
  return {
    success: true,
    message: 'Two-factor authentication has been enabled successfully',
  };
}


export function toTwoFactorDisableResponse(): TwoFactorDisableResponse {
  return {
    success: true,
    message: 'Two-factor authentication has been disabled successfully',
  };
}


export function toMeResponse(user: User, sessions: Session[]): MeResponse {
  return {
    user: toUserResponse(user),
    sessions: toSessionResponseArray(sessions),
  };
}


export function toPaginatedUserResponse(
  users: User[],
  total: number,
  page: number,
  limit: number
): PaginatedResponse<UserResponse> {
  const totalPages = Math.ceil(total / limit);
  
  return {
    data: toUserResponseArray(users),
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}


export function toPaginatedSessionResponse(
  sessions: Session[],
  total: number,
  page: number,
  limit: number
): PaginatedResponse<SessionResponse> {
  const totalPages = Math.ceil(total / limit);
  
  return {
    data: toSessionResponseArray(sessions),
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}


export function sanitizeUser(user: User): Partial<User> {
  const { 
    twoFactorSecret,
    ...sanitizedUser 
  } = user;
  
  return sanitizedUser;
}


export function sanitizeSession(session: Session): Partial<Session> {
  const { 
    token,
    refreshToken,
    ...sanitizedSession 
  } = session;
  
  return sanitizedSession;
}


export function getUserFullName(user: User | UserResponse): string {
  return `${user.firstName} ${user.lastName}`.trim();
}


export function getUserInitials(user: User | UserResponse): string {
  const firstInitial = user.firstName.charAt(0).toUpperCase();
  const lastInitial = user.lastName.charAt(0).toUpperCase();
  return `${firstInitial}${lastInitial}`;
}



export function getRoleDisplayName(role: string): string {
  const roleMap: Record<string, string> = {
    CUSTOMER: 'Customer',
    ADMIN: 'Administrator',
    SUPER_ADMIN: 'Super Administrator',
    CONSULTANT: 'Consultant',
    SALES_MANAGER: 'Sales Manager',
    CONTENT_MANAGER: 'Content Manager',
  };
  
  return roleMap[role] || role;
}

export function getStatusDisplayName(status: string): string {
  const statusMap: Record<string, string> = {
    ACTIVE: 'Active',
    INACTIVE: 'Inactive',
    SUSPENDED: 'Suspended',
    PENDING_VERIFICATION: 'Pending Verification',
    LOCKED: 'Locked',
  };
  
  return statusMap[status] || status;
}

export function getSessionDeviceInfo(session: Session | SessionResponse): string {
  const parts: string[] = [];
  
  if (session.device) {
    parts.push(session.device);
  }
  
  if (session.ipAddress) {
    parts.push(session.ipAddress);
  }
  
  if (session.location) {
    parts.push(session.location);
  }
  
  return parts.join(' • ') || 'Unknown device';
}


export function formatLastActivity(lastActivityAt: Date): string {
  const now = new Date();
  const diff = now.getTime() - lastActivityAt.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
  
  if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  
  if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  }
  
  return 'Just now';
}


export function formatSessionExpiry(expiresAt: Date): string {
  const now = new Date();
  const diff = expiresAt.getTime() - now.getTime();
  
  if (diff <= 0) {
    return 'Expired';
  }
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `Expires in ${days} day${days > 1 ? 's' : ''}`;
  }
  
  if (hours > 0) {
    return `Expires in ${hours} hour${hours > 1 ? 's' : ''}`;
  }
  
  if (minutes > 0) {
    return `Expires in ${minutes} minute${minutes > 1 ? 's' : ''}`;
  }
  
  return 'Expires soon';
}


export function maskEmail(email: string): string {
  const atIndex = email.indexOf('@');

  if (atIndex === -1) {
    return email;
  }

  const localPart = email.slice(0, atIndex);
  const domain = email.slice(atIndex + 1);

  if (localPart.length <= 2) {
    return `${localPart[0] ?? ''}***@${domain}`;
  }

  return `${localPart[0]}${'*'.repeat(localPart.length - 1)}@${domain}`;
}


export function maskPhone(phone: string): string {
  if (!phone || phone.length < 4) {
    return phone;
  }
  
  const lastFour = phone.slice(-4);
  const masked = '*'.repeat(Math.max(0, phone.length - 4));
  
  return `${masked}${lastFour}`;
}


export function extractDeviceType(userAgent: string | null): string {
  if (!userAgent) {
    return 'Unknown';
  }
  
  const ua = userAgent.toLowerCase();
  
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return 'Mobile';
  }
  
  if (ua.includes('tablet') || ua.includes('ipad')) {
    return 'Tablet';
  }
  
  return 'Desktop';
}


export function extractBrowser(userAgent: string | null): string {
  if (!userAgent) {
    return 'Unknown';
  }
  
  const ua = userAgent.toLowerCase();
  
  if (ua.includes('firefox')) {
    return 'Firefox';
  }
  
  if (ua.includes('chrome') && !ua.includes('edge')) {
    return 'Chrome';
  }
  
  if (ua.includes('safari') && !ua.includes('chrome')) {
    return 'Safari';
  }
  
  if (ua.includes('edge')) {
    return 'Edge';
  }
  
  if (ua.includes('opera')) {
    return 'Opera';
  }
  
  return 'Unknown';
}


export function extractOS(userAgent: string | null): string {
  if (!userAgent) {
    return 'Unknown';
  }
  
  const ua = userAgent.toLowerCase();
  
  if (ua.includes('windows')) {
    return 'Windows';
  }
  
  if (ua.includes('mac')) {
    return 'macOS';
  }
  
  if (ua.includes('linux')) {
    return 'Linux';
  }
  
  if (ua.includes('android')) {
    return 'Android';
  }
  
  if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) {
    return 'iOS';
  }
  
  return 'Unknown';
}


export function createDeviceFingerprint(
  userAgent: string | null,
  ipAddress: string | null
): string {
  const deviceType = extractDeviceType(userAgent);
  const browser = extractBrowser(userAgent);
  const os = extractOS(userAgent);
  const ip = ipAddress || 'Unknown IP';
  
  return `${deviceType} - ${browser} on ${os} (${ip})`;
}


export function fromPrismaUser(prismaUser: any): User {
  return {
    id: prismaUser.id,
    email: prismaUser.email,
    firstName: prismaUser.firstName,
    lastName: prismaUser.lastName,
    phone: prismaUser.phone,
    emailVerified: prismaUser.emailVerified,
    phoneVerified: prismaUser.phoneVerified,
    role: prismaUser.role,
    status: prismaUser.status,
    lastLoginAt: prismaUser.lastLoginAt,
    lastLoginIp: prismaUser.lastLoginIp,
    passwordChangedAt: prismaUser.passwordChangedAt,
    twoFactorEnabled: prismaUser.twoFactorEnabled,
    twoFactorSecret: prismaUser.twoFactorSecret,
    failedLoginAttempts: prismaUser.failedLoginAttempts,
    lockedUntil: prismaUser.lockedUntil,
    metadata: prismaUser.metadata,
    createdAt: prismaUser.createdAt,
    updatedAt: prismaUser.updatedAt,
    deletedAt: prismaUser.deletedAt,
  };
}

export function fromPrismaSession(prismaSession: any): Session {
  return {
    id: prismaSession.id,
    userId: prismaSession.userId,
    token: prismaSession.token,
    refreshToken: prismaSession.refreshToken,
    userAgent: prismaSession.userAgent,
    ipAddress: prismaSession.ipAddress,
    device: prismaSession.device,
    location: prismaSession.location,
    expiresAt: prismaSession.expiresAt,
    lastActivityAt: prismaSession.lastActivityAt,
    isValid: prismaSession.isValid,
    createdAt: prismaSession.createdAt,
    updatedAt: prismaSession.updatedAt,
  };
}


export function fromPrismaUserArray(prismaUsers: any[]): User[] {
  return prismaUsers.map(fromPrismaUser);
}


export function fromPrismaSessionArray(prismaSessions: any[]): Session[] {
  return prismaSessions.map(fromPrismaSession);
}