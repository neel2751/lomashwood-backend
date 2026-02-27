
import {
  Session,
  SessionDTO,
  SessionResponse,
  SessionListResponse,
  PaginatedSessionResponse,
  CreateSessionDTO,
  UpdateSessionDTO,
  SessionWithUser,
  DeviceType,
  SessionValidationResult,
  RefreshedSessionResponse,
  SessionCountResponse,
  BulkRevokeResult,
  SessionCleanupResult,
} from './session.types';

export class SessionMapper {
  
  public static toDTO(session: Session): SessionDTO {
    return {
      id: session.id,
      userId: session.userId,
      expiresAt: session.expiresAt,
      ipAddress: session.ipAddress ?? undefined,
      userAgent: session.userAgent ?? undefined,
      deviceType: session.deviceType ?? undefined,
      deviceName: session.deviceName ?? undefined,
      location: session.location ?? undefined,
      isActive: session.isActive,
      lastActivityAt: session.lastActivityAt ?? undefined,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    };
  }

 
  public static toResponse(session: Session): SessionResponse {
    return {
      id: session.id,
      userId: session.userId,
      expiresAt: session.expiresAt.toISOString(),
      ipAddress: session.ipAddress ?? undefined,
      userAgent: session.userAgent ?? undefined,
      deviceType: session.deviceType ?? undefined,
      deviceName: session.deviceName ?? undefined,
      location: session.location ?? undefined,
      isActive: session.isActive,
      lastActivityAt: session.lastActivityAt?.toISOString(),
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
    };
  }

 
  public static toEntity(dto: CreateSessionDTO): Partial<Session> {
    return {
      userId: dto.userId,
      token: dto.token,
      refreshToken: dto.refreshToken ?? null,
      expiresAt: dto.expiresAt,
      ipAddress: dto.ipAddress ?? null,
      userAgent: dto.userAgent ?? null,
      deviceType: dto.deviceType ?? null,
      deviceName: dto.deviceName ?? null,
      location: dto.location ?? null,
      isActive: true,
      lastActivityAt: new Date(),
      metadata: dto.metadata ?? null,
    };
  }

  public static toUpdateEntity(dto: UpdateSessionDTO): Partial<Session> {
    const updateData: Partial<Session> = {};

    if (dto.expiresAt !== undefined) {
      updateData.expiresAt = dto.expiresAt;
    }
    if (dto.isActive !== undefined) {
      updateData.isActive = dto.isActive;
    }
    if (dto.lastActivityAt !== undefined) {
      updateData.lastActivityAt = dto.lastActivityAt;
    }
    if (dto.ipAddress !== undefined) {
      updateData.ipAddress = dto.ipAddress;
    }
    if (dto.userAgent !== undefined) {
      updateData.userAgent = dto.userAgent;
    }
    if (dto.deviceType !== undefined) {
      updateData.deviceType = dto.deviceType;
    }
    if (dto.deviceName !== undefined) {
      updateData.deviceName = dto.deviceName;
    }
    if (dto.location !== undefined) {
      updateData.location = dto.location;
    }
    if (dto.metadata !== undefined) {
      updateData.metadata = dto.metadata;
    }

    updateData.updatedAt = new Date();

    return updateData;
  }


