import crypto from 'crypto';
import { SessionRepository } from './session.repository';
import { SESSION_CONSTANTS } from './session.constants';
import {
  SessionNotFoundError,
  SessionExpiredError,
  AuthenticationError,
} from '../../shared/errors';
import { logger } from '../../config/logger';
import { redisClient } from '../../infrastructure/cache/redis.client';


const generateToken = (byteLength: number): string =>
  crypto.randomBytes(byteLength).toString('hex');



interface Session {
  id: string;
  userId: string;
  token: string;
  refreshToken: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  device?: string | null;
  location?: string | null;
  expiresAt: Date;
  lastActivityAt?: Date | null;
  isValid: boolean;
  createdAt: Date;
  updatedAt: Date;
}


interface SessionCreationOptions {
  userId: string;
  userAgent?: string;
  ipAddress?: string;
  device?: string;
  location?: string;
  expiresIn?: number; 
}

interface PaginatedResult<T> {
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

interface ActiveDevice {
  sessionId: string;
  device: string;
  browser: string;
  os: string;
  ipAddress: string;
  location: string;
  lastActivityAt?: Date | null;
  createdAt: Date;
  isCurrent: boolean;
}

interface SessionStatistics {
  totalSessions: number;
  activeSessions: number;
  expiredSessions: number;
  revokedSessions: number;
  deviceBreakdown: Record<string, number>;
  locationBreakdown: Record<string, number>;
  oldestActiveSession: Date | null;
  newestActiveSession: Date | null;
}


interface SessionFilter {
  isValid?: boolean;
  includeExpired?: boolean;
  ipAddress?: string;
  device?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface IEventProducer {
  publish(topic: string, payload: Record<string, unknown>): Promise<void>;
}


const CacheKey = {
  session: (id: string) => `${SESSION_CONSTANTS.CACHE.SESSION_CACHE_PREFIX}${id}`,
};


type IRedisClient = Pick<typeof redisClient, 'set' | 'get' | 'del'>;

export class SessionService {
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly eventProducer: IEventProducer,
    private readonly redis: IRedisClient
  ) {}

  async createSession(options: SessionCreationOptions): Promise<Session> {
    logger.info(`Creating new session for user ${options.userId}`);

    
    const activeSessionsCount = await this.sessionRepository.countActiveSessions(options.userId);

    
    if (activeSessionsCount >= SESSION_CONSTANTS.SESSION.MAX_CONCURRENT_SESSIONS) {
      logger.warn(`User ${options.userId} reached max sessions (${activeSessionsCount})`);
      await this.revokeOldestSession(options.userId);
    }

    const token = generateToken(32);
    const refreshToken = generateToken(64);
    const expiresIn = options.expiresIn ?? SESSION_CONSTANTS.TOKEN.REFRESH_TOKEN_EXPIRATION;
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    
    const session = await this.sessionRepository.create({
      userId: options.userId,
      token,
      refreshToken,
      userAgent: options.userAgent ?? null,
      ipAddress: options.ipAddress ?? null,
      device: options.device ?? null,
      location: options.location ?? null,
      expiresAt,
      lastActivityAt: new Date(),
      isValid: true,
    });

    await this.cacheSession(session);

    await this.eventProducer.publish(SESSION_CONSTANTS.EVENTS.SESSION_CREATED, {
      sessionId: session.id,
      userId: session.userId,
      device: session.device,
      ipAddress: session.ipAddress,
      location: session.location,
      createdAt: session.createdAt,
    });

    logger.info(`Session ${session.id} created for user ${session.userId}`);
    return session;
  }

  async getSessionById(sessionId: string): Promise<Session | null> {
    logger.debug(`Fetching session ${sessionId}`);

    const cached = await this.getCachedSession(sessionId);
    if (cached) {
      logger.debug(`Session ${sessionId} found in cache`);
      return cached;
    }

    const session = await this.sessionRepository.findById(sessionId);
    if (!session) {
      logger.debug(`Session ${sessionId} not found`);
      return null;
    }

    await this.cacheSession(session);
    return session;
  }

