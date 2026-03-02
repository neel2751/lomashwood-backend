import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  roleId?: string;
  roleName?: string;
  status: string;
  lastLoginAt?: string;
  createdAt: string;
  activeSessionCount?: number;
};

interface AuthState {
  user: AdminUser | null;
  
  accessToken: string | null;
  isAuthenticated: boolean;
  setUser: (user: AdminUser) => void;
  setAccessToken: (token: string) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      setUser: (user) =>
        set({ user, isAuthenticated: true }),

      setAccessToken: (accessToken) =>
        set({ accessToken }),

      clearUser: () =>
        set({ user: null, accessToken: null, isAuthenticated: false }),
    }),
    {
      name: "auth-store", // cspell:disable-line
      partialize: (state) => ({ // cspell:disable-line
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);