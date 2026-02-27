import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { logger } from '../utils/logger';
import { config } from '../config';

interface AuthServiceConfig {
  baseURL: string;
  timeout: number;
  retries: number;
}

interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface RefreshTokenRequest {
  refreshToken: string;
}

interface ResetPasswordRequest {
  email: string;
}

interface ConfirmResetPasswordRequest {
  token: string;
  newPassword: string;
}

interface ChangePasswordRequest {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

interface UpdateProfileRequest {
  userId: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  postcode?: string;
}

interface AuthResponse {
  success: boolean;
  data?: any;
  error?: any;
}

class AuthClient {
  private client: AxiosInstance;
  private readonly authConfig: AuthServiceConfig;

  constructor() {
    // ── Fix: use the correct config shape exposed by your config module ──
    const services = config.services as Record<string, any>;

    // Resolve baseURL — try common keys that might hold the auth service URL
    const baseURL: string =
      services?.auth?.url ??
      services?.authentication?.url ??
      services?.authService?.url ??       // kept as final fallback
      (config as any).authServiceUrl ??
      '';

    // Resolve timeout — fall back to the top-level timeouts map if present
    const timeout: number =
      services?.auth?.timeout ??
      services?.authentication?.timeout ??
      services?.authService?.timeout ??
      (config as any).timeouts?.default ??
      (config as any).timeouts?.auth ??
      10_000;

    this.authConfig = {
      baseURL,
      timeout,
      retries: 3,
    };

    if (!baseURL) {
      logger.warn('AuthClient: baseURL is empty — check your config.services shape');
    }

    this.client = axios.create({
      baseURL: this.authConfig.baseURL,
      timeout: this.authConfig.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.client.interceptors.request.use(
      (reqConfig) => {
        const requestId = (reqConfig as any).requestId;
        if (requestId) {
          reqConfig.headers['X-Request-ID'] = requestId;
        }

        logger.debug('Auth service request', {
          method: reqConfig.method?.toUpperCase(),
          url: reqConfig.url,
          requestId,
        });

        return reqConfig;
      },
      (error) => {
        logger.error('Auth service request error', { error: error.message });
        return Promise.reject(error);
      },
    );

    this.client.interceptors.response.use(
      (response) => {
        logger.debug('Auth service response', {
          status: response.status,
          url: response.config.url,
          requestId: response.config.headers['X-Request-ID'],
        });
        return response;
      },
      async (error) => {
        // Renamed local variable to avoid shadowing the outer `config` import
        const retryConfig = error.config as AxiosRequestConfig & { _retry?: number };

        if (!retryConfig._retry) {
          retryConfig._retry = 0;
        }

        if (retryConfig._retry < this.authConfig.retries && this.shouldRetry(error)) {
          retryConfig._retry += 1;

          logger.warn('Retrying auth service request', {
            attempt: retryConfig._retry,
            maxRetries: this.authConfig.retries,
            url: retryConfig.url,
          });

          await this.delay(retryConfig._retry * 1000);
          return this.client(retryConfig);
        }

        logger.error('Auth service error', {
          status: error.response?.status,
          message: error.message,
          url: retryConfig.url,
          requestId: retryConfig.headers?.['X-Request-ID'],
        });

        return Promise.reject(error);
      },
    );
  }

  private shouldRetry(error: any): boolean {
    if (!error.response) return true;
    const status = error.response.status;
    return status >= 500 || status === 429 || status === 408;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async makeRequest<T>(
    method: string,
    url: string,
    data?: any,
    requestId?: string,
  ): Promise<AuthResponse> {
    try {
      const response: AxiosResponse<T> = await this.client.request({
        method,
        url,
        data,
        ...({ requestId } as any),
      });

      return { success: true, data: response.data };
    } catch (error: any) {
      if (error.response) {
        return {
          success: false,
          error: {
            status: error.response.status,
            message: error.response.data?.message || error.message,
            code: error.response.data?.code,
            details: error.response.data?.details,
          },
        };
      }

      return {
        success: false,
        error: {
          status: 503,
          message: 'Auth service unavailable',
          code: 'SERVICE_UNAVAILABLE',
        },
      };
    }
  }

  async register(data: RegisterRequest, requestId?: string): Promise<AuthResponse> {
    return this.makeRequest('POST', '/api/v1/auth/register', data, requestId);
  }

  async login(data: LoginRequest, requestId?: string): Promise<AuthResponse> {
    return this.makeRequest('POST', '/api/v1/auth/login', data, requestId);
  }

  async logout(userId: string, requestId?: string): Promise<AuthResponse> {
    return this.makeRequest('POST', '/api/v1/auth/logout', { userId }, requestId);
  }

  async refreshToken(data: RefreshTokenRequest, requestId?: string): Promise<AuthResponse> {
    return this.makeRequest('POST', '/api/v1/auth/refresh', data, requestId);
  }

  async verifyToken(token: string, requestId?: string): Promise<AuthResponse> {
    return this.makeRequest('POST', '/api/v1/auth/verify', { token }, requestId);
  }

  async getUserById(userId: string, requestId?: string): Promise<AuthResponse> {
    return this.makeRequest('GET', `/api/v1/users/${userId}`, undefined, requestId);
  }

  async getUserByEmail(email: string, requestId?: string): Promise<AuthResponse> {
    return this.makeRequest('GET', `/api/v1/users/email/${email}`, undefined, requestId);
  }

  async updateProfile(data: UpdateProfileRequest, requestId?: string): Promise<AuthResponse> {
    const { userId, ...updateData } = data;
    return this.makeRequest('PATCH', `/api/v1/users/${userId}`, updateData, requestId);
  }

  async changePassword(data: ChangePasswordRequest, requestId?: string): Promise<AuthResponse> {
    const { userId, ...passwordData } = data;
    return this.makeRequest(
      'POST',
      `/api/v1/users/${userId}/change-password`,
      passwordData,
      requestId,
    );
  }

  async requestPasswordReset(data: ResetPasswordRequest, requestId?: string): Promise<AuthResponse> {
    return this.makeRequest('POST', '/api/v1/auth/password-reset/request', data, requestId);
  }

  async confirmPasswordReset(
    data: ConfirmResetPasswordRequest,
    requestId?: string,
  ): Promise<AuthResponse> {
    return this.makeRequest('POST', '/api/v1/auth/password-reset/confirm', data, requestId);
  }

  async verifyEmail(token: string, requestId?: string): Promise<AuthResponse> {
    return this.makeRequest('POST', '/api/v1/auth/verify-email', { token }, requestId);
  }

  async resendVerificationEmail(email: string, requestId?: string): Promise<AuthResponse> {
    return this.makeRequest('POST', '/api/v1/auth/resend-verification', { email }, requestId);
  }

  async getSessions(userId: string, requestId?: string): Promise<AuthResponse> {
    return this.makeRequest('GET', `/api/v1/users/${userId}/sessions`, undefined, requestId);
  }

  async revokeSession(
    userId: string,
    sessionId: string,
    requestId?: string,
  ): Promise<AuthResponse> {
    return this.makeRequest(
      'DELETE',
      `/api/v1/users/${userId}/sessions/${sessionId}`,
      undefined,
      requestId,
    );
  }

  async revokeAllSessions(userId: string, requestId?: string): Promise<AuthResponse> {
    return this.makeRequest(
      'DELETE',
      `/api/v1/users/${userId}/sessions`,
      undefined,
      requestId,
    );
  }

  async deleteAccount(userId: string, password: string, requestId?: string): Promise<AuthResponse> {
    return this.makeRequest('DELETE', `/api/v1/users/${userId}`, { password }, requestId);
  }

  async checkEmailAvailability(email: string, requestId?: string): Promise<AuthResponse> {
    return this.makeRequest('POST', '/api/v1/auth/check-email', { email }, requestId);
  }

  async validateSession(sessionId: string, requestId?: string): Promise<AuthResponse> {
    return this.makeRequest('POST', '/api/v1/auth/validate-session', { sessionId }, requestId);
  }

  async getUserPermissions(userId: string, requestId?: string): Promise<AuthResponse> {
    return this.makeRequest(
      'GET',
      `/api/v1/users/${userId}/permissions`,
      undefined,
      requestId,
    );
  }

  async assignRole(userId: string, roleId: string, requestId?: string): Promise<AuthResponse> {
    return this.makeRequest('POST', `/api/v1/users/${userId}/roles`, { roleId }, requestId);
  }

  async removeRole(userId: string, roleId: string, requestId?: string): Promise<AuthResponse> {
    return this.makeRequest(
      'DELETE',
      `/api/v1/users/${userId}/roles/${roleId}`,
      undefined,
      requestId,
    );
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch (error) {
      logger.error('Auth service health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }
}

export const authClient = new AuthClient();