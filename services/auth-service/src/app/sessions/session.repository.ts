

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

interface SessionCreateInput {
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
}

interface SessionUpdateInput {
  token?: string;
  refreshToken?: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  device?: string | null;
  location?: string | null;
  expiresAt?: Date;
  lastActivityAt?: Date | null;
  isValid?: boolean;
}

interface SessionFilter {
  isValid?: boolean;
  includeExpired?: boolean;
  ipAddress?: string;
  device?: string;
  expiresAfter?: Date;
  expiresBefore?: Date;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}



interface PrismaSessionDelegate {
  create: (args: any) => Promise<any>;
  findUnique: (args: any) => Promise<any | null>;
  findMany: (args?: any) => Promise<any[]>;
  update: (args: any) => Promise<any>;
  updateMany: (args: any) => Promise<{ count: number }>;
  delete: (args: any) => Promise<any>;
  deleteMany: (args: any) => Promise<{ count: number }>;
  count: (args?: any) => Promise<number>;
}

interface PrismaUserDelegate {
  update: (args: any) => Promise<any>;
}

interface PrismaTransactionClient {
  session: PrismaSessionDelegate;
  user: PrismaUserDelegate;
}

interface PrismaClient {
  session: PrismaSessionDelegate;
  user: PrismaUserDelegate;
  $transaction: <T>(fn: (tx: PrismaTransactionClient) => Promise<T>) => Promise<T>;
}



class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}



const logger = {
  debug: (message: string, meta?: Record<string, unknown>) =>
    console.debug(`[DEBUG] ${message}`, meta ?? ''),
  error: (message: string, meta?: Record<string, unknown>) =>
    console.error(`[ERROR] ${message}`, meta ?? ''),
};



function fromPrismaSession(prismaSession: any): Session {  
  return {
    id: prismaSession.id,
    userId: prismaSession.userId,
    token: prismaSession.token,
    refreshToken: prismaSession.refreshToken,
    userAgent: prismaSession.userAgent ?? null,
    ipAddress: prismaSession.ipAddress ?? null,
    device: prismaSession.device ?? null,
    location: prismaSession.location ?? null,
    expiresAt: prismaSession.expiresAt,
    lastActivityAt: prismaSession.lastActivityAt ?? null,
    isValid: prismaSession.isValid,
    createdAt: prismaSession.createdAt,
    updatedAt: prismaSession.updatedAt,
  };
}

function fromPrismaSessionArray(prismaSessions: any[]): Session[] {  
  return prismaSessions.map(fromPrismaSession);
}





