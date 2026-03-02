import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { funnelService } from "@/services/funnelService";
import type { CreateFunnelPayload } from "@/types/analytics.types";

export function useFunnels() {
  return useQuery({
    queryKey: ["funnels"],
    queryFn: () => funnelService.getAll(),
  });
}

export function useFunnel(id: string) {
  return useQuery({
    queryKey: ["funnels", id],
    queryFn: () => funnelService.getById(id),
    enabled: !!id,
  });
}

export function useCreateFunnel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateFunnelPayload) => funnelService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["funnels"] });
    },
  });
}

export function useUpdateFunnel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CreateFunnelPayload }) =>
      funnelService.update(id, payload),
    onSuccess: (_data, { id }) => {  // ← remove the manual type annotation entirely
      queryClient.invalidateQueries({ queryKey: ["funnels"] });
      queryClient.invalidateQueries({ queryKey: ["funnels", id] });
    },
  });
}


export function useDeleteFunnel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => funnelService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["funnels"] });
    },
  });
}