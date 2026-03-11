import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios"

import { API_BASE_URL, API_TIMEOUT_MS } from "./constants"

export class ApiError extends Error {
  public readonly status: number;
  public readonly code?: string;
  public readonly details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeToTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshSuccess(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

export const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,
});

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { getAccessToken } = getAuthStoreLazy();
    const token = getAccessToken();

    console.log('🔑 Axios request:', {
      url: config.url,
      baseURL: config.baseURL,
      method: config.method,
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'none'
    });

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    console.error('❌ Axios request interceptor error:', error);
    return Promise.reject(error);
  },
);

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,

  async (error: AxiosError<{ message?: string; code?: string; details?: unknown }>) => {
    console.error('❌ Axios response error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      baseURL: error.config?.baseURL
    });

    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise<AxiosResponse>((resolve) => {
          subscribeToTokenRefresh((newToken) => {
            if (originalRequest.headers) {
              (originalRequest.headers as Record<string, string>).Authorization =
                `Bearer ${newToken}`;
            }
            resolve(axiosInstance(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { refreshAccessToken } = getAuthStoreLazy();
        if (!refreshAccessToken) {
          throw new Error("Refresh token flow is not configured");
        }
        const newToken = await refreshAccessToken();
        onRefreshSuccess(newToken);
        isRefreshing = false;

        if (originalRequest.headers) {
          (originalRequest.headers as Record<string, string>).Authorization =
            `Bearer ${newToken}`;
        }
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        refreshSubscribers = [];

        const { logout } = getAuthStoreLazy();
        logout();

        return Promise.reject(buildApiError(error));
      }
    }

    return Promise.reject(buildApiError(error));
  },
);

function buildApiError(
  error: AxiosError<{ message?: string; code?: string; details?: unknown }>,
): ApiError {
  const status = error.response?.status ?? 0;
  const data = error.response?.data;
  const serverMessage = data?.message;
  const code = data?.code;
  const details = data?.details;

  const message =
    serverMessage ??
    HTTP_STATUS_MESSAGES[status] ??
    error.message ??
    "An unexpected error occurred.";

  return new ApiError(message, status, code, details);
}

const HTTP_STATUS_MESSAGES: Record<number, string> = {
  400: "The request was invalid. Please check your input.",
  401: "Your session has expired. Please log in again.",
  403: "You do not have permission to perform this action.",
  404: "The requested resource was not found.",
  409: "A conflict occurred. The resource may already exist.",
  422: "Validation failed. Please review the highlighted fields.",
  429: "Too many requests. Please slow down and try again.",
  500: "A server error occurred. Please try again later.",
  502: "The server is temporarily unavailable. Please try again.",
  503: "Service unavailable. Maintenance may be in progress.",
};

type AuthStoreLazyApi = {
  getAccessToken: () => string | null;
  refreshAccessToken?: () => Promise<string>;
  logout: () => void;
};

let authStoreModule: AuthStoreLazyApi | null = null;

function getAuthStoreLazy(): AuthStoreLazyApi {
  if (authStoreModule) return authStoreModule;

  const { useAuthStore } = require("@/stores/useAuthStore") as {
    useAuthStore: {
      getState: () => {
        accessToken?: string | null;
        clearUser: () => void;
      };
    };
  };

  authStoreModule = {
    getAccessToken: () => {
      const state = useAuthStore.getState();
      return state.accessToken ?? null;
    },
    logout: () => {
      const state = useAuthStore.getState();
      state.clearUser();
    },
  };

  return authStoreModule;
}

export default axiosInstance;