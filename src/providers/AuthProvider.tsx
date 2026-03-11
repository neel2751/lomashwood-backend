"use client";

import { useEffect } from "react";

import { useRouter } from "next/navigation";

import { PageLoader } from "@/components/shared/PageLoader";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/stores/useAuthStore";

import type { AdminUser } from "@/stores/useAuthStore";

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const { isAuthenticated, setUser } = useAuthStore();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    if (user) {
      setUser(user as unknown as AdminUser);
    }
  }, [user, setUser]);

  if (isLoading) {
    return <PageLoader />;
  }

  if (!user && !isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}