  async getSessionByToken(token: string): Promise<Session | null> {
    logger.debug('Fetching session by token');
    return this.sessionRepository.findByToken(token);
  }

  async getSessionByRefreshToken(refreshToken: string): Promise<Session | null> {
    logger.debug('Fetching session by refresh token');
    return this.sessionRepository.findByRefreshToken(refreshToken);
  }

  
  async getUserSessions(
    userId: string,
    filter?: SessionFilter,
    pagination?: { page?: number; limit?: number }
  ): Promise<PaginatedResult<Session>> {
    logger.debug(`Fetching sessions for user ${userId}`);

    const page = pagination?.page ?? SESSION_CONSTANTS.PAGINATION.DEFAULT_PAGE;
    const limit = pagination?.limit ?? SESSION_CONSTANTS.PAGINATION.DEFAULT_LIMIT;

    const sessions = await this.sessionRepository.findByUserId(userId, filter);

    const total = sessions.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paginatedData = sessions.slice(start, start + limit);

    return {
      data: paginatedData,
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

  
  async getActiveSessionsCount(userId: string): Promise<number> {
    logger.debug(`Counting active sessions for user ${userId}`);
    return this.sessionRepository.countActiveSessions(userId);
  }

  async updateSession(sessionId: string, data: {
    expiresAt?: Date;
    isValid?: boolean;
    lastActivityAt?: Date;
    device?: string;
    location?: string;
  }): Promise<Session> {
    logger.info(`Updating session ${sessionId}`);

    
    const session = await this.sessionRepository.update(sessionId, data);
    await this.invalidateSessionCache(sessionId);

    logger.info(`Session ${sessionId} updated`);
    return session;
  }

  async updateSessionActivity(sessionId: string): Promise<void> {
    logger.debug(`Updating activity for session ${sessionId}`);
    
    await this.sessionRepository.updateActivity(sessionId);
    const session = await this.sessionRepository.findById(sessionId);
    if (session) await this.cacheSession(session);
  }

  async extendSession(sessionId: string): Promise<Session> {
    logger.info(`Extending session ${sessionId}`);

    const session = await this.sessionRepository.findById(sessionId);
    if (!session) throw new SessionNotFoundError();

    
    if (!session.isValid) throw new AuthenticationError('Session is invalid');

    const newExpiresAt = new Date(
      Date.now() + SESSION_CONSTANTS.SESSION.EXTENSION_DURATION * 1000
    );

    const updatedSession = await this.sessionRepository.update(sessionId, {
      expiresAt: newExpiresAt,
    });

    await this.cacheSession(updatedSession);

    await this.eventProducer.publish(SESSION_CONSTANTS.EVENTS.SESSION_ACTIVITY, {
      sessionId: updatedSession.id,
      userId: updatedSession.userId,
      newExpiresAt: updatedSession.expiresAt,
      extendedAt: new Date(),
    });

    logger.info(`Session ${sessionId} extended to ${updatedSession.expiresAt}`);
    return updatedSession;
  }

  async revokeSession(sessionId: string, reason?: string): Promise<void> {
    logger.info(`Revoking session ${sessionId} — reason: ${reason ?? 'not specified'}`);

    const session = await this.sessionRepository.findById(sessionId);
    if (!session) throw new SessionNotFoundError();

    
    await this.sessionRepository.revoke(sessionId);
    await this.invalidateSessionCache(sessionId);

    await this.eventProducer.publish(SESSION_CONSTANTS.EVENTS.SESSION_REVOKED, {
      sessionId,
      userId: session.userId,
      reason: reason ?? SESSION_CONSTANTS.REVOKE_REASONS.USER_LOGOUT,
      revokedAt: new Date(),
    });

    logger.info(`Session ${sessionId} revoked`);
  }

  async revokeAllUserSessions(
    userId: string,
    exceptSessionId?: string,
    reason?: string,
  ): Promise<number> {
    logger.info(`Revoking all sessions for user ${userId}`);

    
    
    const revokedCount = await this.sessionRepository.revokeAllByUserId(userId, exceptSessionId);

    await this.eventProducer.publish(SESSION_CONSTANTS.EVENTS.SESSIONS_BULK_REVOKED, {
      userId,
      exceptSessionId,
      revokedCount,
      reason: reason ?? SESSION_CONSTANTS.REVOKE_REASONS.USER_LOGOUT,
      revokedAt: new Date(),
    });

    logger.info(`Revoked ${revokedCount} sessions for user ${userId}`);
    return revokedCount;
  }

  async revokeOldestSession(userId: string): Promise<void> {
    logger.info(`Revoking oldest session for user ${userId}`);

    
    
    const sessions = await this.sessionRepository.findByUserId(userId, {
      isValid: true,
      sortBy: 'createdAt',
      sortOrder: 'asc',
    });

    const oldest = sessions[0];
if (!oldest) return;

await this.revokeSession(
  oldest.id,
  SESSION_CONSTANTS.REVOKE_REASONS.CONCURRENT_LIMIT
);
  }

  async verifySession(sessionId: string): Promise<boolean> {
    logger.debug(`Verifying session ${sessionId}`);
    const session = await this.sessionRepository.findById(sessionId);

    if (!session) { logger.debug(`Session ${sessionId} not found`); return false; }
    
    if (!session.isValid) { logger.debug(`Session ${sessionId} is invalid`); return false; }
    if (session.expiresAt < new Date()) { logger.debug(`Session ${sessionId} expired`); return false; }

    return true;
  }

  async refreshSession(refreshToken: string): Promise<{
    session: Session;
    newAccessToken: string;
    newRefreshToken: string;
  }> {
    logger.info('Refreshing session tokens');

    const session = await this.getSessionByRefreshToken(refreshToken);

    
    if (!session) throw new AuthenticationError(SESSION_CONSTANTS.ERRORS.INVALID_REFRESH_TOKEN);
    if (!session.isValid) throw new AuthenticationError(SESSION_CONSTANTS.ERRORS.SESSION_INACTIVE);
    if (session.expiresAt < new Date()) throw new SessionExpiredError();

    const newAccessToken = generateToken(32);
    const newRefreshToken = generateToken(64);

    
    const updatedSession = await this.sessionRepository.update(session.id, {
      token: newAccessToken,
      refreshToken: newRefreshToken,
      lastActivityAt: new Date(),
    });

    await this.cacheSession(updatedSession);

    await this.eventProducer.publish(SESSION_CONSTANTS.EVENTS.SESSION_REFRESHED, {
      sessionId: updatedSession.id,
      userId: updatedSession.userId,
      refreshedAt: new Date(),
    });

    logger.info(`Session ${updatedSession.id} refreshed for user ${updatedSession.userId}`);
    return { session: updatedSession, newAccessToken, newRefreshToken };
  }

  async getSessionStatistics(userId: string): Promise<SessionStatistics> {
    logger.debug(`Fetching session statistics for user ${userId}`);

    
    const sessions = await this.sessionRepository.findByUserId(userId, {
      includeExpired: true,
    });

    const now = new Date();
    
    const activeSessions = sessions.filter((s: Session) => s.isValid && s.expiresAt > now);

    const deviceBreakdown = activeSessions.reduce((acc: Record<string, number>, s: Session) => {
      const device = s.device ?? 'Unknown';
      acc[device] = (acc[device] ?? 0) + 1;
      return acc;
    }, {});

    const locationBreakdown = activeSessions.reduce((acc: Record<string, number>, s: Session) => {
      const loc = s.location ?? 'Unknown';
      acc[loc] = (acc[loc] ?? 0) + 1;
      return acc;
    }, {});

    
    const sortedAsc = [...activeSessions].sort((a: Session, b: Session) =>
      a.createdAt.getTime() - b.createdAt.getTime()
    );
    const sortedDesc = [...activeSessions].sort((a: Session, b: Session) =>
      b.createdAt.getTime() - a.createdAt.getTime()
    );

    return {
      totalSessions: sessions.length,
      activeSessions: activeSessions.length,
      expiredSessions: sessions.filter((s: Session) => s.expiresAt < now).length,
      revokedSessions: sessions.filter((s: Session) => !s.isValid).length,
      deviceBreakdown,
      locationBreakdown,
      oldestActiveSession: sortedAsc[0]?.createdAt ?? null,
      newestActiveSession: sortedDesc[0]?.createdAt ?? null,
    };
  }

  
  async getActiveDevices(userId: string, currentSessionId?: string): Promise<ActiveDevice[]> {
    logger.debug(`Fetching active devices for user ${userId}`);

    
    const sessions = await this.sessionRepository.findByUserId(userId, {
      isValid: true,
    });

    return sessions.map((session: Session) => ({
      sessionId: session.id,
      device: session.device ?? 'Unknown Device',
      browser: this.extractBrowser(session.userAgent ?? null),
      os: this.extractOS(session.userAgent ?? null),
      ipAddress: session.ipAddress ?? 'Unknown',
      location: session.location ?? 'Unknown',
      lastActivityAt: session.lastActivityAt,
      createdAt: session.createdAt,
      isCurrent: session.id === currentSessionId,
    }));
  }

  async cleanupExpiredSessions(): Promise<number> {
    logger.info('Cleaning up expired sessions');
    
    const deletedCount = await this.sessionRepository.deleteExpired();
    logger.info(`Cleaned up ${deletedCount} expired sessions`);
    return deletedCount;
  }

  async cleanupOldRevokedSessions(daysOld: number = 30): Promise<number> {
    logger.info(`Cleaning up revoked sessions older than ${daysOld} days`);
    const deletedCount = await this.sessionRepository.deleteOldRevoked(daysOld);
    logger.info(`Cleaned up ${deletedCount} old revoked sessions`);
    return deletedCount;
  }

  
  
  
  private async getCachedSession(sessionId: string): Promise<Session | null> {
    const key = CacheKey.session(sessionId);
    const cached = await this.redis.get<Record<string, unknown>>(key);
    if (!cached) return null;

    return {
      ...cached,
      expiresAt: cached['expiresAt'] ? new Date(cached['expiresAt'] as string) : new Date(0),
      lastActivityAt: cached['lastActivityAt'] ? new Date(cached['lastActivityAt'] as string) : null,
      createdAt: cached['createdAt'] ? new Date(cached['createdAt'] as string) : new Date(0),
      updatedAt: cached['updatedAt'] ? new Date(cached['updatedAt'] as string) : new Date(0),
    } as Session;
  }

  private async cacheSession(session: Session): Promise<void> {
    const key = CacheKey.session(session.id);
    
    await this.redis.set(key, session, SESSION_CONSTANTS.CACHE.CACHE_TTL);
  }

  private async invalidateSessionCache(sessionId: string): Promise<void> {
    await this.redis.del(CacheKey.session(sessionId));
  }

  private extractBrowser(userAgent: string | null): string {
    if (!userAgent) return 'Unknown';
    const ua = userAgent.toLowerCase();
    if (ua.includes('firefox')) return 'Firefox';
    if (ua.includes('chrome') && !ua.includes('edge')) return 'Chrome';
    if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
    if (ua.includes('edge')) return 'Edge';
    if (ua.includes('opera')) return 'Opera';
    return 'Unknown';
  }

  private extractOS(userAgent: string | null): string {
    if (!userAgent) return 'Unknown';
    const ua = userAgent.toLowerCase();
    if (ua.includes('windows')) return 'Windows';
    if (ua.includes('mac')) return 'macOS';
    if (ua.includes('linux')) return 'Linux';
    if (ua.includes('android')) return 'Android';
    if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) return 'iOS';
    return 'Unknown';
  }
}