  public static toListResponse(
    sessions: Session[],
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    }
  ): SessionListResponse {
    return {
      sessions: sessions.map((session) => this.toResponse(session)),
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages: pagination.totalPages,
      },
    };
  }

 
  public static toPaginatedResponse(
    sessions: Session[],
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    }
  ): PaginatedSessionResponse {
    return {
      sessions: sessions,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages: pagination.totalPages,
      },
    };
  }


  public static toResponseWithUser(session: SessionWithUser): SessionResponse & {
    user: {
      id: string;
      email: string;
      firstName?: string;
      lastName?: string;
      fullName?: string;
      role: string;
    };
  } {
    const baseResponse = this.toResponse(session);
    return {
      ...baseResponse,
      user: {
        id: session.user.id,
        email: session.user.email,
        firstName: session.user.firstName ?? undefined,
        lastName: session.user.lastName ?? undefined,
        fullName: this.formatFullName(
          session.user.firstName,
          session.user.lastName
        ),
        role: session.user.role,
      },
    };
  }

  public static toValidationResponse(
    result: SessionValidationResult
  ): {
    isValid: boolean;
    session?: SessionResponse;
    reason?: string;
    status?: string;
  } {
    return {
      isValid: result.isValid,
      session: result.session ? this.toResponse(result.session) : undefined,
      reason: result.reason,
      status: result.status,
    };
  }

  public static toRefreshedSessionResponse(
    response: RefreshedSessionResponse
  ): {
    session: SessionResponse;
    token: string;
    refreshToken?: string;
    expiresAt: string;
  } {
    return {
      session: this.toResponse(response.session),
      token: response.token,
      refreshToken: response.refreshToken,
      expiresAt: response.expiresAt.toISOString(),
    };
  }

  public static toCountResponse(count: SessionCountResponse): {
    userId?: string;
    activeCount: number;
    totalCount: number;
    expiredCount: number;
    revokedCount: number;
  } {
    return {
      userId: count.userId,
      activeCount: count.activeCount,
      totalCount: count.totalCount,
      expiredCount: count.expiredCount,
      revokedCount: count.revokedCount,
    };
  }

  
  public static toBulkRevokeResponse(result: BulkRevokeResult): {
    message: string;
    revokedCount: number;
    failedCount: number;
    sessionIds: string[];
  } {
    return {
      message: `Successfully revoked ${result.revokedCount} session(s)`,
      revokedCount: result.revokedCount,
      failedCount: result.failedCount,
      sessionIds: result.sessionIds,
    };
  }

  public static toCleanupResponse(result: SessionCleanupResult): {
    message: string;
    deletedCount: number;
    errorCount: number;
    errors: Array<{ sessionId: string; error: string }>;
  } {
    return {
      message: `Successfully deleted ${result.deletedCount} session(s)`,
      deletedCount: result.deletedCount,
      errorCount: result.errors.length,
      errors: result.errors,
    };
  }


  public static sanitize(session: Session): SessionResponse {
    const response = this.toResponse(session);
   
    return response;
  }


  public static toDeviceType(deviceType?: string): DeviceType | undefined {
    if (!deviceType) return undefined;

    const normalizedType = deviceType.toLowerCase();
    switch (normalizedType) {
      case 'desktop':
        return DeviceType.DESKTOP;
      case 'mobile':
        return DeviceType.MOBILE;
      case 'tablet':
        return DeviceType.TABLET;
      default:
        return DeviceType.OTHER;
    }
  }

 
  public static parseUserAgent(userAgent?: string): {
    deviceType: DeviceType;
    deviceName?: string;
  } {
    if (!userAgent) {
      return {
        deviceType: DeviceType.OTHER,
      };
    }

    const ua = userAgent.toLowerCase();

 
    if (
      /mobile|android|iphone|ipod|blackberry|windows phone/i.test(ua)
    ) {
      return {
        deviceType: DeviceType.MOBILE,
        deviceName: this.extractDeviceName(userAgent),
      };
    }

   
    if (/tablet|ipad/i.test(ua)) {
      return {
        deviceType: DeviceType.TABLET,
        deviceName: this.extractDeviceName(userAgent),
      };
    }

   
    return {
      deviceType: DeviceType.DESKTOP,
      deviceName: this.extractBrowserName(userAgent),
    };
  }


  private static extractDeviceName(userAgent: string): string {
    const matches = userAgent.match(
      /(iPhone|iPad|iPod|Android|Windows Phone|BlackBerry)/i
    );
    return matches ? matches[0] : 'Unknown Device';
  }

  
  private static extractBrowserName(userAgent: string): string {
    if (/chrome/i.test(userAgent)) return 'Chrome';
    if (/firefox/i.test(userAgent)) return 'Firefox';
    if (/safari/i.test(userAgent)) return 'Safari';
    if (/edge/i.test(userAgent)) return 'Edge';
    if (/msie|trident/i.test(userAgent)) return 'Internet Explorer';
    return 'Unknown Browser';
  }

 
  private static formatFullName(
    firstName?: string | null,
    lastName?: string | null
  ): string | undefined {
    const parts = [firstName, lastName].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : undefined;
  }

 
  public static toLogFormat(session: Session): {
    id: string;
    userId: string;
    deviceType?: DeviceType;
    ipAddress?: string;
    isActive: boolean;
    expiresAt: string;
  } {
    return {
      id: session.id,
      userId: session.userId,
      deviceType: session.deviceType ?? undefined,
      ipAddress: session.ipAddress ?? undefined,
      isActive: session.isActive,
      expiresAt: session.expiresAt.toISOString(),
    };
  }


  public static toResponseBatch(sessions: Session[]): SessionResponse[] {
    return sessions.map((session) => this.toResponse(session));
  }

  public static toDTOBatch(sessions: Session[]): SessionDTO[] {
    return sessions.map((session) => this.toDTO(session));
  }
}

export default SessionMapper;