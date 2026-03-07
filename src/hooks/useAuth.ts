import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import type { User } from "@/types/api.types";

async function fetchMe(): Promise<{ user: User }> {
  const res = await fetch("/api/auth/me");
  if (!res.ok) throw new Error("Unauthenticated");
  return res.json();
}

interface LoginPayload {
  email: string;
  password: string;
}

async function login(payload: LoginPayload): Promise<{ user: User; token: string }> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Invalid credentials");
  return res.json();
}

async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
}

export function useAuth() {
  const queryClient = useQueryClient();

  const meQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: fetchMe,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      queryClient.setQueryData(["auth", "me"], { user: data.user });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear();
    },
  });

  return {
    user: meQuery.data?.user ?? null,
    isAuthenticated: !!meQuery.data?.user,
    isLoading: meQuery.isLoading,
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}