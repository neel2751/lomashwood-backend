import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customerService } from "@/services/customerService";
import type { CustomerFilters, UpdateCustomerPayload } from "@/types/customer.types";

export function useCustomers(filters?: CustomerFilters) {
  return useQuery({
    queryKey: ["customers", filters],
    queryFn: () => customerService.getAll(filters),
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ["customers", id],
    queryFn: () => customerService.getById(id),
    enabled: !!id,
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCustomerPayload }) =>
      customerService.update(id, payload),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customers", id] });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => customerService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}