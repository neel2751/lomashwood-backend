import { authClient } from "@/lib/api-client";
import type { AdminUser, Role, Session } from "@/lib/api-client";

export const authService = {
  login: (credentials: { email: string; password: string }) =>
    authClient.login(credentials),

  logout: () => authClient.logout(),

  refreshToken: (refreshToken: string) =>
    authClient.refreshToken(refreshToken),

  me: () => authClient.me(),

  getUsers: (params?: Record<string, unknown>) =>
    authClient.users.getAll(params),

  getUserById: (id: string) => authClient.users.getById(id),

  createUser: (payload: Partial<AdminUser>) =>
    authClient.users.create(payload),

  updateUser: (id: string, payload: Partial<AdminUser>) =>
    authClient.users.update(id, payload),

  deleteUser: (id: string) => authClient.users.remove(id),

  getRoles: (params?: Record<string, unknown>) =>
    authClient.roles.getAll(params),

  getRoleById: (id: string) => authClient.roles.getById(id),

  createRole: (payload: Partial<Role>) =>
    authClient.roles.create(payload),

  updateRole: (id: string, payload: Partial<Role>) =>
    authClient.roles.update(id, payload),

  deleteRole: (id: string) => authClient.roles.remove(id),

  getSessions: (params?: Record<string, unknown>) =>
    authClient.sessions.getAll(params),

  getSessionById: (id: string) => authClient.sessions.getById(id),

  revokeSession: (id: string) => authClient.sessions.remove(id),
};