import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { refundService } from "@/services/refundService";
import type { CreateRefundPayload, RefundFilters } from "@/types/order.types";

export function useRefunds(filters?: RefundFilters) {
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
      queryClient.invalidateQueries({ queryKey: ["refunds"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
  });
}