import { apiClient } from "@/lib/api-client";
import axios from "@/lib/axios";

type AdminUser = {
  id: string;
  email: string;
  name?: string;
  roleId?: string;
  createdAt?: string;
  updatedAt?: string;
};

type Role = {
  id: string;
  name: string;
  permissions?: string[];
  createdAt?: string;
  updatedAt?: string;
};

export const authService = {
  login: (credentials: { email: string; password: string }) =>
    apiClient.auth.login(credentials),

  logout: () => apiClient.auth.logout(),

  refreshToken: (refreshToken: string) =>
    axios.post("/auth/refresh", { refreshToken }).then((r) => r.data),

  me: () => apiClient.auth.me(),

  getUsers: (params?: Record<string, unknown>) =>
    apiClient.users.getAll(params),

  getUserById: (id: string) =>
    apiClient.users.getById(id),

  createUser: (payload: Partial<AdminUser>) =>
    apiClient.users.create(payload),

  updateUser: (id: string, payload: Partial<AdminUser>) =>
    apiClient.users.update(id, payload),

  deleteUser: (id: string) =>
    apiClient.users.delete(id),

  getRoles: (params?: Record<string, unknown>) =>
    apiClient.roles.getAll(params),

  getRoleById: (id: string) =>
    apiClient.roles.getById(id),

  createRole: (payload: Partial<Role>) =>
    apiClient.roles.create(payload),

  updateRole: (id: string, payload: Partial<Role>) =>
    apiClient.roles.update(id, payload),

  deleteRole: (id: string) =>
    apiClient.roles.delete(id),

  getSessions: (params?: Record<string, unknown>) =>
    apiClient.sessions.getAll(params),

  getSessionById: (id: string) =>
    apiClient.sessions.getById(id),

  revokeSession: (id: string) =>
    apiClient.sessions.revoke(id),

  revokeAllSessions: (userId: string) =>
    apiClient.sessions.revokeAll(userId),
};