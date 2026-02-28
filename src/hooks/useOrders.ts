import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orderService } from "@/services/orderService";
import type { OrderFilters, UpdateOrderPayload } from "@/types/order.types";

export function useOrders(filters?: OrderFilters) {
  return useQuery({
    queryKey: ["orders", filters],
    queryFn: () => orderService.getAll(filters),
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ["orders", id],
    queryFn: () => orderService.getById(id),
    enabled: !!id,
  });
}

export function useUpdateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateOrderPayload }) =>
      orderService.update(id, payload),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders", id] });
    },
  });
}

export function useDeleteOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => orderService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}