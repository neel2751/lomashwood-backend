import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { loyaltyService } from "@/services/loyaltyService";
import type { AdjustLoyaltyPointsPayload } from "@/types/customer.types";

export function useLoyalty(customerId?: string) {
  return useQuery({
    queryKey: ["loyalty", customerId],
    queryFn: () => loyaltyService.getAll(customerId ? { customerId } : undefined),
  });
}

export function useLoyaltyItem(id: string) {
  return useQuery({
    queryKey: ["loyalty", id],
    queryFn: () => loyaltyService.getById(id),
    enabled: !!id,
  });
}

export function useAdjustLoyalty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AdjustLoyaltyPointsPayload }) =>
      loyaltyService.adjustPoints(id, payload),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["loyalty"] });
      queryClient.invalidateQueries({ queryKey: ["loyalty", id] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}