export class SessionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: SessionCreateInput): Promise<Session> {
    try {
      logger.debug('Creating session in database', {
        userId: data.userId,
        device: data.device ?? undefined,
      });

      const session = await this.prisma.session.create({
        data: {
          userId: data.userId,
          token: data.token,
          refreshToken: data.refreshToken,
          userAgent: data.userAgent,
          ipAddress: data.ipAddress,
          device: data.device,
          location: data.location,
          expiresAt: data.expiresAt,
          lastActivityAt: data.lastActivityAt,
          isValid: data.isValid,
        },
      });

      logger.debug('Session created in database', { sessionId: session.id });

      return fromPrismaSession(session);
    } catch (error) {
      logger.error('Error creating session in database', { userId: data.userId });
      throw new AppError('Failed to create session', 500, 'DATABASE_ERROR', {
        originalError: error as Record<string, unknown>,
      });
    }
  }

  async findById(sessionId: string): Promise<Session | null> {
    try {
      logger.debug('Finding session by ID', { sessionId });

      const session = await this.prisma.session.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        logger.debug('Session not found', { sessionId });
        return null;
      }

      return fromPrismaSession(session);
    } catch (error) {
      logger.error('Error finding session by ID', { sessionId });
      throw new AppError('Failed to find session', 500, 'DATABASE_ERROR', {
        originalError: error as Record<string, unknown>,
      });
    }
  }

  async findByToken(token: string): Promise<Session | null> {
    try {
      logger.debug('Finding session by token');

      const session = await this.prisma.session.findUnique({
        where: { token },
      });

      if (!session) {
        logger.debug('Session not found for token');
        return null;
      }

      return fromPrismaSession(session);
    } catch (error) {
      logger.error('Error finding session by token', {});
      throw new AppError('Failed to find session', 500, 'DATABASE_ERROR', {
        originalError: error as Record<string, unknown>,
      });
    }
  }

  async findByRefreshToken(refreshToken: string): Promise<Session | null> {
    try {
      logger.debug('Finding session by refresh token');

      const session = await this.prisma.session.findUnique({
        where: { refreshToken },
      });

      if (!session) {
        logger.debug('Session not found for refresh token');
        return null;
      }

      return fromPrismaSession(session);
    } catch (error) {
      logger.error('Error finding session by refresh token', {});
      throw new AppError('Failed to find session', 500, 'DATABASE_ERROR', {
        originalError: error as Record<string, unknown>,
      });
    }
  }

  async findByUserId(
    userId: string,
    filter?: Partial<SessionFilter>
  ): Promise<Session[]> {
    try {
      logger.debug('Finding sessions by user ID', { userId });

      const where: Record<string, any> = { userId };

      if (filter?.isValid !== undefined) {
        where['isValid'] = filter.isValid;
      }

      if (!filter?.includeExpired) {
        where['expiresAt'] = { gt: new Date() };
      }

      if (filter?.ipAddress) {
        where['ipAddress'] = filter.ipAddress;
      }

      if (filter?.device) {
        where['device'] = { contains: filter.device, mode: 'insensitive' };
      }

      if (filter?.expiresAfter) {
        where['expiresAt'] = { ...where['expiresAt'], gte: filter.expiresAfter };
      }

      if (filter?.expiresBefore) {
        where['expiresAt'] = { ...where['expiresAt'], lte: filter.expiresBefore };
      }

      const orderBy: Record<string, string> = {};
      if (filter?.sortBy) {
        orderBy[filter.sortBy] = filter.sortOrder || 'desc';
      } else {
        orderBy['createdAt'] = 'desc';
      }

      const sessions = await this.prisma.session.findMany({ where, orderBy });

      logger.debug('Found sessions by user ID', { userId, count: sessions.length });

      return fromPrismaSessionArray(sessions);
    } catch (error) {
      logger.error('Error finding sessions by user ID', { userId });
      throw new AppError('Failed to find sessions', 500, 'DATABASE_ERROR', {
        originalError: error as Record<string, unknown>,
      });
    }
  }

  async countActiveSessions(userId: string): Promise<number> {
    try {
      logger.debug('Counting active sessions', { userId });

      const count = await this.prisma.session.count({
        where: {
          userId,
          isValid: true,
          expiresAt: { gt: new Date() },
        },
      });

      logger.debug('Counted active sessions', { userId, count });

      return count;
    } catch (error) {
      logger.error('Error counting active sessions', { userId });
      throw new AppError('Failed to count sessions', 500, 'DATABASE_ERROR', {
        originalError: error as Record<string, unknown>,
      });
    }
  }

  async update(sessionId: string, data: SessionUpdateInput): Promise<Session> {
    try {
      logger.debug('Updating session', { sessionId });

      const updateData: Record<string, any> = {};

      if (data.token !== undefined) updateData['token'] = data.token;
      if (data.refreshToken !== undefined) updateData['refreshToken'] = data.refreshToken;
      if (data.userAgent !== undefined) updateData['userAgent'] = data.userAgent;
      if (data.ipAddress !== undefined) updateData['ipAddress'] = data.ipAddress;
      if (data.device !== undefined) updateData['device'] = data.device;
      if (data.location !== undefined) updateData['location'] = data.location;
      if (data.expiresAt !== undefined) updateData['expiresAt'] = data.expiresAt;
      if (data.lastActivityAt !== undefined) updateData['lastActivityAt'] = data.lastActivityAt;
      if (data.isValid !== undefined) updateData['isValid'] = data.isValid;

      updateData['updatedAt'] = new Date();

      const session = await this.prisma.session.update({
        where: { id: sessionId },
        data: updateData,
      });

      logger.debug('Session updated', { sessionId });

      return fromPrismaSession(session);
    } catch (error) {
      logger.error('Error updating session', { sessionId });
      throw new AppError('Failed to update session', 500, 'DATABASE_ERROR', {
        originalError: error as Record<string, unknown>,
      });
    }
  }

  async updateActivity(sessionId: string): Promise<void> {
    try {
      logger.debug('Updating session activity', { sessionId });

      await this.prisma.session.update({
        where: { id: sessionId },
        data: {
          lastActivityAt: new Date(),
          updatedAt: new Date(),
        },
      });

      logger.debug('Session activity updated', { sessionId });
    } catch (error) {
      logger.error('Error updating session activity', { sessionId });
      throw new AppError('Failed to update session activity', 500, 'DATABASE_ERROR', {
        originalError: error as Record<string, unknown>,
      });
    }
  }

  async revoke(sessionId: string): Promise<void> {
    try {
      logger.debug('Revoking session', { sessionId });

      await this.prisma.session.update({
        where: { id: sessionId },
        data: { isValid: false, updatedAt: new Date() },
      });

      logger.debug('Session revoked', { sessionId });
    } catch (error) {
      logger.error('Error revoking session', { sessionId });
      throw new AppError('Failed to revoke session', 500, 'DATABASE_ERROR', {
        originalError: error as Record<string, unknown>,
      });
    }
  }

  async revokeAllByUserId(userId: string, exceptSessionId?: string): Promise<number> {
    try {
      logger.debug('Revoking all user sessions', { userId, exceptSessionId });

      const where: Record<string, any> = { userId, isValid: true };

      if (exceptSessionId) {
        where['id'] = { not: exceptSessionId };
      }

      const result = await this.prisma.session.updateMany({
        where,
        data: { isValid: false, updatedAt: new Date() },
      });

      logger.debug('All user sessions revoked', { userId, count: result.count });

      return result.count;
    } catch (error) {
      logger.error('Error revoking all user sessions', { userId });
      throw new AppError('Failed to revoke sessions', 500, 'DATABASE_ERROR', {
        originalError: error as Record<string, unknown>,
      });
    }
  }

  async delete(sessionId: string): Promise<void> {
    try {
      logger.debug('Deleting session', { sessionId });

      await this.prisma.session.delete({ where: { id: sessionId } });

      logger.debug('Session deleted', { sessionId });
    } catch (error) {
      logger.error('Error deleting session', { sessionId });
      throw new AppError('Failed to delete session', 500, 'DATABASE_ERROR', {
        originalError: error as Record<string, unknown>,
      });
    }
  }

  async deleteExpired(): Promise<number> {
    try {
      logger.debug('Deleting expired sessions');

      const result = await this.prisma.session.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      });

      logger.debug('Expired sessions deleted', { count: result.count });

      return result.count;
    } catch (error) {
      logger.error('Error deleting expired sessions', {});
      throw new AppError('Failed to delete expired sessions', 500, 'DATABASE_ERROR', {
        originalError: error as Record<string, unknown>,
      });
    }
  }

  async deleteOldRevoked(daysOld: number): Promise<number> {
    try {
      logger.debug('Deleting old revoked sessions', { daysOld });

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await this.prisma.session.deleteMany({
        where: {
          isValid: false,
          updatedAt: { lt: cutoffDate },
        },
      });

      logger.debug('Old revoked sessions deleted', { count: result.count });

      return result.count;
    } catch (error) {
      logger.error('Error deleting old revoked sessions', {});
      throw new AppError('Failed to delete old revoked sessions', 500, 'DATABASE_ERROR', {
        originalError: error as Record<string, unknown>,
      });
    }
  }

  async deleteAllByUserId(userId: string): Promise<number> {
    try {
      logger.debug('Deleting all user sessions', { userId });

      const result = await this.prisma.session.deleteMany({ where: { userId } });

      logger.debug('All user sessions deleted', { userId, count: result.count });

      return result.count;
    } catch (error) {
      logger.error('Error deleting all user sessions', { userId });
      throw new AppError('Failed to delete user sessions', 500, 'DATABASE_ERROR', {
        originalError: error as Record<string, unknown>,
      });
    }
  }

  async findByIdWithUser(sessionId: string): Promise<any | null> {
    try {
      logger.debug('Finding session with user details', { sessionId });

      const session = await this.prisma.session.findUnique({
        where: { id: sessionId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
              status: true,
              emailVerified: true,
              twoFactorEnabled: true,
            },
          },
        },
      });

      if (!session) {
        logger.debug('Session not found', { sessionId });
        return null;
      }

      return session;
    } catch (error) {
      logger.error('Error finding session with user details', { sessionId });
      throw new AppError('Failed to find session', 500, 'DATABASE_ERROR', {
        originalError: error as Record<string, unknown>,
      });
    }
  }

  async exists(sessionId: string): Promise<boolean> {
    try {
      logger.debug('Checking if session exists', { sessionId });

      const count = await this.prisma.session.count({ where: { id: sessionId } });

      return count > 0;
    } catch (error) {
      logger.error('Error checking if session exists', { sessionId });
      throw new AppError('Failed to check session existence', 500, 'DATABASE_ERROR', {
        originalError: error as Record<string, unknown>,
      });
    }
  }

  async count(): Promise<number> {
    try {
      logger.debug('Counting total sessions');

      const count = await this.prisma.session.count();

      logger.debug('Counted total sessions', { count });

      return count;
    } catch (error) {
      logger.error('Error counting total sessions', {});
      throw new AppError('Failed to count sessions', 500, 'DATABASE_ERROR', {
        originalError: error as Record<string, unknown>,
      });
    }
  }

  async findExpiringSoon(hoursUntilExpiry: number): Promise<Session[]> {
    try {
      logger.debug('Finding sessions expiring soon', { hoursUntilExpiry });

      const now = new Date();
      const expiryThreshold = new Date(now.getTime() + hoursUntilExpiry * 60 * 60 * 1000);

      const sessions = await this.prisma.session.findMany({
        where: {
          isValid: true,
          expiresAt: { gt: now, lte: expiryThreshold },
        },
        orderBy: { expiresAt: 'asc' },
      });

      logger.debug('Found sessions expiring soon', { count: sessions.length });

      return fromPrismaSessionArray(sessions);
    } catch (error) {
      logger.error('Error finding sessions expiring soon', {});
      throw new AppError('Failed to find sessions', 500, 'DATABASE_ERROR', {
        originalError: error as Record<string, unknown>,
      });
    }
  }

  async findByIpAddress(ipAddress: string): Promise<Session[]> {
    try {
      logger.debug('Finding sessions by IP address', { ipAddress });

      const sessions = await this.prisma.session.findMany({
        where: {
          ipAddress,
          isValid: true,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      });

      logger.debug('Found sessions by IP address', { ipAddress, count: sessions.length });

      return fromPrismaSessionArray(sessions);
    } catch (error) {
      logger.error('Error finding sessions by IP address', { ipAddress });
      throw new AppError('Failed to find sessions', 500, 'DATABASE_ERROR', {
        originalError: error as Record<string, unknown>,
      });
    }
  }

  async findByDevice(device: string): Promise<Session[]> {
    try {
      logger.debug('Finding sessions by device', { device });

      const sessions = await this.prisma.session.findMany({
        where: {
          device: { contains: device, mode: 'insensitive' },
          isValid: true,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      });

      logger.debug('Found sessions by device', { device, count: sessions.length });

      return fromPrismaSessionArray(sessions);
    } catch (error) {
      logger.error('Error finding sessions by device', { device });
      throw new AppError('Failed to find sessions', 500, 'DATABASE_ERROR', {
        originalError: error as Record<string, unknown>,
      });
    }
  }

  async batchUpdate(sessionIds: string[], data: SessionUpdateInput): Promise<number> {
    try {
      logger.debug('Batch updating sessions', { updateCount: sessionIds.length });

      const updateData: Record<string, any> = {};

      if (data.isValid !== undefined) updateData['isValid'] = data.isValid;
      if (data.expiresAt !== undefined) updateData['expiresAt'] = data.expiresAt;
      if (data.lastActivityAt !== undefined) updateData['lastActivityAt'] = data.lastActivityAt;

      updateData['updatedAt'] = new Date();

      const result = await this.prisma.session.updateMany({
        where: { id: { in: sessionIds } },
        data: updateData,
      });

      logger.debug('Batch updated sessions', { count: result.count });

      return result.count;
    } catch (error) {
      logger.error('Error batch updating sessions', {});
      throw new AppError('Failed to batch update sessions', 500, 'DATABASE_ERROR', {
        originalError: error as Record<string, unknown>,
      });
    }
  }

  async createSessionWithUserUpdate(
    sessionData: SessionCreateInput,
    userId: string,
    lastLoginIp: string
  ): Promise<Session> {
    try {
      logger.debug('Creating session with user update', { userId });

      
      const result = await this.prisma.$transaction(async (tx: PrismaTransactionClient) => {
        const session = await tx.session.create({
          data: {
            userId: sessionData.userId,
            token: sessionData.token,
            refreshToken: sessionData.refreshToken,
            userAgent: sessionData.userAgent,
            ipAddress: sessionData.ipAddress,
            device: sessionData.device,
            location: sessionData.location,
            expiresAt: sessionData.expiresAt,
            lastActivityAt: sessionData.lastActivityAt,
            isValid: sessionData.isValid,
          },
        });

        await tx.user.update({
          where: { id: userId },
          data: {
            lastLoginAt: new Date(),
            lastLoginIp,
          },
        });

        return session;
      });

      logger.debug('Session created with user update', { sessionId: result.id });

      return fromPrismaSession(result);
    } catch (error) {
      logger.error('Error creating session with user update', { userId });
      throw new AppError('Failed to create session', 500, 'DATABASE_ERROR', {
        originalError: error as Record<string, unknown>,
      });
    }
  }
}