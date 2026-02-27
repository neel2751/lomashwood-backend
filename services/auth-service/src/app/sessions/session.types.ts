
export enum DeviceType {
  DESKTOP = 'desktop',
  MOBILE = 'mobile',
  TABLET = 'tablet',
  OTHER = 'other',
}


export enum SessionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
  INACTIVE = 'inactive',
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  refreshToken?: string | null;
  expiresAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
  deviceType?: DeviceType | null;
  deviceName?: string | null;
  location?: string | null;
  isActive: boolean;
  lastActivityAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  metadata?: Record<string, any> | null;
}

export interface CreateSessionDTO {
  userId: string;
  token: string;
  refreshToken?: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
  deviceType?: DeviceType;
  deviceName?: string;
  location?: string;
  metadata?: Record<string, any>;
}


export interface UpdateSessionDTO {
  expiresAt?: Date;
  isActive?: boolean;
  lastActivityAt?: Date;
  ipAddress?: string;
  userAgent?: string;
  deviceType?: DeviceType;
  deviceName?: string;
  location?: string;
  metadata?: Record<string, any>;
}


export interface SessionWithUser extends Session {
  user: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    role: string;
  };
}

export interface SessionListQuery {
  page?: number;
  limit?: number;
  isActive?: boolean;
  sortBy?: 'createdAt' | 'lastActivityAt' | 'expiresAt';
  sortOrder?: 'asc' | 'desc';
  userId?: string;
  deviceType?: DeviceType;
  startDate?: Date;
  endDate?: Date;
}


