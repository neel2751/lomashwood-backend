import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { productService } from "@/services/productService";
import type { CreateProductPayload, UpdateProductPayload } from "@/types/product.types";

export function useProducts(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["products", filters],
    queryFn: () => productService.getAll(filters),
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ["products", id],
    queryFn: () => productService.getById(id),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateProductPayload) => productService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateProductPayload }) =>
      productService.update(id, payload),
    onSuccess: (_data: unknown, { id }: { id: string; payload: Record<string, unknown> }) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products", id] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => productService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}