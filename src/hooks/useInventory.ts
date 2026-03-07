import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { inventoryService } from "@/services/inventoryService";

export function useInventory(productId?: string) {
  return useQuery({
    queryKey: ["inventory", productId],
    queryFn: () => inventoryService.getAll(productId ? { productId } : undefined),
  });
}

export function useInventoryItem(id: string) {
  return useQuery({
    queryKey: ["inventory", id],
    queryFn: () => inventoryService.getById(id),
    enabled: !!id,
  });
}

export function useUpdateInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      inventoryService.update(id, payload),
    onSuccess: (_data: unknown, { id }: { id: string; payload: Record<string, unknown> }) => {
      void queryClient.invalidateQueries({ queryKey: ["inventory"] });
      void queryClient.invalidateQueries({ queryKey: ["inventory", id] });
    },
  });
}