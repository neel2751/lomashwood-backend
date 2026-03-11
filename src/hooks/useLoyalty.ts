import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { loyaltyService } from "@/services/loyaltyService";
import { fetchWithAuth, buildQueryString } from "@/lib/fetch-client";

import type { AdjustLoyaltyPointsPayload } from "@/types/customer.types";

export function useLoyalty(customerId?: string) {
  return useQuery({
    queryKey: ["loyalty", customerId],
    queryFn: () => fetchWithAuth(`/api/loyalty${buildQueryString(customerId ? { customerId } : {})}`),
  });
}

export function useLoyaltyItem(id: string) {
  return useQuery({
    queryKey: ["loyalty", id],
    queryFn: () => fetchWithAuth(`/api/loyalty/${id}`),
    enabled: !!id,
  });
}

export function useAdjustLoyalty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AdjustLoyaltyPointsPayload }) =>
      loyaltyService.adjustPoints(id, payload),
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ["loyalty"] });
      void queryClient.invalidateQueries({ queryKey: ["loyalty", id] });
      void queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}