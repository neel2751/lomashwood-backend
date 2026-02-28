import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supportService } from "@/services/supportService";
import type { SupportFilters, UpdateSupportPayload } from "@/types/customer.types";

export function useSupportTickets(filters?: SupportFilters) {
  return useQuery({
    queryKey: ["support", filters],
    queryFn: () => supportService.getAll(filters),
  });
}

export function useSupportTicket(id: string) {
  return useQuery({
    queryKey: ["support", id],
    queryFn: () => supportService.getById(id),
    enabled: !!id,
  });
}

export function useUpdateSupportTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateSupportPayload }) =>
      supportService.update(id, payload),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["support"] });
      queryClient.invalidateQueries({ queryKey: ["support", id] });
    },
  });
}

export function useDeleteSupportTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => supportService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support"] });
    },
  });
}