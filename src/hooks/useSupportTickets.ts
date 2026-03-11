import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supportService } from "@/services/supportService";
import { fetchWithAuth, buildQueryString } from "@/lib/fetch-client";

import type { CreateSupportTicketPayload } from "@/types/customer.types";

export function useSupportTickets(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["support-tickets", filters],
    queryFn: () => fetchWithAuth(`/api/support-tickets${buildQueryString(filters || {})}`),
  });
}

export function useSupportTicket(id: string) {
  return useQuery({
    queryKey: ["support-tickets", id],
    queryFn: () => fetchWithAuth(`/api/support-tickets/${id}`),
    enabled: !!id,
  });
}

export function useCreateSupportTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSupportTicketPayload) => supportService.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
    },
  });
}

export function useUpdateSupportTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateSupportTicketPayload> }) =>
      supportService.update(id, payload),
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      void queryClient.invalidateQueries({ queryKey: ["support-tickets", id] });
    },
  });
}

export function useDeleteSupportTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => supportService.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
    },
  });
}