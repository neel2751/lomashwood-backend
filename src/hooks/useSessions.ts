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
  getAll: (_filters?: Record<string, unknown>): Promise<never[]> => Promise.resolve([]),
  getById: (_id: string): Promise<null> => Promise.resolve(null),
  revoke: (_id: string): Promise<null> => Promise.resolve(null),
  revokeAll: (_userId?: string): Promise<null> => Promise.resolve(null),
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
      void queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}

export function useRevokeAllSessions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId?: string) => sessionService.revokeAll(userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}