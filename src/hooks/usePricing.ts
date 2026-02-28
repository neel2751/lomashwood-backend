import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { pricingService } from "@/services/pricingService";
import type { CreatePricingPayload, UpdatePricingPayload } from "@/types/product.types";

export function usePricing(productId?: string) {
  return useQuery({
    queryKey: ["pricing", productId],
    queryFn: () => pricingService.getAll(productId),
  });
}

export function usePricingItem(id: string) {
  return useQuery({
    queryKey: ["pricing", id],
    queryFn: () => pricingService.getById(id),
    enabled: !!id,
  });
}

export function useCreatePricing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePricingPayload) => pricingService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricing"] });
    },
  });
}

export function useUpdatePricing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePricingPayload }) =>
      pricingService.update(id, payload),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["pricing"] });
      queryClient.invalidateQueries({ queryKey: ["pricing", id] });
    },
  });
}

export function useDeletePricing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => pricingService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricing"] });
    },
  });
}