import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { orderService } from "@/services/orderService";
import { fetchWithAuth, buildQueryString } from "@/lib/fetch-client";

import type { UpdateOrderStatusPayload } from "@/types/order.types";

export function useOrders(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["orders", filters],
    queryFn: () => fetchWithAuth(`/api/orders${buildQueryString(filters)}`),
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ["orders", id],
    queryFn: () => fetchWithAuth(`/api/orders/${id}`),
    enabled: !!id,
  });
}

export function useUpdateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateOrderStatusPayload }) =>
      orderService.update(id, payload),
    onSuccess: (_data: unknown, { id }: { id: string; payload: UpdateOrderStatusPayload }) => {
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({ queryKey: ["orders", id] });
    },
  });
}

export function useDeleteOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => orderService.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}