import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { refundService } from "@/services/refundService";

import type { CreateRefundPayload } from "@/types/order.types";

export function useRefunds(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["refunds", filters],
    queryFn: () => refundService.getAll(filters),
  });
}

export function useRefund(id: string) {
  return useQuery({
    queryKey: ["refunds", id],
    queryFn: () => refundService.getById(id),
    enabled: !!id,
  });
}

export function useCreateRefund() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateRefundPayload) => refundService.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["refunds"] });
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
  });
}