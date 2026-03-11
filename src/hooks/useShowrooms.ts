import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { buildQueryString, fetchWithAuth } from "@/lib/fetch-client";
import type { CreateShowroomPayload, UpdateShowroomPayload } from "@/types/showroom.types";

export function useShowrooms(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["showrooms", filters],
    queryFn: () => fetchWithAuth(`/api/showrooms${buildQueryString(filters || {})}`),
  });
}

export function useShowroom(id: string) {
  return useQuery({
    queryKey: ["showrooms", id],
    queryFn: () => fetchWithAuth(`/api/showrooms/${id}`),
    enabled: !!id,
  });
}

export function useCreateShowroom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateShowroomPayload) =>
      fetchWithAuth("/api/showrooms", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["showrooms"] });
    },
  });
}

export function useUpdateShowroom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateShowroomPayload }) =>
      fetchWithAuth(`/api/showrooms/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ["showrooms"] });
      void queryClient.invalidateQueries({ queryKey: ["showrooms", id] });
    },
  });
}
