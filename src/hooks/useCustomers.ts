import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { customerService } from "@/services/customerService";
import { fetchWithAuth, buildQueryString } from "@/lib/fetch-client";

import type { CustomerFilterParams } from "@/types/customer.types";

export function useCustomers(filters?: CustomerFilterParams) {
  return useQuery({
    queryKey: ["customers", filters],
    queryFn: () => fetchWithAuth(`/api/customers${buildQueryString(filters as Record<string, unknown>)}`),
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ["customers", id],
    queryFn: () => fetchWithAuth(`/api/customers/${id}`),
    enabled: !!id,
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      customerService.update(id, payload),
    onSuccess: (_data: unknown, { id }: { id: string; payload: Record<string, unknown> }) => {
      void queryClient.invalidateQueries({ queryKey: ["customers"] });
      void queryClient.invalidateQueries({ queryKey: ["customers", id] });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => customerService.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}