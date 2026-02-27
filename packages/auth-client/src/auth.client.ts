import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import {
  AuthClientConfig,
  AuthUser,
  ChangePasswordPayload,
  ChangePasswordResponse,
  ForgotPasswordPayload,
  ForgotPasswordResponse,
  LoginPayload,
  LoginResponse,
  LogoutResponse,
  MeResponse,
  RefreshTokenPayload,
  RefreshTokenResponse,
  RegisterPayload,
  RegisterResponse,
  ResetPasswordPayload,
  ResetPasswordResponse,
  SessionValidationResult,
  UpdateProfilePayload,
  UpdateProfileResponse,
  VerifyEmailPayload,
  VerifyEmailResponse,
  AssignRolePayload,
  RolePermission,
} from "./auth.types";
import {
  AuthClientError,
  EmailAlreadyExistsError,
  ForbiddenError,
  InvalidCredentialsError,
  NetworkError,
  RefreshTokenExpiredError,
  ServiceUnavailableError,
  SessionExpiredError,
  TokenExpiredError,
  TokenInvalidError,
  UnauthorizedError,
  AccountNotVerifiedError,
  AccountSuspendedError,
} from "./auth.errors";

const AUTH_ERROR_CODE_MAP: Record<string, new (message?: string) => AuthClientError> = {
  INVALID_CREDENTIALS: InvalidCredentialsError,
  TOKEN_EXPIRED: TokenExpiredError,
  TOKEN_INVALID: TokenInvalidError,
  REFRESH_TOKEN_EXPIRED: RefreshTokenExpiredError,
  SESSION_EXPIRED: SessionExpiredError,
  ACCOUNT_NOT_VERIFIED: AccountNotVerifiedError,
  ACCOUNT_SUSPENDED: AccountSuspendedError,
  EMAIL_ALREADY_EXISTS: EmailAlreadyExistsError,
};

