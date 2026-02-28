import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { inventoryService } from "@/services/inventoryService";
import type { UpdateInventoryPayload } from "@/types/product.types";

export function useInventory(productId?: string) {
  return useQuery({
    queryKey: ["inventory", productId],
    queryFn: () => inventoryService.getAll(productId),
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
    mutationFn: ({ id, payload }: { id: string; payload: UpdateInventoryPayload }) =>
      inventoryService.update(id, payload),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["inventory", id] });
    },
  });
}