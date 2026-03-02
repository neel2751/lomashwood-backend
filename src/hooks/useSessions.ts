import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type SessionFilters = {
  userId?: string;
  search?: string;
  activeOnly?: boolean;
  page?: number;
  pageSize?: number;
  id?: string;
};

const sessionService = {
  getAll: async (_filters?: Record<string, unknown>) => [],
  getById: async (_id: string) => null,
  revoke: async (_id: string) => null,
  revokeAll: async (_userId?: string) => null,
};

export function useSessions(filters?: SessionFilters) {
  return useQuery({
    queryKey: ["sessions", filters],
    queryFn: () => sessionService.getAll(filters),
  });
}

export function useSession(id: string) {
  return useQuery({
    queryKey: ["sessions", id],
    queryFn: () => sessionService.getById(id),
    enabled: !!id,
  });
}

export function useRevokeSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => sessionService.revoke(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}

export function useRevokeAllSessions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId?: string) => sessionService.revokeAll(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}