export class AuthClient {
  private readonly http: AxiosInstance;
  private readonly config: Required<
    Pick<AuthClientConfig, "baseUrl" | "timeout" | "withCredentials">
  > &
    Omit<AuthClientConfig, "baseUrl" | "timeout" | "withCredentials">;
  private isRefreshing = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor(config: AuthClientConfig) {
    this.config = {
      timeout: 10000,
      withCredentials: true,
      ...config,
    };

    this.http = axios.create({
      baseURL: `${config.baseUrl}/v1/auth`,
      timeout: this.config.timeout,
      withCredentials: this.config.withCredentials,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    this.setupRequestInterceptor();
    this.setupResponseInterceptor();
  }

  private setupRequestInterceptor(): void {
    this.http.interceptors.request.use(
      (reqConfig: InternalAxiosRequestConfig) => {
        if (this.config.getAccessToken) {
          const token = this.config.getAccessToken();
          if (token) {
            reqConfig.headers.Authorization = `Bearer ${token}`;
          }
        }
        return reqConfig;
      },
      (error: unknown) => Promise.reject(error)
    );
  }

  private setupResponseInterceptor(): void {
    this.http.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: unknown) => {
        if (!axios.isAxiosError(error)) {
          return Promise.reject(new NetworkError());
        }

        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        if (!error.response) {
          return Promise.reject(new NetworkError());
        }

        if (error.response.status === 503) {
          return Promise.reject(new ServiceUnavailableError());
        }

        if (
          error.response.status === 401 &&
          !originalRequest._retry &&
          this.config.getRefreshToken &&
          this.config.setTokens
        ) {
          const refreshToken = this.config.getRefreshToken();

          if (!refreshToken) {
            this.handleUnauthorized();
            return Promise.reject(new UnauthorizedError());
          }

          if (this.isRefreshing) {
            return new Promise<AxiosResponse>((resolve) => {
              this.refreshSubscribers.push((newToken: string) => {
                if (originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${newToken}`;
                }
                resolve(this.http.request(originalRequest));
              });
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const response = await this.refreshToken({ refreshToken });
            const { tokens } = response;

            if (this.config.setTokens) {
              this.config.setTokens(tokens);
            }
            if (this.config.onTokenRefresh) {
              this.config.onTokenRefresh(tokens);
            }

            this.refreshSubscribers.forEach((cb) => cb(tokens.accessToken));
            this.refreshSubscribers = [];

            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
            }

            return this.http.request(originalRequest);
          } catch (refreshError) {
            this.refreshSubscribers = [];
            this.handleUnauthorized();
            return Promise.reject(new RefreshTokenExpiredError());
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(this.mapAxiosError(error));
      }
    );
  }

  private handleUnauthorized(): void {
    if (this.config.clearTokens) {
      this.config.clearTokens();
    }
    if (this.config.onUnauthorized) {
      this.config.onUnauthorized();
    }
  }

  private mapAxiosError(error: unknown): AuthClientError {
    if (!axios.isAxiosError(error) || !error.response) {
      return new NetworkError();
    }

    const { status, data } = error.response;
    const code: string = data?.code ?? "";
    const message: string = data?.message ?? error?.message ?? "Authentication error";

    if (code in AUTH_ERROR_CODE_MAP) {
      const ErrorClass = AUTH_ERROR_CODE_MAP[code as keyof typeof AUTH_ERROR_CODE_MAP];
      return new ErrorClass!(message);
    }

    if (status === 401) return new UnauthorizedError(message);
    if (status === 403) return new ForbiddenError(message);
    if (status === 503) return new ServiceUnavailableError(message);

    return new AuthClientError(message, status, code || "UNKNOWN_ERROR", data?.details);
  }

  async register(payload: RegisterPayload): Promise<RegisterResponse> {
    const { data } = await this.http.post<RegisterResponse>("/register", payload);
    return data;
  }

  async login(payload: LoginPayload): Promise<LoginResponse> {
    const { data } = await this.http.post<LoginResponse>("/login", payload);
    if (data.tokens && this.config.setTokens) {
      this.config.setTokens(data.tokens);
    }
    return data;
  }

  async logout(): Promise<LogoutResponse> {
    const { data } = await this.http.post<LogoutResponse>("/logout");
    if (this.config.clearTokens) {
      this.config.clearTokens();
    }
    return data;
  }

  async me(): Promise<MeResponse> {
    const { data } = await this.http.get<MeResponse>("/me");
    return data;
  }

  async refreshToken(payload: RefreshTokenPayload): Promise<RefreshTokenResponse> {
    const { data } = await this.http.post<RefreshTokenResponse>("/refresh", payload);
    return data;
  }

  async forgotPassword(payload: ForgotPasswordPayload): Promise<ForgotPasswordResponse> {
    const { data } = await this.http.post<ForgotPasswordResponse>("/forgot-password", payload);
    return data;
  }

  async resetPassword(payload: ResetPasswordPayload): Promise<ResetPasswordResponse> {
    const { data } = await this.http.post<ResetPasswordResponse>("/reset-password", payload);
    return data;
  }

  async changePassword(payload: ChangePasswordPayload): Promise<ChangePasswordResponse> {
    const { data } = await this.http.post<ChangePasswordResponse>("/change-password", payload);
    return data;
  }

  async verifyEmail(payload: VerifyEmailPayload): Promise<VerifyEmailResponse> {
    const { data } = await this.http.post<VerifyEmailResponse>("/verify-email", payload);
    return data;
  }

  async resendVerificationEmail(): Promise<{ message: string }> {
    const { data } = await this.http.post<{ message: string }>("/resend-verification");
    return data;
  }

  async updateProfile(payload: UpdateProfilePayload): Promise<UpdateProfileResponse> {
    const { data } = await this.http.patch<UpdateProfileResponse>("/profile", payload);
    return data;
  }

  async validateSession(token: string): Promise<SessionValidationResult> {
    const { data } = await this.http.post<SessionValidationResult>("/validate-session", { token });
    return data;
  }

  async getUserById(userId: string): Promise<AuthUser> {
    const { data } = await this.http.get<AuthUser>(`/users/${userId}`);
    return data;
  }

  async getAllRoles(): Promise<RolePermission[]> {
    const { data } = await this.http.get<RolePermission[]>("/roles");
    return data;
  }

  async assignRole(payload: AssignRolePayload): Promise<{ message: string }> {
    const { data } = await this.http.post<{ message: string }>("/roles/assign", payload);
    return data;
  }

  async revokeRole(payload: AssignRolePayload): Promise<{ message: string }> {
    const { data } = await this.http.post<{ message: string }>("/roles/revoke", payload);
    return data;
  }

  async revokeAllSessions(): Promise<{ message: string }> {
    const { data } = await this.http.post<{ message: string }>("/sessions/revoke-all");
    return data;
  }

  async revokeSession(sessionId: string): Promise<{ message: string }> {
    const { data } = await this.http.delete<{ message: string }>(`/sessions/${sessionId}`);
    return data;
  }

  async listSessions(): Promise<{ sessions: import("./auth.types").AuthSession[] }> {
    const { data } = await this.http.get("/sessions");
    return data;
  }
}