import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AdminUser } from "@/types/auth.types";

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
      name: "lomash-auth",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);