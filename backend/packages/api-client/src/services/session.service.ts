import { HttpClient } from '../utils/http';
import {
  PaginatedResponse,
  Session,
  CreateSessionRequest,
  UpdateSessionRequest,
  SessionFilters,
} from '../types/api.types';

export class SessionService {
  constructor(private apiClient: HttpClient) {}

  // Session Management
  async getSessions(params?: SessionFilters & {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<Session[]>> {
    return this.apiClient.get<PaginatedResponse<Session[]>>('/sessions', { params });
  }

  async getSession(sessionId: string): Promise<Session> {
    return this.apiClient.get<Session>(`/sessions/${sessionId}`);
  }

  async createSession(sessionData: CreateSessionRequest): Promise<Session> {
    return this.apiClient.post<Session>('/sessions', sessionData);
  }

  async updateSession(sessionId: string, updateData: UpdateSessionRequest): Promise<Session> {
    return this.apiClient.put<Session>(`/sessions/${sessionId}`, updateData);
  }

  async deleteSession(sessionId: string): Promise<void> {
    return this.apiClient.delete<void>(`/sessions/${sessionId}`);
  }

  async terminateSession(sessionId: string, reason?: string): Promise<Session> {
    return this.apiClient.post<Session>(`/sessions/${sessionId}/terminate`, { reason });
  }

  async extendSession(sessionId: string, expiresAt: string): Promise<Session> {
    return this.apiClient.post<Session>(`/sessions/${sessionId}/extend`, { expiresAt });
  }

  async refreshSession(sessionId: string): Promise<Session> {
    return this.apiClient.post<Session>(`/sessions/${sessionId}/refresh`, {});
  }

  // Session Authentication
  async authenticateSession(sessionId: string, credentials: {
    method: 'password' | 'oauth' | 'sso' | 'token';
    provider?: string;
    credentials?: Record<string, any>;
  }): Promise<Session> {
    return this.apiClient.post<Session>(`/sessions/${sessionId}/authenticate`, credentials);
  }

  async deauthenticateSession(sessionId: string): Promise<Session> {
    return this.apiClient.post<Session>(`/sessions/${sessionId}/deauthenticate`, {});
  }

  async requireTwoFactor(sessionId: string): Promise<{
    qrCode?: string;
    secret?: string;
    backupCodes?: string[];
  }> {
    return this.apiClient.post<any>(`/sessions/${sessionId}/2fa/require`, {});
  }

  async verifyTwoFactor(sessionId: string, code: string): Promise<Session> {
    return this.apiClient.post<Session>(`/sessions/${sessionId}/2fa/verify`, { code });
  }

  // Session Activity
  async getSessionActivity(sessionId: string, params?: {
    page?: number;
    limit?: number;
    type?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Array<{
    id: string;
    type: string;
    timestamp: string;
    details: Record<string, any>;
    userAgent?: string;
    ip?: string;
  }>> {
    return this.apiClient.get<Array<any>>(`/sessions/${sessionId}/activity`, { params });
  }

  async addSessionActivity(sessionId: string, activity: {
    type: string;
    details: Record<string, any>;
    page?: string;
  }): Promise<void> {
    return this.apiClient.post<void>(`/sessions/${sessionId}/activity`, activity);
  }

  async getSessionPages(sessionId: string): Promise<Array<{
    url: string;
    title?: string;
    visitedAt: string;
    timeSpent: number;
    bounceRate?: number;
  }>> {
    return this.apiClient.get<Array<any>>(`/sessions/${sessionId}/pages`);
  }

  // Session Security
  async getSessionSecurity(sessionId: string): Promise<{
    riskLevel: 'low' | 'medium' | 'high';
    riskFactors: string[];
    securityEvents: Array<{
      type: string;
      timestamp: string;
      description: string;
      severity: 'low' | 'medium' | 'high';
      resolved?: boolean;
    }>;
    recommendations: string[];
  }> {
    return this.apiClient.get<any>(`/sessions/${sessionId}/security`);
  }

  async updateSessionSecurity(sessionId: string, securityData: {
    riskLevel?: 'low' | 'medium' | 'high';
    riskFactors?: string[];
    addSecurityEvent?: {
      type: string;
      description: string;
      severity: 'low' | 'medium' | 'high';
    };
  }): Promise<Session> {
    return this.apiClient.put<Session>(`/sessions/${sessionId}/security`, securityData);
  }

  async blockSession(sessionId: string, reason: string): Promise<Session> {
    return this.apiClient.post<Session>(`/sessions/${sessionId}/block`, { reason });
  }

  async unblockSession(sessionId: string): Promise<Session> {
    return this.apiClient.post<Session>(`/sessions/${sessionId}/unblock`, {});
  }

  // Session Search
  async searchSessions(query: string, params?: {
    page?: number;
    limit?: number;
    filters?: SessionFilters;
  }): Promise<PaginatedResponse<Session[]>> {
    return this.apiClient.get<PaginatedResponse<Session[]>>('/sessions/search', {
      params: { query, ...params }
    });
  }

  // Session Analytics
  async getSessionAnalytics(params?: {
    startDate?: string;
    endDate?: string;
    groupBy?: 'hour' | 'day' | 'week' | 'month';
    metrics?: string[];
    filters?: SessionFilters;
  }): Promise<{
    summary: {
      totalSessions: number;
      activeSessions: number;
      expiredSessions: number;
      terminatedSessions: number;
      avgSessionDuration: number;
      uniqueUsers: number;
      bounceRate: number;
      securityIncidents: number;
    };
    trends: Array<{
      date: string;
      sessions: number;
      active: number;
      avgDuration: number;
      uniqueUsers: number;
      bounceRate: number;
      securityIncidents: number;
    }>;
    byUserType: Array<{
      userType: string;
      sessions: number;
      percentage: number;
      avgDuration: number;
      bounceRate: number;
    }>;
    byDeviceType: Array<{
      deviceType: string;
      sessions: number;
      percentage: number;
      avgDuration: number;
      bounceRate: number;
    }>;
    byPlatform: Array<{
      platform: string;
      sessions: number;
      percentage: number;
      avgDuration: number;
      bounceRate: number;
    }>;
    byBrowser: Array<{
      browser: string;
      sessions: number;
      percentage: number;
      avgDuration: number;
      bounceRate: number;
    }>;
    byLocation: Array<{
      country: string;
      sessions: number;
      percentage: number;
      avgDuration: number;
      bounceRate: number;
    }>;
    byRiskLevel: Array<{
      riskLevel: string;
      sessions: number;
      percentage: number;
      securityIncidents: number;
    }>;
    topPages: Array<{
      url: string;
      title?: string;
      visits: number;
      uniqueVisitors: number;
      avgTimeSpent: number;
      bounceRate: number;
    }>;
  }> {
    return this.apiClient.get<any>('/sessions/analytics', { params });
  }

  async getSessionStats(): Promise<{
    totalSessions: number;
    activeSessions: number;
    expiredSessions: number;
    terminatedSessions: number;
    blockedSessions: number;
    highRiskSessions: number;
    avgSessionDuration: number;
    uniqueUsers: number;
    sessionsToday: number;
    sessionsThisWeek: number;
    sessionsThisMonth: number;
    securityIncidentsToday: number;
    securityIncidentsThisWeek: number;
    securityIncidentsThisMonth: number;
  }> {
    return this.apiClient.get<any>('/sessions/stats');
  }

  // Session Export
  async exportSessions(params?: {
    format?: 'csv' | 'excel' | 'json';
    filters?: SessionFilters;
    fields?: string[];
    includeActivity?: boolean;
    includeSecurity?: boolean;
  }): Promise<Blob> {
    return this.apiClient.getBlob('/sessions/export', { params });
  }

  // Session Templates
  async getSessionTemplates(): Promise<Array<{
    id: string;
    name: string;
    description?: string;
    userType: 'customer' | 'agent' | 'admin' | 'guest';
    authentication: {
      method: 'password' | 'oauth' | 'sso' | 'token' | 'guest';
      provider?: string;
    };
    security: {
      riskLevel: 'low' | 'medium' | 'high';
      requireTwoFactor: boolean;
      maxDuration?: number;
    };
    settings: {
      allowMultiple: boolean;
      autoExtend: boolean;
      trackActivity: boolean;
      enableSecurity: boolean;
    };
    isActive: boolean;
    usageCount: number;
  }>> {
    return this.apiClient.get<Array<any>>('/sessions/templates');
  }

  async createSessionFromTemplate(templateId: string, sessionData: {
    userId?: string;
    metadata?: Record<string, any>;
  }): Promise<Session> {
    return this.apiClient.post<Session>(`/sessions/templates/${templateId}/create`, sessionData);
  }

  // Session Cleanup
  async cleanupExpiredSessions(): Promise<{
    deletedCount: number;
    deletedSessions: Array<{
      sessionId: string;
      userId?: string;
      terminatedAt: string;
    }>;
  }> {
    return this.apiClient.post<any>('/sessions/cleanup/expired', {});
  }

  async cleanupInactiveSessions(params?: {
    inactiveHours?: number;
    keepRecent?: number;
  }): Promise<{
    deletedCount: number;
    deletedSessions: Array<{
      sessionId: string;
      userId?: string;
      lastActivityAt: string;
    }>;
  }> {
    return this.apiClient.post<any>('/sessions/cleanup/inactive', params);
  }

  // Session Monitoring
  async monitorSessions(): Promise<{
    activeSessions: number;
    highRiskSessions: number;
    securityAlerts: Array<{
      sessionId: string;
      userId?: string;
      alert: string;
      severity: 'low' | 'medium' | 'high';
      timestamp: string;
    }>;
    performanceMetrics: {
      avgResponseTime: number;
      errorRate: number;
      throughput: number;
    };
  }> {
    return this.apiClient.get<any>('/sessions/monitor');
  }

  async getSessionHealth(sessionId: string): Promise<{
    isHealthy: boolean;
    issues: Array<{
      type: string;
      severity: 'low' | 'medium' | 'high';
      description: string;
      recommendation?: string;
    }>;
    performance: {
      responseTime: number;
      errorCount: number;
      throughput: number;
    };
    lastCheck: string;
  }> {
    return this.apiClient.get<any>(`/sessions/${sessionId}/health`);
  }
}