export interface PaginatedSessionResponse {
  sessions: Session[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SessionValidationResult {
  isValid: boolean;
  session?: Session;
  reason?: string;
  status?: SessionStatus;
}


export interface RefreshSessionDTO {
  refreshToken: string;
  extendBy?: number; 
}


export interface RefreshedSessionResponse {
  session: Session;
  token: string;
  refreshToken?: string;
  expiresAt: Date;
}


export interface RevokeSessionsOptions {
  exceptCurrentSession?: boolean;
  currentSessionId?: string;
  reason?: string;
}


export interface BulkRevokeResult {
  revokedCount: number;
  failedCount: number;
  sessionIds: string[];
}


export interface SessionCountResponse {
  userId?: string;
  activeCount: number;
  totalCount: number;
  expiredCount: number;
  revokedCount: number;
}


export interface SessionCleanupOptions {
  olderThan?: number; 
  includeExpired?: boolean;
  includeRevoked?: boolean;
  batchSize?: number;
}


export interface SessionCleanupResult {
  deletedCount: number;
  errors: Array<{
    sessionId: string;
    error: string;
  }>;
}

export interface SessionActivity {
  sessionId: string;
  userId: string;
  activityType: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}


export interface SessionSecurityContext {
  sessionId: string;
  userId: string;
  ipAddress?: string;
  userAgent?: string;
  deviceFingerprint?: string;
  isSecure: boolean;
  threats?: string[];
}


export interface SessionTokenPayload {
  sessionId: string;
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}


export interface RefreshTokenPayload {
  sessionId: string;
  userId: string;
  tokenVersion: number;
  iat: number;
  exp: number;
}


export interface ISessionRepository {
  create(data: CreateSessionDTO): Promise<Session>;
  findById(id: string): Promise<Session | null>;
  findByToken(token: string): Promise<Session | null>;
  findByUserId(userId: string, query?: SessionListQuery): Promise<PaginatedSessionResponse>;
  update(id: string, data: UpdateSessionDTO): Promise<Session>;
  delete(id: string): Promise<void>;
  revokeAllByUserId(userId: string, options?: RevokeSessionsOptions): Promise<BulkRevokeResult>;
  findExpiredSessions(): Promise<Session[]>;
  deleteExpiredSessions(olderThan?: Date): Promise<number>;
  countActiveSessions(userId?: string): Promise<SessionCountResponse>;
  updateLastActivity(id: string): Promise<void>;
  validateSession(id: string, token: string): Promise<SessionValidationResult>;
}


export interface ISessionService {
  createSession(data: CreateSessionDTO): Promise<Session>;
  getSessionById(id: string): Promise<Session>;
  getCurrentSession(sessionId: string): Promise<Session>;
  getSessionsByUserId(userId: string, query?: SessionListQuery): Promise<PaginatedSessionResponse>;
  updateSession(id: string, data: UpdateSessionDTO): Promise<Session>;
  deleteSession(id: string): Promise<void>;
  revokeAllUserSessions(userId: string, options?: RevokeSessionsOptions): Promise<BulkRevokeResult>;
  refreshSession(id: string, data: RefreshSessionDTO): Promise<RefreshedSessionResponse>;
  validateSession(id: string, token: string): Promise<SessionValidationResult>;
  getActiveSessionCount(userId?: string): Promise<SessionCountResponse>;
  cleanupInactiveSessions(options?: SessionCleanupOptions): Promise<SessionCleanupResult>;
  updateLastActivity(id: string): Promise<void>;
}

export interface ISessionMapper {
  toDTO(session: Session): SessionDTO;
  toEntity(dto: CreateSessionDTO): Partial<Session>;
  toResponse(session: Session): SessionResponse;
  toListResponse(sessions: Session[], pagination: any): PaginatedSessionResponse;
}


export interface SessionDTO {
  id: string;
  userId: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
  deviceType?: DeviceType;
  deviceName?: string;
  location?: string;
  isActive: boolean;
  lastActivityAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionResponse {
  id: string;
  userId: string;
  expiresAt: string; 
  ipAddress?: string;
  userAgent?: string;
  deviceType?: DeviceType;
  deviceName?: string;
  location?: string;
  isActive: boolean;
  lastActivityAt?: string; 
  createdAt: string; 
  updatedAt: string; 
}


export interface SessionListResponse {
  sessions: SessionResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export enum SessionErrorType {
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  SESSION_REVOKED = 'SESSION_REVOKED',
  SESSION_INACTIVE = 'SESSION_INACTIVE',
  INVALID_TOKEN = 'INVALID_TOKEN',
  INVALID_REFRESH_TOKEN = 'INVALID_REFRESH_TOKEN',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  SESSION_LIMIT_EXCEEDED = 'SESSION_LIMIT_EXCEEDED',
  INVALID_SESSION_DATA = 'INVALID_SESSION_DATA',
}

export class SessionError extends Error {
  constructor(
    public type: SessionErrorType,
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'SessionError';
    Object.setPrototypeOf(this, SessionError.prototype);
  }
}


export interface SessionConfig {
  accessTokenExpiration: number; 
  refreshTokenExpiration: number; 
  maxConcurrentSessions: number;
  sessionInactivityTimeout: number; 
  cleanupInterval: number; 
  extendSessionOnActivity: boolean;
  revokeOnPasswordChange: boolean;
  requireDeviceFingerprint: boolean;
}

export enum SessionEventType {
  SESSION_CREATED = 'session.created',
  SESSION_REFRESHED = 'session.refreshed',
  SESSION_REVOKED = 'session.revoked',
  SESSION_EXPIRED = 'session.expired',
  SESSION_ACTIVITY = 'session.activity',
  SESSION_DELETED = 'session.deleted',
  SESSIONS_BULK_REVOKED = 'sessions.bulk_revoked',
}

export interface SessionEventPayload {
  type: SessionEventType;
  sessionId: string;
  userId: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}


export const isValidSession = (session: any): session is Session => {
  return (
    session &&
    typeof session.id === 'string' &&
    typeof session.userId === 'string' &&
    typeof session.token === 'string' &&
    session.expiresAt instanceof Date
  );
};

export const isSessionExpired = (session: Session): boolean => {
  return new Date() > new Date(session.expiresAt);
};

export const isSessionActive = (session: Session): boolean => {
  return session.isActive && !isSessionExpired(session);
};