"use client";

import { useEffect } from "react";

import { useRouter } from "next/navigation";

import { useAuthStore } from "@/stores/useAuthStore";
import { useAuth } from "@/hooks/useAuth";
import { PageLoader } from "@/components/shared/PageLoader";
import type { AdminUser } from "@/stores/useAuthStore";

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const { isAuthenticated, setUser } = useAuthStore();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      setUser(user as unknown as AdminUser);
    }
  }, [user, setUser]);

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}