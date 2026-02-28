"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCurrentUser } from "@/hooks/useAuth";
import { PageLoader } from "@/components/shared/PageLoader";

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const { isAuthenticated, setUser } = useAuthStore();
  const { data, isLoading, isError } = useCurrentUser();

  useEffect(() => {
    if (isError || (!isLoading && !isAuthenticated)) {
      router.replace("/login");
    }
  }, [isError, isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (data?.user) {
      setUser(data.user);
    }
  }, [data, setUser]);

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}